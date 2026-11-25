<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Symfony\Component\HttpFoundation\Cookie;

class ValidateNotarisCsrfToken extends ValidateCsrfToken
{
    protected function newCookie($request, $config)
    {
        // Cookies are shared between ports on localhost. Give this app its own
        // token cookie while keeping Laravel's normal token verification.
        return new Cookie(
            'NOTARIS-XSRF-TOKEN',
            $request->session()->token(),
            $this->availableAt(60 * $config['lifetime']),
            $config['path'],
            $config['domain'],
            $config['secure'],
            false,
            false,
            $config['same_site'] ?? null,
            $config['partitioned'] ?? false
        );
    }
}
