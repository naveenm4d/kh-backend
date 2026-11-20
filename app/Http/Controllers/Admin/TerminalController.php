<?php

namespace App\Http\Controllers\Admin;

use App\Enums\Permission;
use App\Http\Controllers\Controller;
use App\Http\Resources\TerminalResource;
use App\Models\Terminal;
use App\Support\Abilities;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

/** The cashier tills allowed to use the POS API, and their keys. */
class TerminalController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        Abilities::ensure($request->user(), Permission::PageSettings);

        return TerminalResource::collection(Terminal::query()->withCount('tokens')->orderByRaw('revoked_at is not null')->orderBy('name')->get());
    }

    /** Creates a terminal key. The key is in this response only; it's never shown again. */
    public function store(Request $request): JsonResponse
    {
        Abilities::ensure($request->user(), Permission::PageSettings);
        $data = $request->validate(
            ['name' => ['required', 'string', 'max:60', function (string $attribute, mixed $value, \Closure $fail) {
                if (is_string($value) && Terminal::query()->whereRaw('lower(name) = ?', [mb_strtolower(trim($value))])->exists()) {
                    $fail('There’s already a terminal called '.trim($value).'.');
                }
            }]],
        );

        [$terminal, $key] = Terminal::register(trim($data['name']));

        return response()->json([...TerminalResource::make($terminal)->resolve($request), 'key' => $key], 201);
    }

    /** Deletes the key: everyone signed in on it is signed out, and past bills keep their history. */
    public function destroy(Request $request, Terminal $terminal): Response
    {
        Abilities::ensure($request->user(), Permission::PageSettings);
        $terminal->delete();

        return response()->noContent();
    }
}
