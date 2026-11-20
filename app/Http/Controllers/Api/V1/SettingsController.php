<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ShopSettingsResource;
use App\Models\ShopSetting;
use App\Support\ConditionalResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SettingsController extends Controller
{
    public function shop(Request $request): Response
    {
        return ConditionalResponse::json($request, ShopSettingsResource::make(ShopSetting::current())->resolve($request));
    }
}
