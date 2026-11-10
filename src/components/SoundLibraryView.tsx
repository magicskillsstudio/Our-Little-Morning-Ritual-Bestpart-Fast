/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ArrowLeft, Play, Square, Check, Volume2, Music2, Sparkles, Sliders } from 'lucide-react';
import { SOUND_TRACKS, SoundTrack, soundEngine } from '../utils/audioEngine';
import { AppSettings, saveSettings } from '../utils/storage';
import { alarmAdapter } from '../services/alarmAdapter';

interface Props {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onBack: () => void;
  previousView?: string | null;
  onShowToast: (msg: string) => void;
}

export const SoundLibraryView: React.FC<Props> = ({
  settings,
  onUpdateSettings,
  onBack,
  previousView,
  onShowToast,
}) => {
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [volume, setVolume] = useState<number>(settings.volume);
  const [crescendo, setCrescendo] = useState<boolean>(settings.crescendoEnabled);

  const backLabel = previousView === 'settings' ? 'Back to Settings' : 'Back to Dashboard';
  const returnLabel = previousView === 'settings' ? 'Return to Settings' : 'Return to Dashboard';

  const handleTogglePreview = (track: SoundTrack) => {
    if (playingTrackId === track.id) {
      soundEngine.stop();
      setPlayingTrackId(null);
    } else {
      soundEngine.setVolume(volume);
      soundEngine.previewSound(track.id);
      setPlayingTrackId(track.id);
    }
  };

  const handleSelectSound = (track: SoundTrack) => {
    const updated = {
      ...settings,
      selectedSound: track.id,
      volume,
      crescendoEnabled: crescendo,
    };
    saveSettings(updated);
    onUpdateSettings(updated);
    alarmAdapter.syncAlarms(updated);

    onShowToast(`Your morning will now wake up to ${track.name} ❤️`);
  };

  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    soundEngine.setVolume(vol);
    const updated = { ...settings, volume: vol };
    saveSettings(updated);
    onUpdateSettings(updated);
  };

  const handleCrescendoToggle = (enabled: boolean) => {
    setCrescendo(enabled);
    const updated = { ...settings, crescendoEnabled: enabled };
    saveSettings(updated);
    onUpdateSettings(updated);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#faf6f2] via-[#f7eee9] to-[#f4e6de] text-stone-800 pb-16">
      
      {/* Top Navigation Header with Visible Back Button */}
      <header className="sticky top-0 z-40 bg-[#faf6f2]/90 backdrop-blur-md border-b border-amber-200/50 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => {
              soundEngine.stop();
              onBack();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-stone-700 bg-white/80 border border-stone-200/80 hover:bg-stone-100 hover:text-stone-900 transition cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-stone-600" />
            <span>{backLabel}</span>
          </button>

          <div className="flex items-center gap-1.5 text-xs text-rose-800 font-medium">
            <Music2 className="w-4 h-4" />
            <span>10 Romantic Soundtracks</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-5 space-y-5">
        
        {/* Title Header */}
        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">
            Acoustic & Orchestral Library
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
            Choose Her Morning Melody
          </h1>
          <p className="text-xs text-stone-600 leading-relaxed">
            All 10 instrumental arrangements are bundled locally into the app. Listen to previews with no internet required, and press <strong className="text-stone-900 font-semibold">Select This Sound</strong> to save her alarm soundtrack.
          </p>
        </div>

        {/* Master Audio Controls Card */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white/90 backdrop-blur-sm border border-amber-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-rose-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-800">Sound Preferences</h2>
            </div>
            <span className="text-[11px] text-stone-500">Applies to 5:50 & 6:30 AM Alarms</span>
          </div>

          {/* Volume Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-stone-700 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-stone-500" />
                <span>Alarm Volume Level</span>
              </span>
              <span className="font-semibold text-rose-800">{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer"
            />
          </div>

          {/* Crescendo Fade-in Toggle */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <div className="text-xs font-medium text-stone-800">Gentle Wake Crescendo</div>
              <div className="text-[11px] text-stone-500">Gradually ramps volume over 12 seconds so she wakes peacefully</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={crescendo}
                onChange={(e) => handleCrescendoToggle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
            </label>
          </div>
        </div>

        {/* Currently Active Sound Indicator Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50 via-amber-50 to-[#fff8f2] border border-rose-200/80 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-rose-800">Current Morning Alarm</span>
              <div className="text-sm font-bold text-stone-900">
                {SOUND_TRACKS.find(t => t.id === settings.selectedSound)?.name || 'Our Beautiful Morning'}
              </div>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Active for Both Alarms
          </span>
        </div>

        {/* 10 Soundtracks List */}
        <div className="space-y-3">
          {SOUND_TRACKS.map((track, idx) => {
            const isSelected = settings.selectedSound === track.id;
            const isPlaying = playingTrackId === track.id;

            return (
              <div
                key={track.id}
                className={`p-4 rounded-3xl border transition-all ${
                  isSelected
                    ? 'bg-white border-rose-300 shadow-md ring-1 ring-rose-300/40'
                    : 'bg-white/80 border-stone-200/80 hover:border-stone-300 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center text-[10px] font-bold">
                        {idx + 1}
                      </span>
                      <h3 className="text-sm sm:text-base font-serif font-bold text-stone-900">
                        {track.name}
                      </h3>
                      {isSelected && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white shadow-xs">
                          Selected
                        </span>
                      )}
                      {isPlaying && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                          Playing Preview
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                      {track.description}
                    </p>
                    <div className="text-[11px] font-medium text-amber-800/90 mt-1">
                      {track.instrumentation}
                    </div>
                  </div>
                </div>

                {/* Action Buttons: Play Preview & Select Sound */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 mt-2">
                  <button
                    type="button"
                    onClick={() => handleTogglePreview(track)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition cursor-pointer ${
                      isPlaying
                        ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                    }`}
                  >
                    {isPlaying ? (
                      <>
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span>Stop Preview</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Play Preview</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectSound(track)}
                    disabled={isSelected}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 opacity-90 cursor-default'
                        : 'bg-gradient-to-r from-rose-500 to-amber-600 text-white border-transparent hover:shadow-md active:scale-95'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Current Alarm Sound</span>
                      </>
                    ) : (
                      <span>Select This Sound</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Back Button */}
        <div className="pt-4 text-center">
          <button
            onClick={() => {
              soundEngine.stop();
              onBack();
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 text-xs font-semibold transition cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{returnLabel}</span>
          </button>
        </div>

      </main>
    </div>
  );
};
