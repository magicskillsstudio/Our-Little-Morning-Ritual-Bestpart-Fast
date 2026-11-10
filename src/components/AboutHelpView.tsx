/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ArrowLeft,
  Heart,
  ShieldCheck,
  Bell,
  Clock,
  BatteryCharging,
  Smartphone,
  Music,
  HelpCircle,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface Props {
  onBack: () => void;
  onNavigateToInvitation: () => void;
}

export const AboutHelpView: React.FC<Props> = ({
  onBack,
  onNavigateToInvitation,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#faf6f2] via-[#f7eee9] to-[#f4e6de] text-stone-800 pb-16">
      
      {/* Top Header with Back Navigation */}
      <header className="sticky top-0 z-40 bg-[#faf6f2]/90 backdrop-blur-md border-b border-amber-200/50 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-stone-700 bg-white/80 border border-stone-200/80 hover:bg-stone-100 hover:text-stone-900 transition cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-stone-600" />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center gap-1 text-xs font-medium text-rose-800">
            <HelpCircle className="w-4 h-4" />
            <span>Morning Guide & Help</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-5 space-y-5">
        
        {/* Title */}
        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">
            Private Sanctuary Guidance
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
            Our Little Morning Ritual Bestpart ❤️
          </h1>
          <p className="text-xs text-stone-600 leading-relaxed">
            A quiet, intimate space created for you. Learn how your morning alarms work and how to configure your phone for smooth, reliable wakeups.
          </p>
        </div>

        {/* 100% Offline & Private Card */}
        <div className="p-5 rounded-3xl bg-white/90 backdrop-blur-sm border border-emerald-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/70">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-900">100% Offline & Private</h2>
              <span className="text-[11px] text-stone-500">Zero cloud calls · Zero tracking · Zero ads</span>
            </div>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            All morning messages and all 10 romantic instrumental soundtracks are stored locally on your device. The app requires no internet access, user registration, or cloud connections.
          </p>
        </div>

        {/* Dual Repeating Alarms Card */}
        <div className="p-5 rounded-3xl bg-white/90 backdrop-blur-sm border border-amber-100 shadow-sm space-y-3">
          <div className="flex items-center gap-2.5 border-b border-stone-100 pb-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/70">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-900">Dual Repeating Daily Alarms</h2>
              <span className="text-[11px] text-stone-500">5:50 AM First Whisper & 6:30 AM Gentle Rise</span>
            </div>
          </div>

          <div className="space-y-2 text-xs text-stone-600 leading-relaxed">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Same Message Continuity:</strong> Both alarms on any calendar day automatically present the identical love message, so you never miss a word.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Independent Dismissal:</strong> Dismissing or stopping the 5:50 AM alarm never cancels the 6:30 AM alarm.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>9-Minute Snooze:</strong> Snoozing gives you an extra nine minutes of peaceful rest before waking you again.</span>
            </div>
          </div>
        </div>

        {/* Android Native Instructions */}
        <div className="p-5 rounded-3xl bg-white/90 backdrop-blur-sm border border-stone-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-stone-900">Android Phone Setup</h2>
                <span className="text-[11px] text-stone-500">Ensure alarms ring reliably when screen is asleep</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
              Important
            </span>
          </div>

          <div className="space-y-2 text-xs text-stone-600 leading-relaxed">
            <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/60 space-y-1">
              <div className="font-semibold text-stone-800 flex items-center gap-1.5">
                <BatteryCharging className="w-3.5 h-3.5 text-amber-600" />
                <span>1. Set Battery to "Unrestricted"</span>
              </div>
              <p className="text-[11px] text-stone-500">
                In phone <em>Settings → Apps → Our Little Morning Ritual → Battery</em>, choose "Unrestricted". This prevents Android from delaying alarms while you sleep.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/60 space-y-1">
              <div className="font-semibold text-stone-800 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-rose-600" />
                <span>2. Allow "Alarms & Reminders"</span>
              </div>
              <p className="text-[11px] text-stone-500">
                In <em>Settings → Apps → Special App Access → Alarms & Reminders</em>, toggle "Allow setting alarms" to On.
              </p>
            </div>
          </div>
        </div>

        {/* iPhone / iOS Instructions */}
        <div className="p-5 rounded-3xl bg-white/90 backdrop-blur-sm border border-stone-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-stone-900">iPhone Setup</h2>
                <span className="text-[11px] text-stone-500">Apple AlarmKit on iOS 26+ and iOS notifications</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
              iPhone
            </span>
          </div>

          <div className="space-y-2 text-xs text-stone-600 leading-relaxed">
            <p>
              On iOS 26+, the app schedules true system alarms via Apple's AlarmKit. On earlier iOS versions, notifications sound with bundled romantic audio. Keep your ringer volume up at night.
            </p>
            <div className="p-3 rounded-2xl bg-[#fdfaf7] border border-amber-200/60 text-[11px] text-stone-600">
              💡 <strong>Sleep Focus Mode:</strong> If you use Sleep Focus or Do Not Disturb, add "Our Little Morning Ritual" to the Allowed Apps list.
            </div>
          </div>
        </div>

        {/* PWA Home Screen Installation */}
        <div className="p-5 rounded-3xl bg-white/90 backdrop-blur-sm border border-stone-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-stone-900">Add to Home Screen</h2>
              <span className="text-[11px] text-stone-500">Launch directly like a native app</span>
            </div>
            <PWAInstallButton />
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            Tap the button above or use Safari's "Add to Home Screen" to install the app onto your phone without browser navigation bars.
          </p>
        </div>

        {/* Re-read Invitation Link */}
        <div className="pt-2">
          <button
            onClick={onNavigateToInvitation}
            className="w-full p-4 rounded-2xl bg-white border border-stone-200 hover:bg-stone-50 text-left transition cursor-pointer shadow-xs flex items-center justify-between"
          >
            <div>
              <span className="text-xs font-semibold text-stone-900">Original Invitation Letter</span>
              <p className="text-[11px] text-stone-500">Re-read the sweet proposal that began our ritual</p>
            </div>
            <RotateCcw className="w-4 h-4 text-rose-500" />
          </button>
        </div>

        {/* Bottom Back Button */}
        <div className="pt-4 text-center">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 text-xs font-semibold transition cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </button>
        </div>

      </main>
    </div>
  );
};
