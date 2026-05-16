'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Calendar } from '@/components/ui/Calendar';
import { createBooking } from '@/app/actions/client';
import { z } from 'zod';
import { hasBookingPassed } from '@/lib/utils';

const bookingSchema = z.object({
  clientName: z.string().min(2, "Name is too short"),
  phone: z.string().min(10, "Invalid phone number"),
  faculty: z.enum(["BEI", "BEL", "BCT", "BCE", "BCA"]),
  batch: z.string().min(1, "Batch is required"),
  date: z.string().min(1, "Date is required"),
  timeSlot: z.string().min(1, "Time slot is required"),
  volunteerId: z.string().min(1, "Volunteer is required"),
});

export default function BookingForm({ 
  volunteers, 
  initialBookings,
  blockedDates = [],
  timeSlots = ['2:30-3:30', '3:30-4:30', '4:30-5:30'],
}: { 
  volunteers: any[], 
  initialBookings: any[],
  blockedDates?: string[],
  timeSlots?: string[],
}) {
  const [success, setSuccess] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedVolunteer, setSelectedVolunteer] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');

  const batches = Array.from(new Set(volunteers.map(v => v.batch).filter(b => b !== ''))).sort();
  const filteredVolunteers = volunteers.filter(v => !selectedBatch || v.batch === selectedBatch);

  const isSlotBooked = (slot: string) => {
    return initialBookings.some(b => 
      b.date === selectedDate && 
      b.timeSlot === slot && 
      b.volunteerId === selectedVolunteer &&
      b.status !== 'cancelled'
    );
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(bookingId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      clientName: formData.get('clientName') as string,
      faculty: formData.get('faculty') as string,
      batch: formData.get('batch') as string,
      phone: formData.get('phone') as string,
      date: selectedDate,
      timeSlot: selectedTimeSlot,
      volunteerId: selectedVolunteer,
    };

    const result = bookingSchema.safeParse(data);
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    
    setLoading(true);
    try {
      const response = await createBooking(result.data);
      if (response.success) {
        setBookingId(response.bookingId || '');
        setSuccess(true);
      } else {
        setError(response.error || "Booking failed. Please try again.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center animate-fade-in glass-panel" style={{ padding: '2rem' }} role="status">
        <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>✨</div>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--success-color)' }}>Booking Confirmed!</h2>
        <p className="text-muted" style={{ marginTop: '0.75rem' }}>Your session has been reserved. See you there!</p>

        {bookingId && (
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(52, 152, 219, 0.08)',
            border: '1px dashed var(--primary-color)',
          }}>
            <p className="text-sm text-muted" style={{ marginBottom: '0.4rem' }}>Your Booking ID</p>
            <p style={{
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              letterSpacing: '0.04em',
              wordBreak: 'break-all',
              color: 'var(--primary-color)',
            }}>
              {bookingId}
            </p>
            <button
              onClick={handleCopyId}
              style={{
                marginTop: '0.75rem',
                fontSize: '0.78rem',
                padding: '0.3rem 0.9rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--primary-color)',
                backgroundColor: copied ? 'var(--primary-color)' : 'transparent',
                color: copied ? 'white' : 'var(--primary-color)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {copied ? '✓ Copied!' : 'Copy ID'}
            </button>
            <p className="text-xs text-muted" style={{ marginTop: '0.5rem' }}>
              Save this ID to look up your booking later.
            </p>
          </div>
        )}

        <Button style={{ marginTop: '2rem' }} onClick={() => {
          setSuccess(false);
          setBookingId('');
          setSelectedTimeSlot('');
          window.location.reload();
        }}>Book Another Slot</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex-col gap-6 animate-fade-in">
      {error && (
        <div 
          role="alert" 
          aria-live="assertive"
          style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255, 71, 87, 0.1)', color: 'var(--error-color)', fontSize: '0.85rem', border: '1px solid rgba(255, 71, 87, 0.2)' }}
        >
          ⚠️ {error}
        </div>
      )}

      <div className="flex gap-4">
        <Input label="Full Name" name="clientName" required placeholder="John Doe" style={{ flex: 1 }} />
        <Input label="Phone Number" name="phone" required placeholder="98XXXXXXXX" style={{ flex: 1 }} />
      </div>
      
      <div className="flex gap-4">
        <div className="input-group" style={{ flex: 1 }}>
          <label htmlFor="faculty-select">Faculty</label>
          <select id="faculty-select" name="faculty" className="select" required>
            <option value="">-- Select Faculty --</option>
            <option value="BEI">BEI</option>
            <option value="BEL">BEL</option>
            <option value="BCT">BCT</option>
            <option value="BCE">BCE</option>
            <option value="BCA">BCA</option>
          </select>
        </div>
        <Input label="Current Batch" name="batch" required placeholder="2080" style={{ flex: 1 }} />
      </div>
      
      <div className="flex gap-4 items-end">
        <div className="input-group" style={{ flex: 1 }}>
          <label htmlFor="batch-filter">Filter Volunteer by Batch</label>
          <select 
            id="batch-filter" 
            className="select" 
            value={selectedBatch} 
            onChange={(e) => {
              setSelectedBatch(e.target.value);
              setSelectedVolunteer('');
            }}
          >
            <option value="">-- All Batches --</option>
            {batches.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
        <div className="input-group" style={{ flex: 1 }}>
          <label htmlFor="volunteer">Select Individual Volunteer</label>
          <select 
            id="volunteer" 
            name="volunteerId" 
            className="select" 
            required 
            value={selectedVolunteer}
            onChange={(e) => setSelectedVolunteer(e.target.value)}
          >
            <option value="">-- Choose a Volunteer --</option>
            {filteredVolunteers.map(v => (
              <option key={v.id} value={v.id}>{v.name} ({v.faculty})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-col gap-3">
        <label className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>Choose Date</label>
        <div className="flex justify-center">
          <Calendar 
            selectedDate={selectedDate} 
            onSelect={setSelectedDate} 
            minDate={new Date().toISOString().split('T')[0]} 
            blockedDates={blockedDates}
          />
        </div>
      </div>

      {selectedDate && selectedVolunteer && (
        <div className="animate-fade-in" style={{ 
          padding: '1rem', 
          backgroundColor: 'var(--primary-light)', 
          borderRadius: 'var(--radius-md)', 
          border: '1px solid var(--border-color)',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{ fontSize: '1.5rem' }}>✅</div>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--primary)' }}>Selection Summary</p>
            <p className="text-xs text-muted">
              {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} with {volunteers.find(v => v.id === selectedVolunteer)?.name}
            </p>
          </div>
        </div>
      )}

      {selectedDate && selectedVolunteer && (
        <div className="flex-col gap-3 animate-fade-in" style={{ marginTop: '0.5rem' }}>
          <label className="text-sm font-bold" style={{ color: 'var(--text-main)' }} id="time-slots-label">Available Time Slots</label>
          <div className="flex gap-3 flex-wrap" role="radiogroup" aria-labelledby="time-slots-label">
            {timeSlots.map(slot => {
              const booked = isSlotBooked(slot);
              const passed = hasBookingPassed(selectedDate, slot);
              const disabled = booked || passed;
              const isSelected = selectedTimeSlot === slot;
              
              return (
                <button
                  key={slot}
                  type="button"
                  disabled={disabled}
                  aria-checked={isSelected}
                  role="radio"
                  onClick={() => setSelectedTimeSlot(slot)}
                  className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ 
                    flex: 1, 
                    minWidth: '130px',
                    padding: '0.8rem',
                    opacity: disabled ? 0.4 : 1,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    border: isSelected ? '1px solid var(--primary-color)' : '1px solid var(--border-color)'
                  }}
                >
                  <span style={{ textDecoration: disabled ? 'line-through' : 'none' }}>{slot}</span>
                  {booked && <span style={{ fontSize: '0.65rem', display: 'block', marginTop: '2px', opacity: 0.8 }}>(Fully Booked)</span>}
                  {passed && !booked && <span style={{ fontSize: '0.65rem', display: 'block', marginTop: '2px', opacity: 0.8 }}>(Time Passed)</span>}
                  {isSelected && <div style={{ position: 'absolute', top: 0, right: 0, width: '0', height: '0', borderStyle: 'solid', borderWidth: '0 20px 20px 0', borderColor: 'transparent var(--primary-color) transparent transparent' }}></div>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ marginTop: '1rem' }}>
        <Button 
          type="submit" 
          fullWidth 
          disabled={loading || !selectedTimeSlot || !selectedDate} 
          style={{ padding: '1rem', fontSize: '1rem' }}
          aria-busy={loading}
        >
          {loading ? 'Processing Reservation...' : 'Confirm My Slot'}
        </Button>
      </div>
    </form>
  );
}
