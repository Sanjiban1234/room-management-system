'use client';

import { useState, useTransition } from 'react';
import { createPerformanceRegistration } from '@/app/actions/client';
import { Button } from '@/components/ui/Button';
import { PHONE_REGEX, COLLEGE_EMAIL_DOMAIN, NAME_REGEX } from '@/lib/schemas';

interface FieldErrors {
  name?: string;
  phone?: string;
  collegeMail?: string;
  otherPerformanceType?: string;
  groupName?: string;
  materialRequired?: string;
  members?: Record<number, { name?: string; phone?: string }>;
}

export default function PerformanceForm({ coordinators }: { coordinators?: Record<string, { name: string, phone: string }> }) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [performanceType, setPerformanceType] = useState('Dance');
  const [otherPerformanceType, setOtherPerformanceType] = useState('');
  const [type, setType] = useState('Solo');
  const [groupName, setGroupName] = useState('');
  const [materialRequired, setMaterialRequired] = useState('');
  const [copiedText, setCopiedText] = useState<string | null>(null);

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

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const validateForm = (
    name: string,
    phone: string,
    collegeMail: string,
    members: { name: string; phone: string }[]
  ): FieldErrors => {
    const errors: FieldErrors = {};
    if (!name || name.trim().length < 2) errors.name = 'Name must be at least 2 characters.';
    else if (name.trim().length > 100) errors.name = 'Name must be 100 characters or fewer.';
    else if (!NAME_REGEX.test(name.trim())) errors.name = 'Name can only contain letters, spaces, dots, and hyphens.';

    if (!phone || phone.trim().length < 10) errors.phone = 'Phone number must be at least 10 digits.';
    else if (!PHONE_REGEX.test(phone.trim())) errors.phone = 'Phone must contain only digits, spaces, +, -, or ()';

    if (!collegeMail || !collegeMail.includes('@')) errors.collegeMail = 'Please enter a valid email address.';
    else if (collegeMail.length > 254) errors.collegeMail = 'Email address is too long.';
    else if (!collegeMail.toLowerCase().endsWith(COLLEGE_EMAIL_DOMAIN)) errors.collegeMail = 'Email must end with @acem.edu.np';

    if (performanceType === 'Other' && (!otherPerformanceType || otherPerformanceType.trim().length === 0)) {
      errors.otherPerformanceType = 'Please specify your performance type.';
    }

    if (type === 'Group') {
      if (!groupName || groupName.trim().length === 0) errors.groupName = 'Group name is required.';
      const memberErrors: Record<number, { name?: string; phone?: string }> = {};
      members.forEach((m, i) => {
        const me: { name?: string; phone?: string } = {};
        if (!m.name || m.name.trim().length < 2) me.name = 'Member name must be at least 2 characters.';
        else if (!NAME_REGEX.test(m.name.trim())) me.name = 'Member name can only contain letters, spaces, dots, and hyphens.';
        if (!m.phone || !PHONE_REGEX.test(m.phone.trim())) me.phone = 'Member phone must be a valid number.';
        if (me.name || me.phone) memberErrors[i] = me;
      });
      if (Object.keys(memberErrors).length > 0) errors.members = memberErrors;
    }
    return errors;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const collegeMail = formData.get('collegeMail') as string;

    // Client-side validation
    const validationErrors = validateForm(name, phone, collegeMail, groupMembers);
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }
    setFieldErrors({});

    const data = {
      name,
      phone,
      collegeMail,
      performanceType,
      otherPerformanceType,
      type,
      groupName: type === 'Group' ? groupName : undefined,
      materialRequired: materialRequired || undefined,
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
    const currentCoordinator = coordinators?.[performanceType] || { name: '', phone: '' };
    const hasCoordinator = currentCoordinator.name || currentCoordinator.phone;

    return (
      <div className="flex-col items-center justify-center text-center gap-6 animate-fade-in" style={{ padding: '1rem' }}>
        <div style={{ fontSize: '3.5rem', color: 'var(--success-color)', filter: 'drop-shadow(0 0 10px rgba(46, 204, 113, 0.2))' }}>✅</div>
        <div>
          <h3 className="text-xl font-bold" style={{ marginBottom: '0.5rem' }}>Registration Successful!</h3>
          <p className="text-muted">Thank you for registering. Your details have been submitted successfully.</p>
        </div>

        {hasCoordinator && (
          <div className="glass-panel text-left w-full flex-col gap-4" style={{ padding: '1.5rem', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-md)', marginTop: '0.5rem' }}>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h4 className="font-bold text-sm" style={{ color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📞 Coordinator Information
              </h4>
              <p className="text-xs text-muted" style={{ marginTop: '0.25rem' }}>Please contact your performance coordinator for event details, timing, and rehearsal slots.</p>
            </div>

            <div className="flex-col gap-3">
              {currentCoordinator.name && (
                <div className="flex justify-between items-center bg-black bg-opacity-20 animate-fade-in" style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <div className="flex-col">
                    <span className="text-xs text-muted">Name</span>
                    <span className="font-semibold text-sm">{currentCoordinator.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(currentCoordinator.name, 'Name')}
                    className="btn btn-secondary text-xs"
                    style={{ padding: '0.35rem 0.75rem', minWidth: '70px' }}
                  >
                    {copiedText === 'Name' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              )}

              {currentCoordinator.phone && (
                <div className="flex justify-between items-center bg-black bg-opacity-20 animate-fade-in" style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <div className="flex-col">
                    <span className="text-xs text-muted">Phone Number</span>
                    <span className="font-semibold text-sm">{currentCoordinator.phone}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(currentCoordinator.phone, 'Phone')}
                    className="btn btn-secondary text-xs"
                    style={{ padding: '0.35rem 0.75rem', minWidth: '70px' }}
                  >
                    {copiedText === 'Phone' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <Button onClick={() => window.location.href = '/'} style={{ marginTop: '0.5rem', width: '100%' }}>Return Home</Button>
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
        <input type="text" id="name" name="name" className="input" placeholder="Your full name" required maxLength={100} />
        {fieldErrors.name && <p style={{ color: 'var(--error-color)', fontSize: '0.78rem', marginTop: '0.25rem' }}>⚠ {fieldErrors.name}</p>}
      </div>

      <div className="flex-col gap-2">
        <label htmlFor="phone" className="text-sm font-medium">Phone Number</label>
        <input type="tel" id="phone" name="phone" className="input" placeholder="98XXXXXXXX" required maxLength={15} />
        {fieldErrors.phone && <p style={{ color: 'var(--error-color)', fontSize: '0.78rem', marginTop: '0.25rem' }}>⚠ {fieldErrors.phone}</p>}
      </div>

      <div className="flex-col gap-2">
        <label htmlFor="collegeMail" className="text-sm font-medium">College Mail</label>
        <input type="email" id="collegeMail" name="collegeMail" className="input" placeholder="yourname@acem.edu.np" required maxLength={254} />
        {fieldErrors.collegeMail && <p style={{ color: 'var(--error-color)', fontSize: '0.78rem', marginTop: '0.25rem' }}>⚠ {fieldErrors.collegeMail}</p>}
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
          <option value="Band">Band</option>
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
            maxLength={100}
          />
          {fieldErrors.otherPerformanceType && <p style={{ color: 'var(--error-color)', fontSize: '0.78rem', marginTop: '0.25rem' }}>⚠ {fieldErrors.otherPerformanceType}</p>}
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
        <div className="flex-col gap-4 animate-fade-in" style={{ padding: '1.5rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div className="flex-col gap-2">
            <label htmlFor="groupName" className="text-sm font-medium">Group Name</label>
            <input
              type="text"
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="input w-full"
              placeholder="Enter your group's name"
              required={type === 'Group'}
              maxLength={100}
            />
            {fieldErrors.groupName && <p style={{ color: 'var(--error-color)', fontSize: '0.78rem', marginTop: '0.25rem' }}>⚠ {fieldErrors.groupName}</p>}
          </div>
          <h4 className="font-bold text-sm" style={{ marginTop: '0.5rem' }}>Group Members</h4>
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
                  maxLength={100}
                />
                {fieldErrors.members?.[index]?.name && <p style={{ color: 'var(--error-color)', fontSize: '0.75rem' }}>⚠ {fieldErrors.members[index].name}</p>}
              </div>
              <div className="flex-col gap-1" style={{ flex: 1 }}>
                <label className="text-xs text-muted">Phone</label>
                <input
                  type="tel"
                  className="input w-full"
                  value={member.phone}
                  onChange={(e) => handleMemberChange(index, 'phone', e.target.value)}
                  required
                  maxLength={15}
                />
                {fieldErrors.members?.[index]?.phone && <p style={{ color: 'var(--error-color)', fontSize: '0.75rem' }}>⚠ {fieldErrors.members[index].phone}</p>}
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

      <div className="flex-col gap-2">
        <label htmlFor="materialRequired" className="text-sm font-medium">Material required for performance</label>
        <textarea
          id="materialRequired"
          value={materialRequired}
          onChange={(e) => setMaterialRequired(e.target.value)}
          className="input w-full"
          placeholder="e.g. Mic, guitar, speakers, background tracks, none, etc."
          rows={2}
          maxLength={500}
          style={{ minHeight: '60px', paddingTop: '0.5rem', paddingBottom: '0.5rem' }}
        />
        <div className="flex justify-between">
          <p className="text-xs text-muted">Specify if you need any instruments, Dresses , other props</p>
          <p className="text-xs text-muted" style={{ whiteSpace: 'nowrap' }}>{materialRequired.length}/500</p>
        </div>
        {fieldErrors.materialRequired && <p style={{ color: 'var(--error-color)', fontSize: '0.78rem' }}>⚠ {fieldErrors.materialRequired}</p>}
      </div>

      <Button type="submit" disabled={isPending} className="w-full" style={{ marginTop: '1rem', padding: '1rem' }}>
        {isPending ? 'Registering...' : 'Register Now'}
      </Button>
    </form>
  );
}
