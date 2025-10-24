<?php

namespace App\Http\Controllers;

use App\Enums\MediaFormat;
use App\Enums\MediaType;
use App\Http\Requests\MediaRequest;
use App\Models\Media;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class MediaController extends Controller
{
    use AuthorizesRequests;

    /**
     * Download an image from a remote URL and save it to the public disk,
     * updating the Media's poster_path. When replacing, old file is deleted.
     */
    protected function savePosterFromUrl(Media $media, string $url, bool $replace = false): void
    {
        $url = trim($url);
        if ($url === '') {
            return;
        }

        try {
            $response = Http::timeout(15)->get($url);
            if (! $response->ok()) {
                return;
            }

            $contentType = (string) $response->header('Content-Type', '');
            if ($contentType === '') {
                // Try to infer from URL extension
                $contentType = str_contains($url, '.png') ? 'image/png' : (str_contains($url, '.webp') ? 'image/webp' : 'image/jpeg');
            }

            if (! str_starts_with($contentType, 'image/')) {
                return; // Not an image
            }

            $ext = 'jpg';
            if (str_contains($contentType, 'png')) {
                $ext = 'png';
            } elseif (str_contains($contentType, 'webp')) {
                $ext = 'webp';
            } elseif (preg_match('/\.([a-zA-Z0-9]{3,4})(?:\?|$)/', $url, $m)) {
                $ext = strtolower($m[1]);
            }

            $filename = $media->id.'-'.Str::slug((string) $media->title ?: 'poster').'.'.$ext;
            $path = 'posters/'.$filename;

            // Delete previous if replacing
            if ($replace && $media->poster_path) {
                try {
                    Storage::disk('public')->delete($media->poster_path);
                } catch (\Throwable $e) {
                    // ignore
                }
            }

            Storage::disk('public')->put($path, $response->body());

            $media->poster_path = $path;
            $media->save();
        } catch (\Throwable $e) {
            Log::warning('Failed to save poster from URL', [
                'media_id' => $media->id,
                'url' => $url,
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function index()
    {
        $this->authorize('viewAny', Media::class);

        return Media::all();
    }

    public function store(MediaRequest $request)
    {
        $this->authorize('create', Media::class);

        return Media::create($request->validated());
    }

    public function show(Media $media)
    {
        $this->authorize('view', $media);

        return $media;
    }

    public function update(MediaRequest $request, Media $media)
    {
        $this->authorize('update', $media);

        $media->update($request->validated());

        return $media;
    }

    public function destroy(Media $media)
    {
        $this->authorize('delete', $media);

        $media->delete();

        return response()->json();
    }

    // Inertia pages for Films
    public function indexFilms(\Illuminate\Http\Request $request)
    {
        $this->authorize('viewAny', Media::class);

        $q = trim((string) $request->query('q', ''));

        // Sorting (allowlist)
        $sort = $request->query('sort', 'created_at');
        $direction = strtolower((string) $request->query('direction', 'desc')) === 'asc' ? 'asc' : 'desc';
        if (! in_array($sort, ['title', 'year', 'created_at'], true)) {
            $sort = 'created_at';
        }

        // Filters
        $format = trim((string) $request->query('format', ''));
        $language = trim((string) $request->query('language', ''));
        $country = trim((string) $request->query('country', ''));
        $director = trim((string) $request->query('director', ''));
        $year = $request->query('year');
        $year = is_null($year) || $year === '' ? null : (int) $year;

        $baseQuery = Media::query()
            ->where('type', MediaType::Film->value)
            ->select(['id', 'title', 'orderable_title', 'format', 'year', 'custom_attributes', 'poster_path']);

        // Closure to apply filters consistently
        $applyFilters = function ($query) use ($format, $language, $country, $director, $year) {
            /** @var \Illuminate\Database\Eloquent\Builder $query */
            return $query
                ->when($format !== '', fn ($q) => $q->where('format', $format))
                ->when(! is_null($year), fn ($q) => $q->where('year', $year))
                ->when($language !== '', function ($q) use ($language) {
                    $q->where(function ($q2) use ($language) {
                        $q2->whereRaw("JSON_SEARCH(JSON_EXTRACT(custom_attributes, '$.languages[*].code'), 'one', ?, NULL) IS NOT NULL", [$language])
                            ->orWhereRaw("JSON_SEARCH(JSON_EXTRACT(custom_attributes, '$.languages[*].name'), 'one', ?, NULL) IS NOT NULL", [$language]);
                    });
                })
                ->when($country !== '', function ($q) use ($country) {
                    $q->where(function ($q2) use ($country) {
                        $q2->whereRaw("JSON_SEARCH(JSON_EXTRACT(custom_attributes, '$.countries[*].code'), 'one', ?, NULL) IS NOT NULL", [$country])
                            ->orWhereRaw("JSON_SEARCH(JSON_EXTRACT(custom_attributes, '$.countries[*].name'), 'one', ?, NULL) IS NOT NULL", [$country]);
                    });
                })
                ->when($director !== '', function ($q) use ($director) {
                    $q->whereRaw("JSON_SEARCH(JSON_EXTRACT(custom_attributes, '$.directors[*]'), 'one', ?, NULL) IS NOT NULL", [$director]);
                });
        };

        // Pagination
        $perPage = (int) $request->query('perPage', 5);
        if ($perPage < 10) {
            $perPage = 10;
        } elseif ($perPage > 100) {
            $perPage = 100;
        }

        if ($q !== '') {
            // Use Scout to search and then constrain by the resulting keys to keep type enforcement
            $ids = Media::search($q)->keys();
            // If no matches, short-circuit to an empty paginator
            if ($ids->isEmpty()) {
                $films = $baseQuery->whereRaw('1=0')
                    ->paginate($perPage);
            } else {
                $films = $applyFilters($baseQuery)
                    ->whereIn('id', $ids)
                    ->when($sort === 'title', fn ($q) => $q->orderBy('orderable_title', $direction), fn ($q) => $q->orderBy($sort, $direction))
                    ->paginate($perPage)
                    ->appends($request->query());
            }
        } else {
            $films = $applyFilters($baseQuery)
                ->when($sort === 'title', fn ($q) => $q->orderby('orderable_title', $direction), fn ($q) => $q->orderBy($sort, $direction))
                ->paginate($perPage)
                ->appends($request->query());
        }

        // Derive unique directors list from films in the library for the combobox
        $directors = Media::query()
            ->where('type', MediaType::Film->value)
            ->whereNotNull('custom_attributes')
            ->get(['custom_attributes'])
            ->flatMap(function ($m) {
                $attrs = (array) ($m->custom_attributes ?? []);
                $list = (array) ($attrs['directors'] ?? []);
                return collect($list)->map(function ($d) {
                    return is_string($d) ? trim($d) : '';
                });
            })
            ->filter(fn ($d) => $d !== '')
            ->unique()
            ->sort()
            ->values();

        return Inertia::render('films/index', [
            'films' => $films,
            'formats' => array_map(fn ($c) => $c->value, MediaFormat::cases()),
            'q' => $q,
            'sort' => $sort,
            'direction' => $direction,
            'format' => $format,
            'language' => $language,
            'country' => $country,
            'director' => $director,
            'directors' => $directors,
            'year' => $year,
        ]);
    }

    public function createFilm()
    {
        $this->authorize('create', Media::class);

        $films = Media::query()
            ->where('type', MediaType::Film->value)
            ->orderBy('orderable_title', 'asc')
            ->paginate(25, ['id', 'title', 'format', 'year', 'custom_attributes']);

        return Inertia::render('films/index', [
            'films' => $films,
            'formats' => array_map(fn ($c) => $c->value, MediaFormat::cases()),
            'creating' => true,
        ]);
    }

    public function storeFilm(MediaRequest $request)
    {
        $this->authorize('create', Media::class);

        $data = $request->validated();
        // Enforce Film type regardless of input
        $data['type'] = MediaType::Film->value;

        // Remove poster_url from mass assignment; we'll handle it separately
        $posterUrl = $data['poster_url'] ?? null;
        unset($data['poster_url']);

        $media = Media::create($data);

        if (is_string($posterUrl) && $posterUrl !== '') {
            $this->savePosterFromUrl($media, $posterUrl);
        }

        return redirect()->route('films.index')->with('success', 'Film added successfully.');
    }

    public function updateFilm(MediaRequest $request, Media $media)
    {
        $this->authorize('update', $media);

        $data = $request->validated();
        // Keep type as Film regardless of input
        $data['type'] = MediaType::Film->value;

        $posterUrl = $data['poster_url'] ?? null;
        unset($data['poster_url']);

        $media->update($data);

        if (is_string($posterUrl) && $posterUrl !== '') {
            $this->savePosterFromUrl($media, $posterUrl, true);
        }

        return redirect()->route('films.index')->with('success', 'Film updated successfully.');
    }

    public function destroyFilm(Media $media)
    {
        $this->authorize('delete', $media);

        // Only allow deleting films via this route
        if ($media->type->value !== MediaType::Film->value) {
            abort(404);
        }

        $media->delete();

        return redirect()->route('films.index')->with('success', 'Film deleted successfully.');
    }

    public function fetchPoster(Media $media)
    {
        $this->authorize('update', $media);

        // Ensure it's a film
        if ($media->type->value !== MediaType::Film->value) {
            abort(404);
        }

        // If it already has a poster, do nothing (idempotent)
        if ($media->poster_path) {
            return redirect()->route('films.index')->with('info', 'Poster already exists for this film.');
        }

        try {
            $query = trim((string) ($media->title ?? ''));
            $year = (int) ($media->year ?? 0);

            if ($query === '') {
                return redirect()->route('films.index')->with('error', 'Film title is empty; cannot search TMDB.');
            }

            $base = 'https://api.themoviedb.org';
            $path = '/3/search/movie';

            $key = config('services.tmdb.key') ?? env('TMDB_KEY');

            $params = [
                'query' => $query,
                'include_adult' => false,
                'language' => 'en-US',
                'page' => 1,
            ];
            if ($year > 0) {
                $params['year'] = $year;
            }

            if (is_string($key) && str_starts_with($key, 'eyJ')) {
                $response = Http::withToken($key)->get($base.$path, $params);
            } else {
                $response = Http::get($base.$path, array_merge(['api_key' => $key], $params));
            }

            if ($response->failed()) {
                return redirect()->route('films.index')->with('error', 'TMDB search failed.');
            }

            $payload = $response->json();
            $results = collect($payload['results'] ?? []);

            // Prefer result with poster_path and matching year if available
            $candidate = $results->first(function ($r) use ($year) {
                if (empty($r['poster_path'])) {
                    return false;
                }
                if ($year > 0 && ! empty($r['release_date'])) {
                    return (int) substr($r['release_date'], 0, 4) === $year;
                }
                return true;
            });

            if (! $candidate) {
                // fallback to any with poster
                $candidate = $results->first(fn ($r) => ! empty($r['poster_path']));
            }

            if (! $candidate || empty($candidate['poster_path'])) {
                return redirect()->route('films.index')->with('error', 'No poster found on TMDB for this film.');
            }

            $posterUrl = 'https://image.tmdb.org/t/p/w500'.$candidate['poster_path'];

            $this->savePosterFromUrl($media, $posterUrl, false);

            return redirect()->route('films.index')->with('success', 'Poster fetched successfully.');
        } catch (\Throwable $e) {
            Log::warning('fetchPoster failed', [
                'media_id' => $media->id,
                'error' => $e->getMessage(),
            ]);

            return redirect()->route('films.index')->with('error', 'Unable to fetch poster right now.');
        }
    }
}
