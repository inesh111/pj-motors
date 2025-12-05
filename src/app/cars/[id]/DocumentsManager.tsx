'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CarDocument } from '@prisma/client';

const DOC_DEFS = [
  { type: 'EXPORT_CERT', label: 'Export Certificate' },
  { type: 'EXPENSE_SHEET', label: 'Expense Sheet (Excel)' },
  { type: 'BL_DOC', label: 'B/L (Bill of Lading)' },
  { type: 'VIA_DOC', label: 'VIA – Vehicle Import Approval' },
  { type: 'COMPLIANCE_DOC', label: 'Compliance Document' },
  { type: 'RWC_DOC', label: 'RWC Document' },
  { type: 'INVOICE_FROM_JAPAN', label: 'Invoice from Japan' },
  { type: 'PAYMENT_PROOF', label: 'Payment Proof' },
  { type: 'AUCTION_SHEET', label: 'Auction Sheet' },
];

type Props = {
  carId: number;
  initialDocuments: CarDocument[];
};

export function DocumentsManager({ carId, initialDocuments }: Props) {
  const router = useRouter();
  const [docs, setDocs] = useState<CarDocument[]>(initialDocuments);
  const [error, setError] = useState<string | null>(null);
  const [uploadingType, setUploadingType] = useState<string | null>(null);

  async function handleUpload(type: string, file: File) {
    setError(null);
    setUploadingType(type);

    try {
      const formData = new FormData();
      formData.append('type', type);
      formData.append('file', file);

      const res = await fetch(`/api/cars/${carId}/documents`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to upload file');
        setUploadingType(null);
        return;
      }

      const newDoc: CarDocument = await res.json();

      setDocs((prev) => {
        if (type === 'CAR_PICTURE') {
          // Multiple pictures allowed
          return [...prev, newDoc];
        }
        // Replace any existing doc of same type
        return [...prev.filter((d) => d.type !== type), newDoc];
      });

      // Refresh server data too (in case other parts depend on it)
      router.refresh();
    } catch (e) {
      console.error(e);
      setError('Something went wrong while uploading');
    } finally {
      setUploadingType(null);
    }
  }

  function getSingleDoc(type: string) {
    return docs.find((d) => d.type === type) || null;
  }

  const pictures = docs.filter((d) => d.type === 'CAR_PICTURE');

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md border border-red-500/60 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      )}

      {/* Fixed document types */}
      <div className="space-y-2">
        {DOC_DEFS.map((def) => {
          const doc = getSingleDoc(def.type);
          const isUploading = uploadingType === def.type;

          return (
            <DocumentRow
              key={def.type}
              label={def.label}
              doc={doc}
              isUploading={isUploading}
              onFileSelected={(file) => handleUpload(def.type, file)}
            />
          );
        })}
      </div>

      {/* Car pictures (multiple) */}
      <CarPicturesRow
        docs={pictures}
        isUploading={uploadingType === 'CAR_PICTURE'}
        onFileSelected={(file) => handleUpload('CAR_PICTURE', file)}
      />
    </div>
  );
}

type DocumentRowProps = {
  label: string;
  doc: CarDocument | null;
  isUploading: boolean;
  onFileSelected: (file: File) => void;
};

function DocumentRow({
  label,
  doc,
  isUploading,
  onFileSelected,
}: DocumentRowProps) {
  const inputId = `file-input-${label.replace(/\s+/g, '-')}`;

  return (
    <div className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs">
      <div className="flex flex-col">
        <span className="font-medium text-slate-100">{label}</span>
        {doc ? (
          <span className="text-[11px] text-slate-400">
            {doc.name || doc.filePath.split('/').pop()}
          </span>
        ) : (
          <span className="text-[11px] text-slate-500">No file attached</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {doc && (
          <a
            href={`/api/documents/${doc.id}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-slate-600 px-2 py-1 text-[11px] hover:bg-slate-800"
          >
            Open
          </a>
        )}

        <label
          htmlFor={inputId}
          className="cursor-pointer rounded-md border border-slate-600 px-2 py-1 text-[11px] hover:bg-slate-800"
        >
          {doc ? (isUploading ? 'Replacing…' : 'Replace') : isUploading ? 'Uploading…' : 'Attach'}
        </label>
        <input
          id={inputId}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileSelected(file);
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );
}

type CarPicturesRowProps = {
  docs: CarDocument[];
  isUploading: boolean;
  onFileSelected: (file: File) => void;
};

function CarPicturesRow({
  docs,
  isUploading,
  onFileSelected,
}: CarPicturesRowProps) {
  const inputId = 'file-input-car-pictures';

  return (
    <div className="rounded-md border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="font-medium text-slate-100">Car Pictures</span>
          <span className="text-[11px] text-slate-500">
            {docs.length === 0
              ? 'No pictures attached yet.'
              : `${docs.length} picture${docs.length > 1 ? 's' : ''} attached.`}
          </span>
        </div>
        <label
          htmlFor={inputId}
          className="cursor-pointer rounded-md border border-slate-600 px-2 py-1 text-[11px] hover:bg-slate-800"
        >
          {isUploading ? 'Uploading…' : 'Add Picture'}
        </label>
        <input
          id={inputId}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileSelected(file);
            e.target.value = '';
          }}
        />
      </div>

      {docs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {docs.map((doc) => (
            <a
              key={doc.id}
              href={`/api/documents/${doc.id}`}
              target="_blank"
              rel="noreferrer"
              className="flex h-20 w-20 items-center justify-center rounded-md border border-slate-700 bg-slate-800 text-[10px] text-slate-300 hover:border-emerald-500"
            >
              View
            </a>
          ))}
        </div>
      )}
    </div>
  );
}