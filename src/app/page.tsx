import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Car } from '@prisma/client';

type HomeProps = {
  searchParams: Promise<{
    search?: string;
  }>;
};

export default async function Home({ searchParams }: HomeProps) {
  // ✅ Next.js 15: searchParams is a Promise
  const { search = '' } = await searchParams;

  const cars: Car[] = await prisma.car.findMany({
    where: search
      ? {
          chassisCode: {
            contains: search,
          },
        }
      : {},
    orderBy: { createdAt: 'desc' },
  });

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              PJ Motors
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Chassis-based tracking for Japan → Australia imports
            </p>
          </div>

          <Link
            href="/cars/new"
            className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-black shadow-sm hover:bg-emerald-400"
          >
            + Add Car
          </Link>
        </header>

        {/* Search */}
        <form className="mb-4 flex gap-2" method="GET">
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search by chassis code..."
            className="flex-1 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-emerald-500"
          />
          <button
            type="submit"
            className="rounded-md border border-slate-600 px-3 py-2 text-sm hover:bg-slate-800"
          >
            Search
          </button>
        </form>

        {/* Table */}
        {cars.length === 0 ? (
          <p className="text-sm text-slate-400">
            No cars found. Try a different search or add your first car.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900/60">
            <table className="min-w-full text-sm">
              <thead className="border-b border-slate-800 bg-slate-900/80">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-slate-400">
                    Chassis
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-slate-400">
                    Make
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-slate-400">
                    Model
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-slate-400">
                    Year
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-slate-400">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {cars.map((car) => (
                  <tr
                    key={car.id}
                    className="border-b border-slate-800/60 hover:bg-slate-800/50"
                  >
                    <td className="px-3 py-2">
                      <Link
                        href={`/cars/${car.id}`}
                        className="font-mono text-xs text-emerald-400 hover:underline"
                      >
                        {car.chassisCode}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{car.make}</td>
                    <td className="px-3 py-2">{car.model}</td>
                    <td className="px-3 py-2">{car.year ?? '-'}</td>
                    <td className="px-3 py-2">
                      <StatusBadge status={car.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    JAPAN: {
      label: 'Japan',
      className: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
    },
    IN_TRANSIT: {
      label: 'In Transit',
      className: 'bg-sky-500/15 text-sky-300 border-sky-500/40',
    },
    IN_AUSTRALIA: {
      label: 'In Australia',
      className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
    },
    SOLD: {
      label: 'Sold',
      className: 'bg-slate-500/20 text-slate-200 border-slate-500/40',
    },
  };

  const cfg = map[status] ?? map.JAPAN;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}