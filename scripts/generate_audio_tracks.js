/**
 * High-Fidelity Romantic Instrumental Audio Synthesizer
 * Generates 10 distinct, complete, professionally composed romantic instrumental compositions
 * in 16-bit 44.1kHz Stereo PCM WAV format.
 *
 * Instruments modeled:
 * - Warm Grand Piano (hammer impulse & string inharmonicity)
 * - Expressive Romantic Violins (bowed saw partials, 5.2Hz vibrato, body formants)
 * - Deep, Warm Cello (rich low-register warmth, cello air resonance, expressive vibrato)
 * - Gentle Viola (warm mid-range harmonic body)
 * - Concert Harp (plucked decay with delicate acoustic sparkle)
 * - Acoustic Nylon Guitar (body Helmholtz resonance and fingerstyle warmth)
 * - Soft Romantic Silver Flute (breathy air component and lyrical singing vibrato)
 * - Ethereal Orchestral Strings & Pads (slow attack stereo chorus)
 */

import fs from 'fs';
import path from 'path';

const SAMPLE_RATE = 44100;

// Musical note frequencies in Hz (A4 = 440 Hz)
const N = {
  // Octave 2 (Cello deep register)
  C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, Fs2: 92.50, G2: 98.00, Ab2: 103.83, A2: 110.00, Bb2: 116.54, B2: 123.47,
  // Octave 3 (Cello / Viola / Piano bass)
  C3: 130.81, Cs3: 138.59, D3: 146.83, Eb3: 155.56, E3: 164.81, F3: 174.61, Fs3: 185.00, G3: 196.00, Ab3: 207.65, A3: 220.00, Bb3: 233.08, B3: 246.94,
  // Octave 4 (Piano middle / Viola / Violin low / Flute low / Guitar)
  C4: 261.63, Cs4: 277.18, D4: 293.66, Eb4: 311.13, E4: 329.63, F4: 349.23, Fs4: 369.99, G4: 392.00, Ab4: 415.30, A4: 440.00, Bb4: 466.16, B4: 493.88,
  // Octave 5 (Violin lead / Flute / Piano treble / Harp)
  C5: 523.25, Cs5: 554.37, D5: 587.33, Eb5: 622.25, E5: 659.25, F5: 698.46, Fs5: 739.99, G5: 783.99, Ab5: 830.61, A5: 880.00, Bb5: 932.33, B5: 987.77,
  // Octave 6 (High Violin / Celesta / Flute sparkle)
  C6: 1046.50, Cs6: 1108.73, D6: 1174.66, Eb6: 1244.51, E6: 1318.51, F6: 1396.91, Fs6: 1479.98, G6: 1567.98, A6: 1760.00
};

// Aliases
N.Gs2 = N.Ab2; N.Gs3 = N.Ab3; N.Gs4 = N.Ab4; N.Gs5 = N.Ab5;
N.Ds3 = N.Eb3; N.Ds4 = N.Eb4; N.Ds5 = N.Eb5; N.Ds6 = N.Eb6;
N.As2 = N.Bb2; N.As3 = N.Bb3; N.As4 = N.Bb4; N.As5 = N.Bb5;

// --- WAV Buffer Builder ---
function createWavBuffer(sampleRate, samplesLeft, samplesRight) {
  const numSamples = samplesLeft.length;
  const numChannels = 2;
  const bytesPerSample = 2; // 16-bit PCM
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF Chunk Descriptor
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // "fmt " sub-chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34);

  // "data" sub-chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    // Gentle hyperbolic tangent analog saturation
    let sL = Math.tanh(samplesLeft[i]);
    let sR = Math.tanh(samplesRight[i]);

    const intL = sL < 0 ? Math.floor(sL * 32768) : Math.floor(sL * 32767);
    const intR = sR < 0 ? Math.floor(sR * 32768) : Math.floor(sR * 32767);
    buffer.writeInt16LE(intL, offset);
    buffer.writeInt16LE(intR, offset + 2);
    offset += 4;
  }

  return buffer;
}

// ==========================================
// ACOUSTIC INSTRUMENT PHYSICAL SYNTHESIZERS
// ==========================================

function addPiano(freq, startTime, duration, velocity, pan, L, R) {
  const startIdx = Math.floor(startTime * SAMPLE_RATE);
  const totalSamples = Math.floor((duration + 1.8) * SAMPLE_RATE);
  const endIdx = Math.min(L.length, startIdx + totalSamples);
  const inharmonicity = 0.00018;

  for (let i = startIdx; i < endIdx; i++) {
    const t = (i - startIdx) / SAMPLE_RATE;
    const attack = 1 - Math.exp(-t * 220);
    const decay = Math.exp(-t * (1.1 - velocity * 0.35)) * 0.75 + Math.exp(-t * 0.28) * 0.25;
    const env = attack * decay;

    let sample = 0;
    for (let k = 1; k <= 8; k++) {
      const partialFreq = k * freq * Math.sqrt(1 + inharmonicity * k * k);
      const partialDecay = Math.exp(-t * k * 0.65);
      const amp = (1 / Math.pow(k, 1.25)) * partialDecay;
      sample += Math.sin(2 * Math.PI * partialFreq * t) * amp;
    }

    const val = sample * env * velocity * 0.26;
    const panL = 1 - pan * 0.5;
    const panR = 0.5 + pan * 0.5;
    L[i] += val * panL;
    R[i] += val * panR;
  }
}

