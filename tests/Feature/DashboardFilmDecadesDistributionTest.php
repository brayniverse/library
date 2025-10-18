<?php

use App\Enums\MediaType;
use App\Models\Media;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

it('includes decadesDistribution on dashboard reflecting film counts by decade', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    // Seed films across decades
    Media::factory()->create([
        'title' => 'Metropolis',
        'type' => MediaType::Film->value,
        'format' => 'DVD',
        'year' => 1927,
    ]);

    Media::factory()->create([
        'title' => 'Psycho',
        'type' => MediaType::Film->value,
        'format' => 'Blu-ray',
        'year' => 1960,
    ]);

    Media::factory()->create([
        'title' => 'The Godfather',
        'type' => MediaType::Film->value,
        'format' => 'Blu-ray',
        'year' => 1972,
    ]);

    Media::factory()->create([
        'title' => 'The Matrix',
        'type' => MediaType::Film->value,
        'format' => 'DVD',
        'year' => 1999,
    ]);

    Media::factory()->create([
        'title' => 'The Matrix Reloaded',
        'type' => MediaType::Film->value,
        'format' => 'DVD',
        'year' => 2003,
    ]);

    Media::factory()->create([
        'title' => 'Dune',
        'type' => MediaType::Film->value,
        'format' => '4K UHD',
        'year' => 2021,
    ]);

    // Non-film should not count
    Media::factory()->create([
        'title' => 'Some Show',
        'type' => MediaType::TV->value,
        'format' => 'DVD',
        'year' => 1999,
    ]);

    $response = $this->get('/dashboard');

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('decadesDistribution', function ($dist) {
                expect($dist)->toBeArray();
                // Convert to map for checking by label like "1990s"
                $map = [];
                foreach ($dist as $row) {
                    $map[$row['name']] = $row['count'];
                }
                expect($map['1920s'] ?? null)->toBe(1);
                expect($map['1960s'] ?? null)->toBe(1);
                expect($map['1970s'] ?? null)->toBe(1);
                expect($map['1990s'] ?? null)->toBe(1);
                expect($map['2000s'] ?? null)->toBe(1);
                expect($map['2020s'] ?? null)->toBe(1);

                // Ensure non-film did not alter counts
                return true;
            })
        );
});
