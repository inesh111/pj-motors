import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { EditCarForm } from '../EditCarForm';

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditCarPage({ params }: PageProps) {
  // Next.js 15: params is a Promise
  const { id } = await params;
  const numericId = Number(id);

  if (Number.isNaN(numericId)) {
    notFound();
  }

  const car = await prisma.car.findUnique({
    where: { id: numericId },
  });

  if (!car) {
    notFound();
  }

  // Convert Prisma decimal & nullable fields to plain strings for the client
  const plainCar = {
    id: car.id,
    chassisCode: car.chassisCode,
    make: car.make,
    model: car.model,
    variant: car.variant ?? '',
    year: car.year?.toString() ?? '',
    colour: car.colour ?? '',
    grade: car.grade ?? '',
    totalPurchasePriceAUD: car.totalPurchasePriceAUD?.toString() ?? '',
    salePrice: car.salePrice?.toString() ?? '',
    status: car.status,
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <Link
              href={`/cars/${car.id}`}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              ← Back to car detail
            </Link>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              Edit Car – {car.chassisCode}
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Update details for this chassis.
            </p>
          </div>
        </header>

        <EditCarForm car={plainCar} />
      </div>
    </main>
  );
}