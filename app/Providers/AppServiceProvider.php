<?php

namespace App\Providers;

use App\Enums\Permission;
use App\Models\PersonalAccessToken;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Laravel\Sanctum\Sanctum;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureAuthorization();
        $this->configureApiTokens();
        $this->configureRateLimiting();
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        // Lazy loading, silently dropped attributes and missing attributes are bugs; fail loudly
        // outside production.
        Model::shouldBeStrict(! app()->isProduction());

        JsonResource::withoutWrapping();

        DB::prohibitDestructiveCommands(app()->isProduction());

        if (app()->isProduction()) {
            URL::forceScheme('https');
        }

        Password::defaults(fn (): Password => app()->isProduction()
            ? Password::min(8)->letters()->numbers()->uncompromised()
            : Password::min(8),
        );
    }

    /**
     * Each permission is a Gate ability (for `can:` route middleware and policies). Inactive
     * accounts can do nothing; a locked role can do everything.
     */
    protected function configureAuthorization(): void
    {
        foreach (Permission::cases() as $permission) {
            Gate::define($permission->value, fn (User $user) => $user->hasPermission($permission));
        }

        // Reading customers (balances, contacts) and bills in the console: the pages that show them.
        Gate::define('view-sales', fn (User $user) => collect([
            Permission::PageCustomers, Permission::PageOrders, Permission::PageDashboard, Permission::PageReports,
        ])->contains(fn (Permission $p) => $user->hasPermission($p)));
    }

    /**
     * Till tokens stay valid only while the staff member is active and the till they were issued on
     * hasn't been revoked.
     */
    protected function configureApiTokens(): void
    {
        Sanctum::usePersonalAccessTokenModel(PersonalAccessToken::class);

        Sanctum::authenticateAccessTokensUsing(function (PersonalAccessToken $token, bool $isValid): bool {
            if (! $isValid) {
                return false;
            }
            $user = $token->tokenable;

            return $user instanceof User
                && $user->active
                && ($token->terminal_id === null || ($token->terminal?->isActive() ?? false));
        });
    }

    protected function configureRateLimiting(): void
    {
        // Unauthenticated till endpoints (sign-in list, login): per till and per IP.
        RateLimiter::for('pos-public', fn (Request $request) => [
            Limit::perMinute(30)->by('pos-public-ip|'.$request->ip()),
            Limit::perMinute(30)->by('pos-public-key|'.hash('sha256', (string) $request->header('X-Terminal-Key'))),
        ]);

        // Signed-in tills: generous, since each till also polls the sync endpoints.
        RateLimiter::for('pos', fn (Request $request) => Limit::perMinute(300)
            ->by('pos|'.($request->user()?->getAuthIdentifier() ?? $request->ip())));

        RateLimiter::for('admin-api', fn (Request $request) => Limit::perMinute(600)
            ->by('admin|'.($request->user()?->getAuthIdentifier() ?? $request->ip())));
    }
}
