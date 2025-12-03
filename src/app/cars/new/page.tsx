'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewCarPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  function updateField<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
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
      // redirect to car detail page
      router.push(`/cars/${car.id}`);
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
              Create a new chassis record in PJ Motors.
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
            <div className="rounded-md border border-red-500/60 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
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