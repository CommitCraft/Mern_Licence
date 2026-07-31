<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Exceptions\LicenceException;
use App\Helpers\ApiResponse;
use App\Helpers\Validator;
use App\Security\InstallerToken;
use App\Security\MachineFingerprint;
use App\Services\DatabaseInstaller;
use App\Services\EnvironmentWriter;
use App\Services\SetupStatusService;

final class SetupController
{
    private SetupStatusService $statusService;
    private InstallerToken $tokenSecurity;
    private EnvironmentWriter $envWriter;
    private DatabaseInstaller $dbInstaller;

    public function __construct()
    {
        $this->statusService = new SetupStatusService();
        $this->tokenSecurity = new InstallerToken();
        $this->envWriter     = new EnvironmentWriter();
        $this->dbInstaller   = new DatabaseInstaller();
    }

    /**
     * GET /api/setup/status
     */
    public function getStatus(): void
    {
        $complete = $this->statusService->isSetupComplete();
        ApiResponse::success([
            'setupRequired' => !$complete,
            'currentStep'   => $complete ? 'completed' : 'installer-token'
        ]);
    }

    /**
     * POST /api/setup/verify-token
     */
    public function verifyToken(): void
    {
        $this->statusService->requireSetupIncomplete();

        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        Validator::requireFields($input, ['token']);

        $token = trim($input['token']);
        $isValid = $this->tokenSecurity->validate($token);

        if (!$isValid) {
            ApiResponse::error('Invalid installer token provided.', 'INVALID_INSTALLER_TOKEN', 403);
            return;
        }

        // Create short-lived setup session cookie or session flag
        if (session_status() !== PHP_SESSION_ACTIVE) {
            @session_start();
        }
        $_SESSION['SETUP_AUTHORIZED'] = true;
        $_SESSION['SETUP_AUTH_TIME']  = time();

        ApiResponse::success([
            'tokenVerified' => true,
            'sessionExpiresIn' => 1800
        ], 'Installer token verified successfully.');
    }

    /**
     * POST /api/setup/test-database
     */
    public function testDatabase(): void
    {
        $this->statusService->requireSetupIncomplete();
        $this->verifySetupSession();

        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        Validator::requireFields($input, ['host', 'database', 'username']);

        try {
            $pdo = $this->dbInstaller->testConnection($input);
            ApiResponse::success([], 'Database connection established successfully.');
        } catch (LicenceException $e) {
            ApiResponse::error($e->getMessage(), $e->getErrorCode(), 400);
        }
    }

    /**
     * POST /api/setup/test-licence-server
     */
    public function testLicenceServer(): void
    {
        $this->statusService->requireSetupIncomplete();
        $this->verifySetupSession();

        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $url = trim($input['serverUrl'] ?? 'local');

        if ($url === 'local' || str_contains($url, 'localhost') || str_contains($url, '127.0.0.1')) {
            ApiResponse::success(['connected' => true], 'Local licence engine ready.');
            return;
        }

        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            ApiResponse::error('Invalid licence server URL format.', 'INVALID_URL', 400);
            return;
        }

