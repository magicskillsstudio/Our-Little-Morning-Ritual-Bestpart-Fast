/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ArrowLeft,
  Heart,
  BookOpen,
  Sparkles,
  Music,
  Play,
  Square,
  Share2,
  Sun,
  ShieldCheck
} from 'lucide-react';
import { MessagePackage } from '../data/messagePackages';
import { soundEngine, SOUND_TRACKS } from '../utils/audioEngine';
import { AppSettings } from '../utils/storage';

interface Props {
  messagePackage: MessagePackage;
  settings: AppSettings;
  onBack: () => void;
  onShowToast: (msg: string) => void;
}

export const DailyMessageView: React.FC<Props> = ({
  messagePackage,
  settings,
  onBack,
  onShowToast,
}) => {
  const [isPlayingMelody, setIsPlayingMelody] = useState(false);

  const selectedTrack = SOUND_TRACKS.find(t => t.id === settings.selectedSound) || SOUND_TRACKS[0];

  const toggleMelody = () => {
    if (isPlayingMelody) {
      soundEngine.stop();
      setIsPlayingMelody(false);
    } else {
      soundEngine.setVolume(settings.volume);
      soundEngine.playTrack(settings.selectedSound, false);
      setIsPlayingMelody(true);
    }
  };

  const handleCopyMessage = async () => {
    const textToCopy = `"${messagePackage.romanticMessage}"\n\n${messagePackage.encouragement}\n\n${messagePackage.bibleVerse.reference}: "${messagePackage.bibleVerse.text}"\n\nPrayer: ${messagePackage.prayer}\n\n${messagePackage.lovingClosing}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
        onShowToast("Today's morning note copied to clipboard ❤️");
      }
    } catch {
      onShowToast("Unable to copy to clipboard");
    }
  };

  const formattedDate = new Date().toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#faf6f2] via-[#f7eee9] to-[#f4e6de] text-stone-800 pb-16">
      
      {/* Top Header with Back Navigation */}
      <header className="sticky top-0 z-40 bg-[#faf6f2]/90 backdrop-blur-md border-b border-amber-200/50 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => {
              if (isPlayingMelody) soundEngine.stop();
              onBack();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-stone-700 bg-white/80 border border-stone-200/80 hover:bg-stone-100 hover:text-stone-900 transition cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-stone-600" />
            <span>Back to Dashboard</span>
          </button>

          <span className="text-xs font-semibold text-rose-800">
            Today's Morning Note
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-5 space-y-5">
        
        {/* Title Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">
              {formattedDate}
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
              {messagePackage.theme}
            </h1>
            <p className="text-xs text-stone-500">
              Shared by both your 5:50 AM and 6:30 AM morning alarms
            </p>
          </div>

          <button
            onClick={handleCopyMessage}
            className="p-2.5 rounded-2xl bg-white border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50 shadow-xs transition cursor-pointer"
            title="Copy Note"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Soundtrack Player Bar */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white/90 backdrop-blur-sm border border-amber-200/60 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-700">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-stone-500">Listen While Reading</span>
              <div className="text-xs font-bold text-stone-900">{selectedTrack.name}</div>
            </div>
          </div>

          <button
            onClick={toggleMelody}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition cursor-pointer ${
              isPlayingMelody
                ? 'bg-rose-500 text-white border-rose-600 shadow-sm'
                : 'bg-white hover:bg-stone-50 text-stone-800 border-stone-200'
            }`}
          >
            {isPlayingMelody ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play Melody</span>
              </>
            )}
          </button>
        </div>

        {/* 1. Romantic First-Person Message */}
        <div className="p-6 sm:p-7 rounded-3xl bg-white/90 backdrop-blur-sm border border-rose-200/70 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-rose-100 pb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-300" />
              <span>His Morning Love Note</span>
            </span>
            <span className="text-[11px] text-stone-400">Written from {settings.senderName}</span>
          </div>

          <p className="font-serif italic text-base sm:text-lg text-stone-800 leading-relaxed bg-[#fdfaf7] p-5 rounded-2xl border border-amber-100/70">
            "{messagePackage.romanticMessage}"
          </p>

          <div className="text-right font-serif text-sm font-semibold text-rose-800 pt-1">
            {messagePackage.lovingClosing}
          </div>
        </div>

        {/* 2. Morning Encouragement */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white/90 backdrop-blur-sm border border-stone-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-rose-800">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Encouragement For Your Day</span>
          </div>
          <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
            {messagePackage.encouragement}
          </p>
        </div>

        {/* 3. Scripture Verse */}
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-tr from-amber-50/80 to-[#fff8f2] border border-amber-200/70 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-900 border-b border-amber-200/40 pb-2">
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-amber-700" />
              <span>{messagePackage.bibleVerse.reference}</span>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-amber-700">Holy Scripture</span>
          </div>
          <p className="font-serif italic text-xs sm:text-sm text-stone-800 leading-relaxed">
            "{messagePackage.bibleVerse.text}"
          </p>
        </div>

        {/* 4. Short Morning Prayer */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white/90 backdrop-blur-sm border border-stone-200/80 shadow-xs space-y-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>A Morning Prayer For You</span>
          </span>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed italic bg-stone-50/70 p-4 rounded-xl border border-stone-200/50">
            {messagePackage.prayer}
          </p>
        </div>

        {/* Bottom Navigation */}
        <div className="pt-4 text-center">
          <button
            onClick={() => {
              if (isPlayingMelody) soundEngine.stop();
              onBack();
            }}
            className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 text-xs font-semibold transition cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </button>
        </div>

      </main>
    </div>
  );
};
