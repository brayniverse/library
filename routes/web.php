<?php

use App\Enums\MediaType;
use App\Http\Controllers\MediaController;
use App\Http\Controllers\TmdbController;
use App\Models\Media;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        $filmsCount = Media::query()->where('type', MediaType::Film->value)->count();

        // Aggregate film genres from custom_attributes.genres (array of strings)
        $films = Media::query()
            ->where('type', MediaType::Film->value)
            ->get(['id', 'custom_attributes']);

        $genreCounts = [];
        foreach ($films as $film) {
            $attrs = (array) ($film->custom_attributes ?? []);
            $genres = $attrs['genres'] ?? [];
            if (is_array($genres)) {
                foreach ($genres as $g) {
                    if (! is_string($g) || $g === '') {
                        continue;
                    }
                    $name = $g;
                    $genreCounts[$name] = ($genreCounts[$name] ?? 0) + 1;
                }
            }
        }

        ksort($genreCounts); // Keep it stable and alphabetical

        $genresDistribution = [];
        foreach ($genreCounts as $name => $count) {
            $genresDistribution[] = [
                'name' => $name,
                'count' => $count,
            ];
        }

        // Aggregate film directors from custom_attributes.directors (array of strings)
        $directorCounts = [];
        foreach ($films as $film) {
            $attrs = (array) ($film->custom_attributes ?? []);
            $directors = $attrs['directors'] ?? [];
            if (is_array($directors)) {
                foreach ($directors as $d) {
                    if (! is_string($d) || $d === '') {
                        continue;
                    }
                    $name = $d;
                    $directorCounts[$name] = ($directorCounts[$name] ?? 0) + 1;
                }
            }
        }

        ksort($directorCounts); // alphabetical

        $directorsDistribution = [];
        foreach ($directorCounts as $name => $count) {
            $directorsDistribution[] = [
                'name' => $name,
                'count' => $count,
            ];
        }

        // Aggregate films by decade from the year field
        $years = Media::query()
            ->where('type', MediaType::Film->value)
            ->whereNotNull('year')
            ->get(['id', 'year']);

        $decadeCounts = [];
        foreach ($years as $film) {
            $year = (int) $film->year;
            if ($year <= 0) {
                continue;
            }
            $decadeStart = (int) (floor($year / 10) * 10);
            $decadeCounts[$decadeStart] = ($decadeCounts[$decadeStart] ?? 0) + 1;
        }

        ksort($decadeCounts, SORT_NUMERIC);

        $decadesDistribution = [];
        foreach ($decadeCounts as $start => $count) {
            $decadesDistribution[] = [
                'name' => $start.'s',
                'count' => $count,
            ];
        }

        // Aggregate film languages from custom_attributes.languages (array of objects with optional code/name)
        $languageCounts = [];
        foreach ($films as $film) {
            $attrs = (array) ($film->custom_attributes ?? []);
            $languages = $attrs['languages'] ?? [];
            if (is_array($languages)) {
                foreach ($languages as $lang) {
                    // Accept either associative array with name/code or raw string
                    $label = null;
                    if (is_array($lang)) {
                        $name = $lang['name'] ?? null;
                        $code = $lang['code'] ?? null;
                        $label = is_string($name) && $name !== '' ? $name : (is_string($code) ? $code : null);
                    } elseif (is_string($lang)) {
                        $label = $lang;
                    }
                    if (! is_string($label) || $label === '') {
                        continue;
                    }
                    $languageCounts[$label] = ($languageCounts[$label] ?? 0) + 1;
                }
            }
        }

        ksort($languageCounts); // alphabetical

        $languagesDistribution = [];
        foreach ($languageCounts as $name => $count) {
            $languagesDistribution[] = [
                'name' => $name,
                'count' => $count,
            ];
        }

        return Inertia::render('dashboard', [
            'filmsCount' => $filmsCount,
            'genresDistribution' => $genresDistribution,
            'directorsDistribution' => $directorsDistribution,
            'decadesDistribution' => $decadesDistribution,
            'languagesDistribution' => $languagesDistribution,
        ]);
    })->name('dashboard');

    // Films
    Route::get('films', [MediaController::class, 'indexFilms'])->name('films.index');
    Route::get('films/create', [MediaController::class, 'createFilm'])->name('films.create');
    Route::post('films', [MediaController::class, 'storeFilm'])->name('films.store');
    Route::put('films/{media}', [MediaController::class, 'updateFilm'])->name('films.update');
    Route::post('films/{media}/poster', [MediaController::class, 'fetchPoster'])->name('films.fetchPoster');
    Route::delete('films/{media}', [MediaController::class, 'destroyFilm'])->name('films.destroy');

    // TMDB API helpers
    Route::get('api/tmdb/search', [TmdbController::class, 'search'])->name('tmdb.search');
    Route::get('api/tmdb/movies/{id}', [TmdbController::class, 'movie'])->name('tmdb.movie');
});

Route::passkeys();

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
