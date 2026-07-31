<?php

declare(strict_types=1);

/**
 * CLI Script: Generate Ed25519 Signing Keys via PHP Sodium Extension
 * 
 * Usage: php backend/scripts/generate-licence-keys.php
 */

require_once __DIR__ . '/../app/Helpers/Environment.php';
require_once __DIR__ . '/../app/Config/LicenceConfig.php';

use App\Config\LicenceConfig;
use App\Helpers\Environment;

Environment::load(__DIR__ . '/../../.env');

echo "==========================================================\n";
echo "  Core PHP Licence System — Ed25519 Key Generator\n";
echo "==========================================================\n\n";

if (!function_exists('sodium_crypto_sign_keypair')) {
    echo "ERROR: PHP Sodium extension is NOT enabled or installed!\n";
    echo "Please enable 'extension=sodium' in your php.ini file.\n";
    exit(1);
}

// Generate Ed25519 Keypair
$keypair   = sodium_crypto_sign_keypair();
$secretKey = sodium_crypto_sign_secretkey($keypair);
$publicKey = sodium_crypto_sign_publickey($keypair);

// Test signing & verification
$testMsg   = "Ed25519_LICENCE_SIGNATURE_VERIFICATION_TEST";
$signature = sodium_crypto_sign_detached($testMsg, $secretKey);
$valid     = sodium_crypto_sign_verify_detached($signature, $testMsg, $publicKey);

if (!$valid) {
    echo "ERROR: Generated Ed25519 keypair signature verification failed!\n";
    exit(1);
}

echo "✓ Ed25519 keypair successfully generated and cryptographically verified.\n\n";

$secretKeyHex = bin2hex($secretKey);
$publicKeyHex = bin2hex($publicKey);

$privateKeyPath = LicenceConfig::getPrivateKeyPath();
$publicKeyPath  = LicenceConfig::getPublicKeyPath();

// Ensure storage directories exist
@mkdir(dirname($privateKeyPath), 0755, true);
@mkdir(dirname($publicKeyPath), 0755, true);

// Save secret key (ONLY for Central Licence Server)
file_put_contents($privateKeyPath, $secretKeyHex);
chmod($privateKeyPath, 0600);
echo "✓ Private Secret Key saved to: {$privateKeyPath}\n";

// Save public key (For Customer Backend verification)
file_put_contents($publicKeyPath, $publicKeyHex);
chmod($publicKeyPath, 0644);
echo "✓ Public Verification Key saved to: {$publicKeyPath}\n\n";

echo "Public Key (Hex):  " . $publicKeyHex . "\n";
echo "Secret Key (Hex):  [PROTECTED - Hidden for security]\n\n";

echo "SECURITY NOTICE:\n";
echo "- Keep the private key ONLY on the Central Licence Server.\n";
echo "- Distribute ONLY the public key to Customer Backend installations.\n";
echo "- NEITHER key should ever be served over web or embedded in React!\n";
