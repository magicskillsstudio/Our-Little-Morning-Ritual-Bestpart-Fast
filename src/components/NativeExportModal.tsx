import React from 'react';
import { X, Terminal, Smartphone, Apple, CheckCircle2, Copy, ExternalLink, ArrowLeft } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const NativeExportModal: React.FC<Props> = ({ onClose }) => {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  const copyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-[#fcf9f6] border border-amber-100 rounded-3xl p-5 sm:p-7 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto text-stone-800">
        
        {/* Header with Visible Back Button */}
        <div className="flex items-center justify-between pb-4 border-b border-amber-200/50 mb-4">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-stone-700 bg-white border border-stone-200 hover:bg-stone-100 transition cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-stone-600" />
            <span>Back</span>
          </button>

          <div className="text-center">
            <h2 className="text-base sm:text-lg font-serif font-bold text-stone-900">Capacitor Native Packaging</h2>
            <p className="text-[11px] text-stone-500">Android & iOS Native Build Architecture</p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Overview */}
        <p className="text-xs text-stone-600 leading-relaxed mb-4">
          This project contains the complete native Android Kotlin modules (<code className="text-rose-800 font-mono text-[11px]">AlarmPlugin.kt</code>, <code className="text-rose-800 font-mono text-[11px]">AlarmReceiver.kt</code>, <code className="text-rose-800 font-mono text-[11px]">BootReceiver.kt</code>) and iOS Swift modules (<code className="text-rose-800 font-mono text-[11px]">AlarmPlugin.swift</code>). Follow these steps to package for native app stores or testing:
        </p>

        {/* Step 1: Install Capacitor CLI & Core */}
        <div className="space-y-3 mb-5">
          <div className="p-3.5 rounded-2xl bg-white border border-stone-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-900">1. Install Capacitor Native Platforms</span>
              <button
                onClick={() => copyText('npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios\nnpm run build\nnpx cap add android\nnpx cap add ios', 1)}
                className="text-[11px] text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1 cursor-pointer"
              >
                {copiedIndex === 1 ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedIndex === 1 ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-2.5 rounded-xl bg-stone-900 text-stone-100 text-[11px] font-mono overflow-x-auto">
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npm run build
npx cap add android
npx cap add ios
            </pre>
          </div>

          {/* Step 2: Sync and build Android */}
          <div className="p-3.5 rounded-2xl bg-white border border-stone-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                <span>2. Build & Test on Android (Android Studio)</span>
              </span>
              <button
                onClick={() => copyText('npx cap sync android\nnpx cap open android', 2)}
                className="text-[11px] text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1 cursor-pointer"
              >
                {copiedIndex === 2 ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedIndex === 2 ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-2.5 rounded-xl bg-stone-900 text-stone-100 text-[11px] font-mono overflow-x-auto">
npx cap sync android
npx cap open android
            </pre>
            <p className="text-[11px] text-stone-500">
              In Android Studio, verify that <code className="font-mono">SCHEDULE_EXACT_ALARM</code> is granted in App Info → Alarms & Reminders.
            </p>
          </div>

          {/* Step 3: Sync and build iOS */}
          <div className="p-3.5 rounded-2xl bg-white border border-stone-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <Apple className="w-3.5 h-3.5 text-stone-800" />
                <span>3. Build & Test on iOS (Xcode)</span>
              </span>
              <button
                onClick={() => copyText('npx cap sync ios\nnpx cap open ios', 3)}
                className="text-[11px] text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1 cursor-pointer"
              >
                {copiedIndex === 3 ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedIndex === 3 ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-2.5 rounded-xl bg-stone-900 text-stone-100 text-[11px] font-mono overflow-x-auto">
npx cap sync ios
npx cap open ios
            </pre>
            <p className="text-[11px] text-stone-500">
              In Xcode, enable the <em>Background Modes</em> capability with <strong>Audio</strong> and <strong>Background fetch</strong>, plus <em>Critical Alerts</em> if provisioning allows.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-stone-900 text-white text-xs font-medium hover:bg-stone-800 transition cursor-pointer"
        >
          Close Guide
        </button>

      </div>
    </div>
  );
};
