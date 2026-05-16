'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { addBlockedDate, deleteBlockedDate } from '@/app/actions/admin';
import { Trash2, Calendar as CalendarIcon, Plus } from 'lucide-react';
import { Calendar } from '@/components/ui/Calendar';

export default function BlockedDatesClient({ initialBlockedDates }: { initialBlockedDates: any[] }) {
  const [selectedDate, setSelectedDate] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const date = selectedDate;
    const reason = formData.get('reason') as string;

    if (!date) {
      alert('Please select a date.');
      setLoading(false);
      return;
    }

    try {
      await addBlockedDate(date, reason || null);
      setShowAddForm(false);
      window.location.reload();
    } catch (error) {
      alert('Failed to block date.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to unblock this date?')) return;
    try {
      await deleteBlockedDate(id);
      window.location.reload();
    } catch (error) {
      alert('Failed to unblock date.');
    }
  };

  return (
    <div className="flex-col gap-6">
      <div className="responsive-header">
        <div>
          <h1 className="text-2xl font-bold">Blocked Dates</h1>
          <p className="text-muted text-sm">Manage dates that are unavailable for booking globally.</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancel' : <><Plus size={18} style={{ marginRight: '8px' }} /> Block a Date</>}
        </Button>
      </div>

      {showAddForm && (
        <div className="glass-panel animate-fade-in" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h2 className="text-lg font-bold" style={{ marginBottom: '1.5rem' }}>Block a New Date</h2>
          <form onSubmit={handleAdd} className="flex-col gap-6">
            <div className="flex gap-4 items-start flex-wrap">
              <div className="flex-col gap-3" style={{ flex: 1, minWidth: '300px' }}>
                <label className="text-sm font-bold">Select Date</label>
                <div className="flex justify-center">
                  <Calendar 
                    selectedDate={selectedDate} 
                    onSelect={setSelectedDate} 
                    minDate={new Date().toISOString().split('T')[0]} 
                  />
                </div>
              </div>
              <div style={{ flex: 1, minWidth: '250px' }}>
                <Input label="Reason (Optional)" name="reason" placeholder="Holiday, Event, etc." />
                <div style={{ marginTop: '2rem' }}>
                  <Button type="submit" fullWidth disabled={loading || !selectedDate}>
                    {loading ? 'Blocking...' : 'Confirm Block'}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="glass-panel" style={{ padding: '0' }}>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Reason</th>
                <th>Added On</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {initialBlockedDates.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-muted" style={{ padding: '3rem' }}>
                    <CalendarIcon size={48} style={{ opacity: 0.1, marginBottom: '1rem', display: 'block', margin: '0 auto' }} />
                    No dates are currently blocked.
                  </td>
                </tr>
              ) : (
                initialBlockedDates.map((d) => (
                  <tr key={d.id}>
                    <td className="font-bold">
                      <div className="flex items-center gap-2">
                        <CalendarIcon size={14} className="text-primary" />
                        {d.date}
                      </div>
                    </td>
                    <td>{d.reason || <span className="text-muted italic">No reason provided</span>}</td>
                    <td className="text-sm text-muted">{new Date(d.createdAt).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <Button variant="danger" onClick={() => handleDelete(d.id)} style={{ padding: '0.4rem 0.8rem' }}>
                        <Trash2 size={16} />
                      </Button>
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
