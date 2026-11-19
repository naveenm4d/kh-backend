<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Staff\DeleteRole;
use App\Actions\Staff\DeleteStaff;
use App\Actions\Staff\ResetStaffPassword;
use App\Actions\Staff\SaveRole;
use App\Actions\Staff\SaveStaff;
use App\Enums\Permission;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StaffRequest;
use App\Http\Resources\RoleResource;
use App\Http\Resources\StaffResource;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

/** Staff accounts and roles (Users & roles page). */
class StaffController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return StaffResource::collection(User::query()->orderBy('name')->get());
    }

    public function store(StaffRequest $request, SaveStaff $save): JsonResponse
    {
        return StaffResource::make($save($request->user(), $request->staffData()))->response()->setStatusCode(201);
    }

    public function update(StaffRequest $request, User $staff, SaveStaff $save): StaffResource
    {
        return StaffResource::make($save($request->user(), $request->staffData(), $staff));
    }

    public function destroy(Request $request, User $staff, DeleteStaff $delete): Response
    {
        $delete($request->user(), $staff);

        return response()->noContent();
    }

    public function resetPassword(Request $request, User $staff, ResetStaffPassword $reset): Response
    {
        $data = $request->validate(['password' => ['required', 'string', Password::defaults()]]);
        $reset($request->user(), $staff, $data['password']);

        return response()->noContent();
    }

    public function roles(): AnonymousResourceCollection
    {
        return RoleResource::collection(Role::query()->orderByDesc('system')->orderBy('name')->get());
    }

    public function permissions(): JsonResponse
    {
        return response()->json(Permission::catalog());
    }

    public function storeRole(Request $request, SaveRole $save): JsonResponse
    {
        return RoleResource::make($save($request->user(), $this->roleData($request)))->response()->setStatusCode(201);
    }

    public function updateRole(Request $request, Role $role, SaveRole $save): RoleResource
    {
        return RoleResource::make($save($request->user(), $this->roleData($request, $role->id), $role));
    }

    public function destroyRole(Request $request, Role $role, DeleteRole $delete): Response
    {
        $delete($request->user(), $role);

        return response()->noContent();
    }

    /** @return array{name: string, description: string|null, permissions: array<int, string>} */
    private function roleData(Request $request, ?int $ignore = null): array
    {
        /** @var array{name: string, description: string|null, permissions: array<int, string>} */
        return $request->validate([
            'name' => ['required', 'string', 'max:60', function ($attr, $value, $fail) use ($ignore) {
                $exists = Role::query()->whereRaw('lower(name) = ?', [mb_strtolower(trim((string) $value))])
                    ->when($ignore, fn ($q) => $q->whereKeyNot($ignore))->exists();
                if ($exists) {
                    $fail("There's already a role called \"".trim((string) $value).'".');
                }
            }],
            'description' => ['nullable', 'string', 'max:255'],
            'permissions' => ['present', 'array'],
            'permissions.*' => ['string', Rule::in(Permission::values())],
        ]);
    }
}
