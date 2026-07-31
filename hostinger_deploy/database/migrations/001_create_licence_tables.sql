-- Forward Migration: Create Licence Tables
-- Engine: InnoDB, Charset: utf8mb4

CREATE TABLE IF NOT EXISTS `licences` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `licence_code_hash` VARCHAR(64) NOT NULL,
    `licence_reference` VARCHAR(32) NOT NULL,
    `customer_name` VARCHAR(255) NOT NULL,
    `customer_email` VARCHAR(255) NOT NULL,
    `company_name` VARCHAR(255) NOT NULL,
    `product_code` VARCHAR(50) NOT NULL,
    `licence_type` ENUM('TRIAL', 'ANNUAL', 'LIFETIME', 'ENTERPRISE') NOT NULL DEFAULT 'TRIAL',
    `max_activations` INT UNSIGNED NOT NULL DEFAULT 1,
    `features` JSON NOT NULL,
    `issued_at` DATETIME NOT NULL,
    `expires_at` DATETIME NULL,
    `status` ENUM('ACTIVE', 'SUSPENDED', 'EXPIRED', 'REVOKED') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` DATETIME NULL,
    UNIQUE KEY `uk_licence_code_hash` (`licence_code_hash`),
    UNIQUE KEY `uk_licence_reference` (`licence_reference`),
    INDEX `idx_licences_status` (`status`),
    INDEX `idx_licences_product` (`product_code`),
    INDEX `idx_licences_expires_at` (`expires_at`),
    INDEX `idx_licences_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `licence_activations` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `licence_id` BIGINT UNSIGNED NOT NULL,
    `installation_id` VARCHAR(64) NOT NULL,
    `fingerprint_hash` VARCHAR(64) NOT NULL,
    `hostname` VARCHAR(255) NULL,
    `operating_system` VARCHAR(100) NULL,
    `app_version` VARCHAR(50) NULL,
    `ip_address` VARCHAR(45) NULL,
    `activated_at` DATETIME NOT NULL,
    `last_validated_at` DATETIME NOT NULL,
    `deactivated_at` DATETIME NULL,
    `status` ENUM('ACTIVE', 'DEACTIVATED', 'BLOCKED') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_activations_licence` FOREIGN KEY (`licence_id`) REFERENCES `licences` (`id`) ON DELETE CASCADE,
    UNIQUE KEY `uk_licence_installation` (`licence_id`, `installation_id`),
    INDEX `idx_activations_fingerprint` (`fingerprint_hash`),
    INDEX `idx_activations_status` (`status`),
    INDEX `idx_activations_installation` (`installation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `licence_audit_logs` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `licence_id` BIGINT UNSIGNED NULL,
    `activation_id` BIGINT UNSIGNED NULL,
    `action` VARCHAR(50) NOT NULL,
    `description` TEXT NULL,
    `ip_address` VARCHAR(45) NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_audit_licence` FOREIGN KEY (`licence_id`) REFERENCES `licences` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_audit_activation` FOREIGN KEY (`activation_id`) REFERENCES `licence_activations` (`id`) ON DELETE SET NULL,
    INDEX `idx_audit_licence_id` (`licence_id`),
    INDEX `idx_audit_action` (`action`),
    INDEX `idx_audit_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
