/**
 * Sahne 10 görev bileşenleri. Her görev doğruluğu fizik modülüyle kendisi denetler
 * ve sonucu onCheck ile sahneye bildirir; sahne betiği anlatım ve ipuçlarını yönetir.
 */
import { useState } from 'react';
import { Crate } from '../../art/objects';
import { sfx } from '../../engine/sfx';
import {
  arrowLength,
  formatN,
  resultant,
  sameResultant,
  type Axis,
  type Force,
  type Resultant,
  type Scale,
  type Sign,
} from '../../physics/forces';
import { AdjustableArrow } from '../../ui/force/AdjustableArrow';
import { ForceArrow } from '../../ui/force/ForceArrow';
import { Grid, ScaleBadge } from '../../ui/force/Grid';
import { usePickAndPlace, type ZoneRect } from '../../ui/interaction';

export interface CheckResult {
  ok: boolean;
  /** Anlatım manifestindeki ipucu kimliği */
  hint?: string;
}

export interface TaskProps {
  assist: boolean;
  locked: boolean;
  onCheck: (r: CheckResult) => void;
}

const OBJ = { x: 960, y: 470, size: 140 };
const R_ROW = 650;

export interface TaskForce {
  magnitude: number;
  sign: Sign;
  /** Okun başladığı yer: cismin batı yüzü, doğu yüzü ya da ortası */
  at: 'bati' | 'dogu' | 'orta';
  note?: string;
}

function toForces(list: TaskForce[], axis: Axis): Force[] {
  return list.map((f, i) => ({ id: `F${i + 1}`, magnitude: f.magnitude, sign: f.sign, axis }));
}

function signedOf(r: Resultant) {
  return r.sign * r.magnitude;
}

const SUB = '₁₂₃₄';

/** Masa çizimi (yandan) — (0,0) üst yüzey ortası */
function Table({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-110} y={-14} width={220} height={22} rx={6} fill="url(#wood)" stroke="#9b6b35" strokeWidth={3} />
      <rect x={-96} y={8} width={16} height={110} rx={4} fill="#b9864b" />
      <rect x={80} y={8} width={16} height={110} rx={4} fill="#b9864b" />
    </g>
  );
}

