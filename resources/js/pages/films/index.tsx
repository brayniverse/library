import AppLayout from '@/layouts/app-layout';
import { Head, useForm, Link, router } from '@inertiajs/react';
import React from 'react';
import filmRoutes from '@/routes/films';
import tmdb from '@/routes/tmdb';
import { type BreadcrumbItem } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DataTable } from '@/components/data-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupAddon } from '@/components/ui/input-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { MoreHorizontal, SlidersHorizontal, Search as SearchIcon } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';

const ALL_FORMAT = '__ALL__';

// Types for props coming from Inertia
type CodeName = { code: string; name: string };

type CustomAttributes = {
  run_time?: number | null;
  genres?: string[];
  directors?: string[];
  description?: string;
  tagline?: string;
  countries?: CodeName[];
  languages?: CodeName[];
};

type Film = {
  id: number;
  title: string;
  format: string;
  year: number;
  custom_attributes?: CustomAttributes | null;
};

type Props = {
  films: Film[];
  formats: string[];
  creating?: boolean;
  q?: string;
  sort?: 'title' | 'year';
  direction?: 'asc' | 'desc';
  format?: string;
  language?: string;
  country?: string;
  director?: string;
  directors?: string[];
  year?: number | null;
};

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Films',
    href: filmRoutes.index().url,
  },
];

