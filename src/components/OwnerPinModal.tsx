/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Lock, X, KeyRound, AlertCircle, Shield } from 'lucide-react';
import { verifyOwnerPin } from '../utils/storage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const OwnerPinModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;
    setIsVerifying(true);
    const valid = await verifyOwnerPin(pin);
    setIsVerifying(false);

    if (valid) {
      setError(false);
      setPin('');
      onSuccess();
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-md p-4">
      <div className="w-full max-w-sm bg-[#fcf9f6] border border-amber-200/80 rounded-3xl p-6 shadow-2xl relative text-stone-800 animate-scale-up">
        
        {/* Close Button */}
        <button
          onClick={() => {
            setPin('');
            setError(false);
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Crest */}
        <div className="text-center space-y-2 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-stone-900 to-stone-800 text-amber-200 flex items-center justify-center mx-auto shadow-md">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-serif font-bold text-stone-900">Owner Access</h3>
            <p className="text-xs text-stone-500">Private Administration & 200 Messages Library</p>
          </div>
        </div>

        {/* PIN Form */}
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-600 block text-center">
              Enter Private PIN
            </label>
            <div className="relative max-w-[200px] mx-auto">
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                autoFocus
                maxLength={8}
                value={pin}
                onChange={(e) => {
                  setError(false);
                  setPin(e.target.value);
                }}
                placeholder="••••••"
                className="w-full py-3 text-center text-xl tracking-widest font-mono font-bold rounded-2xl bg-white border border-stone-300 focus:border-stone-900 focus:outline-none shadow-inner"
              />
            </div>
            {error && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-rose-600 font-medium pt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Incorrect PIN. Please try again.</span>
              </div>
            )}
          </div>

          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={!pin.trim()}
              className="w-full py-3 rounded-2xl bg-stone-900 text-white font-medium text-xs hover:bg-stone-800 active:scale-95 transition disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Unlock Owner Portal</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPin('');
                setError(false);
                onClose();
              }}
              className="w-full py-2.5 text-xs text-stone-500 hover:text-stone-800 transition"
            >
              Cancel & Return
            </button>
          </div>
        </form>

        <div className="mt-4 pt-3 border-t border-stone-200/60 text-center">
          <p className="text-[10px] text-stone-400">
            Server Authenticated Administration
          </p>
        </div>

      </div>
    </div>
  );
};
