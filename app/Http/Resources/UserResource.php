<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** The signed-in staff member, with the permissions their role currently grants. */
/** @mixin User */
class UserResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'name' => $this->name,
            'code' => $this->code,
            'email' => $this->email,
            'role' => $this->role->slug ?? (string) $this->role_id,
            'roleName' => $this->role->name,
            'initials' => $this->initials,
            'permissions' => $this->permissions(),
        ];
    }
}
