<?php

use App\Models\ShopSetting;
use Illuminate\Database\Migrations\Migration;

/**
 * Puts the company's registered name, street address and phone at the top of every bill. Saved
 * through the model so the cached settings are cleared and the tills pick the change up (ETag).
 * A fresh install has no settings row yet; the seeder creates it with these values.
 */
return new class extends Migration
{
    public function up(): void
    {
        ShopSetting::query()->first()?->update([
            'store_name' => 'R.K. Kulatissa & Company Pvt Ltd',
            'address' => 'No 16, Main street, Tissamaharama',
            'phone' => '0472237298',
        ]);
    }

    /** One-way: the header is edited on the Settings page from here on. */
    public function down(): void {}
};
