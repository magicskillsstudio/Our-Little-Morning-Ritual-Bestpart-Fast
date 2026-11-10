/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Heart, Bell, Moon, Sun, BookOpen, Sparkles, Volume2, X, Music } from 'lucide-react';
import { MessagePackage } from '../data/messagePackages';
import { SOUND_TRACKS } from '../utils/audioEngine';

interface Props {
  alarmLabel: string; // e.g. "5:50 AM First Morning Whisper"
  messagePackage: MessagePackage;
  selectedSoundId: string;
  snoozeMinutes: number;
  onDismiss: () => void;
  onSnooze: () => void;
}

export const RingingAlarmModal: React.FC<Props> = ({
  alarmLabel,
  messagePackage,
  selectedSoundId,
  snoozeMinutes,
  onDismiss,
  onSnooze,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'message' | 'encouragement' | 'scripture'>('message');

  const currentTrack =
    SOUND_TRACKS.find((t) => t.id === selectedSoundId) || SOUND_TRACKS[0];

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-[#2e1c24] via-[#3a232b] to-[#1c1216] text-[#fcf8f4] flex flex-col justify-between p-4 sm:p-6 animate-fade-in">
      
      {/* Ambient background pulsing orbs */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-rose-500/20 blur-3xl pointer-events-none animate-soft-pulse" />
      <div className="absolute bottom-10 left-10 w-64 h-64 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

      {/* Top Bar with sound indicator */}
      <div className="w-full max-w-lg mx-auto flex items-center justify-between z-10 pt-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/20 border border-rose-300/30 text-rose-200 text-xs font-medium">
          <Music className="w-3.5 h-3.5 animate-pulse text-amber-300" />
          <span>Playing: {currentTrack.name}</span>
        </div>
        <button
          onClick={onDismiss}
          className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-stone-300 transition cursor-pointer"
          title="Stop Alarm"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Center Wake Up Hero */}
      <div className="w-full max-w-lg mx-auto my-auto z-10 text-center py-4 space-y-4">
        
        {/* Ringing Clock & Alarm Type */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/15 text-amber-200 border border-amber-300/30 text-xs font-medium uppercase tracking-wider mb-2">
            <Sun className="w-3.5 h-3.5 text-amber-300" />
            <span>{alarmLabel}</span>
          </div>
          <div className="text-5xl sm:text-6xl font-serif font-bold tracking-tight text-white drop-shadow-md">
            {currentTime || "05:50 AM"}
          </div>
          <p className="text-sm font-serif italic text-rose-200/90">
            "Good morning, my sweetest love."
          </p>
        </div>

        {/* Today's Message Card with soft frosted glass */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/15 p-5 sm:p-6 text-left shadow-2xl space-y-4">
          
          {/* Card Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-amber-300 font-semibold">
                Today's Sacred Note
              </span>
              <h2 className="text-lg font-serif font-semibold text-white">
                {messagePackage.theme}
              </h2>
            </div>
            <Heart className="w-5 h-5 text-rose-400 fill-rose-400/80 animate-soft-pulse" />
          </div>

          {/* Interactive Navigation Pills for Content */}
          <div className="flex items-center gap-1.5 p-1 bg-black/20 rounded-xl">
            <button
              onClick={() => setActiveTab('message')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer ${
                activeTab === 'message'
                  ? 'bg-rose-500/80 text-white shadow-sm'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              Love Note
            </button>
            <button
              onClick={() => setActiveTab('encouragement')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer ${
                activeTab === 'encouragement'
                  ? 'bg-rose-500/80 text-white shadow-sm'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              Today's Word
            </button>
            <button
              onClick={() => setActiveTab('scripture')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer ${
                activeTab === 'scripture'
                  ? 'bg-rose-500/80 text-white shadow-sm'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              Scripture & Prayer
            </button>
          </div>

          {/* Tab Content */}
          <div className="min-h-[140px] text-xs sm:text-sm text-stone-200 leading-relaxed font-sans">
            {activeTab === 'message' && (
              <div className="space-y-3">
                <p className="italic text-rose-100 font-serif text-base leading-relaxed">
                  "{messagePackage.romanticMessage}"
                </p>
                <p className="text-right font-serif text-amber-200 text-xs">
                  {messagePackage.lovingClosing}
                </p>
              </div>
            )}

            {activeTab === 'encouragement' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Morning Encouragement</span>
                </div>
                <p className="text-stone-100 leading-relaxed">
                  {messagePackage.encouragement}
                </p>
              </div>
            )}

            {activeTab === 'scripture' && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-300/20">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-300 mb-1">
                    <BookOpen className="w-3 h-3" />
                    <span>{messagePackage.bibleVerse.reference}</span>
                  </div>
                  <p className="italic text-stone-100 text-xs">
                    "{messagePackage.bibleVerse.text}"
                  </p>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-rose-300 font-semibold mb-1">
                    Morning Prayer
                  </div>
                  <p className="text-stone-200 text-xs leading-relaxed">
                    {messagePackage.prayer}
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Action Controls: STOP ALARM & SNOOZE */}
      <div className="w-full max-w-lg mx-auto z-10 pt-2 pb-safe space-y-3">
        <button
          onClick={onDismiss}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 text-white font-bold text-base shadow-xl shadow-rose-900/50 hover:brightness-110 active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-2.5"
        >
          <Heart className="w-5 h-5 fill-white text-white" />
          <span>STOP ALARM</span>
        </button>

        <button
          onClick={onSnooze}
          className="w-full py-3.5 px-6 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-stone-200 hover:text-white font-semibold text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2"
        >
          <Moon className="w-4 h-4 text-amber-300" />
          <span>SNOOZE ({snoozeMinutes} MINUTES)</span>
        </button>
      </div>

    </div>
  );
};