function CheckButton({ onClick, disabled, label = 'Kontrol Et' }: { onClick: () => void; disabled?: boolean; label?: string }) {
  return (
    <div style={{ position: 'absolute', left: 1500, top: 600 }}>
      <button className="btn btn-primary" data-testid="check" disabled={disabled} onClick={onClick}>
        {label}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1) Aynı yönlü / zıt yönlü ayırma
// ---------------------------------------------------------------------------
type CardId = 'a' | 'b' | 'c' | 'd';
type Bin = 'ayni' | 'zit';
const CARDS: Array<{ id: CardId; axis: Axis; signs: [Sign, Sign]; answer: Bin }> = [
  { id: 'a', axis: 'yatay', signs: [1, 1], answer: 'ayni' },
  { id: 'b', axis: 'yatay', signs: [1, -1], answer: 'zit' },
  { id: 'c', axis: 'dusey', signs: [1, 1], answer: 'ayni' },
  { id: 'd', axis: 'dusey', signs: [1, -1], answer: 'zit' },
];

function MiniDiagram({ axis, signs }: { axis: Axis; signs: [Sign, Sign] }) {
  const lens = [60, 44];
  return (
    <svg width="180" height="150" viewBox="-90 -75 180 150" aria-hidden="true">
      <rect x={-22} y={-22} width={44} height={44} rx={6} fill="#d9a86c" stroke="#9b6b35" strokeWidth={3} />
      {signs.map((sg, i) =>
        axis === 'yatay' ? (
          <ForceArrow key={i} x={sg === 1 ? 22 : -22} y={i === 0 ? -10 : 10} axis="yatay" sign={sg} length={lens[i]} thickness={8} />
        ) : (
          <ForceArrow key={i} x={i === 0 ? -10 : 10} y={sg === 1 ? -22 : 22} axis="dusey" sign={sg} length={lens[i] - 14} thickness={8} />
        ),
      )}
    </svg>
  );
}

export function SortTask({ locked, onCheck }: TaskProps) {
  const [placed, setPlaced] = useState<Record<CardId, Bin | null>>({ a: null, b: null, c: null, d: null });
  const [wrong, setWrong] = useState<CardId[]>([]);
  const BINS: Record<Bin, { x: number; y: number; w: number; h: number; label: string }> = {
    ayni: { x: 300, y: 470, w: 600, h: 300, label: 'Aynı yönlü' },
    zit: { x: 1020, y: 470, w: 600, h: 300, label: 'Zıt yönlü' },
  };
  const pp = usePickAndPlace<CardId, Bin>({
    disabled: locked,
    zones: (): ZoneRect<Bin>[] => (Object.keys(BINS) as Bin[]).map((b) => ({ id: b, ...BINS[b] })),
    onPlace: (c, b) => {
      sfx.place();
      setWrong((w) => w.filter((x) => x !== c));
      setPlaced((p) => ({ ...p, [c]: b }));
    },
  });
  const tray = CARDS.filter((c) => !placed[c.id]);
  const card = (c: (typeof CARDS)[number], small = false) => (
    <button
      key={c.id}
      className={`chip ${pp.selected === c.id ? 'selected' : ''} ${wrong.includes(c.id) ? 'hint' : ''} ${locked ? 'correct' : ''}`}
      style={{ padding: 6, minHeight: 0, width: small ? 150 : 200, height: small ? 130 : 170 }}
      data-testid={`card-${c.id}`}
      disabled={locked}
      {...pp.itemProps(c.id)}
    >
      <MiniDiagram axis={c.axis} signs={c.signs} />
    </button>
  );
  return (
    <>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 230, display: 'flex', gap: 24, justifyContent: 'center', minHeight: 170 }}>
        {tray.map((c) => card(c))}
      </div>
      {(Object.keys(BINS) as Bin[]).map((b) => (
        <div
          key={b}
          data-testid={`bin-${b}`}
          onPointerUp={(e) => {
            if ((e.target as HTMLElement).closest('button')) return;
            pp.tapZone(b);
          }}
          style={{
            position: 'absolute',
            left: BINS[b].x,
            top: BINS[b].y,
            width: BINS[b].w,
            height: BINS[b].h,
            borderRadius: 28,
            border: `5px dashed ${pp.hover === b || pp.selected ? 'var(--interact)' : '#aab4c4'}`,
            background: pp.hover === b ? 'var(--interact-soft)' : 'rgba(255,255,255,0.75)',
            padding: 18,
          }}
        >
          <div style={{ fontSize: 30, fontWeight: 750, marginBottom: 10 }}>{BINS[b].label}</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>{CARDS.filter((c) => placed[c.id] === b).map((c) => card(c, true))}</div>
        </div>
      ))}
      {pp.ghost && (
        <div className="chip selected" style={{ position: 'absolute', left: pp.ghost.x - 90, top: pp.ghost.y - 75, pointerEvents: 'none', zIndex: 30, padding: 6 }}>
          <MiniDiagram axis={CARDS.find((c) => c.id === pp.ghost!.item)!.axis} signs={CARDS.find((c) => c.id === pp.ghost!.item)!.signs} />
        </div>
      )}
      {!locked && (
        <div style={{ position: 'absolute', left: 860, top: 800 }}>
          <button
            className="btn btn-primary"
            data-testid="check"
            disabled={tray.length > 0}
            onClick={() => {
              const bad = CARDS.filter((c) => placed[c.id] !== c.answer).map((c) => c.id);
              setWrong(bad);
              if (bad.length) setPlaced((p) => ({ ...p, ...Object.fromEntries(bad.map((id) => [id, null])) }));
              onCheck({ ok: bad.length === 0, hint: 's10.ipucu.sirala' });
            }}
          >
            Kontrol Et
          </button>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// 2–5) Bileşkeyi çiz
// ---------------------------------------------------------------------------
export interface DrawCfg {
  axis: Axis;
  scale: Scale;
  forces: TaskForce[];
  showValues: boolean;
  object: 'crate' | 'table' | 'rope';
  hints: string[];
}

/** Düşey görevlerde cisim biraz aşağıda çizilir (üst başlıkla çakışmasın) */
const V_DY = 70;

function forceOrigin(axis: Axis, f: TaskForce, i: number, n: number) {
  const half = OBJ.size / 2;
  if (axis === 'yatay') {
    const rows = n === 3 ? [-55, 0, 55] : [-24, 24];
    const x = f.at === 'bati' ? OBJ.x - half : f.at === 'dogu' ? OBJ.x + half : OBJ.x;
    return { x, y: OBJ.y + rows[i] };
  }
  const cols = n === 3 ? [-30, 0, 30] : [-18, 18];
  return { x: OBJ.x + cols[i], y: OBJ.y + V_DY };
}

function VerticalRCol() {
  return OBJ.x + 260;
}

export function DrawTask({ cfg, assist, locked, onCheck }: TaskProps & { cfg: DrawCfg }) {
  const [r, setR] = useState(0);
  const [tries, setTries] = useState(0);
  const forces = toForces(cfg.forces, cfg.axis);
  const truth = resultant(forces);
  const step = cfg.scale.newtonsPerCell;
  const maxR = 12 * step;
  const cell = cfg.scale.pxPerCell;
  const vertical = cfg.axis === 'dusey';
  const oy = vertical ? OBJ.y + V_DY : OBJ.y;
  const rOrigin = vertical ? { x: VerticalRCol(), y: oy } : { x: OBJ.x, y: R_ROW };

  return (
    <>
      <svg className="scene-svg" viewBox="0 0 1920 1080">
        {vertical ? (
          <Grid x={OBJ.x - 4 * cell} y={oy - 6 * cell} cols={11} rows={11} cell={cell} opacity={0.85} />
        ) : (
          <Grid x={OBJ.x - 9 * cell} y={OBJ.y - 2 * cell} cols={18} rows={5} cell={cell} opacity={0.85} />
        )}
        {cfg.object === 'table' ? <Table x={OBJ.x} y={OBJ.y + 40} /> : <Crate x={OBJ.x} y={oy} size={OBJ.size * (vertical ? 0.8 : 1)} />}
        {cfg.object === 'rope' && <line x1={OBJ.x} y1={oy - OBJ.size * 0.4} x2={OBJ.x} y2={oy - 310} stroke="#b48d50" strokeWidth={8} />}
        {cfg.forces.map((f, i) => {
          const o = forceOrigin(cfg.axis, f, i, cfg.forces.length);
          const cells = f.magnitude / step;
          return (
            <ForceArrow
              key={i}
              x={o.x}
              y={o.y}
              axis={cfg.axis}
              sign={f.sign}
              length={arrowLength(f.magnitude, cfg.scale)}
              magnitude={f.magnitude}
              showPoint
              label={`F${SUB[i]}${cfg.showValues ? ` = ${formatN(f.magnitude)}` : ''}${f.note ? ` (${f.note})` : ''}${assist ? ` · ${cells} kare` : ''}`}
              labelPos="tip"
              testId={`task-f${i + 1}`}
            />
          );
        })}
        {!vertical && (
          <text x={OBJ.x - 9 * cell - 20} y={R_ROW + 12} textAnchor="end" fontSize={32} fontWeight={750} fill="var(--resultant-dark)">
            R
          </text>
        )}
        <AdjustableArrow
          x={rOrigin.x}
          y={rOrigin.y}
          axis={cfg.axis}
          value={r}
          onChange={setR}
          scale={cfg.scale}
          max={maxR}
          step={step}
          allowFlip
          kind={locked ? 'resultant' : 'ghost'}
          disabled={locked}
          label={(v) => (v === 0 ? undefined : `R = ${formatN(Math.abs(v))}`)}
          labelPos="tip"
          trackHalf={vertical ? 40 : 34}
          testId="task-r"
        />
        <ScaleBadge x={160} y={vertical ? 640 : R_ROW + 70} cell={Math.min(cell, 50)} newtons={step} />
      </svg>
      {!locked && (
        <CheckButton
          onClick={() => {
            const drawn: Resultant = { magnitude: Math.abs(r), sign: r > 0 ? 1 : r < 0 ? -1 : 0, axis: cfg.axis };
            const ok = sameResultant(drawn, truth);
            const t = tries + 1;
            setTries(t);
            const hint = r === 0 && t === 1 ? 's10.ipucu.cizim' : cfg.hints[Math.min(t - 1, cfg.hints.length - 1)];
            onCheck({ ok, hint });
          }}
        />
      )}
      <div data-testid="task-truth" data-value={signedOf(truth)} style={{ display: 'none' }} />
    </>
  );
}

// ---------------------------------------------------------------------------
// 6) Eksik kuvvet
// ---------------------------------------------------------------------------
export function MissingTask({ assist, locked, onCheck }: TaskProps) {
  const scale: Scale = { newtonsPerCell: 1, pxPerCell: 50 };
  const target = 5;
  const F1 = -3;
  const [f2, setF2] = useState(1);
  const forces: Force[] = [
    { id: 'F1', magnitude: 3, sign: -1, axis: 'yatay' },
    { id: 'F2', magnitude: Math.abs(f2), sign: f2 < 0 ? -1 : 1, axis: 'yatay' },
  ];
  const live = resultant(forces);
  const half = OBJ.size / 2;
  return (
    <>
      <svg className="scene-svg" viewBox="0 0 1920 1080">
        <Grid x={OBJ.x - 12 * 50} y={OBJ.y - 2 * 50} cols={24} rows={5} cell={50} opacity={0.85} />
        <Crate x={OBJ.x} y={OBJ.y} size={OBJ.size} />
        <ForceArrow x={OBJ.x - half} y={OBJ.y - 22} axis="yatay" sign={-1} length={arrowLength(3, scale)} magnitude={3} showPoint label="F₁ = 3 N" labelPos="tip" testId="task-f1" />
        <AdjustableArrow
          x={OBJ.x + half}
          y={OBJ.y + 22}
          axis="yatay"
          value={f2}
          onChange={setF2}
          scale={scale}
          max={10}
          step={1}
          allowFlip
          disabled={locked}
          label={(v) => (v === 0 ? undefined : `F₂ = ${Math.abs(v)} N`)}
          labelPos="tip"
          trackHalf={30}
          testId="task-f2"
        />
        <text x={OBJ.x - 12 * 50 - 20} y={R_ROW + 12} textAnchor="end" fontSize={32} fontWeight={750} fill="var(--resultant-dark)">
          R
        </text>
        <ForceArrow x={OBJ.x} y={R_ROW} axis="yatay" sign={1} length={arrowLength(target, scale)} kind="resultant" magnitude={target} showPoint label="hedef: R = 5 N" labelPos="tip" testId="task-target" />
        {assist && live.sign !== 0 && (
          <ForceArrow x={OBJ.x} y={R_ROW + 50} axis="yatay" sign={live.sign} length={arrowLength(live.magnitude, scale)} kind="ghost" label={`şu an: ${live.magnitude} N`} labelPos="tip" />
        )}
        <ScaleBadge x={160} y={R_ROW + 90} cell={50} newtons={1} />
      </svg>
      {!locked && (
        <CheckButton
          onClick={() => {
            const ok = F1 + f2 === target;
            onCheck({ ok, hint: 's10.ipucu.eksik' });
          }}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// 7) En büyük / en küçük bileşke
// ---------------------------------------------------------------------------
export function MaxMinTask({ locked, onCheck, stage }: TaskProps & { stage: 'max' | 'min' }) {
  const scale: Scale = { newtonsPerCell: 1, pxPerCell: 40 };
  const mags = [3, 4, 5];
  const [signs, setSigns] = useState<Sign[]>([1, -1, 1]);
  const forces: Force[] = mags.map((m, i) => ({ id: `F${i + 1}`, magnitude: m, sign: signs[i], axis: 'yatay' }));
  const live = resultant(forces);
  const half = OBJ.size / 2;
  return (
    <>
      <svg className="scene-svg" viewBox="0 0 1920 1080">
        <Grid x={OBJ.x - 13 * 40} y={OBJ.y - 3 * 40} cols={26} rows={7} cell={40} opacity={0.85} />
        <Crate x={OBJ.x} y={OBJ.y} size={OBJ.size} />
        {forces.map((f, i) => (
          <ForceArrow
            key={i}
            x={f.sign === 1 ? OBJ.x + half : OBJ.x - half}
            y={OBJ.y - 40 + i * 40}
            axis="yatay"
            sign={f.sign}
            length={arrowLength(f.magnitude, scale)}
            magnitude={f.magnitude}
            showPoint
            label={`${f.magnitude} N`}
            labelPos="tip"
            testId={`task-f${i + 1}`}
            onPointerDown={
              locked
                ? undefined
                : () => {
                    sfx.tap();
                    setSigns((s) => s.map((x, j) => (j === i ? ((-x) as Sign) : x)));
                  }
            }
          />
        ))}
        <text x={OBJ.x - 13 * 40 - 20} y={R_ROW + 12} textAnchor="end" fontSize={32} fontWeight={750} fill="var(--resultant-dark)">
          R
        </text>
        {live.sign !== 0 && (
          <ForceArrow x={OBJ.x} y={R_ROW} axis="yatay" sign={live.sign} length={arrowLength(live.magnitude, scale)} kind="resultant" magnitude={live.magnitude} showPoint label={`R = ${live.magnitude} N`} labelPos="tip" testId="task-live-r" />
        )}
      </svg>
      {!locked && (
        <div style={{ position: 'absolute', left: 300, top: 760, display: 'flex', gap: 14 }}>
          {mags.map((m, i) => (
            <button
              key={i}
              className="chip"
              data-testid={`flip-${i + 1}`}
              onClick={() => {
                sfx.tap();
                setSigns((s) => s.map((x, j) => (j === i ? ((-x) as Sign) : x)));
              }}
            >
              {m} N: {signs[i] === 1 ? 'Doğu ►' : '◄ Batı'}
            </button>
          ))}
        </div>
      )}
      {!locked && (
        <CheckButton
          label={stage === 'max' ? 'En büyük bu mu?' : 'En küçük bu mu?'}
          onClick={() => {
            const ok = stage === 'max' ? live.magnitude === 12 : live.magnitude === 2;
            onCheck({ ok, hint: stage === 'max' ? 's10.ipucu.enbuyuk' : 's10.ipucu.enkucuk' });
          }}
        />
      )}
    </>
  );
}
