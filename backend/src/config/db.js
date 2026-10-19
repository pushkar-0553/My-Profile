import mysql from 'mysql2/promise';
import { config } from './env.js';

let pool = null;
let isConnected = false;
let heartbeatTimer = null;
let reconnectingPromise = null;

function createPoolConfig() {
  const poolConfig = {
    host: config.tidb.host,
    port: config.tidb.port,
    user: config.tidb.user,
    password: config.tidb.password,
    database: config.tidb.database,
    waitForConnections: true,
    connectionLimit: 5,
    maxIdle: 5,
    idleTimeout: 60000, // Close idle connections after 60s so pool never holds dead sockets
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    connectTimeout: 20000
  };

  // TiDB Cloud Serverless requires TLS encryption
  if (config.tidb.enableSsl) {
    poolConfig.ssl = {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: false // Connects over TLS without requiring manual CA file download
    };
  }

  return poolConfig;
}

// Start active keep-alive heartbeat every 30s to prevent TiDB idle disconnects
function startHeartbeat() {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(async () => {
    if (!pool) return;
    try {
      await pool.query('SELECT 1');
      if (!isConnected) {
        isConnected = true;
        console.log('[Database] TiDB connection verified and active.');
      }
    } catch (err) {
      console.warn(`[Database] Heartbeat ping notice: ${err.message}. Attempting auto-recovery...`);
      isConnected = false;
      tryReconnect().catch(() => {});
    }
  }, 30000);
  if (heartbeatTimer.unref) heartbeatTimer.unref();
}

/**
 * Initialize or re-initialize database pool
 */
export async function initDatabase() {
  if (reconnectingPromise) return reconnectingPromise;

  reconnectingPromise = (async () => {
    try {
      if (pool) {
        try {
          await pool.end();
        } catch {
          // ignore cleanup errors on old dead pool
        }
      }

      const poolConfig = createPoolConfig();
      const newPool = mysql.createPool(poolConfig);

      // Handle connection-level errors gracefully
      newPool.on('error', (err) => {
        console.warn(`[Database] Pool socket notice: ${err.message}`);
        if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET' || err.fatal) {
          isConnected = false;
        }
      });

      const connection = await newPool.getConnection();
      await connection.ping();
      connection.release();

      pool = newPool;
      isConnected = true;
      console.log(`[Database] Connected successfully to TiDB / MySQL at ${config.tidb.host}:${config.tidb.port}/${config.tidb.database}`);

      startHeartbeat();

      // Ensure display_settings column exists in projects table if on live TiDB/MySQL
      try {
        await newPool.query("ALTER TABLE projects ADD COLUMN display_settings TEXT NULL");
      } catch {
        // column likely already exists or remote user has limited DDL; ignore
      }

      // Ensure composite performance indexes exist for fast filtered project queries and auth challenges
      try {
        await newPool.query("CREATE INDEX idx_projects_pub_cat_order ON projects (is_published, category, display_order)");
      } catch {
        // index may already exist; ignore
      }
      try {
        await newPool.query("CREATE INDEX idx_challenges_lookup ON admin_challenges (admin_id, purpose, expires_at, created_at)");
      } catch {
        // index may already exist; ignore
      }

      // Proactively sync live database data to memory fallback snapshot
      syncDbToMemory().catch(() => {});

      return pool;
    } catch (error) {
      console.warn(`[Database] Warning: Could not connect to remote TiDB/MySQL (${error.message}).`);
      console.warn(`[Database] Operating with local fallback memory store until connection is established.`);
      isConnected = false;
      return null;
    } finally {
      reconnectingPromise = null;
    }
  })();

  return reconnectingPromise;
}

export async function tryReconnect() {
  return initDatabase();
}

/**
 * Sync active DB records into memoryStore as a safety snapshot
 */
async function syncDbToMemory() {
  if (!pool || !isConnected) return;
  try {
    const [projects] = await pool.execute('SELECT * FROM projects ORDER BY display_order ASC');
    if (Array.isArray(projects) && projects.length > 0) {
      memoryStore.projects = projects;
    }
    const [messages] = await pool.execute('SELECT * FROM contact_messages ORDER BY received_at DESC');
    if (Array.isArray(messages)) {
      memoryStore.contactMessages = messages;
    }
  } catch (err) {
    // Non-critical background sync
  }
}

