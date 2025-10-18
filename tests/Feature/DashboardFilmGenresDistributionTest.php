<?php

use App\Enums\MediaType;
use App\Models\Media;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

it('includes genresDistribution on dashboard reflecting film genres', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    // Seed films with genres
    Media::factory()->create([
        'title' => 'Film A',
        'type' => MediaType::Film->value,
        'format' => 'DVD',
        'year' => 2001,
        'custom_attributes' => [
            'genres' => ['Action', 'Adventure'],
        ],
    ]);

    Media::factory()->create([
        'title' => 'Film B',
        'type' => MediaType::Film->value,
        'format' => 'Blu-ray',
        'year' => 2002,
        'custom_attributes' => [
            'genres' => ['Drama'],
        ],
    ]);

    Media::factory()->create([
        'title' => 'Film C',
        'type' => MediaType::Film->value,
        'format' => 'VHS',
        'year' => 2003,
        'custom_attributes' => [
            'genres' => ['Action'],
        ],
    ]);

    // TV entries should not contribute
    Media::factory()->create([
        'title' => 'Show A',
        'type' => MediaType::TV->value,
        'format' => 'DVD',
        'year' => 1999,
        'custom_attributes' => [
            'genres' => ['Action'],
        ],
    ]);

    $response = $this->get('/dashboard');

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('genresDistribution', function ($dist) {
                // Expect alphabetical by genre name with counts from films only
                expect($dist)->toBeArray();
                // Transform to map for easy assertions
                $map = [];
                foreach ($dist as $row) {
                    $map[$row['name']] = $row['count'];
                }
                expect($map['Action'] ?? null)->toBe(2);
                expect($map['Adventure'] ?? null)->toBe(1);
                expect($map['Drama'] ?? null)->toBe(1);

                return true;
            })
        );
});
