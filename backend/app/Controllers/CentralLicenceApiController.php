<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Config\LicenceConfig;
use App\Exceptions\LicenceException;
use App\Helpers\ApiResponse;
use App\Repositories\LicenceActivationRepository;
use App\Repositories\LicenceAuditRepository;
use App\Repositories\LicenceRepository;
use App\Security\LicenceKeyGenerator;
use App\Services\LicenceActivationService;
use App\Services\LicenceCertificateService;

final class CentralLicenceApiController
{
    private LicenceActivationService $activationService;
    private LicenceRepository $licenceRepo;
    private LicenceActivationRepository $activationRepo;
    private LicenceAuditRepository $auditRepo;

    public function __construct()
    {
        $this->licenceRepo = new LicenceRepository();
        $this->activationRepo = new LicenceActivationRepository();
        $this->auditRepo = new LicenceAuditRepository();
        $this->activationService = new LicenceActivationService($this->licenceRepo, $this->activationRepo, $this->auditRepo);
    }

    private function getSecretKey(): string
    {
        $keyPath = LicenceConfig::getPrivateKeyPath();
        $pubPath = LicenceConfig::getPublicKeyPath();

        if (!file_exists($keyPath) || trim((string)file_get_contents($keyPath)) === '') {
            $dir = dirname($keyPath);
            if (!is_dir($dir)) {
                @mkdir($dir, 0755, true);
            }
            if (function_exists('sodium_crypto_sign_keypair')) {
                $kp = sodium_crypto_sign_keypair();
                $sk = bin2hex(sodium_crypto_sign_secretkey($kp));
                $pk = bin2hex(sodium_crypto_sign_publickey($kp));
                @file_put_contents($keyPath, $sk);
                @chmod($keyPath, 0600);
                @file_put_contents($pubPath, $pk);
                @chmod($pubPath, 0644);
                return $sk;
            }
        }
        $key = file_get_contents($keyPath);
        if ($key === false || trim($key) === '') {
            throw new LicenceException('Secret signing key file is empty.', 'SECRET_KEY_EMPTY', 500);
        }
        return trim($key);
    }

    /**
     * Internal direct caller for local development/test mode
     */
    public function handleDirectCall(string $endpoint, string $method, array $data): array
    {
        try {
            $secretKey = $this->getSecretKey();
            if ($endpoint === '/licences/activate') {
                $certificate = $this->activationService->activate($data, $secretKey, '127.0.0.1');
                return ['success' => true, 'data' => ['certificate' => $certificate]];
            }

            if ($endpoint === '/licences/validate') {
                return $this->validateCentral($data, $secretKey);
            }

            if ($endpoint === '/licences/deactivate') {
                return $this->deactivateCentral($data);
            }

            return ['success' => false, 'error' => ['code' => 'NOT_FOUND', 'message' => 'Central API route not found']];
        } catch (LicenceException $e) {
            return ['success' => false, 'error' => ['code' => $e->getErrorCode(), 'message' => $e->getMessage()]];
        } catch (\Throwable $e) {
            return ['success' => false, 'error' => ['code' => 'SERVER_ERROR', 'message' => $e->getMessage()]];
        }
    }

    /**
     * POST /api/licences/activate
     */
    public function activateApi(): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $secretKey = $this->getSecretKey();
            $clientIp = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';

            $certificate = $this->activationService->activate($input, $secretKey, $clientIp);
            ApiResponse::success(['certificate' => $certificate], 'Activation successful.');
        } catch (LicenceException $e) {
            ApiResponse::error($e->getMessage(), $e->getErrorCode(), $e->getCode());
        } catch (\Throwable $e) {
            ApiResponse::error('Activation error: ' . $e->getMessage(), 'SERVER_ERROR', 500);
        }
    }

    /**
     * POST /api/licences/validate
     */
    public function validateApi(): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $secretKey = $this->getSecretKey();
            $result = $this->validateCentral($input, $secretKey);
            if (!$result['success']) {
                ApiResponse::error($result['error']['message'], $result['error']['code'], 400);
                return;
            }
            ApiResponse::success(['certificate' => $result['data']['certificate']], 'Validation successful.');
        } catch (\Throwable $e) {
            ApiResponse::error('Validation error: ' . $e->getMessage(), 'SERVER_ERROR', 500);
        }
    }

    private function validateCentral(array $input, string $secretKey): array
    {
        $licenceRef = trim($input['licenceReference'] ?? '');
        $installationId = trim($input['installationId'] ?? '');
        $fingerprintHash = trim($input['fingerprintHash'] ?? '');

        if ($licenceRef === '' || $installationId === '') {
            return ['success' => false, 'error' => ['code' => 'INVALID_REQUEST', 'message' => 'Missing reference or installation ID']];
        }

        $licence = $this->licenceRepo->findByReference($licenceRef);
        if ($licence === null) {
            return ['success' => false, 'error' => ['code' => 'LICENCE_NOT_FOUND', 'message' => 'Licence not found']];
        }

        if ($licence['status'] !== 'ACTIVE') {
            return ['success' => false, 'error' => ['code' => 'LICENCE_' . $licence['status'], 'message' => "Licence status is {$licence['status']}"]];
        }

        $activation = $this->activationRepo->findByLicenceAndInstallation((int)$licence['id'], $installationId);
        if ($activation === null || $activation['status'] !== 'ACTIVE') {
            return ['success' => false, 'error' => ['code' => 'ACTIVATION_INACTIVE', 'message' => 'Installation activation is inactive or blocked']];
        }

        // Update validation timestamp
        $this->activationRepo->createOrUpdate([
            'licence_id'       => $licence['id'],
            'installation_id' => $installationId,
            'fingerprint_hash' => $fingerprintHash,
            'status'           => 'ACTIVE'
        ]);

        $certificate = LicenceCertificateService::createSignedCertificate($licence, $installationId, $fingerprintHash, $secretKey);

        $this->auditRepo->log((int)$licence['id'], (int)$activation['id'], 'PERIODIC_VALIDATION_SUCCESS', 'Online validation completed');

        return ['success' => true, 'data' => ['certificate' => $certificate]];
    }

    /**
     * POST /api/licences/deactivate
     */
    public function deactivateApi(): void
    {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $result = $this->deactivateCentral($input);
        if (!$result['success']) {
            ApiResponse::error($result['error']['message'], $result['error']['code'], 400);
            return;
        }
        ApiResponse::success([], 'Deactivation successful.');
    }

    private function deactivateCentral(array $input): array
    {
        $licenceRef = trim($input['licenceReference'] ?? '');
        $installationId = trim($input['installationId'] ?? '');

        if ($licenceRef !== '' && $installationId !== '') {
            $licence = $this->licenceRepo->findByReference($licenceRef);
            if ($licence !== null) {
                $activation = $this->activationRepo->findByLicenceAndInstallation((int)$licence['id'], $installationId);
                if ($activation !== null) {
                    $this->activationRepo->updateStatus((int)$activation['id'], 'DEACTIVATED');
                    $this->auditRepo->log((int)$licence['id'], (int)$activation['id'], 'DEACTIVATION_SUCCESS', 'Installation deactivated for server migration');
                }
            }
        }

        return ['success' => true];
    }
}
