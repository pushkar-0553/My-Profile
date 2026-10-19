import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderGit2, CheckCircle2, Clock, Mail, Plus, Github, Edit, ArrowRight } from 'lucide-react';
import { apiRequest } from '../../../common/utils/api.js';

export function DashboardOverview() {
  const [projects, setProjects] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [projRes, msgRes] = await Promise.all([
          apiRequest('/admin/projects').catch(() => []),
          apiRequest('/admin/contact').catch(() => [])
        ]);
        setProjects(Array.isArray(projRes) ? projRes : []);
        setMessages(Array.isArray(msgRes) ? msgRes : []);
      } catch (err) {
        console.error('Failed to load dashboard statistics:', err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  const publishedCount = projects.filter(p => p.is_published).length;
  const draftCount = projects.filter(p => !p.is_published).length;
  const unreadMessagesCount = messages.filter(m => !m.is_read || m.is_read === 0).length;

  return (
    <div>
      {/* Page Title & Quick Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Portfolio Overview</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Welcome to your Personal Content Management System.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/admin/github" className="btn btn-secondary btn-sm" style={{ gap: '0.4rem' }}>
            <Github size={16} /> Import from GitHub
          </Link>
          <Link to="/admin/projects/new" className="btn btn-primary btn-sm" style={{ gap: '0.4rem' }}>
            <Plus size={16} /> Create Case Study
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Total Projects</span>
            <FolderGit2 size={20} color="var(--accent-primary)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{projects.length}</div>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Published Live</span>
            <CheckCircle2 size={20} color="var(--success)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{publishedCount}</div>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Draft Projects</span>
            <Clock size={20} color="var(--warning)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{draftCount}</div>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Inbound Messages</span>
            <Mail size={20} color={unreadMessagesCount > 0 ? 'var(--danger)' : 'var(--text-muted)'} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>
            {unreadMessagesCount} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>unread</span>
          </div>
        </div>
      </div>

      {/* Recent Projects Table Preview */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', margin: 0, marginBottom: '0.2rem' }}>Recent Projects & Case Studies</h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0 }}>Latest additions to your portfolio.</p>
          </div>
          <Link to="/admin/projects" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-primary)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            Manage All Projects <ArrowRight size={14} />
          </Link>
        </div>

        <div className="table-container" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
          <table className="table" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th className="th" style={{ width: 75, textAlign: 'center' }}>Order</th>
                <th className="th" style={{ minWidth: 260 }}>Project Details</th>
                <th className="th" style={{ width: 140 }}>Category</th>
                <th className="th" style={{ width: 130, textAlign: 'center' }}>Status</th>
                <th className="th" style={{ width: 110, textAlign: 'center' }}>Featured</th>
                <th className="th" style={{ width: 110, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading recent projects...
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No projects found. Create a new case study or import from GitHub.
                  </td>
                </tr>
              ) : (
                projects.slice(0, 5).map((project) => (
                  <tr key={project.id} className="tr">
                    {/* Order */}
                    <td className="td" style={{ textAlign: 'center' }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        minWidth: 24,
                        height: 24,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)'
                      }}>
                        {project.display_order}
                      </span>
                    </td>

                    {/* Project Title & Slug */}
                    <td className="td">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {project.preview_url ? (
                          <img
                            src={project.preview_url}
                            alt=""
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 'var(--radius-sm)',
                              objectFit: 'cover',
                              border: '1px solid var(--border-subtle)',
                              flexShrink: 0,
                              backgroundColor: 'var(--bg-tertiary)'
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-subtle)',
                            backgroundColor: 'var(--bg-tertiary)',
                            display: project.preview_url ? 'none' : 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            color: 'var(--text-muted)'
                          }}
                        >
                          <FolderGit2 size={18} />
                        </div>

                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              fontWeight: 700,
                              color: 'var(--text-primary)',
                              fontSize: '0.925rem',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                            title={project.title}
                          >
                            {project.title}
                          </div>
                          <div
                            style={{
                              fontSize: '0.78rem',
                              color: 'var(--text-muted)',
                              fontFamily: 'var(--font-mono)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              marginTop: '0.15rem'
                            }}
                            title={`/projects/${project.slug}`}
                          >
                            /projects/{project.slug}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="td">
                      <span className="badge badge-neutral" style={{ maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis' }} title={project.category}>
                        {project.category || 'General'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="td" style={{ textAlign: 'center' }}>
                      <span
                        className={`badge ${project.is_published ? 'badge-success' : 'badge-warning'}`}
                        style={{ width: 100, justifyContent: 'center' }}
                      >
                        {project.is_published ? '● Published' : '○ Draft'}
                      </span>
                    </td>

                    {/* Featured */}
                    <td className="td" style={{ textAlign: 'center' }}>
                      <span
                        className={`badge ${project.is_featured ? 'badge-accent' : 'badge-neutral'}`}
                        style={{ width: 95, justifyContent: 'center' }}
                      >
                        {project.is_featured ? '★ Featured' : '☆ Standard'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="td" style={{ textAlign: 'right' }}>
                      <Link
                        to={`/admin/projects/${project.id}/edit`}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.35rem 0.75rem', gap: '0.35rem' }}
                      >
                        <Edit size={13} /> Edit
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
