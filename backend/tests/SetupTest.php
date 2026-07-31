<?php

declare(strict_types=1);

/**
 * Automated CLI Test Suite for Installation Wizard Security & Engine
 * Run with: php backend/tests/SetupTest.php
 */

require_once __DIR__ . '/../app/Helpers/Environment.php';
require_once __DIR__ . '/../app/Exceptions/LicenceException.php';
require_once __DIR__ . '/../app/Security/InstallerToken.php';
require_once __DIR__ . '/../app/Services/SetupStatusService.php';
require_once __DIR__ . '/../app/Services/EnvironmentWriter.php';

use App\Exceptions\LicenceException;
use App\Security\InstallerToken;
use App\Services\EnvironmentWriter;
use App\Services\SetupStatusService;

echo "==========================================================\n";
echo "  Installation Wizard Engine — Security & Atomic Tests\n";
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

$tmpDir = __DIR__ . '/../storage/test_setup_' . bin2hex(random_bytes(4));
@mkdir($tmpDir, 0755, true);

$testLockPath = $tmpDir . '/setup.lock';
$testHashPath = $tmpDir . '/installer-token.hash';
$testEnvPath  = $tmpDir . '/.env';

// 1. Setup Status & Lock File Tests
$statusService = new SetupStatusService($testLockPath);
assertTest($statusService->isSetupComplete() === false, 'Setup incomplete state before lock file');

$statusService->createSetupLock(['applicationVersion' => '1.0.0', 'installationId' => 'INST-TEST-LOCK']);
assertTest($statusService->isSetupComplete() === true, 'Setup lock file creation & detection');
assertTest(file_exists($testLockPath), 'setup.lock existence on disk');

$lockContent = json_decode((string)file_get_contents($testLockPath), true);
assertTest(isset($lockContent['installedAt']) && isset($lockContent['installationId']), 'setup.lock non-sensitive structure');

$reentrancyBlocked = false;
try {
    $statusService->requireSetupIncomplete();
} catch (LicenceException $e) {
    $reentrancyBlocked = ($e->getErrorCode() === 'SETUP_ALREADY_COMPLETED');
}
assertTest($reentrancyBlocked, 'Re-entrancy blocked after setup lock file creation');

// 2. Installer Token Hashing & Rate Limiting Tests
$installerToken = new InstallerToken($testHashPath);
$rawToken = $installerToken->generate();
assertTest(strlen($rawToken) === 64, 'Raw installer token 32-byte hex string length');
assertTest(file_exists($testHashPath), 'installer-token.hash file creation');

$hashOnDisk = trim((string)file_get_contents($testHashPath));
assertTest($hashOnDisk !== $rawToken, 'Plaintext installer token NEVER stored on disk');
assertTest($hashOnDisk === hash('sha256', $rawToken), 'Installer token SHA-256 hash match');

$validCheck = $installerToken->validate($rawToken);
assertTest($validCheck === true, 'Constant-time token validation success');

$invalidCheck = $installerToken->validate('INVALID_TOKEN_STRING_123456');
assertTest($invalidCheck === false, 'Invalid installer token rejection');

$installerToken->destroy();
assertTest(!file_exists($testHashPath), 'Installer token hash deletion after setup completion');

// 3. Environment Writer Atomic Write & Secret Escaping Tests
$envWriter = new EnvironmentWriter($testEnvPath);
$builtContent = $envWriter->build([
    'APP_NAME'     => 'EMS "Pro" System',
    'APP_URL'      => 'https://ems-pro.aploslogix.com',
    'DB_PASSWORD'  => 'Pass#Word:With=Special$Chars',
    'APP_KEY'      => 'base64:TestRandomSecretKeyBytes1234567890=',
    'SETUP_COMPLETED' => 'true'
]);

assertTest(str_contains($builtContent, 'APP_NAME="EMS \"Pro\" System"'), 'Environment writer string quote escaping');
assertTest(str_contains($builtContent, 'DB_PASSWORD="Pass#Word:With=Special\$Chars"'), 'Environment writer password special character escaping');

$envWriter->writeAtomically($builtContent);
assertTest(file_exists($testEnvPath), 'Atomic .env file creation');
assertTest(file_get_contents($testEnvPath) === $builtContent, 'Atomic .env content verification');

// Cleanup test folder
@unlink($testLockPath);
@unlink($testEnvPath);
@rmdir($tmpDir);

echo "\n----------------------------------------------------------\n";
echo "Test Results: {$passed} Passed, {$failed} Failed.\n";
echo "----------------------------------------------------------\n";

if ($failed > 0) {
    exit(1);
}
