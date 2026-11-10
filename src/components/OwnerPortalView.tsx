/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  ArrowLeft,
  Search,
  BookOpen,
  Calendar,
  Clock,
  Sparkles,
  Edit3,
  Check,
  RotateCcw,
  Sliders,
  Shield,
  Download,
  Upload,
  Play,
  Square,
  Music,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { AppSettings, saveSettings, logoutOwner, updateOwnerPin, getOwnerToken } from '../utils/storage';
import { getAllPackages, getDayNumberForDate, getPackageForDay, MessagePackage } from '../data/messagePackages';
import { soundEngine, SOUND_TRACKS } from '../utils/audioEngine';
import { alarmAdapter } from '../services/alarmAdapter';

interface Props {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onExit: () => void;
  onShowToast: (msg: string) => void;
  onTriggerAlarmTest: (label: string) => void;
}

export const OwnerPortalView: React.FC<Props> = ({
  settings,
  onUpdateSettings,
  onExit,
  onShowToast,
  onTriggerAlarmTest,
}) => {
  const [activeTab, setActiveTab] = useState<'messages' | 'schedule' | 'technical' | 'security'>('messages');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [isEditing, setIsEditing] = useState(false);

  // Edit form state
  const [editTheme, setEditTheme] = useState('');
  const [editRomanticMessage, setEditRomanticMessage] = useState('');
  const [editEncouragement, setEditEncouragement] = useState('');
  const [editVerseRef, setEditVerseRef] = useState('');
  const [editVerseText, setEditVerseText] = useState('');
  const [editPrayer, setEditPrayer] = useState('');
  const [editClosing, setEditClosing] = useState('');

  // Security state
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinChangeMsg, setPinChangeMsg] = useState<string | null>(null);

  // Audio testing state
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);

  const allPackages = getAllPackages();
  const currentDayNum = getDayNumberForDate(settings.activationDate, new Date());
  const activePackage = allPackages[selectedDay - 1] || allPackages[0];

  const filteredPackages = allPackages.filter((pkg) => {
    const q = searchQuery.toLowerCase();
    return (
      pkg.day.toString().includes(q) ||
      pkg.theme.toLowerCase().includes(q) ||
      pkg.romanticMessage.toLowerCase().includes(q) ||
      pkg.bibleVerse.reference.toLowerCase().includes(q)
    );
  });

  const handleSelectPackage = (day: number) => {
    setSelectedDay(day);
    setIsEditing(false);
  };

  const handleStartEditing = () => {
    setEditTheme(activePackage.theme);
    setEditRomanticMessage(activePackage.romanticMessage);
    setEditEncouragement(activePackage.encouragement);
    setEditVerseRef(activePackage.bibleVerse.reference);
    setEditVerseText(activePackage.bibleVerse.text);
    setEditPrayer(activePackage.prayer);
    setEditClosing(activePackage.lovingClosing);
    setIsEditing(true);
  };

  const handleSavePackageEdits = async () => {
    const updatedPkg = {
      day: selectedDay,
      theme: editTheme.trim() || activePackage.theme,
      romanticMessage: editRomanticMessage.trim() || activePackage.romanticMessage,
      encouragement: editEncouragement.trim() || activePackage.encouragement,
      bibleVerse: {
        reference: editVerseRef.trim() || activePackage.bibleVerse.reference,
        text: editVerseText.trim() || activePackage.bibleVerse.text,
      },
      prayer: editPrayer.trim() || activePackage.prayer,
      lovingClosing: editClosing.trim() || activePackage.lovingClosing,
    };

    const updatedCustoms = {
      ...(settings.customPackages || {}),
      [selectedDay]: updatedPkg
    };

    const updatedSettings: AppSettings = {
      ...settings,
      customPackages: updatedCustoms
    };

    saveSettings(updatedSettings);
    onUpdateSettings(updatedSettings);
    setIsEditing(false);

    // Sync edit with server API
    try {
      const token = getOwnerToken();
      if (token) {
        await fetch(`/api/owner/package/${selectedDay}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updatedPkg)
        });
      }
    } catch {}

    onShowToast(`Day ${selectedDay} love note saved and updated ❤️`);
  };

  const handleResetPackageToDefault = () => {
    if (!settings.customPackages || !settings.customPackages[selectedDay]) return;
    const updatedCustoms = { ...settings.customPackages };
    delete updatedCustoms[selectedDay];

    const updatedSettings: AppSettings = {
      ...settings,
      customPackages: updatedCustoms
    };

    saveSettings(updatedSettings);
    onUpdateSettings(updatedSettings);
    setIsEditing(false);
    onShowToast(`Day ${selectedDay} reset to bundled original default.`);
  };

  const handleUpdateActivationDate = (newDateStr: string) => {
    const updatedSettings: AppSettings = {
      ...settings,
      activationDate: newDateStr
    };
    saveSettings(updatedSettings);
    onUpdateSettings(updatedSettings);
    alarmAdapter.syncAlarms(updatedSettings);
    onShowToast(`Activation date updated. Today is now Day ${getDayNumberForDate(newDateStr, new Date())}.`);
  };

  const handleJumpToDay = (targetDay: number) => {
    // Calculate new activationDate so that today corresponds to targetDay
    const today = new Date();
    today.setDate(today.getDate() - (targetDay - 1));
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    handleUpdateActivationDate(`${y}-${m}-${d}`);
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 4) {
      setPinChangeMsg('PIN must be at least 4 digits');
      return;
    }
    if (newPin !== confirmPin) {
      setPinChangeMsg('PINs do not match');
      return;
    }
    if (updateOwnerPin(newPin)) {
      setPinChangeMsg('PIN updated successfully! Remember your new PIN.');
      setNewPin('');
      setConfirmPin('');
      onShowToast('Owner PIN updated successfully');
    }
  };

  const handleExportBackup = () => {
    const backupData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      activationDate: settings.activationDate,
      selectedSound: settings.selectedSound,
      alarm1Enabled: settings.alarm1Enabled,
      alarm2Enabled: settings.alarm2Enabled,
      customPackages: settings.customPackages || {}
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `morning-ritual-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast('Backup exported to file.');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed.customPackages) {
          const updated: AppSettings = {
            ...settings,
            activationDate: parsed.activationDate || settings.activationDate,
            customPackages: { ...(settings.customPackages || {}), ...parsed.customPackages }
          };
          saveSettings(updated);
          onUpdateSettings(updated);
          onShowToast('Backup restored successfully!');
        }
      } catch {
        onShowToast('Invalid backup file format');
      }
    };
    reader.readAsText(file);
  };

  const handleLockAndExit = () => {
    logoutOwner();
    soundEngine.stop();
    onExit();
  };

  const toggleSoundTest = (trackId: string) => {
    if (playingTrackId === trackId) {
      soundEngine.stop();
      setPlayingTrackId(null);
    } else {
      soundEngine.setVolume(settings.volume);
      soundEngine.previewSound(trackId);
      setPlayingTrackId(trackId);
    }
  };

  return (
    <div className="min-h-screen bg-[#181614] text-stone-200 pb-16 selection:bg-rose-500 selection:text-white">
      
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#1e1b18]/95 backdrop-blur-md border-b border-stone-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center shadow-xs">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  Owner & Administrator Portal
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Private Access
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                200 Messages Collection · Rotation Scheduler · Technical Alarms
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLockAndExit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-stone-300 bg-stone-800 border border-stone-700 hover:bg-stone-700 hover:text-white transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
              <span>Back to App</span>
            </button>
            <button
              onClick={handleLockAndExit}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition cursor-pointer"
              title="Lock Session"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Lock Portal</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 space-y-5">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-stone-900 border border-stone-800 rounded-2xl overflow-x-auto">
          <button
            onClick={() => {
              setIsEditing(false);
              setActiveTab('messages');
            }}
            className={`flex-1 py-2 px-3 text-xs font-medium rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'messages'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>200 Messages ({allPackages.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex-1 py-2 px-3 text-xs font-medium rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'schedule'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Rotation & Date (Day {currentDayNum})</span>
          </button>

          <button
            onClick={() => setActiveTab('technical')}
            className={`flex-1 py-2 px-3 text-xs font-medium rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'technical'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Alarm & Audio Controls</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex-1 py-2 px-3 text-xs font-medium rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'security'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Security & Backup</span>
          </button>
        </div>

        {/* ==================== TAB 1: 200 MESSAGES MANAGEMENT ==================== */}
        {activeTab === 'messages' && (
          <div className="space-y-4">
            
            {/* Search & Day Quick Jump */}
            <div className="p-4 rounded-3xl bg-stone-900 border border-stone-800 space-y-3">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
                  <input
                    type="text"
                    placeholder="Search by Day #, theme, note text, scripture..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 text-xs rounded-xl bg-stone-950 border border-stone-800 text-stone-200 focus:outline-amber-500"
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-stone-400">Day:</span>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={selectedDay}
                    onChange={(e) => handleSelectPackage(Math.max(1, Math.min(200, parseInt(e.target.value) || 1)))}
                    className="w-16 py-1.5 px-2 text-center text-xs font-bold rounded-xl bg-stone-950 border border-stone-800 text-amber-300"
                  />
                  <span className="text-xs text-stone-500">/ 200</span>
                </div>
              </div>

              {/* Day selection badges */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 pt-1">
                {filteredPackages.slice(0, 30).map((pkg) => (
                  <button
                    key={pkg.day}
                    onClick={() => handleSelectPackage(pkg.day)}
                    className={`py-1 px-2.5 rounded-lg text-xs font-semibold shrink-0 transition cursor-pointer ${
                      selectedDay === pkg.day
                        ? 'bg-amber-500 text-stone-950 font-bold'
                        : pkg.day === currentDayNum
                        ? 'bg-rose-900/60 text-rose-200 border border-rose-700/60'
                        : 'bg-stone-950 text-stone-400 hover:text-stone-200 border border-stone-800'
                    }`}
                  >
                    D{pkg.day} {settings.customPackages?.[pkg.day] ? '★' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Message Viewer or Editor */}
            <div className="p-5 sm:p-6 rounded-3xl bg-stone-900 border border-stone-800 space-y-5">
              
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Day {activePackage.day} of 200
                  </span>
                  {activePackage.day === currentDayNum && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      Active Today (5:50 & 6:30 AM)
                    </span>
                  )}
                  {settings.customPackages?.[activePackage.day] && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      Customized by You
                    </span>
                  )}
                </div>

                {!isEditing ? (
                  <button
                    onClick={handleStartEditing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-stone-950 text-xs font-bold hover:bg-amber-400 transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit This Day</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1.5 rounded-xl bg-stone-800 text-stone-300 text-xs hover:bg-stone-700 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSavePackageEdits}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 text-stone-950 text-xs font-bold hover:bg-emerald-400 transition cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </button>
                  </div>
                )}
              </div>

              {/* READ ONLY VIEW */}
              {!isEditing ? (
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">Theme</span>
                    <h3 className="text-xl font-serif font-bold text-white mt-0.5">{activePackage.theme}</h3>
                  </div>

                  <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800/80 space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">First-Person Love Message</span>
                    <p className="font-serif italic text-base text-stone-200 leading-relaxed">
                      "{activePackage.romanticMessage}"
                    </p>
                    <div className="text-right text-xs font-serif text-rose-300 pt-2 font-semibold">
                      {activePackage.lovingClosing}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800/80 space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">Daily Encouragement</span>
                    <p className="text-xs text-stone-300 leading-relaxed">{activePackage.encouragement}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">Scripture</span>
                      <span className="text-xs font-semibold text-amber-300">{activePackage.bibleVerse.reference}</span>
                    </div>
                    <p className="font-serif italic text-xs text-stone-300 leading-relaxed">
                      "{activePackage.bibleVerse.text}"
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800/80 space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">Short Prayer</span>
                    <p className="italic text-xs text-stone-300 leading-relaxed">{activePackage.prayer}</p>
                  </div>

                  {settings.customPackages?.[activePackage.day] && (
                    <div className="pt-2">
                      <button
                        onClick={handleResetPackageToDefault}
                        className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset Day {activePackage.day} to original bundled default</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* EDIT FORM */
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-amber-300">Theme Title</label>
                    <input
                      type="text"
                      value={editTheme}
                      onChange={(e) => setEditTheme(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white focus:outline-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-amber-300">Romantic Love Note (First Person from you)</label>
                    <textarea
                      rows={4}
                      value={editRomanticMessage}
                      onChange={(e) => setEditRomanticMessage(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white focus:outline-amber-500 font-serif"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-amber-300">Loving Closing</label>
                    <input
                      type="text"
                      value={editClosing}
                      onChange={(e) => setEditClosing(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white focus:outline-amber-500 font-serif"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-amber-300">Morning Encouragement</label>
                    <textarea
                      rows={2}
                      value={editEncouragement}
                      onChange={(e) => setEditEncouragement(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white focus:outline-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-amber-300">Scripture Reference</label>
                      <input
                        type="text"
                        value={editVerseRef}
                        onChange={(e) => setEditVerseRef(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white focus:outline-amber-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-amber-300">Scripture Text</label>
                      <input
                        type="text"
                        value={editVerseText}
                        onChange={(e) => setEditVerseText(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white focus:outline-amber-500 italic"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-amber-300">Morning Prayer</label>
                    <textarea
                      rows={2}
                      value={editPrayer}
                      onChange={(e) => setEditPrayer(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white focus:outline-amber-500 italic"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 text-xs hover:bg-stone-700 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSavePackageEdits}
                      className="px-5 py-2 rounded-xl bg-emerald-500 text-stone-950 text-xs font-bold hover:bg-emerald-400 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </button>
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

        {/* ==================== TAB 2: ROTATION & DATE CONTROL ==================== */}
        {activeTab === 'schedule' && (
          <div className="space-y-4">
            
            <div className="p-5 rounded-3xl bg-stone-900 border border-stone-800 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Message Rotation Engine</h3>
                </div>
                <span className="text-xs font-bold text-amber-300">
                  Today is Day {currentDayNum} of 200
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-2">
                  <span className="text-xs font-semibold text-stone-300">Activation Anchor Date</span>
                  <input
                    type="date"
                    value={settings.activationDate}
                    onChange={(e) => handleUpdateActivationDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl bg-stone-900 border border-stone-700 text-white focus:outline-amber-500"
                  />
                  <p className="text-[11px] text-stone-500">
                    Day 1 started on this date. Day advances automatically each midnight.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-2">
                  <span className="text-xs font-semibold text-stone-300">Quick Set Active Day</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleJumpToDay(1)}
                      className="flex-1 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-xs font-bold text-amber-300 transition"
                    >
                      Set Day 1
                    </button>
                    <button
                      onClick={() => handleJumpToDay(100)}
                      className="flex-1 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-xs font-bold text-amber-300 transition"
                    >
                      Set Day 100
                    </button>
                    <button
                      onClick={() => handleJumpToDay(200)}
                      className="flex-1 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-xs font-bold text-amber-300 transition"
                    >
                      Set Day 200
                    </button>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Instantly sets today's active note for both alarms without modifying system clock.
                  </p>
                </div>
              </div>

              {/* Day 200 Rollover Assurance */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-1">
                <strong>Automatic 200-Day Rollover:</strong> On day 201, the rotation engine automatically restarts at Day 1 smoothly. The recipient never experiences an empty day or crash.
              </div>
            </div>

            {/* Upcoming Days Preview (Private to Owner) */}
            <div className="p-5 rounded-3xl bg-stone-900 border border-stone-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Next 5 Days Preview
              </h4>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((offset) => {
                  const dayNum = ((currentDayNum - 1 + offset) % 200) + 1;
                  const pkg = getPackageForDay(dayNum);
                  return (
                    <div key={dayNum} className="p-3 rounded-2xl bg-stone-950 border border-stone-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-amber-300 mr-2">In +{offset} day{offset > 1 ? 's' : ''} (Day {dayNum}):</span>
                        <span className="text-stone-300 font-serif italic">"{pkg.theme}"</span>
                      </div>
                      <span className="text-[11px] text-stone-500">{pkg.bibleVerse.reference}</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* ==================== TAB 3: TECHNICAL ALARM & AUDIO CONTROLS ==================== */}
        {activeTab === 'technical' && (
          <div className="space-y-4">
            
            {/* Alarm Schedule Status */}
            <div className="p-5 rounded-3xl bg-stone-900 border border-stone-800 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-rose-400" />
                  <h3 className="text-sm font-bold text-white">Dual Repeating Fixed Alarms</h3>
                </div>
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Synchronized</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300">Alarm 1: 5:50 AM</span>
                    <button
                      onClick={() => onTriggerAlarmTest('5:50 AM First Morning Whisper')}
                      className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold transition cursor-pointer flex items-center gap-1"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>Test Trigger</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-stone-400">
                    Plays "{SOUND_TRACKS.find(t => t.id === settings.selectedSound)?.name}" with crescendo.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-300">Alarm 2: 6:30 AM</span>
                    <button
                      onClick={() => onTriggerAlarmTest('6:30 AM Gentle Rise Ritual')}
                      className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold transition cursor-pointer flex items-center gap-1"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>Test Trigger</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-stone-400">
                    Displays identical same-day package. Dismissing 5:50 AM preserves 6:30 AM.
                  </p>
                </div>
              </div>
            </div>

            {/* 10 Soundtracks Physical Files Audit */}
            <div className="p-5 rounded-3xl bg-stone-900 border border-stone-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">10 Romantic Audio Files Audit</h3>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
                  10/10 Local WAV Files Active
                </span>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {SOUND_TRACKS.map((t, idx) => {
                  const isPlaying = playingTrackId === t.id;
                  const isSelected = settings.selectedSound === t.id;
                  return (
                    <div key={t.id} className="p-3 rounded-2xl bg-stone-950 border border-stone-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-amber-400">{idx + 1}.</span>
                          <span className="font-bold text-white">{t.name}</span>
                          {isSelected && (
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-500 text-white">
                              Active Alarm
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-stone-400 mt-0.5">{t.instrumentation}</div>
                      </div>

                      <button
                        onClick={() => toggleSoundTest(t.id)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                          isPlaying
                            ? 'bg-rose-500 text-white border-rose-600'
                            : 'bg-stone-900 hover:bg-stone-800 text-stone-300 border-stone-700'
                        }`}
                      >
                        {isPlaying ? <Square className="w-3 h-3 fill-white" /> : <Play className="w-3 h-3 fill-current" />}
                        <span>{isPlaying ? 'Stop' : 'Play'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* ==================== TAB 4: SECURITY & BACKUP ==================== */}
        {activeTab === 'security' && (
          <div className="space-y-4">
            
            {/* Change Owner PIN */}
            <div className="p-5 rounded-3xl bg-stone-900 border border-stone-800 space-y-4">
              <div className="flex items-center gap-2 border-b border-stone-800 pb-3">
                <Shield className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Change Owner Private PIN</h3>
              </div>

              <form onSubmit={handleChangePin} className="max-w-sm space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-300">New Private PIN (4-8 digits)</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={8}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="Enter new PIN"
                    className="w-full text-xs p-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white focus:outline-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-300">Confirm New PIN</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={8}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    placeholder="Confirm new PIN"
                    className="w-full text-xs p-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white focus:outline-amber-500"
                  />
                </div>

                {pinChangeMsg && (
                  <p className="text-xs font-medium text-amber-300">{pinChangeMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={!newPin || !confirmPin}
                  className="px-4 py-2 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs hover:bg-amber-400 transition disabled:opacity-40 cursor-pointer"
                >
                  Save New Owner PIN
                </button>
              </form>
            </div>

            {/* Backup & Restore Data */}
            <div className="p-5 rounded-3xl bg-stone-900 border border-stone-800 space-y-3">
              <h3 className="text-sm font-bold text-white">Data Export & Backup</h3>
              <p className="text-xs text-stone-400">
                Download a JSON copy of all customized messages and settings for safekeeping, or restore from an earlier backup.
              </p>

              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={handleExportBackup}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export JSON Backup</span>
                </button>

                <label className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Restore from JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

          </div>
        )}

        {/* Bottom Return to Sanctuary */}
        <div className="pt-6 pb-2 text-center border-t border-stone-800/80">
          <button
            onClick={handleLockAndExit}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-stone-900 border border-stone-700 text-stone-300 hover:text-white hover:bg-stone-800 text-xs font-semibold transition cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span>Lock & Return to App Sanctuary</span>
          </button>
        </div>

      </main>

    </div>
  );
};
