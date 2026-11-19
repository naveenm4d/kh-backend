<?php

namespace App\Models;

use App\Enums\Permission;
use Carbon\CarbonImmutable;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Laravel\Sanctum\HasApiTokens;

/**
 * A staff member. Cashiers sign in on a registered till (API tokens); anyone with an admin page
 * permission can also sign in to the web console (session).
 *
 * @property int $id
 * @property string $name
 * @property string $code
 * @property string $email
 * @property string $phone
 * @property int $role_id
 * @property bool $active
 * @property string $password
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property CarbonImmutable|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read string $initials
 * @property-read Role $role
 */
#[Fillable(['name', 'code', 'email', 'phone', 'role_id', 'active', 'password'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements PasskeyUser
{
    /** @var array<string, mixed> */
    protected $attributes = ['active' => true, 'phone' => ''];

    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    protected function casts(): array
    {
        return [
            'active' => 'boolean',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Role, $this> */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    /** @param  Builder<User>  $query */
    public function scopeActive(Builder $query): void
    {
        $query->where('active', true);
    }

    public function hasPermission(Permission $permission): bool
    {
        return $this->active && $this->role->grants($permission);
    }

    public function canUseAdmin(): bool
    {
        return $this->active && $this->role->grantsAnyPage();
    }

    /** @return list<string> */
    public function permissions(): array
    {
        return $this->role->effectivePermissions();
    }

    /**
     * First letters of the first two words of the name, uppercased.
     *
     * @return Attribute<string, never>
     */
    protected function initials(): Attribute
    {
        return Attribute::get(fn (): string => self::initialsFor($this->name));
    }

    /** First letters of the first two words of a name, uppercased: "Kasun Fernando" → "KF". */
    public static function initialsFor(string $name): string
    {
        $words = array_slice(preg_split('/\s+/', trim($name), -1, PREG_SPLIT_NO_EMPTY) ?: [], 0, 2);

        return mb_strtoupper(implode('', array_map(fn (string $w) => mb_substr($w, 0, 1), $words)));
    }
}
