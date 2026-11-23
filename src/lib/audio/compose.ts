// Echo's composer: writes an original little tune for each story (chords, bass, melody, light drums)
// straight to a WAV file. No samples, no downloads, no copyright worries.
import type { MusicMood, Sfx } from "../story";
import { writeWav } from "./wav";

const SR = 32000;

type Wave = "sine" | "triangle" | "square" | "saw";

type MoodSpec = {
  bpm: number;
  root: number; // MIDI note of the key's root
  minor: boolean;
  progression: number[]; // scale degrees (0 = I)
  pad: Wave;
  lead: Wave;
  bass: Wave;
  drums: "none" | "soft" | "bouncy" | "driving" | "epic";
  notesPerBeat: number; // melody density
  padLevel: number;
  leadLevel: number;
  brightness: number; // 0..1 low-pass amount
};

const MOODS: Record<MusicMood, MoodSpec> = {
  playful: { bpm: 118, root: 60, minor: false, progression: [0, 4, 5, 3], pad: "triangle", lead: "square", bass: "triangle", drums: "bouncy", notesPerBeat: 2, padLevel: 0.1, leadLevel: 0.07, brightness: 0.55 },
  tender: { bpm: 72, root: 65, minor: false, progression: [0, 5, 3, 4], pad: "sine", lead: "sine", bass: "sine", drums: "soft", notesPerBeat: 1, padLevel: 0.12, leadLevel: 0.1, brightness: 0.3 },
  mystery: { bpm: 84, root: 62, minor: true, progression: [0, 5, 2, 6], pad: "triangle", lead: "triangle", bass: "sine", drums: "soft", notesPerBeat: 1, padLevel: 0.11, leadLevel: 0.08, brightness: 0.35 },
  adventure: { bpm: 126, root: 67, minor: false, progression: [0, 3, 5, 4], pad: "saw", lead: "square", bass: "saw", drums: "driving", notesPerBeat: 2, padLevel: 0.07, leadLevel: 0.06, brightness: 0.5 },
  dreamy: { bpm: 78, root: 63, minor: false, progression: [0, 2, 5, 3], pad: "sine", lead: "triangle", bass: "sine", drums: "none", notesPerBeat: 1, padLevel: 0.13, leadLevel: 0.08, brightness: 0.25 },
  curious: { bpm: 100, root: 62, minor: true, progression: [0, 3, 5, 4], pad: "sine", lead: "triangle", bass: "sine", drums: "soft", notesPerBeat: 2, padLevel: 0.07, leadLevel: 0.07, brightness: 0.3 },
  epic: { bpm: 90, root: 57, minor: true, progression: [0, 5, 2, 6], pad: "saw", lead: "saw", bass: "saw", drums: "epic", notesPerBeat: 1, padLevel: 0.08, leadLevel: 0.06, brightness: 0.45 },
};

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const MINOR = [0, 2, 3, 5, 7, 8, 10];

function mtof(m: number) {
  return 440 * Math.pow(2, (m - 69) / 12);
}

function osc(w: Wave, phase: number): number {
  const p = phase - Math.floor(phase);
  switch (w) {
    case "sine":
      return Math.sin(2 * Math.PI * p);
    case "triangle":
      return 4 * Math.abs(p - 0.5) - 1;
    case "square":
      return p < 0.5 ? 0.8 : -0.8;
    case "saw":
      return 2 * p - 1;
  }
}

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

