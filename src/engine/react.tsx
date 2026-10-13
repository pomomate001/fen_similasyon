import { gsap } from 'gsap';
import { createContext, useContext, useEffect, useMemo, useRef, useSyncExternalStore, type ReactNode } from 'react';
import type { PlayerController, PlayerSnapshot } from './controller';
import { createScriptApi, type ScriptApi } from './script';
import { createSignal, isCancel, type Signal } from './signal';

const PlayerContext = createContext<PlayerController | null>(null);

export function PlayerProvider({ controller, children }: { controller: PlayerController; children: ReactNode }) {
  return <PlayerContext.Provider value={controller}>{children}</PlayerContext.Provider>;
}

export function usePlayer(): PlayerController {
  const c = useContext(PlayerContext);
  if (!c) throw new Error('usePlayer, PlayerProvider içinde kullanılmalıdır.');
  return c;
}

export function usePlayerState(): PlayerSnapshot {
  const c = usePlayer();
  return useSyncExternalStore(c.subscribe, c.getSnapshot, c.getSnapshot);
}

/**
 * Sahne betiğini bileşen kurulunca başlatır; bileşen kaldırılınca iptal eder.
 * Betik içinde React durumunun güncel değerini okumak gerekiyorsa ref kullanılmalıdır.
 */
export function useScript(script: (s: ScriptApi) => Promise<void>) {
  const ctrl = usePlayer();
  const ref = useRef(script);
  ref.current = script;
  useEffect(() => {
    const ac = new AbortController();
    const gctx = gsap.context(() => undefined);
    const api = createScriptApi(ctrl, ac.signal, gctx);
    ctrl.sceneStarted();
    ref.current(api).catch((e) => {
      if (!isCancel(e)) console.error('[sahne betiği]', e);
    });
    return () => {
      ac.abort();
      gctx.revert();
      ctrl.sceneEnded();
    };
  }, [ctrl]);
}

/** Bileşen ömrü boyunca sabit bir sinyal */
export function useSignal<T = void>(): Signal<T> {
  return useMemo(() => createSignal<T>(), []);
}

/** Güncel değeri betikten okumak için state + ref ikilisi */
export function useLatest<T>(value: T) {
  const r = useRef(value);
  r.current = value;
  return r;
}
