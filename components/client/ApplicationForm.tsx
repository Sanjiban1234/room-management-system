'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createVolunteerApplication } from '@/app/actions/client';
import { applicantSchema, PHONE_REGEX, COLLEGE_EMAIL_DOMAIN } from '@/lib/schemas';

interface FieldWarnings {
  phone?: string;
  email?: string;
}

export default function ApplicationForm() {
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldWarnings, setFieldWarnings] = useState<FieldWarnings>({});

  // Helper: Filter phone input to only allow valid phone characters
  const filterPhoneInput = (value: string): string => {
    return value.replace(/[^0-9+\-()\s]/g, '');
  };

  // Helper: Check if email is valid acem.edu.np email
  const isValidAcemEmail = (email: string): boolean => {
    return email.toLowerCase().endsWith(COLLEGE_EMAIL_DOMAIN) && email.includes('@');
  };

  // Helper: Get real-time warning for email
  const getEmailWarning = (email: string): string | undefined => {
    if (!email) return undefined;
    if (!email.includes('@')) {
      return 'Email must contain @';
    }
    if (email.includes('@') && !isValidAcemEmail(email)) {
      return 'Email must end with @acem.edu.np';
    }
    return undefined;
  };

  // Helper: Get real-time warning for phone
  const getPhoneWarning = (phone: string): string | undefined => {
    if (!phone) return undefined;
    if (!/^[0-9]/.test(phone)) {
      return 'Phone must start with a digit';
    }
    if (phone.length < 10) {
      return `Phone must be at least 10 digits (${phone.replace(/\D/g, '').length} digit${phone.replace(/\D/g, '').length !== 1 ? 's' : ''} entered)`;
    }
    return undefined;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const phone = (formData.get('phone') as string) || '';
    
    // Filter phone to ensure only valid characters
    const filteredPhone = filterPhoneInput(phone);
    
    const data = {
      name: formData.get('name') as string,
      faculty: formData.get('faculty') as string,
      phone: filteredPhone,
      email: formData.get('email') as string,
    };

    const result = applicantSchema.safeParse(data);
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      const response = await createVolunteerApplication(result.data);
      if (response.success) {
        setSuccess(true);
      } else {
        setError(response.error || "Submission failed. Please try again.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center animate-fade-in glass-panel" style={{ padding: '2rem' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>🙌</div>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--success-color)' }}>Application Received!</h2>
        <p className="text-muted" style={{ marginTop: '0.75rem' }}>Thank you for volunteering. Our team will review your application and reach out to you soon.</p>
        <Button style={{ marginTop: '2.5rem' }} onClick={() => setSuccess(false)}>Apply Another</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex-col gap-6 animate-fade-in">
      {error && (
        <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255, 71, 87, 0.1)', color: 'var(--error-color)', fontSize: '0.85rem', border: '1px solid rgba(255, 71, 87, 0.2)' }}>
          ⚠️ {error}
        </div>
      )}

      <div className="flex gap-4">
        <Input label="Full Name" name="name" required placeholder="Jane Doe" style={{ flex: 1 }} />
        <div className="input-group" style={{ flex: 1 }}>
          <label>Faculty</label>
          <select name="faculty" className="select" required>
            <option value="">-- Select Faculty --</option>
            <option value="BEI">BEI</option>
            <option value="BEL">BEL</option>
            <option value="BCT">BCT</option>
            <option value="BCE">BCE</option>
            <option value="BCA">BCA</option>
          </select>
        </div>
      </div>
      <div className="flex gap-4">
        <div className="input-group" style={{ flex: 1 }}>
          <label>Phone Number</label>
          <input 
            type="tel" 
            name="phone" 
            required 
            placeholder="98XXXXXXXX"
            onChange={(e) => {
              const filtered = filterPhoneInput(e.currentTarget.value);
              e.currentTarget.value = filtered;
              
              const warning = getPhoneWarning(filtered);
              setFieldWarnings(prev => ({
                ...prev,
                phone: warning
              }));
            }}
            onBlur={(e) => {
              const warning = getPhoneWarning(e.currentTarget.value);
              if (warning) {
                setFieldWarnings(prev => ({
                  ...prev,
                  phone: warning
                }));
              }
            }}
            className="input"
          />
          {fieldWarnings.phone && <p style={{ color: '#f39c12', fontSize: '0.78rem', marginTop: '0.25rem' }}>ℹ {fieldWarnings.phone}</p>}
        </div>
        <div className="input-group" style={{ flex: 1 }}>
          <label>College Email</label>
          <input 
            type="email" 
            name="email" 
            required 
            placeholder="yourname@acem.edu.np"
            onChange={(e) => {
              const warning = getEmailWarning(e.currentTarget.value);
              setFieldWarnings(prev => ({
                ...prev,
                email: warning
              }));
            }}
            onBlur={(e) => {
              const warning = getEmailWarning(e.currentTarget.value);
              if (warning) {
                setFieldWarnings(prev => ({
                  ...prev,
                  email: warning
                }));
              }
            }}
            className="input"
          />
          {fieldWarnings.email && <p style={{ color: '#f39c12', fontSize: '0.78rem', marginTop: '0.25rem' }}>ℹ {fieldWarnings.email}</p>}
        </div>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <Button type="submit" fullWidth disabled={loading}>
          {loading ? 'Submitting Application...' : 'Apply as Volunteer'}
        </Button>
      </div>
    </form>
  );
}
