import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import { config } from './src/config/env.js';
import { initDatabase, getDbStatus } from './src/config/db.js';

// Route imports
import authRoutes from './src/modules/auth/auth.routes.js';
import publicProjectsRoutes from './src/modules/projects/publicProjects.routes.js';
import adminProjectsRoutes from './src/modules/projects/adminProjects.routes.js';
import githubRoutes from './src/modules/github/github.routes.js';
import { publicProfileRoutes, adminProfileRoutes } from './src/modules/profile/profile.routes.js';
import { publicContactRoutes, adminContactRoutes } from './src/modules/contact/contact.routes.js';

const app = express();

// 1. Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// 2. High-Performance Gzip/Brotli Compression
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
  threshold: 1024 // Only compress payloads > 1KB
}));

// 3. Exact-Origin CORS Hardening (Never prefix-match or allow wildcard in production)
const configuredFrontendOrigins = (config.frontendUrl || '')
  .split(',')
  .map(o => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const allowedOrigins = [
  ...configuredFrontendOrigins,
  'https://my-profile-seven-murex.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Allow CLI, server-to-server or health probes without origin
    const normalizedOrigin = origin.replace(/\/+$/, '');
    if (allowedOrigins.includes(normalizedOrigin) || (config.nodeEnv === 'development' && origin.startsWith('http://localhost'))) {
      return callback(null, true);
    }
    return callback(new Error(`Blocked by CORS policy: Origin ${origin} not permitted.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 4. Request Correlation ID & Structured Observability Logging
app.use((req, res, next) => {
  req.id = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.originalUrl !== '/api/health') {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        requestId: req.id,
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        durationMs: duration
      }));
    }
  });

  next();
});

// 5. Body & Cookie Parsers
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser(config.auth.jwtSecret));

// 6. Cache-Control Header Policy
// Public GET endpoints get CDN/Browser cache headers; admin & auth routes strictly no-store
app.use('/api/public', (req, res, next) => {
  if (req.method === 'GET') {
    if (req.path.startsWith('/projects/')) {
      res.setHeader('Cache-Control', 'public, max-age=600, stale-while-revalidate=86400');
    } else if (req.path === '/projects') {
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=1800, stale-while-revalidate=86400');
    }
  }
  next();
});

app.use(['/api/admin', '/api/auth'], (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// 7. Robots.txt on API server (prevents crawler indexing of raw API routes)
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send('User-agent: *\nDisallow: /\n');
});

// 8. Health check endpoint (lightweight status, no credentials exposed)
app.get('/api/health', (req, res) => {
  const dbStatus = getDbStatus();
  res.setHeader('Cache-Control', 'no-store, private');
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    database: {
      connected: dbStatus.connected,
      mode: dbStatus.mode
    }
  });
});

// 9. API Routes
app.use('/api/admin/auth', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/public/projects', publicProjectsRoutes);
app.use('/api/public/profile', publicProfileRoutes);
app.use('/api/public/contact', publicContactRoutes);

app.use('/api/admin/projects', adminProjectsRoutes);
app.use('/api/admin/github', githubRoutes);
app.use('/api/admin/profile', adminProfileRoutes);
app.use('/api/admin/contact', adminContactRoutes);

// 10. 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    requestId: req.id,
    error: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// 11. Global Error Handler (Sanitized for Production)
app.use((err, req, res, next) => {
  console.error('[Error] Unhandled server error:', {
    requestId: req.id,
    error: err.message,
    stack: config.nodeEnv === 'development' ? err.stack : undefined
  });

  const status = err.status || 500;
  res.status(status).json({
    success: false,
    requestId: req.id,
    error: config.nodeEnv === 'production' && status === 500
      ? 'Internal server error occurred.'
      : err.message || 'Internal server error occurred.'
  });
});

// Start Server
async function start() {
  await initDatabase();
  
  app.listen(config.port, () => {
    console.log(`====================================================`);
    console.log(`  Portfolio & CMS Backend running on port ${config.port}`);
    console.log(`  Environment: ${config.nodeEnv}`);
    console.log(`  Health Check: http://localhost:${config.port}/api/health`);
    console.log(`====================================================`);
  });
}

start();
