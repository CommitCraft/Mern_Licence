<?php

declare(strict_types=1);

namespace App\Security;

use App\Exceptions\LicenceException;

final class InstallerToken
{
    private string $hashFilePath;
    private string $rateLimitPath;

    public function __construct(?string $customHashPath = null)
    {
        $this->hashFilePath = $customHashPath ?? __DIR__ . '/../../storage/setup/installer-token.hash';
        $this->rateLimitPath = __DIR__ . '/../../storage/setup/token-rate-limit.json';
    }

    /**
     * Generates a new 32-byte hex token and saves only its SHA-256 hash to disk.
     */
    public function generate(): string
    {
        $dir = dirname($this->hashFilePath);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $rawToken = bin2hex(random_bytes(32));
        $hash = hash('sha256', $rawToken);

        file_put_contents($this->hashFilePath, $hash);
        chmod($this->hashFilePath, 0600);

        return $rawToken;
    }

    /**
     * Validates submitted installer token using constant-time hash comparison and rate limiting.
     */
    public function validate(string $token): bool
    {
        $this->checkRateLimit();

        if (!file_exists($this->hashFilePath)) {
            $this->recordFailedAttempt();
            return false;
        }

        $storedHash = trim((string)file_get_contents($this->hashFilePath));
        $submittedHash = hash('sha256', trim($token));

        $valid = hash_equals($storedHash, $submittedHash);

        if (!$valid) {
            $this->recordFailedAttempt();
        } else {
            $this->clearRateLimit();
        }

        return $valid;
    }

    /**
     * Deletes the installer token hash file after successful setup completion.
     */
    public function destroy(): void
    {
        if (file_exists($this->hashFilePath)) {
            @unlink($this->hashFilePath);
        }
        if (file_exists($this->rateLimitPath)) {
            @unlink($this->rateLimitPath);
        }
    }

    private function checkRateLimit(): void
    {
        $clientIp = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        if (!file_exists($this->rateLimitPath)) {
            return;
        }

        $data = json_decode((string)file_get_contents($this->rateLimitPath), true);
        if (!is_array($data)) {
            return;
        }

        $attempts = $data[$clientIp] ?? null;
        if ($attempts !== null) {
            $count = (int)($attempts['count'] ?? 0);
            $lastTime = (int)($attempts['lastTime'] ?? 0);
            
            // Block if more than 5 attempts within 15 minutes
            if ($count >= 5 && (time() - $lastTime) < 900) {
                $remaining = 900 - (time() - $lastTime);
                throw new LicenceException(
                    "Too many failed installer token attempts. Try again in {$remaining} seconds.",
                    'RATE_LIMIT_EXCEEDED',
                    429
                );
            }

            // Reset after 15 minutes
            if ((time() - $lastTime) >= 900) {
                unset($data[$clientIp]);
                file_put_contents($this->rateLimitPath, json_encode($data));
            }
        }
    }

    private function recordFailedAttempt(): void
    {
        $clientIp = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        $data = file_exists($this->rateLimitPath) ? json_decode((string)file_get_contents($this->rateLimitPath), true) : [];
        if (!is_array($data)) {
            $data = [];
        }

        $count = (int)($data[$clientIp]['count'] ?? 0);
        $data[$clientIp] = [
            'count' => $count + 1,
            'lastTime' => time()
        ];

        file_put_contents($this->rateLimitPath, json_encode($data));
    }

    private function clearRateLimit(): void
    {
        $clientIp = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        if (file_exists($this->rateLimitPath)) {
            $data = json_decode((string)file_get_contents($this->rateLimitPath), true);
            if (is_array($data) && isset($data[$clientIp])) {
                unset($data[$clientIp]);
                file_put_contents($this->rateLimitPath, json_encode($data));
            }
        }
    }
}
