<?php

declare(strict_types=1);

namespace App\Security;

use App\Config\LicenceConfig;
use App\Exceptions\LicenceException;

final class MachineFingerprint
{
    /**
     * Gets or creates permanent installation ID saved in storage/licence/installation-id.txt
     */
    public static function getInstallationId(?string $customPath = null): string
    {
        $path = $customPath ?? LicenceConfig::getInstallationIdPath();
        $directory = dirname($path);

        if (!is_dir($directory)) {
            if (!mkdir($directory, 0755, true) && !is_dir($directory)) {
                throw new LicenceException('Unable to create storage directory for installation identity.', 'STORAGE_ERROR', 500);
            }
        }

        if (file_exists($path)) {
            $content = file_get_contents($path);
            if ($content !== false && trim($content) !== '') {
                return trim($content);
            }
        }

        // Generate new permanent installation ID
        $newInstallationId = 'INST-' . bin2hex(random_bytes(16));
        $fp = fopen($path, 'c+');
        if ($fp === false) {
            throw new LicenceException('Unable to open installation ID storage file.', 'STORAGE_ERROR', 500);
        }

        try {
            if (flock($fp, LOCK_EX)) {
                ftruncate($fp, 0);
                rewind($fp);
                fwrite($fp, $newInstallationId);
                fflush($fp);
                flock($fp, LOCK_UN);
            }
        } finally {
            fclose($fp);
        }

        chmod($path, 0600);
        return $newInstallationId;
    }

    /**
     * Creates SHA-256 machine fingerprint binding installation ID + hostname + OS + Arch + productCode
     */
    public static function createMachineFingerprint(string $installationId, ?string $productCode = null): string
    {
        $pCode = $productCode ?? LicenceConfig::getProductCode();
        $hostname = gethostname() ?: 'unknown-host';
        $os = PHP_OS_FAMILY;
        $arch = php_uname('m') ?: 'x86_64';

        $source = implode('|', [
            'inst:' . $installationId,
            'host:' . strtolower(trim($hostname)),
            'os:' . strtolower($os),
            'arch:' . strtolower($arch),
            'product:' . strtoupper($pCode)
        ]);

        return hash('sha256', $source);
    }
}
