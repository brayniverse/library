<?php

namespace App\Models;

use App\Enums\MediaFormat;
use App\Enums\MediaType;
use App\Observers\MediaObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Laravel\Scout\Searchable;

#[ObservedBy(MediaObserver::class)]
class Media extends Model
{
    use HasFactory, Searchable, SoftDeletes;

    protected $fillable = [
        'title',
        'orderable_title',
        'type',
        'format',
        'year',
        'custom_attributes',
    ];

    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'format' => MediaFormat::class,
            'type' => MediaType::class,
            'custom_attributes' => 'array',
        ];
    }

    public function toSearchableArray(): array
    {
        return [
            'title' => $this->title,
            'year' => $this->year,
        ];
    }
}