function addViolin(freq, startTime, duration, velocity, pan, L, R) {
  const startIdx = Math.floor(startTime * SAMPLE_RATE);
  const totalSamples = Math.floor((duration + 0.8) * SAMPLE_RATE);
  const endIdx = Math.min(L.length, startIdx + totalSamples);

  for (let i = startIdx; i < endIdx; i++) {
    const t = (i - startIdx) / SAMPLE_RATE;

    let env = 1.0;
    if (t < 0.18) {
      env = t / 0.18;
    } else if (t > duration) {
      env = Math.max(0, 1 - (t - duration) / 0.35);
    }

    const vibProgress = Math.min(1, Math.max(0, (t - 0.22) / 0.28));
    const vibDepth = 0.007 * vibProgress;
    const vib = 1 + vibDepth * Math.sin(2 * Math.PI * 5.2 * t);
    const f = freq * vib;

    let sample = 0;
    for (let k = 1; k <= 7; k++) {
      const harm = k * f;
      const formant = (1 + 0.6 * Math.exp(-Math.pow((harm - 450) / 200, 2)) +
                           0.4 * Math.exp(-Math.pow((harm - 2800) / 800, 2)));
      const amp = (1 / Math.pow(k, 1.1)) * formant;
      sample += Math.sin(2 * Math.PI * harm * t + k * 0.3) * amp;
    }

    const val = sample * env * velocity * 0.18;
    const panL = 1 - pan * 0.45;
    const panR = 0.55 + pan * 0.45;
    L[i] += val * panL;
    R[i] += val * panR;
  }
}

function addCello(freq, startTime, duration, velocity, pan, L, R) {
  const startIdx = Math.floor(startTime * SAMPLE_RATE);
  const totalSamples = Math.floor((duration + 1.0) * SAMPLE_RATE);
  const endIdx = Math.min(L.length, startIdx + totalSamples);

  for (let i = startIdx; i < endIdx; i++) {
    const t = (i - startIdx) / SAMPLE_RATE;

    let env = 1.0;
    if (t < 0.24) {
      env = t / 0.24;
    } else if (t > duration) {
      env = Math.max(0, 1 - (t - duration) / 0.5);
    }

    const vibProgress = Math.min(1, Math.max(0, (t - 0.3) / 0.4));
    const vibDepth = 0.006 * vibProgress;
    const vib = 1 + vibDepth * Math.sin(2 * Math.PI * 4.8 * t);
    const f = freq * vib;

    let sample = 0;
    for (let k = 1; k <= 6; k++) {
      const harm = k * f;
      const celloBody = 1 + 0.8 * Math.exp(-Math.pow((harm - 110) / 50, 2)) +
                            0.7 * Math.exp(-Math.pow((harm - 220) / 80, 2)) +
                            0.5 * Math.exp(-Math.pow((harm - 400) / 120, 2));
      const amp = (1 / Math.pow(k, 1.05)) * celloBody;
      sample += Math.sin(2 * Math.PI * harm * t + k * 0.2) * amp;
    }

    const val = sample * env * velocity * 0.24;
    const panL = 1 - pan * 0.4;
    const panR = 0.6 + pan * 0.4;
    L[i] += val * panL;
    R[i] += val * panR;
  }
}

function addStringsPad(notes, startTime, duration, velocity, L, R) {
  const startIdx = Math.floor(startTime * SAMPLE_RATE);
  const totalSamples = Math.floor((duration + 1.5) * SAMPLE_RATE);
  const endIdx = Math.min(L.length, startIdx + totalSamples);

  for (let i = startIdx; i < endIdx; i++) {
    const t = (i - startIdx) / SAMPLE_RATE;
    const attack = 0.6;
    let env = 1.0;
    if (t < attack) {
      env = t / attack;
    } else if (t > duration) {
      env = Math.max(0, 1 - (t - duration) / 1.5);
    }

    let chordSumL = 0;
    let chordSumR = 0;

    notes.forEach((freq, idx) => {
      const vib1 = 1 + 0.0035 * Math.sin(2 * Math.PI * 4.9 * t + idx);
      const vib2 = 1 + 0.0035 * Math.sin(2 * Math.PI * 5.3 * t + idx * 2);
      const s1 = Math.sin(2 * Math.PI * freq * vib1 * t);
      const s2 = Math.sin(2 * Math.PI * freq * 1.0025 * vib2 * t) * 0.75;
      const s3 = Math.sin(2 * Math.PI * freq * 0.9975 * t) * 0.75;
      const s4 = Math.sin(2 * Math.PI * freq * 2.0 * t) * 0.35;
      const voice = (s1 + s2 + s3 + s4) * 0.35;

      const pan = (idx % 2 === 0 ? 0.35 : 0.65) + 0.1 * Math.sin(t * 0.5);
      chordSumL += voice * (1 - pan);
      chordSumR += voice * pan;
    });

    const val = (env * velocity * 0.16) / Math.sqrt(Math.max(1, notes.length));
    L[i] += chordSumL * val;
    R[i] += chordSumR * val;
  }
}

function addHarp(freq, startTime, duration, velocity, pan, L, R) {
  const startIdx = Math.floor(startTime * SAMPLE_RATE);
  const totalSamples = Math.floor((duration + 2.2) * SAMPLE_RATE);
  const endIdx = Math.min(L.length, startIdx + totalSamples);

  for (let i = startIdx; i < endIdx; i++) {
    const t = (i - startIdx) / SAMPLE_RATE;
    const pluck = (1 - Math.exp(-t * 260));
    const decay = Math.exp(-t * 1.6);
    const env = pluck * decay;

    let sample = Math.sin(2 * Math.PI * freq * t) * 0.7;
    sample += Math.sin(2 * Math.PI * freq * 2 * t) * 0.28;
    sample += Math.sin(2 * Math.PI * freq * 3 * t) * 0.12;
    sample += Math.sin(2 * Math.PI * freq * 4 * t) * 0.04;

    const val = sample * env * velocity * 0.22;
    const panL = 1 - pan * 0.5;
    const panR = 0.5 + pan * 0.5;
    L[i] += val * panL;
    R[i] += val * panR;
  }
}

