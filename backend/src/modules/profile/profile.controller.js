import { ProfileService } from './profile.service.js';

export class ProfileController {
  static async getPublicProfile(req, res) {
    try {
      const data = await ProfileService.getPublicProfile();
      return res.json(data);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getExperiences(req, res) {
    try {
      const isPublic = req.path.includes('/public/');
      const data = await ProfileService.getExperiences(isPublic);
      return res.json(data);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getSkills(req, res) {
    try {
      const data = await ProfileService.getSkills();
      return res.json(data);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async updateSettings(req, res) {
    try {
      const result = await ProfileService.updateSettings(req.body);
      return res.json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async saveExperience(req, res) {
    try {
      const result = await ProfileService.saveExperience(req.body);
      return res.json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async deleteExperience(req, res) {
    try {
      const { id } = req.params;
      const result = await ProfileService.deleteExperience(id);
      return res.json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async saveSkill(req, res) {
    try {
      const result = await ProfileService.saveSkill(req.body);
      return res.json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async deleteSkill(req, res) {
    try {
      const { id } = req.params;
      const result = await ProfileService.deleteSkill(id);
      return res.json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
}
