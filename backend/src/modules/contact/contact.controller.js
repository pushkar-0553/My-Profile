import { ContactService } from './contact.service.js';

export class ContactController {
  static async submitMessage(req, res) {
    try {
      const { name, email, subject, message, hp_company } = req.body;
      const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

      const result = await ContactService.submitMessage({
        name,
        email,
        subject,
        message,
        ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
        honeypot: hp_company // Hidden honeypot field
      });

      return res.status(201).json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async getMessages(req, res) {
    try {
      const messages = await ContactService.getMessages();
      return res.json(messages || []);
    } catch (error) {
      console.error('[ContactController] Error loading messages:', error);
      return res.json([]);
    }
  }

  static async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const result = await ContactService.markAsRead(id);
      return res.json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async deleteMessage(req, res) {
    try {
      const { id } = req.params;
      const result = await ContactService.deleteMessage(id);
      return res.json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
}
