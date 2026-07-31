<?php

declare(strict_types=1);

namespace App\Security;

use App\Exceptions\LicenceException;

final class LicenceVerifier
{
    public static function isSodiumAvailable(): bool
    {
        return function_exists('sodium_crypto_sign_verify_detached');
    }

    /**
     * Verifies the Ed25519 signature of a canonical JSON payload using the public key.
     */
    public static function verify(string $canonicalJson, string $base64Signature, string $publicKeyHexOrBinary): bool
    {
        if (!self::isSodiumAvailable()) {
            throw new LicenceException('PHP Sodium extension is required for Ed25519 signature verification.', 'SODIUM_MISSING', 500);
        }

        $publicKey = self::decodePublicKey($publicKeyHexOrBinary);

        if (strlen($publicKey) !== SODIUM_CRYPTO_SIGN_PUBLICKEYBYTES) {
            throw new LicenceException('Invalid Sodium Ed25519 public key length.', 'INVALID_PUBLIC_KEY', 500);
        }

        $rawSignature = base64_decode($base64Signature, true);
        if ($rawSignature === false || strlen($rawSignature) !== SODIUM_CRYPTO_SIGN_BYTES) {
            return false;
        }

        return sodium_crypto_sign_verify_detached($rawSignature, $canonicalJson, $publicKey);
    }

    public static function verifyPayload(array $payload, string $base64Signature, string $publicKeyHexOrBinary): bool
    {
        $canonicalJson = LicenceSigner::canonicalizePayload($payload);
        return self::verify($canonicalJson, $base64Signature, $publicKeyHexOrBinary);
    }

    private static function decodePublicKey(string $keyStr): string
    {
        $trimmed = trim($keyStr);
        if (ctype_xdigit($trimmed) && strlen($trimmed) === SODIUM_CRYPTO_SIGN_PUBLICKEYBYTES * 2) {
            return hex2bin($trimmed);
        }
        $base64 = base64_decode($trimmed, true);
        if ($base64 !== false && strlen($base64) === SODIUM_CRYPTO_SIGN_PUBLICKEYBYTES) {
            return $base64;
        }
        return $trimmed;
    }
}
