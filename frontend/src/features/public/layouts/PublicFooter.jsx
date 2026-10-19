import React from 'react';
import { Github, Linkedin, Mail, ArrowUp } from 'lucide-react';

export function PublicFooter() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer style={{
      borderTop: '1px solid var(--border-subtle)',
      backgroundColor: 'var(--bg-secondary)',
      padding: '1.75rem 0',
      marginTop: 'auto'
    }}>
      <div className="container" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.25rem',
        fontSize: '0.82rem',
        fontFamily: 'var(--font-mono)',
        color: 'var(--text-muted)'
      }}>
        {/* Left: Identity & Stack */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span>&copy; {new Date().getFullYear()} Pushkara Vardhan</span>
          <span style={{ color: 'var(--border-strong)' }}>/</span>
          <span style={{ color: 'var(--text-secondary)' }}>React · Node.js · TiDB</span>
        </div>

        {/* Center: Social Links */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <a
            href="https://github.com/pushkar-0553"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub Profile"
            style={{
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              transition: 'color var(--transition-fast)'
            }}
            className="footer-social-link"
          >
            <Github size={17} />
          </a>

          <a
            href="https://www.linkedin.com/in/pushkara-sai-vardhan-kagitha-2345b5283"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn Profile"
            style={{
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              transition: 'color var(--transition-fast)'
            }}
            className="footer-social-link"
          >
            <Linkedin size={17} />
          </a>

          <a
            href="mailto:kagithapushkara@gmail.com"
            aria-label="Send Email"
            style={{
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              transition: 'color var(--transition-fast)'
            }}
            className="footer-social-link"
          >
            <Mail size={17} />
          </a>
        </div>

        {/* Right: Back to top */}
        <button
          onClick={scrollToTop}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.78rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.25rem 0.5rem',
            borderRadius: 'var(--radius-sm)',
            transition: 'color var(--transition-fast)'
          }}
          className="footer-top-btn"
        >
          Top <ArrowUp size={13} />
        </button>
      </div>

      <style>{`
        .footer-social-link:hover {
          color: var(--accent-primary) !important;
        }
        .footer-top-btn:hover {
          color: var(--text-primary) !important;
        }
      `}</style>
    </footer>
  );
}
