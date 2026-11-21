<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ActivityAction;
use App\Enums\Permission;
use App\Http\Controllers\Controller;
use App\Http\Resources\ActivityResource;
use App\Models\ActivityLog;
use App\Models\User;
use App\Support\Abilities;
use App\Support\Paginated;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** The activity log: who changed what, and when. Newest first. */
class ActivityController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        Abilities::ensure($request->user(), Permission::PageActivity);
        $data = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'userId' => ['nullable', 'integer', 'min:1'],
            'group' => ['nullable', Rule::in(array_keys(ActivityAction::GROUPS))],
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
            'page' => ['nullable', 'integer', 'min:1'],
            'pageSize' => ['nullable', 'integer', 'min:1', 'max:200'],
        ], ['to.after_or_equal' => 'The end date must be on or after the start date.']);

        $search = trim((string) ($data['search'] ?? ''));
        $query = ActivityLog::query()
            ->when($data['userId'] ?? null, fn ($q, $id) => $q->where('user_id', $id))
            ->when($data['group'] ?? null, fn ($q, $g) => $q->whereIn('action', ActivityAction::valuesInGroup($g)))
            ->when($data['from'] ?? null, fn ($q, $d) => $q->where('created_at', '>=', $d.' 00:00:00'))
            ->when($data['to'] ?? null, fn ($q, $d) => $q->where('created_at', '<=', $d.' 23:59:59'))
            ->when($search !== '', function ($q) use ($search) {
                $like = '%'.addcslashes(mb_strtolower($search), '%_\\').'%';
                $q->where(fn ($q) => $q
                    ->whereRaw('lower(summary) like ?', [$like])
                    ->orWhereRaw('lower(subject_label) like ?', [$like])
                    ->orWhereRaw('lower(actor_name) like ?', [$like]));
            })
            ->orderByDesc('created_at')
            ->orderByDesc('id');

        return Paginated::response($query->paginate($data['pageSize'] ?? 50, page: $data['page'] ?? 1), ActivityResource::class);
    }

    /** The people and groups the page can filter by. */
    public function filters(Request $request): JsonResponse
    {
        Abilities::ensure($request->user(), Permission::PageActivity);

        $actorIds = ActivityLog::query()->whereNotNull('user_id')->distinct()->pluck('user_id');
        $actors = User::query()->whereKey($actorIds)->orderBy('name')->get(['id', 'name'])
            ->map(fn (User $u) => ['id' => (string) $u->id, 'name' => $u->name])->values();

        return response()->json([
            'actors' => $actors,
            'groups' => collect(ActivityAction::GROUPS)->map(fn (string $label, string $key) => ['key' => $key, 'label' => $label])->values(),
        ]);
    }
}
