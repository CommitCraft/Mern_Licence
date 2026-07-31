<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Helpers\ApiResponse;
use App\Services\LicenceService;

final class RequireLicenceFeature
{
    private LicenceService $licenceService;

    public function __construct(?LicenceService $licenceService = null)
    {
        $this->licenceService = $licenceService ?? new LicenceService();
    }

    public function checkFeature(string $featureName, callable $next): void
    {
        $evaluation = $this->licenceService->evaluateLocalLicence();

        if (!$evaluation['valid']) {
            ApiResponse::error($evaluation['message'], $evaluation['code'], 403);
            return;
        }

        $features = $evaluation['features'] ?? [];

        if (empty($features[$featureName])) {
            ApiResponse::error(
                "Feature '{$featureName}' is not enabled in your current licence.",
                'FEATURE_NOT_LICENCED',
                403,
                ['requiredFeature' => $featureName]
            );
            return;
        }

        $next();
    }
}
