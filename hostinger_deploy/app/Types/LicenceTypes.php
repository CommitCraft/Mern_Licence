<?php

declare(strict_types=1);

namespace App\Types;

final class LicenceTypes
{
    // Licence Types
    public const TYPE_TRIAL = 'TRIAL';
    public const TYPE_ANNUAL = 'ANNUAL';
    public const TYPE_LIFETIME = 'LIFETIME';
    public const TYPE_ENTERPRISE = 'ENTERPRISE';

    public const ALL_TYPES = [
        self::TYPE_TRIAL,
        self::TYPE_ANNUAL,
        self::TYPE_LIFETIME,
        self::TYPE_ENTERPRISE,
    ];

    // Licence Statuses
    public const STATUS_ACTIVE = 'ACTIVE';
    public const STATUS_SUSPENDED = 'SUSPENDED';
    public const STATUS_EXPIRED = 'EXPIRED';
    public const STATUS_REVOKED = 'REVOKED';

    public const ALL_STATUSES = [
        self::STATUS_ACTIVE,
        self::STATUS_SUSPENDED,
        self::STATUS_EXPIRED,
        self::STATUS_REVOKED,
    ];

    // Activation Statuses
    public const ACTIVATION_ACTIVE = 'ACTIVE';
    public const ACTIVATION_DEACTIVATED = 'DEACTIVATED';
    public const ACTIVATION_BLOCKED = 'BLOCKED';

    // Status Codes for Frontend / Client API
    public const CODE_LICENCE_VALID = 'LICENCE_VALID';
    public const CODE_LICENCE_REQUIRED = 'LICENCE_REQUIRED';
    public const CODE_LICENCE_EXPIRED = 'LICENCE_EXPIRED';
    public const CODE_LICENCE_SUSPENDED = 'LICENCE_SUSPENDED';
    public const CODE_LICENCE_REVOKED = 'LICENCE_REVOKED';
    public const CODE_INVALID_SIGNATURE = 'INVALID_SIGNATURE';
    public const CODE_INSTALLATION_MISMATCH = 'INSTALLATION_MISMATCH';
    public const CODE_FINGERPRINT_MISMATCH = 'FINGERPRINT_MISMATCH';
    public const CODE_ONLINE_VALIDATION_REQUIRED = 'ONLINE_VALIDATION_REQUIRED';
    public const CODE_CLOCK_ROLLBACK_DETECTED = 'CLOCK_ROLLBACK_DETECTED';
}
