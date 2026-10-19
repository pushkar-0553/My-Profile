import { query, memoryStore } from '../../config/db.js';

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

function formatProject(p) {
  if (!p) return null;
  let ds = p.display_settings;
  if (typeof ds === 'string') {
    try {
      ds = JSON.parse(ds);
    } catch {
      ds = {};
    }
  } else if (!ds || typeof ds !== 'object') {
    ds = {};
  }
  return { ...p, display_settings: ds };
}

export class ProjectsService {
  /**
   * Public: List all published projects ordered by display_order
   */
  static async getPublicProjects({ category, featuredOnly = false } = {}) {
    let sql = `
      SELECT 
        id, slug, title, short_summary, category, preview_type, preview_url, 
        live_demo_url, github_repo_url, figma_url, is_featured, display_order, 
        display_settings, created_at 
      FROM projects 
      WHERE is_published = 1
    `;
    const params = [];

    if (featuredOnly) {
      sql += ' AND is_featured = 1';
    }

    if (category && category !== 'All') {
      sql += ' AND category = ?';
      params.push(category);
    }

    sql += ' ORDER BY display_order ASC, created_at DESC';

    const projects = await query(sql, params);
    return projects.map(formatProject);
  }

  /**
   * Public: Get single project case-study by unique slug
   */
  static async getPublicProjectBySlug(slug) {
    const projects = await query('SELECT * FROM projects WHERE slug = ? AND is_published = 1', [slug]);
    const project = formatProject(projects[0]);

    if (!project) {
      return null;
    }

    // Fetch related published projects (excluding current)
    const related = await query(
      'SELECT id, slug, title, short_summary, category, preview_type, preview_url FROM projects WHERE is_published = 1 AND slug != ? ORDER BY display_order ASC LIMIT 3',
      [slug]
    );

    return {
      ...project,
      relatedProjects: related.map(formatProject)
    };
  }

  /**
   * Admin: List all projects (drafts + published) with stats
   */
  static async getAllAdminProjects() {
    const projects = await query('SELECT * FROM projects ORDER BY display_order ASC, created_at DESC');
    return projects.map(formatProject);
  }

  /**
   * Admin: Get project by ID for editor
   */
  static async getProjectById(id) {
    const projects = await query('SELECT * FROM projects WHERE id = ?', [id]);
    return formatProject(projects[0]) || null;
  }

  /**
   * Admin: Create a new project
   */
  static async createProject(data) {
    const slug = data.slug ? slugify(data.slug) : slugify(data.title);
    
    // Check if slug is unique
    const existing = await query('SELECT id FROM projects WHERE slug = ?', [slug]);
    const finalSlug = existing.length > 0 ? `${slug}-${Date.now().toString().slice(-4)}` : slug;

    // Determine default display order
    const countRows = await query('SELECT COUNT(*) as count FROM projects');
    const nextOrder = (countRows[0]?.count || 0) + 1;

    const displaySettingsStr = typeof data.display_settings === 'object'
      ? JSON.stringify(data.display_settings)
      : (data.display_settings || '{}');

    let result;
    try {
      result = await query(`
        INSERT INTO projects (
          slug, title, short_summary, full_content, problem, solution, my_role,
          architecture_details, challenges, results_metrics, lessons_learned,
          preview_type, preview_url, github_repo_id, github_repo_name, github_repo_url,
          live_demo_url, figma_url, category, is_featured, is_published, display_order, display_settings
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        finalSlug,
        data.title,
        data.short_summary || '',
        data.full_content || '',
        data.problem || '',
        data.solution || '',
        data.my_role || '',
        data.architecture_details || '',
        data.challenges || '',
        data.results_metrics || '',
        data.lessons_learned || '',
        data.preview_type || 'image',
        data.preview_url || '',
        data.github_repo_id || null,
        data.github_repo_name || null,
        data.github_repo_url || '',
        data.live_demo_url || '',
        data.figma_url || '',
        data.category || 'Full Stack',
        data.is_featured ? 1 : 0,
        data.is_published ? 1 : 0,
        data.display_order ?? nextOrder,
        displaySettingsStr
      ]);
    } catch {
      result = await query(`
        INSERT INTO projects (
          slug, title, short_summary, full_content, problem, solution, my_role,
          architecture_details, challenges, results_metrics, lessons_learned,
          preview_type, preview_url, github_repo_id, github_repo_name, github_repo_url,
          live_demo_url, figma_url, category, is_featured, is_published, display_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        finalSlug,
        data.title,
        data.short_summary || '',
        data.full_content || '',
        data.problem || '',
        data.solution || '',
        data.my_role || '',
        data.architecture_details || '',
        data.challenges || '',
        data.results_metrics || '',
        data.lessons_learned || '',
        data.preview_type || 'image',
        data.preview_url || '',
        data.github_repo_id || null,
        data.github_repo_name || null,
        data.github_repo_url || '',
        data.live_demo_url || '',
        data.figma_url || '',
        data.category || 'Full Stack',
        data.is_featured ? 1 : 0,
        data.is_published ? 1 : 0,
        data.display_order ?? nextOrder
      ]);
    }

    const newId = result.insertId || memoryStore.projects.length + 1;
    const createdProject = await this.getProjectById(newId);
    if (createdProject && data.display_settings) {
      createdProject.display_settings = typeof data.display_settings === 'string'
        ? JSON.parse(data.display_settings || '{}')
        : data.display_settings;
    }
    return createdProject;
  }

