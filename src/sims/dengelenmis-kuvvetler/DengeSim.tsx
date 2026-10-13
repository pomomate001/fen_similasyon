import { useCallback, useEffect, useRef, useState } from 'react';
import { setSfxMuted, sfx } from '../../engine/sfx';
import { formatN } from '../../physics/forces';
import { IconHome, IconInfo, IconMute, IconPause, IconPlay, IconReplay, IconRestart, IconSound } from '../../ui/icons';
import { Stage, useStage } from '../../ui/Stage';
import type { StandaloneSimProps } from '../registry';
import {
  anchorLocal,
  COM,
  fallPose,
  footDrop,
  handLocal,
  hangPose,
  IDLE_POSE,
  INK,
  InkDefs,
  Kid,
  lerpPose,
  Phone,
  RED,
  RED_DARK,
  toWorld,
  walkPose,
  type Face,
  type Gender,
  type Pose,
} from './Kid';
import {
  BALLOON_N,
  G,
  MAX_BALLOONS,
  MIN_BALLOONS,
  netEquation,
  netForce,
  START_BALLOONS,
  step,
  WEIGHT_N,
} from './model';
import { EDGE_X, GroundProps, WorldTiles } from './World';
import './denge.css';

/* ---- Ölçekler ve sahne yerleşimi ------------------------------------------ */
/** 1 m = 230 piksel (öğrenci ≈ 1,5 m) */
const PPM = 230;
const G_PX = G * PPM;
/** Kuvvet okları: 100 N = 56 piksel */
const PX_PER_N = 0.56;
const BALLOON_R = 50;

const KID_START_X = 1010;
const WALK_SPEED = 300;
const STRIDE_RATE = 7.6;
const HANG_X = EDGE_X + 300;
const HANG_Y = 420;
/** Asılı öğrencinin kütle merkezinin ekrandaki hedef konumu */
const KID_SCREEN = { x: 940, y: 640 };
/** Ölü bölge: öğrenci bu bandın dışına çıkınca kamera izler */
const BAND = { top: 560, bottom: 790 };
/** Açılıştaki "yakalanma" yayı */
const CATCH_K = 40;
const CATCH_C = 8.5;

type P = { x: number; y: number };
type Phase = 'ready' | 'walk' | 'fall' | 'live';

interface Balloon {
  id: number;
  /** Göbeğe göre konum (dünya pikseli) */
  ox: number;
  oy: number;
  inflate: number;
  delay: number;
  sounded: boolean;
}

interface FreeBalloon {
  id: number;
  x: number;
  y: number;
  vy: number;
  t: number;
}

interface FreePhone {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
}

interface Sim {
  phase: Phase;
  t: number;
  time: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  phi: number;
  stepIdx: number;
  pose: Pose;
  fallFrom: Pose;
  camX: number;
  camY: number;
  phone: FreePhone | null;
  phoneDropped: boolean;
  popped: boolean;
  balloons: Balloon[];
  free: FreeBalloon[];
  nextId: number;
}

type Drag =
  | { kind: 'cluster'; id: number; pointerId: number; start: P; at: P; moved: boolean }
  | { kind: 'tray'; pointerId: number; start: P; at: P; moved: boolean };

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
function easeOutBack(t: number) {
  const k = clamp01(t);
  const c1 = 1.9;
  return 1 + (c1 + 1) * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);
}

function initialSim(): Sim {
  return {
    phase: 'ready',
    t: 0,
    time: 0,
    x: KID_START_X,
    y: -footDrop(IDLE_POSE),
    vx: 0,
    vy: 0,
    phi: 0,
    stepIdx: 0,
    pose: IDLE_POSE,
    fallFrom: IDLE_POSE,
    camX: 0,
    camY: -800,
    phone: null,
    phoneDropped: false,
    popped: false,
    balloons: [],
    free: [],
    nextId: 1,
  };
}

/** Balonların göbeğe göre hedef konumları: yelpaze, sırayla uzun–kısa ip */
function slots(n: number, time: number): P[] {
  const out: P[] = [];
  const spread = n <= 1 ? 0 : Math.min(104, 24 * (n - 1));
  for (let i = 0; i < n; i++) {
    const a0 = n <= 1 ? 0 : -spread / 2 + (spread * i) / (n - 1);
    const a = ((a0 + 2.5 * Math.sin(time * 1.1 + i * 1.7)) * Math.PI) / 180;
    const L = 232 + (i % 2 === 0 ? 30 : -16) + 6 * Math.sin(time * 1.6 + i);
    out.push({ x: Math.sin(a) * L, y: -Math.cos(a) * L });
  }
  return out;
}

