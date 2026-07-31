<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Helpers\ApiResponse;
use App\Helpers\Environment;

final class PublicConfigController
{
    public function getPublicConfig(): void
    {
        $appName        = Environment::get('APP_NAME', 'Enterprise Management System');
        $appUrl         = Environment::get('APP_URL', 'https://ems-pro.aploslogix.com');
        $timezone       = Environment::get('APP_TIMEZONE', 'Asia/Kolkata');
        $productCode    = Environment::get('LICENCE_PRODUCT_CODE', 'EMS');
        $companyName    = 'ABC Manufacturing Pvt Ltd';
        $companyCode    = 'ABC';

        // Check if database has updated company settings
        try {
            $pdo = \App\Config\Database::getConnection();
            $stmt = $pdo->query("SELECT setting_key, setting_value FROM company_settings");
            if ($stmt) {
                $rows = $stmt->fetchAll();
                foreach ($rows as $row) {
                    if ($row['setting_key'] === 'company_name') $companyName = $row['setting_value'];
                    if ($row['setting_key'] === 'company_code') $companyCode = $row['setting_value'];
                }
            }
        } catch (\Throwable $e) {
            // Silence DB errors for public config fallback
        }

        ApiResponse::success([
            'appName'        => $appName,
            'appUrl'         => $appUrl,
            'companyName'    => $companyName,
            'companyCode'    => $companyCode,
            'logoUrl'        => '/assets/logo.png',
            'timezone'       => $timezone,
            'productCode'    => $productCode,
            'licenceEnabled' => true
        ], 'Public application config loaded.');
    }
}
