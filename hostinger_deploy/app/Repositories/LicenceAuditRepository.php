<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Config\Database;
use PDO;

final class LicenceAuditRepository
{
    private PDO $db;

    public function __construct(?PDO $db = null)
    {
        $this->db = $db ?? Database::getConnection();
    }

    public function log(?int $licenceId, ?int $activationId, string $action, ?string $description = null, ?string $ipAddress = null, ?array $metadata = null): int
    {
        $stmt = $this->db->prepare("
            INSERT INTO licence_audit_logs 
            (licence_id, activation_id, action, description, ip_address, metadata, created_at)
            VALUES 
            (:licence_id, :activation_id, :action, :description, :ip_address, :metadata, NOW())
        ");

        $stmt->execute([
            'licence_id'    => $licenceId,
            'activation_id' => $activationId,
            'action'        => $action,
            'description'   => $description,
            'ip_address'    => $ipAddress ?? ($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'),
            'metadata'      => $metadata !== null ? json_encode($metadata) : null
        ]);

        return (int)$this->db->lastInsertId();
    }

    public function findByLicenceId(int $licenceId, int $limit = 100): array
    {
        $stmt = $this->db->prepare("
            SELECT * FROM licence_audit_logs 
            WHERE licence_id = :licence_id 
            ORDER BY id DESC 
            LIMIT :limit
        ");
        $stmt->bindValue(':licence_id', $licenceId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }
}
