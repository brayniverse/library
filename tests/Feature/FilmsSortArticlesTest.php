<?php

use App\Enums\MediaType;
use App\Models\Media;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

it('sorts by title ignoring leading "The " in ascending order', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    Media::factory()->create([
        'title' => 'The Matrix',
        'type' => MediaType::Film->value,
        'format' => 'DVD',
        'year' => 1999,
    ]);
    Media::factory()->create([
        'title' => 'Matrix Revolutions',
        'type' => MediaType::Film->value,
        'format' => 'DVD',
        'year' => 2003,
    ]);
    Media::factory()->create([
        'title' => 'The Godfather',
        'type' => MediaType::Film->value,
        'format' => 'Blu-ray',
        'year' => 1972,
    ]);

    $response = $this->get('/films?sort=title&direction=asc');

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('films/index')
            ->has('films', 3)
            ->where('films.0.title', 'The Godfather')
            ->where('films.1.title', 'The Matrix')
            ->where('films.2.title', 'Matrix Revolutions')
        );
});

it('sorts by title ignoring leading "The " in descending order', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    Media::factory()->create([
        'title' => 'The Matrix',
        'type' => MediaType::Film->value,
        'format' => 'DVD',
        'year' => 1999,
    ]);
    Media::factory()->create([
        'title' => 'Matrix Revolutions',
        'type' => MediaType::Film->value,
        'format' => 'DVD',
        'year' => 2003,
    ]);
    Media::factory()->create([
        'title' => 'The Godfather',
        'type' => MediaType::Film->value,
        'format' => 'Blu-ray',
        'year' => 1972,
    ]);

    $response = $this->get('/films?sort=title&direction=desc');

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('films/index')
            ->has('films', 3)
            ->where('films.0.title', 'Matrix Revolutions')
            ->where('films.1.title', 'The Matrix')
            ->where('films.2.title', 'The Godfather')
        );
});
