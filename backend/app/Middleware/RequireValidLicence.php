<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Helpers\ApiResponse;
use App\Services\LicenceService;

final class RequireValidLicence
{
    private LicenceService $licenceService;

    public function __construct(?LicenceService $licenceService = null)
    {
        $this->licenceService = $licenceService ?? new LicenceService();
    }

    public function handle(callable $next): void
    {
        $uri = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
        
        // Exclude public endpoints
        $publicRoutes = [
            '/api/auth/login',
            '/api/licence/activate',
            '/api/licence/status',
            '/api/licence/validate',
            '/api/health'
        ];

        foreach ($publicRoutes as $publicRoute) {
            if ($uri === $publicRoute || str_starts_with($uri, '/api/admin/')) {
                // Admin API routes handle their own admin authentication / licensing checks
                if ($uri !== '/api/licence/status' && !str_starts_with($uri, '/api/admin/')) {
                    $next();
                    return;
                }
            }
        }

        $evaluation = $this->licenceService->evaluateLocalLicence();

        if (!$evaluation['valid']) {
            ApiResponse::error(
                $evaluation['message'],
                $evaluation['code'],
                403,
                ['licence' => $evaluation]
            );
            return;
        }

        // Attach features to request context if needed
        $_REQUEST['LICENCE_FEATURES'] = $evaluation['features'] ?? [];

        $next();
    }
}
