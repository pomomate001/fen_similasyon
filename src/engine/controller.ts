import { gsap } from 'gsap';
import { NarrationAudio } from './audio';
import { lineDuration, type NarrationLine, type NarrationManifest } from './narration';
import { setSfxMuted } from './sfx';

/**
 * Simülasyon oynatıcısının durum yöneticisi (React'tan bağımsız).
 *
 * Bütün zamanlamalar GSAP'in küresel zaman çizelgesi üzerinden yürür; bu sayede
 * "Duraklat" tek noktadan animasyonları, beklemeleri ve anlatım zamanlayıcılarını durdurur.
 *
 * phase:
 *   running  — sahne betiği çalışıyor (Devam Et pasif)
 *   waiting  — betik öğretmenin "Devam Et"ine basmasını bekliyor
 *   complete — sahne bitti; "Devam Et" sonraki sahneye geçer
 */
export type Phase = 'running' | 'waiting' | 'complete';

export interface PlayerSnapshot {
  sceneIndex: number;
  /** Aynı sahneyi baştan oynatmak için artırılır (bileşen yeniden kurulur) */
  sceneKey: number;
  paused: boolean;
  muted: boolean;
  phase: Phase;
  continueLabel: string | null;
  subtitle: { id: string; text: string } | null;
  narrating: boolean;
  replaying: boolean;
  finished: boolean;
}

export interface ControllerOptions {
  sceneCount: number;
  manifest: NarrationManifest;
  audio: NarrationAudio;
  startIndex?: number;
  muted?: boolean;
  /** Test/önizleme için zaman ölçeği (1 = normal) */
  timeScale?: number;
  /** Anlatımlar arası kısa sessizlik (sn) */
  gap?: number;
  /** Art arda gezinme tıklamalarına karşı kilit süresi (ms) */
  navLockMs?: number;
}

export class PlayerController {
  private state: PlayerSnapshot;
  private listeners = new Set<() => void>();
  private continueResolver: (() => void) | null = null;
  /** Son "Devam Et"ten bu yana okunan anlatımlar — "Anlatımı Tekrar Dinle" bunları oynatır */
  private group: string[] = [];
  private lastGroup: string[] = [];
  private narrationToken = 0;
  private replayToken = 0;
  private replayCall: gsap.core.Tween | null = null;
  private speakCall: gsap.core.Tween | null = null;
  private lastNav = -Infinity;
  readonly manifest: NarrationManifest;
  readonly audio: NarrationAudio;
  readonly sceneCount: number;
  readonly gap: number;
  private navLockMs: number;

  constructor(opts: ControllerOptions) {
    this.manifest = opts.manifest;
    this.audio = opts.audio;
    this.sceneCount = opts.sceneCount;
    this.gap = opts.gap ?? 0.35;
    this.navLockMs = opts.navLockMs ?? 350;
    const muted = opts.muted ?? false;
    this.audio.setMuted(muted);
    setSfxMuted(muted);
    gsap.globalTimeline.timeScale(opts.timeScale ?? 1);
    // Test/önizleme modunda (hiz≠1) kare atlamaları telafi edilmez: arka planda
    // yavaşlatılan sekmelerde de zaman gerçek hızda ilerler.
    if (opts.timeScale && opts.timeScale !== 1) gsap.ticker.lagSmoothing(0);
    gsap.globalTimeline.resume();
    this.state = {
      sceneIndex: clamp(opts.startIndex ?? 0, 0, opts.sceneCount - 1),
      sceneKey: 0,
      paused: false,
      muted,
      phase: 'running',
      continueLabel: null,
      subtitle: null,
      narrating: false,
      replaying: false,
      finished: false,
    };
  }

  // ---- abonelik -------------------------------------------------------------
  getSnapshot = (): PlayerSnapshot => this.state;

  subscribe = (l: () => void): (() => void) => {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  };

