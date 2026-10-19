import { query, memoryStore } from '../../config/db.js';

export class ProfileService {
  /**
   * Public: Get profile information, site settings, education, and career summary
   */
  static async getPublicProfile() {
    const settingsRows = await query('SELECT setting_key, setting_value FROM site_settings');
    const settings = {};
    settingsRows.forEach(r => {
      settings[r.setting_key] = r.setting_value;
    });

    const education = await query('SELECT * FROM education ORDER BY display_order ASC');
    const certifications = await query('SELECT * FROM certifications ORDER BY display_order ASC');

    return {
      settings: Object.keys(settings).length > 0 ? settings : memoryStore.siteSettings,
      education: education.length > 0 ? education : memoryStore.education,
      certifications: certifications.length > 0 ? certifications : memoryStore.certifications
    };
  }

  /**
   * Public & Admin: Get career milestones
   */
  static async getExperiences(publishedOnly = true) {
    let sql = 'SELECT * FROM experiences';
    if (publishedOnly) {
      sql += ' WHERE is_published = 1';
    }
    sql += ' ORDER BY display_order ASC, start_date DESC';
    const rows = await query(sql);
    return rows.length > 0 ? rows : memoryStore.experiences;
  }

  /**
   * Public & Admin: Get categorized skills
   */
  static async getSkills() {
    const categories = await query('SELECT * FROM skill_categories ORDER BY display_order ASC');
    const skills = await query('SELECT * FROM skills ORDER BY display_order ASC');

    const cats = categories.length > 0 ? categories : memoryStore.skillCategories;
    const allSkills = skills.length > 0 ? skills : memoryStore.skills;

    return cats.map(cat => ({
      id: cat.id,
      name: cat.name,
      skills: allSkills.filter(s => s.category_id === cat.id)
    }));
  }

  /**
   * Admin: Update site settings
   */
  static async updateSettings(settingsObj) {
    for (const [key, val] of Object.entries(settingsObj)) {
      await query(
        `INSERT INTO site_settings (setting_key, setting_value, value_type) VALUES (?, ?, 'string') ON DUPLICATE KEY UPDATE setting_value = ?`,
        [key, val, val]
      );
      memoryStore.siteSettings[key] = val;
    }
    return { success: true };
  }

  /**
   * Admin: Add/Edit experience
   */
  static async saveExperience(exp) {
    if (exp.id) {
      await query(`
        UPDATE experiences SET
          role = ?, company = ?, location = ?, employment_type = ?,
          start_date = ?, end_date = ?, is_current = ?, description = ?,
          achievements = ?, display_order = ?, is_published = ?
        WHERE id = ?
      `, [
        exp.role, exp.company, exp.location || '', exp.employment_type || 'Full-time',
        exp.start_date, exp.end_date || null, exp.is_current ? 1 : 0, exp.description || '',
        JSON.stringify(exp.achievements || []), exp.display_order || 0, exp.is_published ? 1 : 0,
        exp.id
      ]);
    } else {
      await query(`
        INSERT INTO experiences (
          role, company, location, employment_type, start_date, end_date,
          is_current, description, achievements, display_order, is_published
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        exp.role, exp.company, exp.location || '', exp.employment_type || 'Full-time',
        exp.start_date, exp.end_date || null, exp.is_current ? 1 : 0, exp.description || '',
        JSON.stringify(exp.achievements || []), exp.display_order || 0, exp.is_published ? 1 : 0
      ]);
    }
    return { success: true };
  }

  /**
   * Admin: Delete experience
   */
  static async deleteExperience(id) {
    await query('DELETE FROM experiences WHERE id = ?', [id]);
    return { success: true, id };
  }

  /**
   * Admin: Add/Edit Skill
   */
  static async saveSkill(skill) {
    if (skill.id) {
      await query(`
        UPDATE skills SET
          category_id = ?, name = ?, icon_name = ?, display_order = ?, is_core = ?
        WHERE id = ?
      `, [skill.category_id, skill.name, skill.icon_name || '', skill.display_order || 0, skill.is_core ? 1 : 0, skill.id]);
    } else {
      await query(`
        INSERT INTO skills (category_id, name, icon_name, display_order, is_core)
        VALUES (?, ?, ?, ?, ?)
      `, [skill.category_id, skill.name, skill.icon_name || '', skill.display_order || 0, skill.is_core ? 1 : 0]);
    }
    return { success: true };
  }

  /**
   * Admin: Delete Skill
   */
  static async deleteSkill(id) {
    await query('DELETE FROM skills WHERE id = ?', [id]);
    return { success: true, id };
  }
}
