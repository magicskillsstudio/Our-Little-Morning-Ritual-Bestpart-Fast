/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Volume2, Play, Square, Bell, Clock, Sliders, Calendar, RotateCcw, Check, Music2 } from 'lucide-react';
import { AppSettings, saveSettings } from '../utils/storage';
import { soundEngine, SOUND_TRACKS } from '../utils/audioEngine';

interface Props {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onClose: () => void;
  onResetInvitation: () => void;
}

export const SettingsModal: React.FC<Props> = ({
  settings,
  onUpdateSettings,
  onClose,
  onResetInvitation,
}) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>({ ...settings });
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);

  const handleToggleSoundPreview = (trackId: string) => {
    if (playingTrackId === trackId) {
      soundEngine.stop();
      setPlayingTrackId(null);
    } else {
      soundEngine.setVolume(localSettings.volume);
      soundEngine.previewSound(trackId);
      setPlayingTrackId(trackId);
    }
  };

  const handleSelectSound = (trackId: string) => {
    const updated = { ...localSettings, selectedSound: trackId };
    setLocalSettings(updated);
    saveSettings(updated);
    onUpdateSettings(updated);
  };

  const handleVolumeChange = (vol: number) => {
    const updated = { ...localSettings, volume: vol };
    setLocalSettings(updated);
    soundEngine.setVolume(vol);
    saveSettings(updated);
    onUpdateSettings(updated);
  };

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const updated = { ...localSettings, [key]: value };
    setLocalSettings(updated);
    saveSettings(updated);
    onUpdateSettings(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-[#fcf9f6] border border-amber-100 rounded-3xl p-5 sm:p-7 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto text-stone-800">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-amber-200/50 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-stone-900">Ritual Settings</h2>
              <p className="text-xs text-stone-500">Alarms, 10 romantic soundtracks, and preferences</p>
            </div>
          </div>
          <button
            onClick={() => {
              soundEngine.stop();
              onClose();
            }}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Dual Alarm Toggles */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-800">
            <Bell className="w-3.5 h-3.5" />
            <span>Independent Repeating Alarms</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Alarm 1: 5:50 AM */}
            <div className="p-3.5 rounded-2xl bg-white border border-stone-200/70 flex items-center justify-between shadow-xs">
              <div>
                <div className="text-[11px] text-stone-500 font-medium">First Whisper</div>
                <div className="text-xl font-serif font-bold text-stone-900">5:50 AM</div>
                <div className="text-[10px] text-stone-400">Independent schedule</div>
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
            <div className="p-3.5 rounded-2xl bg-white border border-stone-200/70 flex items-center justify-between shadow-xs">
              <div>
                <div className="text-[11px] text-stone-500 font-medium">Gentle Rise</div>
                <div className="text-xl font-serif font-bold text-stone-900">6:30 AM</div>
                <div className="text-[10px] text-stone-400">Shares same day message</div>
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

        {/* Section 2: TEN ROMANTIC INSTRUMENTAL SOUNDTRACKS */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-800">
              <Music2 className="w-3.5 h-3.5" />
              <span>Ten Romantic Soundtracks (Offline)</span>
            </div>
            <span className="text-[10px] text-stone-400">10 Complete Compositions</span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {SOUND_TRACKS.map((track, idx) => {
              const isSelected = localSettings.selectedSound === track.id;
              const isPlaying = playingTrackId === track.id;

              return (
                <div
                  key={track.id}
                  className={`p-3 rounded-2xl border transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-rose-50/90 border-rose-300 shadow-xs'
                      : 'bg-white border-stone-200/70 hover:border-stone-300'
                  }`}
                >
                  <div className="flex-1 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-rose-800 w-4">{idx + 1}.</span>
                      <span className="text-xs font-semibold text-stone-900">{track.name}</span>
                      {isSelected && (
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-rose-500 text-white">
                          Selected
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5 ml-6 leading-tight">{track.description}</p>
                    <span className="text-[9px] uppercase tracking-wider text-amber-800/80 ml-6 font-medium">
                      {track.instrumentation}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Play/Stop Preview */}
                    <button
                      type="button"
                      onClick={() => handleToggleSoundPreview(track.id)}
                      className={`p-2 rounded-xl text-xs font-medium border flex items-center gap-1 transition cursor-pointer ${
                        isPlaying
                          ? 'bg-rose-500 text-white border-rose-600'
                          : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                      }`}
                      title={isPlaying ? 'Stop Preview' : 'Play Preview'}
                    >
                      {isPlaying ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                      <span className="text-[11px]">{isPlaying ? 'Stop' : 'Listen'}</span>
                    </button>

                    {/* Select button */}
                    <button
                      type="button"
                      onClick={() => handleSelectSound(track.id)}
                      disabled={isSelected}
                      className={`px-2.5 py-2 rounded-xl text-xs font-medium border transition cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 cursor-default'
                          : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200'
                      }`}
                    >
                      {isSelected ? <Check className="w-3.5 h-3.5" /> : 'Select'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Volume Control */}
          <div className="p-3.5 rounded-2xl bg-white border border-stone-200/70 space-y-2 mt-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-stone-700 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-stone-500" />
                <span>Alarm Master Volume</span>
              </span>
              <span className="font-semibold text-rose-800">{Math.round(localSettings.volume * 100)}%</span>
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
          </div>

          {/* Gentle Crescendo Toggle */}
          <div className="p-3.5 rounded-2xl bg-white border border-stone-200/70 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-stone-800">Gentle Wake Crescendo</div>
              <div className="text-[11px] text-stone-500">Gradual 12-second fade-in for a soft awakening</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.crescendoEnabled}
                onChange={(e) => updateSetting('crescendoEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
            </label>
          </div>
        </div>

        {/* Section 3: Snooze Settings */}
        <div className="p-3.5 rounded-2xl bg-white border border-stone-200/70 mb-5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-stone-800 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-stone-500" />
              <span>Snooze Duration</span>
            </span>
            <span className="text-[11px] text-stone-500">Fixed at 9 min (Standard)</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[5, 9, 10, 15].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => updateSetting('snoozeMinutes', mins)}
                className={`py-2 text-xs font-medium rounded-xl border transition cursor-pointer ${
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

        {/* Section 4: Ritual Activation Date (for testing or restart) */}
        <div className="p-3.5 rounded-2xl bg-white border border-stone-200/70 mb-5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-stone-800 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-stone-500" />
              <span>Ritual Activation Date</span>
            </span>
          </div>
          <input
            type="date"
            value={localSettings.activationDate}
            onChange={(e) => updateSetting('activationDate', e.target.value)}
            className="w-full text-xs p-2 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 focus:outline-rose-500"
          />
          <p className="text-[10px] text-stone-400">
            Day 1 begins on this date and advances sequentially to Day 200 before restarting.
          </p>
        </div>

        {/* Re-read invitation */}
        <div className="pt-2 border-t border-amber-200/40">
          <button
            onClick={() => {
              soundEngine.stop();
              onResetInvitation();
            }}
            className="w-full py-2.5 px-4 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50/60 text-xs font-medium transition cursor-pointer flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Re-read Original Invitation</span>
          </button>
        </div>

      </div>
    </div>
  );
};
