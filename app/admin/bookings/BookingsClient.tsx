'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { exportToExcel } from '@/lib/excel';
import { cancelBooking } from '@/app/actions/admin';

function StatusBadge({ status }: { status: string }) {
  const isCancelled = status === 'cancelled';
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.3rem',
      padding: '0.2rem 0.65rem',
      borderRadius: '999px',
      fontSize: '0.75rem',
      fontWeight: '600',
      backgroundColor: isCancelled ? 'rgba(255,71,87,0.1)' : 'rgba(46,204,113,0.1)',
      color: isCancelled ? 'var(--error-color)' : 'var(--success-color)',
      border: `1px solid ${isCancelled ? 'rgba(255,71,87,0.25)' : 'rgba(46,204,113,0.25)'}`,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'currentColor', display: 'inline-block' }} />
      {isCancelled ? 'Cancelled' : 'Active'}
    </span>
  );
}

export default function BookingsClient({ initialBookings }: { initialBookings: any[] }) {
  const [search, setSearch] = useState('');
  const [bookings, setBookings] = useState(initialBookings);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const filteredBookings = bookings.filter(b =>
    b.clientName.toLowerCase().includes(search.toLowerCase()) ||
    (b.phone && b.phone.includes(search))
  );

  const handleExport = () => {
    const exportData = filteredBookings.map(b => ({
      'Booking ID': b.id,
      'Client Name': b.clientName,
      'Faculty': b.faculty,
      'Batch': b.batch,
      'Phone': b.phone,
      'Date': b.date,
      'Time Slot': b.timeSlot,
      'Assigned Volunteer': b.volunteer?.name || 'None',
      'Status': b.status || 'active',
      'Booked At': new Date(b.createdAt).toLocaleString()
    }));
    exportToExcel(exportData, 'bookings_export');
  };

  const handleCancel = (bookingId: string) => {
    if (!confirm('Cancel this booking? The slot will become available again.')) return;
    setCancellingId(bookingId);
    startTransition(async () => {
      try {
        await cancelBooking(bookingId);
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b));
      } catch (e) {
        alert('Failed to cancel booking. Please try again.');
      } finally {
        setCancellingId(null);
      }
    });
  };

  return (
    <div className="flex-col gap-6">
      <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
        <h1 className="text-2xl font-bold">Manage Bookings</h1>
        <Button onClick={handleExport} variant="secondary">Export to Excel</Button>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <Input 
          label="Search by Name or Phone" 
          placeholder="Type here..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="glass-panel" style={{ padding: '0' }}>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Client Name</th>
                <th>Faculty</th>
                <th>Batch</th>
                <th>Phone</th>
                <th>Date</th>
                <th>Time Slot</th>
                <th>Volunteer</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center text-muted">No bookings found.</td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr key={booking.id} style={{ opacity: booking.status === 'cancelled' ? 0.6 : 1, transition: 'opacity 0.2s' }}>
                    <td className="font-bold">{booking.clientName}</td>
                    <td>{booking.faculty}</td>
                    <td>{booking.batch}</td>
                    <td>{booking.phone}</td>
                    <td>{booking.date}</td>
                    <td>{booking.timeSlot}</td>
                    <td>{booking.volunteer?.name || 'None'}</td>
                    <td><StatusBadge status={booking.status || 'active'} /></td>
                    <td>
                      {(booking.status || 'active') === 'active' ? (
                        <button
                          onClick={() => handleCancel(booking.id)}
                          disabled={cancellingId === booking.id}
                          style={{
                            fontSize: '0.78rem',
                            padding: '0.25rem 0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid rgba(255,71,87,0.4)',
                            backgroundColor: 'transparent',
                            color: 'var(--error-color)',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            transition: 'background-color 0.2s',
                          }}
                          onMouseOver={e => (e.currentTarget.style.backgroundColor = 'rgba(255,71,87,0.1)')}
                          onMouseOut={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          {cancellingId === booking.id ? '...' : 'Cancel'}
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', opacity: 0.5 }}>—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
