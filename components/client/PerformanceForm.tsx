'use client';

import { useState, useTransition } from 'react';
import { createPerformanceRegistration } from '@/app/actions/client';
import { Button } from '@/components/ui/Button';

export default function PerformanceForm() {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [performanceType, setPerformanceType] = useState('Dance');
  const [otherPerformanceType, setOtherPerformanceType] = useState('');
  const [type, setType] = useState('Solo');
  
  const [groupMembers, setGroupMembers] = useState([{ name: '', phone: '' }]);

  const handleAddMember = () => {
    setGroupMembers([...groupMembers, { name: '', phone: '' }]);
  };

  const handleRemoveMember = (index: number) => {
    const newMembers = [...groupMembers];
    newMembers.splice(index, 1);
    setGroupMembers(newMembers);
  };

  const handleMemberChange = (index: number, field: 'name' | 'phone', value: string) => {
    const newMembers = [...groupMembers];
    newMembers[index][field] = value;
    setGroupMembers(newMembers);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    
    const data = {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      collegeMail: formData.get('collegeMail') as string,
      performanceType,
      otherPerformanceType,
      type,
      groupMembers: type === 'Group' ? groupMembers.filter(m => m.name && m.phone) : undefined
    };

    startTransition(async () => {
      const res = await createPerformanceRegistration(data);
      if (res.success) {
        setSuccess(true);
      } else {
        setError(res.error || 'Registration failed');
      }
    });
  };

  if (success) {
    return (
      <div className="flex-col items-center justify-center text-center gap-4 animate-fade-in" style={{ padding: '2rem' }}>
        <div style={{ fontSize: '3rem', color: 'var(--success-color)' }}>✅</div>
        <h3 className="text-xl font-bold">Registration Successful!</h3>
        <p className="text-muted">Thank you for registering. We will contact you soon.</p>
        <Button onClick={() => window.location.href = '/'} style={{ marginTop: '1rem' }}>Return Home</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex-col gap-6 animate-fade-in">
      {error && (
        <div style={{ padding: '1rem', backgroundColor: 'rgba(231, 76, 60, 0.1)', color: 'var(--error-color)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(231, 76, 60, 0.2)' }}>
          {error}
        </div>
      )}

      <div className="flex-col gap-2">
        <label htmlFor="name" className="text-sm font-medium">Name</label>
        <input type="text" id="name" name="name" className="input" placeholder="Your full name" required />
      </div>

      <div className="flex-col gap-2">
        <label htmlFor="phone" className="text-sm font-medium">Phone Number</label>
        <input type="tel" id="phone" name="phone" className="input" placeholder="Your phone number" required />
      </div>

      <div className="flex-col gap-2">
        <label htmlFor="collegeMail" className="text-sm font-medium">College Mail</label>
        <input type="email" id="collegeMail" name="collegeMail" className="input" placeholder="you@college.edu" required />
      </div>

      <div className="flex-col gap-2">
        <label htmlFor="performanceType" className="text-sm font-medium">Type of Performance</label>
        <select 
          id="performanceType" 
          value={performanceType}
          onChange={(e) => setPerformanceType(e.target.value)}
          className="input" 
          required
        >
          <option value="Dance">Dance</option>
          <option value="Singing">Singing</option>
          <option value="Poem">Poem</option>
          <option value="Standup">Standup</option>
          <option value="Drama">Drama</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {performanceType === 'Other' && (
        <div className="flex-col gap-2 animate-fade-in">
          <label htmlFor="otherPerformanceType" className="text-sm font-medium">Specify Performance</label>
          <input 
            type="text" 
            id="otherPerformanceType" 
            value={otherPerformanceType}
            onChange={(e) => setOtherPerformanceType(e.target.value)}
            className="input" 
            placeholder="Please specify" 
            required={performanceType === 'Other'}
          />
        </div>
      )}

      <div className="flex-col gap-2">
        <label className="text-sm font-medium">Performance Type</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              name="type" 
              value="Solo" 
              checked={type === 'Solo'} 
              onChange={() => setType('Solo')}
              className="accent-primary"
            />
            Solo
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              name="type" 
              value="Group" 
              checked={type === 'Group'} 
              onChange={() => setType('Group')}
              className="accent-primary"
            />
            Group
          </label>
        </div>
      </div>

      {type === 'Group' && (
        <div className="flex-col gap-4 animate-fade-in" style={{ padding: '1rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)' }}>
          <h4 className="font-bold text-sm">Group Members</h4>
          {groupMembers.map((member, index) => (
            <div key={index} className="flex gap-2 items-end">
              <div className="flex-col gap-1" style={{ flex: 1 }}>
                <label className="text-xs text-muted">Name</label>
                <input 
                  type="text" 
                  className="input w-full" 
                  value={member.name}
                  onChange={(e) => handleMemberChange(index, 'name', e.target.value)}
                  required
                />
              </div>
              <div className="flex-col gap-1" style={{ flex: 1 }}>
                <label className="text-xs text-muted">Phone</label>
                <input 
                  type="tel" 
                  className="input w-full" 
                  value={member.phone}
                  onChange={(e) => handleMemberChange(index, 'phone', e.target.value)}
                  required
                />
              </div>
              {groupMembers.length > 1 && (
                <Button type="button" variant="secondary" onClick={() => handleRemoveMember(index)} style={{ padding: '0.5rem 0.75rem', color: 'var(--error-color)' }}>
                  ×
                </Button>
              )}
            </div>
          ))}
          <Button type="button" variant="secondary" onClick={handleAddMember} style={{ alignSelf: 'flex-start' }}>
            + Add Member
          </Button>
        </div>
      )}

      <Button type="submit" disabled={isPending} className="w-full" style={{ marginTop: '1rem', padding: '1rem' }}>
        {isPending ? 'Registering...' : 'Register Now'}
      </Button>
    </form>
  );
}
