import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/cars - list cars, with optional ?search= query
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') ?? '';

  const cars = await prisma.car.findMany({
    where: search
      ? {
          chassisCode: {
            contains: search,
            mode: 'insensitive',
          },
        }
      : {},
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(cars);
}

// POST /api/cars - create a new car
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      chassisCode,
      make,
      model,
      variant,
      year,
      colour,
      grade,
      totalPurchasePriceAUD,
      salePrice,
      status,
    } = body;

    if (!chassisCode || !make || !model || totalPurchasePriceAUD === undefined) {
      return NextResponse.json(
        {
          error:
            'chassisCode, make, model, totalPurchasePriceAUD are required',
        },
        { status: 400 },
      );
    }

    const purchase = Number(totalPurchasePriceAUD);
    if (Number.isNaN(purchase)) {
      return NextResponse.json(
        { error: 'totalPurchasePriceAUD must be a number' },
        { status: 400 },
      );
    }

    const sale =
      salePrice !== undefined && salePrice !== null && salePrice !== ''
        ? Number(salePrice)
        : null;
    if (sale !== null && Number.isNaN(sale)) {
      return NextResponse.json(
        { error: 'salePrice must be a number' },
        { status: 400 },
      );
    }

    const profit = sale !== null ? sale - purchase : null;

    const car = await prisma.car.create({
      data: {
        chassisCode,
        make,
        model,
        variant: variant || null,
        year: year ? Number(year) : null,
        colour: colour || null,
        grade: grade || null,
        totalPurchasePriceAUD: purchase,
        salePrice: sale,
        profit,
        status: status ?? 'JAPAN',
      },
    });

    return NextResponse.json(car, { status: 201 });
  } catch (error: any) {
    // Unique constraint error (duplicate chassisCode)
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'A car with this chassis code already exists' },
        { status: 409 },
      );
    }

    console.error('Error creating car', error);
    return NextResponse.json(
      { error: 'Failed to create car' },
      { status: 500 },
    );
  }
}