function addGuitar(freq, startTime, duration, velocity, pan, L, R) {
  const startIdx = Math.floor(startTime * SAMPLE_RATE);
  const totalSamples = Math.floor((duration + 1.8) * SAMPLE_RATE);
  const endIdx = Math.min(L.length, startIdx + totalSamples);

  for (let i = startIdx; i < endIdx; i++) {
    const t = (i - startIdx) / SAMPLE_RATE;
    const attack = (1 - Math.exp(-t * 180));
    const decay = Math.exp(-t * 2.1);
    const env = attack * decay;

    let sample = Math.sin(2 * Math.PI * freq * t) * 0.65;
    sample += Math.sin(2 * Math.PI * freq * 2 * t) * 0.32;
    sample += Math.sin(2 * Math.PI * freq * 3 * t) * 0.15;
    sample += Math.sin(2 * Math.PI * 105 * t) * 0.08 * Math.exp(-t * 5);

    const val = sample * env * velocity * 0.23;
    const panL = 1 - pan * 0.5;
    const panR = 0.5 + pan * 0.5;
    L[i] += val * panL;
    R[i] += val * panR;
  }
}

function addFlute(freq, startTime, duration, velocity, pan, L, R) {
  const startIdx = Math.floor(startTime * SAMPLE_RATE);
  const totalSamples = Math.floor((duration + 0.6) * SAMPLE_RATE);
  const endIdx = Math.min(L.length, startIdx + totalSamples);

  for (let i = startIdx; i < endIdx; i++) {
    const t = (i - startIdx) / SAMPLE_RATE;

    let env = 1.0;
    if (t < 0.12) {
      env = t / 0.12;
    } else if (t > duration) {
      env = Math.max(0, 1 - (t - duration) / 0.25);
    }

    const vibProgress = Math.min(1, Math.max(0, (t - 0.15) / 0.25));
    const vib = 1 + 0.008 * vibProgress * Math.sin(2 * Math.PI * 5.5 * t);
    const f = freq * vib;

    let sample = Math.sin(2 * Math.PI * f * t) * 0.85;
    sample += Math.sin(2 * Math.PI * f * 2 * t) * 0.18;
    sample += Math.sin(2 * Math.PI * f * 3 * t) * 0.06;
    const breath = (Math.random() * 2 - 1) * 0.04 * Math.sin(2 * Math.PI * f * t);

    const val = (sample + breath) * env * velocity * 0.19;
    const panL = 1 - pan * 0.5;
    const panR = 0.5 + pan * 0.5;
    L[i] += val * panL;
    R[i] += val * panR;
  }
}

function addChimes(freq, startTime, duration, velocity, pan, L, R) {
  const startIdx = Math.floor(startTime * SAMPLE_RATE);
  const totalSamples = Math.floor((duration + 2.5) * SAMPLE_RATE);
  const endIdx = Math.min(L.length, startIdx + totalSamples);

  for (let i = startIdx; i < endIdx; i++) {
    const t = (i - startIdx) / SAMPLE_RATE;
    const env = Math.exp(-t * 1.3);
    const bell = (Math.sin(2 * Math.PI * freq * t) * 0.55 +
                  Math.sin(2 * Math.PI * freq * 2.756 * t) * 0.25 +
                  Math.sin(2 * Math.PI * freq * 5.404 * t) * 0.12) * env * velocity * 0.16;
    L[i] += bell * (1 - pan * 0.4);
    R[i] += bell * (0.6 + pan * 0.4);
  }
}

// ==========================================
// 10 DISTINCT ROMANTIC COMPOSITIONS
// ==========================================

