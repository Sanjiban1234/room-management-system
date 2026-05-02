'use client';

import { useState } from 'react';
import { loginAction } from '@/app/actions/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await loginAction(formData).catch(err => {
      // Redirect throws an error in next.js, so we bypass it here.
      if (err.message && err.message.includes('NEXT_REDIRECT')) {
        throw err;
      }
      return { error: 'Something went wrong.' };
    });

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="container flex items-center justify-center animate-fade-in" style={{ minHeight: '100vh', padding: '1rem' }}>
      <div className="glass-panel" style={{ padding: '2.5rem', width: '100%', maxWidth: '400px' }}>
        <h1 className="text-2xl font-bold text-center" style={{ marginBottom: '1.5rem', color: 'var(--primary-color)' }}>
          Admin Portal
        </h1>
        {error && (
          <div style={{ padding: '0.75rem', marginBottom: '1rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255, 71, 87, 0.1)', color: 'var(--error-color)', border: '1px solid rgba(255, 71, 87, 0.3)', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex-col gap-4">
          <Input 
            label="Username" 
            name="username" 
            type="text" 
            placeholder="Enter username" 
            required 
          />
          <Input 
            label="Password" 
            name="password" 
            type="password" 
            placeholder="Enter password" 
            required 
          />
          <Button type="submit" fullWidth disabled={loading} style={{ marginTop: '1rem' }}>
            {loading ? 'Authenticating...' : 'Login'}
          </Button>
        </form>
      </div>
    </div>
  );
}
