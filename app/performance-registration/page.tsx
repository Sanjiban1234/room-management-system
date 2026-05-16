import Link from 'next/link';
import PerformanceForm from '@/components/client/PerformanceForm';

export const metadata = {
  title: 'Performance Registration | Slot System',
  description: 'Register for your performance.',
};

export default function PerformanceRegistrationPage() {
  return (
    <div className="container animate-fade-in" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '1rem' }}>
      <header className="flex justify-between items-center" style={{ padding: '1.5rem 0', marginBottom: '2rem' }}>
        <Link href="/" className="flex gap-3 items-center" style={{ textDecoration: 'none' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>S</div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--primary-color)', letterSpacing: '-0.5px' }}>Slot System</h2>
        </Link>
      </header>

      <main className="flex-col items-center justify-center" style={{ flex: 1, paddingBottom: '4rem' }}>
        <div className="glass-panel w-full" style={{ maxWidth: '600px', padding: '2.5rem' }}>
          <div className="text-center" style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '1.5rem', display: 'inline-block', padding: '0.5rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(155, 89, 182, 0.1)', color: 'var(--accent-color)', marginBottom: '1rem' }}>🎭</div>
            <h1 className="text-2xl font-bold" style={{ marginBottom: '0.5rem' }}>Register for Performance</h1>
            <p className="text-muted">Fill out the form below to register your performance.</p>
          </div>
          
          <PerformanceForm />
        </div>
      </main>

      <footer className="text-center text-muted" style={{ padding: '2rem', borderTop: '1px solid var(--border-color)', marginTop: 'auto' }}>
        <p>&copy; 2026 MEC . All rights reserved.</p>
      </footer>
    </div>
  );
}