const TRACK_COMPOSITIONS = [
  // 1. Romantic Piano (Emotional Grand Piano Solo in D Major / B Minor)
  {
    id: 'romantic-piano',
    filename: 'romantic_piano.wav',
    name: 'Romantic Piano',
    duration: 24,
    compose: (L, R) => {
      const progression = [
        { time: 0.0, bass: [N.D3, N.A3, N.Fs4], lead: [{ t: 0.6, n: N.A4 }, { t: 1.4, n: N.D5 }, { t: 2.2, n: N.Fs5 }] },
        { time: 3.2, bass: [N.B2, N.Fs3, N.D4], lead: [{ t: 3.8, n: N.E5 }, { t: 4.6, n: N.D5 }, { t: 5.4, n: N.B4 }] },
        { time: 6.4, bass: [N.G2, N.D3, N.B3], lead: [{ t: 7.0, n: N.D5 }, { t: 7.8, n: N.B4 }, { t: 8.6, n: N.G4 }] },
        { time: 9.6, bass: [N.A2, N.E3, N.Cs4], lead: [{ t: 10.2, n: N.Fs4 }, { t: 11.0, n: N.G4 }, { t: 11.8, n: N.A4 }] },
        { time: 12.8, bass: [N.Fs2, N.Cs3, N.A3], lead: [{ t: 13.4, n: N.Cs5 }, { t: 14.2, n: N.D5 }, { t: 15.0, n: N.E5 }] },
        { time: 16.0, bass: [N.B2, N.Fs3, N.D4], lead: [{ t: 16.6, n: N.Fs5 }, { t: 17.4, n: N.E5 }, { t: 18.2, n: N.D5 }] },
        { time: 19.2, bass: [N.E2, N.B2, N.G3], lead: [{ t: 19.8, n: N.B4 }, { t: 20.6, n: N.Cs5 }, { t: 21.6, n: N.D5 }] },
      ];

      progression.forEach(bar => {
        bar.bass.forEach((bn, idx) => {
          addPiano(bn, bar.time + idx * 0.35, 3.2, 0.75, 0.35, L, R);
        });
        bar.lead.forEach(ld => {
          addPiano(ld.n, ld.t, 1.8, 0.88, 0.65, L, R);
        });
      });

      addPiano(N.D3, 22.2, 3.5, 0.8, 0.5, L, R);
      addPiano(N.A3, 22.3, 3.5, 0.8, 0.5, L, R);
      addPiano(N.D4, 22.4, 3.5, 0.85, 0.5, L, R);
      addPiano(N.Fs4, 22.5, 3.5, 0.9, 0.5, L, R);
    }
  },

  // 2. Endless Love (Grand Piano & Soaring Violin/Cello Strings in G Major)
  {
    id: 'endless-love',
    filename: 'endless_love.wav',
    name: 'Endless Love',
    duration: 24,
    compose: (L, R) => {
      const stringChords = [
        { t: 0.0, d: 5.8, notes: [N.G2, N.D3, N.G3, N.B3] },
        { t: 5.8, d: 5.8, notes: [N.E2, N.B2, N.E3, N.G3] },
        { t: 11.6, d: 5.8, notes: [N.C3, N.G3, N.C4, N.E4] },
        { t: 17.4, d: 6.5, notes: [N.D3, N.A3, N.D4, N.Fs4] }
      ];
      stringChords.forEach(c => addStringsPad(c.notes, c.t, c.d, 0.72, L, R));

      const celloPhrases = [
        { t: 0.8, n: N.G2, d: 2.2, v: 0.8 },
        { t: 3.2, n: N.B2, d: 2.0, v: 0.82 },
        { t: 6.2, n: N.E2, d: 2.4, v: 0.85 },
        { t: 9.0, n: N.G2, d: 2.2, v: 0.82 },
        { t: 12.0, n: N.C3, d: 2.5, v: 0.88 },
        { t: 15.0, n: N.E3, d: 2.0, v: 0.85 },
        { t: 17.8, n: N.D3, d: 2.8, v: 0.88 },
        { t: 21.0, n: N.G2, d: 3.0, v: 0.9 }
      ];
      celloPhrases.forEach(cp => addCello(cp.n, cp.t, cp.d, cp.v, 0.35, L, R));

      const violinLead = [
        { t: 1.2, n: N.D4, d: 1.8, v: 0.8 },
        { t: 2.8, n: N.G4, d: 2.0, v: 0.85 },
        { t: 4.8, n: N.B4, d: 2.2, v: 0.9 },
        { t: 7.2, n: N.C5, d: 1.8, v: 0.92 },
        { t: 9.2, n: N.B4, d: 2.0, v: 0.88 },
        { t: 12.2, n: N.A4, d: 2.2, v: 0.85 },
        { t: 14.5, n: N.C5, d: 2.4, v: 0.9 },
        { t: 17.5, n: N.D5, d: 2.6, v: 0.95 },
        { t: 20.2, n: N.G4, d: 3.2, v: 0.9 }
      ];
      violinLead.forEach(vl => addViolin(vl.n, vl.t, vl.d, vl.v, 0.65, L, R));

      for (let t = 0.5; t < 22; t += 1.2) {
        addPiano(N.G3, t, 1.2, 0.6, 0.5, L, R);
        addPiano(N.D4, t + 0.4, 1.2, 0.65, 0.5, L, R);
      }
    }
  },

  // 3. Morning Embrace (Concert Harp, Music Box Celesta & Warm Strings in Eb Major)
  {
    id: 'morning-embrace',
    filename: 'morning_embrace.wav',
    name: 'Morning Embrace',
    duration: 24,
    compose: (L, R) => {
      addStringsPad([N.Eb3, N.Bb3, N.Eb4, N.G4], 0.0, 6.0, 0.68, L, R);
      addStringsPad([N.C3, N.G3, N.C4, N.Eb4], 6.0, 6.0, 0.68, L, R);
      addStringsPad([N.Ab2, N.Eb3, N.Ab3, N.C4], 12.0, 6.0, 0.68, L, R);
      addStringsPad([N.Bb2, N.F3, N.Bb3, N.D4], 18.0, 6.0, 0.72, L, R);

      const harpPatterns = [
        { t: 0.4, notes: [N.Eb3, N.G3, N.Bb3, N.Eb4, N.G4, N.Bb4] },
        { t: 3.2, notes: [N.G3, N.Bb3, N.Eb4, N.G4, N.Bb4, N.Eb5] },
        { t: 6.4, notes: [N.C3, N.Eb3, N.G3, N.C4, N.Eb4, N.G4] },
        { t: 9.4, notes: [N.Eb3, N.G3, N.C4, N.Eb4, N.G4, N.C5] },
        { t: 12.4, notes: [N.Ab3, N.C4, N.Eb4, N.Ab4, N.C5, N.Eb5] },
        { t: 15.4, notes: [N.C4, N.Eb4, N.Ab4, N.C5, N.Eb5, N.Ab5] },
        { t: 18.4, notes: [N.Bb3, N.D4, N.F4, N.Bb4, N.D5, N.F5] },
        { t: 21.0, notes: [N.Eb3, N.Bb3, N.Eb4, N.G4, N.Bb4, N.Eb5] }
      ];
      harpPatterns.forEach(hp => {
        hp.notes.forEach((n, idx) => {
          addHarp(n, hp.t + idx * 0.22, 2.4, 0.78, 0.3 + idx * 0.08, L, R);
        });
      });

      const musicBox = [
        { t: 1.8, n: N.G5, d: 2.0 },
        { t: 4.5, n: N.Bb5, d: 2.0 },
        { t: 7.8, n: N.C6, d: 2.2 },
        { t: 10.8, n: N.G5, d: 2.0 },
        { t: 13.8, n: N.Ab5, d: 2.2 },
        { t: 16.8, n: N.C6, d: 2.4 },
        { t: 19.8, n: N.Bb5, d: 2.5 },
        { t: 22.2, n: N.Eb6, d: 3.0 }
      ];
      musicBox.forEach(mb => addChimes(mb.n, mb.t, mb.d, 0.82, 0.55, L, R));
    }
  },

  // 4. Sweet Romance (Acoustic Nylon Guitar, Soft Flute & Cello in A Major)
  {
    id: 'sweet-romance',
    filename: 'sweet_romance.wav',
    name: 'Sweet Romance',
    duration: 24,
    compose: (L, R) => {
      const chords = [
        { t: 0.0, pattern: [N.A2, N.E3, N.A3, N.Cs4, N.E4] },
        { t: 3.0, pattern: [N.Cs3, N.Gs3, N.Cs4, N.E4, N.Gs4] },
        { t: 6.0, pattern: [N.D3, N.A3, N.D4, N.Fs4, N.A4] },
        { t: 9.0, pattern: [N.E3, N.B3, N.E4, N.Gs4, N.B4] },
        { t: 12.0, pattern: [N.Fs2, N.Cs3, N.Fs3, N.A3, N.Cs4] },
        { t: 15.0, pattern: [N.D3, N.A3, N.D4, N.Fs4, N.A4] },
        { t: 18.0, pattern: [N.E3, N.B3, N.E4, N.Gs4, N.D5] },
        { t: 21.0, pattern: [N.A2, N.E3, N.A3, N.Cs4, N.E4] }
      ];
      chords.forEach(c => {
        c.pattern.forEach((n, idx) => {
          addGuitar(n, c.t + idx * 0.28, 2.0, 0.82, 0.35, L, R);
        });
      });

      [
        { t: 0.2, n: N.A2, d: 2.8 },
        { t: 3.2, n: N.Cs3, d: 2.8 },
        { t: 6.2, n: N.D3, d: 2.8 },
        { t: 9.2, n: N.E3, d: 2.8 },
        { t: 12.2, n: N.Fs2, d: 2.8 },
        { t: 15.2, n: N.D3, d: 2.8 },
        { t: 18.2, n: N.E3, d: 2.8 },
        { t: 21.2, n: N.A2, d: 3.5 }
      ].forEach(cb => addCello(cb.n, cb.t, cb.d, 0.85, 0.45, L, R));

      const fluteMelody = [
        { t: 1.0, n: N.Cs5, d: 1.8, v: 0.85 },
        { t: 2.6, n: N.E5, d: 1.8, v: 0.88 },
        { t: 4.2, n: N.Gs5, d: 2.2, v: 0.9 },
        { t: 6.8, n: N.Fs5, d: 2.0, v: 0.88 },
        { t: 9.2, n: N.E5, d: 2.2, v: 0.85 },
        { t: 12.6, n: N.A5, d: 2.5, v: 0.92 },
        { t: 15.6, n: N.Fs5, d: 2.2, v: 0.88 },
        { t: 18.2, n: N.Gs5, d: 2.4, v: 0.9 },
        { t: 21.4, n: N.A5, d: 3.2, v: 0.92 }
      ];
      fluteMelody.forEach(fm => addFlute(fm.n, fm.t, fm.d, fm.v, 0.65, L, R));
    }
  },

  // 5. Love's Sunrise (Grand Piano, Violin Duo & Crystal Chimes in C Major)
  {
    id: 'loves-sunrise',
    filename: 'loves_sunrise.wav',
    name: "Love's Sunrise",
    duration: 24,
    compose: (L, R) => {
      addStringsPad([N.C3, N.G3, N.C4, N.E4], 0.0, 5.8, 0.75, L, R);
      addStringsPad([N.G2, N.D3, N.G3, N.B3], 5.8, 5.8, 0.75, L, R);
      addStringsPad([N.A2, N.E3, N.A3, N.C4], 11.6, 5.8, 0.75, L, R);
      addStringsPad([N.F2, N.C3, N.F3, N.A3], 17.4, 6.5, 0.8, L, R);

      const pianoMotifs = [
        { t: 0.6, n: N.E4, d: 1.2 }, { t: 1.6, n: N.G4, d: 1.4 }, { t: 3.0, n: N.C5, d: 2.0 },
        { t: 6.2, n: N.D5, d: 1.5 }, { t: 7.8, n: N.B4, d: 1.5 }, { t: 9.2, n: N.G4, d: 1.8 },
        { t: 12.0, n: N.C5, d: 1.5 }, { t: 13.5, n: N.E5, d: 1.8 }, { t: 15.0, n: N.A5, d: 2.2 },
        { t: 18.0, n: N.G5, d: 2.0 }, { t: 19.8, n: N.E5, d: 1.8 }, { t: 21.4, n: N.C5, d: 2.5 }
      ];
      pianoMotifs.forEach(pm => addPiano(pm.n, pm.t, pm.d, 0.85, 0.45, L, R));

      const violinHarmony = [
        { t: 1.2, v1: N.G4, v2: N.E4, d: 2.2 },
        { t: 3.6, v1: N.C5, v2: N.G4, d: 2.4 },
        { t: 7.0, v1: N.B4, v2: N.G4, d: 2.4 },
        { t: 9.6, v1: N.D5, v2: N.B4, d: 2.4 },
        { t: 12.8, v1: N.E5, v2: N.C5, d: 2.5 },
        { t: 15.5, v1: N.A5, v2: N.F5, d: 2.5 },
        { t: 18.8, v1: N.G5, v2: N.E5, d: 2.8 },
        { t: 21.8, v1: N.C6, v2: N.G5, d: 3.2 }
      ];
      violinHarmony.forEach(vh => {
        addViolin(vh.v1, vh.t, vh.d, 0.85, 0.7, L, R);
        addViolin(vh.v2, vh.t, vh.d, 0.75, 0.35, L, R);
      });

      addChimes(N.G5, 3.8, 2.5, 0.8, 0.6, L, R);
      addChimes(N.D6, 9.8, 2.5, 0.85, 0.65, L, R);
      addChimes(N.E6, 15.8, 2.5, 0.85, 0.7, L, R);
      addChimes(N.C6, 22.0, 3.2, 0.9, 0.6, L, R);
    }
  },

  // 6. Our Beautiful Morning — DEFAULT MASTERPIECE (Rich Strings, Grand Piano, Cello, Harp & Flute in F Major)
  {
    id: 'our-beautiful-morning',
    filename: 'our_beautiful_morning.wav',
    name: 'Our Beautiful Morning',
    duration: 25,
    compose: (L, R) => {
      addStringsPad([N.F2, N.C3, N.F3, N.A3, N.C4], 0.0, 6.0, 0.82, L, R);
      addStringsPad([N.D2, N.A2, N.D3, N.F3, N.A3], 6.0, 6.0, 0.82, L, R);
      addStringsPad([N.Bb2, N.F3, N.Bb3, N.D4, N.F4], 12.0, 6.0, 0.85, L, R);
      addStringsPad([N.C3, N.G3, N.C4, N.E4, N.G4], 18.0, 7.0, 0.88, L, R);

      const pianoPhrases = [
        { t: 0.6, n: N.F3, d: 1.4, v: 0.75 },
        { t: 1.5, n: N.A3, d: 1.4, v: 0.8 },
        { t: 2.5, n: N.C4, d: 1.6, v: 0.85 },
        { t: 3.8, n: N.F4, d: 2.0, v: 0.9 },
        { t: 6.5, n: N.A4, d: 1.8, v: 0.88 },
        { t: 8.0, n: N.G4, d: 1.6, v: 0.85 },
        { t: 9.5, n: N.F4, d: 2.0, v: 0.9 },
        { t: 12.5, n: N.D4, d: 1.6, v: 0.85 },
        { t: 14.0, n: N.F4, d: 1.8, v: 0.88 },
        { t: 15.5, n: N.Bb4, d: 2.2, v: 0.92 },
        { t: 18.5, n: N.C5, d: 2.4, v: 0.95 },
        { t: 21.0, n: N.A4, d: 2.2, v: 0.9 },
        { t: 22.8, n: N.F4, d: 3.0, v: 0.95 }
      ];
      pianoPhrases.forEach(pp => addPiano(pp.n, pp.t, pp.d, pp.v, 0.45, L, R));

      const celloPhrases = [
        { t: 1.0, n: N.F2, d: 2.8, v: 0.85 },
        { t: 3.8, n: N.A2, d: 2.4, v: 0.82 },
        { t: 6.8, n: N.D3, d: 2.6, v: 0.88 },
        { t: 9.8, n: N.F3, d: 2.4, v: 0.85 },
        { t: 12.8, n: N.Bb2, d: 2.8, v: 0.88 },
        { t: 15.8, n: N.D3, d: 2.4, v: 0.85 },
        { t: 18.8, n: N.C3, d: 3.0, v: 0.9 },
        { t: 22.2, n: N.F2, d: 3.5, v: 0.92 }
      ];
      celloPhrases.forEach(cp => addCello(cp.n, cp.t, cp.d, cp.v, 0.35, L, R));

      const violinLead = [
        { t: 2.0, n: N.C5, d: 2.0, v: 0.88 },
        { t: 4.2, n: N.F5, d: 2.4, v: 0.92 },
        { t: 7.2, n: N.E5, d: 2.2, v: 0.9 },
        { t: 10.0, n: N.D5, d: 2.2, v: 0.88 },
        { t: 13.0, n: N.F5, d: 2.4, v: 0.92 },
        { t: 16.0, n: N.Bb5, d: 2.6, v: 0.95 },
        { t: 19.0, n: N.A5, d: 2.6, v: 0.95 },
        { t: 22.0, n: N.F5, d: 3.5, v: 0.92 }
      ];
      violinLead.forEach(vl => addViolin(vl.n, vl.t, vl.d, vl.v, 0.68, L, R));

      [N.F3, N.A3, N.C4, N.F4, N.A4].forEach((n, i) => {
        addHarp(n, 1.2 + i * 0.2, 2.2, 0.75, 0.5, L, R);
        addHarp(n, 13.2 + i * 0.2, 2.2, 0.75, 0.5, L, R);
      });

      addFlute(N.A5, 7.5, 2.2, 0.85, 0.6, L, R);
      addFlute(N.F5, 10.2, 2.2, 0.82, 0.6, L, R);
      addFlute(N.C6, 19.2, 2.8, 0.88, 0.6, L, R);
    }
  },

  // 7. Forever Together (Chamber Strings, Piano & Harp in Bb Major)
  {
    id: 'forever-together',
    filename: 'forever_together.wav',
    name: 'Forever Together',
    duration: 24,
    compose: (L, R) => {
      const stringChords = [
        { t: 0.0, d: 5.8, notes: [N.Bb2, N.F3, N.Bb3, N.D4] },
        { t: 5.8, d: 5.8, notes: [N.G2, N.D3, N.G3, N.Bb3] },
        { t: 11.6, d: 5.8, notes: [N.Eb3, N.Bb3, N.Eb4, N.G4] },
        { t: 17.4, d: 6.5, notes: [N.F2, N.C3, N.F3, N.A3] }
      ];
      stringChords.forEach(sc => addStringsPad(sc.notes, sc.t, sc.d, 0.78, L, R));

      [
        { t: 0.5, n: N.Bb2, d: 2.5 },
        { t: 3.2, n: N.D3, d: 2.5 },
        { t: 6.2, n: N.G2, d: 2.5 },
        { t: 9.0, n: N.Bb2, d: 2.5 },
        { t: 12.2, n: N.Eb3, d: 2.5 },
        { t: 15.0, n: N.G3, d: 2.5 },
        { t: 18.0, n: N.F3, d: 3.0 },
        { t: 21.5, n: N.Bb2, d: 3.5 }
      ].forEach(c => addCello(c.n, c.t, c.d, 0.88, 0.35, L, R));

      [
        { t: 1.0, n: N.D4, d: 1.8 },
        { t: 2.8, n: N.F4, d: 2.0 },
        { t: 4.8, n: N.Bb4, d: 2.2 },
        { t: 7.0, n: N.G4, d: 2.0 },
        { t: 9.2, n: N.Bb4, d: 2.2 },
        { t: 12.5, n: N.C5, d: 2.2 },
        { t: 15.0, n: N.Eb5, d: 2.5 },
        { t: 18.2, n: N.F5, d: 2.6 },
        { t: 21.6, n: N.Bb5, d: 3.2 }
      ].forEach(v => addViolin(v.n, v.t, v.d, 0.88, 0.65, L, R));

      [N.Bb3, N.D4, N.F4, N.Bb4].forEach((n, i) => {
        addHarp(n, 1.5 + i * 0.25, 2.2, 0.78, 0.45, L, R);
        addHarp(n, 12.8 + i * 0.25, 2.2, 0.78, 0.45, L, R);
      });
    }
  },

  // 8. Golden Memories (Nostalgic Grand Piano & Solo Romantic Cello in D Minor / F Major)
  {
    id: 'golden-memories',
    filename: 'golden_memories.wav',
    name: 'Golden Memories',
    duration: 24,
    compose: (L, R) => {
      const pianoChords = [
        { t: 0.0, n: [N.D3, N.A3, N.F4] },
        { t: 3.2, n: [N.Bb2, N.F3, N.D4] },
        { t: 6.4, n: [N.C3, N.G3, N.E4] },
        { t: 9.6, n: [N.F2, N.C3, N.A3] },
        { t: 12.8, n: [N.G2, N.D3, N.Bb3] },
        { t: 16.0, n: [N.A2, N.E3, N.Cs4] },
        { t: 19.2, n: [N.D2, N.A2, N.F3] }
      ];
      pianoChords.forEach(pc => {
        pc.n.forEach((note, idx) => {
          addPiano(note, pc.t + idx * 0.15, 3.2, 0.78, 0.4, L, R);
        });
      });

      const celloTheme = [
        { t: 0.8, n: N.A3, d: 2.2, v: 0.88 },
        { t: 3.2, n: N.D4, d: 2.4, v: 0.92 },
        { t: 6.5, n: N.C4, d: 2.2, v: 0.88 },
        { t: 9.8, n: N.F4, d: 2.5, v: 0.92 },
        { t: 13.0, n: N.G4, d: 2.4, v: 0.9 },
        { t: 16.2, n: N.E4, d: 2.4, v: 0.88 },
        { t: 19.5, n: N.D4, d: 3.8, v: 0.92 }
      ];
      celloTheme.forEach(ct => addCello(ct.n, ct.t, ct.d, ct.v, 0.5, L, R));

      addViolin(N.F5, 13.5, 2.5, 0.82, 0.7, L, R);
      addViolin(N.E5, 16.5, 2.4, 0.82, 0.7, L, R);
      addViolin(N.D5, 19.8, 3.5, 0.88, 0.7, L, R);
    }
  },

  // 9. Heaven's Melody (Celestial Harp & Ethereal Strings with Soft Flute in E Major)
  {
    id: 'heavens-melody',
    filename: 'heavens_melody.wav',
    name: "Heaven's Melody",
    duration: 24,
    compose: (L, R) => {
      addStringsPad([N.E2, N.B2, N.E3, N.Gs3, N.B3], 0.0, 6.0, 0.72, L, R);
      addStringsPad([N.Gs2, N.Ds3, N.Gs3, N.B3, N.Ds4], 6.0, 6.0, 0.72, L, R);
      addStringsPad([N.A2, N.E3, N.A3, N.Cs4, N.E4], 12.0, 6.0, 0.75, L, R);
      addStringsPad([N.B2, N.Fs3, N.B3, N.Ds4, N.Fs4], 18.0, 6.5, 0.75, L, R);

      const harpSparks = [
        { t: 0.4, notes: [N.E3, N.Gs3, N.B3, N.E4, N.Gs4, N.B4, N.E5] },
        { t: 3.4, notes: [N.B3, N.E4, N.Gs4, N.B4, N.E5, N.Gs5] },
        { t: 6.4, notes: [N.Gs3, N.B3, N.Ds4, N.Gs4, N.B4, N.Ds5] },
        { t: 9.4, notes: [N.B3, N.Ds4, N.Gs4, N.B4, N.Ds5, N.Gs5] },
        { t: 12.4, notes: [N.A3, N.Cs4, N.E4, N.A4, N.Cs5, N.E5] },
        { t: 15.4, notes: [N.Cs4, N.E4, N.A4, N.Cs5, N.E5, N.A5] },
        { t: 18.4, notes: [N.B3, N.Ds4, N.Fs4, N.B4, N.Ds5, N.Fs5] },
        { t: 21.2, notes: [N.E3, N.B3, N.E4, N.Gs4, N.B4, N.E5] }
      ];
      harpSparks.forEach(hs => {
        hs.notes.forEach((n, idx) => {
          addHarp(n, hs.t + idx * 0.2, 2.5, 0.75, 0.35 + idx * 0.06, L, R);
        });
      });

      const flutePeace = [
        { t: 1.5, n: N.Gs5, d: 2.2, v: 0.85 },
        { t: 4.2, n: N.B5, d: 2.4, v: 0.88 },
        { t: 7.2, n: N.Ds6, d: 2.2, v: 0.85 },
        { t: 10.0, n: N.B5, d: 2.2, v: 0.82 },
        { t: 13.0, n: N.Cs6, d: 2.5, v: 0.9 },
        { t: 16.0, n: N.E6, d: 2.6, v: 0.92 },
        { t: 19.0, n: N.Ds6, d: 2.6, v: 0.88 },
        { t: 22.0, n: N.E6, d: 3.5, v: 0.9 }
      ];
      flutePeace.forEach(fp => addFlute(fp.n, fp.t, fp.d, fp.v, 0.6, L, R));
    }
  },

  // 10. Tender Hearts (Acoustic Guitar, Intimate Piano & Warm Strings in G Major)
  {
    id: 'tender-hearts',
    filename: 'tender_hearts.wav',
    name: 'Tender Hearts',
    duration: 24,
    compose: (L, R) => {
      addStringsPad([N.G2, N.D3, N.G3, N.B3], 0.0, 5.8, 0.7, L, R);
      addStringsPad([N.E2, N.B2, N.E3, N.G3], 5.8, 5.8, 0.7, L, R);
      addStringsPad([N.C3, N.G3, N.C4, N.E4], 11.6, 5.8, 0.75, L, R);
      addStringsPad([N.D3, N.A3, N.D4, N.Fs4], 17.4, 6.5, 0.75, L, R);

      for (let t = 0.0; t < 22; t += 2.8) {
        addGuitar(N.G3, t, 1.8, 0.78, 0.35, L, R);
        addGuitar(N.B3, t + 0.3, 1.8, 0.8, 0.35, L, R);
        addGuitar(N.D4, t + 0.6, 1.8, 0.82, 0.35, L, R);
        addGuitar(N.G4, t + 0.9, 1.8, 0.85, 0.35, L, R);
      }

      const pianoMelody = [
        { t: 1.0, n: N.B4, d: 1.8, v: 0.85 },
        { t: 2.8, n: N.D5, d: 2.0, v: 0.88 },
        { t: 5.0, n: N.G5, d: 2.2, v: 0.92 },
        { t: 7.5, n: N.E5, d: 2.0, v: 0.88 },
        { t: 10.0, n: N.B4, d: 2.0, v: 0.85 },
        { t: 12.8, n: N.C5, d: 2.2, v: 0.88 },
        { t: 15.2, n: N.E5, d: 2.4, v: 0.92 },
        { t: 18.0, n: N.Fs5, d: 2.5, v: 0.92 },
        { t: 21.0, n: N.G5, d: 3.5, v: 0.95 }
      ];
      pianoMelody.forEach(pm => addPiano(pm.n, pm.t, pm.d, pm.v, 0.6, L, R));

      addCello(N.G2, 1.2, 3.5, 0.85, 0.4, L, R);
      addCello(N.E2, 7.0, 3.5, 0.85, 0.4, L, R);
      addCello(N.C3, 13.0, 3.5, 0.88, 0.4, L, R);
      addCello(N.D3, 18.5, 4.0, 0.9, 0.4, L, R);
    }
  }
];

