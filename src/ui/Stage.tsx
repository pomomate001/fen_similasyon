import { createContext, useCallback, useContext, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

export const STAGE_W = 1920;
export const STAGE_H = 1080;

export function computeScale(w: number, h: number): number {
  return Math.min(w / STAGE_W, h / STAGE_H);
}

interface StageCtx {
  /** İstemci (ekran) koordinatını 1920×1080 sahne koordinatına çevirir. */
  toStage: (clientX: number, clientY: number) => { x: number; y: number };
}

const Ctx = createContext<StageCtx>({ toStage: (x, y) => ({ x, y }) });

export function useStage() {
  return useContext(Ctx);
}

/**
 * 16:9 oranını koruyarak ekrana sığan sahne. Oran farklıysa kenarlarda boşluk kalır;
 * hiçbir çözünürlükte kaydırma çubuğu oluşmaz.
 */
export function Stage({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(() =>
    typeof window === 'undefined' ? 1 : computeScale(window.innerWidth, window.innerHeight),
  );
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const on = () => setScale(computeScale(window.innerWidth, window.innerHeight));
    on();
    window.addEventListener('resize', on);
    window.addEventListener('orientationchange', on);
    return () => {
      window.removeEventListener('resize', on);
      window.removeEventListener('orientationchange', on);
    };
  }, []);

  const toStage = useCallback((clientX: number, clientY: number) => {
    const el = ref.current;
    if (!el) return { x: clientX, y: clientY };
    const r = el.getBoundingClientRect();
    const s = r.width / STAGE_W || 1;
    return { x: (clientX - r.left) / s, y: (clientY - r.top) / s };
  }, []);

  return (
    <div className="stage-viewport">
      <div
        ref={ref}
        className="stage"
        data-testid="stage"
        style={{ transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        <Ctx.Provider value={{ toStage }}>{children}</Ctx.Provider>
      </div>
    </div>
  );
}
