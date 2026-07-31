<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Config\Database;
use PDO;

final class LicenceRepository
{
    private PDO $db;

    public function __construct(?PDO $db = null)
    {
        $this->db = $db ?? Database::getConnection();
    }

    public function findByHash(string $hash): ?array
    {
        $stmt = $this->db->prepare("
            SELECT * FROM licences 
            WHERE licence_code_hash = :hash AND deleted_at IS NULL
            LIMIT 1
        ");
        $stmt::execute(['hash' => $hash]);
        $row = $stmt->fetch();
        return $row !== false ? $row : null;
    }

    public function findByHashForUpdate(string $hash): ?array
    {
        $stmt = $this->db->prepare("
            SELECT * FROM licences 
            WHERE licence_code_hash = :hash AND deleted_at IS NULL
            LIMIT 1 FOR UPDATE
        ");
        $stmt->execute(['hash' => $hash]);
        $row = $stmt->fetch();
        return $row !== false ? $row : null;
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare("
            SELECT * FROM licences 
            WHERE id = :id AND deleted_at IS NULL
            LIMIT 1
        ");
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row !== false ? $row : null;
    }

    public function findByReference(string $reference): ?array
    {
        $stmt = $this->db->prepare("
            SELECT * FROM licences 
            WHERE licence_reference = :ref AND deleted_at IS NULL
            LIMIT 1
        ");
        $stmt->execute(['ref' => $reference]);
        $row = $stmt->fetch();
        return $row !== false ? $row : null;
    }

    public function create(array $data): int
    {
        $stmt = $this->db->prepare("
            INSERT INTO licences 
            (licence_code_hash, licence_reference, customer_name, customer_email, company_name, product_code, licence_type, max_activations, features, issued_at, expires_at, status)
            VALUES 
            (:licence_code_hash, :licence_reference, :customer_name, :customer_email, :company_name, :product_code, :licence_type, :max_activations, :features, :issued_at, :expires_at, :status)
        ");

        $stmt->execute([
            'licence_code_hash' => $data['licence_code_hash'],
            'licence_reference' => $data['licence_reference'],
            'customer_name'     => $data['customer_name'],
            'customer_email'    => $data['customer_email'],
            'company_name'      => $data['company_name'],
            'product_code'      => $data['product_code'],
            'licence_type'      => $data['licence_type'],
            'max_activations'   => $data['max_activations'] ?? 1,
            'features'          => is_array($data['features']) ? json_encode($data['features']) : $data['features'],
            'issued_at'         => $data['issued_at'] ?? date('Y-m-d H:i:s'),
            'expires_at'        => $data['expires_at'] ?? null,
            'status'            => $data['status'] ?? 'ACTIVE'
        ]);

        return (int)$this->db->lastInsertId();
    }

    public function updateStatus(int $id, string $status): bool
    {
        $stmt = $this->db->prepare("
            UPDATE licences 
            SET status = :status, updated_at = NOW()
            WHERE id = :id AND deleted_at IS NULL
        ");
        return $stmt->execute(['status' => $status, 'id' => $id]);
    }

    public function updateExpiry(int $id, ?string $expiresAt): bool
    {
        $stmt = $this->db->prepare("
            UPDATE licences 
            SET expires_at = :expires_at, updated_at = NOW()
            WHERE id = :id AND deleted_at IS NULL
        ");
        return $stmt->execute(['expires_at' => $expiresAt, 'id' => $id]);
    }

    public function updateFeatures(int $id, array $features): bool
    {
        $stmt = $this->db->prepare("
            UPDATE licences 
            SET features = :features, updated_at = NOW()
            WHERE id = :id AND deleted_at IS NULL
        ");
        return $stmt->execute(['features' => json_encode($features), 'id' => $id]);
    }

    public function findAll(array $filters = []): array
    {
        $sql = "SELECT * FROM licences WHERE deleted_at IS NULL";
        $params = [];

        if (!empty($filters['status'])) {
            $sql .= " AND status = :status";
            $params['status'] = $filters['status'];
        }

        if (!empty($filters['product_code'])) {
            $sql .= " AND product_code = :product_code";
            $params['product_code'] = $filters['product_code'];
        }

        if (!empty($filters['search'])) {
            $sql .= " AND (customer_name LIKE :search OR company_name LIKE :search OR licence_reference LIKE :search OR customer_email LIKE :search)";
            $params['search'] = '%' . $filters['search'] . '%';
        }

        $sql .= " ORDER BY id DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function beginTransaction(): void
    {
        $this->db->beginTransaction();
    }

    public function commit(): void
    {
        $this->db->commit();
    }

    public function rollBack(): void
    {
        if ($this->db->inTransaction()) {
            $this->db->rollBack();
        }
    }
}
