<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\LicenceException;

final class SetupStatusService
{
    private string $lockFilePath;

    public function __construct(?string $customLockPath = null)
    {
        $this->lockFilePath = $customLockPath ?? __DIR__ . '/../../storage/setup/setup.lock';
    }

    /**
     * Returns true if permanent setup lock file exists.
     */
    public function isSetupComplete(): bool
    {
        return file_exists($this->lockFilePath);
    }

    /**
     * Throws 404 / LicenceException if setup is already complete.
     */
    public function requireSetupIncomplete(): void
    {
        if ($this->isSetupComplete()) {
            throw new LicenceException('Setup is already complete and locked.', 'SETUP_ALREADY_COMPLETED', 404);
        }
    }

    /**
     * Atomically creates permanent setup lock file storage/setup/setup.lock
     */
    public function createSetupLock(array $metadata): void
    {
        $directory = dirname($this->lockFilePath);
        if (!is_dir($directory)) {
            if (!mkdir($directory, 0755, true) && !is_dir($directory)) {
                throw new LicenceException('Unable to create setup lock directory.', 'STORAGE_ERROR', 500);
            }
        }

        $lockData = [
            'installedAt'         => date('c'),
            'applicationVersion'  => $metadata['applicationVersion'] ?? '1.0.0',
            'installationId'      => $metadata['installationId'] ?? 'inst-unknown'
        ];

        $json = json_encode($lockData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        $tmpPath = $this->lockFilePath . '.tmp';

        $fp = fopen($tmpPath, 'w');
        if ($fp === false) {
            throw new LicenceException('Failed to create temporary setup lock file.', 'STORAGE_ERROR', 500);
        }

        try {
            if (flock($fp, LOCK_EX)) {
                fwrite($fp, $json);
                fflush($fp);
                flock($fp, LOCK_UN);
            }
        } finally {
            fclose($fp);
        }

        chmod($tmpPath, 0600);
        if (!rename($tmpPath, $this->lockFilePath)) {
            throw new LicenceException('Failed to rename atomic setup lock file.', 'STORAGE_ERROR', 500);
        }

        chmod($this->lockFilePath, 0600);
    }
}
