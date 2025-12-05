'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

const DOC_DEFS = [
  { type: 'EXPORT_CERT', label: 'Export Certificate' },
  { type: 'EXPENSE_SHEET', label: 'Expense Sheet (Excel)' },
  { type: 'BL_DOC', label: 'B/L (Bill of Lading)' },
  { type: 'VIA_DOC', label: 'VIA – Vehicle Import Approval' },
  { type: 'COMPLIANCE_DOC', label: 'Compliance Document' },
  { type: 'ROC_DOC', label: 'ROC Document' },
  { type: 'INVOICE_FROM_JAPAN', label: 'Invoice from Japan' },
  { type: 'PAYMENT_PROOF', label: 'Payment Proof' },
  { type: 'AUCTION_SHEET', label: 'Auction Sheet' },
];

export default function NewCarPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [form, setForm] = useState({
    chassisCode: '',
    make: '',
    model: '',
    variant: '',
    year: '',
    colour: '',
    grade: '',
    totalPurchasePriceAUD: '',
    salePrice: '',
    status: 'JAPAN',
  });

  // One file per fixed doc type (EXPORT_CERT, etc.)
  const [docFiles, setDocFiles] = useState<Record<string, File | null>>({});
  // Multiple car pictures
  const [pictureFiles, setPictureFiles] = useState<File[]>([]);

  function updateField<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function handleDocFileChange(type: string, file: File | null) {
    setDocFiles((prev) => ({
      ...prev,
      [type]: file,
    }));
  }

  function handlePictureFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return;
    const arr = Array.from(files);
    setPictureFiles((prev) => [...prev, ...arr]);
  }

  async function uploadDoc(carId: number, type: string, file: File) {
    const formData = new FormData();
    formData.append('type', type);
    formData.append('file', file);

    const res = await fetch(`/api/cars/${carId}/documents`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Failed to upload ${type}`);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setUploadError(null);
    setLoading(true);

    try {
      // 1) Create the car
      const res = await fetch('/api/cars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          year: form.year ? Number(form.year) : null,
          totalPurchasePriceAUD: form.totalPurchasePriceAUD,
          salePrice: form.salePrice || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to create car');
        setLoading(false);
        return;
      }

      const car = await res.json();
      const carId = car.id as number;

      // 2) Upload any attached docs (best-effort, but we try all)
      const uploadErrors: string[] = [];

      // Fixed doc types (single file each)
      for (const def of DOC_DEFS) {
        const file = docFiles[def.type];
        if (file) {
          try {
            await uploadDoc(carId, def.type, file);
          } catch (err: any) {
            console.error(err);
            uploadErrors.push(`${def.label}: ${err.message ?? 'Upload failed'}`);
          }
        }
      }

      // Car pictures (multiple)
      for (const file of pictureFiles) {
        try {
          await uploadDoc(carId, 'CAR_PICTURE', file);
        } catch (err: any) {
          console.error(err);
          uploadErrors.push(`Car picture: ${err.message ?? 'Upload failed'}`);
        }
      }

      if (uploadErrors.length > 0) {
        setUploadError(
          'Car was created, but some documents failed to upload:\n' +
            uploadErrors.join('\n'),
        );
      }

      // 3) Redirect to detail page
      router.push(`/cars/${carId}`);
    } catch (err) {
      console.error(err);
      setError('Something went wrong while saving');
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Add New Car
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Create a new chassis record in PJ Motors and optionally attach
              documents.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push('/')}
            className="rounded-md border border-slate-600 px-3 py-1.5 text-sm hover:bg-slate-800"
          >
            ← Back to list
          </button>
        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/60 p-4"
        >
          {error && (
            <div className="rounded-md border border-red-500/60 bg-red-500/10 px-3 py-2 text-sm text-red-200 whitespace-pre-line">
              {error}
            </div>
          )}

          {uploadError && (
            <div className="rounded-md border border-amber-500/60 bg-amber-500/10 px-3 py-2 text-xs text-amber-200 whitespace-pre-line">
              {uploadError}
            </div>
          )}

          {/* Chassis, Make, Model */}
          <div className="grid gap-4 md:grid-cols-3">
            <Field
              label="Chassis Code"
              required
              value={form.chassisCode}
              onChange={(v) => updateField('chassisCode', v)}
              placeholder="e.g. ZVW51-1234567"
            />
            <Field
              label="Make"
              required
              value={form.make}
              onChange={(v) => updateField('make', v)}
              placeholder="Toyota"
            />
            <Field
              label="Model"
              required
              value={form.model}
              onChange={(v) => updateField('model', v)}
              placeholder="Prius"
            />
          </div>

          {/* Variant, Year, Colour */}
          <div className="grid gap-4 md:grid-cols-3">
            <Field
              label="Variant"
              value={form.variant}
              onChange={(v) => updateField('variant', v)}
              placeholder="S Touring"
            />
            <Field
              label="Year"
              value={form.year}
              onChange={(v) => updateField('year', v)}
              placeholder="2017"
              type="number"
            />
            <Field
              label="Colour"
              value={form.colour}
              onChange={(v) => updateField('colour', v)}
              placeholder="Pearl White"
            />
          </div>

          {/* Grade */}
          <div className="grid gap-4 md:grid-cols-3">
            <Field
              label="Auction Grade"
              value={form.grade}
              onChange={(v) => updateField('grade', v)}
              placeholder="4.5 / B"
            />
          </div>

          {/* Money fields */}
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Total Purchase Price (AUD)"
              required
              value={form.totalPurchasePriceAUD}
              onChange={(v) => updateField('totalPurchasePriceAUD', v)}
              placeholder="18000"
              type="number"
            />
            <Field
              label="Sale Price (AUD)"
              value={form.salePrice}
              onChange={(v) => updateField('salePrice', v)}
              placeholder="22500"
              type="number"
            />
          </div>

          {/* Status */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-1.5 text-sm">
              <label className="text-slate-200">
                Status <span className="text-red-400">*</span>
              </label>
              <select
                className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                value={form.status}
                onChange={(e) => updateField('status', e.target.value)}
              >
                <option value="JAPAN">Japan</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="IN_AUSTRALIA">In Australia</option>
                <option value="SOLD">Sold</option>
              </select>
            </div>
          </div>

          {/* Documents section */}
          <section className="mt-4 space-y-3 rounded-md border border-slate-800 bg-slate-950/40 p-3 text-xs">
            <div className="mb-1">
              <h2 className="text-sm font-semibold text-slate-200">
                Attach Documents (optional)
              </h2>
              <p className="text-[11px] text-slate-500">
                You can also attach or replace documents later from the car
                detail screen.
              </p>
            </div>

            {/* Fixed document types */}
            <div className="space-y-2">
              {DOC_DEFS.map((def) => (
                <DocUploadRow
                  key={def.type}
                  label={def.label}
                  file={docFiles[def.type] ?? null}
                  onFileSelected={(file) => handleDocFileChange(def.type, file)}
                />
              ))}
            </div>

            {/* Car pictures */}
            <div className="mt-3 rounded-md border border-slate-800 bg-slate-900/60 px-3 py-2">
              <div className="mb-1 flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-slate-100">
                    Car Pictures
                  </span>
                  <p className="text-[11px] text-slate-500">
                    You can attach multiple images. They will also appear under
                    “Car Pictures” on the detail page.
                  </p>
                </div>
                <label
                  htmlFor="new-car-pictures"
                  className="cursor-pointer rounded-md border border-slate-600 px-2 py-1 text-[11px] hover:bg-slate-800"
                >
                  Add Picture(s)
                </label>
                <input
                  id="new-car-pictures"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handlePictureFilesSelected(e.target.files)}
                />
              </div>
              {pictureFiles.length > 0 && (
                <p className="text-[11px] text-slate-400">
                  {pictureFiles.length} file
                  {pictureFiles.length > 1 ? 's' : ''} selected.
                </p>
              )}
            </div>
          </section>

          {/* Actions */}
          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="rounded-md border border-slate-600 px-4 py-2 text-sm hover:bg-slate-800"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-black hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Saving…' : 'Save Car'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
};

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = 'text',
}: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <label className="text-slate-200">
        {label}
        {required && <span className="text-red-400"> *</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-emerald-500"
      />
    </div>
  );
}

type DocUploadRowProps = {
  label: string;
  file: File | null;
  onFileSelected: (file: File | null) => void;
};

function DocUploadRow({ label, file, onFileSelected }: DocUploadRowProps) {
  const inputId = `new-doc-${label.replace(/\s+/g, '-')}`;

  return (
    <div className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-900/60 px-3 py-2">
      <div className="flex flex-col">
        <span className="text-[11px] font-medium text-slate-100">{label}</span>
        <span className="text-[11px] text-slate-500">
          {file ? file.name : 'No file selected'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {file && (
          <button
            type="button"
            onClick={() => onFileSelected(null)}
            className="rounded-md border border-slate-600 px-2 py-1 text-[11px] hover:bg-slate-800"
          >
            Clear
          </button>
        )}
        <label
          htmlFor={inputId}
          className="cursor-pointer rounded-md border border-slate-600 px-2 py-1 text-[11px] hover:bg-slate-800"
        >
          {file ? 'Replace' : 'Attach'}
        </label>
        <input
          id={inputId}
          type="file"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            onFileSelected(f);
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );
}