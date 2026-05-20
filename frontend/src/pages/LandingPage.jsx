import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

// ── Data ──────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: 'Home',     href: '#home' },
  { label: 'About',    href: '#about' },
  { label: 'Services', href: '#services' },
  { label: 'HRMS',     href: '#features' },
  { label: 'Contact',  href: '#contact' },
];

const COMPANY_SERVICES = [
  {
    id: 'infra',
    title: 'IT Infrastructure Management',
    description:
      'End-to-end monitoring, optimization, and support for networks, servers, cloud environments, storage, and secure digital operations.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    ),
  },
  {
    id: 'support',
    title: 'End-User Support',
    description:
      'Reliable assistance across desktops, laptops, mobile devices, and workplace systems so teams stay productive and connected.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      </svg>
    ),
  },
  {
    id: 'itsm',
    title: 'IT Service Management',
    description:
      'Structured incident handling, change enablement, automation, and continuous improvement aligned with business goals.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Zm.75-12h9v9h-9v-9Z" />
      </svg>
    ),
  },
  {
    id: 'consult',
    title: 'Strategic IT Consulting',
    description:
      'Technology roadmaps, digital transformation guidance, resource planning, and practical solutions for sustainable growth.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
      </svg>
    ),
  },
];

const HRMS_FEATURES = [
  {
    id: 'emp',
    title: 'Employee Management',
    description:
      'Maintain employee records, departments, roles, documents, joining details, and workforce visibility in one secure system.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
      </svg>
    ),
  },
  {
    id: 'leave',
    title: 'Leave Tracking',
    description:
      'Streamline leave requests, approvals, balances, holidays, and manager review workflows with clear status tracking.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
      </svg>
    ),
  },
  {
    id: 'payroll',
    title: 'Payroll System',
    description:
      'Organize salary details, slips, reports, and payroll records with controlled access for admins and HR teams.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
      </svg>
    ),
  },
  {
    id: 'perf',
    title: 'Performance Monitoring',
    description:
      'Track announcements, reports, visitor activity, productivity signals, and operational metrics for better decisions.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
  },
];

const REGIONS = [
  { flag: '🇮🇳', name: 'India',                sub: 'Headquarters · Technology hub', badge: 'Active',  type: 'active'  },
  { flag: '🇦🇪', name: 'United Arab Emirates', sub: 'Middle East operations',        badge: 'Active',  type: 'active'  },
  { flag: '🇨🇩', name: 'DR Congo',             sub: 'Africa expansion',              badge: 'Growing', type: 'growing' },
];

const DASH_CARDS = [
  {
    id: 'emp',
    label: 'Employees',
    value: 'Active Records',
    status: 'Synced',
    primary: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
      </svg>
    ),
  },
  {
    id: 'leave',
    label: 'Leave Flow',
    value: 'Approval Ready',
    status: 'Active',
    primary: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
      </svg>
    ),
  },
  {
    id: 'pay',
    label: 'Payroll',
    value: 'Secure Access',
    status: 'Protected',
    primary: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
      </svg>
    ),
  },
  {
    id: 'rep',
    label: 'Reports',
    value: 'Live Insights',
    status: 'Updated',
    primary: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
  },
];

// ── Sub-components ─────────────────────────────────────────────────────────────

function ElogixaLogo({ dark = false }) {
  return (
    <Link to="/" className={`lp-logo${dark ? ' lp-logo--dark' : ''}`} aria-label="ELOGIXA home">
      <span className="lp-logo__wordmark">
        EL
        <span className="lp-logo__o-wrap">
          O<span className="lp-logo__o-dot" />
        </span>
        G
        <span className="lp-logo__accent">
          IX
          <span className="lp-logo__a-wrap">
            A
            <span className="lp-logo__mark" aria-hidden="true">
              <span className="lp-logo__tri lp-logo__tri--dark" />
              <span className="lp-logo__tri lp-logo__tri--orange" />
              <span className="lp-logo__tri lp-logo__tri--green" />
            </span>
          </span>
        </span>
      </span>
    </Link>
  );
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  );
}

