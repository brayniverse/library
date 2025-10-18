<?php

use App\Enums\MediaType;
use App\Models\Media;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

it('returns languages and countries in films list props', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $film = Media::factory()->create([
        'title' => 'With Locale',
        'type' => MediaType::Film->value,
        'format' => 'DVD',
        'year' => 2012,
        'custom_attributes' => [
            'languages' => [
                ['code' => 'en', 'name' => 'English'],
                ['code' => 'fr', 'name' => 'French'],
            ],
            'countries' => [
                ['code' => 'US', 'name' => 'United States'],
                ['code' => 'CA', 'name' => 'Canada'],
            ],
        ],
    ]);

    $response = $this->get('/films');

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('films/index')
            ->has('films', 1)
            ->has('films.0.custom_attributes.languages', 2)
            ->has('films.0.custom_attributes.countries', 2)
            ->where('films.0.custom_attributes.languages.0.name', 'English')
            ->where('films.0.custom_attributes.countries.0.code', 'US')
        );
});
