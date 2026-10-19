import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight, RotateCcw } from 'lucide-react';

export function SkillsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = [
    { id: 'All', name: 'All Ecosystem' },
    { id: 'Frontend', name: 'Frontend' },
    { id: 'Backend', name: 'Backend' },
    { id: 'Database', name: 'Database & Cloud' },
    { id: 'Tools', name: 'Tools & DevOps' }
  ];

  const skillItems = [
    // Frontend
    {
      name: 'React 19 / 18',
      category: 'Frontend',
      description: 'Single-page applications, custom hooks, memoization, lifecycle optimization, and accessible component architectures.',
      tags: ['Hooks', 'Context', 'SPA', 'Vite']
    },
    {
      name: 'JavaScript (ES6+)',
      category: 'Frontend',
      description: 'Modern asynchronous workflows, closures, event loop mechanics, Web APIs, and DOM manipulation.',
      tags: ['Async/Await', 'Event Loop', 'DOM']
    },
    {
      name: 'TypeScript',
      category: 'Frontend',
      description: 'Static type contracts, generics, interface declaration, and compiler configurations for maintainable frontend code.',
      tags: ['Static Typing', 'Generics', 'Contracts']
    },
    {
      name: 'HTML5 & CSS3',
      category: 'Frontend',
      description: 'Semantic markup, accessible structures (WCAG), CSS Grid, Flexbox, custom properties, and fluid typography.',
      tags: ['Semantic HTML', 'CSS Grid', 'Flexbox']
    },
    {
      name: 'Design Tokens & Systems',
      category: 'Frontend',
      description: 'Systematic CSS custom property palettes, dark/light theme switching, and responsive design guidelines.',
      tags: ['CSS Variables', 'Theming', 'Tokens']
    },

    // Backend
    {
      name: 'Node.js & Express',
      category: 'Backend',
      description: 'Event-driven server architecture, decoupled middleware pipelines, JWT authentication, and secure request handling.',
      tags: ['Express', 'Middleware', 'JWT']
    },
    {
      name: 'Java (Core & EE)',
      category: 'Backend',
      description: 'Object-oriented programming, multithreading, concurrency utilities, JVM internals, and clean design patterns.',
      tags: ['OOP', 'Concurrency', 'JVM']
    },
    {
      name: 'Spring Boot',
      category: 'Backend',
      description: 'RESTful API controllers, dependency injection, Spring Data JPA, security filters, and modular services.',
      tags: ['Spring MVC', 'JPA', 'IoC']
    },
    {
      name: 'RESTful API Engineering',
      category: 'Backend',
      description: 'HTTP verb semantics, structured JSON contracts, pagination, error formatting, and idempotency.',
      tags: ['API Design', 'Contracts', 'JSON']
    },

    // Database & Cloud
    {
      name: 'TiDB Cloud (Distributed SQL)',
      category: 'Database',
      description: 'Serverless distributed SQL clusters, connection pooling, SSL certification, and transactional ACID guarantees.',
      tags: ['Distributed SQL', 'ACID', 'SSL']
    },
    {
      name: 'MySQL & Relational Design',
      category: 'Database',
      description: 'Schema normalization, indexing strategies, primary/foreign key relationships, and query optimization.',
      tags: ['Indexing', 'Normalization', 'SQL']
    },
    {
      name: 'Cloudflare & Vercel',
      category: 'Database',
      description: 'Global edge distribution, custom DNS orchestration, environment variables isolation, and continuous deployment.',
      tags: ['Edge', 'DNS', 'Deployment']
    },

    // Tools
    {
      name: 'Git & GitHub',
      category: 'Tools',
      description: 'Semantic versioning, branching strategies, code review workflows, and GitHub REST API integration.',
      tags: ['Git', 'Branching', 'GitHub API']
    },
    {
      name: 'UiPath & RPA',
      category: 'Tools',
      description: 'Enterprise robotic automation workflows, queue-based transaction handling, and document processing.',
      tags: ['Robotic Automation', 'OCR', 'Queues']
    },
    {
      name: 'Postman & Testing',
      category: 'Tools',
      description: 'API endpoint validation, automated test assertion suites, and mock environment configuration.',
      tags: ['Test Assertions', 'Mocking', 'Contracts']
    }
  ];

  const filteredSkills = useMemo(() => {
    return skillItems.filter((item) => {
      const matchesCat = activeCategory === 'All' || item.category === activeCategory;
      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchesCat;

      const nameMatch = item.name.toLowerCase().includes(query);
      const descMatch = item.description.toLowerCase().includes(query);
      const tagMatch = item.tags.some((t) => t.toLowerCase().includes(query));

      return matchesCat && (nameMatch || descMatch || tagMatch);
    });
  }, [skillItems, activeCategory, searchQuery]);

  return (
    <div className="section" style={{ paddingTop: '3.5rem', paddingBottom: '6rem' }}>
      <div className="container">
        {/* Header */}
        <div style={{ maxWidth: '780px', marginBottom: '3rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-primary)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '0.5rem' }}>
            Technical Capabilities
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
            SKILLS
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Languages, frameworks, databases and toolchains deployed in engineering projects.
          </p>
        </div>

        {/* Controls: Search and Categories */}
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
          {/* Search */}
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
              placeholder="Search technologies, e.g. React, Node, TiDB..."
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
              const active = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
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
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Skills Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {filteredSkills.length > 0 ? (
            filteredSkills.map((skill) => (
              <div
                key={skill.name}
                className="card card-hover"
                style={{
                  padding: '1.5rem',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {skill.name}
                  </h2>
                  <span className="badge-mono" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--accent-primary)' }}>
                    {skill.category}
                  </span>
                </div>

                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, flex: 1 }}>
                  {skill.description}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                  {skill.tags.map((t) => (
                    <span key={t} className="badge-mono" style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem' }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
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
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1rem' }}>
                No technology found matching &quot;{searchQuery}&quot;
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('All');
                }}
                className="btn btn-secondary btn-sm"
              >
                <RotateCcw size={13} /> Reset filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
