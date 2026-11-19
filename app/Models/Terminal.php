<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

/**
 * A registered cashier till. The plain key exists only at registration; we keep its sha256.
 *
 * @property int $id
 * @property string $name
 * @property string $key_hash
 * @property string $key_hint
 * @property CarbonImmutable|null $last_seen_at
 * @property string|null $last_ip
 * @property CarbonImmutable|null $revoked_at
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 */
#[Fillable(['name', 'key_hash', 'key_hint', 'last_seen_at', 'last_ip', 'revoked_at'])]
#[Hidden(['key_hash'])]
class Terminal extends Model
{
    public const KEY_PREFIX = 'khterm_';

    protected function casts(): array
    {
        return [
            'last_seen_at' => 'datetime',
            'revoked_at' => 'datetime',
        ];
    }

    /** @return HasMany<PersonalAccessToken, $this> */
    public function tokens(): HasMany
    {
        return $this->hasMany(PersonalAccessToken::class);
    }

    public function isActive(): bool
    {
        return $this->revoked_at === null;
    }

    /**
     * Registers a till and returns it with its one-time plain key.
     *
     * @return array{0: Terminal, 1: string}
     */
    public static function register(string $name): array
    {
        $key = self::KEY_PREFIX.Str::random(48);
        $terminal = self::create([
            'name' => $name,
            'key_hash' => hash('sha256', $key),
            'key_hint' => substr($key, 0, strlen(self::KEY_PREFIX) + 4),
        ]);

        return [$terminal, $key];
    }

    public static function findByKey(?string $key): ?self
    {
        if ($key === null || $key === '' || strlen($key) > 128) {
            return null;
        }

        return self::query()->where('key_hash', hash('sha256', $key))->first();
    }

    /** Revokes the till and every session signed in on it. */
    public function revoke(): void
    {
        $this->forceFill(['revoked_at' => now()])->save();
        $this->tokens()->delete();
    }
}
