import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { PublicNavbar } from './PublicNavbar.jsx';
import { PublicFooter } from './PublicFooter.jsx';

export function PublicLayout() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const location = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Track window scroll progress for top indicator
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (windowHeight > 0) {
        const scroll = (totalScroll / windowHeight) * 100;
        setScrollProgress(scroll);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative' }}>
      {/* Fixed Viewport Subtle Blue Frame */}
      <div className="viewport-frame" aria-hidden="true" />

      {/* Top Subtle Scroll Progress Indicator */}
      <div
        className="scroll-progress-bar"
        style={{ width: `${scrollProgress}%` }}
        aria-hidden="true"
      />

      <PublicNavbar />

      <main
        key={location.pathname}
        className="anim-fade-in"
        style={{ flex: 1, paddingTop: '56px' }}
      >
        <Outlet />
      </main>

      <PublicFooter />
    </div>
  );
}
