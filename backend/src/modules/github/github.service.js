import { config } from '../../config/env.js';
import { query, memoryStore } from '../../config/db.js';

export class GitHubService {
  /**
   * Builds standardized GitHub headers with Bearer authentication
   * Supports fine-grained PATs (github_pat_*) and classic tokens (ghp_*)
   */
  static getHeaders(customAccept = 'application/vnd.github.v3+json') {
    const headers = {
      'User-Agent': 'Portfolio-CMS-Service/1.0',
      'Accept': customAccept
    };

    if (config.github.token) {
      const token = config.github.token.trim();
      headers['Authorization'] = token.startsWith('Bearer ') || token.startsWith('token ')
        ? token
        : `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Fetch repositories for the configured username
   * Checks against existing imported projects in TiDB
   */
  static async fetchRepositories() {
    const username = config.github.username;
    const url = `https://api.github.com/users/${username}/repos?sort=updated&per_page=100`;

    const headers = this.getHeaders('application/vnd.github.v3+json');

    const response = await fetch(url, { headers });

    if (!response.ok) {
      let errDetails = response.statusText;
      try {
        const errorJson = await response.json();
        if (errorJson?.message) {
          errDetails = errorJson.message;
        }
      } catch {
        // Fallback to statusText
      }

      if (response.status === 403 && errDetails.toLowerCase().includes('rate limit')) {
        throw new Error(
          'GitHub API rate limit exceeded. Authenticate by setting GITHUB_PERSONAL_ACCESS_TOKEN in your environment variables (on Render and local .env).'
        );
      }

      throw new Error(`GitHub API returned status ${response.status}: ${errDetails}`);
    }

    const repos = await response.json();

    // Query existing imported projects
    const existingProjects = await query('SELECT id, github_repo_id, github_repo_name, is_published, slug FROM projects WHERE github_repo_id IS NOT NULL');
    const existingMap = new Map();
    existingProjects.forEach(p => {
      existingMap.set(String(p.github_repo_id), p);
    });

    // Format and annotate with import status
    const formatted = repos.map(repo => {
      const existing = existingMap.get(String(repo.id));
      return {
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        htmlUrl: repo.html_url,
        homepage: repo.homepage,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        language: repo.language,
        topics: repo.topics || [],
        updatedAt: repo.updated_at,
        isFork: repo.fork,
        isImported: !!existing,
        existingProjectId: existing ? existing.id : null,
        isPublished: existing ? !!existing.is_published : false,
        slug: existing ? existing.slug : null
      };
    });

    return formatted;
  }

  /**
   * Fetches the real markdown README content from a repository
   */
  static async fetchReadme(repoOwner, repoName) {
    try {
      const url = `https://api.github.com/repos/${repoOwner}/${repoName}/readme`;
      const headers = this.getHeaders('application/vnd.github.raw+json');
      const response = await fetch(url, { headers });
      if (response.ok) {
        const text = await response.text();
        if (text && text.trim()) return text;
      }
    } catch (err) {
      console.warn(`[GitHubService] Could not fetch README for ${repoOwner}/${repoName}:`, err.message);
    }
    return null;
  }

  /**
   * Import repository into the portfolio database
   * Creates a draft project ready for case-study enrichment
   */
  static async importRepository(repoId) {
    const repos = await this.fetchRepositories();
    const repo = repos.find(r => String(r.id) === String(repoId));

    if (!repo) {
      throw new Error('Repository not found on GitHub account.');
    }

    // Check if already imported
    const existing = await query('SELECT id FROM projects WHERE github_repo_id = ?', [repo.id]);
    if (existing.length > 0) {
      throw new Error('This repository has already been imported into your portfolio.');
    }

    // Generate unique slug
    const baseSlug = repo.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const existingSlug = await query('SELECT id FROM projects WHERE slug = ?', [baseSlug]);
    const finalSlug = existingSlug.length > 0 ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug;

    // Get next display order
    const countRows = await query('SELECT COUNT(*) as count FROM projects');
    const nextOrder = (countRows[0]?.count || 0) + 1;

    // Fetch live README from GitHub repository
    const username = config.github.username || 'pushkar-0553';
    const fetchedReadme = await this.fetchReadme(username, repo.name);
    const initialContent = fetchedReadme || `## Overview\n\n${repo.description || 'Detailed technical case study in progress.'}\n\n## Technology Stack\n* Primary Language: ${repo.language || 'General'}\n* Source Code: [GitHub Repository](${repo.htmlUrl})`;

    // Create draft project
    const result = await query(`
      INSERT INTO projects (
        slug, title, short_summary, full_content, problem, solution, my_role,
        architecture_details, challenges, results_metrics, lessons_learned,
        preview_type, preview_url, github_repo_id, github_repo_name, github_repo_url,
        live_demo_url, category, is_featured, is_published, display_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `, [
      finalSlug,
      repo.name.replace(/[-_]/g, ' '),
      repo.description || `Technical project built with ${repo.language || 'modern web technologies'}.`,
      initialContent,
      'Define the core problem this project solves.',
      'Detail the technical implementation and architectural approach.',
      'Lead Developer & Architect',
      `Built with ${repo.language || 'modern web frameworks'} and clean modular components.`,
      'Key engineering trade-offs and edge-case handling.',
      'Measurable results and test outcomes.',
      'Retrospective takeaways and future enhancements.',
      'image',
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&q=80',
      repo.id,
      repo.name,
      repo.htmlUrl,
      repo.homepage || '',
      repo.language || 'Full Stack',
      0, // is_featured
      nextOrder
    ]);

    const newId = result.insertId || memoryStore.projects.length + 1;
    const imported = await query('SELECT * FROM projects WHERE id = ?', [newId]);
    return imported[0] || { id: newId, slug: finalSlug, title: repo.name };
  }

  /**
   * Sync metrics from GitHub without overwriting custom case study editorial content
   */
  static async syncProject(projectId) {
    const projects = await query('SELECT * FROM projects WHERE id = ?', [projectId]);
    const project = projects[0];

    if (!project || !project.github_repo_id) {
      throw new Error('Project not found or not linked to a GitHub repository.');
    }

    const repos = await this.fetchRepositories();
    const repo = repos.find(r => String(r.id) === String(project.github_repo_id));

    if (!repo) {
      throw new Error('Corresponding repository not found on GitHub.');
    }

    // Try to update README if project doesn't have custom full_content
    const username = config.github.username || 'pushkar-0553';
    const fetchedReadme = await this.fetchReadme(username, repo.name);

    if (fetchedReadme && (!project.full_content || project.full_content.startsWith('## Overview'))) {
      await query(`
        UPDATE projects SET
          github_repo_name = ?,
          github_repo_url = ?,
          full_content = ?,
          live_demo_url = CASE WHEN live_demo_url IS NULL OR live_demo_url = '' THEN ? ELSE live_demo_url END,
          updated_at = NOW()
        WHERE id = ?
      `, [repo.name, repo.htmlUrl, fetchedReadme, repo.homepage || '', projectId]);
    } else {
      await query(`
        UPDATE projects SET
          github_repo_name = ?,
          github_repo_url = ?,
          live_demo_url = CASE WHEN live_demo_url IS NULL OR live_demo_url = '' THEN ? ELSE live_demo_url END,
          updated_at = NOW()
        WHERE id = ?
      `, [repo.name, repo.htmlUrl, repo.homepage || '', projectId]);
    }

    return { success: true, message: 'Metadata and README refreshed from GitHub.' };
  }
}
