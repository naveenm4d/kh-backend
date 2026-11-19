<?php

namespace App\Http\Resources;

use App\Models\Terminal;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Terminal */
class TerminalResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'name' => $this->name,
            'keyHint' => $this->key_hint.'…',
            'lastSeenAt' => $this->last_seen_at?->toIso8601String(),
            'lastIp' => $this->last_ip,
            'revokedAt' => $this->revoked_at?->toIso8601String(),
            'createdAt' => $this->created_at?->toIso8601String(),
            'signedIn' => (int) ($this->tokens_count ?? 0),
        ];
    }
}
