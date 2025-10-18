import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import films from '@/routes/films';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

 type Props = {
  formats: string[];
};

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Dashboard', href: dashboard().url },
  { title: 'Films', href: films.index().url },
  { title: 'Add', href: films.create().url },
];

export default function Create({ formats }: Props) {
  const currentYear = new Date().getFullYear();
  const { data, setData, post, processing, errors, reset } = useForm({
    title: '',
    format: formats?.[0] ?? '',
    year: currentYear,
    type: 'Film',
  });

  const submit: React.FormEventHandler = (e) => {
    e.preventDefault();
    post(films.store.url(), {
      onSuccess: () => {
        reset('title');
      },
    });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Add Film" />
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <div className="relative mx-auto w-full max-w-xl overflow-hidden rounded-xl border border-sidebar-border/70 p-6 dark:border-sidebar-border">
          <h1 className="mb-4 text-2xl font-semibold">Add Film</h1>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="title">Title</label>
              <Input
                id="title"
                type="text"
                value={data.title}
                onChange={(e) => setData('title', e.target.value)}
                required
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="format">Format</label>
              <Select value={data.format} onValueChange={(val) => setData('format', val)}>
                <SelectTrigger id="format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {formats?.map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.format && <p className="mt-1 text-sm text-red-600">{errors.format}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="year">Year</label>
              <Input
                id="year"
                type="number"
                value={data.year}
                min={1888}
                max={currentYear + 1}
                onChange={(e) => setData('year', Number(e.target.value))}
                required
              />
              {errors.year && <p className="mt-1 text-sm text-red-600">{errors.year}</p>}
            </div>

            {/* Hidden type to satisfy validation, server will enforce Film */}
            <input type="hidden" name="type" value={data.type} />

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={processing}>
                {processing ? 'Saving…' : 'Save Film'}
              </Button>
              <Link href={dashboard().url} className="text-gray-700 underline">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