export default function FilmsIndex({ films, formats, creating = false, q = '', sort = 'title', direction = 'asc', format = '', language = '', country = '', director = '', directors = [], year = null }: Props) {
  const [selected, setSelected] = React.useState<Film | null>(null);
  const [editing, setEditing] = React.useState<boolean>(false);
  const [query, setQuery] = React.useState<string>(q);
  const [orderBy, setOrderBy] = React.useState<'title' | 'year'>(sort);
  const [orderDir, setOrderDir] = React.useState<'asc' | 'desc'>(direction);
  const [formatFilter, setFormatFilter] = React.useState<string>(format);
  const [languageFilter, setLanguageFilter] = React.useState<string>(language);
  const [countryFilter, setCountryFilter] = React.useState<string>(country);
  const [directorFilter, setDirectorFilter] = React.useState<string>(director);
  const [directorMenuOpen, setDirectorMenuOpen] = React.useState<boolean>(false);
  const [directorSearch, setDirectorSearch] = React.useState<string>('');
  const [yearFilter, setYearFilter] = React.useState<string>(year === null || typeof year === 'undefined' ? '' : String(year));
  const [filtersOpen, setFiltersOpen] = React.useState<boolean>(false);
  const [showCreateDetails, setShowCreateDetails] = React.useState<boolean>(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Film | null>(null);
  const [deleteOpen, setDeleteOpen] = React.useState<boolean>(false);

  const requestFilms = React.useCallback((params?: { q?: string; sort?: 'title' | 'year'; direction?: 'asc' | 'desc'; format?: string; language?: string; country?: string; director?: string; year?: string | number | null }) => {
    router.get(filmRoutes.index.url(), {
      q: params?.q ?? query,
      sort: params?.sort ?? orderBy,
      direction: params?.direction ?? orderDir,
      format: params?.format ?? formatFilter,
      language: params?.language ?? languageFilter,
      country: params?.country ?? countryFilter,
      director: params?.director ?? directorFilter,
      year: params?.year ?? yearFilter,
    }, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      only: ['films', 'q', 'sort', 'direction', 'format', 'language', 'country', 'director', 'year'],
    });
  }, [query, orderBy, orderDir, formatFilter, languageFilter, countryFilter, directorFilter, yearFilter]);

  // Live-search as you type (debounced)
  React.useEffect(() => {
    const handler = setTimeout(() => {
      requestFilms();
    }, 300);
    return () => clearTimeout(handler);
  }, [query, orderBy, orderDir, formatFilter, languageFilter, countryFilter, directorFilter, yearFilter, requestFilms]);

  const { data, setData, put, processing, errors, reset, wasSuccessful } = useForm({
    title: '',
    format: formats?.[0] ?? '',
    year: new Date().getFullYear(),
    type: 'Film',
    custom_attributes: {} as CustomAttributes,
  });

  // Create form state for the Create Film modal
  const {
    data: createData,
    setData: setCreateData,
    post: postCreate,
    processing: creatingProcessing,
    errors: createErrors,
    reset: resetCreate,
    wasSuccessful: createWasSuccessful,
  } = useForm({
    title: '',
    format: formats?.[0] ?? '',
    year: new Date().getFullYear(),
    type: 'Film',
    custom_attributes: {} as CustomAttributes,
  });

  // TMDB search state for Create modal
  const [tmdbSearching, setTmdbSearching] = React.useState(false);
  const [tmdbError, setTmdbError] = React.useState<string | null>(null);
  const [tmdbResults, setTmdbResults] = React.useState<Array<{ id: number; title: string; year: number | null; overview?: string | null }>>([]);
  const [tmdbHasSearched, setTmdbHasSearched] = React.useState(false);

  const searchTmdb = async () => {
    const q = (createData.title || '').trim();
    if (q.length < 2) {
      setTmdbError('Enter at least 2 characters to search');
      setTmdbResults([]);
      setTmdbHasSearched(false);
      return;
    }
    setTmdbError(null);
    setTmdbSearching(true);
    setTmdbHasSearched(true);
    try {
      const res = await fetch(tmdb.search.url({ query: { query: q } }), {
        headers: { 'Accept': 'application/json' },
        credentials: 'same-origin',
      });
      if (!res.ok) {
        throw new Error('Search failed');
      }
      const data = await res.json();
      setTmdbResults(data.results ?? []);
    } catch {
      setTmdbError('Unable to search TMDB right now.');
      setTmdbResults([]);
    } finally {
      setTmdbSearching(false);
    }
  };

  const applyTmdb = async (id: number) => {
    setTmdbError(null);
    setTmdbSearching(true);
    try {
      const res = await fetch(tmdb.movie.url(id), {
        headers: { 'Accept': 'application/json' },
        credentials: 'same-origin',
      });
      if (!res.ok) {
        throw new Error('Fetch failed');
      }
      const m = await res.json();
      // Populate form fields from TMDB data
      if (m.title) setCreateData('title', m.title);
      if (m.year) setCreateData('year', Number(m.year));

      const current = (createData.custom_attributes as CustomAttributes) ?? {};
      const next: CustomAttributes = {
        ...current,
        run_time: m.custom_attributes?.run_time ?? current.run_time ?? null,
        genres: m.custom_attributes?.genres ?? current.genres ?? [],
        directors: m.custom_attributes?.directors ?? current.directors ?? [],
        description: m.custom_attributes?.description ?? current.description ?? '',
        tagline: m.custom_attributes?.tagline ?? current.tagline ?? '',
        countries: m.custom_attributes?.countries ?? current.countries ?? [],
        languages: m.custom_attributes?.languages ?? current.languages ?? [],
      };
      setCreateData('custom_attributes', next as unknown);
      setShowCreateDetails(true);
    } catch {
      setTmdbError('Unable to fetch details from TMDB.');
    } finally {
      setTmdbSearching(false);
    }
  };

  React.useEffect(() => {
    if (selected) {
      setData({
        title: selected.title,
        format: selected.format,
        year: selected.year,
        type: 'Film',
        custom_attributes: (selected.custom_attributes ?? {}) as CustomAttributes,
      });
    }
  }, [selected]);

  React.useEffect(() => {
    if (wasSuccessful) {
      // Close the edit modal after a successful save
      setSelected(null);
    }
  }, [wasSuccessful]);

  React.useEffect(() => {
    if (creating && createWasSuccessful) {
      // Close create modal after a successful creation and return to /films
      resetCreate('title');
      router.visit(filmRoutes.index.url(), { replace: true });
    }
  }, [creating, createWasSuccessful]);

  const onSubmit: React.FormEventHandler = (e) => {
    e.preventDefault();
    if (!selected) return;
    put(filmRoutes.update.url(selected.id));
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Films" />

      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <div className="rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Left: Search */}
            <div className="flex items-center">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                }}
                className="flex items-center gap-2"
              >
                <div className="w-56">
                  <InputGroup>
                    <InputGroupAddon>
                      <SearchIcon className="h-4 w-4" />
                    </InputGroupAddon>
                    <Input
                      type="search"
                      placeholder="Search films…"
                      aria-label="Search films"
                      className="pl-8"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </InputGroup>
                </div>
                {(query !== '' || formatFilter !== '' || languageFilter !== '' || countryFilter !== '' || directorFilter !== '' || yearFilter !== '') && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setQuery(''); setFormatFilter(''); setLanguageFilter(''); setCountryFilter(''); setDirectorFilter(''); setYearFilter(''); }}
                  >
                    Clear
                  </Button>
                )}
              </form>
            </div>

            {/* Right: Filters trigger and Add Film */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFiltersOpen(true)}
                title="Open filters"
                aria-label="Filters"
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span className="sr-only">Filters</span>
              </Button>

              {/* Filters Sheet */}
              <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                <SheetContent side="right" className="w-[90vw] sm:max-w-sm">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4 mx-4 flex flex-col gap-3">
                    <label className="text-sm font-medium" htmlFor="filter-format">Format</label>
                    <Select value={formatFilter === '' ? ALL_FORMAT : formatFilter} onValueChange={(val) => setFormatFilter(val === ALL_FORMAT ? '' : val)}>
                      <SelectTrigger id="filter-format" aria-label="Format">
                        <SelectValue placeholder="All formats" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL_FORMAT}>All formats</SelectItem>
                        {formats.map((f) => (
                          <SelectItem key={f} value={f}>{f}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <label className="text-sm font-medium" htmlFor="filter-language">Language (name or code)</label>
                    <Input
                      id="filter-language"
                      type="text"
                      placeholder="e.g. English or en"
                      value={languageFilter}
                      onChange={(e) => setLanguageFilter(e.target.value)}
                    />

                    <label className="text-sm font-medium" htmlFor="filter-country">Country (name or code)</label>
                    <Input
                      id="filter-country"
                      type="text"
                      placeholder="e.g. United States or US"
                      value={countryFilter}
                      onChange={(e) => setCountryFilter(e.target.value)}
                    />

                    <label className="text-sm font-medium" htmlFor="filter-director">Director</label>
                    <DropdownMenu open={directorMenuOpen} onOpenChange={setDirectorMenuOpen}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          id="filter-director"
                          variant="outline"
                          aria-haspopup="listbox"
                          className="justify-between"
                        >
                          {directorFilter !== '' ? directorFilter : 'All directors'}
                          <MoreHorizontal className="ml-2 h-4 w-4 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-64 p-2">
                        <Input
                          type="text"
                          placeholder="Search directors…"
                          value={directorSearch}
                          onChange={(e) => setDirectorSearch(e.target.value)}
                          className="mb-2"
                          autoFocus
                        />
                        <DropdownMenuItem onSelect={() => { setDirectorFilter(''); setDirectorSearch(''); setDirectorMenuOpen(false); }}>
                          All directors
                        </DropdownMenuItem>
                        {directors
                          .filter((d) => d.toLowerCase().includes(directorSearch.toLowerCase()))
                          .slice(0, 100)
                          .map((d) => (
                            <DropdownMenuItem key={d} onSelect={() => { setDirectorFilter(d); setDirectorMenuOpen(false); }}>
                              {d}
                            </DropdownMenuItem>
                          ))}
                        {directorSearch && !directors.some((d) => d.toLowerCase() === directorSearch.toLowerCase()) && (
                          <DropdownMenuItem onSelect={() => { setDirectorFilter(directorSearch); setDirectorMenuOpen(false); }}>
                            Use "{directorSearch}"
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <label className="text-sm font-medium" htmlFor="filter-year">Year</label>
                    <Input
                      id="filter-year"
                      type="number"
                      placeholder="Year"
                      value={yearFilter}
                      min={1888}
                      max={new Date().getFullYear() + 1}
                      onChange={(e) => setYearFilter(e.target.value)}
                    />

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => { setQuery(''); setFormatFilter(''); setLanguageFilter(''); setCountryFilter(''); setDirectorFilter(''); setYearFilter(''); }}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <Button asChild>
                <Link href={filmRoutes.create().url} prefetch>
                  Add Film
                </Link>
              </Button>
            </div>
          </div>

          {(() => {
            const columns: ColumnDef<Film>[] = [
              {
                accessorKey: 'title',
                header: () => (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="inline-flex items-center gap-1"
                    onClick={() => {
                      const nextDir: 'asc' | 'desc' = (orderBy === 'title' && orderDir === 'asc') ? 'desc' : 'asc';
                      setOrderBy('title');
                      setOrderDir(nextDir);
                      requestFilms({ sort: 'title', direction: nextDir });
                    }}
                  >
                    Title{orderBy === 'title' ? (orderDir === 'asc' ? ' ▲' : ' ▼') : ''}
                  </Button>
                ),
                cell: ({ row }) => row.original.title,
              },
              {
                accessorKey: 'format',
                header: () => 'Format',
                cell: ({ row }) => row.original.format,
              },
              {
                id: 'language',
                header: () => 'Language',
                cell: ({ row }) => {
                  const languages = row.original.custom_attributes?.languages ?? [];
                  const primary = languages[0] ? (languages[0].name || languages[0].code || '') : '';
                  const more = languages.length > 1 ? ` +${languages.length - 1}` : '';
                  return primary ? `${primary}${more}` : '—';
                },
              },
              {
                id: 'country',
                header: () => 'Country',
                cell: ({ row }) => {
                  const countries = row.original.custom_attributes?.countries ?? [];
                  const primary = countries[0] ? (countries[0].name || countries[0].code || '') : '';
                  const more = countries.length > 1 ? ` +${countries.length - 1}` : '';
                  return primary ? `${primary}${more}` : '—';
                },
              },
              {
                accessorKey: 'year',
                header: () => (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="inline-flex items-center gap-1"
                    onClick={() => {
                      const nextDir: 'asc' | 'desc' = (orderBy === 'year' && orderDir === 'asc') ? 'desc' : 'asc';
                      setOrderBy('year');
                      setOrderDir(nextDir);
                      requestFilms({ sort: 'year', direction: nextDir });
                    }}
                  >
                    Year{orderBy === 'year' ? (orderDir === 'asc' ? ' ▲' : ' ▼') : ''}
                  </Button>
                ),
                cell: ({ row }) => row.original.year,
              },
              {
                id: 'actions',
                header: () => '',
                cell: ({ row }) => {
                  const film = row.original as Film;
                  return (
                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            aria-label="Actions"
                            variant="ghost"
                            size="icon"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelected(film); setEditing(true); }}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(film);
                              setDeleteOpen(true);
                            }}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                },
                enableSorting: false,
              },
            ];
            return (
              <DataTable
                columns={columns}
                data={films}
                onRowClick={(row) => { const film = row.original as Film; setSelected(film); setEditing(false); }}
              />
            );
          })()}
        </div>
      </div>

      {/* Create Film Modal (opens on /films/create) */}
      <Dialog
        open={creating}
        onOpenChange={(open) => {
          if (!open) {
            resetCreate();
            setShowCreateDetails(false);
            router.visit(filmRoutes.index.url(), { replace: true, preserveScroll: true });
          }
        }}
      >
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle>Add Film</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              postCreate(filmRoutes.store.url(), {
                onSuccess: () => {
                  resetCreate('title');
                  router.visit(filmRoutes.index.url(), { replace: true });
                },
              });
            }}
            className="space-y-4"
          >
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="create-title">Title</label>
              <div className="flex gap-2 items-stretch">
                <Input
                  id="create-title"
                  type="text"
                  value={createData.title}
                  onChange={(e) => setCreateData('title', e.target.value)}
                  required
                  className="flex-1 min-w-0"
                />
                <Button
                  type="button"
                  onClick={searchTmdb}
                  variant="outline"
                  disabled={tmdbSearching}
                  title="Search The Movie Database"
                  className="shrink-0"
                >
                  {tmdbSearching ? 'Searching…' : 'Find from TMDB'}
                </Button>
              </div>
              {createErrors.title && <p className="mt-1 text-sm text-red-600">{createErrors.title}</p>}
              {(tmdbError) && <p className="mt-1 text-sm text-red-600">{tmdbError}</p>}

              {/* Results list */}
              {tmdbHasSearched && (
                <>
                  <div className="mt-2 max-h-60 overflow-auto rounded border max-w-full">
                    {tmdbResults.length === 0 && !tmdbSearching && (
                      <div className="p-2 text-sm text-muted-foreground">No results.</div>
                    )}
                    {tmdbResults.map((r) => (
                      <Button
                        key={r.id}
                        type="button"
                        onClick={() => applyTmdb(r.id)}
                        variant="ghost"
                        className="flex w-full items-start justify-start gap-3 border-b p-2 text-left last:border-b-0 hover:bg-muted/30"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{r.title}{r.year ? ` (${r.year})` : ''}</div>
                          {r.overview && (
                            <div className="line-clamp-2 text-xs text-muted-foreground">{r.overview}</div>
                          )}
                        </div>
                      </Button>
                    ))}
                  </div>
                  <div className="mt-2">
                    <Button
                      type="button"
                      variant="link"
                      className="text-sm"
                      onClick={() => setShowCreateDetails(true)}
                    >
                      Can't find what you're looking for? Enter the film manually
                    </Button>
                  </div>
                </>
              )}
            </div>

            <div className={!showCreateDetails ? 'hidden' : ''}>
              <label className="mb-1 block text-sm font-medium" htmlFor="create-format">Format</label>
              <Select value={createData.format} onValueChange={(val) => setCreateData('format', val)}>
                <SelectTrigger id="create-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {formats.map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {createErrors.format && <p className="mt-1 text-sm text-red-600">{createErrors.format}</p>}
            </div>

            <div className={!showCreateDetails ? 'hidden' : ''}>
              <label className="mb-1 block text-sm font-medium" htmlFor="create-year">Year</label>
              <Input
                id="create-year"
                type="number"
                value={createData.year}
                min={1888}
                max={new Date().getFullYear() + 1}
                onChange={(e) => setCreateData('year', Number(e.target.value))}
                required
              />
              {createErrors.year && <p className="mt-1 text-sm text-red-600">{createErrors.year}</p>}
            </div>

            <div className={`pt-2 ${!showCreateDetails ? 'hidden' : ''}`}>
              <h3 className="text-sm font-semibold mb-2">Optional Attributes</h3>

              <div className="grid gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium" htmlFor="create-run_time">Run Time (minutes)</label>
                  <Input
                    id="create-run_time"
                    type="number"
                    value={(createData.custom_attributes as CustomAttributes)?.run_time ?? ''}
                    min={0}
                    onChange={(e) => {
                      const val = e.target.value;
                      const attrs = (createData.custom_attributes as CustomAttributes) ?? {};
                      const next = { ...attrs, run_time: val === '' ? null : Number(val) };
                      setCreateData('custom_attributes', next as unknown);
                    }}
                  />
                  {createErrors['custom_attributes.run_time'] && (
                    <p className="mt-1 text-sm text-red-600">{createErrors['custom_attributes.run_time']}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium" htmlFor="create-genres">Genres (comma separated)</label>
                  <Input
                    id="create-genres"
                    type="text"
                    value={((createData.custom_attributes as CustomAttributes)?.genres ?? []).join(', ')}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const arr = raw.split(',').map((s) => s.trim()).filter(Boolean);
                      const attrs = (createData.custom_attributes as CustomAttributes) ?? {};
                      setCreateData('custom_attributes', { ...attrs, genres: arr } as unknown);
                    }}
                  />
                  {createErrors['custom_attributes.genres'] && (
                    <p className="mt-1 text-sm text-red-600">{createErrors['custom_attributes.genres']}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium" htmlFor="create-directors">Director(s) (comma separated)</label>
                  <Input
                    id="create-directors"
                    type="text"
                    value={((createData.custom_attributes as CustomAttributes)?.directors ?? []).join(', ')}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const arr = raw.split(',').map((s) => s.trim()).filter(Boolean);
                      const attrs = (createData.custom_attributes as CustomAttributes) ?? {};
                      setCreateData('custom_attributes', { ...attrs, directors: arr } as unknown);
                    }}
                  />
                  {createErrors['custom_attributes.directors'] && (
                    <p className="mt-1 text-sm text-red-600">{createErrors['custom_attributes.directors']}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium" htmlFor="create-description">Description</label>
                  <Textarea
                    id="create-description"
                    rows={3}
                    value={(createData.custom_attributes as CustomAttributes)?.description ?? ''}
                    onChange={(e) => {
                      const attrs = (createData.custom_attributes as CustomAttributes) ?? {};
                      setCreateData('custom_attributes', { ...attrs, description: e.target.value } as unknown);
                    }}
                  />
                  {createErrors['custom_attributes.description'] && (
                    <p className="mt-1 text-sm text-red-600">{createErrors['custom_attributes.description']}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium" htmlFor="create-tagline">Tagline</label>
                  <Input
                    id="create-tagline"
                    type="text"
                    value={(createData.custom_attributes as CustomAttributes)?.tagline ?? ''}
                    onChange={(e) => {
                      const attrs = (createData.custom_attributes as CustomAttributes) ?? {};
                      setCreateData('custom_attributes', { ...attrs, tagline: e.target.value } as unknown);
                    }}
                  />
                  {createErrors['custom_attributes.tagline'] && (
                    <p className="mt-1 text-sm text-red-600">{createErrors['custom_attributes.tagline']}</p>
                  )}
                </div>

                {/* Countries */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="mb-1 block text-sm font-medium">Countries</label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const attrs = (createData.custom_attributes as CustomAttributes) ?? {};
                        const list = [...(attrs.countries ?? []), { code: '', name: '' }];
                        setCreateData('custom_attributes', { ...attrs, countries: list } as unknown);
                      }}
                    >
                      Add Country
                    </Button>
                  </div>
                  {(((createData.custom_attributes as CustomAttributes)?.countries) ?? []).map((c, i) => (
                    <div key={i} className="mb-2 flex gap-2">
                      <Input
                        placeholder="Code"
                        className="w-24"
                        value={c.code}
                        onChange={(e) => {
                          const attrs = (createData.custom_attributes as CustomAttributes) ?? {};
                          const list = [...(attrs.countries ?? [])];
                          list[i] = { ...list[i], code: e.target.value } as CodeName;
                          setCreateData('custom_attributes', { ...attrs, countries: list } as unknown);
                        }}
                      />
                      <Input
                        placeholder="Name"
                        className="flex-1"
                        value={c.name}
                        onChange={(e) => {
                          const attrs = (createData.custom_attributes as CustomAttributes) ?? {};
                          const list = [...(attrs.countries ?? [])];
                          list[i] = { ...list[i], name: e.target.value } as CodeName;
                          setCreateData('custom_attributes', { ...attrs, countries: list } as unknown);
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const attrs = (createData.custom_attributes as CustomAttributes) ?? {};
                          const list = [...(attrs.countries ?? [])];
                          list.splice(i, 1);
                          setCreateData('custom_attributes', { ...attrs, countries: list } as unknown);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Languages */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="mb-1 block text-sm font-medium">Languages</label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const attrs = (createData.custom_attributes as CustomAttributes) ?? {};
                        const list = [...(attrs.languages ?? []), { code: '', name: '' }];
                        setCreateData('custom_attributes', { ...attrs, languages: list } as unknown);
                      }}
                    >
                      Add Language
                    </Button>
                  </div>
                  {(((createData.custom_attributes as CustomAttributes)?.languages) ?? []).map((c, i) => (
                    <div key={i} className="mb-2 flex gap-2">
                      <Input
                        placeholder="Code"
                        className="w-24"
                        value={c.code}
                        onChange={(e) => {
                          const attrs = (createData.custom_attributes as CustomAttributes) ?? {};
                          const list = [...(attrs.languages ?? [])];
                          list[i] = { ...list[i], code: e.target.value } as CodeName;
                          setCreateData('custom_attributes', { ...attrs, languages: list } as unknown);
                        }}
                      />
                      <Input
                        placeholder="Name"
                        className="flex-1"
                        value={c.name}
                        onChange={(e) => {
                          const attrs = (createData.custom_attributes as CustomAttributes) ?? {};
                          const list = [...(attrs.languages ?? [])];
                          list[i] = { ...list[i], name: e.target.value } as CodeName;
                          setCreateData('custom_attributes', { ...attrs, languages: list } as unknown);
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const attrs = (createData.custom_attributes as CustomAttributes) ?? {};
                          const list = [...(attrs.languages ?? [])];
                          list.splice(i, 1);
                          setCreateData('custom_attributes', { ...attrs, languages: list } as unknown);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Hidden type to satisfy validation, server enforces Film */}
            {showCreateDetails && (<input type="hidden" name="type" value={createData.type} />)}

            {showCreateDetails ? (
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetCreate();
                    setShowCreateDetails(false);
                    router.visit(filmRoutes.index.url(), { replace: true, preserveScroll: true });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={creatingProcessing}
                >
                  {creatingProcessing ? 'Saving…' : 'Save Film'}
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetCreate();
                    setShowCreateDetails(false);
                    router.visit(filmRoutes.index.url(), { replace: true, preserveScroll: true });
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Film Modal */}
      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) { setSelected(null); setEditing(false); reset(); } }}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit Film${selected ? `: ${selected.title}` : ''}` : `Film Details${selected ? `: ${selected.title}` : ''}`}</DialogTitle>
          </DialogHeader>

          {!editing && selected && (
            <div className="space-y-4">
              <div className="grid gap-2 text-sm">
                <div><span className="font-medium">Title:</span> {selected.title}</div>
                <div><span className="font-medium">Format:</span> {selected.format}</div>
                <div><span className="font-medium">Year:</span> {selected.year}</div>
              </div>

              {/* Optional attributes */}
              {(selected.custom_attributes && (
                <div className="grid gap-3 text-sm">
                  {typeof selected.custom_attributes.run_time !== 'undefined' && selected.custom_attributes.run_time !== null && (
                    <div><span className="font-medium">Run Time:</span> {selected.custom_attributes.run_time} min</div>
                  )}
                  {Array.isArray(selected.custom_attributes.genres) && selected.custom_attributes.genres.length > 0 && (
                    <div><span className="font-medium">Genres:</span> {selected.custom_attributes.genres.join(', ')}</div>
                  )}
                  {Array.isArray(selected.custom_attributes.directors) && selected.custom_attributes.directors.length > 0 && (
                    <div><span className="font-medium">Director(s):</span> {selected.custom_attributes.directors.join(', ')}</div>
                  )}
                  {selected.custom_attributes.description && (
                    <div>
                      <div className="font-medium">Description</div>
                      <div className="mt-1 whitespace-pre-line text-muted-foreground">{selected.custom_attributes.description}</div>
                    </div>
                  )}
                  {selected.custom_attributes.tagline && (
                    <div><span className="font-medium">Tagline:</span> {selected.custom_attributes.tagline}</div>
                  )}
                  {Array.isArray(selected.custom_attributes.countries) && selected.custom_attributes.countries.length > 0 && (
                    <div>
                      <div className="font-medium">Countries</div>
                      <ul className="mt-1 list-disc pl-5">
                        {selected.custom_attributes.countries.map((c, i) => (
                          <li key={i}>{c.code ? `${c.code} — ` : ''}{c.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {Array.isArray(selected.custom_attributes.languages) && selected.custom_attributes.languages.length > 0 && (
                    <div>
                      <div className="font-medium">Languages</div>
                      <ul className="mt-1 list-disc pl-5">
                        {selected.custom_attributes.languages.map((l, i) => (
                          <li key={i}>{l.code ? `${l.code} — ` : ''}{l.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}

              <div className="mt-4 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setSelected(null); reset(); setEditing(false); }}
                >
                  Close
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    if (!selected) return;
                    setData({
                      title: selected.title,
                      format: selected.format,
                      year: selected.year,
                      type: 'Film',
                      custom_attributes: (selected.custom_attributes ?? {}) as CustomAttributes,
                    } as unknown as typeof data);
                    setEditing(true);
                  }}
                >
                  Edit
                </Button>
              </div>
            </div>
          )}

          {editing && (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="title">Title</label>
              <Input
                id="title"
                value={data.title}
                onChange={(e) => setData('title', e.target.value)}
                required
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="format">Format</label>
              <Select value={data.format} onValueChange={(val) => setData('format', val)}>
                <SelectTrigger id="format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {formats.map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.format && <p className="mt-1 text-sm text-red-600">{errors.format}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="year">Year</label>
              <Input
                id="year"
                type="number"
                value={data.year}
                min={1888}
                max={new Date().getFullYear() + 1}
                onChange={(e) => setData('year', Number(e.target.value))}
                required
              />
              {errors.year && <p className="mt-1 text-sm text-red-600">{errors.year}</p>}
            </div>

            <div className="pt-2">
              <h3 className="text-sm font-semibold mb-2">Optional Attributes</h3>

              <div className="grid gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium" htmlFor="edit-run_time">Run Time (minutes)</label>
                  <Input
                    id="edit-run_time"
                    type="number"
                    value={(data.custom_attributes as CustomAttributes | undefined)?.run_time ?? ''}
                    min={0}
                    onChange={(e) => {
                      const val = e.target.value;
                      const attrs = (data.custom_attributes as CustomAttributes | undefined) ?? {};
                      const next = { ...attrs, run_time: val === '' ? null : Number(val) };
                      setData('custom_attributes', next as unknown);
                    }}
                  />
                  {errors['custom_attributes.run_time'] && (
                    <p className="mt-1 text-sm text-red-600">{errors['custom_attributes.run_time']}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium" htmlFor="edit-genres">Genres (comma separated)</label>
                  <Input
                    id="edit-genres"
                    type="text"
                    value={((data.custom_attributes as CustomAttributes | undefined)?.genres ?? []).join(', ')}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const arr = raw.split(',').map((s) => s.trim()).filter(Boolean);
                      const attrs = (data.custom_attributes as CustomAttributes | undefined) ?? {};
                      setData('custom_attributes', { ...attrs, genres: arr } as unknown);
                    }}
                  />
                  {errors['custom_attributes.genres'] && (
                    <p className="mt-1 text-sm text-red-600">{errors['custom_attributes.genres']}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium" htmlFor="edit-directors">Director(s) (comma separated)</label>
                  <Input
                    id="edit-directors"
                    type="text"
                    value={((data.custom_attributes as CustomAttributes | undefined)?.directors ?? []).join(', ')}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const arr = raw.split(',').map((s) => s.trim()).filter(Boolean);
                      const attrs = (data.custom_attributes as CustomAttributes | undefined) ?? {};
                      setData('custom_attributes', { ...attrs, directors: arr } as unknown);
                    }}
                  />
                  {errors['custom_attributes.directors'] && (
                    <p className="mt-1 text-sm text-red-600">{errors['custom_attributes.directors']}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium" htmlFor="edit-description">Description</label>
                  <Textarea
                    id="edit-description"
                    rows={3}
                    value={(data.custom_attributes as CustomAttributes | undefined)?.description ?? ''}
                    onChange={(e) => {
                      const attrs = (data.custom_attributes as CustomAttributes | undefined) ?? {};
                      setData('custom_attributes', { ...attrs, description: e.target.value } as unknown);
                    }}
                  />
                  {errors['custom_attributes.description'] && (
                    <p className="mt-1 text-sm text-red-600">{errors['custom_attributes.description']}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium" htmlFor="edit-tagline">Tagline</label>
                  <Input
                    id="edit-tagline"
                    type="text"
                    value={(data.custom_attributes as CustomAttributes | undefined)?.tagline ?? ''}
                    onChange={(e) => {
                      const attrs = (data.custom_attributes as CustomAttributes | undefined) ?? {};
                      setData('custom_attributes', { ...attrs, tagline: e.target.value } as unknown);
                    }}
                  />
                  {errors['custom_attributes.tagline'] && (
                    <p className="mt-1 text-sm text-red-600">{errors['custom_attributes.tagline']}</p>
                  )}
                </div>

                {/* Countries */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="mb-1 block text-sm font-medium">Countries</label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const attrs = (data.custom_attributes as CustomAttributes | undefined) ?? {};
                        const list = [...(attrs.countries ?? []), { code: '', name: '' }];
                        setData('custom_attributes', { ...attrs, countries: list } as unknown);
                      }}
                    >
                      Add Country
                    </Button>
                  </div>
                  {(((data.custom_attributes as CustomAttributes | undefined)?.countries) ?? []).map((c, i) => (
                    <div key={i} className="mb-2 flex gap-2">
                      <Input
                        placeholder="Code"
                        className="w-24"
                        value={c.code}
                        onChange={(e) => {
                          const attrs = (data.custom_attributes as CustomAttributes | undefined) ?? {};
                          const list = [...(attrs.countries ?? [])];
                          list[i] = { ...list[i], code: e.target.value } as CodeName;
                          setData('custom_attributes', { ...attrs, countries: list } as unknown);
                        }}
                      />
                      <Input
                        placeholder="Name"
                        className="flex-1"
                        value={c.name}
                        onChange={(e) => {
                          const attrs = (data.custom_attributes as CustomAttributes | undefined) ?? {};
                          const list = [...(attrs.countries ?? [])];
                          list[i] = { ...list[i], name: e.target.value } as CodeName;
                          setData('custom_attributes', { ...attrs, countries: list } as unknown);
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const attrs = (data.custom_attributes as CustomAttributes | undefined) ?? {};
                          const list = [...(attrs.countries ?? [])];
                          list.splice(i, 1);
                          setData('custom_attributes', { ...attrs, countries: list } as unknown);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Languages */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="mb-1 block text-sm font-medium">Languages</label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const attrs = (data.custom_attributes as CustomAttributes | undefined) ?? {};
                        const list = [...(attrs.languages ?? []), { code: '', name: '' }];
                        setData('custom_attributes', { ...attrs, languages: list } as unknown);
                      }}
                    >
                      Add Language
                    </Button>
                  </div>
                  {(((data.custom_attributes as CustomAttributes | undefined)?.languages) ?? []).map((c, i) => (
                    <div key={i} className="mb-2 flex gap-2">
                      <Input
                        placeholder="Code"
                        className="w-24"
                        value={c.code}
                        onChange={(e) => {
                          const attrs = (data.custom_attributes as CustomAttributes | undefined) ?? {};
                          const list = [...(attrs.languages ?? [])];
                          list[i] = { ...list[i], code: e.target.value } as CodeName;
                          setData('custom_attributes', { ...attrs, languages: list } as unknown);
                        }}
                      />
                      <Input
                        placeholder="Name"
                        className="flex-1"
                        value={c.name}
                        onChange={(e) => {
                          const attrs = (data.custom_attributes as CustomAttributes | undefined) ?? {};
                          const list = [...(attrs.languages ?? [])];
                          list[i] = { ...list[i], name: e.target.value } as CodeName;
                          setData('custom_attributes', { ...attrs, languages: list } as unknown);
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const attrs = (data.custom_attributes as CustomAttributes | undefined) ?? {};
                          const list = [...(attrs.languages ?? [])];
                          list.splice(i, 1);
                          setData('custom_attributes', { ...attrs, languages: list } as unknown);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Hidden type to satisfy validation, server enforces Film */}
            <input type="hidden" name="type" value={data.type} />

            <div className="flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  if (!selected) return;
                  setDeleteTarget(selected);
                  setDeleteOpen(true);
                }}
              >
                Delete
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelected(null);
                    reset();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={processing}
                >
                  {processing ? 'Saving…' : 'Save changes'}
                </Button>
              </div>
            </div>
          </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Global Delete Confirmation */}
      <AlertDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) {
            setDeleteTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTarget ? `Delete "${deleteTarget.title}"?` : 'Delete film?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the film from your library. Deletions are soft and can be undone later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => {
                if (!deleteTarget) return;
                router.delete(filmRoutes.destroy.url(deleteTarget.id), {
                  preserveScroll: true,
                  onSuccess: () => {
                    setDeleteTarget(null);
                    setDeleteOpen(false);
                    setSelected(null);
                    reset();
                  },
                });
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
