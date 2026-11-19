<?php

namespace App\Actions\Staff;

use App\Models\User;
use Illuminate\Support\Facades\DB;

/** Ends every till token and web session a staff member has. */
final class SignOutEverywhere
{
    public static function run(User $user): void
    {
        $user->tokens()->delete();
        DB::table('sessions')->where('user_id', $user->id)->delete();
    }
}
