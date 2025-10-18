<?php

use App\Enums\MediaFormat;
use App\Enums\MediaType;
use App\Models\Media;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\post;

uses(RefreshDatabase::class);

it('stores film attributes in JSON column', function () {
    $user = User::factory()->create();
    actingAs($user);

    $payload = [
        'title' => 'Inception',
        'type' => MediaType::Film->value,
        'format' => MediaFormat::DVD->value,
        'year' => 2010,
        'custom_attributes' => [
            'run_time' => 148,
            'genres' => ['Action', 'Sci-Fi', 'Thriller'],
            'description' => 'A skilled thief who steals corporate secrets through dream-sharing.',
            'tagline' => 'Your mind is the scene of the crime.',
            'countries' => [
                ['code' => 'US', 'name' => 'United States'],
                ['code' => 'GB', 'name' => 'United Kingdom'],
            ],
            'languages' => [
                ['code' => 'en', 'name' => 'English'],
                ['code' => 'ja', 'name' => 'Japanese'],
            ],
        ],
    ];

    $response = post(route('films.store'), $payload);

    $response->assertRedirect(route('films.index'));

    $media = Media::query()->where('title', 'Inception')->firstOrFail();

    expect($media->custom_attributes)->toBeArray();
    expect($media->custom_attributes['run_time'])->toBe(148);
    expect($media->custom_attributes['genres'])->toContain('Action', 'Sci-Fi', 'Thriller');
    expect($media->custom_attributes['description'])->toBeString();
    expect($media->custom_attributes['tagline'])->toBe('Your mind is the scene of the crime.');
    expect($media->custom_attributes['countries'][0]['code'])->toBe('US');
    expect($media->custom_attributes['languages'][1]['name'])->toBe('Japanese');
});
