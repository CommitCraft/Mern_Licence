<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\LicenceException;
use PDO;
use PDOException;

final class DatabaseInstaller
{
    /**
     * Tests database connection using temporary PDO instance with strict timeouts.
     */
    public function testConnection(array $config): PDO
    {
        $host = trim($config['host'] ?? 'localhost');
        $port = (int)($config['port'] ?? 3306);
        $dbname = trim($config['database'] ?? $config['name'] ?? '');
        $user = trim($config['username'] ?? '');
        $pass = (string)($config['password'] ?? '');

        if ($host === '' || $dbname === '' || $user === '') {
            throw new LicenceException('Missing database connection parameters.', 'INVALID_DB_CONFIG', 400);
        }

        $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";

        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_TIMEOUT => 5
        ];

        try {
            return new PDO($dsn, $user, $pass, $options);
        } catch (PDOException $e) {
            // Never expose raw credentials or stack traces
            throw new LicenceException(
                'Database connection failed. Please verify database host, port, database name, and user credentials.',
                'DATABASE_CONNECTION_FAILED',
                400
            );
        }
    }

    /**
     * Executes SQL migrations in order and updates schema_migrations table.
     */
    public function runMigrations(PDO $pdo): void
    {
        $migrationFiles = [
            '001_create_licence_tables.sql' => __DIR__ . '/../../../database/migrations/001_create_licence_tables.sql',
            '002_create_system_user_and_setup_tables.sql' => __DIR__ . '/../../../database/migrations/002_create_system_user_and_setup_tables.sql'
        ];

        // Ensure schema_migrations exists
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS `schema_migrations` (
                `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                `migration` VARCHAR(255) NOT NULL,
                `batch` INT UNSIGNED NOT NULL DEFAULT 1,
                `executed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY `uk_schema_migrations` (`migration`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        $stmt = $pdo->query("SELECT migration FROM schema_migrations");
        $executed = $stmt->fetchAll(PDO::FETCH_COLUMN);

        $batch = 1;
        foreach ($migrationFiles as $name => $path) {
            if (in_array($name, $executed, true)) {
                continue;
            }

            if (!file_exists($path)) {
                throw new LicenceException("Migration file '{$name}' not found.", 'MIGRATION_FILE_MISSING', 500);
            }

            $sql = file_get_contents($path);
            if ($sql === false || trim($sql) === '') {
                continue;
            }

            try {
                $pdo->exec($sql);
                $ins = $pdo->prepare("INSERT INTO schema_migrations (migration, batch, executed_at) VALUES (:m, :b, NOW())");
                $ins->execute(['m' => $name, 'b' => $batch]);
            } catch (\Throwable $e) {
                throw new LicenceException("Migration failed on '{$name}': " . $e->getMessage(), 'MIGRATION_FAILED', 500);
            }
        }
    }

    /**
     * Creates default system roles (Super Administrator).
     */
    public function createDefaultRoles(PDO $pdo): int
    {
        $stmt = $pdo->prepare("SELECT id FROM roles WHERE slug = 'super-admin' LIMIT 1");
        $stmt->execute();
        $existing = $stmt->fetchColumn();

        if ($existing) {
            return (int)$existing;
        }

        $ins = $pdo->prepare("INSERT INTO roles (name, slug, description, created_at) VALUES ('Super Administrator', 'super-admin', 'Full system access and control', NOW())");
        $ins->execute();

        return (int)$pdo->lastInsertId();
    }

    /**
     * Creates the initial Super Administrator user using password_hash with Argon2id / Default fallback.
     */
    public function createAdministrator(PDO $pdo, array $adminData, int $roleId): int
    {
        $fullName = trim($adminData['fullName'] ?? 'System Administrator');
        $username = strtolower(trim($adminData['username'] ?? 'admin'));
        $email    = strtolower(trim($adminData['email'] ?? 'admin@example.com'));
        $password = (string)($adminData['password'] ?? '');

        if (strlen($password) < 12) {
            throw new LicenceException('Administrator password must be at least 12 characters long.', 'WEAK_PASSWORD', 400);
        }

        // Use Argon2id if available, fallback to PASSWORD_DEFAULT
        $algo = defined('PASSWORD_ARGON2ID') ? PASSWORD_ARGON2ID : PASSWORD_DEFAULT;
        $hash = password_hash($password, $algo);

        // Check if admin user already exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE username = :u OR email = :e LIMIT 1");
        $stmt->execute(['u' => $username, 'e' => $email]);
        $existingId = $stmt->fetchColumn();

        if ($existingId) {
            $upd = $pdo->prepare("UPDATE users SET full_name = :f, password_hash = :h, role_id = :r, status = 'ACTIVE', updated_at = NOW() WHERE id = :id");
            $upd->execute(['f' => $fullName, 'h' => $hash, 'r' => $roleId, 'id' => $existingId]);
            return (int)$existingId;
        }

        $ins = $pdo->prepare("
            INSERT INTO users (full_name, username, email, password_hash, status, role_id, must_change_password, created_at)
            VALUES (:f, :u, :e, :h, 'ACTIVE', :r, 0, NOW())
        ");
        $ins->execute([
            'f' => $fullName,
            'u' => $username,
            'e' => $email,
            'h' => $hash,
            'r' => $roleId
        ]);

        return (int)$pdo->lastInsertId();
    }

    /**
     * Saves company settings records to company_settings table.
     */
    public function createCompany(PDO $pdo, array $companyData): void
    {
        $settings = [
            'company_name'  => trim($companyData['name'] ?? ''),
            'company_code'  => trim($companyData['code'] ?? ''),
            'company_email' => trim($companyData['email'] ?? ''),
            'timezone'      => trim($companyData['timezone'] ?? 'Asia/Kolkata')
        ];

        $stmt = $pdo->prepare("
            INSERT INTO company_settings (setting_key, setting_value, created_at)
            VALUES (:k, :v, NOW())
            ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()
        ");

        foreach ($settings as $key => $val) {
            $stmt->execute(['k' => $key, 'v' => $val]);
        }
    }
}
