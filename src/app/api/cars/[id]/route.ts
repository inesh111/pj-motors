import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

// GET /api/cars/:id - get one car (with documents)
export async function GET(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  const numericId = Number(id);
  if (Number.isNaN(numericId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const car = await prisma.car.findUnique({
    where: { id: numericId },
    include: { documents: true },
  });

  if (!car) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(car);
}

// PATCH /api/cars/:id - update car
export async function PATCH(req: Request, { params }: RouteContext) {
  const { id } = await params;
  const numericId = Number(id);
  if (Number.isNaN(numericId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const data: any = {};

    if (body.make !== undefined) data.make = body.make;
    if (body.model !== undefined) data.model = body.model;
    if (body.variant !== undefined) data.variant = body.variant;
    if (body.year !== undefined) {
      data.year =
        body.year === null || body.year === '' ? null : Number(body.year);
    }
    if (body.colour !== undefined) data.colour = body.colour;
    if (body.grade !== undefined) data.grade = body.grade;
    if (body.status !== undefined) data.status = body.status;

    if (body.totalPurchasePriceAUD !== undefined) {
      const purchase = Number(body.totalPurchasePriceAUD);
      if (Number.isNaN(purchase)) {
        return NextResponse.json(
          { error: 'totalPurchasePriceAUD must be a number' },
          { status: 400 },
        );
      }
      data.totalPurchasePriceAUD = purchase;
    }

    if (body.salePrice !== undefined) {
      const sale =
        body.salePrice === null || body.salePrice === ''
          ? null
          : Number(body.salePrice);
      if (sale !== null && Number.isNaN(sale)) {
        return NextResponse.json(
          { error: 'salePrice must be a number' },
          { status: 400 },
        );
      }
      data.salePrice = sale;
    }

    // recompute profit if either price changed
    if (
      body.totalPurchasePriceAUD !== undefined ||
      body.salePrice !== undefined
    ) {
      const existing = await prisma.car.findUnique({
        where: { id: numericId },
      });
      if (!existing) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }

      const purchase =
        data.totalPurchasePriceAUD ?? Number(existing.totalPurchasePriceAUD);
      const sale =
        data.salePrice !== undefined ? data.salePrice : existing.salePrice;

      data.profit =
        sale != null && purchase != null
          ? Number(sale) - Number(purchase)
          : null;
    }

    const updated = await prisma.car.update({
      where: { id: numericId },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating car', error);
    return NextResponse.json(
      { error: 'Failed to update car' },
      { status: 500 },
    );
  }
}

// DELETE /api/cars/:id - delete car
export async function DELETE(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  const numericId = Number(id);
  if (Number.isNaN(numericId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  try {
    await prisma.car.delete({ where: { id: numericId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting car', error);
    return NextResponse.json(
      { error: 'Failed to delete car' },
      { status: 500 },
    );
  }
}