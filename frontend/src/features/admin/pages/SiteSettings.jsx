import React, { useEffect, useState } from 'react';
import { Save, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '../../../common/utils/api.js';

export function SiteSettings() {
  const [settings, setSettings] = useState({
    site_title: '',
    meta_description: '',
    contact_email: '',
    github_url: '',
    linkedin_url: '',
    hero_headline: '',
    hero_subheadline: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await apiRequest('/public/profile/overview');
        if (data?.settings) {
          setSettings(prev => ({ ...prev, ...data.settings }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiRequest('/admin/profile/settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert(err.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Site Settings & Metadata</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Configure global portfolio titles, SEO descriptions, and social profile URLs.</p>
      </div>

      <form onSubmit={handleSave} className="card" style={{ padding: '2rem' }}>
        {saved && (
          <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--success-bg)', color: 'var(--success)', marginBottom: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={16} /> Settings saved successfully!
          </div>
        )}

        <div style={{ marginBottom: '1.25rem' }}>
          <label className="label">Site Title (Browser & SEO)</label>
          <input
            type="text"
            className="input"
            value={settings.site_title}
            onChange={(e) => setSettings({ ...settings, site_title: e.target.value })}
          />
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label className="label">Meta Description (SEO & Social Sharing)</label>
          <textarea
            className="textarea"
            style={{ minHeight: 70 }}
            value={settings.meta_description}
            onChange={(e) => setSettings({ ...settings, meta_description: e.target.value })}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
          <div>
            <label className="label">Contact Inbox Email</label>
            <input
              type="email"
              className="input"
              value={settings.contact_email}
              onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
            />
          </div>

          <div>
            <label className="label">GitHub Profile URL</label>
            <input
              type="url"
              className="input"
              value={settings.github_url}
              onChange={(e) => setSettings({ ...settings, github_url: e.target.value })}
            />
          </div>
        </div>

        <div style={{ marginBottom: '1.75rem' }}>
          <label className="label">LinkedIn Profile URL</label>
          <input
            type="url"
            className="input"
            value={settings.linkedin_url}
            onChange={(e) => setSettings({ ...settings, linkedin_url: e.target.value })}
          />
        </div>

        <button type="submit" disabled={saving} className="btn btn-primary" style={{ gap: '0.4rem' }}>
          <Save size={16} /> {saving ? 'Saving...' : 'Save Site Settings'}
        </button>
      </form>
    </div>
  );
}
