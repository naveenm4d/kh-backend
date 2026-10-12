<?php

namespace App\Actions\Staff;

use App\Enums\Permission;
use App\Models\User;
use App\Support\Abilities;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Removes a staff account. Their past bills keep the cashier name and code they were rung up with.
 */
final class DeleteStaff
{
    public function __invoke(User $actor, User $staff): void
    {
        Abilities::ensure($actor, Permission::PageUsers, Permission::RecordsDelete);

        if ($staff->is($actor)) {
            throw ValidationException::withMessages(['user' => "You can't delete your own account."]);
        }

        DB::transaction(function () use ($staff) {
            $staff = User::query()->with('role')->lockForUpdate()->findOrFail($staff->id);
            if ($staff->role->locked && $staff->active && SaveStaff::otherActiveAdmins($staff) === 0) {
                throw ValidationException::withMessages(['user' => "This is the last active admin and can't be deleted."]);
            }
            SignOutEverywhere::run($staff);
            $staff->delete();
        });
    }
}
