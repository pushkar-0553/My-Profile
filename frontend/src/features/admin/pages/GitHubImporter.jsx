import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Github, Star, GitFork, RefreshCw, CheckCircle2, ArrowRight, Download, Search } from 'lucide-react';
import { apiRequest } from '../../../common/utils/api.js';

export function GitHubImporter() {
  const navigate = useNavigate();
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importingId, setImportingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  const fetchRepos = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiRequest('/admin/github/repositories');
      setRepos(data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch repositories from GitHub.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepos();
  }, []);

  const handleImport = async (repoId) => {
    setImportingId(repoId);
    try {
      const created = await apiRequest('/admin/github/import', {
        method: 'POST',
        body: JSON.stringify({ repoId })
      });
      // Redirect straight to project editor to enrich the draft case study
      navigate(`/admin/projects/${created.id}/edit`);
    } catch (err) {
      alert(err.message || 'Failed to import repository.');
      setImportingId(null);
    }
  };

  const filteredRepos = repos.filter(r =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.description && r.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (r.language && r.language.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>GitHub Repository Ingestion</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Discover and import GitHub repositories into your portfolio database as draft case studies.
          </p>
        </div>

        <button onClick={fetchRepos} disabled={loading} className="btn btn-secondary btn-sm" style={{ gap: '0.4rem' }}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh from GitHub
        </button>
      </div>

      {error && (
        <div style={{ padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {/* Search Input */}
      <div style={{ marginBottom: '1.5rem', position: 'relative', maxWidth: 420 }}>
        <input
          type="text"
          className="input"
          placeholder="Filter repositories by name, language, or topic..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Repository Cards Grid */}
      {loading ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Connecting to GitHub API and checking database staging...
        </div>
      ) : filteredRepos.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          No repositories found matching your filter criteria.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
          {filteredRepos.map((repo) => (
            <div key={repo.id} className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)' }}>{repo.name}</h3>
                {repo.isImported ? (
                  <span className="badge badge-success" style={{ gap: '0.35rem', flexShrink: 0 }}>
                    <CheckCircle2 size={13} /> Imported
                  </span>
                ) : (
                  <span className="badge" style={{ flexShrink: 0 }}>Available</span>
                )}
              </div>

              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', flex: 1, minHeight: 40 }}>
                {repo.description || 'No repository description provided on GitHub.'}
              </p>

              {/* Badges / Stats */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                {repo.language && (
                  <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>
                    {repo.language}
                  </span>
                )}
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Star size={14} /> {repo.stars}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <GitFork size={14} /> {repo.forks}
                </span>
              </div>

              {/* Action Buttons */}
              <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <a
                  href={repo.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '0.825rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  <Github size={14} /> View on GitHub
                </a>

                {repo.isImported ? (
                  <Link to={`/admin/projects/${repo.existingProjectId}/edit`} className="btn btn-secondary btn-sm" style={{ gap: '0.35rem' }}>
                    Edit Case Study <ArrowRight size={14} />
                  </Link>
                ) : (
                  <button
                    onClick={() => handleImport(repo.id)}
                    disabled={importingId === repo.id}
                    className="btn btn-primary btn-sm"
                    style={{ gap: '0.35rem' }}
                  >
                    <Download size={14} /> {importingId === repo.id ? 'Importing...' : 'Import to Portfolio'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
