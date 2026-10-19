import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight, ExternalLink, Github, Code2, RotateCcw } from 'lucide-react';
import { apiRequest } from '../../../common/utils/api.js';
import ProjectMedia from '../components/ProjectMedia.jsx';

export function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    async function loadProjects() {
      try {
        const data = await apiRequest('/public/projects');
        setProjects(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load projects archive:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, []);

  const categories = useMemo(() => {
    const defaultCats = ['All', 'Frontend', 'Full Stack', 'Backend'];
    const set = new Set(defaultCats);
    projects.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesCategory =
        selectedCategory === 'All' ||
        project.category?.toLowerCase() === selectedCategory.toLowerCase();

      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchesCategory;

      const titleMatch = project.title?.toLowerCase().includes(query);
      const summaryMatch = project.short_summary?.toLowerCase().includes(query);
      const categoryMatch = project.category?.toLowerCase().includes(query);
      const techMatch = Array.isArray(project.tech_stack)
        ? project.tech_stack.some((t) => t.toLowerCase().includes(query))
        : false;

      return matchesCategory && (titleMatch || summaryMatch || categoryMatch || techMatch);
    });
  }, [projects, selectedCategory, searchQuery]);

  return (
    <div className="section" style={{ paddingTop: '3.5rem', paddingBottom: '6rem' }}>
      <div className="container">
        {/* Editorial Clean Header */}
        <div style={{ maxWidth: '780px', marginBottom: '3rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-primary)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '0.5rem' }}>
            Portfolio Archive
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
            PROJECTS
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Selected engineering work, products and experiments.
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            marginBottom: '2.5rem',
            paddingBottom: '1.5rem',
            borderBottom: '1px solid var(--border-subtle)'
          }}
        >
          {/* Search Box */}
          <div style={{ position: 'relative', maxWidth: '480px' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }}
            />
            <input
              type="text"
              placeholder="Search projects or technologies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input"
              style={{
                paddingLeft: '2.4rem',
                fontSize: '0.88rem',
                borderRadius: 'var(--radius-md)'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {categories.map((cat) => {
              const active = selectedCategory.toLowerCase() === cat.toLowerCase();
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    background: active ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                    color: active ? '#FFFFFF' : 'var(--text-secondary)',
                    border: `1px solid ${active ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.8rem',
                    fontWeight: active ? 600 : 450,
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Projects Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
          {loading ? (
            [1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="card" style={{ height: 380, display: 'flex', flexDirection: 'column' }}>
                <div className="skeleton" style={{ height: 190, width: '100%', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' }} />
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                  <div className="skeleton" style={{ height: 20, width: '60%' }} />
                  <div className="skeleton" style={{ height: 16, width: '100%' }} />
                  <div className="skeleton" style={{ height: 16, width: '40%', marginTop: 'auto' }} />
                </div>
              </div>
            ))
          ) : filteredProjects.length > 0 ? (
            filteredProjects.map((project) => (
              <article
                key={project.id || project.slug}
                className="card card-hover"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                {/* 16:9 Thumbnail / Video Wallpaper */}
                <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
                  <ProjectMedia
                    url={project.preview_url || project.thumbnail_url || project.featured_image_url}
                    type={project.preview_type}
                    title={project.title}
                    aspectRatio="56.25%"
                  />

                  <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: '0.35rem', zIndex: 2 }}>
                    {project.is_featured && (
                      <span className="badge-mono" style={{ backgroundColor: 'var(--accent-primary)', color: '#FFFFFF', border: 'none' }}>
                        Featured
                      </span>
                    )}
                    <span className="badge-mono" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>
                      {project.category || 'Full Stack'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                    <Link to={`/projects/${project.slug || project.id}`} style={{ color: 'inherit' }}>
                      {project.title}
                    </Link>
                  </h2>

                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem', flex: 1 }}>
                    {project.short_summary || project.problem_statement?.slice(0, 110) || 'Production application implementation.'}
                  </p>

                  {/* Tech stack badge row */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1.5rem' }}>
                    {Array.isArray(project.tech_stack)
                      ? project.tech_stack.slice(0, 4).map((tech, idx) => (
                          <span key={idx} className="badge-mono">
                            {tech}
                          </span>
                        ))
                      : null}
                  </div>

                  {/* Footer Action */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '1rem',
                      borderTop: '1px solid var(--border-subtle)',
                      marginTop: 'auto'
                    }}
                  >
                    <Link
                      to={`/projects/${project.slug || project.id}`}
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: 'var(--accent-primary)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                      className="case-study-btn"
                    >
                      Case Study <ArrowRight size={13} className="arrow-icon" />
                    </Link>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      {project.github_url && (
                        <a
                          href={project.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="GitHub Repository"
                          style={{ color: 'var(--text-secondary)' }}
                          title="View Repository"
                        >
                          <Github size={15} />
                        </a>
                      )}
                      {project.live_demo_url && (
                        <a
                          href={project.live_demo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Live Demo"
                          style={{ color: 'var(--text-secondary)' }}
                          title="Launch Live Site"
                        >
                          <ExternalLink size={15} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div
              style={{
                gridColumn: '1 / -1',
                padding: '4rem 2rem',
                textAlign: 'center',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-lg)'
              }}
            >
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.95rem' }}>
                No projects found matching &quot;{searchQuery}&quot;
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                className="btn btn-secondary btn-sm"
              >
                <RotateCcw size={13} /> Reset filters
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .project-thumb-img:hover {
          transform: scale(1.03);
        }
        .case-study-btn:hover .arrow-icon {
          transform: translateX(3px);
        }
        .arrow-icon {
          transition: transform var(--transition-fast);
        }
      `}</style>
    </div>
  );
}
