<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Config\Database;
use PDO;

final class LicenceActivationRepository
{
    private PDO $db;

    public function __construct(?PDO $db = null)
    {
        $this->db = $db ?? Database::getConnection();
    }

    public function findByLicenceAndInstallation(int $licenceId, string $installationId): ?array
    {
        $stmt = $this->db->prepare("
            SELECT * FROM licence_activations 
            WHERE licence_id = :licence_id AND installation_id = :installation_id 
            LIMIT 1
        ");
        $stmt->execute([
            'licence_id' => $licenceId,
            'installation_id' => $installationId
        ]);
        $row = $stmt->fetch();
        return $row !== false ? $row : null;
    }

    public function countActiveByLicenceId(int $licenceId): int
    {
        $stmt = $this->db->prepare("
            SELECT COUNT(*) AS total FROM licence_activations 
            WHERE licence_id = :licence_id AND status = 'ACTIVE'
        ");
        $stmt->execute(['licence_id' => $licenceId]);
        $row = $stmt->fetch();
        return (int)($row['total'] ?? 0);
    }

    public function createOrUpdate(array $data): int
    {
        $existing = $this->findByLicenceAndInstallation((int)$data['licence_id'], $data['installation_id']);

        if ($existing !== null) {
            $stmt = $this->db->prepare("
                UPDATE licence_activations 
                SET fingerprint_hash = :fingerprint_hash,
                    hostname = :hostname,
                    operating_system = :operating_system,
                    app_version = :app_version,
                    ip_address = :ip_address,
                    last_validated_at = NOW(),
                    status = :status,
                    updated_at = NOW()
                WHERE id = :id
            ");
            $stmt->execute([
                'fingerprint_hash'  => $data['fingerprint_hash'],
                'hostname'          => $data['hostname'] ?? null,
                'operating_system'  => $data['operating_system'] ?? null,
                'app_version'       => $data['app_version'] ?? null,
                'ip_address'        => $data['ip_address'] ?? null,
                'status'            => $data['status'] ?? 'ACTIVE',
                'id'                => $existing['id']
            ]);
            return (int)$existing['id'];
        }

        $stmt = $this->db->prepare("
            INSERT INTO licence_activations 
            (licence_id, installation_id, fingerprint_hash, hostname, operating_system, app_version, ip_address, activated_at, last_validated_at, status)
            VALUES 
            (:licence_id, :installation_id, :fingerprint_hash, :hostname, :operating_system, :app_version, :ip_address, NOW(), NOW(), :status)
        ");

        $stmt->execute([
            'licence_id'        => $data['licence_id'],
            'installation_id'  => $data['installation_id'],
            'fingerprint_hash'  => $data['fingerprint_hash'],
            'hostname'          => $data['hostname'] ?? null,
            'operating_system'  => $data['operating_system'] ?? null,
            'app_version'       => $data['app_version'] ?? null,
            'ip_address'        => $data['ip_address'] ?? null,
            'status'            => $data['status'] ?? 'ACTIVE'
        ]);

        return (int)$this->db->lastInsertId();
    }

    public function updateStatus(int $activationId, string $status): bool
    {
        $deactivatedAt = ($status === 'DEACTIVATED') ? date('Y-m-d H:i:s') : null;
        $stmt = $this->db->prepare("
            UPDATE licence_activations 
            SET status = :status, deactivated_at = :deactivated_at, updated_at = NOW()
            WHERE id = :id
        ");
        return $stmt->execute([
            'status' => $status,
            'deactivated_at' => $deactivatedAt,
            'id' => $activationId
        ]);
    }

    public function findByLicenceId(int $licenceId): array
    {
        $stmt = $this->db->prepare("
            SELECT * FROM licence_activations 
            WHERE licence_id = :licence_id 
            ORDER BY id DESC
        ");
        $stmt->execute(['licence_id' => $licenceId]);
        return $stmt->fetchAll();
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare("
            SELECT * FROM licence_activations 
            WHERE id = :id 
            LIMIT 1
        ");
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row !== false ? $row : null;
    }
}
