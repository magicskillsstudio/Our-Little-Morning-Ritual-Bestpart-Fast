import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { getAllPackages } from './src/data/messagePackages';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Server-side active owner sessions & file-based persistent package storage
const ownerSessions = new Set<string>();
const STORAGE_FILE = path.resolve(__dirname, 'custom_packages.json');

function loadCustomPackagesFromFile(): Record<number, any> {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = fs.readFileSync(STORAGE_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn('Note: custom_packages.json load error/init:', err);
  }
  return {};
}

const customPackagesStore: Record<number, any> = loadCustomPackagesFromFile();

function saveCustomPackagesToFile(): void {
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(customPackagesStore, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write custom_packages.json:', err);
  }
}

// Strictly require process.env.OWNER_PIN without any hardcoded fallback
const OWNER_PIN = process.env.OWNER_PIN?.trim();

function getSessionTokenFromRequest(req: express.Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const match = cookieHeader.match(/owner_session=([^;]+)/);
    if (match) return match[1].trim();
  }
  return null;
}

function requireOwnerAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = getSessionTokenFromRequest(req);
  if (token && ownerSessions.has(token)) {
    return next();
  }
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  return res.status(401).json({ error: 'Unauthorized administrative access', authenticated: false });
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // ===============================================
  // SERVER-SIDE OWNER AUTHENTICATION & ADMIN APIs
  // ===============================================
  
  // 1. Owner Login (Server Verification via process.env.OWNER_PIN)
  app.post('/api/owner/login', (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    if (!OWNER_PIN) {
      return res.status(500).json({
        success: false,
        error: 'Server Misconfiguration: OWNER_PIN environment variable must be set on the server.',
        authenticated: false
      });
    }

    const { pin } = req.body || {};
    if (typeof pin === 'string' && pin.trim() === OWNER_PIN) {
      const token = crypto.randomUUID();
      ownerSessions.add(token);
      res.setHeader('Set-Cookie', `owner_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400`);
      return res.json({ success: true, token, authenticated: true });
    }
    return res.status(401).json({ success: false, error: 'Invalid owner PIN', authenticated: false });
  });

  // 2. Owner Session Verification
  app.get('/api/owner/session', (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    const token = getSessionTokenFromRequest(req);
    const authenticated = !!(token && ownerSessions.has(token));
    return res.json({ authenticated });
  });

  // 3. Owner Logout
  app.post('/api/owner/logout', (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    const token = getSessionTokenFromRequest(req);
    if (token) ownerSessions.delete(token);
    res.setHeader('Set-Cookie', 'owner_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
    return res.json({ success: true });
  });

  // 4. Protected 200 Messages API (Owner Only)
  app.get('/api/owner/packages', requireOwnerAuth, (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    const merged = getAllPackages().map((pkg: any) => {
      if (customPackagesStore[pkg.day]) {
        return { ...pkg, ...customPackagesStore[pkg.day] };
      }
      return pkg;
    });
    return res.json({ success: true, count: merged.length, packages: merged });
  });

  // 5. Protected Package Update API (Owner Only)
  app.post('/api/owner/package/:day', requireOwnerAuth, (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    const day = parseInt(req.params.day, 10);
    if (isNaN(day) || day < 1 || day > 200) {
      return res.status(400).json({ error: 'Invalid day parameter' });
    }
    const updatedPkg = req.body;
    customPackagesStore[day] = updatedPkg;
    saveCustomPackagesToFile();
    return res.json({ success: true, day, updatedPackage: updatedPkg });
  });

  // ===============================================
  // WEB APPLICATION APP SHELL & STATIC ASSETS
  // ===============================================

  if (!isProd) {
    // Development mode with Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode serving static dist bundle with no-cache for index.html & sw.js
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath, {
      maxAge: '1y',
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('index.html') || filePath.endsWith('sw.js') || filePath.endsWith('manifest.json')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      }
    }));

    // SPA Fallback to index.html for client-side routing
    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
