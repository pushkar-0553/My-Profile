import React, { useEffect, useState } from 'react';
import { Mail, Trash2, CheckCircle2, RotateCw } from 'lucide-react';
import { apiRequest } from '../../../common/utils/api.js';

export function MessagesInbox() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMessages = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const data = await apiRequest('/admin/contact');
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load contact messages:', err);
    } finally {
      setLoading(false);
      if (isManualRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await apiRequest(`/admin/contact/${id}/read`, { method: 'PATCH' });
      setMessages(prev => prev.map(m => Number(m.id) === Number(id) ? { ...m, is_read: 1 } : m));
    } catch (err) {
      alert(err.message || 'Failed to update message.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await apiRequest(`/admin/contact/${id}`, { method: 'DELETE' });
      setMessages(prev => prev.filter(m => Number(m.id) !== Number(id)));
    } catch (err) {
      alert(err.message || 'Failed to delete message.');
    }
  };

  const unreadCount = messages.filter(m => !m.is_read || m.is_read === 0).length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.75rem', margin: 0 }}>Visitor Messages</h1>
            {messages.length > 0 && (
              <span className="badge" style={{ backgroundColor: 'var(--brand-subtle)', color: 'var(--brand-primary)' }}>
                {messages.length} Total
              </span>
            )}
            {unreadCount > 0 && (
              <span className="badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: 'var(--accent-danger)' }}>
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Messages received through your portfolio contact form.</p>
        </div>

        <button
          onClick={() => loadMessages(true)}
          disabled={loading || refreshing}
          className="btn btn-secondary btn-sm"
          style={{ gap: '0.5rem' }}
        >
          <RotateCw size={14} className={refreshing ? 'spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading inbox...</p>
      ) : messages.length === 0 ? (
        <div className="card" style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Mail size={36} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No messages yet</h3>
          <p style={{ fontSize: '0.9rem', margin: 0 }}>When visitors contact you through the portfolio, their messages will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {messages.map((msg) => {
            const isRead = Boolean(msg.is_read) && msg.is_read !== 0;
            const dateStr = msg.received_at
              ? new Date(msg.received_at).toLocaleString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : 'Recently';

            return (
              <div
                key={msg.id}
                className="card"
                style={{
                  padding: '1.75rem',
                  borderLeft: isRead ? '1px solid var(--border-subtle)' : '4px solid var(--brand-primary)',
                  backgroundColor: isRead ? 'var(--bg-secondary)' : 'var(--card-bg)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: 0 }}>{msg.subject || 'Portfolio Inquiry'}</h3>
                      {!isRead && (
                        <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '4px', backgroundColor: 'var(--brand-primary)', color: '#fff', fontWeight: 600 }}>
                          NEW
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      From: <strong style={{ color: 'var(--text-primary)' }}>{msg.sender_name}</strong> &bull;{' '}
                      <a href={`mailto:${msg.sender_email}?subject=Re: ${encodeURIComponent(msg.subject || 'Portfolio Inquiry')}`} style={{ color: 'var(--brand-primary)', textDecoration: 'underline' }}>
                        {msg.sender_email}
                      </a>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {dateStr}
                    </span>

                    {!isRead && (
                      <button
                        onClick={() => handleMarkAsRead(msg.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', gap: '0.35rem' }}
                        title="Mark message as read"
                      >
                        <CheckCircle2 size={13} /> Mark Read
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(msg.id)}
                      className="btn btn-danger btn-sm"
                      style={{ padding: '0.35rem 0.65rem' }}
                      title="Delete message"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.925rem',
                  lineHeight: 1.6,
                  color: 'var(--text-primary)',
                  whiteSpace: 'pre-wrap',
                  border: '1px solid var(--border-subtle)'
                }}>
                  {msg.message}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
