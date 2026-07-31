<?php

declare(strict_types=1);

namespace App\Helpers;

final class ApiResponse
{
    public static function json(array $data, int $statusCode = 200): void
    {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: DENY');
        header('X-XSS-Protection: 1; mode=block');
        echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }

    public static function success(array $data = [], string $message = 'Success', int $statusCode = 200): void
    {
        self::json(array_merge([
            'success' => true,
            'message' => $message
        ], $data), $statusCode);
    }

    public static function error(string $message, string $errorCode = 'ERROR', int $statusCode = 400, array $extra = []): void
    {
        self::json(array_merge([
            'success' => false,
            'error' => [
                'code' => $errorCode,
                'message' => $message
            ]
        ], $extra), $statusCode);
    }
}
