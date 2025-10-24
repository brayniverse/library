<?php

namespace App\Models;

use App\Enums\MediaFormat;
use App\Enums\MediaType;
use App\Observers\MediaObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;
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
        'poster_path',
    ];

    protected $appends = [
        'image_url',
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

    public function getImageUrlAttribute(): ?string
    {
        if (! $this->poster_path) {
            return null;
        }

        return Storage::disk('public')->url($this->poster_path);
    }

    public function toSearchableArray(): array
    {
        return [
            'title' => $this->title,
            'year' => $this->year,
        ];
    }
}
