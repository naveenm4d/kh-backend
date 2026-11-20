<?php

namespace App\Support;

use App\Enums\Permission;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;

/**
 * Permission checks for domain actions. Actions call these themselves, so the rule holds no matter
 * which entry point (POS API or admin console) reached them.
 */
final class Abilities
{
    /** Every listed permission is required. */
    public static function ensure(User $user, Permission ...$permissions): void
    {
        foreach ($permissions as $permission) {
            if (! $user->hasPermission($permission)) {
                throw self::denied($permission);
            }
        }
    }

    /** At least one listed permission is required. */
    public static function ensureAny(User $user, Permission ...$permissions): void
    {
        foreach ($permissions as $permission) {
            if ($user->hasPermission($permission)) {
                return;
            }
        }

        throw self::denied($permissions[array_key_last($permissions)]);
    }

    public static function denied(Permission $permission): AuthorizationException
    {
        return new AuthorizationException(
            sprintf("Your role doesn't allow this (%s).", mb_strtolower($permission->label())),
        );
    }
}
