import { useState } from 'react';
import { useLatest, useScript, useSignal } from '../../../engine/react';
import { sfx } from '../../../engine/sfx';
import { arrowLength, formatN, type Force } from '../../../physics/forces';
import { ForceArrow } from '../../../ui/force/ForceArrow';
import { usePickAndPlace, type ZoneRect } from '../../../ui/interaction';
import { Feedback, ModelBadge, SuccessBurst } from '../../../ui/widgets';
import { GRAVITY, KALKIS_LIFT, MOTOR, RK, RK_CENTER, RK_SCALE, RocketBackdrop, RocketGauge, RocketGrid, RocketOnPad, RocketScaleBadge } from '../rocket';
import { FreezeBadge, SceneSvg } from '../common';

type Item = 'motor' | 'yer';
type Zone = 'up' | 'down';
const FORCES: Record<Item, Force> = { motor: MOTOR, yer: GRAVITY };

const ZONES: Record<Zone, { x: number; y: number; w: number; h: number }> = {
  up: { x: RK.x - 90, y: RK_CENTER.y - 430, w: 180, h: 400 },
  down: { x: RK.x - 90, y: RK_CENTER.y + 20, w: 180, h: 130 },
};

/** Sahne 6 — Roket: zıt yönlü iki kuvveti doğru yönlere yerleştirme. */
export function S06Roket() {
  const [phase, setPhase] = useState<'intro' | 'place' | 'done'>('intro');
  const [placed, setPlaced] = useState<Record<Zone, Item | null>>({ up: null, down: null });
  const [fb, setFb] = useState<{ kind: 'ok' | 'hint'; text: string } | null>(null);
  const [burst, setBurst] = useState(false);
  const [frozen, setFrozen] = useState(false);
  const [lift, setLift] = useState(0);
  const [grid, setGrid] = useState(false);
  const check = useSignal();
  const placedRef = useLatest(placed);

  const pp = usePickAndPlace<Item, Zone>({
    disabled: phase !== 'place',
    zones: (): ZoneRect<Zone>[] => (Object.keys(ZONES) as Zone[]).map((z) => ({ id: z, ...ZONES[z] })),
    onPlace: (item, zone) => {
      sfx.place();
      setFb(null);
      setPlaced((p) => {
        const n = { ...p };
        (Object.keys(n) as Zone[]).forEach((z) => {
          if (n[z] === item) n[z] = null;
        });
        n[zone] = item;
        return n;
      });
    },
  });

  useScript(async (s) => {
    // Motor ateşlenir, roket rampadan ayrılırken zaman durdurulur
    await s.animate(0, KALKIS_LIFT, 0.9, setLift, 'power2.in');
    setFrozen(true);
    await s.wait(0.3);
    await s.narrate('s6.a');
    await s.narrate('s6.b');
    setGrid(true);
    setPhase('place');
    s.narrateBg('s6.c');
    for (;;) {
      await s.waitFor(check);
      const p = placedRef.current;
      if (!p.up || !p.down) {
        sfx.retry();
        setFb({ kind: 'hint', text: 'İki kuvveti de yerleştirin.' });
        await s.say('s6.fb.eksik');
        continue;
      }
      if (p.up === 'motor' && p.down === 'yer') {
        sfx.success();
        setBurst(true);
        setFb({ kind: 'ok', text: 'Motor kuvveti yukarı, yerçekimi kuvveti aşağı!' });
        setPhase('done');
        await s.say('s6.fb.dogru');
        break;
      }
      sfx.retry();
      setFb({ kind: 'hint', text: 'Yerçekimi hangi yönde etki ediyordu?' });
      await s.say('s6.fb.yanlis');
      setPlaced({ up: null, down: null });
    }
    await s.wait(0.5);
    setBurst(false);
    s.complete();
  });

  const inTray = (['motor', 'yer'] as Item[]).filter((i) => !Object.values(placed).includes(i));

  return (
    <>
      <SceneSvg>
        <RocketBackdrop dim={frozen} />
        {grid && <RocketGrid />}
        <RocketGauge />
        <RocketOnPad lift={lift} flame={lift > 0 ? 1 : 0.35} />
        {phase === 'place' &&
          (Object.keys(ZONES) as Zone[]).map((z) => {
            const r = ZONES[z];
            const active = pp.hover === z || (pp.selected && !placed[z]);
            return (
              <rect
                key={z}
                x={r.x}
                y={r.y}
                width={r.w}
                height={r.h}
                rx={22}
                fill={active ? 'rgba(109,74,255,0.12)' : 'rgba(255,255,255,0.18)'}
                stroke={active ? 'var(--interact)' : '#8b97aa'}
                strokeWidth={4}
                strokeDasharray="12 10"
                data-testid={`zone-${z}`}
                onPointerUp={() => pp.tapZone(z)}
                style={{ cursor: pp.selected ? 'pointer' : 'default' }}
              />
            );
          })}
        {(Object.keys(placed) as Zone[]).map((z) => {
          const it = placed[z];
          if (!it) return null;
          const f = FORCES[it];
          return (
            <ForceArrow
              key={z}
              x={RK_CENTER.x}
              y={RK_CENTER.y}
              axis="dusey"
              sign={z === 'up' ? 1 : -1}
              length={arrowLength(f.magnitude, RK_SCALE)}
              magnitude={f.magnitude}
              showPoint
              label={`${it === 'motor' ? 'F₁' : 'F₂'} = ${formatN(f.magnitude)}`}
              sublabel={it === 'motor' ? 'motor' : 'yerçekimi'}
              labelPos="left"
              labelGap={z === 'up' ? 120 : 120}
              testId={`placed-${z}-${it}`}
              onPointerDown={phase === 'place' ? () => setPlaced((p) => ({ ...p, [z]: null })) : undefined}
            />
          );
        })}
        {grid && <RocketScaleBadge />}
        {frozen && <FreezeBadge x={1300} y={160} />}
        {burst && <SuccessBurst x={RK_CENTER.x} y={RK_CENTER.y - 100} r={170} />}
      </SceneSvg>

      <ModelBadge>Model: hava direnci ihmal edildi · Değerler temsilîdir</ModelBadge>

      {phase === 'place' && (
        <div className="panel fade-in" style={{ left: 1240, top: 300, width: 560 }} data-testid="force-tray">
          <h3>Rokete etki eden kuvvetler</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {inTray.map((i) => (
              <button key={i} className={`chip ${pp.selected === i ? 'selected' : ''}`} data-testid={`chip-${i}`} {...pp.itemProps(i)}>
                <span style={{ width: 16, height: 40, borderRadius: 6, background: 'var(--force)' }} />
                {FORCES[i].name} · {formatN(FORCES[i].magnitude)}
              </button>
            ))}
            {inTray.length === 0 && <div style={{ fontSize: 24, color: 'var(--ink-soft)' }}>İki kuvvet de yerleştirildi. Değiştirmek için oka dokunun.</div>}
          </div>
          <button className="btn btn-primary" style={{ marginTop: 24, width: '100%' }} data-testid="check" onClick={() => check.fire()}>
            Kontrol Et
          </button>
        </div>
      )}
      {pp.ghost && (
        <div className="chip selected" style={{ position: 'absolute', left: pp.ghost.x - 170, top: pp.ghost.y - 44, pointerEvents: 'none', zIndex: 30 }}>
          {FORCES[pp.ghost.item].name}
        </div>
      )}
      {fb && <Feedback token={fb} kind={fb.kind} style={{ left: '50%', transform: 'translateX(-50%)', top: 112 }}>{fb.text}</Feedback>}
    </>
  );
}
