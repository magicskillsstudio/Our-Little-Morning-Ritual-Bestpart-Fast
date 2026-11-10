/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ArrowLeft, Bell, Clock, Music, Volume2, RotateCcw, ShieldCheck, Sparkles, Sliders } from 'lucide-react';
import { AppSettings, saveSettings } from '../utils/storage';
import { alarmAdapter } from '../services/alarmAdapter';
import { SOUND_TRACKS, soundEngine } from '../utils/audioEngine';

interface Props {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onNavigateToSounds: () => void;
  onBack: () => void;
  onNavigateToInvitation: () => void;
}

export const AlarmSettingsView: React.FC<Props> = ({
  settings,
  onUpdateSettings,
  onNavigateToSounds,
  onBack,
  onNavigateToInvitation,
}) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>({ ...settings });
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const updated = { ...localSettings, [key]: value };
    setLocalSettings(updated);
    saveSettings(updated);
    onUpdateSettings(updated);
    alarmAdapter.syncAlarms(updated);
  };

  const handleVolumeChange = (vol: number) => {
    soundEngine.setVolume(vol);
    updateSetting('volume', vol);
  };

  const togglePreview = () => {
    if (isPlayingPreview) {
      soundEngine.stop();
      setIsPlayingPreview(false);
    } else {
      soundEngine.setVolume(localSettings.volume);
      soundEngine.playTrack(localSettings.selectedSound, false);
      setIsPlayingPreview(true);
    }
  };

  const selectedTrack =
    SOUND_TRACKS.find((t) => t.id === localSettings.selectedSound) || SOUND_TRACKS[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#faf6f2] via-[#f7eee9] to-[#f4e6de] text-stone-800 pb-16">
      
      {/* Top Header with Back Navigation */}
      <header className="sticky top-0 z-40 bg-[#faf6f2]/90 backdrop-blur-md border-b border-amber-200/50 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => {
              if (isPlayingPreview) soundEngine.stop();
              onBack();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-stone-700 bg-white/80 border border-stone-200/80 hover:bg-stone-100 hover:text-stone-900 transition cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-stone-600" />
            <span>Back to Dashboard</span>
          </button>

          <span className="text-xs text-rose-800 font-semibold">Morning Ritual Settings</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-5 space-y-5">
        
        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">
            Personal Sound & Wake Preferences
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
            Alarm & Sound Settings
          </h1>
          <p className="text-xs text-stone-600 leading-relaxed">
            Adjust your morning alarm sound, master volume, and gentle fade-in at any time. Changes are saved automatically.
          </p>
        </div>

        {/* Selected Sound & Sound Library Card */}
        <div className="p-5 rounded-3xl bg-white/90 backdrop-blur-sm border border-rose-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-rose-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-800">Alarm Soundtrack</h2>
            </div>
            <span className="text-[11px] text-stone-500">10 Romantic Compositions</span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-rose-700">Currently Selected</span>
              <div className="text-base font-serif font-bold text-stone-900">{selectedTrack.name}</div>
              <p className="text-xs text-stone-500 mt-0.5">{selectedTrack.instrumentation}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={togglePreview}
                className="px-3 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 transition cursor-pointer"
              >
                {isPlayingPreview ? 'Stop' : 'Preview'}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (isPlayingPreview) soundEngine.stop();
                  onNavigateToSounds();
                }}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-600 text-white text-xs font-semibold shadow-xs hover:shadow-sm active:scale-95 transition cursor-pointer"
              >
                Change Sound →
              </button>
            </div>
          </div>
        </div>

        {/* Master Volume Slider */}
        <div className="p-5 rounded-3xl bg-white/90 backdrop-blur-sm border border-amber-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-stone-800 flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-rose-600" />
              <span>Alarm Volume Level</span>
            </span>
            <span className="font-bold text-rose-800">{Math.round(localSettings.volume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            value={localSettings.volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-full accent-rose-500 cursor-pointer"
          />
          <p className="text-[11px] text-stone-500">
            Controls both preview playback and actual morning alarm volume on your device.
          </p>
        </div>

        {/* Gentle Crescendo Fade-in Toggle */}
        <div className="p-5 rounded-3xl bg-white/90 backdrop-blur-sm border border-amber-100 shadow-sm flex items-center justify-between">
          <div className="pr-4">
            <div className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Gentle Wake Crescendo</span>
            </div>
            <div className="text-[11px] text-stone-500 mt-0.5">
              Gradually increases the music volume over 12 seconds so you awaken softly.
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={localSettings.crescendoEnabled}
              onChange={(e) => updateSetting('crescendoEnabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-12 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
          </label>
        </div>

        {/* Dual Alarms Schedule Overview */}
        <div className="p-5 rounded-3xl bg-white/90 backdrop-blur-sm border border-amber-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
            <Bell className="w-4 h-4 text-rose-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-800">Two Daily Morning Alarms</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Alarm 1: 5:50 AM */}
            <div className="p-3.5 rounded-2xl bg-[#fdfaf7] border border-amber-200/70 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-stone-500">First Morning Whisper</span>
                <div className="text-xl font-serif font-bold text-stone-900 mt-0.5">5:50 AM</div>
                <p className="text-[10px] text-stone-500 mt-0.5">Local phone time zone</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.alarm1Enabled}
                  onChange={(e) => updateSetting('alarm1Enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
              </label>
            </div>

            {/* Alarm 2: 6:30 AM */}
            <div className="p-3.5 rounded-2xl bg-[#fdfaf7] border border-rose-200/70 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-stone-500">Gentle Rise Ritual</span>
                <div className="text-xl font-serif font-bold text-stone-900 mt-0.5">6:30 AM</div>
                <p className="text-[10px] text-stone-500 mt-0.5">Shares same day love note</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.alarm2Enabled}
                  onChange={(e) => updateSetting('alarm2Enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Snooze Duration Selector */}
        <div className="p-5 rounded-3xl bg-white/90 backdrop-blur-sm border border-amber-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-stone-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-800">Snooze Duration</h2>
            </div>
            <span className="text-xs font-semibold text-rose-800">{localSettings.snoozeMinutes} Minutes</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[5, 9, 10, 15].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => updateSetting('snoozeMinutes', mins)}
                className={`py-2 text-xs font-semibold rounded-xl border transition cursor-pointer ${
                  localSettings.snoozeMinutes === mins
                    ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                }`}
              >
                {mins} min
              </button>
            ))}
          </div>
        </div>

        {/* Re-read Invitation */}
        <div className="pt-1">
          <button
            onClick={() => {
              if (isPlayingPreview) soundEngine.stop();
              onNavigateToInvitation();
            }}
            className="w-full py-3 px-4 rounded-2xl border border-rose-200 text-rose-700 hover:bg-rose-50/70 text-xs font-medium transition cursor-pointer flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Re-read Original Invitation Letter</span>
          </button>
        </div>

        {/* Bottom Back Button */}
        <div className="pt-2 text-center">
          <button
            onClick={() => {
              if (isPlayingPreview) soundEngine.stop();
              onBack();
            }}
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
