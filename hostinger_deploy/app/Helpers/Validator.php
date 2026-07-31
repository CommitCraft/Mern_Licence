<?php

declare(strict_types=1);

namespace App\Helpers;

use App\Exceptions\LicenceException;

final class Validator
{
    public static function requireFields(array $data, array $fields): void
    {
        $missing = [];
        foreach ($fields as $field) {
            if (!isset($data[$field]) || (is_string($data[$field]) && trim($data[$field]) === '')) {
                $missing[] = $field;
            }
        }

        if (!empty($missing)) {
            throw new LicenceException(
                'Missing required fields: ' . implode(', ', $missing),
                'INVALID_REQUEST',
                400,
                ['missing_fields' => $missing]
            );
        }
    }

    public static function sanitizeString(?string $value): string
    {
        if ($value === null) {
            return '';
        }
        return trim(htmlspecialchars($value, ENT_QUOTES, 'UTF-8'));
    }
}
