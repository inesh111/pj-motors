import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { CarActions } from './CarActions';
import { DocumentsManager } from './DocumentsManager';

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CarDetailPage({ params }: PageProps) {
  // Next.js 15: params is a Promise, so we await it
  const { id } = await params;
  const numericId = Number(id);

  if (Number.isNaN(numericId)) {
    notFound();
  }

  const car = await prisma.car.findUnique({
    where: { id: numericId },
    include: { documents: true },
  });

  if (!car) {
    notFound();
  }

  const totalPurchase = car.totalPurchasePriceAUD?.toString();
  const salePrice = car.salePrice?.toString();
  const profit = car.profit?.toString();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              ← Back to list
            </Link>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              {car.chassisCode}{' '}
              <span className="text-slate-400">
                – {car.make} {car.model}
              </span>
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Full record for this chassis.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={car.status} />
            <CarActions carId={car.id} />
          </div>
        </header>

        {/* Main content */}
        <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)]">
          {/* Left: Details */}
          <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-200">
              Car Details
            </h2>
            <div className="grid gap-2 md:grid-cols-2">
              <DetailRow label="Chassis Code" value={car.chassisCode} />
              <DetailRow label="Make" value={car.make} />
              <DetailRow label="Model" value={car.model} />
              <DetailRow label="Variant" value={car.variant} />
              <DetailRow label="Year" value={car.year?.toString()} />
              <DetailRow label="Colour" value={car.colour} />
              <DetailRow label="Auction Grade" value={car.grade} />
            </div>
          </section>

          {/* Right: Financials */}
          <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-200">
              Financials
            </h2>
            <div className="space-y-2">
              <DetailRow
                label="Total Purchase Price (AUD)"
                value={totalPurchase}
              />
              <DetailRow label="Sale Price (AUD)" value={salePrice} />
              <DetailRow
                label="Profit (AUD)"
                value={profit}
                highlight={!!profit}
              />
            </div>
          </section>
        </div>

        {/* Documents */}
        <section className="mt-6 rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-200">
            Documents
          </h2>

          <p className="mb-3 text-xs text-slate-400">
            Attach export cert, expense sheet, B/L, VIA, compliance, ROC, RWC,
            invoice from Japan, payment proof, auction sheet and car pictures
            for this chassis.
          </p>

          <DocumentsManager carId={car.id} initialDocuments={car.documents} />
        </section>
      </div>
    </main>
  );
}

function DetailRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value?: string | null;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[11px] uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <span
        className={
          'text-sm ' + (highlight ? 'font-semibold text-emerald-300' : '')
        }
      >
        {value ?? '-'}
      </span>
    </div>
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