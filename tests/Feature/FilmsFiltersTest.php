<?php

use App\Enums\MediaType;
use App\Models\Media;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

it('filters films by format', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    Media::factory()->create(['title' => 'Film DVD', 'type' => MediaType::Film->value, 'format' => 'DVD', 'year' => 2001]);
    Media::factory()->create(['title' => 'Film Blu', 'type' => MediaType::Film->value, 'format' => 'Blu-ray', 'year' => 2002]);

    $response = $this->get('/films?format=DVD');

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('films/index')
            ->has('films', 1)
            ->where('films.0.format', 'DVD')
            ->where('format', 'DVD')
        );
});

it('filters films by year', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    Media::factory()->create(['title' => '1999', 'type' => MediaType::Film->value, 'format' => 'DVD', 'year' => 1999]);
    Media::factory()->create(['title' => '2005', 'type' => MediaType::Film->value, 'format' => 'DVD', 'year' => 2005]);

    $response = $this->get('/films?year=1999');

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('films/index')
            ->has('films', 1)
            ->where('films.0.year', 1999)
            ->where('year', 1999)
        );
});

it('filters films by language (code or name)', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    Media::factory()->create([
        'title' => 'English Film',
        'type' => MediaType::Film->value,
        'format' => 'DVD',
        'year' => 2000,
        'custom_attributes' => [
            'languages' => [['code' => 'en', 'name' => 'English']],
        ],
    ]);
    Media::factory()->create([
        'title' => 'French Film',
        'type' => MediaType::Film->value,
        'format' => 'DVD',
        'year' => 2001,
        'custom_attributes' => [
            'languages' => [['code' => 'fr', 'name' => 'French']],
        ],
    ]);

    // by code
    $response = $this->get('/films?language=en');
    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('films/index')
            ->has('films', 1)
            ->where('films.0.title', 'English Film')
            ->where('language', 'en')
        );

    // by name
    $response = $this->get('/films?language=French');
    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('films/index')
            ->has('films', 1)
            ->where('films.0.title', 'French Film')
            ->where('language', 'French')
        );
});

it('filters films by country (code or name)', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    Media::factory()->create([
        'title' => 'US Film',
        'type' => MediaType::Film->value,
        'format' => 'DVD',
        'year' => 2000,
        'custom_attributes' => [
            'countries' => [['code' => 'US', 'name' => 'United States']],
        ],
    ]);
    Media::factory()->create([
        'title' => 'UK Film',
        'type' => MediaType::Film->value,
        'format' => 'DVD',
        'year' => 2001,
        'custom_attributes' => [
            'countries' => [['code' => 'GB', 'name' => 'United Kingdom']],
        ],
    ]);

    // by code
    $response = $this->get('/films?country=US');
    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('films/index')
            ->has('films', 1)
            ->where('films.0.title', 'US Film')
            ->where('country', 'US')
        );

    // by name
    $response = $this->get('/films?country=United Kingdom');
    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('films/index')
            ->has('films', 1)
            ->where('films.0.title', 'UK Film')
            ->where('country', 'United Kingdom')
        );
});
