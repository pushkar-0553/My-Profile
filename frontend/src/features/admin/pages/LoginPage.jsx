import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  KeyRound,
  Shield,
  Fingerprint,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { browserSupportsWebAuthn, startAuthentication, startRegistration } from '@simplewebauthn/browser';
import { apiRequest } from '../../../common/utils/api.js';
import { useAuth } from '../../../common/hooks/useAuth.jsx';

export function LoginPage() {
  const navigate = useNavigate();
  const { loginSuccess, isAuthenticated, loading: authLoading } = useAuth();

  // Mode: 'login' | 'setup' | 'recovery'
  const [mode, setMode] = useState('login');
  const [status, setStatus] = useState('idle'); // 'idle' | 'authenticating' | 'success' | 'failed' | 'unsupported'
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Setup / Recovery states
  const [setupData, setSetupData] = useState(null); // { isConfigured: boolean, adminEmail: string }
  const [deviceName, setDeviceName] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [confirmedCodesSaved, setConfirmedCodesSaved] = useState(false);

  // Recovery Code input
  const [inputRecoveryCode, setInputRecoveryCode] = useState('');
  const [isVerifyingRecovery, setIsVerifyingRecovery] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Check WebAuthn support and CMS passkey setup status on mount
  useEffect(() => {
    const isSupported = browserSupportsWebAuthn();
    if (!isSupported) {
      setStatus('unsupported');
      setStatusMessage('Passkeys / WebAuthn are not supported by this browser. Please use a modern browser (Chrome, Edge, Safari, Firefox) on a supported device.');
      return;
    }

    async function checkSetup() {
      try {
        const res = await apiRequest('/admin/auth/setup-status');
        setSetupData(res);
        if (!res.isConfigured) {
          setMode('setup');
        } else {
          setMode('login');
        }
      } catch (err) {
        console.error('Failed to query setup status:', err);
      }
    }

    checkSetup();
  }, []);

  // 1. Passkey Login Handler
  const handlePasskeyLogin = async () => {
    setStatus('authenticating');
    setStatusMessage('Waiting for device authentication (Fingerprint, Face ID, Windows Hello, or PIN)...');
    setErrorMessage('');

    try {
      // Step A: Get WebAuthn assertion challenge options
      const options = await apiRequest('/admin/auth/passkey/login/options', { method: 'POST' });

      // Step B: Prompt browser native WebAuthn dialog
      let assertionResponse;
      try {
        assertionResponse = await startAuthentication({ optionsJSON: options });
      } catch (clientErr) {
        if (clientErr.name === 'NotAllowedError') {
          setStatus('failed');
          setErrorMessage('Authentication was cancelled or timed out. Please try again.');
          return;
        }
        throw clientErr;
      }

      // Step C: Verify assertion cryptographically on backend
      const result = await apiRequest('/admin/auth/passkey/login/verify', {
        method: 'POST',
        body: JSON.stringify({ response: assertionResponse })
      });

      setStatus('success');
      setStatusMessage('Passkey verified successfully! Redirecting to CMS...');
      loginSuccess(result.user);

      setTimeout(() => {
        navigate('/admin');
      }, 700);
    } catch (err) {
      setStatus('failed');
      setErrorMessage(err.message || 'Authentication failed. Please verify your passkey device.');
    }
  };

  // 2. Initial Admin Passkey Setup Handler
  const handlePasskeyRegister = async (e) => {
    if (e) e.preventDefault();
    setStatus('authenticating');
    setStatusMessage('Waiting for device authentication to register your initial passkey...');
    setErrorMessage('');

    try {
      // Step A: Request registration options
      const options = await apiRequest('/admin/auth/passkey/register/options', { method: 'POST' });

      // Step B: Trigger native OS WebAuthn credential creation
      let registrationResponse;
      try {
        registrationResponse = await startRegistration({ optionsJSON: options });
      } catch (clientErr) {
        if (clientErr.name === 'NotAllowedError') {
          setStatus('failed');
          setErrorMessage('Passkey creation was cancelled. Please try again.');
          return;
        }
        throw clientErr;
      }

      // Step C: Verify registration on backend
      const label = deviceName.trim() || 'Primary Admin Device';
      const result = await apiRequest('/admin/auth/passkey/register/verify', {
        method: 'POST',
        body: JSON.stringify({ response: registrationResponse, deviceName: label })
      });

      loginSuccess(result.user);

      // If initial recovery codes were returned, require user to review & save them
      if (result.recoveryCodes && result.recoveryCodes.length > 0) {
        setRecoveryCodes(result.recoveryCodes);
        setStatus('idle');
      } else {
        setStatus('success');
        setStatusMessage('Passkey registered successfully! Redirecting...');
        setTimeout(() => navigate('/admin'), 700);
      }
    } catch (err) {
      setStatus('failed');
      setErrorMessage(err.message || 'Failed to register passkey.');
    }
  };

  // 3. Emergency Recovery Code Verification Handler
  const handleVerifyRecovery = async (e) => {
    e.preventDefault();
    if (!inputRecoveryCode.trim()) return;

    setIsVerifyingRecovery(true);
    setErrorMessage('');

    try {
      const result = await apiRequest('/admin/auth/recovery-codes/verify', {
        method: 'POST',
        body: JSON.stringify({ code: inputRecoveryCode.trim() })
      });

      setStatus('success');
      setStatusMessage('Recovery code verified! Session created.');
      loginSuccess(result.user);

      setTimeout(() => {
        navigate('/admin');
      }, 700);
    } catch (err) {
      setErrorMessage(err.message || 'Invalid or already used recovery code.');
    } finally {
      setIsVerifyingRecovery(false);
    }
  };

  const copyAllRecoveryCodes = () => {
    const text = recoveryCodes.join('\n');
    navigator.clipboard.writeText(text);
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2500);
  };

  // Render Recovery Codes Save Screen (After initial passkey registration)
  if (recoveryCodes.length > 0) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        backgroundColor: 'var(--bg-primary)'
      }}>
        <div className="card" style={{ maxWidth: 540, width: '100%', padding: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(234, 179, 8, 0.15)',
              color: 'var(--warning)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldAlert size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Save Emergency Recovery Codes</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Store these in a safe location. They will only be displayed once.</p>
            </div>
          </div>

          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
            Because this CMS is <strong>strictly passwordless</strong>, these one-time codes are your emergency key if your passkey device is ever lost or replaced.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.6rem',
            padding: '1.25rem',
            backgroundColor: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            fontFamily: 'monospace',
            fontSize: '0.95rem',
            fontWeight: 700,
            marginBottom: '1.5rem',
            letterSpacing: '0.05em'
          }}>
            {recoveryCodes.map((code, idx) => (
              <div key={idx} style={{ color: 'var(--accent-primary)', padding: '0.25rem 0' }}>
                {code}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <button
              type="button"
              onClick={copyAllRecoveryCodes}
              className="btn btn-secondary"
              style={{ flex: 1, gap: '0.5rem', justifyContent: 'center' }}
            >
              {copiedCodes ? <Check size={16} color="var(--success)" /> : <Copy size={16} />}
              {copiedCodes ? 'Copied to Clipboard!' : 'Copy All Codes'}
            </button>
          </div>

          <label style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            cursor: 'pointer',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            marginBottom: '1.75rem'
          }}>
            <input
              type="checkbox"
              checked={confirmedCodesSaved}
              onChange={(e) => setConfirmedCodesSaved(e.target.checked)}
              style={{ marginTop: '0.2rem', accentColor: 'var(--accent-primary)' }}
            />
            <span>I have copied or safely stored these emergency recovery codes in my password manager or offline vault.</span>
          </label>

          <button
            type="button"
            disabled={!confirmedCodesSaved}
            onClick={() => navigate('/admin')}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '0.85rem' }}
          >
            Enter Admin Dashboard <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.5rem',
      backgroundColor: 'var(--bg-primary)',
      position: 'relative'
    }}>
      {/* Subtle ambient background aura */}
      <div style={{
        position: 'absolute',
        top: '25%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 380,
        height: 380,
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div className="card" style={{
        maxWidth: 440,
        width: '100%',
        padding: '2.75rem 2.25rem',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1,
        boxShadow: 'var(--shadow-lg)'
      }}>
        {/* Brand Icon */}
        <div style={{
          width: 58,
          height: 58,
          margin: '0 auto 1.5rem',
          borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-hover))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          boxShadow: '0 8px 24px -4px rgba(99, 102, 241, 0.4)'
        }}>
          <KeyRound size={28} />
        </div>

        <div style={{
          fontSize: '0.75rem',
          fontWeight: 800,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'var(--accent-primary)',
          marginBottom: '0.35rem'
        }}>
          Portfolio CMS
        </div>

        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, marginBottom: '0.6rem', letterSpacing: '-0.02em' }}>
          {mode === 'setup'
            ? 'Admin Passkey Setup'
            : mode === 'recovery'
            ? 'Emergency Recovery'
            : 'Welcome Back'}
        </h1>

        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: 1.5 }}>
          {mode === 'setup'
            ? 'Register this device using your native fingerprint, Face ID, Windows Hello, or PIN to initialize CMS access.'
            : mode === 'recovery'
            ? 'Enter one of your 12-character emergency recovery codes to restore administrative access.'
            : 'Authenticate securely using your device passkey. No password required.'}
        </p>

        {/* Browser Unsupported Warning */}
        {status === 'unsupported' && (
          <div style={{
            padding: '1rem',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--danger)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--danger)',
            fontSize: '0.85rem',
            textAlign: 'left',
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'flex-start',
            marginBottom: '1.5rem'
          }}>
            <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
            <div>
              <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>Passkeys Not Supported</div>
              <div>{statusMessage}</div>
            </div>
          </div>
        )}

        {/* Error notification */}
        {errorMessage && (
          <div style={{
            padding: '0.85rem 1rem',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--danger)',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            marginBottom: '1.5rem',
            textAlign: 'left'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success / In-progress notification */}
        {status === 'authenticating' && (
          <div style={{
            padding: '0.85rem 1rem',
            backgroundColor: 'var(--accent-subtle)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--accent-primary)',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            marginBottom: '1.5rem',
            textAlign: 'left'
          }}>
            <RefreshCw size={18} className="animate-spin" style={{ flexShrink: 0 }} />
            <span>{statusMessage}</span>
          </div>
        )}

        {status === 'success' && (
          <div style={{
            padding: '0.85rem 1rem',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--success)',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            marginBottom: '1.5rem',
            textAlign: 'left'
          }}>
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* MODE 1: Standard Passkey Login */}
        {mode === 'login' && status !== 'unsupported' && (
          <div>
            <button
              type="button"
              onClick={handlePasskeyLogin}
              disabled={status === 'authenticating'}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.95rem 1.25rem',
                fontSize: '1rem',
                fontWeight: 700,
                justifyContent: 'center',
                gap: '0.65rem',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 4px 16px -2px rgba(99, 102, 241, 0.35)',
                marginBottom: '1.5rem'
              }}
            >
              <Fingerprint size={22} />
              <span>{status === 'authenticating' ? 'Authenticating...' : 'Sign in with Passkey'}</span>
            </button>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.75rem' }}>
              Supports Windows Hello, Touch ID, Face ID, Android biometrics, & security keys.
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
              <button
                type="button"
                onClick={() => {
                  setMode('recovery');
                  setErrorMessage('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Lost your passkey device? Use a recovery code
              </button>
            </div>
          </div>
        )}

        {/* MODE 2: First-Time Setup */}
        {mode === 'setup' && status !== 'unsupported' && (
          <form onSubmit={handlePasskeyRegister}>
            <div style={{ marginBottom: '1.25rem', textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                Device Label (Optional)
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g. My Laptop, Work PC, Phone"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                disabled={status === 'authenticating'}
              />
            </div>

            <button
              type="submit"
              disabled={status === 'authenticating'}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.95rem 1.25rem',
                fontSize: '1rem',
                fontWeight: 700,
                justifyContent: 'center',
                gap: '0.65rem',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 4px 16px -2px rgba(99, 102, 241, 0.35)'
              }}
            >
              <Fingerprint size={22} />
              <span>{status === 'authenticating' ? 'Waiting for Device...' : 'Register Device Passkey'}</span>
            </button>
          </form>
        )}

        {/* MODE 3: Emergency Recovery Code Verification */}
        {mode === 'recovery' && (
          <form onSubmit={handleVerifyRecovery}>
            <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                One-Time Recovery Code
              </label>
              <input
                type="text"
                className="input"
                placeholder="XXXX-XXXX-XXXX"
                value={inputRecoveryCode}
                onChange={(e) => setInputRecoveryCode(e.target.value.toUpperCase())}
                autoFocus
                required
                style={{ fontFamily: 'monospace', letterSpacing: '0.1em', fontSize: '1.05rem', textAlign: 'center' }}
              />
            </div>

            <button
              type="submit"
              disabled={isVerifyingRecovery || !inputRecoveryCode.trim()}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.85rem',
                fontWeight: 700,
                justifyContent: 'center',
                marginBottom: '1.25rem'
              }}
            >
              {isVerifyingRecovery ? 'Verifying Code...' : 'Verify Recovery Code & Enter'}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-primary)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              ← Back to Passkey Sign-in
            </button>
          </form>
        )}

        {/* Back to public site */}
        <div style={{ marginTop: '2.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
          <a
            href="/"
            style={{
              fontSize: '0.825rem',
              color: 'var(--text-muted)',
              textDecoration: 'none',
              fontWeight: 500
            }}
          >
            ← Return to Public Portfolio
          </a>
        </div>
      </div>
    </div>
  );
}
