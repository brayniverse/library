<?php

use App\Enums\MediaType;
use App\Models\Media;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

it('sorts films by title ascending by default', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    Media::factory()->create(['title' => 'Zeta', 'type' => MediaType::Film->value, 'format' => 'DVD', 'year' => 2001]);
    Media::factory()->create(['title' => 'Alpha', 'type' => MediaType::Film->value, 'format' => 'DVD', 'year' => 2000]);

    $response = $this->get('/films');

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('films/index')
            ->has('films', 2)
            ->where('films.0.title', 'Alpha')
            ->where('films.1.title', 'Zeta')
            ->where('sort', 'title')
            ->where('direction', 'asc')
        );
});

it('sorts films by year descending when requested', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    Media::factory()->create(['title' => 'Film 1999', 'type' => MediaType::Film->value, 'format' => 'DVD', 'year' => 1999]);
    Media::factory()->create(['title' => 'Film 2005', 'type' => MediaType::Film->value, 'format' => 'DVD', 'year' => 2005]);
    Media::factory()->create(['title' => 'Film 2010', 'type' => MediaType::Film->value, 'format' => 'DVD', 'year' => 2010]);

    $response = $this->get('/films?sort=year&direction=desc');

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('films/index')
            ->has('films', 3)
            ->where('films.0.year', 2010)
            ->where('films.1.year', 2005)
            ->where('films.2.year', 1999)
            ->where('sort', 'year')
            ->where('direction', 'desc')
        );
});
