import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit, Save } from 'lucide-react';
import { apiRequest } from '../../../common/utils/api.js';

export function ExperienceManager() {
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingExp, setEditingExp] = useState(null);

  const loadExperiences = async () => {
    try {
      const data = await apiRequest('/admin/profile/experience');
      setExperiences(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExperiences();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/admin/profile/experience', {
        method: 'POST',
        body: JSON.stringify(editingExp)
      });
      setEditingExp(null);
      loadExperiences();
    } catch (err) {
      alert(err.message || 'Failed to save experience.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this experience entry?')) return;
    try {
      await apiRequest(`/admin/profile/experience/${id}`, { method: 'DELETE' });
      setExperiences(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Career Experience</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage your work history and project milestones.</p>
        </div>

        <button
          onClick={() => setEditingExp({
            role: '',
            company: '',
            employment_type: 'Full-time',
            start_date: new Date().toISOString().slice(0, 10),
            end_date: '',
            is_current: true,
            description: '',
            achievements: [],
            display_order: experiences.length + 1,
            is_published: true
          })}
          className="btn btn-primary btn-sm"
          style={{ gap: '0.4rem' }}
        >
          <Plus size={16} /> Add Position
        </button>
      </div>

      {editingExp && (
        <form onSubmit={handleSave} className="card" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>
            {editingExp.id ? 'Edit Experience' : 'New Experience Position'}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
            <div>
              <label className="label">Role Title *</label>
              <input
                type="text"
                required
                className="input"
                value={editingExp.role}
                onChange={(e) => setEditingExp({ ...editingExp, role: e.target.value })}
                placeholder="Full Stack Engineer"
              />
            </div>

            <div>
              <label className="label">Company / Organization *</label>
              <input
                type="text"
                required
                className="input"
                value={editingExp.company}
                onChange={(e) => setEditingExp({ ...editingExp, company: e.target.value })}
                placeholder="Acme Corp"
              />
            </div>

            <div>
              <label className="label">Employment Type</label>
              <input
                type="text"
                className="input"
                value={editingExp.employment_type}
                onChange={(e) => setEditingExp({ ...editingExp, employment_type: e.target.value })}
                placeholder="Full-time / Contract / Project"
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label className="label">Description & Responsibilities</label>
            <textarea
              className="textarea"
              style={{ minHeight: 90 }}
              value={editingExp.description}
              onChange={(e) => setEditingExp({ ...editingExp, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setEditingExp(null)} className="btn btn-secondary btn-sm">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              <Save size={16} /> Save Experience
            </button>
          </div>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {experiences.map((exp) => (
          <div key={exp.id} className="card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>{exp.role}</h3>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
                <strong>{exp.company}</strong> &bull; {exp.employment_type}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setEditingExp(exp)} className="btn btn-secondary btn-sm">
                <Edit size={14} />
              </button>
              <button onClick={() => handleDelete(exp.id)} className="btn btn-danger btn-sm">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
