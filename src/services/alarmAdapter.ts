/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { soundEngine } from '../utils/audioEngine';
import { AppSettings, loadSettings } from '../utils/storage';
import { getDayNumberForDate, getPackageForDay } from '../data/messagePackages';

export interface AlarmItem {
  id: 'alarm_550' | 'alarm_630';
  time: string; // "05:50" or "06:30"
  hour: number;
  minute: number;
  label: string;
  enabled: boolean;
}

export interface PlatformCapabilities {
  platform: 'android' | 'ios' | 'web-pwa';
  isNative: boolean;
  supportsAlarmKit: boolean; // iOS 26+
  supportsExactAlarm: boolean; // Android AlarmManager
  hasNotificationPermission: boolean;
  hasExactAlarmPermission: boolean;
  batteryOptimizationExempt: boolean;
  backgroundWakeSupported: boolean;
}

// Window declaration for custom Capacitor plugins if loaded in native context
declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform?: () => boolean;
      getPlatform?: () => string;
      Plugins?: {
        MorningAlarmPlugin?: {
          scheduleAlarm: (options: {
            id: string;
            hour: number;
            minute: number;
            sound: string;
            title: string;
            body: string;
          }) => Promise<{ success: boolean }>;
          cancelAlarm: (options: { id: string }) => Promise<{ success: boolean }>;
          stopAlarm: () => Promise<{ success: boolean }>;
          snoozeAlarm: (options: { id: string; sound: string; minutes: number }) => Promise<{ success: boolean }>;
          checkPermissions: () => Promise<{
            notifications: boolean;
            exactAlarm?: boolean;
            criticalAlerts?: boolean;
            supportsAlarmKit?: boolean;
          }>;
          requestExactAlarmPermission: () => Promise<void>;
          requestNotificationPermission: () => Promise<{ granted: boolean }>;
        };
      };
    };
  }
}

class AlarmAdapterService {
  /**
   * Detect current platform capabilities
   */
  public async getCapabilities(): Promise<PlatformCapabilities> {
    const isCapacitorNative = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
    const platformName = window.Capacitor?.getPlatform ? window.Capacitor.getPlatform() : 'web';

    let notifPerm = false;
    if (typeof Notification !== 'undefined') {
      notifPerm = Notification.permission === 'granted';
    }

    if (isCapacitorNative && platformName === 'android') {
      return {
        platform: 'android',
        isNative: true,
        supportsAlarmKit: false,
        supportsExactAlarm: true,
        hasNotificationPermission: notifPerm,
        hasExactAlarmPermission: true,
        batteryOptimizationExempt: true,
        backgroundWakeSupported: true,
      };
    }

    if (isCapacitorNative && platformName === 'ios') {
      return {
        platform: 'ios',
        isNative: true,
        supportsAlarmKit: true, // Native AlarmKit on iOS 26+
        supportsExactAlarm: false,
        hasNotificationPermission: notifPerm,
        hasExactAlarmPermission: true,
        batteryOptimizationExempt: true,
        backgroundWakeSupported: true,
      };
    }

    // Web / PWA fallback
    return {
      platform: 'web-pwa',
      isNative: false,
      supportsAlarmKit: false,
      supportsExactAlarm: false,
      hasNotificationPermission: notifPerm,
      hasExactAlarmPermission: false,
      batteryOptimizationExempt: false,
      backgroundWakeSupported: false,
    };
  }

  /**
   * Request system notification permission
   */
  public async requestNotificationPermission(): Promise<boolean> {
    if (window.Capacitor?.Plugins?.MorningAlarmPlugin?.requestNotificationPermission) {
      try {
        const res = await window.Capacitor.Plugins.MorningAlarmPlugin.requestNotificationPermission();
        return res.granted;
      } catch (err) {
        console.warn('Native notification request error:', err);
      }
    }

    if (typeof Notification !== 'undefined') {
      try {
        const result = await Notification.requestPermission();
        return result === 'granted';
      } catch (err) {
        console.warn('Browser notification permission error:', err);
        return false;
      }
    }
    return false;
  }

  /**
   * Calculates the next occurrence Date for an alarm in local device time
   */
  public getNextOccurrence(hour: number, minute: number): Date {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);

