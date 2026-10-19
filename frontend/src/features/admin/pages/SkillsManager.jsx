import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { apiRequest } from '../../../common/utils/api.js';

export function SkillsManager() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSkill, setNewSkill] = useState({ category_id: 1, name: '', is_core: true });

  const loadSkills = async () => {
    try {
      const data = await apiRequest('/admin/profile/skills');
      setCategories(data || []);
      if (data?.length > 0 && !newSkill.category_id) {
        setNewSkill(prev => ({ ...prev, category_id: data[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSkills();
  }, []);

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!newSkill.name.trim()) return;

    try {
      await apiRequest('/admin/profile/skills', {
        method: 'POST',
        body: JSON.stringify(newSkill)
      });
      setNewSkill(prev => ({ ...prev, name: '' }));
      loadSkills();
    } catch (err) {
      alert(err.message || 'Failed to add skill.');
    }
  };

  const handleDeleteSkill = async (id) => {
    try {
      await apiRequest(`/admin/profile/skills/${id}`, { method: 'DELETE' });
      loadSkills();
    } catch (err) {
      alert(err.message || 'Failed to delete skill.');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Technical Skills & Categories</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage your technical skills without arbitrary percentage bars.</p>
      </div>

      {/* Add Skill Form */}
      <form onSubmit={handleAddSkill} className="card" style={{ padding: '1.75rem', marginBottom: '2.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <label className="label">Skill Name *</label>
          <input
            type="text"
            required
            className="input"
            placeholder="e.g. Docker, TypeScript, Redis"
            value={newSkill.name}
            onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
          />
        </div>

        <div style={{ minWidth: 200 }}>
          <label className="label">Category</label>
          <select
            className="select"
            value={newSkill.category_id}
            onChange={(e) => setNewSkill({ ...newSkill, category_id: Number(e.target.value) })}
          >
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', height: 42 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={newSkill.is_core}
              onChange={(e) => setNewSkill({ ...newSkill, is_core: e.target.checked })}
            />
            Core Competency
          </label>
        </div>

        <button type="submit" className="btn btn-primary btn-sm" style={{ height: 42, gap: '0.35rem' }}>
          <Plus size={16} /> Add Skill
        </button>
      </form>

      {/* Categorized Skills Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.75rem' }}>
        {categories.map((cat) => (
          <div key={cat.id} className="card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)', color: 'var(--accent-primary)' }}>
              {cat.name}
            </h3>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
              {cat.skills?.map((s) => (
                <div
                  key={s.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.4rem 0.75rem',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: s.is_core ? 'var(--accent-subtle)' : 'var(--bg-tertiary)',
                    fontSize: '0.85rem',
                    fontWeight: 600
                  }}
                >
                  <span>{s.name}</span>
                  <button
                    onClick={() => handleDeleteSkill(s.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 0, display: 'flex' }}
                    title="Remove"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
