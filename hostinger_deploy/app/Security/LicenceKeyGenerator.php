<?php

declare(strict_types=1);

namespace App\Security;

use RuntimeException;

final class LicenceKeyGenerator
{
    private const KEY_CHARACTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Base32 unambiguous charset

    /**
     * Generates a readable licence key in the format: EMS-PRO-XXXX-XXXX-XXXX-XXXX
     */
    public static function generateLicenceKey(string $prefix = 'EMS-PRO'): string
    {
        $chunks = [];
        for ($i = 0; $i < 4; $i++) {
            $chunk = '';
            for ($j = 0; $j < 4; $j++) {
                $randomByte = random_int(0, strlen(self::KEY_CHARACTERS) - 1);
                $chunk .= self::KEY_CHARACTERS[$randomByte];
            }
            $chunks[] = $chunk;
        }

        return strtoupper($prefix . '-' . implode('-', $chunks));
    }

    /**
     * Normalizes the licence key by removing all hyphens/spaces and converting to uppercase.
     */
    public static function normalizeLicenceKey(string $licenceKey): string
    {
        $normalized = preg_replace('/[^A-Z0-9]/i', '', $licenceKey);
        return strtoupper((string)$normalized);
    }

    /**
     * Generates SHA-256 hash of normalized licence key.
     */
    public static function hashLicenceKey(string $licenceKey): string
    {
        $normalized = self::normalizeLicenceKey($licenceKey);
        return hash('sha256', $normalized);
    }

    /**
     * Generates unique reference code such as LIC-2026-000001 or LIC-2026-X8F29A
     */
    public static function generateLicenceReference(int $sequenceId = 0): string
    {
        $year = date('Y');
        if ($sequenceId > 0) {
            return sprintf('LIC-%s-%06d', $year, $sequenceId);
        }
        $randomSuffix = strtoupper(bin2hex(random_bytes(3)));
        return sprintf('LIC-%s-%s', $year, $randomSuffix);
    }
}
