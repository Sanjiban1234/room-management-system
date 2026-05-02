'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAction } from '@/app/actions/auth';
import { Button } from '@/components/ui/Button';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navLinks = [
    { href: '/admin/dashboard', label: 'Dashboard' },
    { href: '/admin/bookings', label: 'Bookings' },
    { href: '/admin/volunteers', label: 'Volunteers' },
    { href: '/admin/applicants', label: 'Applicants' },
    { href: '/admin/blocked-dates', label: 'Blocked Dates' },
    { href: '/admin/settings', label: 'Settings' },
  ];

  const isLoginPage = pathname === '/admin/login';

  if (isLoginPage) {
    return (
      <div className="flex justify-center items-center" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
        <main className="animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', flexDirection: 'row' }}>
      {/* Fixed Sidebar */}
      <aside className="glass-panel animate-fade-in" style={{ 
        width: '250px',
        minWidth: '250px', 
        padding: '2rem 1rem', 
        display: 'flex', 
        flexDirection: 'column',
        borderRadius: '0',
        borderLeft: 'none',
        borderTop: 'none',
        borderBottom: 'none'
      }}>
        <div style={{ marginBottom: '2rem', padding: '0 1rem' }}>
          <h2 className="text-xl font-bold" style={{ color: 'var(--primary-color)' }}>Admin Portal</h2>
        </div>
        
        <nav className="flex-col gap-2" style={{ flex: 1 }}>
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.href} 
                href={link.href}
                style={{
                  display: 'block',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isActive ? 'rgba(123, 97, 255, 0.15)' : 'transparent',
                  color: isActive ? 'var(--primary-color)' : 'var(--text-main)',
                  fontWeight: isActive ? 600 : 400,
                  transition: 'background-color var(--transition-fast)'
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ marginTop: 'auto', padding: '0 1rem' }}>
          <form action={logoutAction}>
            <Button variant="danger" fullWidth>Logout</Button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="animate-fade-in" style={{ flex: 1, padding: '2rem', overflowY: 'auto', width: '100%' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
