<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\Permission;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\LoginRequest;
use App\Http\Resources\SignInAccountResource;
use App\Http\Resources\UserResource;
use App\Models\PersonalAccessToken;
use App\Models\Terminal;
use App\Models\User;
use App\Support\Abilities;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    private const MAX_ATTEMPTS = 5;

    /**
     * Signs a staff member in on this till and returns a bearer token bound to it. One session per
     * person per till: signing in again replaces the previous token.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $key = $request->throttleKey();
        if (RateLimiter::tooManyAttempts($key, self::MAX_ATTEMPTS)) {
            throw ValidationException::withMessages([
                'password' => sprintf('Too many attempts. Try again in %d seconds.', RateLimiter::availableIn($key)),
            ])->status(429);
        }

        $user = $request->filled('userId')
            ? User::query()->with('role')->find((int) $request->input('userId'))
            : User::query()->with('role')->whereRaw('lower(email) = ?', [mb_strtolower(trim((string) $request->input('email')))])->first();

        // Always hash-check, so a missing account takes as long as a wrong password.
        $valid = Hash::check((string) $request->input('password'), $user->password ?? '$2y$12$'.str_repeat('x', 53));
        if ($user === null || ! $valid) {
            RateLimiter::hit($key, 60);
            throw ValidationException::withMessages(['password' => 'Invalid email or password.']);
        }
        RateLimiter::clear($key);

        if (! $user->active) {
            throw ValidationException::withMessages(['password' => 'This account has been deactivated. Ask an admin to reactivate it.']);
        }
        if (! $user->hasPermission(Permission::PosAccess)) {
            throw ValidationException::withMessages(['password' => "Your role can't use the cashier screen. Use the admin console instead."]);
        }

        /** @var Terminal $terminal */
        $terminal = $request->attributes->get('terminal');
        $user->tokens()->where('terminal_id', $terminal->id)->delete();

        $plain = $user->generateTokenString();
        $expiresAt = now()->addMinutes((int) config('sanctum.expiration'));
        /** @var PersonalAccessToken $token */
        $token = $user->tokens()->create([
            'name' => 'till:'.$terminal->name,
            'token' => hash('sha256', $plain),
            'abilities' => ['pos'],
            'expires_at' => $expiresAt,
            'terminal_id' => $terminal->id,
        ]);

        return response()->json([
            'token' => $token->id.'|'.$plain,
            'expiresAt' => $expiresAt->toIso8601String(),
            'user' => UserResource::make($user)->resolve($request),
        ]);
    }

    public function me(Request $request): UserResource
    {
        /** @var User $user */
        $user = $request->user();

        return UserResource::make($user->load('role'));
    }

    /**
     * Re-checks the signed-in person's password before the till opens its own settings (server
     * address, terminal key, printer). Only roles that manage settings may; throttled like sign-in.
     */
    public function confirmPassword(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        Abilities::ensure($user, Permission::PageSettings);
        $data = $request->validate(['password' => ['required', 'string', 'max:255']]);

        $key = 'confirm-password:'.$user->id;
        if (RateLimiter::tooManyAttempts($key, self::MAX_ATTEMPTS)) {
            throw ValidationException::withMessages([
                'password' => sprintf('Too many attempts. Try again in %d seconds.', RateLimiter::availableIn($key)),
            ])->status(429);
        }
        if (! Hash::check($data['password'], $user->password)) {
            RateLimiter::hit($key, 60);
            throw ValidationException::withMessages(['password' => 'That password isn’t right.']);
        }
        RateLimiter::clear($key);

        return response()->noContent();
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json(['ok' => true]);
    }

    /**
     * Active cashier staff for the tap-your-name sign-in screen: roles that can use the till,
     * except the locked Admin role (admins sign in by email).
     */
    public function signInAccounts(): AnonymousResourceCollection
    {
        $users = User::query()
            ->active()
            ->whereHas('role', fn ($q) => $q
                ->where('locked', false)
                ->whereJsonContains('permissions', Permission::PosAccess->value))
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        return SignInAccountResource::collection($users);
    }
}
