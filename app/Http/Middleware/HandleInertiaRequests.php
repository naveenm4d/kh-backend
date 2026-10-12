<?php

namespace App\Http\Middleware;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default. Only what the UI needs about the signed-in
     * person goes to the browser: never the password hash, 2FA secrets or tokens.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        /** @var User|null $user */
        $user = $request->user();

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user === null ? null : [
                    'id' => (string) $user->id,
                    'name' => $user->name,
                    'code' => $user->code,
                    'email' => $user->email,
                    'roleName' => $user->role->name,
                    'initials' => $user->initials,
                    'permissions' => $user->permissions(),
                    'twoFactorEnabled' => $user->two_factor_confirmed_at !== null,
                ],
            ],
        ];
    }
}