function hub(s: Sim): P {
  return toWorld(anchorLocal(s.pose.mast), s.x, s.y, s.pose.rot);
}

function com(s: Sim): P {
  return toWorld(COM, s.x, s.y, s.pose.rot);
}

function newBalloon(s: Sim, delay = 0, at?: P): Balloon {
  return { id: s.nextId++, ox: at?.x ?? 0, oy: at?.y ?? 0, inflate: at ? 1 : 0, delay, sounded: !!at };
}

function liveFace(vyDown: number): Face {
  if (vyDown > 160) return 'shock';
  if (vyDown < -160) return 'happy';
  return 'hang';
}

function smooth(cur: number, target: number, rate: number, dt: number) {
  return cur + (target - cur) * (1 - Math.exp(-rate * dt));
}

/** Tek bir benzetim adımı. Saf durum güncellemesi; React dışı. */
function update(s: Sim, dt: number, dragId: number | null) {
  s.time += dt;
  s.t += dt;

  if (s.phase === 'ready') {
    const breathe = Math.sin(s.time * 2);
    s.pose = { ...IDLE_POSE, foreF: IDLE_POSE.foreF + 2 * breathe, head: IDLE_POSE.head + breathe };
    s.y = -footDrop(s.pose);
  } else if (s.phase === 'walk') {
    s.phi += dt * STRIDE_RATE;
    s.x += WALK_SPEED * dt;
    s.pose = lerpPose(IDLE_POSE, walkPose(s.phi), clamp01(s.t / 0.25));
    s.y = -footDrop(s.pose);
    const idx = Math.floor(s.phi / Math.PI);
    if (idx !== s.stepIdx) {
      s.stepIdx = idx;
      sfx.step();
    }
    s.camX = Math.max(0, s.x - 1100);
    if (s.x >= EDGE_X + 6) {
      s.phase = 'fall';
      s.t = 0;
      s.vx = WALK_SPEED * 0.85;
      s.vy = 0;
      s.fallFrom = s.pose;
      sfx.whoosh(0.7);
    }
  } else if (s.phase === 'fall') {
    const t = s.t;
    // Duruş: yürüyüşten çırpınmaya, açılınca asılı duruşa
    let pose = lerpPose(s.fallFrom, fallPose(t), clamp01(t / 0.16));
    pose = lerpPose(pose, hangPose(s.time), easeOutCubic((t - 0.5) / 0.8));
    const settle = t > 0.9 ? 5 * Math.exp(-(t - 0.9) * 2.6) * Math.sin((t - 0.9) * 7) : 0;
    pose.rot = 90 * easeOutCubic((t - 0.04) / 0.72) + settle;
    pose.pack = clamp01((t - 0.2) / 0.08);
    pose.mast = easeOutBack((t - 0.24) / 0.24);
    pose.phone = !s.phoneDropped;
    if (t > 0.2 && !s.popped) {
      s.popped = true;
      sfx.pop();
    }
    s.pose = pose;

    // Telefon elden kayar ve kendi başına düşmeye devam eder
    if (t >= 0.1 && !s.phoneDropped) {
      s.phoneDropped = true;
      const h = toWorld(handLocal(s.fallFrom), s.x, s.y, pose.rot);
      s.phone = { x: h.x, y: h.y, vx: s.vx + 70, vy: s.vy - 420, rot: -20, vr: 560 };
    }

    // Balonlar çantadan sırayla fırlar
    if (t >= 0.3 && s.balloons.length === 0) {
      for (let i = 0; i < START_BALLOONS; i++) s.balloons.push(newBalloon(s, i * 0.06));
    }

    // Serbest düşme → balonlar şiştikçe yay benzeri yakalanma
    const p = clamp01((t - 0.3) / 0.4);
    const ay = G_PX - p * (G_PX + CATCH_K * (s.y - HANG_Y)) - p * CATCH_C * s.vy;
    const ax = p * (-CATCH_K * (s.x - HANG_X) - CATCH_C * s.vx);
    s.vy += ay * dt;
    s.vx += ax * dt;
    s.y += s.vy * dt;
    s.x += s.vx * dt;

    if ((t > 1.9 && Math.abs(s.y - HANG_Y) < 3 && Math.abs(s.vy) < 20) || t > 3.2) {
      s.phase = 'live';
      s.t = 0;
      s.x = HANG_X;
      s.y = HANG_Y;
      s.vx = 0;
      s.vy = 0;
    }
  } else {
    // Canlı: yalnızca kuvvetler belirler (model.step). Hava direnci yok.
    const n = s.balloons.length;
    const m = step({ h: -s.y / PPM, v: -s.vy / PPM }, n, dt);
    s.y = -m.h * PPM;
    s.vy = -m.v * PPM;
    s.pose = hangPose(s.time, liveFace(s.vy));
    s.pose.rot = 90 + 0.6 * Math.sin(s.time * 1.2);
  }

  // Kamera
  if (s.phase === 'fall' || s.phase === 'live') {
    const c = com(s);
    const tx = HANG_X + (c.x - s.x) - KID_SCREEN.x;
    s.camX = smooth(s.camX, tx, 4, dt);
    if (s.phase === 'fall') {
      s.camY = smooth(s.camY, c.y - KID_SCREEN.y, 5, dt);
    } else {
      const sy = c.y - s.camY;
      if (sy > BAND.bottom) s.camY = c.y - BAND.bottom;
      else if (sy < BAND.top) s.camY = c.y - BAND.top;
      if (Math.abs(s.vy) < 1) s.camY = smooth(s.camY, c.y - KID_SCREEN.y, 1.6, dt);
    }
  }

  // Balonlar
  const sl = slots(s.balloons.length, s.time);
  s.balloons.forEach((b, i) => {
    if (b.delay > 0) {
      b.delay -= dt;
      return;
    }
    if (!b.sounded) {
      b.sounded = true;
      sfx.inflate();
    }
    b.inflate = Math.min(1, b.inflate + dt / 0.36);
    if (b.id !== dragId) {
      const k = b.inflate < 1 ? 10 : 7;
      b.ox = smooth(b.ox, sl[i].x, k, dt);
      b.oy = smooth(b.oy, sl[i].y, k, dt);
    }
  });
  for (const f of s.free) {
    f.t += dt;
    f.vy -= 420 * dt;
    f.y += f.vy * dt;
  }
  s.free = s.free.filter((f) => f.y - s.camY > -500);

  if (s.phone) {
    const ph = s.phone;
    ph.vy += G_PX * dt;
    ph.x += ph.vx * dt;
    ph.y += ph.vy * dt;
    ph.rot += ph.vr * dt;
    if (ph.y - s.camY > 1500) s.phone = null;
  }
}

