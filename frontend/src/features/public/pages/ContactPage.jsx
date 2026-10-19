import React, { useState } from 'react';
import { Mail, Phone, Linkedin, Github, Send, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '../../../common/utils/api.js';

export function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      await apiRequest('/public/contact', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setSuccess(true);
      setFormData({ name: '', email: '', message: '' });
    } catch (err) {
      setError(err.message || 'Failed to dispatch message. Please try again or email directly.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="section" style={{ paddingTop: '3.5rem', paddingBottom: '6rem' }}>
      <div className="container" style={{ maxWidth: '880px' }}>
        {/* Header */}
        <div style={{ marginBottom: '3rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-primary)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '0.5rem' }}>
            Get In Touch
          </div>
          <h1
            style={{
              fontSize: 'clamp(2.4rem, 5vw, 3.5rem)',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.035em',
              marginBottom: '0.75rem',
              color: 'var(--text-primary)'
            }}
          >
            CONTACT
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Have a role, project, or technical question? Reach out through direct channels or send a message.
          </p>
        </div>

        {/* 2-Column: Direct Channels + Message Form */}
        <div className="contact-layout">
          {/* Direct Channels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Email */}
            <a
              href="mailto:kagithapushkara@gmail.com"
              className="card card-hover"
              style={{
                padding: '1.25rem 1.5rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                textDecoration: 'none'
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--accent-soft)',
                  color: 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Mail size={18} />
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  EMAIL
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  kagithapushkara@gmail.com
                </div>
              </div>
            </a>

            {/* Phone */}
            <a
              href="tel:+917842770553"
              className="card card-hover"
              style={{
                padding: '1.25rem 1.5rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                textDecoration: 'none'
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--accent-soft)',
                  color: 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Phone size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  PHONE
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  +91 7842770553
                </div>
              </div>
            </a>

            <a
              href="https://www.linkedin.com/in/pushkara-sai-vardhan-kagitha-2345b5283"
              target="_blank"
              rel="noopener noreferrer"
              className="card card-hover"
              style={{
                padding: '1.25rem 1.5rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                textDecoration: 'none'
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--accent-soft)',
                  color: 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Linkedin size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  LINKEDIN
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Pushkara Sai Vardhan
                </div>
              </div>
            </a>

            <a
              href="https://github.com/pushkar-0553"
              target="_blank"
              rel="noopener noreferrer"
              className="card card-hover"
              style={{
                padding: '1.25rem 1.5rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                textDecoration: 'none'
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--accent-soft)',
                  color: 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Github size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  GITHUB
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  github.com/pushkar-0553
                </div>
              </div>
            </a>
          </div>

          {/* Message Form */}
          <div className="card" style={{ padding: '2rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
            {success ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <CheckCircle2 size={36} style={{ color: 'var(--success)', margin: '0 auto 0.75rem auto' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Message Sent
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                  Thank you — your note has been saved to the database.
                </p>
                <button onClick={() => setSuccess(false)} className="btn btn-secondary btn-sm">
                  Send another note
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {error && (
                  <div style={{ padding: '0.65rem 0.85rem', backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', fontSize: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                    {error}
                  </div>
                )}

                <div>
                  <label className="label" htmlFor="ct-name">NAME</label>
                  <input
                    id="ct-name"
                    type="text"
                    required
                    placeholder="Your name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label" htmlFor="ct-email">EMAIL</label>
                  <input
                    id="ct-email"
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label" htmlFor="ct-msg">MESSAGE</label>
                  <textarea
                    id="ct-msg"
                    required
                    rows={4}
                    placeholder="Your inquiry or opportunity..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="textarea"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ opacity: submitting ? 0.7 : 1, alignSelf: 'flex-start' }}
                >
                  {submitting ? 'Sending...' : 'Send Message'} <Send size={14} />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .contact-layout {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 2.5rem;
          align-items: start;
        }

        @media (max-width: 768px) {
          .contact-layout {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
        }
      `}</style>
    </div>
  );
}