function hashText(t: string): number {
  let h = 2166136261;
  for (const c of t) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

class Mixer {
  buf: Float32Array;
  constructor(public seconds: number) {
    this.buf = new Float32Array(Math.ceil(seconds * SR) + SR);
  }
  /** Add a note with a simple attack/decay/release envelope and optional low-pass + detune. */
  note(start: number, dur: number, freq: number, wave: Wave, level: number, opts: { attack?: number; release?: number; lp?: number; detune?: number; vibrato?: number } = {}) {
    const attack = opts.attack ?? 0.01;
    const release = opts.release ?? 0.08;
    const s0 = Math.floor(start * SR);
    const n = Math.floor((dur + release) * SR);
    const lp = opts.lp ?? 1;
    const det = opts.detune ?? 0;
    let y = 0;
    let ph1 = 0;
    let ph2 = 0.3;
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      const idx = s0 + i;
      if (idx >= this.buf.length) break;
      let env = t < attack ? t / attack : 1;
      if (t > dur) env *= Math.max(0, 1 - (t - dur) / release);
      const vib = opts.vibrato ? 1 + 0.004 * Math.sin(2 * Math.PI * 5 * t) : 1;
      ph1 += (freq * vib) / SR;
      ph2 += (freq * vib * (1 + det)) / SR;
      let x = osc(wave, ph1);
      if (det) x = 0.5 * (x + osc(wave, ph2));
      y += lp * (x - y); // one-pole low-pass
      this.buf[idx] += y * env * level;
    }
  }
  noise(start: number, dur: number, level: number, lp: number, seed: number) {
    const r = rng(seed);
    const s0 = Math.floor(start * SR);
    const n = Math.floor(dur * SR);
    let y = 0;
    for (let i = 0; i < n; i++) {
      const idx = s0 + i;
      if (idx >= this.buf.length) break;
      const env = Math.pow(1 - i / n, 3);
      y += lp * (r() * 2 - 1 - y);
      this.buf[idx] += y * env * level;
    }
  }
  kick(start: number, level: number, low = false) {
    const s0 = Math.floor(start * SR);
    const n = Math.floor((low ? 0.6 : 0.3) * SR);
    let ph = 0;
    for (let i = 0; i < n; i++) {
      const idx = s0 + i;
      if (idx >= this.buf.length) break;
      const t = i / SR;
      const f = (low ? 45 : 55) + (low ? 90 : 120) * Math.exp(-t * 30);
      ph += f / SR;
      const env = Math.exp(-t * (low ? 6 : 12));
      this.buf[idx] += Math.sin(2 * Math.PI * ph) * env * level;
    }
  }
}

