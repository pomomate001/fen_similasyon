/**
 * Küçük, dosyasız ses efektleri (Web Audio ile üretilir).
 * Başarı: yumuşak iki notalı çan. Yerleştirme: kısa "tık". Tekrar dene: alçak, yumuşak ton.
 */
let ctx: AudioContext | null = null;
let muted = false;

export function setSfxMuted(m: boolean) {
  muted = m;
}

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) {
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') void ctx.resume().catch(() => undefined);
  return ctx;
}

function tone(freq: number, start: number, dur: number, gain = 0.12, type: OscillatorType = 'sine') {
  const c = ac();
  if (!c || muted) return;
  const t0 = c.currentTime + start;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(c.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

let noiseBuf: AudioBuffer | null = null;
function noise(c: AudioContext): AudioBuffer {
  if (!noiseBuf || noiseBuf.sampleRate !== c.sampleRate) {
    noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuf;
}

/** Filtrelenmiş gürültü patlaması (kopma, hışırtı, çarpma dokusu için) */
function noiseBurst(opts: {
  start?: number;
  dur: number;
  gain: number;
  type: BiquadFilterType;
  freq: number;
  freqEnd?: number;
  q?: number;
  attack?: number;
}) {
  const c = ac();
  if (!c || muted) return;
  const t0 = c.currentTime + (opts.start ?? 0);
  const src = c.createBufferSource();
  src.buffer = noise(c);
  src.loop = true;
  const f = c.createBiquadFilter();
  f.type = opts.type;
  f.frequency.setValueAtTime(opts.freq, t0);
  if (opts.freqEnd) f.frequency.exponentialRampToValueAtTime(opts.freqEnd, t0 + opts.dur);
  f.Q.value = opts.q ?? 1;
  const g = c.createGain();
  const a = opts.attack ?? 0.005;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(opts.gain, t0 + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur);
  src.connect(f).connect(g).connect(c.destination);
  src.start(t0);
  src.stop(t0 + opts.dur + 0.05);
}

/** Frekansı kayan kısa ton (çarpmanın "tok" gövdesi için) */
function drop(freqStart: number, freqEnd: number, dur: number, gain: number, start = 0) {
  const c = ac();
  if (!c || muted) return;
  const t0 = c.currentTime + start;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(freqStart, t0);
  o.frequency.exponentialRampToValueAtTime(freqEnd, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(c.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

export const sfx = {
  /** Elma sapının kopması: kısa, keskin "çıt" */
  snap() {
    noiseBurst({ dur: 0.06, gain: 0.35, type: 'bandpass', freq: 2600, q: 2.5 });
    noiseBurst({ start: 0.02, dur: 0.05, gain: 0.18, type: 'highpass', freq: 4000 });
    tone(1400, 0, 0.04, 0.05, 'triangle');
  },
  /** Düşerken havayı yaran hafif hışırtı; giderek güçlenir (cisim hızlanıyor) */
  whoosh(dur: number) {
    noiseBurst({ dur, gain: 0.07, type: 'bandpass', freq: 500, freqEnd: 1800, q: 0.8, attack: dur * 0.85 });
  },
  /** Elmanın yere çarpması: boğuk "tok" + çimen hışırtısı */
  thud() {
    drop(150, 55, 0.28, 0.5);
    noiseBurst({ dur: 0.18, gain: 0.22, type: 'lowpass', freq: 900, freqEnd: 200 });
    noiseBurst({ start: 0.02, dur: 0.22, gain: 0.05, type: 'highpass', freq: 3000 });
  },
  success() {
    tone(784, 0, 0.35, 0.1);
    tone(1175, 0.12, 0.5, 0.09);
  },
  place() {
    tone(660, 0, 0.09, 0.06, 'triangle');
  },
  retry() {
    tone(330, 0, 0.22, 0.06, 'triangle');
  },
  tap() {
    tone(520, 0, 0.06, 0.04, 'triangle');
  },
  /** Telefon bildirimi */
  ding() {
    tone(1318, 0, 0.22, 0.05);
    tone(1760, 0.1, 0.3, 0.04);
  },
  /** Yumuşak ayak sesi */
  step() {
    noiseBurst({ dur: 0.06, gain: 0.05, type: 'lowpass', freq: 520 });
  },
  /** Çanta kapağının fırlaması */
  pop() {
    drop(520, 170, 0.09, 0.18);
    noiseBurst({ dur: 0.05, gain: 0.14, type: 'bandpass', freq: 1800, q: 1.5 });
  },
  /** Balonun şişmesi: yükselen hışırtı */
  inflate() {
    noiseBurst({ dur: 0.36, gain: 0.05, type: 'bandpass', freq: 800, freqEnd: 2600, q: 1.2, attack: 0.26 });
  },
  /** Balonun bırakılıp uçması */
  release() {
    noiseBurst({ dur: 0.28, gain: 0.05, type: 'highpass', freq: 1800, freqEnd: 5000 });
    tone(880, 0, 0.14, 0.03, 'triangle');
  },
  /** Kullanıcı hareketiyle ses bağlamını açar (tarayıcı otomatik oynatma kuralı). */
  unlock() {
    ac();
  },
};
