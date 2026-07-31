<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Exceptions\LicenceException;
use App\Helpers\ApiResponse;
use App\Helpers\Validator;
use App\Repositories\LicenceActivationRepository;
use App\Repositories\LicenceAuditRepository;
use App\Repositories\LicenceRepository;
use App\Security\LicenceKeyGenerator;

final class LicenceAdminController
{
    private LicenceRepository $licenceRepo;
    private LicenceActivationRepository $activationRepo;
    private LicenceAuditRepository $auditRepo;

    public function __construct()
    {
        $this->licenceRepo = new LicenceRepository();
        $this->activationRepo = new LicenceActivationRepository();
        $this->auditRepo = new LicenceAuditRepository();
    }

    /**
     * POST /api/admin/licences - Create new licence
     */
    public function create(): void
    {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        Validator::requireFields($input, ['customerName', 'customerEmail', 'companyName', 'licenceType']);

        $productCode    = Validator::sanitizeString($input['productCode'] ?? 'EMS');
        $customerName   = Validator::sanitizeString($input['customerName']);
        $customerEmail  = Validator::sanitizeString($input['customerEmail']);
        $companyName    = Validator::sanitizeString($input['companyName']);
        $licenceType    = strtoupper(Validator::sanitizeString($input['licenceType']));
        $maxActivations = (int)($input['maxActivations'] ?? 1);
        $features       = $input['features'] ?? [
            'machineManagement'     => true,
            'preventiveMaintenance' => true,
            'energyMonitoring'      => false,
            'maxUsers'              => 10,
            'maxMachines'           => 25
        ];

        // Determine Expiry Date based on type
        $issuedAt = date('Y-m-d H:i:s');
        $expiresAt = null;
        if ($licenceType === 'TRIAL') {
            $expiresAt = date('Y-m-d H:i:s', strtotime('+30 days'));
        } elseif ($licenceType === 'ANNUAL') {
            $expiresAt = date('Y-m-d H:i:s', strtotime('+1 year'));
        } elseif ($licenceType === 'ENTERPRISE') {
            $months = (int)($input['validityMonths'] ?? 12);
            $expiresAt = date('Y-m-d H:i:s', strtotime("+{$months} months"));
        } // LIFETIME remains null

        // Generate Readable Licence Key & Hash
        $plainLicenceKey = LicenceKeyGenerator::generateLicenceKey($productCode . '-PRO');
        $licenceHash     = LicenceKeyGenerator::hashLicenceKey($plainLicenceKey);

        $this->licenceRepo->beginTransaction();
        try {
            // First insert to get ID for reference
            $tempRef = 'LIC-TEMP-' . bin2hex(random_bytes(3));
            $licenceId = $this->licenceRepo->create([
                'licence_code_hash' => $licenceHash,
                'licence_reference' => $tempRef,
                'customer_name'     => $customerName,
                'customer_email'    => $customerEmail,
                'company_name'      => $companyName,
                'product_code'      => $productCode,
                'licence_type'      => $licenceType,
                'max_activations'   => $maxActivations,
                'features'          => $features,
                'issued_at'         => $issuedAt,
                'expires_at'        => $expiresAt,
                'status'            => 'ACTIVE'
            ]);

            $finalRef = LicenceKeyGenerator::generateLicenceReference($licenceId);
            
            // Update reference
            $db = \App\Config\Database::getConnection();
            $stmt = $db->prepare("UPDATE licences SET licence_reference = :ref WHERE id = :id");
            $stmt->execute(['ref' => $finalRef, 'id' => $licenceId]);

            $this->auditRepo->log($licenceId, null, 'LICENCE_CREATED', "Created {$licenceType} licence for {$customerName}");

            $this->licenceRepo->commit();

            // Return readable licence key ONCE
            ApiResponse::success([
                'licence' => [
                    'id'               => $licenceId,
                    'licenceReference' => $finalRef,
                    'plainLicenceKey'  => $plainLicenceKey, // DISPLAYED ONLY ONCE
                    'customerName'     => $customerName,
                    'customerEmail'    => $customerEmail,
                    'companyName'      => $companyName,
                    'productCode'      => $productCode,
                    'licenceType'      => $licenceType,
                    'maxActivations'   => $maxActivations,
                    'features'         => $features,
                    'issuedAt'         => $issuedAt,
                    'expiresAt'        => $expiresAt,
                    'status'           => 'ACTIVE'
                ]
            ], 'Licence generated successfully. Save the licence key securely now.', 201);

        } catch (\Throwable $e) {
            $this->licenceRepo->rollBack();
            ApiResponse::error('Failed to create licence: ' . $e->getMessage(), 'CREATE_FAILED', 500);
        }
    }

