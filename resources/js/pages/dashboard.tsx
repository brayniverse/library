import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import films from '@/routes/films';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

type GenreSlice = { name: string; count: number };
type DecadeSlice = { name: string; count: number };
type DirectorSlice = { name: string; count: number };

type Props = {
    filmsCount: number;
    genresDistribution: GenreSlice[];
    decadesDistribution: DecadeSlice[];
    directorsDistribution: DirectorSlice[];
};

function GenreBars({ data }: { data: GenreSlice[] }) {
    const top = data.slice(0, 8);
    const chartConfig: ChartConfig = {
        count: { label: 'Categories', color: 'var(--color-chart-1)' },
    };
    return (
        <ChartContainer className="h-60 w-full" config={chartConfig}>
            <BarChart data={top} layout="vertical" margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid horizontal vertical={false} strokeDasharray="3 3" />
                <XAxis type="number" hide tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={120} tick={{ fontSize: 12 }} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent nameKey="name" />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} />
            </BarChart>
        </ChartContainer>
    );
}

function DecadeBars({ data }: { data: DecadeSlice[] }) {
    const chartConfig: ChartConfig = {
        count: { label: 'Decades', color: 'var(--color-chart-2)' },
    };
    return (
        <ChartContainer className="h-60 w-full" config={chartConfig}>
            <BarChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid horizontal vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <YAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} width={40} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent nameKey="name" />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ChartContainer>
    );
}

function DirectorsBars({ data }: { data: DirectorSlice[] }) {
    const top = data.slice(0, 8);
    const chartConfig: ChartConfig = {
        count: { label: 'Directors', color: 'var(--color-chart-3)' },
    };
    return (
        <ChartContainer className="h-60 w-full" config={chartConfig}>
            <BarChart data={top} layout="vertical" margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid horizontal vertical={false} strokeDasharray="3 3" />
                <XAxis type="number" hide tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={120} tick={{ fontSize: 12 }} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent nameKey="name" />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} />
            </BarChart>
        </ChartContainer>
    );
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

export default function Dashboard({ filmsCount, genresDistribution, decadesDistribution, directorsDistribution }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    {/* Films count tile */}
                    <Card>
                        <CardHeader className="flex flex-row items-baseline justify-between">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Films</CardTitle>
                            <Link href={films.index.url()} prefetch className="text-sm underline">View</Link>
                        </CardHeader>
                        <CardContent>
                            <div className="mt-1 text-3xl font-semibold">{filmsCount.toLocaleString()}</div>
                        </CardContent>
                    </Card>

                    {/* Film Categories Distribution */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Film Categories</CardTitle>
                            <Link href={films.index.url()} prefetch className="text-sm underline">View Films</Link>
                        </CardHeader>
                        <CardContent>
                            {genresDistribution.length === 0 ? (
                                <div className="text-sm text-muted-foreground">No categories yet.</div>
                            ) : (
                                <GenreBars data={genresDistribution} />
                            )}
                        </CardContent>
                    </Card>
                    {/* Films by Director Distribution */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Films by Director</CardTitle>
                            <Link href={films.index.url()} prefetch className="text-sm underline">View Films</Link>
                        </CardHeader>
                        <CardContent>
                            {directorsDistribution.length === 0 ? (
                                <div className="text-sm text-muted-foreground">No directors provided yet.</div>
                            ) : (
                                <DirectorsBars data={directorsDistribution} />
                            )}
                        </CardContent>
                    </Card>
                    {/* Films by Decade Distribution */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Release Decade Histogram</CardTitle>
                            <Link href={films.index.url()} prefetch className="text-sm underline">View Films</Link>
                        </CardHeader>
                        <CardContent>
                            {decadesDistribution.length === 0 ? (
                                <div className="text-sm text-muted-foreground">No films with a year yet.</div>
                            ) : (
                                <DecadeBars data={decadesDistribution} />
                            )}
                        </CardContent>
                    </Card>
                </div>
                <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                    <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                </div>
            </div>
        </AppLayout>
    );
}
