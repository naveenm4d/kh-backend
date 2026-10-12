<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * The web console is for active staff whose role opens at least one admin page. Anyone else is
 * signed out (a cashier-only account has nothing to do here).
 */
class EnsureAdminAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        /** @var User|null $user */
        $user = $request->user();
        if ($user !== null && ! $user->canUseAdmin()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')->withErrors([
                'email' => "This account can't use the admin console.",
            ]);
        }

        return $next($request);
    }
}
