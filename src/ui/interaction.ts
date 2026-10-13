import { useCallback, useRef, useState } from 'react';
import { useStage } from './Stage';

type Pt = { x: number; y: number };

/**
 * Fare + dokunmatik + kalem için tek sürükleme mantığı (Pointer Events).
 * Yalnızca birincil işaretçi dikkate alınır: avuç veya ikinci parmak dokunuşu
 * sürüklemeyi bozmaz.
 */
export function useDrag(opts: {
  onStart?: (p: Pt) => void;
  onMove: (p: Pt) => void;
  onEnd?: (p: Pt, moved: boolean) => void;
  disabled?: boolean;
}) {
  const { toStage } = useStage();
  const st = useRef<{ id: number; start: Pt; moved: boolean } | null>(null);
  const o = useRef(opts);
  o.current = opts;

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (o.current.disabled || !e.isPrimary || st.current) return;
      e.preventDefault();
      e.stopPropagation();
      try {
        (e.currentTarget as Element).setPointerCapture(e.pointerId);
      } catch {
        /* yok say */
      }
      const p = toStage(e.clientX, e.clientY);
      st.current = { id: e.pointerId, start: p, moved: false };
      o.current.onStart?.(p);
    },
    [toStage],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const s = st.current;
      if (!s || e.pointerId !== s.id) return;
      const p = toStage(e.clientX, e.clientY);
      if (!s.moved && Math.hypot(p.x - s.start.x, p.y - s.start.y) > 14) s.moved = true;
      if (s.moved) o.current.onMove(p);
    },
    [toStage],
  );

  const finish = useCallback(
    (e: React.PointerEvent) => {
      const s = st.current;
      if (!s || e.pointerId !== s.id) return;
      st.current = null;
      o.current.onEnd?.(toStage(e.clientX, e.clientY), s.moved);
    },
    [toStage],
  );

  return { onPointerDown, onPointerMove, onPointerUp: finish, onPointerCancel: finish };
}

export interface ZoneRect<Z extends string = string> {
  id: Z;
  x: number;
  y: number;
  w: number;
  h: number;
}

export function hitZone<Z extends string>(zones: ZoneRect<Z>[], p: Pt, pad = 30): Z | null {
  for (const z of zones) {
    if (p.x >= z.x - pad && p.x <= z.x + z.w + pad && p.y >= z.y - pad && p.y <= z.y + z.h + pad) return z.id;
  }
  return null;
}

/**
 * "Seç ve yerleştir" + "sürükle ve bırak" birlikte:
 *  - Bir öğeye dokun → seçilir; sonra hedefe dokun → yerleşir. (hassas sürükleme gerekmez)
 *  - Ya da öğeyi sürükleyip hedefin üstüne bırak.
 */
export function usePickAndPlace<I extends string, Z extends string>(opts: {
  zones: () => ZoneRect<Z>[];
  onPlace: (item: I, zone: Z) => void;
  disabled?: boolean;
}) {
  const [selected, setSelected] = useState<I | null>(null);
  const [ghost, setGhost] = useState<{ item: I; x: number; y: number } | null>(null);
  const [hover, setHover] = useState<Z | null>(null);
  const o = useRef(opts);
  o.current = opts;
  const { toStage } = useStage();
  const drag = useRef<{ item: I; id: number; start: Pt; moved: boolean } | null>(null);

  const itemProps = (item: I) => ({
    onPointerDown: (e: React.PointerEvent) => {
      if (o.current.disabled || !e.isPrimary || drag.current) return;
      e.preventDefault();
      try {
        (e.currentTarget as Element).setPointerCapture(e.pointerId);
      } catch {
        /* yok say */
      }
      drag.current = { item, id: e.pointerId, start: toStage(e.clientX, e.clientY), moved: false };
    },
    onPointerMove: (e: React.PointerEvent) => {
      const d = drag.current;
      if (!d || d.id !== e.pointerId) return;
      const p = toStage(e.clientX, e.clientY);
      if (!d.moved && Math.hypot(p.x - d.start.x, p.y - d.start.y) > 14) d.moved = true;
      if (d.moved) {
        setGhost({ item: d.item, x: p.x, y: p.y });
        setHover(hitZone(o.current.zones(), p));
      }
    },
    onPointerUp: (e: React.PointerEvent) => {
      const d = drag.current;
      if (!d || d.id !== e.pointerId) return;
      drag.current = null;
      setGhost(null);
      setHover(null);
      if (d.moved) {
        const z = hitZone(o.current.zones(), toStage(e.clientX, e.clientY));
        if (z) {
          o.current.onPlace(d.item, z);
          setSelected(null);
        }
      } else {
        setSelected((s) => (s === item ? null : item));
      }
    },
    onPointerCancel: () => {
      drag.current = null;
      setGhost(null);
      setHover(null);
    },
  });

  const tapZone = (zone: Z) => {
    if (o.current.disabled || !selected) return false;
    o.current.onPlace(selected, zone);
    setSelected(null);
    return true;
  };

  return { selected, setSelected, ghost, hover, itemProps, tapZone };
}
