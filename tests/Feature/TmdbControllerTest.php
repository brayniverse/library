<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

it('searches tmdb and returns simplified results', function () {
    Http::fake([
        'api.themoviedb.org/3/search/movie*' => Http::response([
            'results' => [
                [
                    'id' => 603,
                    'title' => 'The Matrix',
                    'release_date' => '1999-03-30',
                    'overview' => 'Neo believes that Morpheus...',
                ],
                [
                    'id' => 604,
                    'title' => 'The Matrix Reloaded',
                    'release_date' => '2003-05-15',
                    'overview' => 'The crew must defend Zion...',
                ],
            ],
        ], 200),
    ]);

    $user = User::factory()->create();
    $this->actingAs($user);

    $res = $this->getJson('/api/tmdb/search?query=matrix');
    $res->assertOk()
        ->assertJsonStructure([
            'results' => [
                ['id', 'title', 'year', 'overview'],
            ],
        ])
        ->assertJsonPath('results.0.title', 'The Matrix')
        ->assertJsonPath('results.0.year', 1999);
});

it('fetches a tmdb movie and maps fields including directors', function () {
    Http::fake([
        'api.themoviedb.org/3/movie/*' => Http::response([
            'id' => 603,
            'title' => 'The Matrix',
            'release_date' => '1999-03-30',
            'runtime' => 136,
            'overview' => 'Neo believes that Morpheus...',
            'tagline' => 'Welcome to the Real World.',
            'genres' => [['id' => 1, 'name' => 'Action'], ['id' => 2, 'name' => 'Sci-Fi']],
            'production_countries' => [['iso_3166_1' => 'US', 'name' => 'United States of America']],
            'spoken_languages' => [['iso_639_1' => 'en', 'english_name' => 'English']],
            'credits' => [
                'crew' => [
                    ['job' => 'Director', 'name' => 'Lana Wachowski'],
                    ['job' => 'Director', 'name' => 'Lilly Wachowski'],
                    ['job' => 'Producer', 'name' => 'Joel Silver'],
                ],
            ],
        ], 200),
    ]);

    $user = User::factory()->create();
    $this->actingAs($user);

    $res = $this->getJson('/api/tmdb/movies/603');
    $res->assertOk()
        ->assertJsonPath('title', 'The Matrix')
        ->assertJsonPath('year', 1999)
        ->assertJsonPath('custom_attributes.run_time', 136)
        ->assertJsonPath('custom_attributes.genres.0', 'Action')
        ->assertJsonPath('custom_attributes.countries.0.code', 'US')
        ->assertJsonPath('custom_attributes.languages.0.name', 'English')
        ->assertJsonPath('custom_attributes.directors.0', 'Lana Wachowski')
        ->assertJsonPath('custom_attributes.directors.1', 'Lilly Wachowski');
});
