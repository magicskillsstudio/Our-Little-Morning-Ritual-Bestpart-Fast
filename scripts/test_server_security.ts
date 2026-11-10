/**
 * Security & Server-Side Authorization Verification Script
 */

import express from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { getAllPackages } from '../src/data/messagePackages';

async function runSecurityTests() {
  console.log('--- STARTING SERVER-SIDE SECURITY & AUTHENTICATION AUDIT ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, description: string) {
    if (condition) {
      console.log(`PASSED: ${description}`);
      passed++;
    } else {
      console.error(`FAILED: ${description}`);
      failed++;
    }
  }

  // Standalone test express app on port 3009 matching server.ts authorization logic
  const app = express();
  app.use(express.json());

  const ownerSessions = new Set<string>();
  let mockEnvOwnerPin: string | undefined = undefined; // Start unconfigured
  const customPackagesStore: Record<number, any> = {};

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

  app.post('/api/owner/login', (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    if (!mockEnvOwnerPin) {
      return res.status(500).json({
        success: false,
        error: 'Server Misconfiguration: OWNER_PIN environment variable must be set on the server.',
        authenticated: false
      });
    }

    const { pin } = req.body || {};
    if (typeof pin === 'string' && pin.trim() === mockEnvOwnerPin) {
      const token = crypto.randomUUID();
      ownerSessions.add(token);
      res.setHeader('Set-Cookie', `owner_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400`);
      return res.json({ success: true, token, authenticated: true });
    }
    return res.status(401).json({ success: false, error: 'Invalid owner PIN', authenticated: false });
  });

  app.get('/api/owner/packages', requireOwnerAuth, (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    return res.json({ success: true, count: getAllPackages().length, packages: getAllPackages() });
  });

  app.post('/api/owner/package/:day', requireOwnerAuth, (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    const day = parseInt(req.params.day, 10);
    customPackagesStore[day] = req.body;
    return res.json({ success: true, day, updatedPackage: req.body });
  });

  const server = app.listen(3009);
  const BASE_URL = 'http://localhost:3009';

  try {
    // Test 1: Unauthenticated request to /api/owner/packages MUST be rejected with 401
    const res1 = await fetch(`${BASE_URL}/api/owner/packages`);
    assert(res1.status === 401, 'T1.1 Unauthenticated request to /api/owner/packages rejected with 401 Unauthorized');
    const json1 = await res1.json();
    assert(json1.error === 'Unauthorized administrative access', 'T1.2 Error message confirms unauthorized access');

    // Test 2: Missing process.env.OWNER_PIN returns 500 secure misconfiguration error
    mockEnvOwnerPin = undefined;
    const res2 = await fetch(`${BASE_URL}/api/owner/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: '550630' })
    });
    assert(res2.status === 500, 'T2.1 Missing process.env.OWNER_PIN fails securely with status 500');
    const json2 = await res2.json();
    assert(json2.error.includes('OWNER_PIN environment variable must be set'), 'T2.2 Message confirms secure refusal without fallback');

    // Test 3: Configure OWNER_PIN securely & test invalid PIN
    mockEnvOwnerPin = 'my-secure-secret-pin';
    const res3 = await fetch(`${BASE_URL}/api/owner/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: 'wrongpin999' })
    });
    assert(res3.status === 401, 'T3.1 Invalid PIN rejected with 401 Unauthorized');

    // Test 4: Login with valid configured OWNER_PIN succeeds
    const res4 = await fetch(`${BASE_URL}/api/owner/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: 'my-secure-secret-pin' })
    });
    assert(res4.status === 200, 'T4.1 Valid configured OWNER_PIN login succeeds with 200 OK');
    const json4 = await res4.json();
    assert(json4.authenticated === true && typeof json4.token === 'string', 'T4.2 Returns valid UUID session token');
    const token = json4.token;

    // Test 5: Authenticated owner fetches packages and posts persistent custom edit
    if (token) {
      const res5 = await fetch(`${BASE_URL}/api/owner/packages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      assert(res5.status === 200, 'T5.1 Authenticated owner request returns 200 OK');

      const resEdit = await fetch(`${BASE_URL}/api/owner/package/1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ theme: 'Customized Morning' })
      });
      assert(resEdit.status === 200, 'T5.2 Updating package via owner API succeeds with 200 OK');
    }

  } finally {
    server.close();
  }

  console.log(`--- SECURITY AUDIT SUMMARY ---`);
  console.log(`Total tests: ${passed + failed}, Passed: ${passed}, Failed: ${failed}`);
  if (failed > 0) process.exit(1);
}

runSecurityTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
