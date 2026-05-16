'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAction } from '@/app/actions/auth';
import { Button } from '@/components/ui/Button';
import { Menu, X, LayoutDashboard, Calendar, Users, UserPlus, Music, Clock, Settings, LogOut } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { href: '/admin/bookings', label: 'Bookings', icon: <Calendar size={18} /> },
    { href: '/admin/volunteers', label: 'Volunteers', icon: <Users size={18} /> },
    { href: '/admin/applicants', label: 'Applicants', icon: <UserPlus size={18} /> },
    { href: '/admin/performances', label: 'Performances', icon: <Music size={18} /> },
    { href: '/admin/blocked-dates', label: 'Blocked Dates', icon: <Clock size={18} /> },
    { href: '/admin/settings', label: 'Settings', icon: <Settings size={18} /> },
  ];

  const isLoginPage = pathname === '/admin/login';

  if (isLoginPage) {
    return (
      <div className="flex justify-center items-center" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-gradient-start)' }}>
        <main className="animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
          {children}
        </main>
      </div>
    );
  }

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <div className="admin-layout-container">
      {/* Mobile Top Bar */}
      <header className="mobile-header glass-panel">
        <h2 className="text-lg font-bold" style={{ color: 'var(--primary)' }}>Admin Portal</h2>
        <button className="menu-toggle" onClick={toggleMenu} aria-label="Toggle Menu">
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Navigation Overlay for Mobile */}
      {isMenuOpen && <div className="menu-overlay" onClick={() => setIsMenuOpen(false)} />}

      <div className="flex" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-gradient-start)' }}>
        {/* Sidebar / Mobile Menu */}
        <aside className={`admin-sidebar glass-panel ${isMenuOpen ? 'open' : ''}`}>
          <div className="sidebar-brand">
            <h2 className="text-xl font-bold" style={{ color: 'var(--primary)' }}>Admin Portal</h2>
          </div>
          
          <nav className="sidebar-nav">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link 
                  key={link.href} 
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                >
                  <span className="nav-icon">{link.icon}</span>
                  <span className="nav-label">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="sidebar-footer">
            <form action={logoutAction}>
              <button type="submit" className="btn-logout">
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </form>
          </div>
        </aside>

        {/* Main Content */}
        <main className="admin-main">
          <div className="admin-content-wrapper">
            {children}
          </div>
        </main>
      </div>

      <style jsx>{`
        .admin-layout-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        .mobile-header {
          display: none;
          padding: 1rem 1.5rem;
          justify-content: space-between;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 100;
          border-radius: 0;
          border-left: none;
          border-right: none;
          border-top: none;
        }

        .menu-toggle {
          background: transparent;
          border: none;
          color: var(--primary);
          cursor: pointer;
        }

        .admin-sidebar {
          width: 280px;
          min-width: 280px;
          height: 100vh;
          position: sticky;
          top: 0;
          display: flex;
          flex-direction: column;
          border-radius: 0;
          border-left: none;
          border-top: none;
          border-bottom: none;
          padding: 2rem 1rem;
          background: #ffffff;
          transition: transform 0.3s ease;
          z-index: 90;
        }

        .sidebar-brand {
          margin-bottom: 2.5rem;
          padding: 0 1rem;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.85rem 1.25rem;
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          transition: all 0.2s ease;
          text-decoration: none;
          font-weight: 500;
        }

        .nav-item:hover {
          background: var(--primary-light);
          color: var(--primary);
        }

        .nav-item.active {
          background: var(--primary);
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .nav-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sidebar-footer {
          margin-top: auto;
          padding: 1rem;
          border-top: 1px solid var(--border-color);
        }

        .btn-logout {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 0.85rem;
          border-radius: var(--radius-md);
          background: transparent;
          border: 1px solid var(--error-color);
          color: var(--error-color);
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 600;
        }

        .btn-logout:hover {
          background: var(--error-color);
          color: #ffffff;
        }

        .admin-main {
          flex: 1;
          padding: 2.5rem;
          width: 100%;
          overflow-x: hidden;
        }

        .admin-content-wrapper {
          max-width: 1200px;
          margin: 0 auto;
        }

        @media (max-width: 1024px) {
          .mobile-header {
            display: flex;
          }

          .admin-sidebar {
            position: fixed;
            left: 0;
            top: 0;
            transform: translateX(-100%);
            height: 100vh;
            box-shadow: 20px 0 50px rgba(0,0,0,0.1);
          }

          .admin-sidebar.open {
            transform: translateX(0);
          }

          .menu-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.3);
            backdrop-filter: blur(4px);
            z-index: 85;
          }

          .admin-main {
            padding: 1.5rem 1rem;
          }
        }
      `}</style>
    </div>
  );
}
