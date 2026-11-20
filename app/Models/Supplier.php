<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $name
 * @property string $supplies
 * @property string $phone
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 */
#[Fillable(['name', 'supplies', 'phone'])]
class Supplier extends Model
{
    /** @var array<string, mixed> */
    protected $attributes = ['supplies' => '', 'phone' => ''];
}
