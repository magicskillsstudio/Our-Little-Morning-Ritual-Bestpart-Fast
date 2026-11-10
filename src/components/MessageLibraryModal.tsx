/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Search, BookOpen, Heart, Sparkles, ChevronRight, ChevronLeft, ArrowLeft } from 'lucide-react';
import { MESSAGE_PACKAGES, MessagePackage } from '../data/messagePackages';

interface Props {
  currentDay: number;
  onClose: () => void;
}

export const MessageLibraryModal: React.FC<Props> = ({ currentDay, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDay, setSelectedDay] = useState<number>(currentDay);

  const filteredPackages = MESSAGE_PACKAGES.filter((pkg) => {
    const q = searchQuery.toLowerCase();
    return (
      pkg.day.toString().includes(q) ||
      pkg.theme.toLowerCase().includes(q) ||
      pkg.romanticMessage.toLowerCase().includes(q) ||
      pkg.bibleVerse.reference.toLowerCase().includes(q)
    );
  });

  const activePackage = MESSAGE_PACKAGES[selectedDay - 1] || MESSAGE_PACKAGES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#fcf9f6] border border-amber-100 rounded-3xl p-5 sm:p-7 shadow-2xl relative my-auto max-h-[92vh] flex flex-col text-stone-800">
        
        {/* Header with Visible Back Button */}
        <div className="flex items-center justify-between pb-4 border-b border-amber-200/50">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-stone-700 bg-white border border-stone-200 hover:bg-stone-100 transition cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-stone-600" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 fill-rose-300 text-rose-500" />
            <h2 className="text-base sm:text-lg font-serif font-bold text-stone-900">200 Morning Messages</h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Navigation Bar */}
        <div className="py-3 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search by day, theme, scripture..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-stone-200 text-stone-800 focus:outline-rose-500"
            />
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setSelectedDay(Math.max(1, selectedDay - 1))}
              disabled={selectedDay <= 1}
              className="p-2 rounded-xl bg-white border border-stone-200 disabled:opacity-40 hover:bg-stone-50 cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4 text-stone-600" />
            </button>
            <span className="text-xs font-semibold px-2 text-rose-900">
              Day {selectedDay} / 200
            </span>
            <button
              onClick={() => setSelectedDay(Math.min(200, selectedDay + 1))}
              disabled={selectedDay >= 200}
              className="p-2 rounded-xl bg-white border border-stone-200 disabled:opacity-40 hover:bg-stone-50 cursor-pointer"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4 text-stone-600" />
            </button>
          </div>
        </div>

        {/* Selected Message Card */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-4">
          <div className="bg-white rounded-2xl border border-rose-200/70 p-5 shadow-xs space-y-4">
            
            <div className="flex items-center justify-between border-b border-rose-100/60 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800">
                    Day {activePackage.day}
                  </span>
                  {activePackage.day === currentDay && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                      Today's Message
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-serif font-bold text-stone-900 mt-1">
                  {activePackage.theme}
                </h3>
              </div>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>

            {/* Romantic Love Message */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800/80">From His Heart</span>
              <p className="font-serif italic text-sm text-stone-800 leading-relaxed bg-[#fdfaf7] p-3.5 rounded-xl border border-amber-100/60">
                "{activePackage.romanticMessage}"
              </p>
            </div>

            {/* Encouragement */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-800/80">Daily Encouragement</span>
              <p className="text-xs text-stone-700 leading-relaxed">
                {activePackage.encouragement}
              </p>
            </div>

            {/* Scripture */}
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/50 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                <span>{activePackage.bibleVerse.reference}</span>
              </div>
              <p className="italic text-xs text-stone-700">
                "{activePackage.bibleVerse.text}"
              </p>
            </div>

            {/* Prayer */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-600">Morning Prayer</span>
              <p className="text-xs text-stone-600 leading-relaxed italic">
                {activePackage.prayer}
              </p>
            </div>

            {/* Closing */}
            <div className="text-right pt-2 border-t border-rose-100/60 font-serif text-xs text-rose-900">
              {activePackage.lovingClosing}
            </div>

          </div>

          {/* Quick Day Chips Grid */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
              Browse All 200 Days ({filteredPackages.length} shown)
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
              {filteredPackages.slice(0, 48).map((pkg) => (
                <button
                  key={pkg.day}
                  onClick={() => setSelectedDay(pkg.day)}
                  className={`py-1.5 px-1 rounded-lg text-xs font-medium text-center border transition cursor-pointer ${
                    selectedDay === pkg.day
                      ? 'bg-rose-500 text-white border-rose-600 font-semibold'
                      : pkg.day === currentDay
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  D{pkg.day}
                </button>
              ))}
            </div>
            {filteredPackages.length > 48 && (
              <p className="text-[11px] text-stone-400 text-center mt-2">
                Use the search bar above or arrows to jump to days 49 through 200.
              </p>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
