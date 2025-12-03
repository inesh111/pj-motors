'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function CarActions({ carId }: { carId: number }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    const confirmed = window.confirm(
      'Are you sure you want to delete this car and all its documents?',
    );
    if (!confirmed) return;

    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/cars/${carId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to delete car');
        setDeleting(false);
        return;
      }

      router.push('/');
    } catch (err) {
      console.error(err);
      setError('Something went wrong while deleting');
      setDeleting(false);
    }
  }

  function handleEdit() {
    router.push(`/cars/${carId}/edit`);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {error && (
        <span className="max-w-xs text-[11px] text-red-300">{error}</span>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleEdit}
          className="rounded-md border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-800"
          disabled={deleting}
        >
          Edit
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-md border border-red-500/60 px-3 py-1.5 text-xs font-medium text-red-200 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {deleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </div>
  );
}