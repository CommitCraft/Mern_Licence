<?php

declare(strict_types=1);

namespace App\Helpers;

final class Environment
{
    private static array $cache = [];
    private static bool $loaded = false;

    public static function load(string $envFilePath): void
    {
        if (self::$loaded) {
            return;
        }

        if (file_exists($envFilePath)) {
            $lines = file($envFilePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            if ($lines !== false) {
                foreach ($lines as $line) {
                    $line = trim($line);
                    if ($line === '' || str_starts_with($line, '#')) {
                        continue;
                    }
                    if (str_contains($line, '=')) {
                        [$name, $value] = explode('=', $line, 2);
                        $name = trim($name);
                        $value = trim($value, " \t\n\r\0\x0B\"'");
                        self::$cache[$name] = $value;
                        if (!array_key_exists($name, $_ENV)) {
                            $_ENV[$name] = $value;
                        }
                    }
                }
            }
        }
        self::$loaded = true;
    }

    public static function get(string $key, ?string $default = null): ?string
    {
        if (array_key_exists($key, $_ENV)) {
            return (string)$_ENV[$key];
        }
        if (array_key_exists($key, self::$cache)) {
            return self::$cache[$key];
        }
        $val = getenv($key);
        return $val !== false ? (string)$val : $default;
    }
}
