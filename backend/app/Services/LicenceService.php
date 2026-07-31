<?php

declare(strict_types=1);

namespace App\Services;

use App\Config\LicenceConfig;
use App\Exceptions\LicenceException;
use App\Security\LicenceVerifier;
use App\Security\MachineFingerprint;
use App\Types\LicenceTypes;

final class LicenceService
{
    private string $publicKeyPath;

    public function __construct(?string $publicKeyPath = null)
    {
        $this->publicKeyPath = $publicKeyPath ?? LicenceConfig::getPublicKeyPath();
    }

    /**
     * Reads public key string safely from storage path.
     */
    public function getPublicKey(): string
    {
        if (!file_exists($this->publicKeyPath)) {
            throw new LicenceException('Public verification key not found on server.', 'PUBLIC_KEY_MISSING', 500);
        }
        $key = file_get_contents($this->publicKeyPath);
        if ($key === false || trim($key) === '') {
            throw new LicenceException('Public verification key file is empty.', 'PUBLIC_KEY_EMPTY', 500);
        }
        return trim($key);
    }

    /**
     * Evaluates complete local licence status for Customer Backend and React Frontend.
     */
    public function evaluateLocalLicence(): array
    {
        $certificateData = LicenceCertificateService::loadLocalCertificate();

        if ($certificateData === null) {
            return [
                'valid'   => false,
                'code'    => LicenceTypes::CODE_LICENCE_REQUIRED,
                'message' => 'No active software licence found. Please activate the software.'
            ];
        }

        $payload   = $certificateData['payload'] ?? null;
        $signature = $certificateData['signature'] ?? null;

        if (!is_array($payload) || !is_string($signature)) {
            return [
                'valid'   => false,
                'code'    => LicenceTypes::CODE_INVALID_SIGNATURE,
                'message' => 'Licence certificate data is corrupted or invalid.'
            ];
        }

        // 1. Verify Signature using Ed25519 Public Key
        try {
            $publicKey = $this->getPublicKey();
            $isSignatureValid = LicenceVerifier::verifyPayload($payload, $signature, $publicKey);
            if (!$isSignatureValid) {
                return [
                    'valid'   => false,
                    'code'    => LicenceTypes::CODE_INVALID_SIGNATURE,
                    'message' => 'Licence certificate signature verification failed. Certificate may be modified.'
                ];
            }
        } catch (\Throwable $e) {
            return [
                'valid'   => false,
                'code'    => LicenceTypes::CODE_INVALID_SIGNATURE,
                'message' => 'Signature verification error: ' . $e->getMessage()
            ];
        }

        // 2. Installation ID Check
        $localInstallationId = MachineFingerprint::getInstallationId();
        if (($payload['installationId'] ?? '') !== $localInstallationId) {
            return [
                'valid'   => false,
                'code'    => LicenceTypes::CODE_INSTALLATION_MISMATCH,
                'message' => 'Licence certificate belongs to a different installation ID.'
            ];
        }

        // 3. Machine Fingerprint Check
        $localFingerprint = MachineFingerprint::createMachineFingerprint($localInstallationId, LicenceConfig::getProductCode());
        if (($payload['fingerprintHash'] ?? '') !== $localFingerprint) {
            return [
                'valid'   => false,
                'code'    => LicenceTypes::CODE_FINGERPRINT_MISMATCH,
                'message' => 'Machine hardware fingerprint does not match the licence certificate.'
            ];
        }

        // 4. Product Code Check
        if (strtoupper((string)($payload['productCode'] ?? '')) !== strtoupper(LicenceConfig::getProductCode())) {
            return [
                'valid'   => false,
                'code'    => LicenceTypes::CODE_INSTALLATION_MISMATCH,
                'message' => 'Licence is for a different product code.'
            ];
        }

        // 5. Expiration Date Check
        $now = new \DateTimeImmutable('now', new \DateTimeZone('UTC'));

        if (!empty($payload['expiresAt'])) {
            $expiresAt = new \DateTimeImmutable($payload['expiresAt'], new \DateTimeZone('UTC'));
            if ($now > $expiresAt) {
                return [
                    'valid'   => false,
                    'code'    => LicenceTypes::CODE_LICENCE_EXPIRED,
                    'message' => 'Licence expired on ' . $expiresAt->format('Y-m-d H:i:s UTC')
                ];
            }
        }

        // 6. Clock Rollback & Grace Period Check
        $validationState = $this->loadValidationState();
        if ($validationState !== null && isset($validationState['lastCheckTimestamp'])) {
            if ($now->getTimestamp() < (int)$validationState['lastCheckTimestamp']) {
                return [
                    'valid'   => false,
                    'code'    => LicenceTypes::CODE_CLOCK_ROLLBACK_DETECTED,
                    'message' => 'System clock rollback detected. Licence validation suspended.'
                ];
            }
        }

        // Update validation state timestamp
        $this->saveValidationState(['lastCheckTimestamp' => $now->getTimestamp()]);

        // 7. Offline Grace Period Check
        if (!empty($payload['graceEndsAt'])) {
            $graceEndsAt = new \DateTimeImmutable($payload['graceEndsAt'], new \DateTimeZone('UTC'));
            if ($now > $graceEndsAt) {
                return [
                    'valid'   => false,
                    'code'    => LicenceTypes::CODE_ONLINE_VALIDATION_REQUIRED,
                    'message' => 'Offline grace period has ended. Online licence validation required.'
                ];
            }
        }

        // Valid Licence Response (Sanitized for React)
        return [
            'valid'   => true,
            'code'    => LicenceTypes::CODE_LICENCE_VALID,
            'message' => 'Licence is valid and active.',
            'features' => $payload['features'] ?? [],
            'licence'  => [
                'licenceReference' => $payload['licenceReference'] ?? '',
                'licenceType'      => $payload['licenceType'] ?? '',
                'companyName'      => $payload['companyName'] ?? '',
                'customerName'     => $payload['customerName'] ?? '',
                'productCode'      => $payload['productCode'] ?? '',
                'issuedAt'         => $payload['issuedAt'] ?? '',
                'expiresAt'        => $payload['expiresAt'] ?? null,
                'nextValidationAt' => $payload['nextValidationAt'] ?? '',
                'graceEndsAt'      => $payload['graceEndsAt'] ?? '',
                'installationId'   => substr($localInstallationId, 0, 8) . '...' . substr($localInstallationId, -4)
            ]
        ];
    }

    private function loadValidationState(): ?array
    {
        $path = LicenceConfig::getValidationStatePath();
        if (!file_exists($path)) {
            return null;
        }
        $content = file_get_contents($path);
        if ($content === false || trim($content) === '') {
            return null;
        }
        return json_decode($content, true);
    }

    private function saveValidationState(array $state): void
    {
        $path = LicenceConfig::getValidationStatePath();
        $dir = dirname($path);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        file_put_contents($path, json_encode($state, JSON_PRETTY_PRINT));
    }
}
