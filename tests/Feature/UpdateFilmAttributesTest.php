<?php

use App\Enums\MediaType;
use App\Models\Media;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('updates a film with custom attributes via the edit modal route', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $media = Media::factory()->create([
        'title' => 'Existing Film',
        'type' => MediaType::Film->value,
        'format' => 'DVD',
        'year' => 2000,
    ]);

    $payload = [
        'title' => 'Existing Film',
        'type' => MediaType::Film->value,
        'format' => 'DVD',
        'year' => 2000,
        'custom_attributes' => [
            'run_time' => 123,
            'genres' => ['Action', 'Sci-Fi'],
            'description' => 'A great movie.',
            'tagline' => 'There is no spoon.',
            'countries' => [
                ['code' => 'US', 'name' => 'United States'],
                ['code' => 'CA', 'name' => 'Canada'],
            ],
            'languages' => [
                ['code' => 'EN', 'name' => 'English'],
                ['code' => 'FR', 'name' => 'French'],
            ],
        ],
    ];

    $response = $this->put(route('films.update', $media), $payload);

    $response->assertRedirect(route('films.index'));

    $media->refresh();

    expect($media->custom_attributes)->toBeArray();
    expect($media->custom_attributes['run_time'] ?? null)->toBe(123);
    expect($media->custom_attributes['genres'] ?? null)->toEqual(['Action', 'Sci-Fi']);
    expect($media->custom_attributes['description'] ?? null)->toBe('A great movie.');
    expect($media->custom_attributes['tagline'] ?? null)->toBe('There is no spoon.');
    expect($media->custom_attributes['countries'] ?? null)->toEqual([
        ['code' => 'US', 'name' => 'United States'],
        ['code' => 'CA', 'name' => 'Canada'],
    ]);
    expect($media->custom_attributes['languages'] ?? null)->toEqual([
        ['code' => 'EN', 'name' => 'English'],
        ['code' => 'FR', 'name' => 'French'],
    ]);
});
