<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** A staff account as the users page lists it. */
/** @mixin User */
class StaffResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'name' => $this->name,
            'code' => $this->code,
            'email' => $this->email,
            'role' => (string) $this->role_id,
            'phone' => $this->phone,
            'initials' => $this->initials,
            'active' => $this->active,
        ];
    }
}
