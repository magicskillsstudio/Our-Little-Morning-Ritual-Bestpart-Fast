/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Heart, Bell, Music, Sun, Sparkles, ShieldCheck, ArrowLeft } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface Props {
  onApprove: () => void;
  senderName: string;
  recipientName: string;
  onBack?: () => void;
  previousView?: string | null;
}

export const InvitationView: React.FC<Props> = ({ onApprove, senderName, recipientName, onBack, previousView }) => {
  const [declined, setDeclined] = useState(false);

  const backLabel = previousView === 'settings' 
    ? 'Back to Settings' 
    : (previousView === 'about' ? 'Back to Guide' : 'Back to Dashboard');
  const returnLabel = previousView === 'settings' 
    ? 'Return to Settings' 
    : (previousView === 'about' ? 'Return to Guide' : 'Return to Dashboard');

  if (declined) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-[#faf6f2] via-[#f7eee9] to-[#f3e5df]">
        <div className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-3xl border border-rose-100 p-8 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
            <Heart className="w-8 h-8 fill-rose-200" />
          </div>
          <div>
            <h2 className="text-2xl font-serif font-semibold text-stone-900 mb-2">No Rush, My Love</h2>
            <p className="text-sm text-stone-600 leading-relaxed">
              Your peace and morning rest mean the world to me. Whenever you feel ready to wake up with these morning messages and melodies, the door will always be wide open.
            </p>
          </div>
          <div className="space-y-2 pt-2">
            <button
              onClick={() => setDeclined(false)}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-600 text-white font-medium shadow-md shadow-rose-200 hover:shadow-lg active:scale-[0.98] transition cursor-pointer"
            >
              Reconsider & View Invitation ❤️
            </button>
            {onBack && (
              <button
                onClick={onBack}
                className="w-full py-2.5 px-4 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-medium transition cursor-pointer"
              >
                {returnLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 bg-gradient-to-b from-[#faf6f2] via-[#fbf1ec] to-[#f4e4dc] relative overflow-hidden">
      {/* Decorative ambient background glows */}
      <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-rose-200/40 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-96 h-96 rounded-full bg-amber-200/35 blur-3xl pointer-events-none" />
      
      {/* Top Header / PWA badge */}
      <header className="w-full max-w-md mx-auto flex items-center justify-between pt-2 pb-4 z-10">
        <div className="flex items-center gap-2">
          {onBack ? (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-stone-700 bg-white/80 border border-stone-200/80 hover:bg-stone-100 hover:text-stone-900 transition cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-stone-600" />
              <span>{backLabel}</span>
            </button>
          ) : (
            <div className="w-7 h-7 rounded-full bg-rose-100/90 flex items-center justify-center text-rose-600 shadow-xs">
              <Heart className="w-4 h-4 fill-rose-400" />
            </div>
          )}
          <span className="text-xs uppercase tracking-widest text-stone-500 font-medium">Private Sanctuary</span>
        </div>
        <PWAInstallButton />
      </header>

      {/* Main Invitation Card */}
      <main className="w-full max-w-md mx-auto my-auto z-10">
        <div className="bg-white/85 backdrop-blur-md rounded-3xl border border-[#eedfd6] p-7 sm:p-9 shadow-2xl shadow-rose-900/5 text-center relative">
          
          {/* Subtle top crown crest */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-rose-100 via-[#fff8f2] to-amber-100 border border-rose-200/60 shadow-inner mb-6 text-rose-600">
            <Sun className="w-8 h-8 text-amber-500 animate-soft-pulse" />
          </div>

          {/* Exact Required Title */}
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 tracking-tight leading-tight mb-2">
            Our Little Morning Ritual Bestpart ❤️
          </h1>

          {/* Exact Required Subtitle */}
          <p className="text-base font-serif italic text-rose-700/90 mb-6">
            A little love waiting for you every morning.
          </p>

          {/* Sender personal note */}
          <div className="bg-[#faf5f0]/80 rounded-2xl p-4 border border-amber-100/80 mb-6 text-left space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-800/80">From {senderName}</p>
            <p className="text-xs text-stone-700 leading-relaxed">
              I designed this quiet space just for the two of us. Every morning at <span className="font-semibold text-rose-800">5:50 AM</span> and <span className="font-semibold text-rose-800">6:30 AM</span>, a warm acoustic melody and a unique message written from my heart will wake you gently.
            </p>
          </div>

          {/* 3 Highlights */}
          <div className="grid grid-cols-3 gap-2.5 mb-7 text-center">
            <div className="p-2.5 rounded-xl bg-white/70 border border-stone-200/50">
              <Bell className="w-4 h-4 mx-auto text-amber-600 mb-1" />
              <div className="text-[11px] font-medium text-stone-800">5:50 & 6:30 AM</div>
              <div className="text-[10px] text-stone-500">Dual alarms</div>
            </div>
            <div className="p-2.5 rounded-xl bg-white/70 border border-stone-200/50">
              <Music className="w-4 h-4 mx-auto text-rose-500 mb-1" />
              <div className="text-[11px] font-medium text-stone-800">Acoustic Audio</div>
              <div className="text-[10px] text-stone-500">Gentle crescendo</div>
            </div>
            <div className="p-2.5 rounded-xl bg-white/70 border border-stone-200/50">
              <Sparkles className="w-4 h-4 mx-auto text-amber-500 mb-1" />
              <div className="text-[11px] font-medium text-stone-800">Daily Love Note</div>
              <div className="text-[10px] text-stone-500">Written from heart</div>
            </div>
          </div>

          {/* Exact Required Question */}
          <div className="border-t border-rose-100 pt-5 pb-6">
            <p className="text-base sm:text-lg font-serif font-medium text-stone-900">
              Would you like to activate our morning ritual?
            </p>
            <p className="text-xs text-stone-500 mt-1">
              Runs completely offline. No accounts, ads, or tracking ever.
            </p>
          </div>

          {/* Action Buttons: APPROVE / DECLINE */}
          <div className="space-y-3">
            <button
              onClick={onApprove}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-500 via-rose-600 to-amber-600 text-white font-medium text-base tracking-wide shadow-lg shadow-rose-300/40 hover:shadow-rose-400/50 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Heart className="w-4 h-4 fill-white" />
              <span>APPROVE</span>
            </button>
            <button
              onClick={() => setDeclined(true)}
              className="w-full py-3 px-6 rounded-2xl bg-transparent border border-stone-300/80 text-stone-600 hover:text-stone-900 hover:border-stone-400 font-medium text-xs tracking-wider uppercase transition cursor-pointer"
            >
              DECLINE
            </button>
          </div>

        </div>
      </main>

      {/* Footer Info */}
      <footer className="w-full max-w-md mx-auto text-center py-3 z-10">
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-500">
          <ShieldCheck className="w-3.5 h-3.5 text-stone-400" />
          <span>Private device storage · 100% Offline & Independent</span>
        </div>
      </footer>
    </div>
  );
};
