<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Support\ConditionalResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class CategoryController extends Controller
{
    public function index(Request $request): Response
    {
        $categories = Cache::rememberForever(Category::CACHE_KEY, fn () => CategoryResource::collection(
            Category::query()->orderBy('name')->get(),
        )->resolve());

        return ConditionalResponse::json($request, $categories);
    }
}
