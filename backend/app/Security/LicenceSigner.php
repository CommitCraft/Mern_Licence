<?php

declare(strict_types=1);

namespace App\Security;

use App\Config\LicenceConfig;
use App\Exceptions\LicenceException;

final class LicenceSigner
{
    public static function isSodiumAvailable(): bool
    {
        return function_exists('sodium_crypto_sign_detached');
    }

    /**
     * Canonically sort payload array recursively to ensure deterministic JSON string encoding.
     */
    public static function canonicalizePayload(array $payload): string
    {
        self::ksortRecursive($payload);
        return (string)json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }

    private static function ksortRecursive(array &$array): void
    {
        ksort($array);
        foreach ($array as &$value) {
            if (is_array($value)) {
                self::ksortRecursive($value);
            }
        }
    }

    /**
     * Signs a canonical JSON string using Ed25519 secret key.
     * Returns Base64-encoded signature.
     */
    public static function sign(string $canonicalJson, string $secretKeyHexOrBinary): string
    {
        if (!self::isSodiumAvailable()) {
            throw new LicenceException('PHP Sodium extension is required for Ed25519 signing.', 'SODIUM_MISSING', 500);
        }

        $secretKey = self::decodeKey($secretKeyHexOrBinary);

        if (strlen($secretKey) !== SODIUM_CRYPTO_SIGN_SECRETKEYBYTES) {
            throw new LicenceException('Invalid Sodium Ed25519 secret key length.', 'INVALID_SECRET_KEY', 500);
        }

        $rawSignature = sodium_crypto_sign_detached($canonicalJson, $secretKey);
        return base64_encode($rawSignature);
    }

    public static function signPayload(array $payload, string $secretKeyHexOrBinary): string
    {
        $canonicalJson = self::canonicalizePayload($payload);
        return self::sign($canonicalJson, $secretKeyHexOrBinary);
    }

    private static function decodeKey(string $keyStr): string
    {
        $trimmed = trim($keyStr);
        if (ctype_xdigit($trimmed) && strlen($trimmed) === SODIUM_CRYPTO_SIGN_SECRETKEYBYTES * 2) {
            return hex2bin($trimmed);
        }
        $base64 = base64_decode($trimmed, true);
        if ($base64 !== false && strlen($base64) === SODIUM_CRYPTO_SIGN_SECRETKEYBYTES) {
            return $base64;
        }
        return $trimmed;
    }
}
