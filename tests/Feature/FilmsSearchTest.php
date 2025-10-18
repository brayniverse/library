<?php

use App\Enums\MediaType;
use App\Models\Media;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

it('filters films by search term using scout', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    // Seed data
    Media::factory()->create([
        'title' => 'The Matrix',
        'type' => MediaType::Film->value,
        'format' => 'DVD',
        'year' => 1999,
    ]);
    Media::factory()->create([
        'title' => 'Finding Nemo',
        'type' => MediaType::Film->value,
        'format' => 'Blu-ray',
        'year' => 2003,
    ]);
    // A TV show that should never appear on the films page even if it matches the term
    Media::factory()->create([
        'title' => 'The Matrix TV',
        'type' => MediaType::TV->value,
        'format' => 'DVD',
        'year' => 2005,
    ]);

    // Search for "Matrix"
    $response = $this->get('/films?q=Matrix');

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('films/index')
            ->where('q', 'Matrix')
            ->has('films', 1)
            ->has('formats')
        );
});
