'use client';

import { useState } from 'react';
import Link from 'next/link';

type Props = {
  isRegistrationOpen: boolean;
  closedMessage: string;
};

export default function PerformanceRegistrationButton({ isRegistrationOpen, closedMessage }: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (isRegistrationOpen) {
    return (
      <Link href="/performance-registration" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', flex: '1 1 auto', background: 'var(--accent-color)' }}>
        Register for Performance
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-primary"
        style={{ padding: '0.75rem 1.5rem', flex: '1 1 auto', background: 'var(--accent-color)' }}
        onClick={() => setIsDialogOpen(true)}
      >
        Register for Performance
      </button>

      {isDialogOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="performance-closed-title"
          className="flex justify-center"
          style={{ position: 'fixed', inset: 0, zIndex: 50, alignItems: 'flex-start', padding: '4rem 1rem 1rem', background: 'rgba(0, 0, 0, 0.65)' }}
          onClick={() => setIsDialogOpen(false)}
        >
          <div
            className="glass-panel w-full"
            style={{ maxWidth: '440px', padding: '2rem' }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="text-center" style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>🎭</div>
              <h2 id="performance-closed-title" className="text-xl font-bold" style={{ marginBottom: '0.5rem' }}>
                Performance registration closed
              </h2>
              <p className="text-muted">{closedMessage}</p>
            </div>
            <button type="button" className="btn btn-primary w-full" onClick={() => setIsDialogOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
