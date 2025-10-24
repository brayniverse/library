<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class TmdbController extends Controller
{
    public function search(Request $request)
    {
        $request->validate([
            'query' => ['required', 'string', 'min:2'],
        ]);

        $query = $request->string('query')->toString();

        $response = $this->tmdbGet('/3/search/movie', [
            'query' => $query,
            'include_adult' => false,
            'language' => 'en-US',
            'page' => 1,
        ]);

        if ($response->failed()) {
            return response()->json(['message' => 'TMDB search failed'], 502);
        }

        $payload = $response->json();
        $results = collect($payload['results'] ?? [])->map(function ($item) {
            $releaseYear = null;
            if (! empty($item['release_date'])) {
                $releaseYear = (int) substr($item['release_date'], 0, 4);
            }

            $posterPath = $item['poster_path'] ?? null;
            $posterUrl = $posterPath ? ('https://image.tmdb.org/t/p/w500' . $posterPath) : null;

            return [
                'id' => $item['id'] ?? null,
                'title' => $item['title'] ?? ($item['name'] ?? ''),
                'year' => $releaseYear,
                'overview' => $item['overview'] ?? null,
                'poster_path' => $posterPath,
                'poster_url' => $posterUrl,
            ];
        })->values();

        return response()->json(['results' => $results]);
    }

    public function movie(int $id)
    {
        // Append additional data we need in a single call
        $response = $this->tmdbGet("/3/movie/{$id}", [
            'append_to_response' => 'release_dates,credits',
            'language' => 'en-US',
        ]);

        if ($response->status() === 404) {
            return response()->json(['message' => 'Not found'], 404);
        }

        if ($response->failed()) {
            return response()->json(['message' => 'TMDB request failed'], 502);
        }

        $m = $response->json();

        $year = null;
        if (! empty($m['release_date'])) {
            $year = (int) substr($m['release_date'], 0, 4);
        }

        $genres = collect($m['genres'] ?? [])->pluck('name')->filter()->values()->all();
        $countries = collect($m['production_countries'] ?? [])->map(function ($c) {
            return [
                'code' => $c['iso_3166_1'] ?? '',
                'name' => $c['name'] ?? '',
            ];
        })->values()->all();
        $languages = collect($m['spoken_languages'] ?? [])->map(function ($l) {
            return [
                'code' => $l['iso_639_1'] ?? '',
                'name' => $l['english_name'] ?? ($l['name'] ?? ''),
            ];
        })->values()->all();

        // Extract director names from credits
        $directors = collect($m['credits']['crew'] ?? [])
            ->filter(function ($person) {
                return isset($person['job']) && $person['job'] === 'Director';
            })
            ->pluck('name')
            ->filter()
            ->unique()
            ->values()
            ->all();

        $posterPath = $m['poster_path'] ?? null;
        $posterUrl = $posterPath ? ('https://image.tmdb.org/t/p/w500' . $posterPath) : null;

        $data = [
            'title' => $m['title'] ?? ($m['name'] ?? ''),
            'year' => $year,
            'poster_path' => $posterPath,
            'poster_url' => $posterUrl,
            'custom_attributes' => [
                'run_time' => $m['runtime'] ?? null,
                'genres' => $genres,
                'description' => $m['overview'] ?? null,
                'tagline' => $m['tagline'] ?? null,
                'countries' => $countries,
                'languages' => $languages,
                'directors' => $directors,
            ],
        ];

        return response()->json($data);
    }

    protected function tmdbGet(string $path, array $query = [])
    {
        $base = 'https://api.themoviedb.org';
        $key = config('services.tmdb.key') ?? env('TMDB_KEY');

        // Prefer Bearer if the key looks like a token (starts with 'eyJ')
        if (is_string($key) && str_starts_with($key, 'eyJ')) {
            return Http::withToken($key)->get($base.$path, $query);
        }

        // Otherwise use api_key query param (TMDB v3 style)
        $query = array_merge(['api_key' => $key], $query);

        return Http::get($base.$path, $query);
    }
}