function isConnectionError(err) {
  if (!err) return false;
  const msg = String(err.message || '').toLowerCase();
  const code = String(err.code || '').toUpperCase();
  return (
    code === 'PROTOCOL_CONNECTION_LOST' ||
    code === 'ECONNRESET' ||
    code === 'ETIMEDOUT' ||
    code === 'EPIPE' ||
    code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR' ||
    code === 'ER_SERVER_SHUTDOWN' ||
    msg.includes('connection lost') ||
    msg.includes('closed the connection') ||
    msg.includes('etimedout') ||
    msg.includes('econnreset') ||
    Boolean(err.fatal)
  );
}

/**
 * Execute a query with parameterized values and automatic reconnection retry
 */
export async function query(sql, params = []) {
  const sanitizedParams = params.map(p => (p === undefined ? null : p));

  if (!pool) {
    await initDatabase();
  }

  if (pool) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const [rows] = await pool.execute(sql, sanitizedParams);
        isConnected = true;
        return rows;
      } catch (dbError) {
        if (isConnectionError(dbError) && attempt === 1) {
          console.warn(`[Database] Connection dropped on attempt 1 (${dbError.message}). Refreshing pool & retrying query...`);
          isConnected = false;
          await tryReconnect();
          continue; // retry query with fresh connection
        }

        console.warn(`[Database] Query error on TiDB: ${dbError.message}. Falling back to memory store.`);
        if (isConnectionError(dbError)) {
          isConnected = false;
        }
        break;
      }
    }
  }

  // If remote DB is not available, delegate to in-memory store
  return memoryStore.execute(sql, sanitizedParams);
}

export function getDbStatus() {
  return {
    connected: isConnected,
    host: config.tidb.host,
    database: config.tidb.database,
    mode: isConnected ? 'tidb_cloud' : 'in_memory_fallback'
  };
}

// In-Memory Fallback Data Store for development when TiDB credentials are not yet set
class MemoryStore {
  constructor() {
    this.projects = [];
    this.experiences = [];
    this.skills = [];
    this.skillCategories = [];
    this.education = [];
    this.certifications = [];
    this.contactMessages = [];
    this.admins = [];
    this.admin2fa = [];
    this.siteSettings = {};
    this.initialized = true;
  }

  seedInitialData(initialData) {
    this.projects = initialData.projects || [];
    this.experiences = initialData.experiences || [];
    this.skills = initialData.skills || [];
    this.skillCategories = initialData.skillCategories || [];
    this.education = initialData.education || [];
    this.certifications = initialData.certifications || [];
    this.admins = initialData.admins || [];
    this.admin2fa = initialData.admin2fa || [];
    this.siteSettings = initialData.siteSettings || {};
    this.initialized = true;
  }

