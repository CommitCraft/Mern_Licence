<?php

declare(strict_types=1);

namespace App\Config;

use App\Helpers\Environment;
use PDO;
use PDOException;

final class Database
{
    private static ?PDO $instance = null;

    public static function getConnection(): PDO
    {
        if (self::$instance === null) {
            $host = Environment::get('DB_HOST', 'localhost');
            $port = Environment::get('DB_PORT', '3306');
            $dbname = Environment::get('DB_NAME', 'licence_system');
            $user = Environment::get('DB_USER', 'root');
            $pass = Environment::get('DB_PASSWORD', '');

            $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";

            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
            ];

            try {
                self::$instance = new PDO($dsn, $user, $pass, $options);
            } catch (PDOException $e) {
                throw new \RuntimeException("Database Connection Failed: " . $e->getMessage());
            }
        }

        return self::$instance;
    }
}
