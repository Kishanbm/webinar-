'use client';

import './public.css';
import Link from 'next/link';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <nav className="navbar" id="navbar">
        <a href="https://webclass.navigationtrading.com/home" className="nav-logo">
          {/* I am using text here or an image if available on the static site */}
          <span style={{color: 'white', fontWeight: 800, fontSize: '24px'}}>NavigationTrading</span>
        </a>
        <ul className="nav-links">
          <li className="nav-item-dropdown">
            <a href="https://webclass.navigationtrading.com/home">Home</a>
          </li>
          <li><a href="https://webclass.navigationtrading.com/performance">Performance</a></li>
          <li><a href="https://webclass.navigationtrading.com/pricing">Pricing</a></li>
          <li className="nav-item-dropdown">
            <a href="#">Services <span className="nav-chevron">▾</span></a>
            <div className="dropdown-menu">
              <a href="https://webclass.navigationtrading.com/free-membership">Free Membership</a>
              <a href="https://webclass.navigationtrading.com/day-trading-membership">Day Trade Membership</a>
              <a href="https://webclass.navigationtrading.com/paid-membership">Pro Membership</a>
            </div>
          </li>
          <li><a href="https://webclass.navigationtrading.com/podcast">Podcast</a></li>
          <li><Link href="/blogs" className="active">Blog</Link></li>
          <li><a href="https://webclass.navigationtrading.com/contact">Contact Us</a></li>
        </ul>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <a href="https://whop.com/orders/products/" style={{ color: '#fff', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>Login</a>
            <a href="https://whop.com/navigationtrading/" className="nav-cta">Join Now</a>
        </div>
      </nav>

      {children}

      <footer>
        <div className="footer-top">
          <div>
            <div className="footer-brand"><span style={{color: 'white', fontWeight: 800, fontSize: '24px'}}>NavigationTrading</span></div>
            <div className="footer-tagline">Institutional Grade Trading Education</div>
          </div>
          <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: '12px' }}>Contact</div>
              <a href="mailto:support@navigationtrading.com" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', textDecoration: 'none' }}>support@navigationtrading.com</a>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: '12px' }}>Legal</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <a href="https://navigationtrading.com/legal-disclaimers/" target="_blank" className="footer-link">Risk Disclosure</a>
                <a href="https://navigationtrading.com/legal-disclaimers/" target="_blank" className="footer-link">Privacy Policy</a>
                <a href="https://navigationtrading.com/legal-disclaimers/" target="_blank" className="footer-link">Terms</a>
              </div>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '12px' }}>
            <div className="footer-copy">&copy; 2026 Navigation Financial, LLC</div>
          </div>
          <div className="footer-copy">
            The risk of loss in trading securities, options, stocks, futures and forex can be substantial. Securities involve risk and are not suitable for all investors.
          </div>
        </div>
      </footer>
    </>
  );
}
