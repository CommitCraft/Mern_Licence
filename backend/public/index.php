<?php

declare(strict_types=1);

/**
 * Main Entry Point and Router for Core PHP Backend & Central Licence Server
 */

// PSR-4 Autoloader
spl_autoload_register(function (string $class) {
    $prefix = 'App\\';
    $baseDir = __DIR__ . '/../app/';

    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    $relativeClass = substr($class, $len);
    $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';

    if (file_exists($file)) {
        require_once $file;
    }
});

use App\Controllers\CentralLicenceApiController;
use App\Controllers\LicenceAdminController;
use App\Controllers\LicenceController;
use App\Controllers\PublicConfigController;
use App\Controllers\SetupController;
use App\Helpers\ApiResponse;
use App\Helpers\Environment;
use App\Middleware\RequireLicenceFeature;
use App\Middleware\RequireValidLicence;

// Load Environment Configuration
Environment::load(__DIR__ . '/../../.env');

// Set Security & CORS Headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

// Route Handling
try {

    // --- 1. Health & Public Config Endpoints ---
    if ($uri === '/api/health') {
        ApiResponse::success([
            'status' => 'healthy',
            'time'   => date('Y-m-d H:i:s UTC')
        ], 'Licence Service API Operational');
        return;
    }

    if ($uri === '/api/public-config' && $method === 'GET') {
        $publicController = new PublicConfigController();
        $publicController->getPublicConfig();
        return;
    }

    // --- 2. First-Time Setup Wizard API Endpoints ---
    $setupController = new SetupController();

    if ($uri === '/api/setup/status' && $method === 'GET') {
        $setupController->getStatus();
        return;
    }

    if ($uri === '/api/setup/verify-token' && $method === 'POST') {
        $setupController->verifyToken();
        return;
    }

    if ($uri === '/api/setup/test-database' && $method === 'POST') {
        $setupController->testDatabase();
        return;
    }

    if ($uri === '/api/setup/test-licence-server' && $method === 'POST') {
        $setupController->testLicenceServer();
        return;
    }

    if ($uri === '/api/setup/install' && $method === 'POST') {
        $setupController->install();
        return;
    }

    // --- 3. Customer Local Licence Endpoints ---
    $customerController = new LicenceController();

    if ($uri === '/api/licence/status' && $method === 'GET') {
        $customerController->getStatus();
        return;
    }

    if ($uri === '/api/licence/activate' && $method === 'POST') {
        $customerController->activate();
        return;
    }

    if ($uri === '/api/licence/validate' && $method === 'POST') {
        $customerController->validateNow();
        return;
    }

    if ($uri === '/api/licence/deactivate' && $method === 'POST') {
        $customerController->deactivate();
        return;
    }

    // --- 4. Central Public Server Endpoints ---
    $centralController = new CentralLicenceApiController();

    if ($uri === '/api/licences/activate' && $method === 'POST') {
        $centralController->activateApi();
        return;
    }

    if ($uri === '/api/licences/validate' && $method === 'POST') {
        $centralController->validateApi();
        return;
    }

    if ($uri === '/api/licences/deactivate' && $method === 'POST') {
        $centralController->deactivateApi();
        return;
    }

    // --- 5. Central Admin Management Endpoints ---
    $adminController = new LicenceAdminController();

    if ($uri === '/api/admin/licences' && $method === 'POST') {
        $adminController->create();
        return;
    }

    if ($uri === '/api/admin/licences' && $method === 'GET') {
        $adminController->list();
        return;
    }

    if (preg_match('#^/api/admin/licences/(\d+)$#', $uri, $matches)) {
        $id = (int)$matches[1];
        if ($method === 'GET') {
            $adminController->getOne($id);
            return;
        }
        if ($method === 'PUT') {
            $adminController->update($id);
            return;
        }
    }

    if (preg_match('#^/api/admin/licences/(\d+)/activate$#', $uri, $matches) && $method === 'PATCH') {
        $adminController->activateStatus((int)$matches[1]);
        return;
    }

    if (preg_match('#^/api/admin/licences/(\d+)/suspend$#', $uri, $matches) && $method === 'PATCH') {
        $adminController->suspend((int)$matches[1]);
        return;
    }

    if (preg_match('#^/api/admin/licences/(\d+)/revoke$#', $uri, $matches) && $method === 'PATCH') {
        $adminController->revoke((int)$matches[1]);
        return;
    }

    if (preg_match('#^/api/admin/licences/(\d+)/extend$#', $uri, $matches) && $method === 'PATCH') {
        $adminController->extend((int)$matches[1]);
        return;
    }

    if (preg_match('#^/api/admin/activations/(\d+)/deactivate$#', $uri, $matches) && $method === 'PATCH') {
        $adminController->deactivateActivation((int)$matches[1]);
        return;
    }

    if (preg_match('#^/api/admin/activations/(\d+)/block$#', $uri, $matches) && $method === 'PATCH') {
        $adminController->blockActivation((int)$matches[1]);
        return;
    }

    // --- 6. Protected Application APIs (Guarded by RequireValidLicence) ---
    $licenceMiddleware = new RequireValidLicence();

    if ($uri === '/api/protected/dashboard' && $method === 'GET') {
        $licenceMiddleware->handle(function () {
            ApiResponse::success([
                'dashboard' => [
                    'systemStatus'  => 'OPERATIONAL',
                    'activeUsers'   => 14,
                    'totalMachines' => 38,
                    'metrics'       => ['efficiency' => '94.2%', 'uptime' => '99.9%']
                ]
            ], 'Protected dashboard data loaded successfully.');
        });
        return;
    }

    if ($uri === '/api/protected/machines' && $method === 'GET') {
        $licenceMiddleware->handle(function () {
            $featureMiddleware = new RequireLicenceFeature();
            $featureMiddleware->checkFeature('machineManagement', function () {
                ApiResponse::success([
                    'machines' => [
                        ['id' => 1, 'name' => 'CNC Milling Unit 01', 'status' => 'RUNNING'],
                        ['id' => 2, 'name' => 'Hydraulic Press 04', 'status' => 'MAINTENANCE'],
                        ['id' => 3, 'name' => 'Robotic Assembly Arm A', 'status' => 'RUNNING']
                    ]
                ], 'Machine management data loaded.');
            });
        });
        return;
    }

    // 404 Fallback
    ApiResponse::error("Endpoint '{$uri}' not found.", 'NOT_FOUND', 404);

} catch (\Throwable $e) {
    ApiResponse::error('Internal Server Error: ' . $e->getMessage(), 'SERVER_ERROR', 500);
}
