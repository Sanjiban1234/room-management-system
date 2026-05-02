'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createVolunteerApplication } from '@/app/actions/client';
import { z } from 'zod';

const applicantSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  faculty: z.enum(["BEI", "BEL", "BCT", "BCE", "BCA"]),
  phone: z.string().min(10, "Invalid phone number"),
  email: z.string().email("Invalid email address"),
});

export default function ApplicationForm() {
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      faculty: formData.get('faculty') as string,
      phone: formData.get('phone') as string,
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
    } catch (err) {
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
        <Input label="Phone Number" name="phone" required placeholder="98XXXXXXXX" style={{ flex: 1 }} />
        <Input label="Email (Gmail preferred)" name="email" type="email" required placeholder="example@gmail.com" style={{ flex: 1 }} />
      </div>

      <div style={{ marginTop: '1rem' }}>
        <Button type="submit" fullWidth disabled={loading}>
          {loading ? 'Submitting Application...' : 'Apply as Volunteer'}
        </Button>
      </div>
    </form>
  );
}
