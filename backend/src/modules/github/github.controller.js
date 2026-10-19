import { GitHubService } from './github.service.js';

export class GitHubController {
  static async getRepositories(req, res) {
    try {
      const repos = await GitHubService.fetchRepositories();
      return res.json(repos);
    } catch (error) {
      return res.status(502).json({ error: error.message });
    }
  }

  static async importRepository(req, res) {
    try {
      const { repoId } = req.body;
      if (!repoId) {
        return res.status(400).json({ error: 'repoId is required to import.' });
      }
      const project = await GitHubService.importRepository(repoId);
      return res.status(201).json(project);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async syncProject(req, res) {
    try {
      const { id } = req.params;
      const result = await GitHubService.syncProject(id);
      return res.json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
}
