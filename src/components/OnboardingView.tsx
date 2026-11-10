import React, { useState } from 'react';
import { Bell, Clock, Volume2, Shield, Check, ArrowRight, ArrowLeft, Play, Square } from 'lucide-react';
import { alarmAdapter } from '../services/alarmAdapter';
import { soundEngine } from '../utils/audioEngine';
import { PWAInstallButton } from './PWAInstallButton';

interface Props {
  onComplete: () => void;
  recipientName: string;
  onBack?: () => void;
}

export const OnboardingView: React.FC<Props> = ({ onComplete, recipientName, onBack }) => {
  const [step, setStep] = useState<number>(1);
  const [notificationsGranted, setNotificationsGranted] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  const requestNotifications = async () => {
    const granted = await alarmAdapter.requestNotificationPermission();
    setNotificationsGranted(granted);
    if (granted) {
      setStep(2);
    }
  };

  const toggleSoundTest = () => {
    if (isPlayingAudio) {
      soundEngine.stop();
      setIsPlayingAudio(false);
    } else {
      soundEngine.playTrack('our-beautiful-morning', false);
      setIsPlayingAudio(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 bg-gradient-to-b from-[#faf6f2] via-[#f7eee9] to-[#f3e5df]">
      {/* Top Header */}
      <div className="w-full max-w-md mx-auto pt-2 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {step > 1 ? (
            <button
              onClick={() => {
                if (isPlayingAudio) soundEngine.stop();
                setStep(step - 1);
              }}
              className="flex items-center gap-1 text-xs text-stone-600 hover:text-stone-900 transition font-medium cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Step {step - 1}</span>
            </button>
          ) : onBack ? (
            <button
              onClick={onBack}
              className="flex items-center gap-1 text-xs text-stone-600 hover:text-stone-900 transition font-medium cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <span className="text-xs font-semibold tracking-wider uppercase text-rose-800">
              Setup Step {step} of 3
            </span>
          )}
        </div>
        <div className="flex gap-1.5">
          <div className={`w-6 h-1.5 rounded-full transition-all ${step >= 1 ? 'bg-rose-500' : 'bg-stone-200'}`} />
          <div className={`w-6 h-1.5 rounded-full transition-all ${step >= 2 ? 'bg-rose-500' : 'bg-stone-200'}`} />
          <div className={`w-6 h-1.5 rounded-full transition-all ${step >= 3 ? 'bg-rose-500' : 'bg-stone-200'}`} />
        </div>
      </div>

      {/* Main Content Card */}
      <div className="w-full max-w-md mx-auto my-auto bg-white/90 backdrop-blur-md rounded-3xl border border-rose-100 p-6 sm:p-8 shadow-xl">
        
        {step === 1 && (
          <div className="space-y-5 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 mx-auto">
              <Bell className="w-7 h-7" />
            </div>

            <div className="text-center">
              <h2 className="text-2xl font-serif font-bold text-stone-900 mb-2">Notification & Alarm Access</h2>
              <p className="text-xs text-stone-600 leading-relaxed">
                To awaken you on time at 5:50 AM and 6:30 AM, your phone needs permission to deliver morning alerts and sound notifications even when the screen is asleep.
              </p>
            </div>

            <div className="bg-[#fcf8f4] rounded-2xl p-4 border border-amber-100 space-y-3 text-xs text-stone-700">
              <div className="flex items-start gap-3">
                <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Completely Private:</strong> Alarms are stored locally on your device. Zero cloud sync or background telemetry.</span>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span><strong>Android Note:</strong> Keep exact alarm permissions on in system settings so the OS does not delay waking you.</span>
              </div>
            </div>

            <button
              onClick={requestNotifications}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-600 text-white font-medium text-sm shadow-md shadow-rose-200 hover:shadow-lg active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-2"
            >
              {notificationsGranted ? <Check className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
              <span>{notificationsGranted ? "Permission Granted" : "Enable Morning Permissions"}</span>
            </button>

            <button
              onClick={() => setStep(2)}
              className="w-full text-center text-xs text-stone-500 hover:text-stone-800 transition py-1"
            >
              Continue to next step →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200/60 flex items-center justify-center text-rose-500 mx-auto">
              <Clock className="w-7 h-7" />
            </div>

            <div className="text-center">
              <h2 className="text-2xl font-serif font-bold text-stone-900 mb-2">Two Repeating Alarms</h2>
              <p className="text-xs text-stone-600 leading-relaxed">
                Both alarms use the same sweet romantic message on any calendar day, so you never miss a word.
              </p>
            </div>

            {/* Visual schedule boxes */}
            <div className="space-y-2.5">
              <div className="p-3.5 rounded-2xl bg-[#faf5f0] border border-amber-200/60 flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-amber-800/80 font-medium">First Whisper</div>
                  <div className="text-xl font-serif font-bold text-stone-900">5:50 AM</div>
                  <div className="text-[11px] text-stone-500">Soft acoustic harp chime</div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Active
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#faf5f0] border border-amber-200/60 flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-amber-800/80 font-medium">Gentle Rise</div>
                  <div className="text-xl font-serif font-bold text-stone-900">6:30 AM</div>
                  <div className="text-[11px] text-stone-500">Gradual crescendo audio</div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Active
                </span>
              </div>
            </div>

            {/* Audio test inside step 2 */}
            <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/70 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Volume2 className="w-4 h-4 text-stone-600" />
                <span className="text-xs text-stone-700">Preview "Our Beautiful Morning"</span>
              </div>
              <button
                onClick={toggleSoundTest}
                className="px-3 py-1.5 rounded-xl bg-white border border-stone-300 text-xs font-medium text-stone-800 hover:bg-stone-100 active:scale-95 transition flex items-center gap-1 cursor-pointer"
              >
                {isPlayingAudio ? <Square className="w-3 h-3 text-rose-500 fill-rose-500" /> : <Play className="w-3 h-3 text-emerald-600 fill-emerald-600" />}
                <span>{isPlayingAudio ? "Stop" : "Test Sound"}</span>
              </button>
            </div>

            <button
              onClick={() => {
                if (isPlayingAudio) {
                  soundEngine.stop();
                  setIsPlayingAudio(false);
                }
                setStep(3);
              }}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-600 text-white font-medium text-sm shadow-md shadow-rose-200 hover:shadow-lg active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Next: Install on Home Screen</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600 mx-auto">
              <Check className="w-7 h-7" />
            </div>

            <div className="text-center">
              <h2 className="text-2xl font-serif font-bold text-stone-900 mb-2">Ready For You, {recipientName}</h2>
              <p className="text-xs text-stone-600 leading-relaxed">
                Add this application to your phone's home screen so you can access your daily messages and morning sound settings anytime without a browser tab.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#fcf8f4] border border-amber-100 space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-stone-600">Home Screen Quick Access</div>
              <PWAInstallButton variant="prominent" className="w-full" />
              <p className="text-[11px] text-stone-500 text-center">
                On iPhone: Tap Share in Safari → Add to Home Screen.<br />
                On Android: Tap the Install button above.
              </p>
            </div>

            <button
              onClick={() => {
                soundEngine.stop();
                onComplete();
              }}
              className="w-full py-4 px-6 rounded-2xl bg-stone-900 text-white font-medium text-sm shadow-md hover:bg-stone-800 active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Enter Our Morning Sanctuary ❤️</span>
            </button>
          </div>
        )}

      </div>

      {/* Footer */}
      <div className="w-full max-w-md mx-auto text-center py-3">
        <p className="text-[11px] text-stone-500">
          Settings and sounds can be adjusted anytime in the app.
        </p>
      </div>
    </div>
  );
};
