<?php

namespace App\Http\Resources;

use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ActivityLog */
class ActivityResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'at' => $this->created_at->toIso8601String(),
            'action' => $this->action->value,
            'actionLabel' => $this->action->label(),
            'group' => $this->action->group(),
            'summary' => $this->summary,
            'actorId' => $this->user_id === null ? null : (string) $this->user_id,
            'actorName' => $this->actor_name,
            'terminalName' => $this->terminal_name,
            'ip' => $this->ip,
            'subjectType' => $this->subject_type,
            'subjectId' => $this->subject_id === null ? null : (string) $this->subject_id,
            'subjectLabel' => $this->subject_label,
            'changes' => $this->changes ?? [],
        ];
    }
}
