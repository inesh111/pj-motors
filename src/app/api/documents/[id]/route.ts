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

// GET /api/documents/:id
export async function GET(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  const docId = Number(id);

  if (Number.isNaN(docId)) {
    return NextResponse.json({ error: 'Invalid document id' }, { status: 400 });
  }

  const doc = await prisma.carDocument.findUnique({ where: { id: docId } });
  if (!doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  const absPath = path.join(process.cwd(), doc.filePath);
  let arrayBuffer: ArrayBuffer;

  try {
    const buf = await fs.readFile(absPath); // Buffer
    // Convert Node Buffer → ArrayBuffer slice (what the Fetch Response type expects)
    arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  } catch {
    return NextResponse.json(
      { error: 'File missing on disk' },
      { status: 500 },
    );
  }

  const ext = path.extname(doc.filePath).toLowerCase();
  let contentType = 'application/octet-stream';
  if (ext === '.pdf') contentType = 'application/pdf';
  else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
  else if (ext === '.png') contentType = 'image/png';
  else if (ext === '.xlsx')
    contentType =
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  else if (ext === '.xls') contentType = 'application/vnd.ms-excel';

  return new Response(arrayBuffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(
        doc.name || 'file',
      )}"`,
    },
  });
}