  async execute(sql, params = []) {
    const s = sql.trim().toLowerCase();
    
    // Select contact_messages
    if (s.includes('from contact_messages') && s.startsWith('select')) {
      return [...this.contactMessages].sort((a, b) => new Date(b.received_at) - new Date(a.received_at));
    }

    // Insert contact_messages
    if (s.startsWith('insert into contact_messages')) {
      const newId = this.contactMessages.length > 0 ? Math.max(...this.contactMessages.map(m => m.id || 0)) + 1 : 1;
      const messageObj = {
        id: newId,
        sender_name: params[0] || 'Anonymous',
        sender_email: params[1] || 'no-reply@example.com',
        subject: params[2] || 'Contact Message',
        message: params[3] || '',
        is_read: Boolean(params[4]),
        ip_address: params[5] || '',
        received_at: new Date()
      };
      this.contactMessages.unshift(messageObj);
      return { insertId: newId, affectedRows: 1 };
    }

    // Update contact_messages (mark as read)
    if (s.startsWith('update contact_messages')) {
      const id = Number(params[params.length - 1]);
      const msg = this.contactMessages.find(m => Number(m.id) === id);
      if (msg) msg.is_read = 1;
      return { affectedRows: 1 };
    }

    // Delete contact_messages
    if (s.startsWith('delete from contact_messages')) {
      const id = Number(params[0]);
      this.contactMessages = this.contactMessages.filter(m => Number(m.id) !== id);
      return { affectedRows: 1 };
    }

    // Select projects
    if (s.includes('from projects') && s.startsWith('select')) {
      let result = [...this.projects];
      if (s.includes('where is_published = 1') || s.includes('where is_published = true')) {
        result = result.filter(p => Boolean(p.is_published));
      }
      if (s.includes('is_featured = 1') || s.includes('is_featured = true')) {
        result = result.filter(p => Boolean(p.is_featured));
      }
      if (s.includes('slug = ?')) {
        const slug = params[0];
        result = result.filter(p => p.slug === slug);
      }
      if (s.includes('id = ?')) {
        const id = Number(params[0]);
        result = result.filter(p => Number(p.id) === id);
      }
      result.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      return result;
    }

    // Update project featured status
    if (s.startsWith('update projects set is_featured =')) {
      const isFeatured = Boolean(params[0]);
      const id = Number(params[1]);
      const p = this.projects.find(proj => Number(proj.id) === id);
      if (p) p.is_featured = isFeatured ? 1 : 0;
      return { affectedRows: p ? 1 : 0 };
    }

    // Update project published status
    if (s.startsWith('update projects set is_published =')) {
      const isPublished = Boolean(params[0]);
      const id = Number(params[1]);
      const p = this.projects.find(proj => Number(proj.id) === id);
      if (p) p.is_published = isPublished ? 1 : 0;
      return { affectedRows: p ? 1 : 0 };
    }

    // Update project display order
    if (s.startsWith('update projects set display_order =')) {
      const order = Number(params[0]);
      const id = Number(params[1]);
      const p = this.projects.find(proj => Number(proj.id) === id);
      if (p) p.display_order = order;
      return { affectedRows: p ? 1 : 0 };
    }

    // Insert project
    if (s.startsWith('insert into projects')) {
      const newId = this.projects.length > 0 ? Math.max(...this.projects.map(p => Number(p.id) || 0)) + 1 : 1;
      const project = { id: newId, created_at: new Date(), updated_at: new Date() };
      this.projects.push(project);
      return { insertId: newId, affectedRows: 1 };
    }

    // General update project
    if (s.startsWith('update projects')) {
      const id = Number(params[params.length - 1]);
      const p = this.projects.find(proj => Number(proj.id) === id);
      if (p) {
        if (s.includes('display_settings = ?')) {
          p.display_settings = params[params.length - 2];
        }
      }
      return { affectedRows: p ? 1 : 0 };
    }

    // Delete project
    if (s.startsWith('delete from projects')) {
      const id = Number(params[0]);
      this.projects = this.projects.filter(proj => Number(proj.id) !== id);
      return { affectedRows: 1 };
    }

    // Select experiences
    if (s.includes('from experiences')) {
      return [...this.experiences].sort((a, b) => a.display_order - b.display_order);
    }

    // Select education
    if (s.includes('from education')) {
      return [...this.education].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    }

    // Select certifications
    if (s.includes('from certifications')) {
      return [...this.certifications].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    }

    // Select site_settings
    if (s.includes('from site_settings')) {
      return Object.entries(this.siteSettings).map(([key, val]) => ({
        setting_key: key,
        setting_value: val
      }));
    }

    // Select skills
    if (s.includes('from skills')) {
      return [...this.skills].sort((a, b) => a.display_order - b.display_order);
    }

    // Select skill categories
    if (s.includes('from skill_categories')) {
      return [...this.skillCategories].sort((a, b) => a.display_order - b.display_order);
    }

    // Select admins
    if (s.includes('from admins')) {
      if (s.includes('email = ?')) {
        return this.admins.filter(a => a.email.toLowerCase() === String(params[0]).toLowerCase());
      }
      return [...this.admins];
    }

    // Default return
    return [];
  }
}

export const memoryStore = new MemoryStore();
