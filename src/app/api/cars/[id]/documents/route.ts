import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

// POST /api/cars/:id/documents
export async function POST(req: Request, { params }: RouteContext) {
  const { id } = await params;
  const carId = Number(id);

  if (Number.isNaN(carId)) {
    return NextResponse.json({ error: 'Invalid car id' }, { status: 400 });
  }

  const car = await prisma.car.findUnique({ where: { id: carId } });
  if (!car) {
    return NextResponse.json({ error: 'Car not found' }, { status: 404 });
  }

  const formData = await req.formData();
  const type = formData.get('type');
  const file = formData.get('file');

  if (typeof type !== 'string') {
    return NextResponse.json({ error: 'Missing document type' }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 });
  }

  if (file.size === 0) {
    return NextResponse.json({ error: 'File is empty' }, { status: 400 });
  }

  const originalName = file.name || 'document';
  const safeName = originalName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const uploadDir = path.join(process.cwd(), 'uploads', String(carId));
  await fs.mkdir(uploadDir, { recursive: true });

  const timestamp = Date.now();
  const filename = `${timestamp}_${type}_${safeName}`;
  const filePath = path.join(uploadDir, filename);

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await fs.writeFile(filePath, buffer);

  // For non-picture docs, keep only one per type. For CAR_PICTURE, allow multiple.
  if (type !== 'CAR_PICTURE') {
    const existing = await prisma.carDocument.findFirst({
      where: { carId, type },
    });

    if (existing) {
      // Try to remove old file (ignore errors)
      if (existing.filePath) {
        const absOldPath = path.join(process.cwd(), existing.filePath);
        fs.unlink(absOldPath).catch(() => {});
      }

      await prisma.carDocument.delete({ where: { id: existing.id } });
    }
  }

  const relativePath = path.relative(process.cwd(), filePath);

  const doc = await prisma.carDocument.create({
    data: {
      carId,
      type,
      filePath: relativePath,
      name: originalName,
    },
  });

  return NextResponse.json(doc, { status: 201 });
}