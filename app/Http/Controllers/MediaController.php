<?php

namespace App\Http\Controllers;

use App\Enums\MediaFormat;
use App\Enums\MediaType;
use App\Http\Requests\MediaRequest;
use App\Models\Media;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Inertia\Inertia;

class MediaController extends Controller
{
    use AuthorizesRequests;

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
        $sort = $request->query('sort', 'title');
        $direction = strtolower((string) $request->query('direction', 'asc')) === 'desc' ? 'desc' : 'asc';
        if (! in_array($sort, ['title', 'year'], true)) {
            $sort = 'title';
        }

        // Filters
        $format = trim((string) $request->query('format', ''));
        $language = trim((string) $request->query('language', ''));
        $country = trim((string) $request->query('country', ''));
        $year = $request->query('year');
        $year = is_null($year) || $year === '' ? null : (int) $year;

        // Normalized title ordering that ignores leading "The " (case-insensitive)
        $titleOrderRaw = 'CASE WHEN LOWER(title) LIKE "the %" THEN SUBSTRING(title, 5) ELSE title END '.$direction;

        $baseQuery = Media::query()
            ->where('type', MediaType::Film->value);

        // Closure to apply filters consistently
        $applyFilters = function ($query) use ($format, $language, $country, $year) {
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
                });
        };

        if ($q !== '') {
            // Use Scout to search and then constrain by the resulting keys to keep type enforcement
            $ids = Media::search($q)->keys();
            // If no matches, short-circuit to empty collection
            if ($ids->isEmpty()) {
                $films = collect();
            } else {
                $films = $applyFilters($baseQuery)
                    ->whereIn('id', $ids)
                    ->when($sort === 'title', fn ($q) => $q->orderByRaw($titleOrderRaw), fn ($q) => $q->orderBy($sort, $direction))
                    ->get(['id', 'title', 'format', 'year', 'custom_attributes']);
            }
        } else {
            $films = $applyFilters($baseQuery)
                ->when($sort === 'title', fn ($q) => $q->orderByRaw($titleOrderRaw), fn ($q) => $q->orderBy($sort, $direction))
                ->get(['id', 'title', 'format', 'year', 'custom_attributes']);
        }

        return Inertia::render('films/index', [
            'films' => $films,
            'formats' => array_map(fn ($c) => $c->value, MediaFormat::cases()),
            'q' => $q,
            'sort' => $sort,
            'direction' => $direction,
            'format' => $format,
            'language' => $language,
            'country' => $country,
            'year' => $year,
        ]);
    }

    public function createFilm()
    {
        $this->authorize('create', Media::class);

        // Use normalized title ordering (ignoring leading "The ") for consistency
        $titleOrderRaw = 'CASE WHEN LOWER(title) LIKE "the %" THEN SUBSTRING(title, 5) ELSE title END asc';

        $films = Media::query()
            ->where('type', MediaType::Film->value)
            ->orderByRaw($titleOrderRaw)
            ->get(['id', 'title', 'format', 'year', 'custom_attributes']);

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

        Media::create($data);

        return redirect()->route('films.index')->with('success', 'Film added successfully.');
    }

    public function updateFilm(MediaRequest $request, Media $media)
    {
        $this->authorize('update', $media);

        $data = $request->validated();
        // Keep type as Film regardless of input
        $data['type'] = MediaType::Film->value;

        $media->update($data);

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
}
