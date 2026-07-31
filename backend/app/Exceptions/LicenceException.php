<?php

declare(strict_types=1);

namespace App\Exceptions;

use Exception;

class LicenceException extends Exception
{
    private string $errorCode;
    private array $details;

    public function __construct(string $message, string $errorCode = 'LICENCE_ERROR', int $code = 400, array $details = [])
    {
        parent::__construct($message, $code);
        $this->errorCode = $errorCode;
        $this->details = $details;
    }

    public function getErrorCode(): string
    {
        return $this->errorCode;
    }

    public function getDetails(): array
    {
        return $this->details;
    }
}