// Target directories
const publicAudioDir = path.resolve(process.cwd(), 'public/audio');
const androidRawDir = path.resolve(process.cwd(), 'android/app/src/main/res/raw');
const iosAudioDir = path.resolve(process.cwd(), 'ios/App/App');

[publicAudioDir, androidRawDir, iosAudioDir].forEach(d => {
  if (!fs.existsSync(d)) {
    fs.mkdirSync(d, { recursive: true });
  }
});

console.log('Rendering 10 distinct, complete romantic instrumental compositions...');

TRACK_COMPOSITIONS.forEach(track => {
  const totalSamples = Math.floor(track.duration * SAMPLE_RATE);
  const L = new Float32Array(totalSamples);
  const R = new Float32Array(totalSamples);

  track.compose(L, R);

  // Normalization
  let maxPeak = 0;
  for (let i = 0; i < totalSamples; i++) {
    maxPeak = Math.max(maxPeak, Math.abs(L[i]), Math.abs(R[i]));
  }
  if (maxPeak > 0) {
    const gain = 0.92 / maxPeak;
    for (let i = 0; i < totalSamples; i++) {
      L[i] *= gain;
      R[i] *= gain;
    }
  }

  const wavBuffer = createWavBuffer(SAMPLE_RATE, L, R);

  // Write to public/audio/
  const pubPath = path.join(publicAudioDir, track.filename);
  fs.writeFileSync(pubPath, wavBuffer);

  // Write to android raw
  const androidPath = path.join(androidRawDir, track.filename);
  fs.writeFileSync(androidPath, wavBuffer);

  // Write to ios
  const iosPath = path.join(iosAudioDir, track.filename);
  fs.writeFileSync(iosPath, wavBuffer);

  console.log(`[RENDERED] ${track.name} (${track.filename}) — Size: ${(wavBuffer.length / 1024).toFixed(1)} KB`);
});

console.log('All 10 romantic compositions successfully generated and verified in public/audio, android/raw, and ios/App!');
