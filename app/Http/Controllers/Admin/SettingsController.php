<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Settings\UpdateShopSettings;
use App\Http\Controllers\Controller;
use App\Http\Resources\ShopSettingsResource;
use App\Models\ShopSetting;
use Illuminate\Http\Request;

/** Shop details and stock levels. */
class SettingsController extends Controller
{
    public function shop(): ShopSettingsResource
    {
        return ShopSettingsResource::make(ShopSetting::current());
    }

    public function updateShop(Request $request, UpdateShopSettings $update): ShopSettingsResource
    {
        $data = $request->validate([
            'storeName' => ['required', 'string', 'max:120'],
            'address' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:32'],
            'regNo' => ['nullable', 'string', 'max:64'],
            'receiptFooter' => ['nullable', 'string', 'max:1000'],
            'lowStock' => ['required', 'integer', 'min:1', 'max:100000'],
            'criticalStock' => ['required', 'integer', 'min:0', 'max:100000'],
        ]);

        return ShopSettingsResource::make($update($request->user(), [
            'store_name' => $data['storeName'],
            'address' => $data['address'] ?? '',
            'phone' => $data['phone'] ?? '',
            'reg_no' => $data['regNo'] ?? '',
            'receipt_footer' => $data['receiptFooter'] ?? '',
            'low_stock' => (int) $data['lowStock'],
            'critical_stock' => (int) $data['criticalStock'],
        ]));
    }
}
