<?php

declare(strict_types=1);

/**
 * Automated CLI Unit & Cryptographic Test Suite for Licence Engine
 * Run with: php backend/tests/LicenceTest.php
 */

require_once __DIR__ . '/../app/Helpers/Environment.php';
require_once __DIR__ . '/../app/Types/LicenceTypes.php';
require_once __DIR__ . '/../app/Config/LicenceConfig.php';
require_once __DIR__ . '/../app/Exceptions/LicenceException.php';
require_once __DIR__ . '/../app/Security/LicenceKeyGenerator.php';
require_once __DIR__ . '/../app/Security/LicenceSigner.php';
require_once __DIR__ . '/../app/Security/LicenceVerifier.php';
require_once __DIR__ . '/../app/Security/MachineFingerprint.php';
require_once __DIR__ . '/../app/Services/LicenceCertificateService.php';

use App\Config\LicenceConfig;
use App\Security\LicenceKeyGenerator;
use App\Security\LicenceSigner;
use App\Security\LicenceVerifier;
use App\Security\MachineFingerprint;
use App\Services\LicenceCertificateService;

echo "==========================================================\n";
echo "  Licence Engine — Cryptographic & Functional Test Suite\n";
echo "==========================================================\n\n";

$passed = 0;
$failed = 0;

function assertTest(bool $condition, string $testName): void
{
    global $passed, $failed;
    if ($condition) {
        echo " [PASS] {$testName}\n";
        $passed++;
    } else {
        echo " [FAIL] {$testName}\n";
        $failed++;
    }
}

// 1. Licence Key Generation & Hashing Tests
$key = LicenceKeyGenerator::generateLicenceKey('EMS-PRO');
assertTest(str_starts_with($key, 'EMS-PRO-'), 'Licence key generation prefix check');
assertTest(strlen($key) === 27, 'Licence key length format check');

$normalized = LicenceKeyGenerator::normalizeLicenceKey($key);
$hash1 = LicenceKeyGenerator::hashLicenceKey($key);
$hash2 = LicenceKeyGenerator::hashLicenceKey($normalized);
assertTest($hash1 === $hash2, 'Licence key normalization consistency');
assertTest(strlen($hash1) === 64, 'Licence key SHA-256 hash length check');

// 2. Machine Fingerprint & Installation ID Tests
$testInstId = 'INST-TEST-1234567890ABCDEF';
$fp1 = MachineFingerprint::createMachineFingerprint($testInstId, 'EMS');
$fp2 = MachineFingerprint::createMachineFingerprint($testInstId, 'EMS');
assertTest($fp1 === $fp2, 'Machine fingerprint determinism');
assertTest(strlen($fp1) === 64, 'Machine fingerprint SHA-256 length check');

// 3. Sodium Ed25519 Cryptographic Signing & Verification Tests
assertTest(function_exists('sodium_crypto_sign_keypair'), 'Sodium extension availability');

$keypair   = sodium_crypto_sign_keypair();
$secretKey = sodium_crypto_sign_secretkey($keypair);
$publicKey = sodium_crypto_sign_publickey($keypair);

$licenceRow = [
    'id'                => 101,
    'licence_reference' => 'LIC-2026-TEST01',
    'product_code'      => 'EMS',
    'licence_type'      => 'ANNUAL',
    'customer_name'     => 'Test Customer',
    'company_name'      => 'Test Corp',
    'features'          => ['machineManagement' => true, 'maxUsers' => 5],
    'issued_at'         => '2026-01-01 00:00:00',
    'expires_at'        => '2027-01-01 00:00:00'
];

$certificate = LicenceCertificateService::createSignedCertificate($licenceRow, $testInstId, $fp1, $secretKey);
assertTest(isset($certificate['payload']) && isset($certificate['signature']), 'Certificate creation structure');

$verified = LicenceVerifier::verifyPayload($certificate['payload'], $certificate['signature'], $publicKey);
assertTest($verified === true, 'Ed25519 signature verification on authentic certificate');

// 4. Certificate Tampering Detection Test
$tamperedPayload = $certificate['payload'];
$tamperedPayload['customerName'] = 'Tampered Customer Name';
$tamperedVerified = LicenceVerifier::verifyPayload($tamperedPayload, $certificate['signature'], $publicKey);
assertTest($tamperedVerified === false, 'Ed25519 tampering detection (altered customer name)');

// Summary
echo "\n----------------------------------------------------------\n";
echo "Test Results: {$passed} Passed, {$failed} Failed.\n";
echo "----------------------------------------------------------\n";

if ($failed > 0) {
    exit(1);
}
