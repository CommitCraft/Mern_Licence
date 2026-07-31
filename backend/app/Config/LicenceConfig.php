<?php

declare(strict_types=1);

namespace App\Config;

use App\Helpers\Environment;

final class LicenceConfig
{
    public static function getProductCode(): string
    {
        return Environment::get('LICENCE_PRODUCT_CODE', 'EMS');
    }

    public static function getLicenceServerUrl(): string
    {
        return Environment::get('LICENCE_SERVER_URL', 'https://licence.example.com/api');
    }

    public static function getPublicKeyPath(): string
    {
        $defaultPath = __DIR__ . '/../../storage/licence/licence-public.key';
        return Environment::get('LICENCE_PUBLIC_KEY_PATH', $defaultPath);
    }

    public static function getPrivateKeyPath(): string
    {
        $defaultPath = __DIR__ . '/../../storage/licence/licence-private.key';
        return Environment::get('LICENCE_PRIVATE_KEY_PATH', $defaultPath);
    }

    public static function getInstallationIdPath(): string
    {
        $defaultPath = __DIR__ . '/../../storage/licence/installation-id.txt';
        return Environment::get('LICENCE_INSTALLATION_PATH', $defaultPath);
    }

    public static function getCertificatePath(): string
    {
        $defaultPath = __DIR__ . '/../../storage/licence/licence-certificate.json';
        return Environment::get('LICENCE_CERTIFICATE_PATH', $defaultPath);
    }

    public static function getValidationStatePath(): string
    {
        $defaultPath = __DIR__ . '/../../storage/licence/validation-state.json';
        return Environment::get('LICENCE_VALIDATION_STATE_PATH', $defaultPath);
    }

    public static function getValidationIntervalHours(): int
    {
        return (int)Environment::get('LICENCE_VALIDATION_INTERVAL_HOURS', '24');
    }

    public static function getOfflineGraceDays(): int
    {
        return (int)Environment::get('LICENCE_OFFLINE_GRACE_DAYS', '7');
    }

    public static function getAppVersion(): string
    {
        return Environment::get('APP_VERSION', '1.0.0');
    }
}
