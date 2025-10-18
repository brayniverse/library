<?php

use App\Enums\MediaType;
use App\Models\Media;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

it('shows filmsCount on dashboard equal to total films', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    // Seed: 3 films + 2 TV entries
    Media::factory()->create([
        'title' => 'Film A',
        'type' => MediaType::Film->value,
        'format' => 'DVD',
        'year' => 2001,
    ]);
    Media::factory()->create([
        'title' => 'Film B',
        'type' => MediaType::Film->value,
        'format' => 'Blu-ray',
        'year' => 2002,
    ]);
    Media::factory()->create([
        'title' => 'Film C',
        'type' => MediaType::Film->value,
        'format' => 'VHS',
        'year' => 2003,
    ]);

    Media::factory()->create([
        'title' => 'Show A',
        'type' => MediaType::TV->value,
        'format' => 'DVD',
        'year' => 1999,
    ]);
    Media::factory()->create([
        'title' => 'Show B',
        'type' => MediaType::TV->value,
        'format' => 'DVD',
        'year' => 2000,
    ]);

    $response = $this->get('/dashboard');

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('filmsCount', 3)
        );
});
