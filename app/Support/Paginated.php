<?php

namespace App\Support;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\JsonResource;

/** The {items, total, page, pageSize} page shape the tills already understand. */
final class Paginated
{
    /**
     * @param  LengthAwarePaginator<int, mixed>  $page
     * @param  class-string<JsonResource>  $resource
     */
    public static function response(LengthAwarePaginator $page, string $resource): JsonResponse
    {
        return response()->json([
            'items' => $resource::collection($page->items())->resolve(),
            'total' => $page->total(),
            'page' => $page->currentPage(),
            'pageSize' => $page->perPage(),
        ]);
    }
}
