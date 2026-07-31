<?php

declare(strict_types=1);

/**
 * CLI Script: Generate One-Time Installer Token
 * 
 * Usage: php backend/scripts/generate-installer-token.php
 */

require_once __DIR__ . '/../app/Exceptions/LicenceException.php';
require_once __DIR__ . '/../app/Security/InstallerToken.php';

use App\Security\InstallerToken;

echo "==========================================================\n";
echo "  Core PHP Backend — One-Time Installer Token Generator\n";
echo "==========================================================\n\n";

$installerToken = new InstallerToken();
$token = $installerToken->generate();

echo "✓ Installer token generated and SHA-256 hash saved securely.\n\n";
echo "ONE-TIME INSTALLER TOKEN:\n";
echo "  \033[1;32m" . $token . "\033[0m\n\n";
echo "SECURITY NOTICE:\n";
echo "- Use this token in the React installation wizard at /setup.\n";
echo "- Only the SHA-256 hash is stored on disk.\n";
echo "- This token will be deleted permanently after setup completion.\n";
