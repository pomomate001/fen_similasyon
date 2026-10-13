import { gsap } from 'gsap';
import type { PlayerController } from './controller';
import { lineDuration } from './narration';
import { guard, type Signal } from './signal';

/**
 * Sahne betiği arayüzü. Bir sahne, sırayla "await" edilen adımlardan oluşur:
 *
 *   await s.narrate('s1.a');          // anlatım + altyazı (sesin süresi kadar)
 *   await s.tween(el, {opacity: 1});  // animasyon
 *   await s.waitContinue();           // öğretmen "Devam Et" diyene kadar bekle
 *   const v = await s.waitFor(sig);   // öğrencinin etkileşimini bekle
 *   s.complete();                     // sahne bitti
 *
 * Sahne değiştiğinde AbortSignal tetiklenir: bekleyen tüm adımlar CancelError ile
 * sonlanır, GSAP bağlamı geri alınır, ses durdurulur. Böylece eski sahneden
 * hiçbir zamanlayıcı veya ses yeni sahneye sızmaz.
 */
export interface ScriptApi {
  readonly signal: AbortSignal;
  narrate(id: string, opts?: NarrateOptions): Promise<void>;
  /**
   * Yönerge anlatımını başlatır ama beklemez: öğrenci anlatım bitmeden etkileşime
   * başlayabilir. Yeni bir anlatım (ör. geri bildirim) başlarsa bu anlatım kesilir.
   */
  narrateBg(id: string): void;
  /** Kayda geçmeyen (tekrar dinlemede çalınmayan) kısa geri bildirim anlatımı */
  say(id: string, opts?: NarrateOptions): Promise<void>;
  wait(seconds: number): Promise<void>;
  tween(targets: gsap.TweenTarget, vars: gsap.TweenVars): Promise<void>;
  fromTo(targets: gsap.TweenTarget, from: gsap.TweenVars, to: gsap.TweenVars): Promise<void>;
  /** Bir sayıyı canlandırır; her karede onUpdate çağrılır (React durumu için). */
  animate(
    from: number,
    to: number,
    duration: number,
    onUpdate: (v: number) => void,
    ease?: string,
  ): Promise<void>;
  /** Bir GSAP zaman çizelgesi kurar ve bitmesini bekler. */
  timeline(build: (tl: gsap.core.Timeline) => void): Promise<void>;
  waitContinue(label?: string): Promise<void>;
  waitFor<T>(sig: Signal<T>): Promise<T>;
  complete(label?: string): void;
  /** Betik kapsamında bir GSAP işlemi oluşturur (temizlik için bağlama kaydedilir). */
  run<T>(fn: () => T): T;
}

export interface NarrateOptions {
  /** [oran (0–1), fonksiyon] — anlatımın belirli anında görsel vurgu tetiklemek için */
  cues?: Array<[number, () => void]>;
  /** Anlatımın ardından bekleme yapılmasın */
  noGap?: boolean;
}

export function createScriptApi(
  ctrl: PlayerController,
  signal: AbortSignal,
  gctx: gsap.Context,
): ScriptApi {
  const run = <T,>(fn: () => T): T => {
    let out!: T;
    gctx.add(() => {
      out = fn();
    });
    return out;
  };

  const wait = (seconds: number) =>
    guard(
      signal,
      new Promise<void>((resolve) => {
        run(() => gsap.delayedCall(Math.max(0, seconds), resolve));
      }),
    );

  const narrateImpl = async (id: string, record: boolean, opts: NarrateOptions = {}) => {
    if (signal.aborted) return guard(signal, Promise.resolve());
    const line = ctrl.line(id);
    if (!line) {
      console.warn(`[anlatım] Manifestte bulunamadı: ${id}`);
      return;
    }
    const token = ctrl.startNarration(id, record);
    const dur = lineDuration(line);
    for (const [frac, fn] of opts.cues ?? []) {
      run(() => gsap.delayedCall(Math.max(0, Math.min(1, frac)) * dur, fn));
    }
    try {
      await wait(dur);
    } finally {
      ctrl.endNarration(token);
    }
    if (!opts.noGap) await wait(ctrl.gap);
  };

  return {
    signal,
    narrate: (id, opts) => narrateImpl(id, true, opts),
    narrateBg: (id) => {
      narrateImpl(id, true, { noGap: true }).catch(() => undefined);
    },
    say: (id, opts) => narrateImpl(id, false, opts),
    wait,
    tween: (targets, vars) =>
      guard(
        signal,
        new Promise<void>((resolve) => {
          run(() => gsap.to(targets, { ...vars, onComplete: () => resolve() }));
        }),
      ),
    fromTo: (targets, from, to) =>
      guard(
        signal,
        new Promise<void>((resolve) => {
          run(() => gsap.fromTo(targets, from, { ...to, onComplete: () => resolve() }));
        }),
      ),
    animate: (from, to, duration, onUpdate, ease = 'power2.inOut') =>
      guard(
        signal,
        new Promise<void>((resolve) => {
          const proxy = { v: from };
          onUpdate(from);
          run(() =>
            gsap.to(proxy, {
              v: to,
              duration,
              ease,
              onUpdate: () => onUpdate(proxy.v),
              onComplete: () => {
                onUpdate(to);
                resolve();
              },
            }),
          );
        }),
      ),
    timeline: (build) =>
      guard(
        signal,
        new Promise<void>((resolve) => {
          run(() => {
            const tl = gsap.timeline({ onComplete: () => resolve() });
            build(tl);
            if (tl.duration() === 0) tl.call(() => undefined);
          });
        }),
      ),
    waitContinue: (label) => guard(signal, ctrl.waitContinue(label ?? null)),
    waitFor: (sig) => {
      ctrl.markInteraction();
      return guard(signal, sig.wait());
    },
    complete: (label) => {
      if (!signal.aborted) ctrl.complete(label ?? null);
    },
    run,
  };
}
