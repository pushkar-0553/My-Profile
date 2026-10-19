import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Eye,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Video,
  FileText,
  Check,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Github
} from 'lucide-react';
import { apiRequest } from '../../../common/utils/api.js';
import ProjectMedia from '../../public/components/ProjectMedia.jsx';

const defaultDisplaySettings = {
  readme_source: 'github', // 'github' | 'custom' | 'none'
  show_full_content: true,
  show_problem: true,
  show_solution: true,
  show_architecture: true,
  show_my_role: true,
  show_challenges: true,
  show_results_metrics: true,
  show_lessons_learned: true
};

export function ProjectEditor() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    category: 'Full Stack',
    short_summary: '',
    full_content: '',
    problem: '',
    solution: '',
    architecture_details: '',
    my_role: '',
    challenges: '',
    results_metrics: '',
    lessons_learned: '',
    preview_type: 'image',
    preview_url: '',
    github_repo_url: '',
    live_demo_url: '',
    figma_url: '',
    is_published: true, // Default to true so newly added projects are immediately visible on the portfolio!
    is_featured: false,
    display_order: 1,
    display_settings: defaultDisplaySettings
  });

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  // Live README test & inspection state
  const [checkingReadme, setCheckingReadme] = useState(false);
  const [readmeCheckResult, setReadmeCheckResult] = useState(null);
  const [showReadmePreview, setShowReadmePreview] = useState(false);

  useEffect(() => {
    async function loadProject() {
      if (isNew) return;
      try {
        const data = await apiRequest(`/admin/projects/${id}`);
        const loadedDs = typeof data.display_settings === 'string'
          ? (() => { try { return JSON.parse(data.display_settings); } catch { return {}; } })()
          : (data.display_settings || {});

        setFormData({
          title: data.title || '',
          slug: data.slug || '',
          category: data.category || 'Full Stack',
          short_summary: data.short_summary || '',
          full_content: data.full_content || '',
          problem: data.problem || '',
          solution: data.solution || '',
          architecture_details: data.architecture_details || '',
          my_role: data.my_role || '',
          challenges: data.challenges || '',
          results_metrics: data.results_metrics || '',
          lessons_learned: data.lessons_learned || '',
          preview_type: data.preview_type || 'image',
          preview_url: data.preview_url || '',
          github_repo_url: data.github_repo_url || '',
          live_demo_url: data.live_demo_url || '',
          figma_url: data.figma_url || '',
          is_published: !!data.is_published,
          is_featured: !!data.is_featured,
          display_order: data.display_order || 1,
          display_settings: {
            ...defaultDisplaySettings,
            ...loadedDs
          }
        });
      } catch (err) {
        setError('Failed to load project details.');
      } finally {
        setLoading(false);
      }
    }

    loadProject();
  }, [id, isNew]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDisplaySettingChange = (field, value) => {
    setFormData(prev => {
      const updatedDs = {
        ...prev.display_settings,
        [field]: value
      };
      // Keep documentation source and full_content in sync
      if (field === 'readme_source') {
        if (value === 'none') {
          updatedDs.show_full_content = false;
        } else {
          updatedDs.show_full_content = true;
        }
      } else if (field === 'show_full_content') {
        if (!value) {
          updatedDs.readme_source = 'none';
        } else if (updatedDs.readme_source === 'none') {
          updatedDs.readme_source = 'github';
        }
      }
      return {
        ...prev,
        display_settings: updatedDs
      };
    });
  };

  // Inspect and verify the README from GitHub repository
  const handleCheckReadme = async () => {
    const repoUrl = formData.github_repo_url;
    if (!repoUrl) {
      setReadmeCheckResult({
        success: false,
        error: 'Please enter a GitHub Repository URL in the field below first.'
      });
      return;
    }

    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      setReadmeCheckResult({
        success: false,
        error: 'Invalid GitHub URL. Must be in the format https://github.com/owner/repository'
      });
      return;
    }

    const owner = match[1];
    const repo = match[2].replace(/\.git$/, '');

    setCheckingReadme(true);
    setReadmeCheckResult(null);

    try {
      let branch = 'main';
      let res = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/main/README.md`);
      if (!res.ok) {
        branch = 'master';
        res = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/master/README.md`);
      }

      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().length > 15) {
          const words = text.trim().split(/\s+/).length;
          const sizeKb = (new Blob([text]).size / 1024).toFixed(1);
          const headingMatches = text.match(/^#{1,3}\s+(.+)$/gm) || [];
          const headings = headingMatches.slice(0, 10).map(h => h.replace(/^#{1,3}\s+/, '').trim());

          setReadmeCheckResult({
            success: true,
            owner,
            repo,
            branch,
            wordCount: words,
            sizeKb,
            headings,
            text,
            preview: text.slice(0, 800)
          });
        } else {
          setReadmeCheckResult({
            success: false,
            error: `A README.md was found on branch '${branch}' but it appears to be empty.`
          });
        }
      } else {
        setReadmeCheckResult({
          success: false,
          error: `Could not fetch README.md from https://github.com/${owner}/${repo} (HTTP ${res.status}). Ensure the repo is public and contains a README.md file on the main or master branch.`
        });
      }
    } catch (err) {
      setReadmeCheckResult({
        success: false,
        error: `Network error while fetching README: ${err.message}`
      });
    } finally {
      setCheckingReadme(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaveSuccess(false);

    try {
      if (isNew) {
        const created = await apiRequest('/admin/projects', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        navigate(`/admin/projects/${created.id}/edit`);
      } else {
        await apiRequest(`/admin/projects/${id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to save project.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p style={{ color: 'var(--text-muted)' }}>Loading editor...</p>;
  }

  const ds = formData.display_settings || defaultDisplaySettings;

  return (
    <form onSubmit={handleSave} style={{ maxWidth: 960 }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/admin/projects" className="btn btn-secondary btn-sm">
            <ArrowLeft size={16} /> All Projects
          </Link>
          <h1 style={{ fontSize: '1.65rem' }}>
            {isNew ? 'Create New Case Study' : `Edit: ${formData.title || 'Project'}`}
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {saveSuccess && (
            <span style={{ color: 'var(--accent-success)', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.875rem', fontWeight: 600 }}>
              <CheckCircle2 size={16} /> Saved!
            </span>
          )}

          {!isNew && formData.slug && (
            <Link to={`/projects/${formData.slug}`} target="_blank" className="btn btn-secondary btn-sm" style={{ gap: '0.35rem' }}>
              <Eye size={16} /> View on Public Site ↗
            </Link>
          )}

          <button type="submit" disabled={saving} className="btn btn-primary btn-sm" style={{ gap: '0.4rem', padding: '0.6rem 1.25rem' }}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Prominent Publishing Status Bar */}
      <div
        className="card"
        style={{
          padding: '1rem 1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: formData.is_published ? 'rgba(34, 197, 94, 0.08)' : 'rgba(245, 158, 11, 0.08)',
          borderColor: formData.is_published ? 'var(--accent-success)' : 'var(--accent-warning)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: formData.is_published ? 'var(--accent-success)' : 'var(--accent-warning)',
              display: 'inline-block'
            }}
          />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              {formData.is_published ? 'Live on Portfolio (Visible to Public)' : 'Draft Mode (Hidden from Public Portfolio)'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {formData.is_published
                ? 'This project is publicly visible on your /projects page and portfolio.'
                : 'This project is saved privately in your CMS. Switch to Published to make it visible to visitors.'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => handleChange('is_published', !formData.is_published)}
            className={`btn btn-sm ${formData.is_published ? 'btn-secondary' : 'btn-primary'}`}
            style={{ fontSize: '0.85rem' }}
          >
            {formData.is_published ? 'Unpublish (Switch to Draft)' : 'Publish to Portfolio Live'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {/* Section 1: Basic Information */}
      <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
          1. Basic Information
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
          <div>
            <label className="label">Project Title *</label>
            <input
              type="text"
              required
              className="input"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="e.g. Distributed High-Concurrency E-Commerce Platform"
            />
          </div>

          <div>
            <label className="label">Category</label>
            <select
              className="select"
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
            >
              <option value="Full Stack">Full Stack</option>
              <option value="Backend Engineering">Backend Engineering</option>
              <option value="Automation & RPA">Automation & RPA</option>
              <option value="UI/UX Design">UI/UX Design</option>
              <option value="Frontend Engineering">Frontend Engineering</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label className="label">Short Executive Summary *</label>
          <textarea
            required
            className="textarea"
            style={{ minHeight: 80 }}
            value={formData.short_summary}
            onChange={(e) => handleChange('short_summary', e.target.value)}
            placeholder="Brief 1-2 sentence value proposition of what this system does."
          />
        </div>
      </div>

      {/* Section 2: Media & Wallpaper Preview Configuration */}
      <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
          2. Media & Wallpaper Preview Configuration
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Supports <strong>YouTube unlisted/public links</strong> (e.g. <code>https://youtu.be/xyz</code>), <strong>Google Drive video preview links</strong>, direct <strong>MP4/WebM videos</strong>, or <strong>high-res images</strong>.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
          <div>
            <label className="label">Preview Type</label>
            <select
              className="select"
              value={formData.preview_type}
              onChange={(e) => handleChange('preview_type', e.target.value)}
            >
              <option value="image">Image / Screenshot</option>
              <option value="external_video">YouTube Video (Unlisted or Public)</option>
              <option value="video">Direct Video (MP4 / WebM / Drive)</option>
              <option value="live_demo">Live Website Frame</option>
            </select>
          </div>

          <div>
            <label className="label">Preview Media URL *</label>
            <input
              type="text"
              required
              className="input"
              value={formData.preview_url}
              onChange={(e) => handleChange('preview_url', e.target.value)}
              placeholder="e.g. https://youtu.be/... or https://drive.google.com/file/d/... or image URL"
            />
          </div>
        </div>

        {/* Live Preview Box */}
        {formData.preview_url && (
          <div style={{ marginTop: '1.25rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', fontFamily: 'var(--font-mono)' }}>
              LIVE MEDIA PREVIEW:
            </div>
            <div style={{ maxWidth: '420px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
              <ProjectMedia
                url={formData.preview_url}
                type={formData.preview_type}
                title={formData.title || 'Preview'}
                interactive={true}
              />
            </div>
          </div>
        )}
      </div>

      {/* Section 3: README & Repository Documentation Configuration */}
      <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', margin: 0 }}>
              3. README & Documentation Configuration
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Select which README source to display on the public case study page and inspect the content.
            </p>
          </div>
        </div>

        {/* README Display Mode Selector */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: `1.5px solid ${ds.readme_source === 'github' ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
              backgroundColor: ds.readme_source === 'github' ? 'var(--accent-subtle)' : 'var(--bg-secondary)',
              cursor: 'pointer',
              transition: 'border-color 0.2s ease, background-color 0.2s ease'
            }}
          >
            <input
              type="radio"
              name="readme_source"
              value="github"
              checked={ds.readme_source === 'github'}
              onChange={() => handleDisplaySettingChange('readme_source', 'github')}
              style={{ accentColor: 'var(--accent-primary)', marginTop: 3 }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                Auto-fetch from GitHub Repo
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Dynamically fetches the latest <code>README.md</code> from the repository and parses architecture sections.
              </div>
            </div>
          </label>

          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: `1.5px solid ${ds.readme_source === 'custom' ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
              backgroundColor: ds.readme_source === 'custom' ? 'var(--accent-subtle)' : 'var(--bg-secondary)',
              cursor: 'pointer',
              transition: 'border-color 0.2s ease, background-color 0.2s ease'
            }}
          >
            <input
              type="radio"
              name="readme_source"
              value="custom"
              checked={ds.readme_source === 'custom'}
              onChange={() => handleDisplaySettingChange('readme_source', 'custom')}
              style={{ accentColor: 'var(--accent-primary)', marginTop: 3 }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                Custom Markdown Narrative
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Uses the custom markdown entered in Section 4 (Full Markdown Case Study) as the primary documentation.
              </div>
            </div>
          </label>

          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: `1.5px solid ${ds.readme_source === 'none' ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
              backgroundColor: ds.readme_source === 'none' ? 'var(--accent-subtle)' : 'var(--bg-secondary)',
              cursor: 'pointer',
              transition: 'border-color 0.2s ease, background-color 0.2s ease'
            }}
          >
            <input
              type="radio"
              name="readme_source"
              value="none"
              checked={ds.readme_source === 'none'}
              onChange={() => handleDisplaySettingChange('readme_source', 'none')}
              style={{ accentColor: 'var(--accent-primary)', marginTop: 3 }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                Do Not Display README
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Hides the external README documentation section on the public case study page.
              </div>
            </div>
          </label>
        </div>

        {/* GitHub Repository URL & Live Check README Tool */}
        <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <label className="label" style={{ marginBottom: 0 }}>
              GitHub Repository URL (for README synchronization)
            </label>
            <button
              type="button"
              onClick={handleCheckReadme}
              disabled={checkingReadme || !formData.github_repo_url}
              className="btn btn-secondary btn-sm"
              style={{ gap: '0.35rem', fontSize: '0.82rem' }}
            >
              {checkingReadme ? <RefreshCw size={13} className="spin" /> : <Github size={13} />}
              {checkingReadme ? 'Checking README...' : 'Check & Inspect README'}
            </button>
          </div>

          <input
            type="url"
            className="input"
            value={formData.github_repo_url}
            onChange={(e) => {
              handleChange('github_repo_url', e.target.value);
              setReadmeCheckResult(null);
            }}
            placeholder="https://github.com/pushkar-0553/repository-name"
          />

          {/* README Check Live Feedback */}
          {readmeCheckResult && (
            <div style={{ marginTop: '1rem' }}>
              {readmeCheckResult.success ? (
                <div
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(34, 197, 94, 0.08)',
                    border: '1px solid var(--accent-success)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-success)', fontWeight: 700, fontSize: '0.9rem' }}>
                      <CheckCircle2 size={16} /> README.md Verified & Accessible!
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      Branch: <strong>{readmeCheckResult.branch}</strong> • {readmeCheckResult.wordCount} words • {readmeCheckResult.sizeKb} KB
                    </span>
                  </div>

                  {readmeCheckResult.headings.length > 0 && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                        Detected Architecture Sections in README:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {readmeCheckResult.headings.map((h, i) => (
                          <span key={i} className="badge-mono" style={{ fontSize: '0.72rem', backgroundColor: 'var(--bg-primary)' }}>
                            # {h}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => setShowReadmePreview(prev => !prev)}
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: '0.78rem', gap: '0.3rem', padding: '0.2rem 0.5rem' }}
                    >
                      {showReadmePreview ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      {showReadmePreview ? 'Hide README Preview' : 'Inspect README Content Preview'}
                    </button>

                    {showReadmePreview && (
                      <pre
                        style={{
                          marginTop: '0.5rem',
                          padding: '0.75rem',
                          maxHeight: '220px',
                          overflowY: 'auto',
                          fontSize: '0.78rem',
                          fontFamily: 'var(--font-mono)',
                          backgroundColor: 'var(--bg-tertiary)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-subtle)',
                          whiteSpace: 'pre-wrap',
                          lineHeight: 1.5
                        }}
                      >
                        {readmeCheckResult.preview}...
                      </pre>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid var(--accent-danger, #ef4444)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontWeight: 700, marginBottom: '0.25rem' }}>
                    <AlertTriangle size={15} /> README Check Notice
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    {readmeCheckResult.error}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Section 4: Technical Case Study Narrative (with display on/off controls) */}
      <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', margin: 0 }}>
              4. Technical Case Study Narrative
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Fill in engineering narrative sections. Use the toggle next to each field to choose whether to display it on the public case study page.
            </p>
          </div>
        </div>

        {/* Field 1: Full Markdown Case Study */}
        <div style={{ marginBottom: '1.75rem', opacity: ds.show_full_content !== false ? 1 : 0.65 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <label className="label" style={{ marginBottom: 0 }}>
              Full Markdown Case Study / Executive Overview
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', cursor: 'pointer', userSelect: 'none', color: ds.show_full_content !== false ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
              <input
                type="checkbox"
                checked={ds.show_full_content !== false}
                onChange={(e) => handleDisplaySettingChange('show_full_content', e.target.checked)}
                style={{ accentColor: 'var(--accent-primary)', width: 15, height: 15, cursor: 'pointer' }}
              />
              <span style={{ fontWeight: 600 }}>
                {ds.show_full_content !== false ? '● Display on Page' : '○ Hidden from Page'}
              </span>
            </label>
          </div>
          <textarea
            className="textarea"
            style={{ minHeight: 120, fontFamily: 'monospace' }}
            value={formData.full_content}
            onChange={(e) => handleChange('full_content', e.target.value)}
            placeholder="## Executive Overview&#10;&#10;Detailed narrative of the system design, architecture, and background."
          />
        </div>

        {/* Field 2: The Problem */}
        <div style={{ marginBottom: '1.75rem', opacity: ds.show_problem !== false ? 1 : 0.65 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <label className="label" style={{ marginBottom: 0 }}>
              The Problem & Scale Constraints
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', cursor: 'pointer', userSelect: 'none', color: ds.show_problem !== false ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
              <input
                type="checkbox"
                checked={ds.show_problem !== false}
                onChange={(e) => handleDisplaySettingChange('show_problem', e.target.checked)}
                style={{ accentColor: 'var(--accent-primary)', width: 15, height: 15, cursor: 'pointer' }}
              />
              <span style={{ fontWeight: 600 }}>
                {ds.show_problem !== false ? '● Display on Page' : '○ Hidden from Page'}
              </span>
            </label>
          </div>
          <textarea
            className="textarea"
            value={formData.problem}
            onChange={(e) => handleChange('problem', e.target.value)}
            placeholder="What was broken, inefficient, or slow before this system was built?"
          />
        </div>

        {/* Field 3: Engineering Solution */}
        <div style={{ marginBottom: '1.75rem', opacity: ds.show_solution !== false ? 1 : 0.65 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <label className="label" style={{ marginBottom: 0 }}>
              Engineering Solution & Architecture
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', cursor: 'pointer', userSelect: 'none', color: ds.show_solution !== false ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
              <input
                type="checkbox"
                checked={ds.show_solution !== false}
                onChange={(e) => handleDisplaySettingChange('show_solution', e.target.checked)}
                style={{ accentColor: 'var(--accent-primary)', width: 15, height: 15, cursor: 'pointer' }}
              />
              <span style={{ fontWeight: 600 }}>
                {ds.show_solution !== false ? '● Display on Page' : '○ Hidden from Page'}
              </span>
            </label>
          </div>
          <textarea
            className="textarea"
            value={formData.solution}
            onChange={(e) => handleChange('solution', e.target.value)}
            placeholder="How did you solve it? Explain the architectural approach and service design."
          />
        </div>

        {/* Field 4: Architecture Details */}
        <div style={{ marginBottom: '1.75rem', opacity: ds.show_architecture !== false ? 1 : 0.65 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <label className="label" style={{ marginBottom: 0 }}>
              Architecture & Implementation Specs
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', cursor: 'pointer', userSelect: 'none', color: ds.show_architecture !== false ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
              <input
                type="checkbox"
                checked={ds.show_architecture !== false}
                onChange={(e) => handleDisplaySettingChange('show_architecture', e.target.checked)}
                style={{ accentColor: 'var(--accent-primary)', width: 15, height: 15, cursor: 'pointer' }}
              />
              <span style={{ fontWeight: 600 }}>
                {ds.show_architecture !== false ? '● Display on Page' : '○ Hidden from Page'}
              </span>
            </label>
          </div>
          <textarea
            className="textarea"
            value={formData.architecture_details}
            onChange={(e) => handleChange('architecture_details', e.target.value)}
            placeholder="Technical details of the stack: Spring Boot, TiDB Cloud, Redis caching, microservices isolation, etc."
          />
        </div>

        {/* Field 5: My Role */}
        <div style={{ marginBottom: '1.75rem', opacity: ds.show_my_role !== false ? 1 : 0.65 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <label className="label" style={{ marginBottom: 0 }}>
              My Role & Responsibilities
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', cursor: 'pointer', userSelect: 'none', color: ds.show_my_role !== false ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
              <input
                type="checkbox"
                checked={ds.show_my_role !== false}
                onChange={(e) => handleDisplaySettingChange('show_my_role', e.target.checked)}
                style={{ accentColor: 'var(--accent-primary)', width: 15, height: 15, cursor: 'pointer' }}
              />
              <span style={{ fontWeight: 600 }}>
                {ds.show_my_role !== false ? '● Display on Page' : '○ Hidden from Page'}
              </span>
            </label>
          </div>
          <input
            type="text"
            className="input"
            value={formData.my_role}
            onChange={(e) => handleChange('my_role', e.target.value)}
            placeholder="e.g. Lead Full Stack Architect & Backend Developer"
          />
        </div>

        {/* Field 6: Technical Challenges */}
        <div style={{ marginBottom: '1.75rem', opacity: ds.show_challenges !== false ? 1 : 0.65 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <label className="label" style={{ marginBottom: 0 }}>
              Technical Challenges & Trade-offs Overcome
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', cursor: 'pointer', userSelect: 'none', color: ds.show_challenges !== false ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
              <input
                type="checkbox"
                checked={ds.show_challenges !== false}
                onChange={(e) => handleDisplaySettingChange('show_challenges', e.target.checked)}
                style={{ accentColor: 'var(--accent-primary)', width: 15, height: 15, cursor: 'pointer' }}
              />
              <span style={{ fontWeight: 600 }}>
                {ds.show_challenges !== false ? '● Display on Page' : '○ Hidden from Page'}
              </span>
            </label>
          </div>
          <textarea
            className="textarea"
            value={formData.challenges}
            onChange={(e) => handleChange('challenges', e.target.value)}
            placeholder="What difficult technical trade-offs did you evaluate?"
          />
        </div>

        {/* Field 7: Measurable Results */}
        <div style={{ marginBottom: '1.75rem', opacity: ds.show_results_metrics !== false ? 1 : 0.65 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <label className="label" style={{ marginBottom: 0 }}>
              Measurable Results & Outcomes
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', cursor: 'pointer', userSelect: 'none', color: ds.show_results_metrics !== false ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
              <input
                type="checkbox"
                checked={ds.show_results_metrics !== false}
                onChange={(e) => handleDisplaySettingChange('show_results_metrics', e.target.checked)}
                style={{ accentColor: 'var(--accent-primary)', width: 15, height: 15, cursor: 'pointer' }}
              />
              <span style={{ fontWeight: 600 }}>
                {ds.show_results_metrics !== false ? '● Display on Page' : '○ Hidden from Page'}
              </span>
            </label>
          </div>
          <textarea
            className="textarea"
            value={formData.results_metrics}
            onChange={(e) => handleChange('results_metrics', e.target.value)}
            placeholder="Latency improvements, error reduction, concurrency test results, or business impact."
          />
        </div>

        {/* Field 8: Lessons Learned */}
        <div style={{ marginBottom: '1rem', opacity: ds.show_lessons_learned !== false ? 1 : 0.65 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <label className="label" style={{ marginBottom: 0 }}>
              Lessons Learned & Retrospective
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', cursor: 'pointer', userSelect: 'none', color: ds.show_lessons_learned !== false ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
              <input
                type="checkbox"
                checked={ds.show_lessons_learned !== false}
                onChange={(e) => handleDisplaySettingChange('show_lessons_learned', e.target.checked)}
                style={{ accentColor: 'var(--accent-primary)', width: 15, height: 15, cursor: 'pointer' }}
              />
              <span style={{ fontWeight: 600 }}>
                {ds.show_lessons_learned !== false ? '● Display on Page' : '○ Hidden from Page'}
              </span>
            </label>
          </div>
          <textarea
            className="textarea"
            value={formData.lessons_learned}
            onChange={(e) => handleChange('lessons_learned', e.target.value)}
            placeholder="What did this project teach you about distributed systems or frontend craft?"
          />
        </div>
      </div>

      {/* Section 5: External Links & Publishing Controls */}
      <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
          5. Links & Publishing Controls
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
          <div>
            <label className="label">Live Demo URL</label>
            <input
              type="url"
              className="input"
              value={formData.live_demo_url}
              onChange={(e) => handleChange('live_demo_url', e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="label">Figma Design URL</label>
            <input
              type="url"
              className="input"
              value={formData.figma_url}
              onChange={(e) => handleChange('figma_url', e.target.value)}
              placeholder="https://www.figma.com/..."
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={formData.is_published}
              onChange={(e) => handleChange('is_published', e.target.checked)}
              style={{ width: 18, height: 18, accentColor: 'var(--accent-primary)' }}
            />
            <span>Publish Live to Public Portfolio</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={formData.is_featured}
              onChange={(e) => handleChange('is_featured', e.target.checked)}
              style={{ width: 18, height: 18, accentColor: 'var(--accent-primary)' }}
            />
            <span>Feature on Homepage</span>
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: '4rem' }}>
        <Link to="/admin/projects" className="btn btn-secondary">
          Cancel
        </Link>
        <button type="submit" disabled={saving} className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
          <Save size={18} /> {saving ? 'Saving...' : 'Save Case Study'}
        </button>
      </div>
    </form>
  );
}