        // Test HTTPS connectivity
        $ch = curl_init(rtrim($url, '/') . '/health');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 5,
            CURLOPT_CONNECTTIMEOUT => 3
        ]);
        $res = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($res !== false || $code < 500) {
            ApiResponse::success(['connected' => true], 'Licence server reachable.');
        } else {
            ApiResponse::error('Unable to reach central licence server.', 'LICENCE_SERVER_UNREACHABLE', 400);
        }
    }

    /**
     * POST /api/setup/install - Atomic End-to-End Installation Runner
     */
    public function install(): void
    {
        $this->statusService->requireSetupIncomplete();
        $this->verifySetupSession();

        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        // 1. Validate complete payload structure
        $dbConfig    = $input['database'] ?? [];
        $appConfig   = $input['application'] ?? [];
        $compConfig  = $input['company'] ?? [];
        $licConfig   = $input['licence'] ?? [];
        $adminConfig = $input['administrator'] ?? [];

        Validator::requireFields($dbConfig, ['host', 'name', 'username']);
        Validator::requireFields($appConfig, ['name', 'url', 'timezone']);
        Validator::requireFields($compConfig, ['name', 'code', 'email']);
        Validator::requireFields($adminConfig, ['fullName', 'username', 'email', 'password', 'confirmPassword']);

        if ($adminConfig['password'] !== $adminConfig['confirmPassword']) {
            ApiResponse::error('Administrator password and confirmation do not match.', 'PASSWORD_MISMATCH', 400);
            return;
        }

        // 2. Validate environment path writable
        $this->envWriter->validateWritablePath();

        // 3. Test and acquire PDO database connection
        $pdo = $this->dbInstaller->testConnection($dbConfig);

        // 4. Generate Application Secret (APP_KEY)
        $appKey = 'base64:' . base64_encode(random_bytes(32));

        $installationId = MachineFingerprint::getInstallationId();

        // Build .env configuration array
        $envConfig = [
            'APP_ENV'                           => $appConfig['environment'] ?? 'production',
            'APP_NAME'                          => $appConfig['name'],
            'APP_URL'                           => $appConfig['url'],
            'APP_TIMEZONE'                      => $appConfig['timezone'],
            'APP_KEY'                           => $appKey,
            'DB_HOST'                           => $dbConfig['host'],
            'DB_PORT'                           => $dbConfig['port'] ?? 3306,
            'DB_NAME'                           => $dbConfig['name'],
            'DB_USER'                           => $dbConfig['username'],
            'DB_PASSWORD'                       => $dbConfig['password'] ?? '',
            'LICENCE_SERVER_URL'                => $licConfig['serverUrl'] ?? 'local',
            'LICENCE_PRODUCT_CODE'              => $licConfig['productCode'] ?? 'EMS',
            'LICENCE_VALIDATION_INTERVAL_HOURS' => $licConfig['validationIntervalHours'] ?? 24,
            'LICENCE_OFFLINE_GRACE_DAYS'        => $licConfig['offlineGraceDays'] ?? 7,
            'APP_VERSION'                       => '1.0.0',
            'SETUP_COMPLETED'                   => 'true'
        ];

        $envContent = $this->envWriter->build($envConfig);

        // 5. Execute Database Operations inside Transaction
        $pdo->beginTransaction();
        try {
            $this->dbInstaller->runMigrations($pdo);
            $roleId = $this->dbInstaller->createDefaultRoles($pdo);
            $this->dbInstaller->createCompany($pdo, array_merge($compConfig, ['timezone' => $appConfig['timezone']]));
            $this->dbInstaller->createAdministrator($pdo, $adminConfig, $roleId);

            $pdo->commit();
        } catch (\Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            ApiResponse::error('Database initialization failed: ' . $e->getMessage(), 'INSTALLATION_FAILED', 500);
            return;
        }

        // 6. Write .env file atomically (.env.tmp -> .env)
        try {
            $this->envWriter->writeAtomically($envContent);
        } catch (\Throwable $e) {
            ApiResponse::error('Failed to generate .env configuration file: ' . $e->getMessage(), 'ENV_WRITE_FAILED', 500);
            return;
        }

        // 7. Write permanent setup.lock file
        try {
            $this->statusService->createSetupLock([
                'applicationVersion' => '1.0.0',
                'installationId'     => $installationId
            ]);
        } catch (\Throwable $e) {
            ApiResponse::error('Failed to create permanent setup lock: ' . $e->getMessage(), 'LOCK_CREATION_FAILED', 500);
            return;
        }

        // 8. Destroy installer token & setup session
        $this->tokenSecurity->destroy();
        if (session_status() === PHP_SESSION_ACTIVE) {
            unset($_SESSION['SETUP_AUTHORIZED']);
            session_destroy();
        }

        ApiResponse::success([
            'setupComplete' => true,
            'redirect'      => '/login'
        ], 'Software installation completed successfully.');
    }

    private function verifySetupSession(): void
    {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            @session_start();
        }

        $authorized = $_SESSION['SETUP_AUTHORIZED'] ?? false;
        $authTime   = (int)($_SESSION['SETUP_AUTH_TIME'] ?? 0);

        if (!$authorized || (time() - $authTime) > 1800) {
            throw new LicenceException('Setup session expired or invalid. Please verify installer token again.', 'SETUP_SESSION_EXPIRED', 401);
        }
    }
}
