<?php

declare(strict_types=1);

namespace App\Services;

use App\Config\LicenceConfig;
use App\Exceptions\LicenceException;
use App\Security\LicenceSigner;
use App\Security\LicenceVerifier;

final class LicenceCertificateService
{
    /**
     * Builds and signs a licence certificate payload (Central Licence Server).
     */
    public static function createSignedCertificate(array $licenceRow, string $installationId, string $fingerprintHash, string $secretKey): array
    {
        $now = new \DateTimeImmutable('now', new \DateTimeZone('UTC'));
        $nextValidation = $now->modify('+' . LicenceConfig::getValidationIntervalHours() . ' hours');
        $graceEnds = $nextValidation->modify('+' . LicenceConfig::getOfflineGraceDays() . ' days');

        $features = is_string($licenceRow['features']) 
            ? json_decode($licenceRow['features'], true) 
            : ($licenceRow['features'] ?? []);

        $expiresAt = null;
        if (!empty($licenceRow['expires_at'])) {
            $dt = new \DateTimeImmutable($licenceRow['expires_at'], new \DateTimeZone('UTC'));
            $expiresAt = $dt->format(\DateTimeInterface::ATOM);
        }

        $payload = [
            'certificateVersion' => 1,
            'licenceId'          => (int)$licenceRow['id'],
            'licenceReference'   => $licenceRow['licence_reference'],
            'productCode'        => $licenceRow['product_code'],
            'licenceType'        => $licenceRow['licence_type'],
            'installationId'     => $installationId,
            'fingerprintHash'    => $fingerprintHash,
            'customerName'       => $licenceRow['customer_name'],
            'companyName'        => $licenceRow['company_name'],
            'features'           => $features,
            'issuedAt'           => (new \DateTimeImmutable($licenceRow['issued_at'], new \DateTimeZone('UTC')))->format(\DateTimeInterface::ATOM),
            'expiresAt'          => $expiresAt,
            'nextValidationAt'   => $nextValidation->format(\DateTimeInterface::ATOM),
            'graceEndsAt'        => $graceEnds->format(\DateTimeInterface::ATOM),
        ];

        $signature = LicenceSigner::signPayload($payload, $secretKey);

        return [
            'payload'   => $payload,
            'signature' => $signature,
        ];
    }

    /**
     * Saves certificate securely on local customer backend storage/licence/licence-certificate.json
     */
    public static function saveLocalCertificate(array $certificateData, ?string $customPath = null): void
    {
        $path = $customPath ?? LicenceConfig::getCertificatePath();
        $directory = dirname($path);

        if (!is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        $json = json_encode($certificateData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        $fp = fopen($path, 'c+');
        if ($fp === false) {
            throw new LicenceException('Failed to open certificate storage file for writing.', 'STORAGE_ERROR', 500);
        }

        try {
            if (flock($fp, LOCK_EX)) {
                ftruncate($fp, 0);
                rewind($fp);
                fwrite($fp, $json);
                fflush($fp);
                flock($fp, LOCK_UN);
            }
        } finally {
            fclose($fp);
        }

        chmod($path, 0600);
    }

    /**
     * Loads local certificate from storage.
     */
    public static function loadLocalCertificate(?string $customPath = null): ?array
    {
        $path = $customPath ?? LicenceConfig::getCertificatePath();
        if (!file_exists($path)) {
            return null;
        }

        $content = file_get_contents($path);
        if ($content === false || trim($content) === '') {
            return null;
        }

        $decoded = json_decode($content, true);
        return is_array($decoded) ? $decoded : null;
    }

    /**
     * Deletes local certificate on deactivation.
     */
    public static function deleteLocalCertificate(?string $customPath = null): void
    {
        $path = $customPath ?? LicenceConfig::getCertificatePath();
        if (file_exists($path)) {
            @unlink($path);
        }
    }
}
