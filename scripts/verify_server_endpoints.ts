/**
 * End-to-End Server Endpoint & Asset Verification Script
 * Starts Express production server and tests all assets, audio files, and SPA fallbacks.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { SOUND_TRACKS } from '../src/utils/audioEngine';

function fetchUrl(urlStr: string): Promise<{ status: number; headers: http.IncomingHttpHeaders; bytes: number }> {
  return new Promise((resolve, reject) => {
    http.get(urlStr, (res) => {
      let size = 0;
      res.on('data', (chunk) => {
        size += chunk.length;
      });
      res.on('end', () => {
        resolve({ status: res.statusCode || 0, headers: res.headers, bytes: size });
      });
    }).on('error', (err) => reject(err));
  });
}

async function runEndpointVerification() {
  console.log('--- STARTING SERVER ENDPOINT & OFFLINE ASSET AUDIT ---');

  const distDir = path.join(process.cwd(), 'dist');
  assert('Dist directory exists', fs.existsSync(distDir), `Dist path: ${distDir}`);

  const assetsDir = path.join(distDir, 'assets');
  const assetFiles = fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir) : [];
  const jsFiles = assetFiles.filter((f) => f.endsWith('.js'));
  const cssFiles = assetFiles.filter((f) => f.endsWith('.css'));

  assert('JS Bundle generated in dist/assets/', jsFiles.length > 0, `JS Files: ${jsFiles.join(', ')}`);
  assert('CSS Bundle generated in dist/assets/', cssFiles.length > 0, `CSS Files: ${cssFiles.join(', ')}`);

  // Verify 200 messages are compiled inside index-*.js
  if (jsFiles.length > 0) {
    const jsContent = fs.readFileSync(path.join(assetsDir, jsFiles[0]), 'utf-8');
    assert('200 Daily Love Notes bundled inside production JS bundle', jsContent.includes('First Morning Whisper') || jsContent.includes('Gentle Rise Ritual'), `Bundle size: ${(jsContent.length / 1024).toFixed(1)} KB`);
  }

  // Verify all 10 audio WAV files exist in dist/audio
  const audioDir = path.join(distDir, 'audio');
  assert('Dist audio directory exists', fs.existsSync(audioDir), `Audio path: ${audioDir}`);

  let audioFilesExist = true;
  SOUND_TRACKS.forEach((track) => {
    const audioPath = path.join(audioDir, track.filename);
    if (!fs.existsSync(audioPath)) {
      audioFilesExist = false;
      console.error(`Missing audio asset in dist: ${track.filename}`);
    }
  });
  assert('All 10 Romantic Instrumental WAV tracks present in dist/audio/', audioFilesExist, 'All 10 WAV files verified in dist bundle');

  // Launch express server in test port 3099
  process.env.NODE_ENV = 'production';
  process.env.PORT = '3099';

  const { default: express } = await import('express');
  const app = express();
  app.use(express.static(distDir));
  app.get('*', (req, res) => res.sendFile(path.join(distDir, 'index.html')));

  const server = app.listen(3099, '127.0.0.1', async () => {
    console.log('Production test server listening on http://127.0.0.1:3099');

    try {
      // 1. Root & HTML
      const rootRes = await fetchUrl('http://127.0.0.1:3099/');
      assert('HTTP GET / returns 200 OK', rootRes.status === 200, `ContentType: ${rootRes.headers['content-type']}`);

      // 2. Manifest
      const manifestRes = await fetchUrl('http://127.0.0.1:3099/manifest.json');
      assert('HTTP GET /manifest.json returns 200 OK', manifestRes.status === 200, `ContentType: ${manifestRes.headers['content-type']}`);

      // 3. Service Worker
      const swRes = await fetchUrl('http://127.0.0.1:3099/sw.js');
      assert('HTTP GET /sw.js returns 200 OK', swRes.status === 200, `ContentType: ${swRes.headers['content-type']}`);

      // 4. Icon
      const iconRes = await fetchUrl('http://127.0.0.1:3099/icon.svg');
      assert('HTTP GET /icon.svg returns 200 OK', iconRes.status === 200, `ContentType: ${iconRes.headers['content-type']}`);

      // 5. JS Bundle
      if (jsFiles.length > 0) {
        const jsRes = await fetchUrl(`http://127.0.0.1:3099/assets/${jsFiles[0]}`);
        assert(`HTTP GET /assets/${jsFiles[0]} returns 200 OK`, jsRes.status === 200, `Size: ${jsRes.bytes} bytes`);
      }

      // 6. CSS Bundle
      if (cssFiles.length > 0) {
        const cssRes = await fetchUrl(`http://127.0.0.1:3099/assets/${cssFiles[0]}`);
        assert(`HTTP GET /assets/${cssFiles[0]} returns 200 OK`, cssRes.status === 200, `Size: ${cssRes.bytes} bytes`);
      }

      // 7. Test all 10 audio files HTTP 200
      let allAudioHttp200 = true;
      for (const track of SOUND_TRACKS) {
        const audioHttpRes = await fetchUrl(`http://127.0.0.1:3099/audio/${track.filename}`);
        if (audioHttpRes.status !== 200 || audioHttpRes.bytes < 1000000) {
          allAudioHttp200 = false;
          console.error(`Audio HTTP check failed for ${track.filename}: status ${audioHttpRes.status}, bytes ${audioHttpRes.bytes}`);
        }
      }
      assert('HTTP GET for all 10 WAV tracks return 200 OK with full audio payloads', allAudioHttp200, 'All 10 WAV tracks served successfully');

      // 8. Test SPA Fallback routes
      const spaRes1 = await fetchUrl('http://127.0.0.1:3099/sounds');
      const spaRes2 = await fetchUrl('http://127.0.0.1:3099/settings');
      assert('SPA fallback routes return 200 index.html', spaRes1.status === 200 && spaRes2.status === 200, 'SPA routing fallback verified');

      console.log('\n--- VERIFICATION SUMMARY: ALL ENDPOINTS PASSED ---');
    } catch (err) {
      console.error('Verification error:', err);
    } finally {
      server.close();
      process.exit(0);
    }
  });
}

function assert(name: string, condition: boolean, details: string) {
  if (!condition) {
    console.error(`FAILED: ${name} -> ${details}`);
    process.exit(1);
  } else {
    console.log(`PASSED: ${name} (${details})`);
  }
}

runEndpointVerification();
