import { useState } from 'react';
import { Kid } from '../../../art/characters';
import { Ball } from '../../../art/objects';
import { useLatest, useScript, useSignal } from '../../../engine/react';
import { sfx } from '../../../engine/sfx';
import { throwHeight, timeToApex } from '../../../physics/motion';
import { ForceArrow } from '../../../ui/force/ForceArrow';
import { usePickAndPlace, type ZoneRect } from '../../../ui/interaction';
import { Feedback, ModelBadge, SuccessBurst } from '../../../ui/widgets';
import { FreezeBadge, GROUND_Y, Landscape, SceneSvg } from '../common';

type Moment = 'A' | 'B' | 'C';
type ArrowId = 'el' | 'yer' | 'yukari';

const ARROWS: Record<ArrowId, { name: string; sign: 1 | -1; len: number; dx: number }> = {
  el: { name: 'Elin itme kuvveti', sign: 1, len: 125, dx: 0 },
  yer: { name: 'Yerçekimi kuvveti', sign: -1, len: 62, dx: 0 },
  yukari: { name: 'Yukarı çıkma kuvveti', sign: 1, len: 100, dx: 40 },
};
const CORRECT: Record<Moment, ArrowId[]> = { A: ['el', 'yer'], B: ['yer'], C: ['yer'] };

const PANEL = { w: 500, h: 470, y: 210 };
const PX: Record<Moment, number> = { A: 140, B: 710, C: 1280 };
const TITLES: Record<Moment, string> = {
  A: 'A · Elde: el topu yukarı itiyor',
  B: 'B · Havada: yükselirken',
  C: 'C · Havada: düşerken',
};

// Atış animasyonu (sahnenin ilk bölümü)
const KID_X = 760;
const HAND_DX = 30;
const HOLD_Y = -160;
const RELEASE_Y = -330;
const PUSH_T = 0.38;
const BALL_R = 34;
const REVEAL_Y = 400;

function ballPos(m: Moment) {
  const x = PX[m] + (m === 'A' ? 225 : PANEL.w / 2);
  const ground = PANEL.y + PANEL.h - 36;
  if (m === 'A') return { x, y: ground - 215 * 0.85 - BALL_R * 0.85 };
  return { x, y: PANEL.y + 300 };
}

