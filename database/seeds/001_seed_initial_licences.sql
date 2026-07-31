-- Seed Initial Licences for Testing
-- Note: licence_code_hash stores SHA-256 hash of normalized keys (uppercase, alphanumeric only)
-- Key 1: EMS-PRO-ABCD-EFGH-JKLM-NPQR -> Hash of EMSPROABCDEFGHJKLMNPQR
-- Key 2: EMS-PRO-TEST-ANNU-AL20-2600 -> Hash of EMSPROTESTANNUAL202600
-- Key 3: EMS-PRO-LIFE-TIME-PERP-ETUAL -> Hash of EMSPROLIFETIMEPERPETUAL

INSERT INTO `licences` 
(`id`, `licence_code_hash`, `licence_reference`, `customer_name`, `customer_email`, `company_name`, `product_code`, `licence_type`, `max_activations`, `features`, `issued_at`, `expires_at`, `status`)
VALUES
(1, SHA2('EMSPROABCDEFGHJKLMNPQR', 256), 'LIC-2026-000001', 'Acme Corp Admin', 'admin@acme.com', 'Acme Corporation', 'EMS', 'ANNUAL', 3, 
 JSON_OBJECT('machineManagement', true, 'preventiveMaintenance', true, 'energyMonitoring', true, 'maxUsers', 20, 'maxMachines', 50),
 NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), 'ACTIVE'),

(2, SHA2('EMSPROTESTANNUAL202600', 256), 'LIC-2026-000002', 'Global Tech', 'tech@globaltech.io', 'Global Tech Inc', 'EMS', 'ENTERPRISE', 10, 
 JSON_OBJECT('machineManagement', true, 'preventiveMaintenance', true, 'energyMonitoring', true, 'analytics', true, 'maxUsers', 500, 'maxMachines', 1000),
 NOW(), DATE_ADD(NOW(), INTERVAL 2 YEAR), 'ACTIVE'),

(3, SHA2('EMSPROLIFETIMEPERPETUAL', 256), 'LIC-2026-000003', 'Apex Solutions', 'contact@apex.com', 'Apex Solutions LLC', 'EMS', 'LIFETIME', 5, 
 JSON_OBJECT('machineManagement', true, 'preventiveMaintenance', true, 'energyMonitoring', true, 'maxUsers', 100, 'maxMachines', 200),
 NOW(), NULL, 'ACTIVE');
