'use client';

import { useTransition, useState } from 'react';
import { toggleCallForVolunteers, toggleCallForPerformance, updateSystemSetting, updateTimeSlots, updatePerformanceCoordinators } from '@/app/actions/admin';
import { Button } from '@/components/ui/Button';

export default function SettingsClient({ 
  initialEnabled,
  initialPerformanceEnabled,
  initialTopic,
  initialMessage,
  initialPerformanceClosedMessage,
  initialTimeSlots,
  initialCoordinators,
}: { 
  initialEnabled: boolean;
  initialPerformanceEnabled: boolean;
  initialTopic: string;
  initialMessage: string;
  initialPerformanceClosedMessage: string;
  initialTimeSlots: string[];
  initialCoordinators: Record<string, { name: string, phone: string }>;
}) {
  const [isPending, startTransition] = useTransition();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [performanceEnabled, setPerformanceEnabled] = useState(initialPerformanceEnabled);
  const [topic, setTopic] = useState(initialTopic);
  const [message, setMessage] = useState(initialMessage);
  const [performanceClosedMessage, setPerformanceClosedMessage] = useState(initialPerformanceClosedMessage);
  const [isSaving, setIsSaving] = useState(false);

  const [coordinators, setCoordinators] = useState<Record<string, { name: string, phone: string }>>(() => {
    const performanceTypes = ["Dance", "Singing", "Poem", "Standup", "Drama", "Band", "Other"];
    const initial: Record<string, { name: string, phone: string }> = {};
    performanceTypes.forEach(type => {
      initial[type] = initialCoordinators?.[type] || { name: '', phone: '' };
    });
    return initial;
  });
  const [isSavingCoordinators, setIsSavingCoordinators] = useState(false);

  const handleCoordinatorChange = (type: string, field: 'name' | 'phone', value: string) => {
    setCoordinators(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value
      }
    }));
  };

  const handleSaveCoordinators = async () => {
    setIsSavingCoordinators(true);
    try {
      await updatePerformanceCoordinators(coordinators);
      alert('Coordinators updated successfully!');
    } catch (e: any) {
      alert(e.message || 'Failed to update coordinators');
    } finally {
      setIsSavingCoordinators(false);
    }
  };

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

  const handlePerformanceToggle = () => {
    const newState = !performanceEnabled;
    setPerformanceEnabled(newState);
    startTransition(() => {
      toggleCallForPerformance(newState);
    });
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    await updateSystemSetting('volunteerCallTopic', topic);
    await updateSystemSetting('volunteerCallMessage', message);
    await updateSystemSetting('performanceRegistrationClosedMessage', performanceClosedMessage);
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
      {/* Call for Performance Toggle */}
      <div className="flex-col gap-4 bg-opacity-20 bg-black" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
        <div className="responsive-header">
          <div>
            <h3 className="text-lg font-bold">Call for Performance</h3>
            <p className="text-sm text-muted">The registration button remains visible when turned off and shows the closed message below.</p>
          </div>
          <Button 
            onClick={handlePerformanceToggle} 
            variant={performanceEnabled ? 'secondary' : 'primary'}
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            {performanceEnabled ? 'Turn Off' : 'Turn On'}
          </Button>
        </div>

        <div className="flex-col gap-2">
          <label className="text-sm font-medium">Performance Registration Closed Message</label>
          <textarea
            className="input w-full"
            style={{ minHeight: '100px', paddingTop: '0.5rem' }}
            value={performanceClosedMessage}
            onChange={(e) => setPerformanceClosedMessage(e.target.value)}
            placeholder="Performance registration is currently closed."
          />
          <p className="text-xs text-muted">Shown in a pop-up when visitors click the performance registration button while registration is off.</p>
        </div>
      </div>

      {/* Call for Volunteers Toggle */}
      <div className="responsive-header bg-opacity-20 bg-black" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
        <div>
          <h3 className="text-lg font-bold">Call for Volunteers</h3>
          <p className="text-sm text-muted">When turned on, the client portal switches to a volunteer registration module.</p>
        </div>
        <Button 
          onClick={handleToggle} 
          variant={enabled ? 'secondary' : 'primary'}
          disabled={isPending}
          className="w-full sm:w-auto"
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
            className="w-full sm:w-auto"
          >
            {isSaving ? 'Saving...' : 'Save Details'}
          </Button>
        </div>
      </div>

      {/* Performance Coordinators Manager */}
      <div className="flex-col gap-4" style={{ marginTop: '2rem' }}>
        <div>
          <h3 className="text-lg font-bold">Performance Coordinators</h3>
          <p className="text-sm text-muted">Assign a coordinator (Name & Phone) for each performance type. Registered users will see these contact details on successful registration.</p>
        </div>

        <div className="grid gap-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
          {Object.keys(coordinators).map(type => (
            <div key={type} className="glass-panel flex-col gap-3" style={{ padding: '1.25rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm" style={{ color: 'var(--accent-color)' }}>🎭 {type}</span>
              </div>
              <div className="flex-col gap-1">
                <label className="text-xs text-muted">Coordinator Name</label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="e.g. John Doe"
                  value={coordinators[type].name}
                  onChange={e => handleCoordinatorChange(type, 'name', e.target.value)}
                />
              </div>
              <div className="flex-col gap-1">
                <label className="text-xs text-muted">Coordinator Phone</label>
                <input
                  type="tel"
                  className="input w-full"
                  placeholder="e.g. 9876543210"
                  value={coordinators[type].phone}
                  onChange={e => handleCoordinatorChange(type, 'phone', e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end" style={{ marginTop: '0.5rem' }}>
          <Button onClick={handleSaveCoordinators} disabled={isSavingCoordinators} className="w-full sm:w-auto">
            {isSavingCoordinators ? 'Saving...' : 'Save Coordinators'}
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
        <div className="flex flex-col sm:flex-row gap-3 items-end" style={{ marginTop: '0.25rem' }}>
          <div className="flex-col gap-1 w-full" style={{ flex: 1 }}>
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
          <Button onClick={handleAddSlot} variant="secondary" className="w-full sm:w-auto" style={{ whiteSpace: 'nowrap' }}>
            + Add Slot
          </Button>
        </div>

        <div className="flex justify-end" style={{ marginTop: '0.5rem' }}>
          <Button onClick={handleSaveSlots} disabled={isSavingSlots} className="w-full sm:w-auto">
            {isSavingSlots ? 'Saving...' : 'Save Time Slots'}
          </Button>
        </div>
      </div>
    </div>
  );
}
