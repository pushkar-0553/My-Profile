import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Shield,
  Smartphone,
  Laptop,
  Trash2,
  Edit2,
  Plus,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
  Clock,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { startRegistration } from '@simplewebauthn/browser';
import { apiRequest } from '../../../common/utils/api.js';

export function SecuritySettings() {
  const [passkeys, setPasskeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Add passkey modal / state
  const [isRegistering, setIsRegistering] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');

  // Rename state
  const [editingId, setEditingId] = useState(null);
  const [editLabel, setEditLabel] = useState('');

  // Recovery codes modal / state
  const [newRecoveryCodes, setNewRecoveryCodes] = useState(null);
  const [copied, setCopied] = useState(false);
  const [generatingCodes, setGeneratingCodes] = useState(false);

  // Load passkeys list
  const loadPasskeys = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/admin/auth/passkeys');
      setPasskeys(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load passkeys.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPasskeys();
  }, []);

  // Register an additional passkey
  const handleAddPasskey = async (e) => {
    e.preventDefault();
    setIsRegistering(true);
    setError('');
    setSuccessMsg('');

    try {
      // 1. Get registration options
      const options = await apiRequest('/admin/auth/passkey/register/options', { method: 'POST' });

      // 2. Prompt browser WebAuthn
      const registrationResponse = await startRegistration({ optionsJSON: options });

      // 3. Verify and store passkey
      const label = newDeviceName.trim() || 'New Admin Device';
      await apiRequest('/admin/auth/passkey/register/verify', {
        method: 'POST',
        body: JSON.stringify({ response: registrationResponse, deviceName: label })
      });

      setSuccessMsg('New passkey registered successfully!');
      setNewDeviceName('');
      await loadPasskeys();
    } catch (err) {
      if (err.name !== 'NotAllowedError') {
        setError(err.message || 'Failed to register new passkey.');
      }
    } finally {
      setIsRegistering(false);
    }
  };

  // Delete a passkey
  const handleDeletePasskey = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove the passkey "${name}"?`)) {
      return;
    }

    setError('');
    setSuccessMsg('');
    try {
      await apiRequest(`/admin/auth/passkeys/${id}`, { method: 'DELETE' });
      setSuccessMsg('Passkey removed successfully.');
      await loadPasskeys();
    } catch (err) {
      setError(err.message || 'Failed to remove passkey.');
    }
  };

  // Save renamed label
  const handleSaveRename = async (id) => {
    if (!editLabel.trim()) return;

    try {
      await apiRequest(`/admin/auth/passkeys/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ deviceName: editLabel.trim() })
      });
      setEditingId(null);
      await loadPasskeys();
    } catch (err) {
      setError(err.message || 'Failed to rename passkey.');
    }
  };

  // Regenerate recovery codes
  const handleRegenerateRecoveryCodes = async () => {
    if (!window.confirm('Generating new recovery codes will immediately invalidate any previous codes. Do you want to proceed?')) {
      return;
    }

    setGeneratingCodes(true);
    setError('');
    try {
      const res = await apiRequest('/admin/auth/recovery-codes', { method: 'POST' });
      setNewRecoveryCodes(res.recoveryCodes);
      setSuccessMsg('New emergency recovery codes generated.');
    } catch (err) {
      setError(err.message || 'Failed to generate recovery codes.');
    } finally {
      setGeneratingCodes(false);
    }
  };

  const copyCodes = () => {
    if (!newRecoveryCodes) return;
    navigator.clipboard.writeText(newRecoveryCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never';
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div style={{ maxWidth: 840 }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.4rem' }}>Security & Passkeys</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Manage your enrolled biometric passkeys, hardware security keys, and emergency recovery codes.
        </p>
      </div>

      {error && (
        <div style={{
          padding: '0.85rem 1rem',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid var(--danger)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--danger)',
          fontSize: '0.85rem',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'center'
        }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div style={{
          padding: '0.85rem 1rem',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid var(--success)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--success)',
          fontSize: '0.85rem',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'center'
        }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Section 1: Enrolled Passkeys */}
      <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <KeyRound size={20} color="var(--accent-primary)" /> Enrolled Passkeys
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Devices and platforms currently authorized to access CMS administration.
            </p>
          </div>
        </div>

        {/* Form to add another passkey */}
        <form onSubmit={handleAddPasskey} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.75rem' }}>
          <input
            type="text"
            className="input"
            placeholder="Device Name (e.g. Work PC, MacBook, Pixel Phone)"
            value={newDeviceName}
            onChange={(e) => setNewDeviceName(e.target.value)}
            style={{ maxWidth: 380 }}
            disabled={isRegistering}
          />
          <button
            type="submit"
            disabled={isRegistering}
            className="btn btn-primary btn-sm"
            style={{ gap: '0.4rem', padding: '0 1.25rem' }}
          >
            {isRegistering ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}
            <span>{isRegistering ? 'Prompting Device...' : 'Add Passkey'}</span>
          </button>
        </form>

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading enrolled passkeys...</p>
        ) : passkeys.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No passkeys enrolled.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {passkeys.map((pk) => {
              const isEditing = editingId === pk.id;
              return (
                <div
                  key={pk.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem 1.25rem',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--accent-primary)'
                    }}>
                      {pk.device_name?.toLowerCase().includes('phone') ? <Smartphone size={20} /> : <Laptop size={20} />}
                    </div>

                    <div>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <input
                            type="text"
                            className="input"
                            style={{ padding: '0.3rem 0.5rem', fontSize: '0.875rem' }}
                            value={editLabel}
                            onChange={(e) => setEditLabel(e.target.value)}
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveRename(pk.id)}
                            className="btn btn-primary btn-sm"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                          {pk.device_name}
                        </div>
                      )}

                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem', marginTop: '0.2rem' }}>
                        <span>Added: {formatDate(pk.created_at)}</span>
                        <span>•</span>
                        <span>Last used: {formatDate(pk.last_used_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {!isEditing && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(pk.id);
                          setEditLabel(pk.device_name);
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.4rem 0.6rem', color: 'var(--text-secondary)' }}
                        title="Rename Passkey"
                      >
                        <Edit2 size={14} />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeletePasskey(pk.id, pk.device_name)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.4rem 0.6rem', color: 'var(--danger)' }}
                      title="Remove Passkey"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2: Emergency Recovery Codes */}
      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={20} color="var(--warning)" /> One-Time Recovery Codes
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Emergency backup access if you ever lose access to your biometric passkeys or primary device.
            </p>
          </div>

          <button
            type="button"
            disabled={generatingCodes}
            onClick={handleRegenerateRecoveryCodes}
            className="btn btn-secondary btn-sm"
            style={{ gap: '0.4rem' }}
          >
            {generatingCodes ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            <span>Generate New Codes</span>
          </button>
        </div>

        {newRecoveryCodes && (
          <div style={{
            padding: '1.5rem',
            backgroundColor: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            marginTop: '1rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--warning)' }}>
                New Recovery Codes (Save these now — they won't be shown again)
              </div>
              <button
                type="button"
                onClick={copyCodes}
                className="btn btn-secondary btn-sm"
                style={{ gap: '0.4rem' }}
              >
                {copied ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy All'}</span>
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.6rem',
              fontFamily: 'monospace',
              fontSize: '0.95rem',
              fontWeight: 700,
              color: 'var(--accent-primary)',
              letterSpacing: '0.05em'
            }}>
              {newRecoveryCodes.map((code, idx) => (
                <div key={idx} style={{ padding: '0.2rem 0' }}>{code}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
