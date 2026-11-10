/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AppSettings {
  isApproved: boolean;
  approvalDate: string | null; // ISO YYYY-MM-DD
  activationDate: string; // ISO YYYY-MM-DD
  alarm1Enabled: boolean; // 5:50 AM
  alarm2Enabled: boolean; // 6:30 AM
  alarm1Time: string; // "05:50"
  alarm2Time: string; // "06:30"
  selectedSound: string;
  volume: number;
  crescendoEnabled: boolean;
  snoozeMinutes: number;
  senderName: string;
  recipientName: string;
  savedDayOffset: number;
  hasCompletedOnboarding: boolean;
  // Owner / Admin Security
  ownerPin: string;
  customPackages: Record<number, any>;
}

const STORAGE_KEY = 'morning_ritual_settings_v1';
const OWNER_SESSION_KEY = 'morning_ritual_owner_session';

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const DEFAULT_SETTINGS: AppSettings = {
  isApproved: false,
  approvalDate: null,
  activationDate: getTodayDateString(),
  alarm1Enabled: true,
  alarm2Enabled: true,
  alarm1Time: "05:50",
  alarm2Time: "06:30",
  selectedSound: "our-beautiful-morning",
  volume: 0.85,
  crescendoEnabled: true,
  snoozeMinutes: 9,
  senderName: "Your Love",
  recipientName: "My Love",
  savedDayOffset: 0,
  hasCompletedOnboarding: false,
  ownerPin: "",
  customPackages: {}
};

let memorySettings: AppSettings | null = null;

export function loadSettings(): AppSettings {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return memorySettings || DEFAULT_SETTINGS;
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        ownerPin: parsed.ownerPin || DEFAULT_SETTINGS.ownerPin,
        customPackages: parsed.customPackages || {}
      };
    }
    return memorySettings || DEFAULT_SETTINGS;
  } catch {
    return memorySettings || DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  memorySettings = settings;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }
  } catch (err) {
    // handled gracefully
  }
}

// ==========================================
// OWNER AUTHENTICATION & ACCESS CONTROL
// ==========================================

let memoryOwnerToken: string | null = null;

export function getOwnerToken(): string | null {
  try {
    if (typeof sessionStorage !== 'undefined') {
      return sessionStorage.getItem(OWNER_SESSION_KEY);
    }
    return memoryOwnerToken;
  } catch {
    return memoryOwnerToken;
  }
}

export function isOwnerAuthenticated(): boolean {
  return !!getOwnerToken();
}

export async function verifyOwnerPin(inputPin: string): Promise<boolean> {
  const trimmed = inputPin.trim();
  if (!trimmed) return false;

  try {
    const res = await fetch('/api/owner/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: trimmed })
    });
    const data = await res.json();
    if (res.ok && data.success && data.token) {
      memoryOwnerToken = data.token;
      try {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem(OWNER_SESSION_KEY, data.token);
        }
      } catch {}
      return true;
    }
  } catch (err) {
    // Offline / fallback verification against locally configured settings PIN
    const settings = loadSettings();
    const fallbackValid = settings.ownerPin && settings.ownerPin.trim() ? trimmed === settings.ownerPin.trim() : false;
    if (fallbackValid) {
      memoryOwnerToken = 'offline-session-token';
      try {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem(OWNER_SESSION_KEY, 'offline-session-token');
        }
      } catch {}
      return true;
    }
  }
  return false;
}

export async function logoutOwner(): Promise<void> {
  const token = getOwnerToken();
  memoryOwnerToken = null;
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(OWNER_SESSION_KEY);
    }
  } catch {}
  
  if (token) {
    try {
      await fetch('/api/owner/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch {}
  }
}

export function updateOwnerPin(newPin: string): boolean {
  if (!newPin || newPin.trim().length < 4) return false;
  const current = loadSettings();
  const updated: AppSettings = {
    ...current,
    ownerPin: newPin.trim()
  };
  saveSettings(updated);
  return true;
}
