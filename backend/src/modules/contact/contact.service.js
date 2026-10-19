import { query, memoryStore } from '../../config/db.js';

export class ContactService {
  /**
   * Submit new contact message from public portfolio
   */
  static async submitMessage({ name, email, subject, message, ipAddress, honeypot }) {
    // If honeypot filled out, silently discard bot submission
    if (honeypot) {
      console.warn(`[Security] Bot contact submission detected and dropped from IP: ${ipAddress}`);
      return { success: true };
    }

    if (!name || !email || !message) {
      throw new Error('Name, email, and message are required fields.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Please provide a valid email address.');
    }

    if (!message || message.trim().length === 0) {
      throw new Error('Message is a required field.');
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanSubject = subject && subject.trim() ? subject.trim() : 'Portfolio Contact Message';
    const cleanMessage = message.trim();
    const cleanIp = ipAddress || '';

    // Cache message in memory store
    const memItem = {
      id: Date.now(),
      sender_name: cleanName,
      sender_email: cleanEmail,
      subject: cleanSubject,
      message: cleanMessage,
      is_read: false,
      ip_address: cleanIp,
      received_at: new Date()
    };
    memoryStore.contactMessages.unshift(memItem);

    try {
      const dbResult = await query(`
        INSERT INTO contact_messages (sender_name, sender_email, subject, message, is_read, ip_address)
        VALUES (?, ?, ?, ?, 0, ?)
      `, [cleanName, cleanEmail, cleanSubject, cleanMessage, cleanIp]);

      if (dbResult && dbResult.insertId) {
        memItem.id = dbResult.insertId;
      }
    } catch (err) {
      console.warn('[ContactService] Notice: Could not save to remote DB, preserved in memory store:', err.message);
    }

    return { success: true, message: 'Your message has been sent successfully. I will get back to you shortly!' };
  }

  /**
   * Admin: List messages with unread counts
   */
  static async getMessages() {
    try {
      const messages = await query('SELECT * FROM contact_messages ORDER BY received_at DESC');
      if (Array.isArray(messages) && messages.length > 0) {
        // Synchronize in-memory store with remote DB records
        memoryStore.contactMessages = messages;
        return messages;
      }
    } catch (err) {
      console.warn('[ContactService] Query failed from remote DB, using memory store:', err.message);
    }
    return memoryStore.contactMessages || [];
  }

  /**
   * Admin: Mark message as read
   */
  static async markAsRead(id) {
    try {
      await query('UPDATE contact_messages SET is_read = 1 WHERE id = ?', [id]);
    } catch (err) {
      console.warn('[ContactService] Error updating read status in DB:', err.message);
    }
    const memMsg = memoryStore.contactMessages.find(m => Number(m.id) === Number(id));
    if (memMsg) memMsg.is_read = true;
    return { success: true, id };
  }

  /**
   * Admin: Delete message
   */
  static async deleteMessage(id) {
    try {
      await query('DELETE FROM contact_messages WHERE id = ?', [id]);
    } catch (err) {
      console.warn('[ContactService] Error deleting message from DB:', err.message);
    }
    memoryStore.contactMessages = memoryStore.contactMessages.filter(m => Number(m.id) !== Number(id));
    return { success: true, id };
  }
}
