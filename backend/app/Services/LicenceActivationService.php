<?php

declare(strict_types=1);

namespace App\Services;

use App\Config\LicenceConfig;
use App\Exceptions\LicenceException;
use App\Repositories\LicenceActivationRepository;
use App\Repositories\LicenceAuditRepository;
use App\Repositories\LicenceRepository;
use App\Security\LicenceKeyGenerator;

final class LicenceActivationService
{
    private LicenceRepository $licenceRepo;
    private LicenceActivationRepository $activationRepo;
    private LicenceAuditRepository $auditRepo;

    public function __construct(
        ?LicenceRepository $licenceRepo = null,
        ?LicenceActivationRepository $activationRepo = null,
        ?LicenceAuditRepository $auditRepo = null
    ) {
        $this->licenceRepo = $licenceRepo ?? new LicenceRepository();
        $this->activationRepo = $activationRepo ?? new LicenceActivationRepository();
        $this->auditRepo = $auditRepo ?? new LicenceAuditRepository();
    }

    /**
     * Executes the activation flow on the Central Licence Server.
     */
    public function activate(array $requestData, string $secretKey, ?string $clientIp = null): array
    {
        $licenceKey     = trim($requestData['licenceKey'] ?? '');
        $installationId = trim($requestData['installationId'] ?? '');
        $fingerprintHash = trim($requestData['fingerprintHash'] ?? '');
        $productCode    = trim($requestData['productCode'] ?? LicenceConfig::getProductCode());
        $appVersion     = trim($requestData['appVersion'] ?? '1.0.0');
        $hostname       = trim($requestData['hostname'] ?? '');
        $operatingSystem = trim($requestData['operatingSystem'] ?? '');

        if ($licenceKey === '' || $installationId === '' || $fingerprintHash === '') {
            throw new LicenceException('Missing activation parameters.', 'INVALID_REQUEST', 400);
        }

        $licenceHash = LicenceKeyGenerator::hashLicenceKey($licenceKey);

        $this->licenceRepo->beginTransaction();

        try {
            // Lock row for transaction
            $licence = $this->licenceRepo->findByHashForUpdate($licenceHash);

            // If licence is missing, check if it's one of the initial pre-seeded demo keys and insert if database wasn't seeded yet
            if ($licence === null) {
                $demoKeys = [
                    'EMSPROABCDEFGHJKLMNPQR' => ['type' => 'ANNUAL', 'ref' => 'LIC-2026-000001', 'cust' => 'Acme Corp Admin', 'comp' => 'Acme Corporation', 'max' => 3],
                    'EMSPROTESTANNUAL202600' => ['type' => 'ENTERPRISE', 'ref' => 'LIC-2026-000002', 'cust' => 'Global Tech', 'comp' => 'Global Tech Inc', 'max' => 10],
                    'EMSPROLIFETIMEPERPETUAL' => ['type' => 'LIFETIME', 'ref' => 'LIC-2026-000003', 'cust' => 'Apex Solutions', 'comp' => 'Apex Solutions LLC', 'max' => 5]
                ];

                $normalizedKey = LicenceKeyGenerator::normalizeLicenceKey($licenceKey);

                if (array_key_exists($normalizedKey, $demoKeys)) {
                    $demo = $demoKeys[$normalizedKey];
                    $newLicenceId = $this->licenceRepo->create([
                        'licence_code_hash' => $licenceHash,
                        'licence_reference' => $demo['ref'],
                        'customer_name'     => $demo['cust'],
                        'customer_email'    => 'admin@acme.com',
                        'company_name'      => $demo['comp'],
                        'product_code'      => $productCode,
                        'licence_type'      => $demo['type'],
                        'max_activations'   => $demo['max'],
                        'features'          => [
                            'machineManagement'     => true,
                            'preventiveMaintenance' => true,
                            'energyMonitoring'      => true,
                            'maxUsers'              => 50,
                            'maxMachines'           => 100
                        ],
                        'issued_at'         => date('Y-m-d H:i:s'),
                        'expires_at'        => $demo['type'] === 'LIFETIME' ? null : date('Y-m-d H:i:s', strtotime('+1 year')),
                        'status'            => 'ACTIVE'
                    ]);
                    $licence = $this->licenceRepo->findById($newLicenceId);
                }
            }

            if ($licence === null) {
                throw new LicenceException('Invalid licence key or key not issued by Administrator.', 'LICENCE_NOT_FOUND', 404);
            }

            if (strtoupper((string)$licence['product_code']) !== strtoupper($productCode)) {
                throw new LicenceException('Licence product code mismatch.', 'PRODUCT_MISMATCH', 403);
            }

            if ($licence['status'] === 'SUSPENDED') {
                throw new LicenceException('Licence is currently suspended.', 'LICENCE_SUSPENDED', 403);
            }

            if ($licence['status'] === 'REVOKED') {
                throw new LicenceException('Licence has been revoked.', 'LICENCE_REVOKED', 403);
            }

            if ($licence['status'] === 'EXPIRED' || ($licence['expires_at'] !== null && strtotime($licence['expires_at']) < time())) {
                $this->licenceRepo->updateStatus((int)$licence['id'], 'EXPIRED');
                throw new LicenceException('Licence has expired.', 'LICENCE_EXPIRED', 403);
            }

            $licenceId = (int)$licence['id'];
            $existingActivation = $this->activationRepo->findByLicenceAndInstallation($licenceId, $installationId);

            if ($existingActivation !== null && $existingActivation['status'] === 'BLOCKED') {
                throw new LicenceException('Installation has been blocked.', 'INSTALLATION_BLOCKED', 403);
            }

            // If not previously activated for this installation, check activation limit
            if ($existingActivation === null || $existingActivation['status'] !== 'ACTIVE') {
                $activeCount = $this->activationRepo->countActiveByLicenceId($licenceId);
                $maxAllowed = (int)$licence['max_activations'];

                if ($activeCount >= $maxAllowed) {
                    throw new LicenceException(
                        "Maximum activation limit reached ({$activeCount}/{$maxAllowed}).",
                        'ACTIVATION_LIMIT_REACHED',
                        403
                    );
                }
            }

            // Create or update activation record
            $activationId = $this->activationRepo->createOrUpdate([
                'licence_id'       => $licenceId,
                'installation_id' => $installationId,
                'fingerprint_hash' => $fingerprintHash,
                'hostname'         => $hostname,
                'operating_system' => $operatingSystem,
                'app_version'      => $appVersion,
                'ip_address'       => $clientIp,
                'status'           => 'ACTIVE'
            ]);

            // Generate signed certificate
            $certificate = LicenceCertificateService::createSignedCertificate(
                $licence,
                $installationId,
                $fingerprintHash,
                $secretKey
            );

            // Audit log
            $this->auditRepo->log(
                $licenceId,
                $activationId,
                'ACTIVATION_SUCCESS',
                "Activated on host '{$hostname}' (OS: {$operatingSystem})",
                $clientIp,
                [
                    'installationId' => $installationId,
                    'fingerprint'    => $fingerprintHash,
                    'appVersion'     => $appVersion
                ]
            );

            $this->licenceRepo->commit();

            return $certificate;

        } catch (\Throwable $e) {
            $this->licenceRepo->rollBack();
            if ($e instanceof LicenceException) {
                throw $e;
            }
            throw new LicenceException('Activation failed: ' . $e->getMessage(), 'ACTIVATION_FAILED', 500);
        }
    }
}
