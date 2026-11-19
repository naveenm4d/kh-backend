<?php

namespace Database\Seeders;

use App\Enums\Permission;
use App\Models\Role;
use App\Models\ShopSetting;
use App\Models\User;
use Illuminate\Database\Seeder;
use RuntimeException;

/**
 * What every installation needs: the built-in roles, the shop settings row and a first admin
 * (from ADMIN_EMAIL / ADMIN_PASSWORD). Safe to run more than once.
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $admin = Role::query()->updateOrCreate(['slug' => Role::ADMIN], [
            'name' => 'Admin',
            'description' => 'Full access. Always has every permission.',
            'permissions' => Permission::values(),
            'system' => true,
            'locked' => true,
        ]);

        Role::query()->firstOrCreate(['slug' => Role::CASHIER], [
            'name' => 'Cashier',
            'description' => 'Rings up sales at the counter.',
            'permissions' => [Permission::PosAccess->value, Permission::PosDiscount->value, Permission::PosCredit->value],
            'system' => true,
            'locked' => false,
        ]);

        if (! ShopSetting::query()->exists()) {
            ShopSetting::query()->create([
                'store_name' => 'Kulatissa Hardware',
                'address' => 'Tissamaharama',
                'phone' => '',
                'reg_no' => '',
                'receipt_footer' => "Thank you for shopping with us.\nGoods sold are not returnable\nunless manufacturing defects exist.\nWe look forward to serving you again.",
                'low_stock' => 20,
                'critical_stock' => 5,
            ]);
        }

        if (! User::query()->where('role_id', $admin->id)->exists()) {
            $email = (string) (config('app.first_admin.email') ?? (app()->isProduction() ? '' : 'admin@kulatissahardware.lk'));
            $password = (string) (config('app.first_admin.password') ?? (app()->isProduction() ? '' : 'password123'));
            if ($email === '' || strlen($password) < 8) {
                throw new RuntimeException('Set ADMIN_EMAIL and ADMIN_PASSWORD (8+ characters) to create the first admin.');
            }

            User::query()->create([
                'name' => (string) config('app.first_admin.name'),
                'code' => 'admin',
                'email' => mb_strtolower($email),
                'role_id' => $admin->id,
                'password' => $password,
            ]);
        }
    }
}
