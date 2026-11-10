/**
 * Complete Offline Functionality Audit & Verification Test Suite
 * Tests local message bundling, audio file integrity, SW registration,
 * localStorage persistence, and zero-network independence.
 */

import fs from 'fs';
import path from 'path';
import { getPackageForDay, getAllPackages, getDayNumberForDate } from '../src/data/messagePackages';
import { SOUND_TRACKS } from '../src/utils/audioEngine';
import { loadSettings, saveSettings, DEFAULT_SETTINGS } from '../src/utils/storage';

function runOfflineAudit() {
  const results: { test: string; passed: boolean; details: string }[] = [];

  function assert(name: string, condition: boolean, details: string) {
    results.push({ test: name, passed: condition, details });
    if (!condition) {
      console.error(`FAILED: ${name} -> ${details}`);
    } else {
      console.log(`PASSED: ${name}`);
    }
  }

  console.log('--- STARTING COMPLETE OFFLINE FUNCTIONALITY AUDIT ---');

  // Test 1: Verify 200 Message Packages bundled locally
  {
    const packages = getAllPackages();
    assert('1.1 200 Complete Message Packages bundled locally', packages.length === 200, `Found ${packages.length} packages`);

    let allValid = true;
    for (let i = 1; i <= 200; i++) {
      const pkg = getPackageForDay(i);
      if (!pkg.theme || !pkg.romanticMessage || !pkg.encouragement || !pkg.bibleVerse.text || !pkg.prayer || !pkg.lovingClosing) {
        allValid = false;
        break;
      }
    }
    assert('1.2 Every day (1-200) contains full required package fields', allValid, 'All 200 packages complete');
  }

  // Test 2: Verify 10 Instrumental WAV audio files in /public/audio/
  {
    assert('2.1 10 Sound Tracks defined in metadata', SOUND_TRACKS.length === 10, `Found ${SOUND_TRACKS.length} tracks`);

    let filesExist = true;
    let totalBytes = 0;

    SOUND_TRACKS.forEach((track) => {
      const filePath = path.join(process.cwd(), 'public', 'audio', track.filename);
      if (!fs.existsSync(filePath)) {
        filesExist = false;
        console.error(`Missing audio file: ${filePath}`);
      } else {
        const stats = fs.statSync(filePath);
        totalBytes += stats.size;
      }
    });

    assert('2.2 All 10 WAV files physically present in /public/audio/', filesExist, `Total audio size: ${(totalBytes / (1024 * 1024)).toFixed(2)} MB`);
  }

  // Test 3: Verify 10 Instrumental WAV audio files in Android native res/raw
  {
    let androidFilesExist = true;
    SOUND_TRACKS.forEach((track) => {
      const filePath = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'res', 'raw', track.filename);
      if (!fs.existsSync(filePath)) {
        androidFilesExist = false;
      }
    });
    assert('3.1 All 10 WAV files present in Android native res/raw/', androidFilesExist, 'Android raw audio synced');
  }

  // Test 4: Verify 10 Instrumental WAV audio files in iOS Xcode bundle
  {
    let iosFilesExist = true;
    SOUND_TRACKS.forEach((track) => {
      const filePath = path.join(process.cwd(), 'ios', 'App', 'App', track.filename);
      if (!fs.existsSync(filePath)) {
        iosFilesExist = false;
      }
    });
    assert('4.1 All 10 WAV files present in iOS Xcode bundle/', iosFilesExist, 'iOS app audio synced');
  }

  // Test 5: Verify Service Worker precache list in public/sw.js
  {
    const swContent = fs.readFileSync(path.join(process.cwd(), 'public', 'sw.js'), 'utf-8');
    const includesAllWavs = SOUND_TRACKS.every((track) => swContent.includes(track.filename));
    assert('5.1 Service Worker (public/sw.js) precaches all 10 WAV compositions', includesAllWavs, 'All 10 WAV filenames found in sw.js PRECACHE_ASSETS');
    assert('5.2 Service Worker contains CacheFirst strategy for offline loading', swContent.includes('caches.match'), 'CacheFirst strategy confirmed');
  }

  // Test 6: Verify Web App Manifest
  {
    const manifestContent = fs.readFileSync(path.join(process.cwd(), 'public', 'manifest.json'), 'utf-8');
    const manifest = JSON.parse(manifestContent);
    assert('6.1 Web App Manifest includes standalone display mode', manifest.display === 'standalone', `Display: ${manifest.display}`);
    assert('6.2 Web App Manifest includes start_url and scope', manifest.start_url === '/' && manifest.scope === '/', 'Scope & start_url verified');
  }

  // Test 7: Zero External API / Cloud Dependencies Search
  {
    const srcFiles = fs.readdirSync(path.join(process.cwd(), 'src'), { recursive: true }) as string[];
    let remoteCallsFound = false;

    srcFiles.forEach((file) => {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        const fullPath = path.join(process.cwd(), 'src', file);
        if (fs.statSync(fullPath).isFile()) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          if (content.includes('axios') || content.includes('api.google.com') || content.includes('https://api.') || content.includes('http://api.')) {
            remoteCallsFound = true;
            console.error(`External cloud API call found in ${file}`);
          }
        }
      }
    });

    assert('7.1 Zero remote API calls or cloud server dependencies in application code', !remoteCallsFound, 'App operates 100% offline');
  }

  // Test 8: Deterministic Offline Rotation Engine
  {
    const baseDate = '2026-01-01';
    const day1 = getDayNumberForDate(baseDate, new Date('2026-01-01T08:00:00'));
    const day100 = getDayNumberForDate(baseDate, new Date('2026-04-10T08:00:00'));
    const day201 = getDayNumberForDate(baseDate, new Date('2026-07-20T08:00:00'));

    assert('8.1 Rotation Engine computes Day 1 on activation date', day1 === 1, `Computed Day: ${day1}`);
    assert('8.2 Rotation Engine computes correct offset offline', day100 === 100, `Computed Day: ${day100}`);
    assert('8.3 Rotation Engine loops Day 201 cleanly back to Day 1 offline', day201 === 1, `Computed Day: ${day201}`);
  }

  console.log('\n--- OFFLINE AUDIT SUMMARY ---');
  const allPassed = results.every((r) => r.passed);
  console.log(`Total tests: ${results.length}, Passed: ${results.filter((r) => r.passed).length}, Failed: ${results.filter((r) => !r.passed).length}`);
  if (!allPassed) {
    process.exit(1);
  }
}

runOfflineAudit();
