/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import PACKAGES_DATA from './packages200.json';
import { loadSettings } from '../utils/storage';

export interface BibleVerse {
  reference: string;
  text: string;
}

export interface MessagePackage {
  day: number;
  theme: string;
  romanticMessage: string;
  encouragement: string;
  bibleVerse: BibleVerse;
  prayer: string;
  lovingClosing: string;
}

// 200 complete, verified, and distinct daily message packages
export const MESSAGE_PACKAGES: MessagePackage[] = PACKAGES_DATA as MessagePackage[];

/**
 * Calculates deterministic day number (1 - 200) based on activation date.
 * Both 5:50 AM and 6:30 AM alarms on the same calendar day will return the exact same package!
 * Automatically advances to next package on next calendar day, and after Day 200 restarts at Day 1.
 */
export function getDayNumberForDate(activationDateStr: string, targetDate: Date = new Date()): number {
  try {
    const [actYear, actMonth, actDay] = activationDateStr.split('-').map(Number);
    const actDate = new Date(actYear, actMonth - 1, actDay);
    
    // Normalize target date to midnight in local time
    const localTarget = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    
    // Difference in whole calendar days
    const diffTime = localTarget.getTime() - actDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Cycle 1 to 200:
    // When diffDays is 0 (activation day) => Day 1
    // When diffDays is 199 => Day 200
    // When diffDays is 200 => Day 1
    const normalizedIndex = ((diffDays % 200) + 200) % 200;
    return normalizedIndex + 1;
  } catch {
    return 1;
  }
}

/**
 * Retrieves the message package for a given calendar day (1 - 200),
 * merging any owner-customized edits stored locally.
 */
export function getPackageForDay(dayNumber: number): MessagePackage {
  const normalized = Math.max(1, Math.min(200, dayNumber));
  const basePackage = MESSAGE_PACKAGES[normalized - 1] || MESSAGE_PACKAGES[0];

  try {
    const settings = loadSettings();
    if (settings.customPackages && settings.customPackages[normalized]) {
      const custom = settings.customPackages[normalized];
      return {
        ...basePackage,
        ...custom,
        bibleVerse: {
          ...basePackage.bibleVerse,
          ...(custom.bibleVerse || {})
        }
      };
    }
  } catch {
    // Fall back to base package
  }

  return basePackage;
}

/**
 * Retrieves all 200 packages with any owner customizations applied (Owner portal only)
 */
export function getAllPackages(): MessagePackage[] {
  try {
    const settings = loadSettings();
    const customs = settings.customPackages || {};
    return MESSAGE_PACKAGES.map((pkg) => {
      if (customs[pkg.day]) {
        return {
          ...pkg,
          ...customs[pkg.day],
          bibleVerse: {
            ...pkg.bibleVerse,
            ...(customs[pkg.day].bibleVerse || {})
          }
        };
      }
      return pkg;
    });
  } catch {
    return MESSAGE_PACKAGES;
  }
}
