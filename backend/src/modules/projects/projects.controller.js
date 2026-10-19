import { ProjectsService } from './projects.service.js';

export class ProjectsController {
  // Public handlers
  static async getPublicProjects(req, res) {
    try {
      const { category, featured } = req.query;
      const projects = await ProjectsService.getPublicProjects({
        category,
        featuredOnly: featured === 'true'
      });
      return res.json(projects);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getPublicProjectBySlug(req, res) {
    try {
      const { slug } = req.params;
      const project = await ProjectsService.getPublicProjectBySlug(slug);
      if (!project) {
        return res.status(404).json({ error: 'Project case study not found.' });
      }
      return res.json(project);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Admin handlers
  static async getAllAdminProjects(req, res) {
    try {
      const projects = await ProjectsService.getAllAdminProjects();
      return res.json(projects);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getProjectById(req, res) {
    try {
      const { id } = req.params;
      const project = await ProjectsService.getProjectById(id);
      if (!project) {
        return res.status(404).json({ error: 'Project not found.' });
      }
      return res.json(project);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async createProject(req, res) {
    try {
      const project = await ProjectsService.createProject(req.body);
      return res.status(201).json(project);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async updateProject(req, res) {
    try {
      const { id } = req.params;
      const project = await ProjectsService.updateProject(id, req.body);
      return res.json(project);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async deleteProject(req, res) {
    try {
      const { id } = req.params;
      const result = await ProjectsService.deleteProject(id);
      return res.json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async togglePublish(req, res) {
    try {
      const { id } = req.params;
      const result = await ProjectsService.togglePublish(id);
      return res.json(result);
    } catch (error) {
      console.error('[ProjectsController] togglePublish error:', error.message);
      return res.status(error.message === 'Project not found' ? 404 : 500).json({ error: error.message });
    }
  }

  static async toggleFeatured(req, res) {
    try {
      const { id } = req.params;
      const result = await ProjectsService.toggleFeatured(id);
      return res.json(result);
    } catch (error) {
      console.error('[ProjectsController] toggleFeatured error:', error.message);
      return res.status(error.message === 'Project not found' ? 404 : 500).json({ error: error.message });
    }
  }

  static async reorderProjects(req, res) {
    try {
      const { orders } = req.body; // array of { id, display_order }
      if (!Array.isArray(orders)) {
        return res.status(400).json({ error: 'orders must be an array of { id, display_order }' });
      }
      const result = await ProjectsService.reorderProjects(orders);
      return res.json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
}
