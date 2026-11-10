/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SoundTrack {
  id: string;
  name: string;
  filename: string;
  description: string;
  instrumentation: string;
}

export const SOUND_TRACKS: SoundTrack[] = [
  {
    id: 'our-beautiful-morning',
    name: 'Our Beautiful Morning',
    filename: 'our_beautiful_morning.wav',
    description: 'Rich, emotional cinematic instrumental with grand piano, strings, harp, and dawn chimes (Default).',
    instrumentation: 'Piano, Orchestral Strings, Harp & Chimes'
  },
  {
    id: 'romantic-piano',
    name: 'Romantic Piano',
    filename: 'romantic_piano.wav',
    description: 'Emotional grand piano melody with warm harmonic overtones and romantic cadence.',
    instrumentation: 'Grand Piano Solo'
  },
  {
    id: 'endless-love',
    name: 'Endless Love',
    filename: 'endless_love.wav',
    description: 'Tender grand piano harmonized with soaring, gentle orchestral violin and cello strings.',
    instrumentation: 'Piano & Orchestral String Ensemble'
  },
  {
    id: 'morning-embrace',
    name: 'Morning Embrace',
    filename: 'morning_embrace.wav',
    description: 'Delicate acoustic harp arpeggios, sweet music box bells, and a warm sunrise ambience.',
    instrumentation: 'Acoustic Harp & Music Box Celesta'
  },
  {
    id: 'sweet-romance',
    name: 'Sweet Romance',
    filename: 'sweet_romance.wav',
    description: 'Gentle acoustic nylon guitar fingerpicking entwined with soft, romantic piano chords.',
    instrumentation: 'Acoustic Guitar & Piano'
  },
  {
    id: 'loves-sunrise',
    name: "Love's Sunrise",
    filename: 'loves_sunrise.wav',
    description: 'Cinematic sunrise prelude with flowing piano, peaceful strings, and sparkling crystal chimes.',
    instrumentation: 'Cinematic Piano, Strings & Crystal Chimes'
  },
  {
    id: 'forever-together',
    name: 'Forever Together',
    filename: 'forever_together.wav',
    description: 'Warm and uplifting romantic orchestral instrumental with strings and gentle harp glissandos.',
    instrumentation: 'Full Romantic Chamber Orchestra'
  },
  {
    id: 'golden-memories',
    name: 'Golden Memories',
    filename: 'golden_memories.wav',
    description: 'Beautiful, nostalgic soft piano accompanied by an expressive, romantic acoustic violin line.',
    instrumentation: 'Soft Piano & Romantic Solo Violin'
  },
  {
    id: 'heavens-melody',
    name: "Heaven's Melody",
    filename: 'heavens_melody.wav',
    description: 'Deeply peaceful celestial harp arpeggios floating over serene orchestral pads.',
    instrumentation: 'Celestial Harp & Ambient Orchestral Pads'
  },
  {
    id: 'tender-hearts',
    name: 'Tender Hearts',
    filename: 'tender_hearts.wav',
    description: 'Gentle acoustic guitar harmonics, loving piano melodies, and warm violin ensemble.',
    instrumentation: 'Acoustic Guitar, Piano & Warm Strings'
  }
];

class SoundEngine {
  private currentAudio: HTMLAudioElement | null = null;
  private currentTrackId: string | null = null;
  private currentVolume = 0.85;
  private isPlaying = false;
  private fadeIntervalId: number | null = null;

  public setVolume(vol: number) {
    this.currentVolume = Math.max(0, Math.min(1, vol));
    if (this.currentAudio && !this.fadeIntervalId) {
      this.currentAudio.volume = this.currentVolume;
    }
  }

  public getVolume(): number {
    return this.currentVolume;
  }

  public getCurrentTrackId(): string | null {
    return this.currentTrackId;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Plays the complete bundled local audio file offline with optional gentle fade-in crescendo
   */
  public playTrack(trackId: string = 'our-beautiful-morning', crescendo: boolean = false) {
    this.stop();

    const track = SOUND_TRACKS.find(t => t.id === trackId) || SOUND_TRACKS[0];
    const audioUrl = `/audio/${track.filename}`;

    try {
      this.currentAudio = new Audio(audioUrl);
      this.currentAudio.loop = true;
      this.currentTrackId = track.id;
      this.isPlaying = true;

      if (crescendo) {
        // Start at near whisper and ramp up to target volume over 12 seconds
        this.currentAudio.volume = 0.05;
        const targetVol = this.currentVolume;
        const steps = 60;
        const intervalTime = (12 * 1000) / steps;
        const volStep = (targetVol - 0.05) / steps;
        let stepCount = 0;

        this.fadeIntervalId = window.setInterval(() => {
          if (!this.currentAudio) {
            if (this.fadeIntervalId) clearInterval(this.fadeIntervalId);
            return;
          }
          stepCount++;
          const nextVol = Math.min(targetVol, 0.05 + stepCount * volStep);
          this.currentAudio.volume = nextVol;
          if (stepCount >= steps) {
            if (this.fadeIntervalId) {
              clearInterval(this.fadeIntervalId);
              this.fadeIntervalId = null;
            }
          }
        }, intervalTime);
      } else {
        this.currentAudio.volume = this.currentVolume;
      }

      this.currentAudio.play().catch(err => {
        console.warn('Audio playback waiting for user interaction:', err);
      });
    } catch (e) {
      console.warn('Failed to initialize audio element:', e);
    }
  }

  /**
   * Preview a track without crescendo
   */
  public previewSound(trackId: string) {
    this.playTrack(trackId, false);
  }

  /**
   * Stop any playing audio immediately
   */
  public stop() {
    this.isPlaying = false;
    this.currentTrackId = null;

    if (this.fadeIntervalId) {
      clearInterval(this.fadeIntervalId);
      this.fadeIntervalId = null;
    }

    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (e) {
        console.warn('Audio pause error:', e);
      }
      this.currentAudio = null;
    }
  }
}

export const soundEngine = new SoundEngine();
// Alias for backward compatibility
export const audioEngine = soundEngine;