  /**
   * Admin: Update project case-study details
   */
  static async updateProject(id, data) {
    const displaySettingsStr = typeof data.display_settings === 'object'
      ? JSON.stringify(data.display_settings)
      : (data.display_settings || '{}');

    try {
      await query(`
        UPDATE projects SET
          title = ?,
          short_summary = ?,
          full_content = ?,
          problem = ?,
          solution = ?,
          my_role = ?,
          architecture_details = ?,
          challenges = ?,
          results_metrics = ?,
          lessons_learned = ?,
          preview_type = ?,
          preview_url = ?,
          github_repo_url = ?,
          live_demo_url = ?,
          figma_url = ?,
          category = ?,
          is_featured = ?,
          is_published = ?,
          display_order = ?,
          display_settings = ?,
          updated_at = NOW()
        WHERE id = ?
      `, [
        data.title ?? '',
        data.short_summary ?? '',
        data.full_content ?? '',
        data.problem ?? '',
        data.solution ?? '',
        data.my_role ?? '',
        data.architecture_details ?? '',
        data.challenges ?? '',
        data.results_metrics ?? '',
        data.lessons_learned ?? '',
        data.preview_type ?? 'image',
        data.preview_url ?? '',
        data.github_repo_url ?? '',
        data.live_demo_url ?? '',
        data.figma_url ?? '',
        data.category ?? 'Full Stack',
        data.is_featured ? 1 : 0,
        data.is_published ? 1 : 0,
        data.display_order ?? 0,
        displaySettingsStr,
        id
      ]);
    } catch {
      await query(`
        UPDATE projects SET
          title = ?,
          short_summary = ?,
          full_content = ?,
          problem = ?,
          solution = ?,
          my_role = ?,
          architecture_details = ?,
          challenges = ?,
          results_metrics = ?,
          lessons_learned = ?,
          preview_type = ?,
          preview_url = ?,
          github_repo_url = ?,
          live_demo_url = ?,
          figma_url = ?,
          category = ?,
          is_featured = ?,
          is_published = ?,
          display_order = ?,
          updated_at = NOW()
        WHERE id = ?
      `, [
        data.title ?? '',
        data.short_summary ?? '',
        data.full_content ?? '',
        data.problem ?? '',
        data.solution ?? '',
        data.my_role ?? '',
        data.architecture_details ?? '',
        data.challenges ?? '',
        data.results_metrics ?? '',
        data.lessons_learned ?? '',
        data.preview_type ?? 'image',
        data.preview_url ?? '',
        data.github_repo_url ?? '',
        data.live_demo_url ?? '',
        data.figma_url ?? '',
        data.category ?? 'Full Stack',
        data.is_featured ? 1 : 0,
        data.is_published ? 1 : 0,
        data.display_order ?? 0,
        id
      ]);
    }

    // Also update in-memory fallback store if active
    const memProj = memoryStore.projects.find(p => p.id === Number(id));
    if (memProj) {
      Object.assign(memProj, data, {
        display_settings: typeof data.display_settings === 'string'
          ? JSON.parse(data.display_settings || '{}')
          : (data.display_settings || {}),
        updated_at: new Date()
      });
    }

    return this.getProjectById(id);
  }

  /**
   * Admin: Delete project
   */
  static async deleteProject(id) {
    await query('DELETE FROM projects WHERE id = ?', [id]);
    memoryStore.projects = memoryStore.projects.filter(p => p.id !== Number(id));
    return { success: true, id };
  }

  /**
   * Admin: Toggle published status
   */
  static async togglePublish(id) {
    const project = await this.getProjectById(id);
    if (!project) throw new Error('Project not found');

    const newStatus = Boolean(project.is_published) ? 0 : 1;
    await query('UPDATE projects SET is_published = ? WHERE id = ?', [newStatus, id]);
    
    const memProj = memoryStore.projects.find(p => Number(p.id) === Number(id));
    if (memProj) memProj.is_published = newStatus;

    return { id: Number(id), is_published: Boolean(newStatus) };
  }

  /**
   * Admin: Toggle featured status
   */
  static async toggleFeatured(id) {
    const project = await this.getProjectById(id);
    if (!project) throw new Error('Project not found');

    const newStatus = Boolean(project.is_featured) ? 0 : 1;
    await query('UPDATE projects SET is_featured = ? WHERE id = ?', [newStatus, id]);

    const memProj = memoryStore.projects.find(p => Number(p.id) === Number(id));
    if (memProj) memProj.is_featured = newStatus;

    return { id: Number(id), is_featured: Boolean(newStatus) };
  }

  /**
   * Admin: Persist reordered array of projects [{ id, display_order }]
   */
  static async reorderProjects(orderList) {
    for (const item of orderList) {
      await query('UPDATE projects SET display_order = ? WHERE id = ?', [item.display_order, item.id]);
      const memProj = memoryStore.projects.find(p => Number(p.id) === Number(item.id));
      if (memProj) memProj.display_order = item.display_order;
    }
    return { success: true };
  }
}
