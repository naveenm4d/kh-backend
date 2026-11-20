<?php

namespace App\Actions\Settings;

use App\Enums\Permission;
use App\Models\ShopSetting;
use App\Models\User;
use App\Support\Abilities;
use Illuminate\Validation\ValidationException;

final class UpdateShopSettings
{
    /**
     * @param  array{store_name: string, address?: string|null, phone?: string|null, reg_no?: string|null, receipt_footer?: string|null, low_stock: int, critical_stock: int}  $data
     */
    public function __invoke(User $user, array $data): ShopSetting
    {
        Abilities::ensure($user, Permission::PageSettings);

        $footer = rtrim(str_replace("\r\n", "\n", (string) ($data['receipt_footer'] ?? '')), "\n ");
        $values = [
            'store_name' => trim($data['store_name']),
            'address' => trim((string) ($data['address'] ?? '')),
            'phone' => trim((string) ($data['phone'] ?? '')),
            'reg_no' => trim((string) ($data['reg_no'] ?? '')),
            'receipt_footer' => $footer,
            'low_stock' => (int) $data['low_stock'],
            'critical_stock' => (int) $data['critical_stock'],
        ];

        $error = match (true) {
            $values['store_name'] === '' => ['store_name', "The shop name can't be empty; it heads every receipt."],
            $values['low_stock'] < 1 => ['low_stock', 'The low-stock level must be at least 1.'],
            $values['critical_stock'] < 0 => ['critical_stock', "The very-low level can't be negative."],
            $values['critical_stock'] >= $values['low_stock'] => ['critical_stock', 'The very-low level must be below the low-stock level.'],
            default => null,
        };
        if ($error !== null) {
            throw ValidationException::withMessages([$error[0] => $error[1]]);
        }

        $settings = ShopSetting::query()->firstOrFail();
        $settings->fill($values)->save();

        return $settings;
    }
}