/* ---- Çizim parçaları ------------------------------------------------------- */

function BalloonShape({ x, y, r, testId }: { x: number; y: number; r: number; testId?: string }) {
  if (r < 1) return null;
  const rx = r * 0.9;
  const ry = r * 1.08;
  return (
    <g data-testid={testId}>
      <path
        d={`M${x},${y + ry} C${x - rx * 1.25},${y + ry * 0.55} ${x - rx * 1.1},${y - ry} ${x},${y - ry} C${x + rx * 1.1},${y - ry} ${x + rx * 1.25},${y + ry * 0.55} ${x},${y + ry} Z`}
        fill={RED}
        stroke={RED_DARK}
        strokeWidth={3.5}
        strokeLinejoin="round"
      />
      <path
        d={`M${x - rx * 0.55},${y - ry * 0.35} Q${x - rx * 0.5},${y - ry * 0.75} ${x - rx * 0.12},${y - ry * 0.82}`}
        stroke="#fff"
        strokeWidth={Math.max(2, r * 0.11)}
        fill="none"
        strokeLinecap="round"
        opacity={0.85}
      />
      <path d={`M${x - 7},${y + ry + 9} L${x},${y + ry - 1} L${x + 7},${y + ry + 9} Z`} fill={RED} stroke={RED_DARK} strokeWidth={2.5} strokeLinejoin="round" />
    </g>
  );
}

function stringPath(a: P, b: P, wobble: number) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const cx = mx + (-dy / len) * wobble;
  const cy = my + (dx / len) * wobble;
  return `M${a.x.toFixed(1)},${a.y.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)}`;
}

