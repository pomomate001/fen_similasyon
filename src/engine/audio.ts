/**
 * Tek kanallı anlatım oynatıcısı.
 * - Aynı anda yalnızca bir anlatım çalar; yenisi başlarken eskisi durdurulur.
 * - Dosya eksik/bozuksa veya tarayıcı oynatmayı engellerse sessizce devam eder
 *   (zamanlama manifestteki süreyle yürür, altyazı görünmeye devam eder).
 */
export interface AudioLike {
  play(): Promise<void> | void;
  pause(): void;
  muted: boolean;
  currentTime: number;
  src: string;
  onerror: ((this: GlobalEventHandlers, ev: Event | string) => unknown) | null;
}

export type AudioFactory = (url: string) => AudioLike;

const defaultFactory: AudioFactory = (url) => {
  const a = new Audio(url);
  a.preload = 'auto';
  return a;
};

export class NarrationAudio {
  private current: AudioLike | null = null;
  private muted = false;
  private paused = false;
  /** Son çalınamayan dosyalar (testler ve tanılama için) */
  readonly failures: string[] = [];

  constructor(
    private baseUrl: string,
    private factory: AudioFactory = defaultFactory,
  ) {}

  setBase(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  play(file: string | undefined) {
    this.stop();
    if (!file) return;
    const url = this.baseUrl + file;
    let a: AudioLike;
    try {
      a = this.factory(url);
    } catch {
      this.failures.push(file);
      return;
    }
    a.muted = this.muted;
    a.onerror = () => {
      this.failures.push(file);
    };
    this.current = a;
    if (this.paused) return; // duraklatılmışken başlatılırsa sürdürülünce çalar
    this.tryPlay(a, file);
  }

  private tryPlay(a: AudioLike, file: string) {
    try {
      const r = a.play();
      if (r && typeof (r as Promise<void>).catch === 'function') {
        (r as Promise<void>).catch(() => {
          // Otomatik oynatma engeli veya eksik dosya: sessiz devam.
          if (!this.failures.includes(file)) this.failures.push(file);
        });
      }
    } catch {
      this.failures.push(file);
    }
  }

  stop() {
    if (this.current) {
      try {
        this.current.pause();
        this.current.currentTime = 0;
      } catch {
        /* yok say */
      }
      this.current.onerror = null;
      this.current = null;
    }
  }

  pause() {
    this.paused = true;
    try {
      this.current?.pause();
    } catch {
      /* yok say */
    }
  }

  resume() {
    this.paused = false;
    if (this.current) this.tryPlay(this.current, this.current.src);
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.current) this.current.muted = m;
  }

  get isPlaying() {
    return this.current !== null;
  }
}
