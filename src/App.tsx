/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Heart,
  Bell,
  Clock,
  Sparkles,
  BookOpen,
  Volume2,
  Sliders,
  Play,
  Square,
  Moon,
  Sun,
  Music,
  HelpCircle,
  ChevronRight,
  Share2,
  ShieldCheck,
  Lock
} from 'lucide-react';
import {
  AppSettings,
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  getTodayDateString,
  isOwnerAuthenticated,
  logoutOwner
} from './utils/storage';
import { getDayNumberForDate, getPackageForDay, MessagePackage } from './data/messagePackages';
import { soundEngine, SOUND_TRACKS } from './utils/audioEngine';
import { alarmAdapter } from './services/alarmAdapter';
import { InvitationView } from './components/InvitationView';
import { OnboardingView } from './components/OnboardingView';
import { RingingAlarmModal } from './components/RingingAlarmModal';
import { SoundLibraryView } from './components/SoundLibraryView';
import { AlarmSettingsView } from './components/AlarmSettingsView';
import { DailyMessageView } from './components/DailyMessageView';
import { AboutHelpView } from './components/AboutHelpView';
import { OwnerPortalView } from './components/OwnerPortalView';
import { OwnerPinModal } from './components/OwnerPinModal';
import { PWAInstallButton } from './components/PWAInstallButton';

export type AppView =
  | 'dashboard'
  | 'sounds'
  | 'settings'
  | 'daily-message'
  | 'about'
  | 'invitation'
  | 'onboarding'
  | 'owner';

