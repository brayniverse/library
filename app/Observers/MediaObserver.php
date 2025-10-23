<?php

namespace App\Observers;

use App\Models\Media;

use function strtolower;

class MediaObserver
{
    public function saving(Media $media): void
    {
        $media->orderable_title = self::normalizeForOrdering((string) ($media->title ?? ''));
    }

    protected static function normalizeForOrdering(string $title): string
    {
        $lower = strtolower($title);

        return str_starts_with($lower, 'the ') ? substr($lower, 4) : $lower;
    }
}
