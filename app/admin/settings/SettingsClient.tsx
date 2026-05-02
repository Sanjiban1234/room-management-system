'use client';

import { useTransition, useState } from 'react';
import { toggleCallForVolunteers, updateSystemSetting, updateTimeSlots } from '@/app/actions/admin';
import { Button } from '@/components/ui/Button';

export default function SettingsClient({ 
  initialEnabled,
  initialTopic,
  initialMessage,
  initialTimeSlots,
}: { 
  initialEnabled: boolean;
  initialTopic: string;
  initialMessage: string;
  initialTimeSlots: string[];
}) {
  const [isPending, startTransition] = useTransition();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [topic, setTopic] = useState(initialTopic);
  const [message, setMessage] = useState(initialMessage);
  const [isSaving, setIsSaving] = useState(false);

  // Time slots state
  const [slots, setSlots] = useState<string[]>(initialTimeSlots);
  const [newSlot, setNewSlot] = useState('');
  const [slotError, setSlotError] = useState('');
  const [isSavingSlots, setIsSavingSlots] = useState(false);

  const handleToggle = () => {
    const newState = !enabled;
    setEnabled(newState);
    startTransition(() => {
      toggleCallForVolunteers(newState);
    });
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    await updateSystemSetting('volunteerCallTopic', topic);
    await updateSystemSetting('volunteerCallMessage', message);
    setIsSaving(false);
    alert('Settings saved successfully!');
  };

  const handleAddSlot = () => {
    setSlotError('');
    const trimmed = newSlot.trim();
    if (!trimmed) return;
    // Basic format validation e.g. "2:30-3:30" or "14:00-15:00"
    const slotRegex = /^\d{1,2}:\d{2}-\d{1,2}:\d{2}$/;
    if (!slotRegex.test(trimmed)) {
      setSlotError('Format must be HH:MM-HH:MM, e.g. 2:30-3:30');
      return;
    }
    if (slots.includes(trimmed)) {
      setSlotError('This slot already exists.');
      return;
    }
    setSlots(prev => [...prev, trimmed]);
    setNewSlot('');
  };

  const handleRemoveSlot = (slot: string) => {
    if (slots.length <= 1) {
      alert('At least one time slot must remain.');
      return;
    }
    setSlots(prev => prev.filter(s => s !== slot));
  };

  const handleSaveSlots = async () => {
    setIsSavingSlots(true);
    await updateTimeSlots(slots);
    setIsSavingSlots(false);
    alert('Time slots saved! The booking page will now show the updated slots.');
  };

  return (
    <div className="flex-col gap-8">
      {/* Call for Volunteers Toggle */}
      <div className="flex justify-between items-center bg-opacity-20 bg-black" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
        <div>
          <h3 className="text-lg font-bold">Call for Volunteers</h3>
          <p className="text-sm text-muted">When turned on, the client portal switches to a volunteer registration module.</p>
        </div>
        <Button 
          onClick={handleToggle} 
          variant={enabled ? 'secondary' : 'primary'}
          disabled={isPending}
        >
          {enabled ? 'Turn Off' : 'Turn On'}
        </Button>
      </div>

      {/* Volunteer Call Details */}
      <div className="flex-col gap-6" style={{ marginTop: '1rem' }}>
        <div className="flex-col gap-2">
          <label className="text-sm font-medium">Volunteer Call Topic</label>
          <input 
            type="text" 
            className="input w-full" 
            value={topic} 
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Volunteer Registration"
          />
          <p className="text-xs text-muted">The title displayed in the registration section on the home page.</p>
        </div>

        <div className="flex-col gap-2">
          <label className="text-sm font-medium">Volunteer Call Message</label>
          <textarea 
            className="input w-full" 
            style={{ minHeight: '100px', paddingTop: '0.5rem' }}
            value={message} 
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe the volunteer opportunity..."
          />
          <p className="text-xs text-muted">The description displayed below the topic on the home page.</p>
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={handleSaveSettings} 
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Details'}
          </Button>
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid var(--border-color)', margin: '0.5rem 0' }} />

      {/* Time Slots Manager */}
      <div className="flex-col gap-4">
        <div>
          <h3 className="text-lg font-bold">Booking Time Slots</h3>
          <p className="text-sm text-muted">Manage the time slots available for clients to book. Changes will apply immediately to the booking page.</p>
        </div>

        {/* Current slot pills */}
        <div className="flex gap-2 flex-wrap" style={{ marginTop: '0.5rem' }}>
          {slots.map(slot => (
            <div
              key={slot}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.35rem 0.85rem',
                borderRadius: '999px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'rgba(52, 152, 219, 0.07)',
                fontSize: '0.85rem',
                fontWeight: '600',
              }}
            >
              <span>🕐 {slot}</span>
              <button
                onClick={() => handleRemoveSlot(slot)}
                title="Remove slot"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--error-color)',
                  fontSize: '1rem',
                  lineHeight: 1,
                  padding: '0 0.1rem',
                  opacity: 0.7,
                  transition: 'opacity 0.15s',
                }}
                onMouseOver={e => (e.currentTarget.style.opacity = '1')}
                onMouseOut={e => (e.currentTarget.style.opacity = '0.7')}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Add new slot */}
        <div className="flex gap-3 items-end" style={{ marginTop: '0.25rem' }}>
          <div className="flex-col gap-1" style={{ flex: 1 }}>
            <label className="text-sm font-medium">Add New Slot</label>
            <input
              type="text"
              className="input w-full"
              placeholder="e.g. 5:30-6:30"
              value={newSlot}
              onChange={e => { setNewSlot(e.target.value); setSlotError(''); }}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSlot(); } }}
            />
            {slotError && <p className="text-xs" style={{ color: 'var(--error-color)', marginTop: '0.2rem' }}>⚠ {slotError}</p>}
          </div>
          <Button onClick={handleAddSlot} variant="secondary" style={{ whiteSpace: 'nowrap' }}>
            + Add Slot
          </Button>
        </div>

        <div className="flex justify-end" style={{ marginTop: '0.5rem' }}>
          <Button onClick={handleSaveSlots} disabled={isSavingSlots}>
            {isSavingSlots ? 'Saving...' : 'Save Time Slots'}
          </Button>
        </div>
      </div>
    </div>
  );
}