/** Siyah, dolu kuvvet oku (beyaz kontur) */
function InkArrow({
  x,
  y,
  len,
  up,
  label,
  labelSide = 'right',
  testId,
  magnitude,
}: {
  x: number;
  y: number;
  len: number;
  up: boolean;
  label?: string;
  labelSide?: 'right' | 'left' | 'tip';
  testId?: string;
  magnitude?: number;
}) {
  const d = up ? -1 : 1;
  const head = Math.min(26, len * 0.55);
  const hw = 15;
  const tipY = y + d * len;
  const baseY = tipY - d * head;
  const lx = labelSide === 'right' ? x + 26 : labelSide === 'left' ? x - 26 : x;
  const ly = labelSide === 'tip' ? tipY + d * 18 + (up ? 0 : 22) : y + (d * len) / 2 + 11;
  return (
    <g data-testid={testId} data-magnitude={magnitude} data-dir={up ? 'yukari' : 'asagi'} pointerEvents="none">
      <path d={`M${x},${y} L${x},${baseY}`} stroke="#fff" strokeWidth={18} strokeLinecap="round" />
      <path d={`M${x},${tipY + d * 4} L${x - hw - 5},${baseY - d * 3} L${x + hw + 5},${baseY - d * 3} Z`} fill="#fff" stroke="#fff" strokeWidth={4} strokeLinejoin="round" />
      <path d={`M${x},${y} L${x},${baseY + d * 2}`} stroke={INK} strokeWidth={9} strokeLinecap="round" />
      <path d={`M${x},${tipY} L${x - hw},${baseY} L${x + hw},${baseY} Z`} fill={INK} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      {label && (
        <text
          x={lx}
          y={ly}
          textAnchor={labelSide === 'right' ? 'start' : labelSide === 'left' ? 'end' : 'middle'}
          className="dg-label"
          fontSize={30}
        >
          {label}
        </text>
      )}
    </g>
  );
}

/** Bileşke oku: içi boş, kalın konturlu — uygulanan kuvvetlerden ayırt edilir */
function ResultantArrow({ x, y, len, up }: { x: number; y: number; len: number; up: boolean }) {
  const d = up ? -1 : 1;
  const head = Math.min(40, len * 0.6);
  const hw = 28;
  const sw = 11;
  const tipY = y + d * len;
  const baseY = tipY - d * head;
  const shape = `M${x - sw},${y} L${x - sw},${baseY} L${x - hw},${baseY} L${x},${tipY} L${x + hw},${baseY} L${x + sw},${baseY} L${x + sw},${y} Z`;
  return (
    <g pointerEvents="none">
      <path d={shape} fill="#fff" stroke="#fff" strokeWidth={16} strokeLinejoin="round" />
      <path d={shape} fill="url(#dg-hatch)" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    </g>
  );
}

/* ---- Bileşen --------------------------------------------------------------- */

function readGender(): Gender {
  try {
    return localStorage.getItem('fen.gender') === 'erkek' ? 'erkek' : 'kiz';
  } catch {
    return 'kiz';
  }
}

export default function DengeSim(props: StandaloneSimProps) {
  return (
    <Stage>
      <DengeScene {...props} />
    </Stage>
  );
}

