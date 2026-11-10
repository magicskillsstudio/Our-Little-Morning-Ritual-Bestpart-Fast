/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share, X, CheckCircle2 } from 'lucide-react';

interface Props {
  variant?: 'prominent' | 'compact' | 'outline';
  className?: string;
}

export const PWAInstallButton: React.FC<Props> = ({ variant = 'compact', className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running inside standalone PWA mode, don't show
  if (isInstalled) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-rose-800 bg-rose-50/80 rounded-full border border-rose-200/50">
        <CheckCircle2 className="w-3.5 h-3.5 text-rose-600" />
        <span>Installed on Device</span>
      </div>
    );
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    if (variant === 'prominent') {
      return (
        <button
          onClick={install}
          className={`flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-600 text-white font-medium shadow-md shadow-rose-200/60 hover:shadow-lg hover:shadow-rose-300/60 active:scale-[0.98] transition-all cursor-pointer ${className}`}
        >
          <Download className="w-5 h-5" />
          <span>Install to Home Screen</span>
        </button>
      );
    }

    return (
      <button
        onClick={install}
        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium text-stone-700 bg-white/90 border border-amber-200/60 shadow-sm hover:bg-amber-50/60 transition cursor-pointer ${className}`}
      >
        <Download className="w-3.5 h-3.5 text-rose-600" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  return (
    <>
      <button
        onClick={() => setShowIOSGuide(true)}
        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium text-stone-700 bg-white/90 border border-amber-200/60 shadow-sm hover:bg-amber-50/60 transition cursor-pointer ${className}`}
      >
        <Share className="w-3.5 h-3.5 text-rose-600" />
        <span>Add to iPhone</span>
      </button>

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#fcf9f5] border border-amber-100 p-6 shadow-2xl relative text-left">
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-stone-400 hover:text-stone-700 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-700">
                <Share className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-stone-900 text-base">Install on iPhone</h3>
                <p className="text-xs text-stone-500">Run as a standalone app with full offline access</p>
              </div>
            </div>

            <ol className="space-y-3 text-xs text-stone-700 leading-relaxed mb-5">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-medium shrink-0 text-[11px]">1</span>
                <span>Tap the <strong className="text-stone-900">Share</strong> button in Safari's bottom toolbar.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-medium shrink-0 text-[11px]">2</span>
                <span>Scroll down and tap <strong className="text-stone-900">Add to Home Screen</strong>.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-medium shrink-0 text-[11px]">3</span>
                <span>Tap <strong className="text-stone-900">Add</strong> in the top-right corner.</span>
              </li>
            </ol>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-xl bg-stone-900 text-white text-xs font-medium hover:bg-stone-800 transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
