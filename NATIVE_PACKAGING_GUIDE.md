# Our Little Morning Ritual Bestpart ❤️
## Master Native Packaging, Testing & Architecture Guide

This document describes the complete architecture, sound assets, native Android and iOS alarm implementations, offline PWA setup, and real-device testing procedures for **Our Little Morning Ritual Bestpart ❤️**.

---

### 1. Application Identity & Purpose

- **App Name**: Our Little Morning Ritual Bestpart ❤️
- **Subtitle**: *A little love waiting for you every morning.*
- **Invitation Question**: *Would you like to activate our morning ritual?*
- **Actions**: APPROVE / DECLINE
  - Approving opens the installation, permission, and onboarding flow.
  - Declining displays a respectful message and keeps the invitation available for whenever she wants to activate.
- **Fixed Alarm Times**: 
  - **First Alarm**: 5:50 AM (Local device timezone)
  - **Second Alarm**: 6:30 AM (Local device timezone)
  - Both alarms are independently configurable and enabled by default.
  - **Both alarms on the same calendar day always use the exact same daily message package and the same selected instrumental sound.**
  - Dismissing the first alarm does not cancel or affect the second alarm.

---

### 2. Ten Complete Romantic Instrumental Soundtracks (Offline Bundled)

Ten complete, authentic musical arrangements are bundled locally in `/public/audio/`, `android/app/src/main/res/raw/`, and `ios/App/App/`:

1. **Our Beautiful Morning** (`our_beautiful_morning.wav`): Rich, emotional cinematic instrumental with grand piano, strings, harp, and dawn chimes (*Default soundtrack*).
2. **Romantic Piano** (`romantic_piano.wav`): Emotional grand piano melody with warm harmonic overtones.
3. **Endless Love** (`endless_love.wav`): Piano with lush orchestral violin and cello strings.
4. **Morning Embrace** (`morning_embrace.wav`): Acoustic harp arpeggios, sweet music box celesta, and sunrise warmth.
5. **Sweet Romance** (`sweet_romance.wav`): Gentle acoustic nylon guitar fingerpicking and soft romantic piano.
6. **Love's Sunrise** (`loves_sunrise.wav`): Flowing piano, peaceful strings, and crystal chimes.
7. **Forever Together** (`forever_together.wav`): Warm romantic orchestral chamber instrumental with gentle harp glissandos.
8. **Golden Memories** (`golden_memories.wav`): Soft piano accompanied by an expressive, romantic acoustic violin line.
9. **Heaven's Melody** (`heavens_melody.wav`): Celestial harp arpeggios floating over serene orchestral pads.
10. **Tender Hearts** (`tender_hearts.wav`): Gentle guitar, piano, and warm string ensemble.

All tracks contain **zero singing or speech**, are offline, and feature an optional **gentle 12-second crescendo fade-in**.

---

### 3. Complete 200-Day Message System

- Exactly 200 complete, verified, and distinct packages are bundled in `src/data/packages200.json` and exported via `src/data/messagePackages.ts`.
- Every package contains all 5 required elements:
  1. A heartfelt first-person romantic message from the sender to her.
  2. A meaningful encouragement or affirmation for her day.
  3. A relevant Bible verse with its book, chapter, and verse reference.
  4. A short, sincere prayer for her peace, protection, and joy.
  5. A loving personal closing signature.
- **Deterministic Cycle**: Calculated from the local activation date modulo 200. Day 1 -> Day 200 -> Day 1 smoothly. Both alarms on the same calendar day select the exact same package.

---

### 4. Real Alarm Experience & Native Architecture

#### Android Implementation (`/android/app/src/main/java/com/morningritual/bestpart/`)
- **`AlarmPlugin.kt`**: Capacitor Plugin bridge exposing `scheduleAlarm`, `cancelAlarm`, `stopAlarm`, `snoozeAlarm`, and `requestExactAlarmPermission`.
- **`AlarmReceiver.kt`**: Triggered by `AlarmManager.setExactAndAllowWhileIdle(RTC_WAKEUP, ...)`. Acquires a partial wake lock to turn on the screen and starts `AlarmService`. Automatically reschedules repeating alarms for tomorrow.
- **`AlarmService.kt`**: Android foreground service running a `MediaPlayer` configured with:
  ```kotlin
  AudioAttributes.Builder()
      .setUsage(AudioAttributes.USAGE_ALARM)
      .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
      .build()
  ```
  Plays the bundled `.wav` track with a 12-second crescendo fade-in. Displays a full-screen notification with two actions:
  - **STOP ALARM**: Immediately stops audio playback without cancelling the other alarm.
  - **SNOOZE (9 MIN)**: Stops audio and schedules a 9-minute snooze alarm.
- **`AlarmActionReceiver.kt`**: BroadcastReceiver handling the STOP and SNOOZE notification actions.
- **`BootReceiver.kt`**: Restores both alarms on `BOOT_COMPLETED`, `TIMEZONE_CHANGED`, and `TIME_SET`.

#### iPhone Implementation (`/ios/App/App/`)
- **iOS 26 and later**:
  - Implements Apple's native **`AlarmKit`** framework (`import AlarmKit`) using AlarmManager authorization, repeating alarm schedules, and custom sound configuration.
- **Earlier iOS versions (iOS 12 – iOS 25)**:
  - Transparent fallback using `UNUserNotificationCenter` with bundled custom `.wav` audio assets and critical sound configuration where provisioned.
  - Transparently explains to users that on older iOS versions, alarms require notification permissions and that the hardware mute switch should not silence notifications.

---

### 5. Packaging & Build Instructions

#### Step 1: Install Dependencies
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npm run build
```

#### Step 2: Android Native Build
```bash
npx cap add android
npx cap sync android
npx cap open android
```
In Android Studio:
1. Verify `res/raw` contains the 10 `.wav` files.
2. In Android device settings:
   - Go to **Settings → Apps → Our Little Morning Ritual → Alarms & Reminders**: Ensure **Allow setting alarms** is ON.
   - Go to **Battery**: Set to **Unrestricted** to prevent aggressive OEM killers.
3. Test reboot recovery via ADB:
   ```bash
   adb shell dumpsys alarm | grep com.morningritual.bestpart
   ```

#### Step 3: iOS Native Build
```bash
npx cap add ios
npx cap sync ios
npx cap open ios
```
In Xcode:
1. Under **Signing & Capabilities**:
   - Add **Background Modes**: Check **Audio, AirPlay, and Picture in Picture** and **Background fetch**.
   - On iOS 26+, link `AlarmKit.framework`.
2. Deploy to physical iPhone, launch app, approve invitation, and grant permissions.

---

### 6. Summary of Real-Device vs Simulated Tests

| Feature | In-App Simulator | Real-Device Requirement |
|---|---|---|
| Schedule 5:50 AM & 6:30 AM | Verified with identical message | Tested with device AlarmManager / AlarmKit |
| STOP ALARM stops audio | Verified via audio engine & native bridge | Tested with native notification button |
| SNOOZE 9 Minutes | Verified with countdown timer | Tested with native one-shot wake timer |
| 10 Soundtracks Playback | Verified with local .wav files | Played via Android MediaPlayer (USAGE_ALARM) |
| Day 200 to Day 1 Rollover | Verified mathematically & in test suite | Automatic at local midnight |
| Reboot Recovery | Verified logic in BootReceiver | Tested by restarting device |
