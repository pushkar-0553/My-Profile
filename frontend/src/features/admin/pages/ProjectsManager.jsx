import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Github, Trash2, Edit, Eye, ChevronUp, ChevronDown, FolderGit2, Search } from 'lucide-react';
import { apiRequest } from '../../../common/utils/api.js';

export function ProjectsManager() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadProjects = async () => {
    try {
      const data = await apiRequest('/admin/projects');
      setProjects(data || []);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleTogglePublish = async (id) => {
    try {
      const res = await apiRequest(`/admin/projects/${id}/publish`, { method: 'PATCH' });
      setProjects(prev => prev.map(p => p.id === id ? { ...p, is_published: res.is_published } : p));
    } catch (err) {
      alert(err.message || 'Failed to toggle publication status.');
    }
  };

  const handleToggleFeatured = async (id) => {
    try {
      const res = await apiRequest(`/admin/projects/${id}/feature`, { method: 'PATCH' });
      setProjects(prev => prev.map(p => p.id === id ? { ...p, is_featured: res.is_featured } : p));
    } catch (err) {
      alert(err.message || 'Failed to toggle featured status.');
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiRequest(`/admin/projects/${id}`, { method: 'DELETE' });
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete project.');
    }
  };

  const moveOrder = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= filteredProjects.length) return;

    const currentItem = filteredProjects[index];
    const targetItem = filteredProjects[targetIndex];
    const updated = [...projects];

    const fullCurrentIdx = updated.findIndex(p => p.id === currentItem.id);
    const fullTargetIdx = updated.findIndex(p => p.id === targetItem.id);

    if (fullCurrentIdx === -1 || fullTargetIdx === -1) return;

    const temp = updated[fullCurrentIdx];
    updated[fullCurrentIdx] = updated[fullTargetIdx];
    updated[fullTargetIdx] = temp;

    // Recalculate display_order sequentially
    const reorderedPayload = updated.map((p, idx) => ({
      id: p.id,
      display_order: idx + 1
    }));

    setProjects(updated.map((p, idx) => ({ ...p, display_order: idx + 1 })));

    try {
      await apiRequest('/admin/projects/reorder', {
        method: 'PATCH',
        body: JSON.stringify({ orders: reorderedPayload })
      });
    } catch (err) {
      console.error('Failed to persist order:', err);
      loadProjects();
    }
  };

  const filteredProjects = projects.filter(p =>
    (p.title && p.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div>
      {/* Header and Quick Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Projects & Case Studies</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Curate, edit, order, and publish technical case studies.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/admin/github" className="btn btn-secondary btn-sm" style={{ gap: '0.4rem' }}>
            <Github size={16} /> Import from GitHub
          </Link>
          <Link to="/admin/projects/new" className="btn btn-primary btn-sm" style={{ gap: '0.4rem' }}>
            <Plus size={16} /> New Case Study
          </Link>
        </div>
      </div>

      {/* Filter / Search Bar with Count */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>
          <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input"
            placeholder="Search by title or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          Showing {filteredProjects.length} of {projects.length} project{projects.length === 1 ? '' : 's'}
        </div>
      </div>

      {/* Projects Table */}
      <div className="table-container">
        <table className="table" style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th className="th" style={{ width: 85, textAlign: 'center' }}>Order</th>
              <th className="th" style={{ minWidth: 260 }}>Project Details</th>
              <th className="th" style={{ width: 140 }}>Category</th>
              <th className="th" style={{ width: 140, textAlign: 'center' }}>Live Status</th>
              <th className="th" style={{ width: 120, textAlign: 'center' }}>Featured</th>
              <th className="th" style={{ width: 130, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading projects...
                </td>
              </tr>
            ) : filteredProjects.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  {searchTerm ? 'No projects match your search.' : 'No projects found. Create a new case study or import from GitHub.'}
                </td>
              </tr>
            ) : (
              filteredProjects.map((project, idx) => (
                <tr key={project.id} className="tr">
                  {/* Order Column with clean mono badge and micro-buttons */}
                  <td className="td" style={{ textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <button
                          onClick={() => moveOrder(idx, 'up')}
                          disabled={idx === 0}
                          style={{
                            border: '1px solid var(--border-subtle)',
                            background: 'var(--bg-tertiary)',
                            color: 'var(--text-secondary)',
                            cursor: idx === 0 ? 'not-allowed' : 'pointer',
                            opacity: idx === 0 ? 0.3 : 1,
                            padding: '1px 3px',
                            borderRadius: 3,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Move Up"
                        >
                          <ChevronUp size={12} />
                        </button>
                        <button
                          onClick={() => moveOrder(idx, 'down')}
                          disabled={idx === filteredProjects.length - 1}
                          style={{
                            border: '1px solid var(--border-subtle)',
                            background: 'var(--bg-tertiary)',
                            color: 'var(--text-secondary)',
                            cursor: idx === filteredProjects.length - 1 ? 'not-allowed' : 'pointer',
                            opacity: idx === filteredProjects.length - 1 ? 0.3 : 1,
                            padding: '1px 3px',
                            borderRadius: 3,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Move Down"
                        >
                          <ChevronDown size={12} />
                        </button>
                      </div>
                    </div>
                  </td>

                  {/* Project Details with Thumbnail anchor, Title and Slug */}
                  <td className="td">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      {project.preview_url ? (
                        <img
                          src={project.preview_url}
                          alt=""
                          style={{
                            width: 44,
                            height: 44,
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
                          width: 44,
                          height: 44,
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
                        <FolderGit2 size={20} />
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

                  {/* Live Status Toggle Pill */}
                  <td className="td" style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => handleTogglePublish(project.id)}
                      className={`badge ${project.is_published ? 'badge-success' : 'badge-warning'}`}
                      style={{
                        cursor: 'pointer',
                        width: 124,
                        justifyContent: 'center',
                        gap: '0.35rem',
                        transition: 'all var(--transition-fast)'
                      }}
                      title={project.is_published ? 'Visible on public portfolio. Click to set as Draft.' : 'Hidden as draft. Click to Publish Live.'}
                    >
                      {project.is_published ? '● Published' : '○ Draft'}
                    </button>
                  </td>

                  {/* Featured Status Toggle Pill */}
                  <td className="td" style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => handleToggleFeatured(project.id)}
                      className={`badge ${project.is_featured ? 'badge-accent' : 'badge-neutral'}`}
                      style={{
                        cursor: 'pointer',
                        width: 108,
                        justifyContent: 'center',
                        gap: '0.35rem',
                        transition: 'all var(--transition-fast)'
                      }}
                      title={project.is_featured ? 'Featured on Homepage. Click to unfeature.' : 'Click to feature on Homepage.'}
                    >
                      {project.is_featured ? '★ Featured' : '☆ Standard'}
                    </button>
                  </td>

                  {/* Actions (Strictly 3 aligned icon buttons across all rows) */}
                  <td className="td" style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center', justifyContent: 'flex-end' }}>
                      {project.is_published ? (
                        <Link
                          to={`/projects/${project.slug}`}
                          target="_blank"
                          className="btn btn-secondary btn-sm"
                          title="View Live Public Case Study"
                          style={{ width: 32, height: 32, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Eye size={14} />
                        </Link>
                      ) : (
                        <div
                          className="btn btn-secondary btn-sm"
                          title="Project is Draft (publish to view live)"
                          style={{
                            width: 32,
                            height: 32,
                            padding: 0,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: 0.35,
                            cursor: 'not-allowed',
                            pointerEvents: 'none'
                          }}
                        >
                          <Eye size={14} />
                        </div>
                      )}

                      <Link
                        to={`/admin/projects/${project.id}/edit`}
                        className="btn btn-secondary btn-sm"
                        style={{ width: 32, height: 32, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Edit Case Study"
                      >
                        <Edit size={14} />
                      </Link>

                      <button
                        onClick={() => handleDelete(project.id, project.title)}
                        className="btn btn-danger btn-sm"
                        style={{ width: 32, height: 32, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Delete Project"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
