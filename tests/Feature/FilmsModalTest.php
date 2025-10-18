<?php

use App\Enums\MediaType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

it('opens create modal when visiting /films/create', function () {
    $user = User::factory()->create();

    $this->actingAs($user);

    $response = $this->get('/films/create');

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('films/index')
            ->where('creating', true)
            ->has('films')
            ->has('formats')
        );
});

it('creates a film and redirects back to films index', function () {
    $user = User::factory()->create();

    $this->actingAs($user);

    $payload = [
        'title' => 'The Matrix',
        'type' => MediaType::Film->value,
        'format' => 'DVD',
        'year' => 1999,
    ];

    $response = $this->post('/films', $payload);

    $response->assertRedirect(route('films.index'));

    $this->assertDatabaseHas('media', [
        'title' => 'The Matrix',
        'type' => MediaType::Film->value,
        'format' => 'DVD',
        'year' => 1999,
    ]);
});