export function composeMusic(opts: { mood: MusicMood; seconds: number; seed: string; outFile: string }) {
  const spec = MOODS[opts.mood];
  const r = rng(hashText(opts.seed + opts.mood));
  const scale = spec.minor ? MINOR : MAJOR;
  const beat = 60 / spec.bpm;
  const bar = beat * 4;
  const total = opts.seconds + 1;
  const m = new Mixer(total);
  const lpPad = 0.05 + spec.brightness * 0.25;

  const degreeNote = (deg: number, octave = 0) => {
    const d = ((deg % 7) + 7) % 7;
    const o = Math.floor(deg / 7);
    return spec.root + scale[d] + 12 * (o + octave);
  };

  // A 4-bar melody motif that repeats with small changes, so it sounds like a tune.
  const motif: { step: number; deg: number; len: number }[] = [];
  const steps = 4 * spec.notesPerBeat;
  for (let b = 0; b < 4; b++) {
    for (let s = 0; s < steps; s++) {
      if (r() < (spec.notesPerBeat > 1 ? 0.55 : 0.7)) {
        const chordRoot = spec.progression[b % spec.progression.length];
        const choices = [chordRoot, chordRoot + 2, chordRoot + 4, chordRoot + 7];
        motif.push({ step: b * steps + s, deg: choices[Math.floor(r() * choices.length)], len: r() < 0.3 ? 2 : 1 });
      }
    }
  }

  const bars = Math.ceil(total / bar);
  for (let i = 0; i < bars; i++) {
    const t0 = i * bar;
    const deg = spec.progression[i % spec.progression.length];
    const section = Math.floor(i / 4) % 2; // A / B sections
    // Pad chord
    for (const k of [0, 2, 4]) {
      m.note(t0, bar * 0.98, mtof(degreeNote(deg + k, 0)), spec.pad, spec.padLevel, {
        attack: 0.25,
        release: 0.4,
        lp: lpPad,
        detune: spec.pad === "saw" ? 0.006 : 0.003,
      });
    }
    // Bass
    const bassPattern = spec.drums === "driving" || spec.drums === "bouncy" ? [0, 1, 2, 3] : spec.drums === "epic" ? [0, 2.5, 3] : [0, 2];
    for (const b of bassPattern) {
      m.note(t0 + b * beat, beat * 0.9, mtof(degreeNote(deg, -2)), spec.bass, 0.16, { lp: 0.08, release: 0.05 });
    }
    // Melody (skip the very first 2 bars so the opening breathes)
    if (i >= 2) {
      const stepLen = beat / spec.notesPerBeat;
      for (const n of motif) {
        if (Math.floor(n.step / steps) !== i % 4) continue;
        const local = n.step % steps;
        const variation = section === 1 && r() < 0.3 ? 1 : 0;
        m.note(t0 + local * stepLen, stepLen * n.len * 0.85, mtof(degreeNote(n.deg + variation, 1)), spec.lead, spec.leadLevel, {
          lp: 0.15 + spec.brightness * 0.5,
          release: 0.12,
          vibrato: spec.lead !== "square" ? 1 : 0,
        });
      }
    }
    // Drums
    for (let bt = 0; bt < 4; bt++) {
      const t = t0 + bt * beat;
      switch (spec.drums) {
        case "bouncy":
          if (bt % 2 === 0) m.kick(t, 0.35);
          else m.noise(t, 0.12, 0.12, 0.6, i * 7 + bt);
          m.noise(t + beat / 2, 0.04, 0.05, 0.9, i * 13 + bt);
          break;
        case "driving":
          m.kick(t, 0.4);
          if (bt % 2 === 1) m.noise(t, 0.15, 0.15, 0.5, i * 7 + bt);
          m.noise(t + beat / 2, 0.04, 0.06, 0.95, i * 13 + bt);
          break;
        case "soft":
          if (bt === 0) m.kick(t, 0.18);
          if (bt === 2) m.noise(t, 0.08, 0.04, 0.4, i * 7 + bt);
          break;
        case "epic":
          if (bt === 0 || (bt === 2 && i % 2 === 1)) m.kick(t, 0.55, true);
          if (bt === 3) m.kick(t + beat / 2, 0.3, true);
          if (bt === 2) m.noise(t, 0.3, 0.1, 0.25, i * 7 + bt);
          break;
        case "none":
          break;
      }
    }
  }

  // Light echo to glue it together, then fades and a soft limiter.
  const d = Math.floor(beat * 0.75 * SR);
  for (let i = d; i < m.buf.length; i++) m.buf[i] += m.buf[i - d] * 0.22;
  const fadeIn = Math.floor(1.2 * SR);
  const end = Math.floor(opts.seconds * SR);
  const fadeOut = Math.floor(2 * SR);
  const out = new Float32Array(end);
  for (let i = 0; i < end; i++) {
    let g = 1;
    if (i < fadeIn) g = i / fadeIn;
    if (i > end - fadeOut) g = Math.max(0, (end - i) / fadeOut);
    out[i] = Math.tanh(m.buf[i] * 1.4) * 0.8 * g;
  }
  writeWav(opts.outFile, out, SR, 1);
}

/** Echo's sound effects for Twist Tale payoffs, all synthesized: rumble, snap, crash, whoosh, ding. */
export function composeSfx(opts: { events: { time: number; kind: Sfx }[]; seconds: number; outFile: string }) {
  const m = new Mixer(opts.seconds);
  opts.events.forEach((e, i) => {
    switch (e.kind) {
      case "rumble":
        m.noise(e.time, 1.8, 0.5, 0.02, 100 + i);
        m.note(e.time, 1.4, 38, "sine", 0.4, { attack: 0.2, release: 0.4 });
        break;
      case "snap":
        m.noise(e.time, 0.09, 0.7, 0.9, 200 + i);
        m.kick(e.time, 0.25);
        break;
      case "crash":
        m.kick(e.time, 0.7, true);
        m.noise(e.time, 1.2, 0.55, 0.3, 300 + i);
        m.noise(e.time + 0.05, 0.6, 0.3, 0.8, 400 + i);
        break;
      case "whoosh":
        for (let k = 0; k < 6; k++) m.noise(e.time + k * 0.06, 0.25, 0.08 + k * 0.03, 0.05 + k * 0.05, 500 + i * 10 + k);
        break;
      case "ding":
        m.note(e.time, 0.05, 1320, "sine", 0.25, { release: 1.2 });
        m.note(e.time, 0.05, 2640, "sine", 0.1, { release: 0.8 });
        break;
      case "none":
        break;
    }
  });
  const out = new Float32Array(Math.floor(opts.seconds * SR));
  for (let i = 0; i < out.length; i++) out[i] = Math.tanh(m.buf[i] * 1.2) * 0.9;
  writeWav(opts.outFile, out, SR, 1);
}