    /**
     * GET /api/admin/licences
     */
    public function list(): void
    {
        $status = $_GET['status'] ?? null;
        $search = $_GET['search'] ?? null;
        $product = $_GET['productCode'] ?? null;

        $rows = $this->licenceRepo->findAll([
            'status'       => $status,
            'search'       => $search,
            'product_code' => $product
        ]);

        $sanitized = array_map(function ($row) {
            unset($row['licence_code_hash']); // SECURITY: Hide hash from admin responses
            $row['features'] = is_string($row['features']) ? json_decode($row['features'], true) : $row['features'];
            return $row;
        }, $rows);

        ApiResponse::success(['licences' => $sanitized]);
    }

    /**
     * GET /api/admin/licences/{id}
     */
    public function getOne(int $id): void
    {
        $row = $this->licenceRepo->findById($id);
        if ($row === null) {
            ApiResponse::error('Licence not found.', 'NOT_FOUND', 404);
            return;
        }

        unset($row['licence_code_hash']);
        $row['features'] = is_string($row['features']) ? json_decode($row['features'], true) : $row['features'];
        
        $activations = $this->activationRepo->findByLicenceId($id);
        $logs = $this->auditRepo->findByLicenceId($id);

        ApiResponse::success([
            'licence'     => $row,
            'activations' => $activations,
            'auditLogs'   => $logs
        ]);
    }

    /**
     * PUT /api/admin/licences/{id} - Update features & max activations
     */
    public function update(int $id): void
    {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $row = $this->licenceRepo->findById($id);
        if ($row === null) {
            ApiResponse::error('Licence not found.', 'NOT_FOUND', 404);
            return;
        }

        if (isset($input['features']) && is_array($input['features'])) {
            $this->licenceRepo->updateFeatures($id, $input['features']);
        }

        if (isset($input['maxActivations'])) {
            $db = \App\Config\Database::getConnection();
            $stmt = $db->prepare("UPDATE licences SET max_activations = :max WHERE id = :id");
            $stmt->execute(['max' => (int)$input['maxActivations'], 'id' => $id]);
        }

        $this->auditRepo->log($id, null, 'LICENCE_UPDATED', 'Updated features or activation limits');
        ApiResponse::success([], 'Licence updated successfully.');
    }

    /**
     * PATCH /api/admin/licences/{id}/suspend
     */
    public function suspend(int $id): void
    {
        $this->licenceRepo->updateStatus($id, 'SUSPENDED');
        $this->auditRepo->log($id, null, 'LICENCE_SUSPENDED', 'Licence suspended by admin');
        ApiResponse::success([], 'Licence suspended.');
    }

    /**
     * PATCH /api/admin/licences/{id}/activate
     */
    public function activateStatus(int $id): void
    {
        $this->licenceRepo->updateStatus($id, 'ACTIVE');
        $this->auditRepo->log($id, null, 'LICENCE_REACTIVATED', 'Licence reactivated by admin');
        ApiResponse::success([], 'Licence status set to ACTIVE.');
    }

    /**
     * PATCH /api/admin/licences/{id}/revoke
     */
    public function revoke(int $id): void
    {
        $this->licenceRepo->updateStatus($id, 'REVOKED');
        $this->auditRepo->log($id, null, 'LICENCE_REVOKED', 'Licence revoked by admin');
        ApiResponse::success([], 'Licence revoked.');
    }

    /**
     * PATCH /api/admin/licences/{id}/extend
     */
    public function extend(int $id): void
    {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        Validator::requireFields($input, ['expiresAt']);

        $expiresAt = date('Y-m-d H:i:s', strtotime($input['expiresAt']));
        $this->licenceRepo->updateExpiry($id, $expiresAt);
        $this->licenceRepo->updateStatus($id, 'ACTIVE');

        $this->auditRepo->log($id, null, 'LICENCE_EXTENDED', "Expiry extended to {$expiresAt}");
        ApiResponse::success([], 'Licence expiry extended.');
    }

    /**
     * PATCH /api/admin/activations/{id}/deactivate
     */
    public function deactivateActivation(int $activationId): void
    {
        $act = $this->activationRepo->findById($activationId);
        if ($act === null) {
            ApiResponse::error('Activation record not found.', 'NOT_FOUND', 404);
            return;
        }

        $this->activationRepo->updateStatus($activationId, 'DEACTIVATED');
        $this->auditRepo->log((int)$act['licence_id'], $activationId, 'ACTIVATION_DEACTIVATED', 'Activation deactivated by admin');
        ApiResponse::success([], 'Activation deactivated.');
    }

    /**
     * PATCH /api/admin/activations/{id}/block
     */
    public function blockActivation(int $activationId): void
    {
        $act = $this->activationRepo->findById($activationId);
        if ($act === null) {
            ApiResponse::error('Activation record not found.', 'NOT_FOUND', 404);
            return;
        }

        $this->activationRepo->updateStatus($activationId, 'BLOCKED');
        $this->auditRepo->log((int)$act['licence_id'], $activationId, 'ACTIVATION_BLOCKED', 'Installation blocked by admin');
        ApiResponse::success([], 'Installation blocked.');
    }
}