// ── Custom hook: scroll reveal (UPWARD — rise from below) ─────────────────────
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.lp-reveal');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('lp-reveal--visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useReveal();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeMenu = () => {
    setMenuOpen(false);
    document.body.style.overflow = '';
  };

  const openMenu = () => {
    setMenuOpen(true);
    document.body.style.overflow = 'hidden';
  };

  useEffect(() => () => { document.body.style.overflow = ''; }, []);

  return (
    <div className="lp">
      {/* ── HEADER ── */}
      <header className={`lp-header${scrolled ? ' lp-header--scrolled' : ''}`}>
        <nav className="lp-nav lp-container" aria-label="Primary navigation">
          <ElogixaLogo />

          <ul className="lp-nav__links" role="list">
            {NAV_ITEMS.map((item) => (
              <li key={item.label}>
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
            <li>
              <Link to="/login" className="lp-nav__login">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                </svg>
                Login
              </Link>
            </li>
          </ul>

          <button
            className="lp-hamburger"
            onClick={openMenu}
            aria-label="Open menu"
            aria-expanded={menuOpen}
          >
            <span /><span /><span />
          </button>
        </nav>
      </header>

      {/* ── MOBILE MENU ── */}
      {menuOpen && (
        <div
          className="lp-mobile-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          onClick={(e) => { if (e.target === e.currentTarget) closeMenu(); }}
        >
          <div className="lp-mobile-panel">
            <button className="lp-mobile-close" onClick={closeMenu} aria-label="Close menu">
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
            {NAV_ITEMS.map((item) => (
              <a key={item.label} href={item.href} className="lp-mobile-link" onClick={closeMenu}>{item.label}</a>
            ))}
            <Link to="/login" className="lp-mobile-login" onClick={closeMenu}>
              Login to HRMS →
            </Link>
          </div>
        </div>
      )}

      {/* ══════════════ HERO ══════════════ */}
      <section className="lp-hero" id="home">
        {/* Animated background orbs */}
        <div className="lp-hero__orb lp-hero__orb--1" aria-hidden="true" />
        <div className="lp-hero__orb lp-hero__orb--2" aria-hidden="true" />
        <div className="lp-hero__orb lp-hero__orb--3" aria-hidden="true" />
        {/* Subtle grid overlay */}
        <div className="lp-hero__grid-bg" aria-hidden="true" />

        <div className="lp-container lp-hero__grid">

          {/* Copy */}
          <div className="lp-hero__copy">
            <span className="lp-tag lp-rise lp-rise--d0">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
              Enterprise HRMS Platform
            </span>

            {/* HRNova — clipped word reveal, rising up */}
            <h1 className="lp-rise lp-rise--d1">
              <span className="lp-hero__title-line">
                <span className="lp-hero__title-word lp-word-rise lp-word-rise--d0">HRNova</span>
              </span>
            </h1>

            <p className="lp-rise lp-rise--d2">
              A secure, enterprise-grade HRMS gateway for managing employees, attendance, leave, payroll, and workforce analytics — powered by ELOGIXA's IT excellence.
            </p>

            <div className="lp-hero__actions lp-rise lp-rise--d3">
              <Link to="/login" className="lp-btn lp-btn--primary">
                Login to HRMS <ArrowRightIcon />
              </Link>
              <a href="#services" className="lp-btn lp-btn--secondary">
                Explore Services <ChevronRightIcon />
              </a>
            </div>

            <div className="lp-hero__trust lp-rise lp-rise--d4">
              {[
                'JWT Secured',
                'Role-Based Access',
                '24/7 Operations',
              ].map((label, i) => (
                <div key={label} className="lp-hero__trust-row">
                  {i > 0 && <span className="lp-trust-divider" />}
                  <span className="lp-trust-badge">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard Panel */}
          <div className="lp-hero__panel lp-rise lp-rise--d2">
            {/* Shine sweep */}
            <div className="lp-panel__shine" aria-hidden="true" />

            <div className="lp-panel__header">
              <div className="lp-panel__header-left">
                Workforce Command Center
                <span>Real-time operations dashboard</span>
              </div>
              <div className="lp-panel__live">
                <span className="lp-panel__dot" />
                Live
              </div>
            </div>

            <div className="lp-dash-grid">
              {DASH_CARDS.map((card, i) => (
                <div
                  key={card.id}
                  className={`lp-dash-card${card.primary ? ' lp-dash-card--primary' : ''} lp-card-pop lp-card-pop--d${i}`}
                >
                  <div className="lp-dash-card__icon">{card.icon}</div>
                  <div className="lp-dash-card__label">{card.label}</div>
                  <div className="lp-dash-card__value">{card.value}</div>
                  <div className="lp-dash-card__status">
                    <CheckIcon /> {card.status}
                  </div>
                </div>
              ))}
            </div>

            <div className="lp-panel__stats">
              {[
                { value: '24/7', label: 'Operational support' },
                { value: '3+',   label: 'Global regions' },
                { value: '100%', label: 'Role-based access' },
              ].map((s, i) => (
                <div key={s.label} className="lp-panel__stats-row">
                  {i > 0 && <span className="lp-panel__stat-div" />}
                  <div className="lp-panel__stat">
                    <strong>{s.value}</strong>
                    <span>{s.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="lp-hero__scroll" aria-hidden="true">
          <span className="lp-scroll-line" />
        </div>
      </section>

      {/* ══════════════ ABOUT ══════════════ */}
      <section className="lp-section lp-about" id="about">
        <div className="lp-container lp-about__grid">

          <div className="lp-about__copy">
            <span className="lp-tag lp-reveal">About ELOGIXA</span>
            <h2 className="lp-reveal lp-reveal--d1">
              Innovating your future,<br />empowering your growth.
            </h2>
            <p className="lp-reveal lp-reveal--d2">
              ELOGIXA is a technology partner focused on IT infrastructure, managed services, security, and digital transformation. The HRMS experience extends that same principle into workforce operations — precise, adaptable, secure, and easy for teams to use across global regions.
            </p>

            <div className="lp-about__pillars">
              {[
                {
                  title: 'Mission',
                  text: 'Deliver reliable technology and HR operations that reduce manual work, improve accountability, and support sustainable growth.',
                  delay: 'd2',
                },
                {
                  title: 'Vision',
                  text: 'Build connected workplaces where people, systems, data, and decisions move together with confidence and clarity.',
                  delay: 'd3',
                },
              ].map((p) => (
                <div key={p.title} className={`lp-pillar lp-reveal lp-reveal--${p.delay}`}>
                  <div className="lp-pillar__icon">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                    </svg>
                  </div>
                  <h4>{p.title}</h4>
                  <p>{p.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lp-about__visual lp-reveal lp-reveal--d2">
            <div className="lp-about__card">
              <p className="lp-about__presence-title">Global Service Presence</p>
              <div className="lp-regions">
                {REGIONS.map((r, i) => (
                  <div key={r.name} className={`lp-region lp-reveal lp-reveal--d${i}`}>
                    <span className="lp-region__flag">{r.flag}</span>
                    <div className="lp-region__info">
                      <h5>{r.name}</h5>
                      <span>{r.sub}</span>
                    </div>
                    <span className={`lp-region__badge lp-region__badge--${r.type}`}>{r.badge}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="lp-about__metric">
              <strong>3+</strong>
              <span>Regions Served</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ SERVICES ══════════════ */}
      <section className="lp-section lp-services" id="services">
        <div className="lp-container">
          <div className="lp-section-head">
            <span className="lp-tag lp-reveal">Company Services</span>
            <h2 className="lp-reveal lp-reveal--d1">Enterprise IT capabilities<br />behind the platform</h2>
            <p className="lp-reveal lp-reveal--d2">
              ELOGIXA's core service areas power the digital workplace for employees, HR, managers, and admins — combining infrastructure expertise with human-centered design.
            </p>
          </div>
          <div className="lp-card-grid">
            {COMPANY_SERVICES.map((s, i) => (
              <article key={s.id} className={`lp-service-card lp-reveal lp-reveal--d${i}`}>
                <div className="lp-service-card__icon">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ HRMS FEATURES ══════════════ */}
      <section className="lp-section lp-features" id="features">
        <div className="lp-container">
          <div className="lp-section-head">
            <span className="lp-tag lp-reveal">HRMS Features</span>
            <h2 className="lp-reveal lp-reveal--d1">Everything needed to run daily workforce operations</h2>
          </div>
          <div className="lp-card-grid">
            {HRMS_FEATURES.map((f, i) => (
              <article key={f.id} className={`lp-feature-card lp-reveal lp-reveal--d${i}`}>
                <div className="lp-feature-card__icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ CTA ══════════════ */}
      <section className="lp-cta">
        <div className="lp-container lp-cta__inner lp-reveal">
          <div className="lp-cta__copy">
            <div className="lp-cta__tag">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" width="13" height="13">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
              Secure Authentication Gateway
            </div>
            <h2>Manage your workforce efficiently</h2>
            <p>
              Enter the HRMS with JWT-based authentication, role-aware access, loading feedback, and clear login error handling — designed for enterprise-grade reliability.
            </p>
          </div>
          <Link to="/login" className="lp-btn lp-btn--cta">
            Get Started <ArrowRightIcon />
          </Link>
        </div>
      </section>

      {/* ══════════════ FOOTER ══════════════ */}
      <footer className="lp-footer" id="contact">
        <div className="lp-container lp-footer__grid">

          <div className="lp-footer__brand">
            <ElogixaLogo dark />
            <p>Your trusted IT partner for infrastructure, managed services, consulting, and secure workforce management across global regions.</p>
            <div className="lp-footer__socials">
              {[
                {
                  label: 'Instagram',
                  href: 'https://www.instagram.com/',
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                  ),
                },
                {
                  label: 'Facebook',
                  href: 'https://www.facebook.com/',
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                    </svg>
                  ),
                },
                {
                  label: 'LinkedIn',
                  href: 'https://www.linkedin.com/',
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" />
                    </svg>
                  ),
                },
              ].map((s) => (
                <a key={s.label} href={s.href} aria-label={s.label} target="_blank" rel="noopener noreferrer">
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          <div className="lp-footer__col">
            <h4>Contact</h4>
            <a href="tel:+918123175247">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
              </svg>
              +91 8123 175 247
            </a>
            <a href="mailto:info@elogixa.co.in">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
              info@elogixa.co.in
            </a>
            <span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
              India | UAE | DR Congo
            </span>
          </div>

          <div className="lp-footer__col">
            <h4>Platform</h4>
            <a href="#features">Employee Records</a>
            <a href="#features">Leave Management</a>
            <a href="#features">Payroll</a>
            <a href="#features">Analytics</a>
          </div>

          <div className="lp-footer__col">
            <h4>Company</h4>
            <a href="#about">About Us</a>
            <a href="#services">Services</a>
            <a href="#contact">Contact</a>
            <Link to="/login">Login</Link>
          </div>
        </div>

        <div className="lp-footer__bottom">
          <div className="lp-container lp-footer__bottom-inner">
            <span>© 2026 ELOGIXA. All rights reserved.</span>
            <span className="lp-footer__tagline">Collaborate · Innovate · Transform</span>
          </div>
        </div>
      </footer>
    </div>
  );
}