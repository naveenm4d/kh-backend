<?php

namespace App\Http\Resources;

use App\Models\ShopSetting;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ShopSetting */
class ShopSettingsResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'storeName' => $this->store_name,
            'address' => $this->address,
            'phone' => $this->phone,
            'regNo' => $this->reg_no,
            'receiptFooter' => $this->receipt_footer,
            'lowStock' => $this->low_stock,
            'criticalStock' => $this->critical_stock,
        ];
    }
}
