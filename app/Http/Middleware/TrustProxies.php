<?php

namespace App\Http\Middleware;

use Illuminate\Http\Middleware\TrustProxies as Middleware;

/** Trusts the proxies listed in config('app.trusted_proxies'), which survives config caching. */
class TrustProxies extends Middleware
{
    /** @return array<int, string>|string|null */
    protected function proxies()
    {
        $proxies = config('app.trusted_proxies');
        if (! is_string($proxies) || $proxies === '') {
            return null;
        }

        return $proxies === '*' ? '*' : array_map('trim', explode(',', $proxies));
    }
}