function DengeScene({ params, onExit }: StandaloneSimProps) {
  const timeScale = params.has('hiz') ? Math.max(0.25, Number(params.get('hiz')) || 1) : 1;
  const { toStage } = useStage();
  const simRef = useRef<Sim>(initialSim());
  const dragRef = useRef<Drag | null>(null);
  const [, setFrame] = useState(0);
  const [gender, setGender] = useState<Gender>(readGender);
  const [showForces, setShowForces] = useState(false);
  const [showR, setShowR] = useState(false);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(params.get('ses') === '0');
  const [notes, setNotes] = useState(false);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    setSfxMuted(muted);
    return () => setSfxMuted(false);
  }, [muted]);

  // Ana döngü
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const real = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!pausedRef.current) {
        const total = real * timeScale;
        const n = Math.max(1, Math.ceil(total / (1 / 120)));
        const d = dragRef.current;
        for (let i = 0; i < n; i++) update(simRef.current, total / n, d?.kind === 'cluster' && d.moved ? d.id : null);
      }
      setFrame((f) => (f + 1) % 1_000_000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [timeScale]);

  const s = simRef.current;
  const live = s.phase === 'live';
  const n = s.balloons.length;

  const chooseGender = (g: Gender) => {
    sfx.tap();
    setGender(g);
    try {
      localStorage.setItem('fen.gender', g);
    } catch {
      /* yok say */
    }
  };

  const start = () => {
    sfx.unlock();
    const fresh = initialSim();
    fresh.phase = 'walk';
    simRef.current = fresh;
    setPaused(false);
    sfx.ding();
  };

  const backToStart = () => {
    simRef.current = initialSim();
    dragRef.current = null;
    setShowForces(false);
    setShowR(false);
    setPaused(false);
  };

  /** Sıfırla: dengeye, başlangıç konumuna ve 5 balona dön */
  const resetHang = () => {
    const cur = simRef.current;
    if (cur.phase !== 'live') return;
    sfx.tap();
    cur.y = HANG_Y;
    cur.vy = 0;
    cur.free = [];
    const sl = slots(START_BALLOONS, cur.time);
    const kept = cur.balloons.slice(0, START_BALLOONS);
    while (kept.length < START_BALLOONS) kept.push(newBalloon(cur));
    kept.forEach((b, i) => {
      b.ox = sl[i].x;
      b.oy = sl[i].y;
      b.inflate = 1;
      b.delay = 0;
      b.sounded = true;
    });
    cur.balloons = kept;
    const c = com(cur);
    cur.camY = c.y - KID_SCREEN.y;
  };

  const addBalloon = useCallback((at?: P) => {
    const cur = simRef.current;
    if (cur.phase !== 'live' || cur.balloons.length >= MAX_BALLOONS) return false;
    cur.balloons.push(newBalloon(cur, 0, at));
    if (at) sfx.place();
    return true;
  }, []);

  const releaseBalloon = useCallback((id?: number) => {
    const cur = simRef.current;
    if (cur.phase !== 'live' || cur.balloons.length <= MIN_BALLOONS) return;
    const idx = id === undefined ? cur.balloons.length - 1 : cur.balloons.findIndex((b) => b.id === id);
    if (idx < 0) return;
    const [b] = cur.balloons.splice(idx, 1);
    const h = hub(cur);
    cur.free.push({ id: b.id, x: h.x + b.ox, y: h.y + b.oy, vy: cur.vy - 40, t: 0 });
    sfx.release();
  }, []);

  // Klavye / sunum kumandası
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === ' ' || k === 'p') {
        e.preventDefault();
        setPaused((v) => !v);
      } else if (k === '+' || k === '=' || k === 'arrowup') {
        e.preventDefault();
        addBalloon();
      } else if (k === '-' || k === 'arrowdown') {
        e.preventDefault();
        releaseBalloon();
      } else if (k === 'k') setShowForces((v) => !v);
      else if (k === 'b') setShowR((v) => !v);
      else if (k === 'enter' && simRef.current.phase === 'ready') start();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [addBalloon, releaseBalloon]);

  // Sürükle-bırak: pencere düzeyinde dinleyiciler (fare, dokunmatik, kalem)
  const beginDrag = (e: React.PointerEvent, d: { kind: 'cluster'; id: number } | { kind: 'tray' }) => {
    if (!e.isPrimary || dragRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    sfx.unlock();
    const p = toStage(e.clientX, e.clientY);
    dragRef.current = { ...d, pointerId: e.pointerId, start: p, at: p, moved: false } as Drag;
  };

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d || e.pointerId !== d.pointerId) return;
      d.at = toStage(e.clientX, e.clientY);
      if (!d.moved && Math.hypot(d.at.x - d.start.x, d.at.y - d.start.y) > 12) d.moved = true;
    };
    const end = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d || e.pointerId !== d.pointerId) return;
      dragRef.current = null;
      const cur = simRef.current;
      const p = toStage(e.clientX, e.clientY);
      const world = { x: p.x + cur.camX, y: p.y + cur.camY };
      const h = hub(cur);
      if (d.kind === 'tray') {
        if (!d.moved) {
          addBalloon();
          return;
        }
        const c = com(cur);
        const near = Math.hypot(world.x - h.x, world.y - h.y) < 460 || Math.hypot(world.x - c.x, world.y - c.y) < 300;
        if (near) addBalloon({ x: world.x - h.x, y: world.y - h.y });
        return;
      }
      if (!d.moved) return;
      const b = cur.balloons.find((x) => x.id === d.id);
      if (!b) return;
      const i = cur.balloons.indexOf(b);
      const target = slots(cur.balloons.length, cur.time)[i];
      const off = { x: world.x - h.x, y: world.y - h.y };
      if (Math.hypot(off.x - target.x, off.y - target.y) > 150) {
        b.ox = off.x;
        b.oy = off.y;
        releaseBalloon(b.id);
      } else {
        b.ox = off.x;
        b.oy = off.y;
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
    };
  }, [toStage, addBalloon, releaseBalloon]);

  // ---- Görünüm hesapları ----
  const drag = dragRef.current;
  const h = hub(s);
  const c = com(s);
  const R = netForce(n);
  const rSigned = R.sign * R.magnitude;
  const balloonPos = s.balloons.map((b) => {
    if (drag?.kind === 'cluster' && drag.moved && drag.id === b.id) {
      return { x: drag.at.x + s.camX, y: drag.at.y + s.camY };
    }
    return { x: h.x + b.ox, y: h.y + b.oy };
  });
  const forcesVisible = live && showForces;
  const rVisible = live && showR;
  const rx = c.x + 250;

  return (
    <div className="dg-root" data-testid="denge" data-phase={s.phase} data-balloons={n}>
      <svg className="scene-svg" viewBox="0 0 1920 1080" aria-label="Uçurumdan düşen öğrenci ve balonlar">
        <InkDefs />
        <rect width={1920} height={1080} fill="#fcfcfa" />
        <g transform={`translate(${(-s.camX).toFixed(1)} ${(-s.camY).toFixed(1)})`}>
          <WorldTiles camY={s.camY} />
          <GroundProps />

          {s.phone && (
            <g transform={`translate(${s.phone.x.toFixed(1)} ${s.phone.y.toFixed(1)}) rotate(${s.phone.rot.toFixed(1)})`}>
              <Phone />
            </g>
          )}

          {/* uçan balonlar */}
          {s.free.map((f) => (
            <g key={f.id} transform={`rotate(${(8 * Math.sin(f.t * 2.4)).toFixed(1)} ${f.x.toFixed(1)} ${f.y.toFixed(1)})`}>
              <path
                d={`M${f.x},${f.y + 64} q${(12 * Math.sin(f.t * 5)).toFixed(1)},60 ${(-4).toFixed(1)},130`}
                stroke={INK}
                strokeWidth={2.5}
                fill="none"
              />
              <BalloonShape x={f.x} y={f.y} r={BALLOON_R} />
            </g>
          ))}

          {/* ipler */}
          <g>
            {s.balloons.map((b, i) => {
              const r = BALLOON_R * easeOutBack(b.inflate);
              if (r < 1) return null;
              const bp = balloonPos[i];
              return (
                <path
                  key={b.id}
                  d={stringPath(h, { x: bp.x, y: bp.y + r * 1.08 + 8 }, 10 * Math.sin(s.time * 1.3 + i))}
                  stroke={INK}
                  strokeWidth={2.6}
                  fill="none"
                />
              );
            })}
          </g>

          <Kid gender={gender} pose={s.pose} x={s.x} y={s.y} />

          {/* balonlar */}
          {s.balloons.map((b, i) => {
            const r = BALLOON_R * easeOutBack(b.inflate);
            const bp = balloonPos[i];
            const dragging = drag?.kind === 'cluster' && drag.id === b.id;
            return (
              <g
                key={b.id}
                className={`dg-balloon ${live ? 'is-live' : ''} ${dragging ? 'is-drag' : ''}`}
                onPointerDown={live ? (e) => beginDrag(e, { kind: 'cluster', id: b.id }) : undefined}
                data-testid={`balloon-${i}`}
              >
                <circle cx={bp.x} cy={bp.y} r={Math.max(r, 1) + 14} fill="transparent" />
                <BalloonShape x={bp.x} y={bp.y} r={r} />
              </g>
            );
          })}

          {/* kuvvetler */}
          {forcesVisible && (
            <g data-testid="forces">
              {s.balloons.map((b, i) => {
                const r = BALLOON_R * easeOutBack(b.inflate);
                if (b.inflate < 0.6) return null;
                const bp = balloonPos[i];
                return (
                  <InkArrow
                    key={b.id}
                    x={bp.x}
                    y={bp.y - r * 1.08 - 6}
                    len={BALLOON_N * PX_PER_N}
                    up
                    label={formatN(BALLOON_N)}
                    labelSide="tip"
                    testId="arrow-balloon"
                    magnitude={BALLOON_N}
                  />
                );
              })}
              <InkArrow x={c.x} y={c.y} len={WEIGHT_N * PX_PER_N} up={false} label={formatN(WEIGHT_N)} testId="arrow-weight" magnitude={WEIGHT_N} />
              <circle cx={c.x} cy={c.y} r={9} fill={INK} stroke="#fff" strokeWidth={4} />
            </g>
          )}

          {rVisible && (
            <g data-testid="arrow-resultant" data-value={rSigned}>
              <path d={`M${c.x},${c.y} L${rx},${c.y}`} stroke={INK} strokeWidth={3} strokeDasharray="8 8" opacity={0.6} />
              <circle cx={c.x} cy={c.y} r={9} fill={INK} stroke="#fff" strokeWidth={4} />
              {R.sign === 0 ? (
                <g>
                  <circle cx={rx} cy={c.y} r={14} fill="#fff" stroke={INK} strokeWidth={6} />
                  <text x={rx + 30} y={c.y + 12} className="dg-label" fontSize={34}>
                    R = 0 N
                  </text>
                </g>
              ) : (
                <g>
                  <ResultantArrow x={rx} y={c.y} len={R.magnitude * PX_PER_N} up={R.sign === 1} />
                  <text x={rx + 40} y={c.y + (R.sign === 1 ? -1 : 1) * (R.magnitude * PX_PER_N) * 0.5 + 12} className="dg-label" fontSize={34}>
                    R = {formatN(R.magnitude)}
                  </text>
                </g>
              )}
            </g>
          )}
        </g>

        {/* tepsiden sürüklenen balon (ekran koordinatı) */}
        {drag?.kind === 'tray' && drag.moved && (
          <g pointerEvents="none" opacity={0.92}>
            <path d={`M${drag.at.x},${drag.at.y + 62} l0,70`} stroke={INK} strokeWidth={2.6} />
            <BalloonShape x={drag.at.x} y={drag.at.y} r={BALLOON_R} />
          </g>
        )}
      </svg>

      {/* ---- Üst çubuk ---- */}
      <div className="dg-top">
        <button className="dg-btn dg-icon" aria-label="Ana sayfa" title="Ana sayfa" onClick={onExit}>
          <IconHome />
        </button>
        <div className="dg-seg" role="radiogroup" aria-label="Karakter">
          {(['kiz', 'erkek'] as const).map((g) => (
            <button
              key={g}
              role="radio"
              aria-checked={gender === g}
              className={gender === g ? 'is-on' : ''}
              onClick={() => chooseGender(g)}
              data-testid={`gender-${g}`}
            >
              {g === 'kiz' ? 'Kız' : 'Erkek'}
            </button>
          ))}
        </div>
        <div className={`dg-title ${live ? 'is-hidden' : ''}`}>Dengelenmiş ve Dengelenmemiş Kuvvetler</div>
        <button
          className="dg-btn dg-icon"
          aria-label={muted ? 'Sesi aç' : 'Sesi kapat'}
          title={muted ? 'Sesi aç' : 'Sesi kapat'}
          onClick={() => setMuted((m) => !m)}
        >
          {muted ? <IconMute /> : <IconSound />}
        </button>
        <button
          className={`dg-btn dg-icon ${notes ? 'is-on' : ''}`}
          aria-label="Öğretmen notları"
          title="Öğretmen notları"
          onClick={() => setNotes((v) => !v)}
        >
          <IconInfo />
        </button>
      </div>

      {rVisible && (
        <div className="dg-card" data-testid="resultant-card" data-value={rSigned}>
          <div className="dg-card-k">Bileşke kuvvet</div>
          <div className="dg-card-v">{netEquation(n)}</div>
        </div>
      )}

      {s.phase === 'ready' && (
        <button className="dg-start" onClick={start} data-testid="denge-start">
          <IconPlay /> Başlat
        </button>
      )}

      {s.phase !== 'ready' && !live && (
        <button className="dg-btn dg-skip dg-icon" aria-label="Baştan" title="Baştan" onClick={backToStart}>
          <IconReplay />
        </button>
      )}

      {/* ---- Alt araç çubuğu ---- */}
      <div className={`dg-toolbar ${live ? 'is-visible' : ''}`} role="toolbar" aria-label="Kontroller" aria-hidden={!live}>
        <button
          className={`dg-btn dg-toggle ${showForces ? 'is-on' : ''}`}
          aria-pressed={showForces}
          onClick={() => setShowForces((v) => !v)}
          data-testid="toggle-forces"
          tabIndex={live ? 0 : -1}
        >
          <ArrowsGlyph /> Kuvvetleri göster
        </button>
        <button
          className={`dg-btn dg-toggle ${showR ? 'is-on' : ''}`}
          aria-pressed={showR}
          onClick={() => setShowR((v) => !v)}
          data-testid="toggle-resultant"
          tabIndex={live ? 0 : -1}
        >
          <ResultantGlyph /> Bileşke kuvveti göster
        </button>
        <span className="dg-sep" />
        <button
          className="dg-btn"
          onClick={() => releaseBalloon()}
          disabled={n <= MIN_BALLOONS}
          data-testid="balloon-remove"
          tabIndex={live ? 0 : -1}
        >
          <MinusGlyph /> Balon çıkar
        </button>
        <div className="dg-count" aria-label={`${n} balon`} data-testid="balloon-count" data-value={n}>
          <BalloonGlyph />
          <span>{n}</span>
        </div>
        <button
          className="dg-btn"
          onClick={() => addBalloon()}
          disabled={n >= MAX_BALLOONS}
          data-testid="balloon-add"
          tabIndex={live ? 0 : -1}
        >
          <PlusGlyph /> Balon ekle
        </button>
        <span className="dg-sep" />
        <button className="dg-btn dg-icon" aria-label="Sıfırla" title="Sıfırla: 5 balon, başlangıç konumu" onClick={resetHang} data-testid="reset" tabIndex={live ? 0 : -1}>
          <IconRestart />
        </button>
        <button
          className={`dg-btn dg-icon ${paused ? 'is-on' : ''}`}
          aria-label={paused ? 'Sürdür' : 'Duraklat'}
          title={paused ? 'Sürdür' : 'Duraklat'}
          onClick={() => setPaused((v) => !v)}
          data-testid="pause"
          tabIndex={live ? 0 : -1}
        >
          {paused ? <IconPlay /> : <IconPause />}
        </button>
        <button className="dg-btn dg-icon" aria-label="Baştan oynat" title="Baştan oynat" onClick={backToStart} tabIndex={live ? 0 : -1}>
          <IconReplay />
        </button>
      </div>

      {/* ---- Yedek balonlar: sürükleyip öğrenciye bırak ---- */}
      <div className={`dg-tray ${live ? 'is-visible' : ''} ${n >= MAX_BALLOONS ? 'is-empty' : ''}`} aria-hidden={!live}>
        <div
          className="dg-tray-item"
          role="button"
          aria-label="Yedek balon: sürükleyip öğrenciye bırakın"
          title="Sürükleyip öğrenciye bırakın"
          data-testid="balloon-tray"
          onPointerDown={live && n < MAX_BALLOONS ? (e) => beginDrag(e, { kind: 'tray' }) : undefined}
        >
          <svg viewBox="0 0 160 220" width="150" height="206" aria-hidden="true">
            <path d="M80,150 L80,212 M62,140 L80,212 M98,140 L80,212" stroke={INK} strokeWidth={3} fill="none" />
            <g opacity={0.9}>
              <BalloonShape x={52} y={88} r={36} />
              <BalloonShape x={108} y={88} r={36} />
            </g>
            <BalloonShape x={80} y={62} r={42} />
          </svg>
        </div>
      </div>

      {paused && live && <div className="dg-paused">Duraklatıldı</div>}

      {notes && (
        <aside className="dg-notes" aria-label="Öğretmen notları">
          <h3>Öğretmen Notları</h3>
          <ul>
            <li>Değerler temsilîdir: öğrencinin ağırlığı 500 N, her balonun net kaldırma kuvveti 100 N.</li>
            <li>Hava direnci ihmal edilmiştir. Bileşke sıfırken duran öğrenci durur; hareket ediyorsa sabit süratle hareketine devam eder (ders kitabı s. 57).</li>
            <li>Balon çıkarıp öğrenci düşerken balonu geri ekleyin: düşüş durmaz, sabit süratle sürer. Durdurmak için önce bir balon fazla ekleyin.</li>
            <li>Telefon düşerken balonlar ona etki etmez; telefona etki eden kuvvetler dengelenmemiştir.</li>
            <li>Kısayollar: + / − balon · K kuvvetler · B bileşke · Boşluk duraklat</li>
          </ul>
        </aside>
      )}
    </div>
  );
}

/* ---- Küçük simgeler -------------------------------------------------------- */
const g = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
const ArrowsGlyph = () => (
  <svg {...g}>
    <path d="M8 20V6M8 4l-3 4h6z M16 4v12M16 20l-3-4h6z" fill="currentColor" />
  </svg>
);
const ResultantGlyph = () => (
  <svg {...g}>
    <path d="M12 21V9M7 9l5-6 5 6z" />
  </svg>
);
const PlusGlyph = () => (
  <svg {...g}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const MinusGlyph = () => (
  <svg {...g}>
    <path d="M5 12h14" />
  </svg>
);
const BalloonGlyph = () => (
  <svg viewBox="0 0 24 30" aria-hidden="true">
    <path d="M12 21C4 17 3 3 12 3s8 14 0 18z" fill={RED} stroke={RED_DARK} strokeWidth={1.5} />
    <path d="M12 21q-2 4 1 8" stroke={INK} strokeWidth={1.4} fill="none" />
  </svg>
);

