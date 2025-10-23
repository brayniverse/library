<?php

use App\Enums\MediaType;
use App\Models\Media;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('sets orderable_title when creating a media record', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $media = Media::create([
        'title' => 'The Godfather',
        'type' => MediaType::Film->value,
        'format' => 'DVD',
        'year' => 1972,
    ]);

    expect($media->orderable_title)->toBe('godfather');
});

it('updates orderable_title when title changes', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $media = Media::create([
        'title' => 'Matrix',
        'type' => MediaType::Film->value,
        'format' => 'Blu-ray',
        'year' => 1999,
    ]);

    expect($media->orderable_title)->toBe('matrix');

    $media->update(['title' => 'The Matrix']);

    expect($media->orderable_title)->toBe('matrix');
});
