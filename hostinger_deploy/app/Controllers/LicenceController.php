<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Config\LicenceConfig;
use App\Exceptions\LicenceException;
use App\Helpers\ApiResponse;
use App\Helpers\Validator;
use App\Security\LicenceVerifier;
use App\Security\MachineFingerprint;
use App\Services\LicenceCertificateService;
use App\Services\LicenceService;

final class LicenceController
{
    private LicenceService $licenceService;

    public function __construct(?LicenceService $licenceService = null)
    {
        $this->licenceService = $licenceService ?? new LicenceService();
    }

    /**
     * GET /api/licence/status
     */
    public function getStatus(): void
    {
        $status = $this->licenceService->evaluateLocalLicence();
        ApiResponse::json($status, 200);
    }

    /**
     * POST /api/licence/activate
     */
    public function activate(): void
    {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        Validator::requireFields($input, ['licenceKey']);

        $licenceKey = trim($input['licenceKey']);
        $installationId = MachineFingerprint::getInstallationId();
        $fingerprintHash = MachineFingerprint::createMachineFingerprint($installationId, LicenceConfig::getProductCode());

        $payload = [
            'licenceKey'      => $licenceKey,
            'installationId'  => $installationId,
            'fingerprintHash' => $fingerprintHash,
            'productCode'     => LicenceConfig::getProductCode(),
            'appVersion'      => LicenceConfig::getAppVersion(),
            'hostname'        => gethostname() ?: 'customer-host',
            'operatingSystem' => PHP_OS_FAMILY
        ];

        // Call central server or internal central handler
        $response = $this->callCentralServer('/licences/activate', 'POST', $payload);

        if (empty($response['success']) || empty($response['data']['certificate'])) {
            $errMessage = $response['error']['message'] ?? 'Activation failed at central licence server.';
            $errCode = $response['error']['code'] ?? 'ACTIVATION_FAILED';
            ApiResponse::error($errMessage, $errCode, 400);
            return;
        }

        $certificate = $response['data']['certificate'];

        // Verify certificate locally before saving
        try {
            $publicKey = $this->licenceService->getPublicKey();
            $isValid = LicenceVerifier::verifyPayload($certificate['payload'], $certificate['signature'], $publicKey);
            if (!$isValid) {
                ApiResponse::error('Received certificate fails public key verification.', 'INVALID_SIGNATURE', 400);
                return;
            }
        } catch (\Throwable $e) {
            ApiResponse::error('Local verification error: ' . $e->getMessage(), 'VERIFICATION_FAILED', 500);
            return;
        }

        // Save certificate securely
        LicenceCertificateService::saveLocalCertificate($certificate);

        // Return updated status
        $status = $this->licenceService->evaluateLocalLicence();
        ApiResponse::success(['licence' => $status], 'Software licence activated successfully.');
    }

    /**
     * POST /api/licence/validate
     */
    public function validateNow(): void
    {
        $certificate = LicenceCertificateService::loadLocalCertificate();
        if ($certificate === null) {
            ApiResponse::error('No local licence certificate found to validate.', 'LICENCE_REQUIRED', 400);
            return;
        }

        $installationId = MachineFingerprint::getInstallationId();
        $fingerprintHash = MachineFingerprint::createMachineFingerprint($installationId, LicenceConfig::getProductCode());

        $payload = [
            'licenceReference' => $certificate['payload']['licenceReference'] ?? '',
            'installationId'   => $installationId,
            'fingerprintHash'  => $fingerprintHash,
            'productCode'       => LicenceConfig::getProductCode()
        ];

        $response = $this->callCentralServer('/licences/validate', 'POST', $payload);

        if (!empty($response['success']) && !empty($response['data']['certificate'])) {
            LicenceCertificateService::saveLocalCertificate($response['data']['certificate']);
        }

        $status = $this->licenceService->evaluateLocalLicence();
        ApiResponse::success(['licence' => $status], 'Licence online validation completed.');
    }

    /**
     * POST /api/licence/deactivate
     */
    public function deactivate(): void
    {
        $certificate = LicenceCertificateService::loadLocalCertificate();
        $installationId = MachineFingerprint::getInstallationId();

        if ($certificate !== null) {
            $payload = [
                'licenceReference' => $certificate['payload']['licenceReference'] ?? '',
                'installationId'   => $installationId
            ];
            $this->callCentralServer('/licences/deactivate', 'POST', $payload);
            LicenceCertificateService::deleteLocalCertificate();
        }

        ApiResponse::success([], 'Software licence deactivated successfully for server migration.');
    }

    /**
     * Dispatches request to Central Server or directly invokes central controller in unified mode.
     */
    private function callCentralServer(string $endpoint, string $method, array $data): array
    {
        $centralUrl = LicenceConfig::getLicenceServerUrl();

        // If local/unified environment, directly call Central Controller
        if ($centralUrl === 'local' || str_contains($centralUrl, 'localhost') || str_contains($centralUrl, '127.0.0.1')) {
            $centralController = new CentralLicenceApiController();
            return $centralController->handleDirectCall($endpoint, $method, $data);
        }

        // Standard HTTPS cURL request to remote central server
        $ch = curl_init(rtrim($centralUrl, '/') . '/' . ltrim($endpoint, '/'));
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST  => $method,
            CURLOPT_POSTFIELDS     => json_encode($data),
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json', 'Accept: application/json'],
            CURLOPT_TIMEOUT        => 10,
            CURLOPT_CONNECTTIMEOUT => 5
        ]);

        $result = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($result === false) {
            return [
                'success' => false,
                'error'   => ['code' => 'CENTRAL_SERVER_OFFLINE', 'message' => 'Unable to connect to central licence server.']
            ];
        }

        return json_decode($result, true) ?? ['success' => false, 'error' => ['code' => 'INVALID_JSON', 'message' => 'Invalid JSON from central server']];
    }
}
