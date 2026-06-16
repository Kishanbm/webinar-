'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Settings, LogOut, Plus } from 'lucide-react';
import '../globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <html lang="en">
      <body>
        <div className="admin-layout">
          {/* Sidebar */}
          <aside className="sidebar">
            <div className="sidebar-logo">
              NavigationTrading
            </div>
            
            <ul className="nav-menu">
              <li>
                <Link href="/" className={`nav-item ${isActive('/') ? 'active' : ''}`}>
                  <LayoutDashboard size={20} />
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/posts/new" className={`nav-item ${isActive('/posts/new') ? 'active' : ''}`}>
                  <Plus size={20} />
                  New Post
                </Link>
              </li>
              <li>
                <Link href="/settings" className={`nav-item ${isActive('/settings') ? 'active' : ''}`}>
                  <Settings size={20} />
                  Settings
                </Link>
              </li>
            </ul>

            <div style={{ marginTop: 'auto' }}>
              <ul className="nav-menu">
                <li>
                  <a href="#" className="nav-item" style={{ color: '#ef4444' }}>
                    <LogOut size={20} />
                    Logout
                  </a>
                </li>
              </ul>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="main-content">
            <header className="topbar">
              <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                Blog Management System
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>Admin User</span>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--accent-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  A
                </div>
              </div>
            </header>
            
            <div className="page-container">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
