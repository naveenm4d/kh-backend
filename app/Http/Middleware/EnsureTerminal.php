<?php

namespace App\Http\Middleware;

use App\Models\Terminal;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * The POS API only answers registered, un-revoked tills (X-Terminal-Key). When a staff token is
 * present it must have been issued on this same till, so a token copied elsewhere is useless.
 */
class EnsureTerminal
{
    public const HEADER = 'X-Terminal-Key';

    public function handle(Request $request, Closure $next): Response
    {
        $terminal = Terminal::findByKey($request->header(self::HEADER));
        if ($terminal === null || ! $terminal->isActive()) {
            return response()->json(['message' => 'This till is not registered. Ask an admin for a terminal key.'], 403);
        }

        $token = $request->user('sanctum')?->currentAccessToken();
        if ($token !== null && (int) ($token->terminal_id ?? 0) !== $terminal->id) {
            return response()->json(['message' => 'Your session expired. Sign in again.'], 401);
        }

        // Throttled so a busy till doesn't write on every request.
        if ($terminal->last_seen_at === null || $terminal->last_seen_at->lt(now()->subMinute())) {
            $terminal->forceFill(['last_seen_at' => now(), 'last_ip' => $request->ip()])->saveQuietly();
        }

        $request->attributes->set('terminal', $terminal);

        return $next($request);
    }
}
