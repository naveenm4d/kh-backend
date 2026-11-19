<?php

namespace App\Actions\Staff;

use App\Enums\Permission;
use App\Models\Role;
use App\Models\User;
use App\Support\Abilities;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Creates or updates a staff account. Nobody can deactivate themselves or change their own role,
 * and the last active admin can't be demoted or deactivated, so there's always a way back in.
 * Deactivating someone or changing their role signs them out everywhere.
 */
final class SaveStaff
{
    /**
     * @param  array{name: string, code: string, email: string, phone?: string|null, role_id: int, active?: bool, password?: string|null}  $data
     */
    public function __invoke(User $actor, array $data, ?User $staff = null): User
    {
        Abilities::ensure($actor, Permission::PageUsers);

        return DB::transaction(function () use ($actor, $data, $staff) {
            $role = Role::query()->findOrFail($data['role_id']);
            $active = $staff === null ? true : (bool) ($data['active'] ?? $staff->active);

            if ($staff !== null) {
                $staff = User::query()->with('role')->lockForUpdate()->findOrFail($staff->id);
                $self = $staff->is($actor);
                if ($self && ! $active) {
                    throw ValidationException::withMessages(['active' => "You can't deactivate your own account."]);
                }
                if ($self && $staff->role_id !== $role->id) {
                    throw ValidationException::withMessages(['role_id' => "You can't change your own role. Ask another admin."]);
                }
                $losesAdmin = $staff->role->locked && $staff->active && (! $active || ! $role->locked);
                if ($losesAdmin && self::otherActiveAdmins($staff) === 0) {
                    throw ValidationException::withMessages(['role_id' => 'This is the last active admin. Make someone else an admin first.']);
                }
            }

            $signOut = $staff !== null && ($staff->role_id !== $role->id || ($staff->active && ! $active));

            $staff ??= new User;
            $staff->fill([
                'name' => trim($data['name']),
                'code' => mb_strtolower(trim($data['code'])),
                'email' => mb_strtolower(trim($data['email'])),
                'phone' => trim((string) ($data['phone'] ?? '')),
                'role_id' => $role->id,
                'active' => $active,
            ]);
            if (! $staff->exists) {
                $password = (string) ($data['password'] ?? '');
                if (strlen($password) < 8) {
                    throw ValidationException::withMessages(['password' => 'The password needs at least 8 characters.']);
                }
                $staff->password = $password;
            }
            $staff->save();

            if ($signOut) {
                SignOutEverywhere::run($staff);
            }

            return $staff->load('role');
        });
    }

    /** Active staff on a locked (all-permissions) role, other than the given one. */
    public static function otherActiveAdmins(User $except): int
    {
        return User::query()
            ->active()
            ->whereKeyNot($except->id)
            ->whereHas('role', fn ($q) => $q->where('locked', true))
            ->count();
    }
}