export function getViewFromHash(hash: string): AppView | null {
  const clean = hash.replace(/^#\/?/, '').trim();
  const validViews: AppView[] = [
    'dashboard',
    'sounds',
    'settings',
    'daily-message',
    'about',
    'invitation',
    'onboarding',
    'owner'
  ];
  return validViews.includes(clean as AppView) ? (clean as AppView) : null;
}

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  
  // Track previous view for contextual, reliable back navigation
  const [previousView, setPreviousView] = useState<AppView | null>(() => {
    if (typeof window !== 'undefined' && window.history.state && window.history.state.from) {
      return window.history.state.from as AppView;
    }
    return null;
  });

  const [currentView, setCurrentView] = useState<AppView>(() => {
    const s = loadSettings();
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const hashView = getViewFromHash(hash);

    // Initial auth & onboarding enforcement
    if (!s.isApproved) return 'invitation';
    if (!s.hasCompletedOnboarding && hashView !== 'invitation') return 'onboarding';

    if (hashView) {
      if (hashView === 'owner') {
        if (isOwnerAuthenticated()) return 'owner';
        return 'dashboard';
      }
      return hashView;
    }

    return 'dashboard';
  });

  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [activeRingingAlarm, setActiveRingingAlarm] = useState<string | null>(null);
  const [isPlayingMelody, setIsPlayingMelody] = useState(false);
  const [snoozeActiveUntil, setSnoozeActiveUntil] = useState<Date | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [heartTapCount, setHeartTapCount] = useState(0);

  // Sync hash and history state on initial mount & handle direct deep link to owner
  useEffect(() => {
    const hash = window.location.hash;
    const hashView = getViewFromHash(hash);
    if (hashView === 'owner' && !isOwnerAuthenticated()) {
      setShowPinModal(true);
    }
    try {
      window.history.replaceState({ view: currentView, from: previousView }, '', `#${currentView}`);
    } catch {
      // sandbox safe
    }
  }, []);

  // Centralized Navigation Dispatcher
  const navigateTo = useCallback((view: AppView, from?: AppView) => {
    if (view === currentView) return;

    // Access control: Protect Owner area
    if (view === 'owner' && !isOwnerAuthenticated()) {
      setShowPinModal(true);
      return;
    }

    // Stop audio previews when switching pages
    soundEngine.stop();
    setIsPlayingMelody(false);

    const effectiveFrom = from || currentView;
    setPreviousView(effectiveFrom);

    try {
      window.history.pushState({ view, from: effectiveFrom }, '', `#${view}`);
    } catch {
      // restricted sandbox fallback
    }

    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView]);

  // Centralized Contextual Back Handler
  const handleBack = useCallback(() => {
    // 1. If any modal is active, close it without navigating away
    if (showPinModal) {
      setShowPinModal(false);
      return;
    }
    if (activeRingingAlarm) {
      alarmAdapter.dismissAlarm(() => {
        setActiveRingingAlarm(null);
        setIsPlayingMelody(false);
      });
      return;
    }

    // Stop audio previews immediately
    soundEngine.stop();
    setIsPlayingMelody(false);

    // 2. Browser history pop if valid previous state exists
    const historyFrom = window.history.state?.from as AppView | undefined;
    if (window.history.length > 1 && historyFrom) {
      window.history.back();
      return;
    }

    // 3. Logical hierarchy fallback (handles deep-links, page refreshes, and direct navigation)
    let fallbackView: AppView = 'dashboard';
    if (currentView === 'sounds') {
      fallbackView = (previousView === 'settings' || historyFrom === 'settings') ? 'settings' : 'dashboard';
    } else if (currentView === 'invitation') {
      fallbackView = (previousView === 'settings' || historyFrom === 'settings')
        ? 'settings'
        : (previousView === 'about' || historyFrom === 'about' ? 'about' : 'dashboard');
    } else if (currentView === 'onboarding') {
      fallbackView = 'invitation';
    } else if (currentView === 'owner') {
      logoutOwner();
      fallbackView = 'dashboard';
    } else {
      fallbackView = 'dashboard';
    }

    setPreviousView(null);
    try {
      window.history.replaceState({ view: fallbackView, from: null }, '', `#${fallbackView}`);
    } catch {}
    setCurrentView(fallbackView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [showPinModal, activeRingingAlarm, currentView, previousView]);

  // Listen for browser popstate (Browser Back/Forward, iOS Swipe-Back, Android Chrome Back)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      soundEngine.stop();
      setIsPlayingMelody(false);

      if (showPinModal) {
        setShowPinModal(false);
      }

      const targetView = (event.state?.view as AppView) || getViewFromHash(window.location.hash);

      if (targetView) {
        // Owner Access Guard: never allow entering Owner Portal via back button if unauthenticated
        if (targetView === 'owner' && !isOwnerAuthenticated()) {
          try {
            window.history.replaceState({ view: 'dashboard', from: null }, '', '#dashboard');
          } catch {}
          setCurrentView('dashboard');
          setToastMessage('Owner portal is locked. PIN required.');
          setTimeout(() => setToastMessage(null), 3500);
          return;
        }

        // Onboarding & approval guards
        if (!settings.isApproved && targetView !== 'invitation') {
          setCurrentView('invitation');
          return;
        }
        if (!settings.hasCompletedOnboarding && targetView !== 'invitation' && targetView !== 'onboarding') {
          setCurrentView('onboarding');
          return;
        }

        setPreviousView(event.state?.from || null);
        setCurrentView(targetView);
      } else {
        const root = settings.isApproved ? 'dashboard' : 'invitation';
        setCurrentView(root);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [settings.isApproved, settings.hasCompletedOnboarding, showPinModal]);

  // Listen for Android physical / system back button via Capacitor App plugin
  useEffect(() => {
    const capApp = (window as any).Capacitor?.Plugins?.App;
    if (capApp && typeof capApp.addListener === 'function') {
      let handle: any = null;
      try {
        handle = capApp.addListener('backButton', () => {
          handleBack();
        });
      } catch (err) {
        console.warn('Capacitor backButton setup:', err);
      }
      return () => {
        if (handle && typeof handle.remove === 'function') {
          handle.remove();
        }
      };
    }
  }, [handleBack]);

  // Clock timer & alarm checks
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      // Check snooze expiration
      if (snoozeActiveUntil && now.getTime() >= snoozeActiveUntil.getTime()) {
        setSnoozeActiveUntil(null);
        handleTriggerAlarm('Snoozed Morning Ritual Alarm');
      }

      // Check scheduled 5:50 AM alarm (hours 5, minutes 50, seconds 0)
      if (settings.isApproved && settings.alarm1Enabled) {
        if (now.getHours() === 5 && now.getMinutes() === 50 && now.getSeconds() === 0) {
          handleTriggerAlarm('5:50 AM First Morning Whisper');
        }
      }

      // Check scheduled 6:30 AM alarm (hours 6, minutes 30, seconds 0)
      if (settings.isApproved && settings.alarm2Enabled) {
        if (now.getHours() === 6 && now.getMinutes() === 30 && now.getSeconds() === 0) {
          handleTriggerAlarm('6:30 AM Gentle Rise Ritual');
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [settings, snoozeActiveUntil]);

  // Sync alarms with native adapter on change
  useEffect(() => {
    if (settings.isApproved) {
      alarmAdapter.syncAlarms(settings);
    }
  }, [settings]);

  // Compute current day package (deterministic based on activation date)
  const currentDayNumber = getDayNumberForDate(settings.activationDate, currentTime);
  const currentPackage: MessagePackage = getPackageForDay(currentDayNumber);

  // Next occurrences
  const next550 = alarmAdapter.getNextOccurrence(5, 50);
  const next630 = alarmAdapter.getNextOccurrence(6, 30);
  const timeUntil550 = alarmAdapter.getTimeRemainingString(next550);
  const timeUntil630 = alarmAdapter.getTimeRemainingString(next630);

  // Toast notifier
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Trigger alarm test or scheduled ring
  const handleTriggerAlarm = (label: string) => {
    alarmAdapter.triggerAlarmNow(label, () => {
      setActiveRingingAlarm(label);
      setIsPlayingMelody(true);
    });
  };

  // Alarm dismiss handler (STOP ALARM)
  // Stops music immediately and leaves the other alarm scheduled
  const handleDismissAlarm = () => {
    alarmAdapter.dismissAlarm(() => {
      setActiveRingingAlarm(null);
      setIsPlayingMelody(false);
      showToast('Waking with love ❤️ Have a wonderful morning!');
    });
  };

  // Alarm snooze handler (9 Minutes)
  const handleSnoozeAlarm = () => {
    const mins = settings.snoozeMinutes || 9;
    const snoozeEnd = new Date(Date.now() + mins * 60 * 1000);
    setSnoozeActiveUntil(snoozeEnd);
    alarmAdapter.snoozeAlarm('alarm_550', mins, () => {
      setActiveRingingAlarm(null);
      setIsPlayingMelody(false);
      showToast(`Alarm snoozed for ${mins} minutes 💤`);
    });
  };

  // Toggle melody preview on dashboard
  const handleToggleMelody = () => {
    if (isPlayingMelody) {
      soundEngine.stop();
      setIsPlayingMelody(false);
    } else {
      soundEngine.setVolume(settings.volume);
      soundEngine.playTrack(settings.selectedSound, false);
      setIsPlayingMelody(true);
    }
  };

  // Invitation approval handler
  const handleApproveInvitation = () => {
    const updated: AppSettings = {
      ...settings,
      isApproved: true,
      approvalDate: getTodayDateString(),
      activationDate: getTodayDateString(),
      hasCompletedOnboarding: false,
    };
    setSettings(updated);
    saveSettings(updated);
    navigateTo('onboarding');
  };

  // Onboarding completion handler
  const handleCompleteOnboarding = () => {
    const updated: AppSettings = {
      ...settings,
      hasCompletedOnboarding: true,
    };
    setSettings(updated);
    saveSettings(updated);
    navigateTo('dashboard');
    showToast('Morning ritual activated! Both 5:50 & 6:30 AM scheduled.');
  };

  // Reset invitation handler
  const handleResetInvitation = () => {
    const reset = {
      ...DEFAULT_SETTINGS,
      isApproved: false,
      hasCompletedOnboarding: false,
    };
    setSettings(reset);
    saveSettings(reset);
    navigateTo('invitation');
  };

  // Discreet Owner Entrance
  const handleHeartClick = () => {
    const nextCount = heartTapCount + 1;
    setHeartTapCount(nextCount);
    if (nextCount >= 3) {
      setHeartTapCount(0);
      setShowPinModal(true);
    } else {
      setTimeout(() => setHeartTapCount(0), 1200);
    }
  };

  const handleOwnerLoginSuccess = () => {
    setShowPinModal(false);
    setPreviousView('dashboard');
    try {
      window.history.pushState({ view: 'owner', from: 'dashboard' }, '', '#owner');
    } catch {}
    setCurrentView('owner');
    showToast('Welcome to Owner Portal');
  };

  const handleOwnerExit = () => {
    logoutOwner();
    soundEngine.stop();
    setPreviousView(null);
    try {
      window.history.replaceState({ view: 'dashboard', from: null }, '', '#dashboard');
    } catch {}
    setCurrentView('dashboard');
  };

  // Current Sound Details from the 10 soundtracks
  const selectedSoundDetail =
    SOUND_TRACKS.find((s) => s.id === settings.selectedSound) || SOUND_TRACKS[0];

  // ===================== ACTIVE RINGING ALARM MODAL =====================
  if (activeRingingAlarm) {
    return (
      <RingingAlarmModal
        alarmLabel={activeRingingAlarm}
        messagePackage={currentPackage}
        selectedSoundId={settings.selectedSound}
        snoozeMinutes={settings.snoozeMinutes || 9}
        onDismiss={handleDismissAlarm}
        onSnooze={handleSnoozeAlarm}
      />
    );
  }

  // ===================== VIEW ROUTING =====================
  // 1. Invitation View
  if (currentView === 'invitation' || (!settings.isApproved && currentView === 'dashboard')) {
    return (
      <InvitationView
        onApprove={handleApproveInvitation}
        senderName={settings.senderName}
        recipientName={settings.recipientName}
        previousView={previousView}
        onBack={settings.isApproved ? handleBack : undefined}
      />
    );
  }

  // 2. Onboarding Setup View
  if (currentView === 'onboarding') {
    return (
      <OnboardingView
        onComplete={handleCompleteOnboarding}
        recipientName={settings.recipientName}
        onBack={settings.isApproved ? handleBack : undefined}
      />
    );
  }

  // 3. Sound Library View (Permitted Settings for Her)
  if (currentView === 'sounds') {
    return (
      <>
        {toastMessage && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-stone-900/90 text-white text-xs font-medium shadow-lg backdrop-blur-md animate-fade-in flex items-center gap-2">
            <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
            <span>{toastMessage}</span>
          </div>
        )}
        <SoundLibraryView
          settings={settings}
          onUpdateSettings={(newSettings) => setSettings(newSettings)}
          onBack={handleBack}
          previousView={previousView}
          onShowToast={showToast}
        />
      </>
    );
  }

  // 4. Alarm & Sound Settings View (Permitted Settings for Her)
  if (currentView === 'settings') {
    return (
      <>
        {toastMessage && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-stone-900/90 text-white text-xs font-medium shadow-lg backdrop-blur-md animate-fade-in flex items-center gap-2">
            <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
            <span>{toastMessage}</span>
          </div>
        )}
        <AlarmSettingsView
          settings={settings}
          onUpdateSettings={(newSettings) => setSettings(newSettings)}
          onNavigateToSounds={() => navigateTo('sounds', 'settings')}
          onBack={handleBack}
          onNavigateToInvitation={() => navigateTo('invitation', 'settings')}
        />
      </>
    );
  }

  // 5. Daily Message Reading View (Only Today's Note)
  if (currentView === 'daily-message') {
    return (
      <>
        {toastMessage && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-stone-900/90 text-white text-xs font-medium shadow-lg backdrop-blur-md animate-fade-in flex items-center gap-2">
            <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
            <span>{toastMessage}</span>
          </div>
        )}
        <DailyMessageView
          messagePackage={currentPackage}
          settings={settings}
          onBack={handleBack}
          onShowToast={showToast}
        />
      </>
    );
  }

  // 6. About & Morning Guide
  if (currentView === 'about') {
    return (
      <AboutHelpView
        onBack={handleBack}
        onNavigateToInvitation={() => navigateTo('invitation', 'about')}
      />
    );
  }

  // 7. Protected Owner Portal (PIN Protected)
  if (currentView === 'owner') {
    if (!isOwnerAuthenticated()) {
      return (
        <OwnerPinModal
          isOpen={true}
          onClose={() => setCurrentView('dashboard')}
          onSuccess={handleOwnerLoginSuccess}
        />
      );
    }
    return (
      <>
        {toastMessage && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-stone-900/90 text-white text-xs font-medium shadow-lg backdrop-blur-md animate-fade-in flex items-center gap-2">
            <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
            <span>{toastMessage}</span>
          </div>
        )}
        <OwnerPortalView
          settings={settings}
          onUpdateSettings={(newSettings) => setSettings(newSettings)}
          onExit={handleOwnerExit}
          onShowToast={showToast}
          onTriggerAlarmTest={(label) => handleTriggerAlarm(label)}
        />
      </>
    );
  }

  // ===================== 8. RECIPIENT HOME SANCTUARY DASHBOARD =====================
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#faf6f2] via-[#f8f0ea] to-[#f4e6de] text-stone-800 pb-12 selection:bg-rose-200">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-stone-900/90 text-white text-xs font-medium shadow-lg backdrop-blur-md animate-fade-in flex items-center gap-2">
          <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Owner PIN Modal */}
      <OwnerPinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={handleOwnerLoginSuccess}
      />

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#faf6f2]/85 backdrop-blur-md border-b border-amber-200/40 px-4 sm:px-6 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-200 to-amber-200 flex items-center justify-center text-rose-700 shadow-xs">
              <Heart className="w-4 h-4 fill-rose-400" />
            </div>
            <div>
              <h1 className="text-base font-serif font-bold text-stone-900 leading-none">
                Our Little Morning Ritual Bestpart ❤️
              </h1>
              <p className="text-[11px] text-stone-500 font-sans mt-0.5">
                A little love waiting for you every morning
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <PWAInstallButton />
            
            <button
              onClick={() => navigateTo('about')}
              className="p-2 rounded-full hover:bg-stone-100 text-stone-600 hover:text-stone-900 transition cursor-pointer"
              title="Morning Guide & Help"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigateTo('settings')}
              className="p-2 rounded-full hover:bg-stone-100 text-stone-600 hover:text-stone-900 transition cursor-pointer"
              title="Sound & Wake Preferences"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-5 space-y-5">
        
        {/* Snooze Alert if active */}
        {snoozeActiveUntil && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/40 text-amber-900 text-xs flex items-center justify-between animate-soft-pulse">
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-amber-600" />
              <span>
                Snooze active until{' '}
                <strong>
                  {snoozeActiveUntil.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </strong>
              </span>
            </div>
            <button
              onClick={() => setSnoozeActiveUntil(null)}
              className="text-[11px] font-semibold text-rose-700 hover:text-rose-900 underline cursor-pointer"
            >
              Cancel Snooze
            </button>
          </div>
        )}

        {/* Current Time & Alarm Status Card */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white/85 backdrop-blur-sm border border-[#ede1d8] shadow-md shadow-rose-900/5 relative overflow-hidden">
          
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className="text-[11px] font-medium text-amber-800 uppercase tracking-wider">
                {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
              <div className="text-4xl sm:text-5xl font-serif font-bold text-stone-900 tracking-tight mt-0.5">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
              </div>
            </div>

            <button
              onClick={() => handleTriggerAlarm('Wake Test (Our Beautiful Morning)')}
              className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-600 text-white text-xs font-semibold shadow-sm hover:shadow-md active:scale-95 transition cursor-pointer flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Test Alarm</span>
            </button>
          </div>

          {/* Dual Alarms Schedule Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-stone-100">
            {/* Alarm 1: 5:50 AM */}
            <div
              onClick={() => navigateTo('settings')}
              className={`p-3.5 rounded-2xl border transition cursor-pointer hover:border-amber-300 ${
                settings.alarm1Enabled ? 'bg-[#fdfaf7] border-amber-200/70' : 'bg-stone-50 border-stone-200 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-900">First Morning Whisper</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${settings.alarm1Enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'}`}>
                  {settings.alarm1Enabled ? 'Active' : 'Disabled'}
                </span>
              </div>
              <div className="text-2xl font-serif font-bold text-stone-900 mt-1">5:50 AM</div>
              <div className="text-[11px] text-stone-500 mt-0.5">
                {settings.alarm1Enabled ? `Rings ${timeUntil550}` : 'Alarm paused'}
              </div>
            </div>

            {/* Alarm 2: 6:30 AM */}
            <div
              onClick={() => navigateTo('settings')}
              className={`p-3.5 rounded-2xl border transition cursor-pointer hover:border-rose-300 ${
                settings.alarm2Enabled ? 'bg-[#fdfaf7] border-rose-200/70' : 'bg-stone-50 border-stone-200 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-900">Gentle Rise Ritual</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${settings.alarm2Enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'}`}>
                  {settings.alarm2Enabled ? 'Active' : 'Disabled'}
                </span>
              </div>
              <div className="text-2xl font-serif font-bold text-stone-900 mt-1">6:30 AM</div>
              <div className="text-[11px] text-stone-500 mt-0.5">
                {settings.alarm2Enabled ? `Rings ${timeUntil630}` : 'Alarm paused'}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 mt-1 text-[11px] text-stone-500">
            <span className="flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Both alarms awaken you with today's love note</span>
            </span>
            <button
              onClick={() => navigateTo('settings')}
              className="text-rose-800 font-semibold hover:underline"
            >
              Settings →
            </button>
          </div>

        </div>

        {/* Today's Sacred Message Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white/90 backdrop-blur-sm border border-[#eedfd6] shadow-xl shadow-rose-900/5 space-y-6">
          
          <div className="flex items-center justify-between border-b border-rose-100 pb-4">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">
                Today's Sacred Note
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-1">
                {currentPackage.theme}
              </h2>
            </div>
            
            <button
              onClick={() => navigateTo('daily-message')}
              className="px-3.5 py-1.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-1 transition cursor-pointer border border-rose-200/60"
            >
              <span>Full View</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Romantic First-Person Message */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
              His Morning Note
            </span>
            <div className="bg-[#fcf8f4] p-5 rounded-2xl border border-amber-100/80">
              <p className="font-serif italic text-base sm:text-lg text-stone-800 leading-relaxed">
                "{currentPackage.romanticMessage}"
              </p>
              <div className="text-right font-serif text-xs text-rose-800 font-semibold mt-3">
                {currentPackage.lovingClosing}
              </div>
            </div>
          </div>

          {/* Morning Encouragement */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-rose-800">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>For Your Day</span>
            </div>
            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed bg-white/70 p-4 rounded-xl border border-stone-200/60">
              {currentPackage.encouragement}
            </p>
          </div>

          {/* Scripture Verse */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-tr from-amber-50/80 to-[#fff8f2] border border-amber-200/60 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-amber-900">
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-amber-700" />
                <span>{currentPackage.bibleVerse.reference}</span>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-amber-700 font-normal">Scripture</span>
            </div>
            <p className="italic text-xs sm:text-sm text-stone-800 leading-relaxed">
              "{currentPackage.bibleVerse.text}"
            </p>
          </div>

          {/* Short Prayer */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-600">
              A Morning Prayer For You
            </span>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed italic bg-stone-50/70 p-4 rounded-xl border border-stone-200/50">
              {currentPackage.prayer}
            </p>
          </div>

        </div>

        {/* Audio Soundscape Card (10 Soundtracks) */}
        <div className="p-5 rounded-3xl bg-white/80 backdrop-blur-sm border border-stone-200/70 shadow-xs flex items-center justify-between">
          <div
            onClick={() => navigateTo('sounds')}
            className="flex items-center gap-3 cursor-pointer group flex-1"
          >
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-700 group-hover:scale-105 transition">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-stone-500 font-medium">Selected Alarm Soundtrack</div>
              <div className="text-sm font-semibold text-stone-900 group-hover:text-rose-700 transition">
                {selectedSoundDetail.name}
              </div>
              <div className="text-[11px] text-stone-500">{selectedSoundDetail.instrumentation}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleMelody}
              className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                isPlayingMelody
                  ? 'bg-rose-500 text-white border-rose-600 shadow-sm'
                  : 'bg-white hover:bg-stone-50 text-stone-800 border-stone-200'
              }`}
            >
              {isPlayingMelody ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Preview</span>
                </>
              )}
            </button>

            <button
              onClick={() => navigateTo('sounds')}
              className="px-3.5 py-2.5 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-800 text-xs font-semibold transition cursor-pointer"
            >
              Sound Library →
            </button>
          </div>
        </div>

        {/* Permitted Personal Navigation Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={() => navigateTo('sounds')}
            className="p-3.5 rounded-2xl bg-white border border-stone-200 hover:border-rose-200 hover:bg-rose-50/50 text-stone-800 text-center transition cursor-pointer shadow-xs"
          >
            <Music className="w-4 h-4 mx-auto text-rose-500 mb-1" />
            <div className="text-xs font-semibold">10 Romantic Sounds</div>
            <div className="text-[10px] text-stone-500">Preview & Choose</div>
          </button>

          <button
            onClick={() => navigateTo('settings')}
            className="p-3.5 rounded-2xl bg-white border border-stone-200 hover:border-amber-200 hover:bg-amber-50/50 text-stone-800 text-center transition cursor-pointer shadow-xs"
          >
            <Sliders className="w-4 h-4 mx-auto text-amber-600 mb-1" />
            <div className="text-xs font-semibold">Alarm Preferences</div>
            <div className="text-[10px] text-stone-500">Volume & Fade-In</div>
          </button>
        </div>

        {/* Bottom subtle assurance */}
        <div className="text-center py-4 text-[11px] text-stone-400 flex items-center justify-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Local Device Storage · 100% Offline · Private Sanctuary</span>
        </div>

      </main>

    </div>
  );
}