/** Sahne 4 — Yukarı atılan top: hareket ile o anda etki eden kuvvetleri ayırt etme. */
export function S04Top() {
  const [handY, setHandY] = useState(HOLD_Y);
  const [ballY, setBallY] = useState(GROUND_Y + HOLD_Y - BALL_R);
  const [phase, setPhase] = useState<'throw' | 'reveal' | 'moments' | 'done'>('throw');
  const [revealP, setRevealP] = useState(0);
  const [placed, setPlaced] = useState<Record<Moment, ArrowId[]>>({ A: [], B: [], C: [] });
  const [status, setStatus] = useState<Record<Moment, 'ok' | 'bad' | null>>({ A: null, B: null, C: null });
  const [fb, setFb] = useState<{ kind: 'ok' | 'hint'; text: string } | null>(null);
  const [burst, setBurst] = useState(false);
  const [highlightA, setHighlightA] = useState(false);
  const check = useSignal();
  const placedRef = useLatest(placed);

  const toggle = (m: Moment, a: ArrowId) => {
    if (status[m] === 'ok') return;
    sfx.place();
    setStatus((s) => ({ ...s, [m]: null }));
    setPlaced((p) => ({ ...p, [m]: p[m].includes(a) ? p[m].filter((x) => x !== a) : [...p[m], a] }));
  };

  const pp = usePickAndPlace<ArrowId, Moment>({
    disabled: phase !== 'moments',
    zones: (): ZoneRect<Moment>[] => (['A', 'B', 'C'] as Moment[]).map((m) => ({ id: m, x: PX[m], y: PANEL.y, w: PANEL.w, h: PANEL.h })),
    onPlace: (a, m) => {
      if (placedRef.current[m].includes(a)) return;
      toggle(m, a);
    },
  });

  useScript(async (s) => {
    const throwOnce = async () => {
      // El topu yukarı iterken (temas) top elle birlikte hızlanır
      await s.animate(HOLD_Y, RELEASE_Y, PUSH_T, (v) => {
        setHandY(v);
        setBallY(GROUND_Y + v - BALL_R);
      }, 'power2.in');
      // Temas biter: top yalnızca yerçekimi etkisinde (hava direnci ihmal)
      const releaseY = GROUND_Y + RELEASE_Y - BALL_R;
      const v0 = (2 * (HOLD_Y - RELEASE_Y)) / PUSH_T;
      const apex = 320;
      const g = (v0 * v0) / (2 * apex);
      const th = { v0, g };
      const total = 2 * timeToApex(th);
      await s.animate(0, total, total, (t) => setBallY(releaseY - throwHeight(th, t)), 'none');
      await s.animate(RELEASE_Y, HOLD_Y, 0.4, (v) => {
        setHandY(v);
        setBallY(GROUND_Y + v - BALL_R);
      }, 'power2.out');
    };

    await s.wait(0.5);
    await s.narrate('s4.a', { cues: [[0.15, () => void throwOnce()]] });
    await s.wait(0.6);
    await s.narrate('s4.b');
    await s.waitContinue();

    setPhase('reveal');
    await s.narrate('s4.c', { cues: [[0.3, () => void s.animate(0, 1, 0.9, setRevealP, 'power2.out')]] });
    await s.wait(0.4);

    setPhase('moments');
    s.narrateBg('s4.d');
    for (;;) {
      await s.waitFor(check);
      const p = placedRef.current;
      const st: Record<Moment, 'ok' | 'bad'> = { A: 'ok', B: 'ok', C: 'ok' };
      (['A', 'B', 'C'] as Moment[]).forEach((m) => {
        const want = CORRECT[m];
        const ok = want.length === p[m].length && want.every((a) => p[m].includes(a));
        st[m] = ok ? 'ok' : 'bad';
      });
      setStatus(st);
      if (st.A === 'ok' && st.B === 'ok' && st.C === 'ok') {
        sfx.success();
        setBurst(true);
        setFb({ kind: 'ok', text: 'Üç an da doğru!' });
        setPhase('done');
        await s.say('s4.dogru');
        break;
      }
      sfx.retry();
      // En öğretici geri bildirimi seç
      let id = 's4.fb.yercekimi';
      let text = 'Dünya topu her an çeker.';
      if (p.B.includes('yukari') || p.C.includes('yukari') || p.A.includes('yukari')) {
        id = 's4.fb.yukari';
        text = 'Topa değmeyen el, ona kuvvet uygulayamaz.';
      } else if (p.B.includes('el') || p.C.includes('el')) {
        id = 's4.fb.elhavada';
        text = 'Havadaki topa el değmiyor.';
      } else if (!p.A.includes('yer') || !p.B.includes('yer') || !p.C.includes('yer')) {
        id = 's4.fb.yercekimi';
        text = 'Yerçekimi kuvveti her an etki eder.';
      } else if (!p.A.includes('el')) {
        id = 's4.fb.el';
        text = 'A anında el topa değiyor ve onu itiyor.';
      }
      setFb({ kind: 'hint', text });
      await s.say(id);
    }
    await s.wait(0.6);
    setBurst(false);
    setFb(null);
    setHighlightA(true);
    await s.narrate('s4.end');
    s.complete();
  });

  const throwing = phase === 'throw' || phase === 'reveal';
  const handWorldX = KID_X + HAND_DX;

  return (
    <>
      <SceneSvg>
        <g className={`time-freeze ${phase === 'reveal' ? 'frozen' : ''}`}>
          <Landscape />
        </g>
        {throwing && (
          <g>
            <Kid x={KID_X} y={GROUND_Y} pose="lift" handY={handY} shirt="#6a8fd8" hair="#2d211b" hairStyle="curly" />
            {phase === 'throw' && <Ball x={handWorldX} y={ballY} />}
            {phase === 'reveal' && (
              <g>
                <Ball x={handWorldX + 200} y={REVEAL_Y} />
                <circle cx={handWorldX + 200} cy={REVEAL_Y} r={70} fill="none" stroke="#fff" strokeWidth={5} strokeDasharray="10 12" />
                <ForceArrow
                  x={handWorldX + 200}
                  y={REVEAL_Y}
                  axis="dusey"
                  sign={-1}
                  length={110}
                  progress={revealP}
                  showPoint={revealP > 0}
                  label={revealP > 0.6 ? 'Yerçekimi kuvveti' : undefined}
                  labelPos="right"
                  labelGap={38}
                  testId="arrow-ball-gravity"
                />
                <FreezeBadge x={handWorldX + 200} y={REVEAL_Y - 150} />
              </g>
            )}
          </g>
        )}

        {(phase === 'moments' || phase === 'done') &&
          (['A', 'B', 'C'] as Moment[]).map((m) => {
            const x = PX[m];
            const b = ballPos(m);
            const st = status[m];
            const border =
              pp.hover === m || (pp.selected && st !== 'ok') ? 'var(--interact)' : st === 'ok' ? 'var(--success)' : st === 'bad' ? 'var(--hint)' : '#c9d1dd';
            const ground = PANEL.y + PANEL.h - 36;
            return (
              <g
                key={m}
                data-testid={`moment-${m}`}
                data-arrows={placed[m].slice().sort().join(',')}
                onPointerUp={() => {
                  if (pp.selected) {
                    const sel = pp.selected;
                    pp.setSelected(null);
                    toggle(m, sel);
                  }
                }}
                style={{ cursor: pp.selected ? 'pointer' : 'default' }}
              >
                <rect x={x} y={PANEL.y} width={PANEL.w} height={PANEL.h} rx={28} fill="#f5fbff" stroke={border} strokeWidth={st || pp.selected ? 7 : 4} />
                {m === 'A' && highlightA && <rect x={x - 8} y={PANEL.y - 8} width={PANEL.w + 16} height={PANEL.h + 16} rx={34} className="glow-ring" />}
                <rect x={x + 4} y={ground} width={PANEL.w - 8} height={32} fill="#a8d08a" />
                <text x={x + 24} y={PANEL.y + 46} fontSize={26} fontWeight={700} fill="var(--ink)">
                  {TITLES[m]}
                </text>
                {m === 'A' && <Kid x={x + 190} y={ground} s={0.85} pose="lift" handY={-215} shirt="#6a8fd8" hair="#2d211b" hairStyle="curly" />}
                {m !== 'A' && (
                  <g opacity={0.75}>
                    <line x1={x + 80} y1={PANEL.y + 200} x2={x + 80} y2={PANEL.y + 360} stroke="#8994a6" strokeWidth={4} strokeDasharray="3 9" strokeLinecap="round" />
                    <path
                      d={m === 'B' ? `M${x + 80} ${PANEL.y + 180} l-14 24 h28z` : `M${x + 80} ${PANEL.y + 380} l-14 -24 h28z`}
                      fill="#8994a6"
                    />
                    <text x={x + 80} y={PANEL.y + 405} textAnchor="middle" fontSize={22} fontWeight={600} fill="#6b768a">
                      hareket
                    </text>
                  </g>
                )}
                <Ball x={b.x} y={b.y} s={m === 'A' ? 0.85 : 1} />
                {placed[m].map((a) => (
                  <ForceArrow
                    key={a}
                    x={b.x + ARROWS[a].dx}
                    y={b.y}
                    axis="dusey"
                    sign={ARROWS[a].sign}
                    length={ARROWS[a].len}
                    kind={a === 'yukari' ? 'neutral' : 'force'}
                    testId={`placed-${m}-${a}`}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      toggle(m, a);
                    }}
                  />
                ))}
                {st === 'ok' && (
                  <g transform={`translate(${x + PANEL.w - 46} ${PANEL.y + 38})`}>
                    <circle r={24} fill="var(--success)" />
                    <path d="M-10 0 l7 7 l13 -14" stroke="#fff" strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </g>
                )}
              </g>
            );
          })}
        {burst && <SuccessBurst x={960} y={430} r={180} />}
      </SceneSvg>

      {phase === 'throw' && <ModelBadge>Model: hava direnci ihmal edildi</ModelBadge>}

      {phase === 'moments' && (
        <div className="fade-in" style={{ position: 'absolute', left: 140, right: 140, top: 700, display: 'flex', gap: 18, alignItems: 'center', justifyContent: 'center' }}>
          {(Object.keys(ARROWS) as ArrowId[]).map((a) => (
            <button key={a} className={`chip ${pp.selected === a ? 'selected' : ''}`} data-testid={`tray-${a}`} {...pp.itemProps(a)}>
              <svg width="30" height="56" viewBox="0 0 30 56" aria-hidden="true">
                {ARROWS[a].sign === 1 ? (
                  <path d="M15 52 V16 M5 20 L15 4 L25 20 Z" stroke={a === 'yukari' ? '#7b879b' : 'var(--force)'} fill={a === 'yukari' ? '#7b879b' : 'var(--force)'} strokeWidth={6} strokeLinecap="round" />
                ) : (
                  <path d="M15 4 V40 M5 36 L15 52 L25 36 Z" stroke="var(--force)" fill="var(--force)" strokeWidth={6} strokeLinecap="round" />
                )}
              </svg>
              {ARROWS[a].name}
            </button>
          ))}
          <button className="btn btn-primary" data-testid="check" style={{ marginLeft: 12 }} onClick={() => check.fire()}>
            Kontrol Et
          </button>
        </div>
      )}

      {pp.ghost && (
        <div className="chip selected" style={{ position: 'absolute', left: pp.ghost.x - 150, top: pp.ghost.y - 44, pointerEvents: 'none', zIndex: 30 }}>
          {ARROWS[pp.ghost.item].name}
        </div>
      )}
      {fb && <Feedback token={fb} kind={fb.kind} style={{ left: '50%', transform: 'translateX(-50%)', top: 112 }}>{fb.text}</Feedback>}
      {phase === 'moments' && !fb && (
        <div className="prompt-card fade-in" style={{ top: 112, fontSize: 28, padding: '14px 32px' }}>
          Bir oka, sonra topun bulunduğu ana dokunun.
        </div>
      )}
    </>
  );
}