  private set(patch: Partial<PlayerSnapshot>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l());
  }

  line(id: string): NarrationLine | undefined {
    return this.manifest[id];
  }

  // ---- gezinme --------------------------------------------------------------
  private navAllowed(force?: boolean): boolean {
    const now = Date.now();
    if (!force && now - this.lastNav < this.navLockMs) return false;
    this.lastNav = now;
    return true;
  }

  goTo(index: number, force = false) {
    const i = clamp(index, 0, this.sceneCount - 1);
    if (!this.navAllowed(force)) return;
    this.resetTransient();
    this.set({
      sceneIndex: i,
      sceneKey: this.state.sceneKey + 1,
      phase: 'running',
      continueLabel: null,
      subtitle: null,
      narrating: false,
      replaying: false,
      finished: false,
    });
    if (this.state.paused) this.setPaused(false);
  }

  next() {
    if (this.state.sceneIndex < this.sceneCount - 1) this.goTo(this.state.sceneIndex + 1);
    else if (this.state.phase === 'complete') this.set({ finished: true });
  }

  prev() {
    if (this.state.sceneIndex > 0) this.goTo(this.state.sceneIndex - 1);
    else this.restartScene();
  }

  restartScene() {
    this.goTo(this.state.sceneIndex);
  }

  restartAll() {
    this.goTo(0, true);
  }

  /** "Devam Et": bekleyen betiği sürdürür ya da tamamlanan sahneden sonrakine geçer. */
  pressContinue() {
    if (this.state.paused) return;
    if (this.continueResolver) {
      if (!this.navAllowed()) return;
      this.cancelReplay();
      const r = this.continueResolver;
      this.continueResolver = null;
      this.group = [];
      this.set({ phase: 'running', continueLabel: null });
      r();
      return;
    }
    if (this.state.phase === 'complete') this.next();
  }

  // ---- duraklatma / ses -----------------------------------------------------
  setPaused(p: boolean) {
    if (p === this.state.paused) return;
    if (p) {
      gsap.globalTimeline.pause();
      this.audio.pause();
    } else {
      gsap.globalTimeline.resume();
      this.audio.resume();
    }
    this.set({ paused: p });
  }

  togglePause() {
    this.setPaused(!this.state.paused);
  }

  setMuted(m: boolean) {
    this.audio.setMuted(m);
    setSfxMuted(m);
    this.set({ muted: m });
  }

  toggleMuted() {
    this.setMuted(!this.state.muted);
  }

  // ---- sahne betiği arayüzü -------------------------------------------------
  sceneStarted() {
    this.group = [];
    this.lastGroup = [];
    this.continueResolver = null;
    this.set({ phase: 'running', continueLabel: null });
  }

  /** Sahne bileşeni kaldırılırken: ses, tekrar ve bekleyen durumlar temizlenir. */
  sceneEnded() {
    this.resetTransient();
  }

  private resetTransient() {
    this.cancelReplay();
    this.speakCall?.kill();
    this.speakCall = null;
    this.audio.stop();
    this.continueResolver = null;
    this.narrationToken++;
  }

  waitContinue(label: string | null = null): Promise<void> {
    this.lastGroup = this.group.slice();
    this.set({ phase: 'waiting', continueLabel: label });
    return new Promise<void>((resolve) => {
      this.continueResolver = resolve;
    });
  }

  /** Etkileşim beklerken de tekrar dinlenebilsin diye grubu dondurur. */
  markInteraction() {
    this.lastGroup = this.group.slice();
  }

  complete(label: string | null = null) {
    this.lastGroup = this.group.slice();
    this.set({ phase: 'complete', continueLabel: label });
  }

  /** Anlatımı başlatır; dönen belirteç endNarration'a verilir. */
  startNarration(id: string, record = true): number {
    this.cancelReplay();
    this.speakCall?.kill();
    this.speakCall = null;
    const line = this.manifest[id];
    const token = ++this.narrationToken;
    if (!line) return token;
    if (record) this.group.push(id);
    this.audio.play(line.file);
    this.set({ subtitle: { id, text: line.text }, narrating: true });
    return token;
  }

  endNarration(token: number) {
    if (token !== this.narrationToken) return;
    this.set({ narrating: false });
  }

  /** Geri bildirim gibi, betiğin beklemediği anlık anlatım. */
  speak(id: string) {
    const token = this.startNarration(id, false);
    const line = this.manifest[id];
    if (!line) return;
    this.speakCall = gsap.delayedCall(lineDuration(line), () => this.endNarration(token));
  }

  /** Altyazıyı sesli anlatım olmadan göstermek için (ör. dinamik sayısal geri bildirim). */
  showCaption(text: string) {
    this.narrationToken++;
    this.set({ subtitle: { id: 'caption', text }, narrating: false });
  }

  // ---- anlatımı tekrar dinle -----------------------------------------------
  canReplay(): boolean {
    return !this.state.narrating && (this.lastGroup.length > 0 || this.group.length > 0 || !!this.state.subtitle);
  }

  replay() {
    if (this.state.paused || this.state.narrating) return;
    const ids = (this.lastGroup.length ? this.lastGroup : this.group).filter((id) => this.manifest[id]);
    if (ids.length === 0 && this.state.subtitle && this.manifest[this.state.subtitle.id]) {
      ids.push(this.state.subtitle.id);
    }
    if (ids.length === 0) return;
    this.cancelReplay();
    const token = ++this.replayToken;
    this.set({ replaying: true });
    const playAt = (i: number) => {
      if (token !== this.replayToken) return;
      if (i >= ids.length) {
        this.set({ replaying: false, narrating: false });
        return;
      }
      const line = this.manifest[ids[i]];
      this.audio.play(line.file);
      this.set({ subtitle: { id: ids[i], text: line.text }, narrating: true });
      this.replayCall = gsap.delayedCall(lineDuration(line) + this.gap, () => playAt(i + 1));
    };
    playAt(0);
  }

  cancelReplay() {
    if (!this.state.replaying && !this.replayCall) return;
    this.replayToken++;
    this.replayCall?.kill();
    this.replayCall = null;
    this.audio.stop();
    this.set({ replaying: false, narrating: false });
  }

  dispose() {
    this.resetTransient();
    gsap.globalTimeline.resume();
    gsap.globalTimeline.timeScale(1);
    this.listeners.clear();
  }
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}
