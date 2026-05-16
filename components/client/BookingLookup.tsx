'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getBookingsByPhone, cancelBookingByPhone } from '@/app/actions/client';
import { hasBookingPassed } from '@/lib/utils';

type Booking = {
  id: string;
  clientName: string;
  faculty: string;
  batch: string;
  phone: string;
  date: string;
  timeSlot: string;
  status: string;
  volunteerName: string;
  createdAt: string;
};

function StatusBadge({ status, date, timeSlot }: { status: string; date: string; timeSlot: string }) {
  const isCancelled = status === 'cancelled';
  const isEnded = !isCancelled && hasBookingPassed(date, timeSlot);
  
  let bgColor = 'rgba(46,204,113,0.1)';
  let color = 'var(--success-color)';
  let borderColor = 'rgba(46,204,113,0.25)';
  let label = 'Active';

  if (isCancelled) {
    bgColor = 'rgba(255,71,87,0.1)';
    color = 'var(--error-color)';
    borderColor = 'rgba(255,71,87,0.25)';
    label = 'Cancelled';
  } else if (isEnded) {
    bgColor = 'rgba(115, 115, 115, 0.1)';
    color = 'var(--text-secondary)';
    borderColor = 'rgba(115, 115, 115, 0.25)';
    label = 'Session Ended';
  }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.3rem',
      padding: '0.2rem 0.65rem',
      borderRadius: '999px',
      fontSize: '0.75rem',
      fontWeight: '600',
      backgroundColor: bgColor,
      color: color,
      border: `1px solid ${borderColor}`,
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'currentColor', display: 'inline-block' }} />
      {label}
    </span>
  );
}

export default function BookingLookup() {
  const [phone, setPhone] = useState('');
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lookupPending, startLookup] = useTransition();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const handleLookup = () => {
    setError(null);
    setCancelError(null);
    startLookup(async () => {
      const result = await getBookingsByPhone(phone);
      if (result.success) {
        setBookings(result.bookings ?? []);
      } else {
        setError(result.error || 'Something went wrong.');
        setBookings(null);
      }
    });
  };

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking? This cannot be undone.')) return;
    setCancellingId(bookingId);
    setCancelError(null);
    const result = await cancelBookingByPhone(bookingId, phone);
    if (result.success) {
      setBookings(prev => prev ? prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b) : null);
    } else {
      setCancelError(result.error || 'Cancellation failed.');
    }
    setCancellingId(null);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isFuture = (dateStr: string) => new Date(dateStr) >= today;


  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '2.5rem', width: '100%', maxWidth: '680px' }}>
      <div className="text-center" style={{ marginBottom: '2rem' }}>
        <div style={{ fontSize: '1.5rem', display: 'inline-block', padding: '0.5rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(155, 89, 182, 0.1)', color: '#9b59b6', marginBottom: '1rem' }}>🔍</div>
        <h2 className="text-2xl font-bold" style={{ marginBottom: '0.5rem' }}>Check Your Booking</h2>
        <p className="text-muted">Enter the phone number you used to book and view or cancel your sessions.</p>
      </div>

      <div className="flex gap-3 items-end" style={{ marginBottom: '1.5rem' }}>
        <div style={{ flex: 1 }}>
          <Input
            label="Phone Number"
            placeholder="98XXXXXXXX"
            value={phone}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { e.preventDefault(); handleLookup(); } }}
          />
        </div>
        <Button
          onClick={handleLookup}
          disabled={lookupPending || phone.length < 7}
          style={{ whiteSpace: 'nowrap', padding: '0.65rem 1.5rem' }}
        >
          {lookupPending ? 'Searching...' : 'Find Bookings'}
        </Button>
      </div>

      {error && (
        <div role="alert" style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255,71,87,0.1)', color: 'var(--error-color)', fontSize: '0.85rem', border: '1px solid rgba(255,71,87,0.2)', marginBottom: '1rem' }}>
          ⚠️ {error}
        </div>
      )}

      {cancelError && (
        <div role="alert" style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255,71,87,0.1)', color: 'var(--error-color)', fontSize: '0.85rem', border: '1px solid rgba(255,71,87,0.2)', marginBottom: '1rem' }}>
          ⚠️ {cancelError}
        </div>
      )}

      {bookings !== null && (
        bookings.length === 0 ? (
          <div className="text-center text-muted" style={{ padding: '2rem 0' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
            <p>No bookings found for this phone number.</p>
          </div>
        ) : (
          <div className="flex-col gap-4">
            {bookings.map(booking => (
              <div
                key={booking.id}
                style={{
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${booking.status === 'cancelled' ? 'rgba(255,71,87,0.2)' : 'var(--border-color)'}`,
                  padding: '1.25rem 1.5rem',
                  backgroundColor: booking.status === 'cancelled' ? 'rgba(255,71,87,0.03)' : 'rgba(255,255,255,0.02)',
                  opacity: booking.status === 'cancelled' ? 0.75 : 1,
                  transition: 'all 0.2s',
                }}
              >
                <div className="flex justify-between items-center" style={{ marginBottom: '0.75rem' }}>
                  <div>
                    <p className="font-bold" style={{ fontSize: '1rem' }}>{booking.clientName}</p>
                    <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.1rem' }}>
                      {booking.faculty} · Batch {booking.batch}
                    </p>
                  </div>
                  <StatusBadge status={booking.status} date={booking.date} timeSlot={booking.timeSlot} />
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: '0.5rem',
                  fontSize: '0.85rem',
                  marginBottom: '1rem',
                }}>
                  <div>
                    <span className="text-muted">📅 Date</span>
                    <p className="font-bold" style={{ marginTop: '0.1rem' }}>{booking.date}</p>
                  </div>
                  <div>
                    <span className="text-muted">🕐 Time</span>
                    <p className="font-bold" style={{ marginTop: '0.1rem' }}>{booking.timeSlot}</p>
                  </div>
                  <div>
                    <span className="text-muted">👤 Volunteer</span>
                    <p className="font-bold" style={{ marginTop: '0.1rem' }}>{booking.volunteerName}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: 'var(--text-muted)', opacity: 0.6 }}>
                    ID: {booking.id}
                  </p>
                  {booking.status === 'active' && isFuture(booking.date) && !hasBookingPassed(booking.date, booking.timeSlot) && (
                    <button
                      onClick={() => handleCancel(booking.id)}
                      disabled={cancellingId === booking.id}
                      style={{
                        fontSize: '0.78rem',
                        padding: '0.3rem 0.9rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid rgba(255,71,87,0.4)',
                        backgroundColor: 'transparent',
                        color: 'var(--error-color)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseOver={e => (e.currentTarget.style.backgroundColor = 'rgba(255,71,87,0.1)')}
                      onMouseOut={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {cancellingId === booking.id ? 'Cancelling...' : 'Cancel Booking'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