    // If time has already passed today, schedule for tomorrow
    if (next.getTime() <= now.getTime()) {
      next.setDate(next.getDate() + 1);
    }
    return next;
  }

  /**
   * Formats the time remaining in hours and minutes
   */
  public getTimeRemainingString(targetDate: Date): string {
    const diffMs = targetDate.getTime() - Date.now();
    if (diffMs <= 0) return 'Ringing now';
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      return `in ${hours} hr ${minutes} min`;
    }
    return `in ${minutes} min`;
  }

  /**
   * Schedules or updates alarms on the device.
   * Both alarms are independently scheduled and both point to today's identical message package.
   */
  public async syncAlarms(settings: AppSettings): Promise<{ success: boolean; message: string }> {
    const alarms: AlarmItem[] = [
      {
        id: 'alarm_550',
        time: settings.alarm1Time,
        hour: 5,
        minute: 50,
        label: 'First Morning Whisper (5:50 AM)',
        enabled: settings.alarm1Enabled,
      },
      {
        id: 'alarm_630',
        time: settings.alarm2Time,
        hour: 6,
        minute: 30,
        label: 'Gentle Rise Ritual (6:30 AM)',
        enabled: settings.alarm2Enabled,
      },
    ];

    const nativePlugin = window.Capacitor?.Plugins?.MorningAlarmPlugin;

    for (const alarm of alarms) {
      if (!alarm.enabled) {
        if (nativePlugin) {
          try {
            await nativePlugin.cancelAlarm({ id: alarm.id });
          } catch (e) {
            console.warn(`Failed to cancel native alarm ${alarm.id}:`, e);
          }
        }
        continue;
      }

      const nextOccur = this.getNextOccurrence(alarm.hour, alarm.minute);
      const dayNum = getDayNumberForDate(settings.activationDate, nextOccur);
      const pkg = getPackageForDay(dayNum);

      if (nativePlugin) {
        try {
          await nativePlugin.scheduleAlarm({
            id: alarm.id,
            hour: alarm.hour,
            minute: alarm.minute,
            sound: settings.selectedSound,
            title: `❤️ Good Morning, ${settings.recipientName}`,
            body: pkg.theme,
          });
        } catch (e) {
          console.warn(`Failed to schedule native alarm ${alarm.id}:`, e);
        }
      }
    }

    return {
      success: true,
      message: 'Morning ritual alarms synchronized.',
    };
  }

  /**
   * Triggers an immediate alarm simulation (plays romantic audio crescendo and fires notification)
   */
  public triggerAlarmNow(
    alarmLabel: string,
    onRingingStarted?: () => void
  ) {
    const settings = loadSettings();
    const dayNum = getDayNumberForDate(settings.activationDate, new Date());
    const pkg = getPackageForDay(dayNum);

    // Start romantic crescendo audio with the selected sound track
    soundEngine.playTrack(settings.selectedSound, settings.crescendoEnabled);

    // Send Web Notification if available and granted
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification(`Our Little Morning Ritual: ${alarmLabel} ❤️`, {
          body: `Day ${pkg.day}: ${pkg.theme}\n${pkg.romanticMessage.substring(0, 100)}...`,
          icon: '/icon.svg',
          requireInteraction: true,
          silent: false,
        });
      } catch (e) {
        console.warn('Web notification dispatch issue:', e);
      }
    }

    if (onRingingStarted) {
      onRingingStarted();
    }
  }

  /**
   * Snooze current alarm by N minutes
   */
  public snoozeAlarm(alarmId: string = 'alarm_550', minutes: number = 9, onSnoozed?: () => void) {
    soundEngine.stop();

    const nativePlugin = window.Capacitor?.Plugins?.MorningAlarmPlugin;
    if (nativePlugin?.snoozeAlarm) {
      const settings = loadSettings();
      nativePlugin.snoozeAlarm({
        id: alarmId,
        sound: settings.selectedSound,
        minutes
      }).catch(err => console.warn('Native snooze error:', err));
    }

    if (onSnoozed) onSnoozed();
  }

  /**
   * Dismiss the alarm immediately (stops audio without cancelling second alarm)
   */
  public dismissAlarm(onDismissed?: () => void) {
    soundEngine.stop();

    const nativePlugin = window.Capacitor?.Plugins?.MorningAlarmPlugin;
    if (nativePlugin?.stopAlarm) {
      nativePlugin.stopAlarm().catch(err => console.warn('Native stop error:', err));
    }

    if (onDismissed) onDismissed();
  }
}

export const alarmAdapter = new AlarmAdapterService();
