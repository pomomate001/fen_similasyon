import { useState } from 'react';
import { Kid } from '../../../art/characters';
import { Apple } from '../../../art/nature';
import { AppleBag, Crate } from '../../../art/objects';
import { useLatest, useScript, useSignal } from '../../../engine/react';
import { sfx } from '../../../engine/sfx';
import { ForceArrow } from '../../../ui/force/ForceArrow';
import { EastWestStrip, Grid, ScaleBadge } from '../../../ui/force/Grid';
import { usePickAndPlace, type ZoneRect } from '../../../ui/interaction';
import { Feedback, SuccessBurst } from '../../../ui/widgets';
import { Landscape, SceneSvg } from '../common';

/** Ölçek: 1 kare = 1 N = 120 px */
const CELL = 120;
const A = { x: 720, y: 450 };
const TIP = { x: A.x, y: A.y + CELL };

type Prop = 'nokta' | 'yon' | 'dogrultu' | 'buyukluk';
const PROPS: Array<{ id: Prop; name: string }> = [
  { id: 'nokta', name: 'Uygulama noktası' },
  { id: 'yon', name: 'Yön' },
  { id: 'dogrultu', name: 'Doğrultu' },
  { id: 'buyukluk', name: 'Büyüklük' },
];

const SLOT_W = 300;
const SLOT_H = 80;
const SLOTS: Record<Prop, { x: number; y: number; to: { x: number; y: number }; info: string }> = {
  nokta: { x: 250, y: 410, to: { x: A.x - 14, y: A.y }, info: 'Uygulama noktası' },
  buyukluk: { x: 250, y: 560, to: { x: 652, y: A.y + CELL / 2 }, info: 'Büyüklük: 1 N' },
  dogrultu: { x: 800, y: 196, to: { x: A.x + 4, y: 250 }, info: 'Doğrultu: düşey' },
  yon: { x: 1000, y: 560, to: { x: A.x + 16, y: TIP.y - 8 }, info: 'Yön: aşağı' },
};

type Phase = 'intro' | 'nokta' | 'yon' | 'dogrultu' | 'buyukluk' | 'bags' | 'label' | 'labelDone' | 'transfer' | 'done';
const ORDER: Phase[] = ['intro', 'nokta', 'yon', 'dogrultu', 'buyukluk', 'bags', 'label', 'labelDone', 'transfer', 'done'];
const atLeast = (p: Phase, q: Phase) => ORDER.indexOf(p) >= ORDER.indexOf(q);

/** Sahne 3 — Kuvvetin dört özelliği: uygulama noktası, yön, doğrultu, büyüklük. */
export function S03Ozellikler() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [grid, setGrid] = useState(false);
  const [bagsP, setBagsP] = useState(0);
  const [lineP, setLineP] = useState(0);
  const [placed, setPlaced] = useState<Record<Prop, Prop | null>>({ nokta: null, yon: null, dogrultu: null, buyukluk: null });
  const [locked, setLocked] = useState<Prop[]>([]);
  const [wrong, setWrong] = useState<Prop[]>([]);
  const [yon, setYon] = useState<string | null>(null);
  const [dogrultu, setDogrultu] = useState<string | null>(null);
  const [tWrong, setTWrong] = useState<string[]>([]);
  const [burst, setBurst] = useState<{ x: number; y: number } | null>(null);
  const [fb, setFb] = useState<{ kind: 'ok' | 'hint'; text: string } | null>(null);

  const checkLabels = useSignal();
  const checkTransfer = useSignal();
  const placedRef = useLatest(placed);
  const transferRef = useLatest({ yon, dogrultu });

  const inTray = PROPS.filter((p) => !Object.values(placed).includes(p.id));

  const pp = usePickAndPlace<Prop, Prop>({
    disabled: phase !== 'label',
    zones: (): ZoneRect<Prop>[] =>
      (Object.keys(SLOTS) as Prop[]).filter((z) => !locked.includes(z)).map((z) => ({ id: z, x: SLOTS[z].x, y: SLOTS[z].y, w: SLOT_W, h: SLOT_H })),
    onPlace: (item, zone) => {
      sfx.place();
      setWrong((w) => w.filter((x) => x !== zone));
      setPlaced((prev) => {
        const next = { ...prev };
        (Object.keys(next) as Prop[]).forEach((k) => {
          if (next[k] === item) next[k] = null;
        });
        next[zone] = item;
        return next;
      });
    },
  });

  useScript(async (s) => {
    await s.narrate('s3.intro');
    setPhase('nokta');
    await s.narrate('s3.nokta');
    setPhase('yon');
    await s.narrate('s3.yon');
    setPhase('dogrultu');
    await s.narrate('s3.dogrultu', { cues: [[0.15, () => void s.animate(0, 1, 1.0, setLineP, 'power2.out')]] });
    setPhase('buyukluk');
    await s.narrate('s3.buyukluk1');
    setGrid(true);
    await s.narrate('s3.buyukluk2');
    setPhase('bags');
    await s.narrate('s3.buyukluk3', { cues: [[0.05, () => void s.animate(0, 1, 2.2, setBagsP, 'power1.inOut')]] });
    await s.wait(0.5);

    // Etkinlik: etiketleri yerleştir
    setPhase('label');
    s.narrateBg('s3.etkinlik');
    for (;;) {
      await s.waitFor(checkLabels);
      const p = placedRef.current;
      const bad = (Object.keys(p) as Prop[]).filter((z) => p[z] !== z);
      const good = (Object.keys(p) as Prop[]).filter((z) => p[z] === z);
      setLocked(good);
      if (bad.length === 0) {
        sfx.success();
        setBurst({ x: A.x, y: A.y + 60 });
        setFb({ kind: 'ok', text: 'Dört özelliği de doğru yerleştirdiniz!' });
        setPhase('labelDone');
        await s.say('s3.etkinlik.dogru');
        break;
      }
      sfx.retry();
      setWrong(bad);
      setFb({ kind: 'hint', text: `${good.length} etiket doğru. Turuncu çerçeveli etiketleri yeniden düşünün.` });
      setPlaced((prev) => {
        const next = { ...prev };
        bad.forEach((z) => (next[z] = null));
        return next;
      });
      await s.say('s3.etkinlik.ipucu');
    }
    await s.wait(0.6);
    setFb(null);
    setBurst(null);

    // Transfer: yatay kuvvet
    setPhase('transfer');
    s.narrateBg('s3.transfer');
    for (;;) {
      await s.waitFor(checkTransfer);
      const { yon: y, dogrultu: d } = transferRef.current;
      const errs: string[] = [];
      if (y !== 'doğu') errs.push('yon');
      if (d !== 'doğu–batı') errs.push('dogrultu');
      setTWrong(errs);
      if (errs.length === 0) {
        sfx.success();
        setBurst({ x: 1040, y: 520 });
        setFb({ kind: 'ok', text: 'Yön: doğu · Doğrultu: doğu–batı' });
        setPhase('done');
        await s.say('s3.transfer.dogru');
        break;
      }
      sfx.retry();
      setFb({ kind: 'hint', text: errs.includes('yon') ? 'Okun ucu hangi tarafı gösteriyor?' : 'Doğrultu iki zıt yönü kapsar.' });
      await s.say(errs.includes('yon') ? 's3.transfer.ipucu.yon' : 's3.transfer.ipucu.dogrultu');
    }
    s.complete();
  });

  const showApple = !atLeast(phase, 'transfer');
  const explaining = !atLeast(phase, 'label');
  const listActive: Prop | null =
    phase === 'nokta' ? 'nokta' : phase === 'yon' ? 'yon' : phase === 'dogrultu' ? 'dogrultu' : phase === 'buyukluk' ? 'buyukluk' : null;
  const shownInfo: Prop[] = explaining
    ? (['nokta', 'yon', 'dogrultu', 'buyukluk'] as Prop[]).filter((p) => atLeast(phase, p))
    : [];

  return (
    <>
      <SceneSvg>
        <Landscape />
        <rect width={1920} height={1080} fill="#fbf8f2" opacity={0.6} />

        {showApple && (
          <g data-testid="apple-diagram">
            {grid && (
              <g className="fade-in">
                <Grid x={600} y={330} cols={3} rows={3} cell={CELL} testId="grid-apple" />
              </g>
            )}
            {lineP > 0 && (
              <g>
                <line
                  x1={A.x}
                  y1={A.y - (A.y - 140) * lineP}
                  x2={A.x}
                  y2={A.y + (840 - A.y) * lineP}
                  stroke="var(--direction-line)"
                  strokeWidth={5}
                  strokeDasharray="16 14"
                  data-testid="direction-line"
                />
                {phase === 'dogrultu' && (
                  <>
                    <ForceArrow x={A.x - 70} y={300} axis="dusey" sign={1} length={110} kind="neutral" opacity={0.6 * lineP} label="yukarı" labelPos="left" />
                    <ForceArrow x={A.x - 70} y={680} axis="dusey" sign={-1} length={110} kind="neutral" opacity={0.6 * lineP} label="aşağı" labelPos="left" />
                  </>
                )}
              </g>
            )}
            <Apple x={A.x} y={A.y} s={1.05} />
            <ForceArrow
              x={A.x}
              y={A.y}
              axis="dusey"
              sign={-1}
              length={CELL}
              magnitude={1}
              showPoint
              highlightPoint={phase === 'nokta'}
              highlightHead={phase === 'yon'}
              testId="arrow-apple"
            />
            {atLeast(phase, 'buyukluk') && (
              <g className="fade-in" data-testid="length-bracket">
                <path d={`M666 ${A.y} h-14 v${CELL} h14`} fill="none" stroke="var(--force-dark)" strokeWidth={4} />
                {phase === 'buyukluk' && <rect x={638} y={A.y - 6} width={40} height={CELL + 12} rx={10} className="glow-ring" />}
              </g>
            )}
            {grid && <ScaleBadge x={600} y={716} cell={44} newtons={1} />}

            {/* açıklama etiketleri ve etkinlik yuvaları için bağlantı çizgileri */}
            {(Object.keys(SLOTS) as Prop[]).map((z) => {
              const sl = SLOTS[z];
              const visible = shownInfo.includes(z) || !explaining;
              if (!visible) return null;
              const fromX = sl.x > A.x ? sl.x : sl.x + SLOT_W;
              return (
                <line key={z} x1={fromX} y1={sl.y + SLOT_H / 2} x2={sl.to.x} y2={sl.to.y} stroke="#7d8aa0" strokeWidth={3} strokeDasharray="4 7" />
              );
            })}
          </g>
        )}

        {phase === 'bags' || (bagsP > 0 && explaining) ? (
          <g data-testid="bags">
            <Grid x={1260} y={270} cols={5} rows={4} cell={CELL} opacity={Math.min(1, bagsP * 3)} />
            {([1, 2, 3] as const).map((n, i) => {
              const bx = 1320 + i * 2 * CELL;
              const local = Math.max(0, Math.min(1, bagsP * 3 - i));
              return (
                <g key={n} opacity={local > 0 ? 1 : 0}>
                  <ForceArrow x={bx} y={390} axis="dusey" sign={-1} length={n * CELL} progress={local} magnitude={n} label={`${n} N`} labelPos="tip" testId={`arrow-bag-${n}`} />
                  <g transform={`translate(${bx} 390) scale(0.7) translate(${-bx} -390)`}>
                    <AppleBag x={bx} y={390} n={n} />
                  </g>
                </g>
              );
            })}
          </g>
        ) : null}

        {phase === 'transfer' || phase === 'done' ? (
          <g className="fade-in" data-testid="crate-diagram">
            <rect x={160} y={300} width={1040} height={520} rx={34} fill="#fff" opacity={0.9} />
            <path d="M200 700 H1160" stroke="#c7b9a0" strokeWidth={6} />
            <Kid x={430} y={700} pose="push" shirt="#e0a43a" hair="#4a3426" hairStyle="long" />
            <Crate x={620} y={620} size={160} />
            <ForceArrow x={540} y={590} axis="yatay" sign={1} length={360} showPoint label="F" labelPos="above" magnitude={10} testId="arrow-crate" />
            <EastWestStrip x={260} y={770} width={840} />
          </g>
        ) : null}

        {burst && <SuccessBurst x={burst.x} y={burst.y} />}
      </SceneSvg>

      {/* Sağ panel: dört özellik listesi (açıklama sırasında) */}
      {explaining && phase !== 'bags' && (
        <div className="panel fade-in" style={{ left: 1320, top: 260, width: 520 }} data-testid="prop-list">
          <h3>Kuvvetin özellikleri</h3>
          {PROPS.map((p, i) => (
            <div
              key={p.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '14px 18px',
                margin: '8px 0',
                borderRadius: 18,
                fontSize: 30,
                fontWeight: 650,
                background: listActive === p.id ? 'var(--hint-soft)' : 'transparent',
                color: atLeast(phase, p.id) || phase === 'intro' ? 'var(--ink)' : 'var(--ink-faint)',
                transition: 'background .3s',
              }}
            >
              <span style={{ width: 44, height: 44, borderRadius: 22, background: listActive === p.id ? 'var(--point)' : 'var(--paper-2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                {i + 1}
              </span>
              {p.name}
            </div>
          ))}
        </div>
      )}

      {/* Açıklama etiketleri */}
      {shownInfo.map((z) => (
        <div
          key={z}
          className="fade-in"
          style={{
            position: 'absolute',
            left: SLOTS[z].x,
            top: SLOTS[z].y,
            width: SLOT_W,
            height: SLOT_H,
            borderRadius: 18,
            background: '#fff',
            border: `4px solid ${listActive === z ? 'var(--point)' : 'var(--line-ui)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 27,
            fontWeight: 650,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {SLOTS[z].info}
        </div>
      ))}

      {/* Etkinlik: yuvalar */}
      {(phase === 'label' || phase === 'labelDone') &&
        (Object.keys(SLOTS) as Prop[]).map((z) => {
          const it = placed[z];
          const isLocked = locked.includes(z);
          return (
            <div
              key={z}
              data-testid={`slot-${z}`}
              onPointerUp={(e) => {
                if ((e.target as HTMLElement).closest('button')) return;
                pp.tapZone(z);
              }}
              style={{
                position: 'absolute',
                left: SLOTS[z].x,
                top: SLOTS[z].y,
                width: SLOT_W,
                height: SLOT_H,
                borderRadius: 18,
                border: `4px dashed ${pp.hover === z || (pp.selected && !it) ? 'var(--interact)' : wrong.includes(z) ? 'var(--hint)' : '#aab4c4'}`,
                background: pp.hover === z ? 'var(--interact-soft)' : 'rgba(255,255,255,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 30,
                color: 'var(--ink-faint)',
                cursor: pp.selected ? 'pointer' : 'default',
              }}
            >
              {it ? (
                <button
                  className={`chip ${isLocked ? 'correct' : ''}`}
                  style={{ width: SLOT_W - 16, minHeight: SLOT_H - 16, fontSize: 26, padding: '0 10px' }}
                  disabled={isLocked}
                  {...(isLocked ? {} : pp.itemProps(it))}
                >
                  {PROPS.find((p) => p.id === it)!.name}
                </button>
              ) : (
                '?'
              )}
            </div>
          );
        })}

      {phase === 'label' && (
        <div className="panel fade-in" style={{ left: 1320, top: 230, width: 520 }}>
          <h3>Etiketler</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {inTray.map((p) => (
              <button key={p.id} className={`chip ${pp.selected === p.id ? 'selected' : ''}`} data-testid={`chip-${p.id}`} {...pp.itemProps(p.id)}>
                {p.name}
              </button>
            ))}
            {inTray.length === 0 && <div style={{ fontSize: 24, color: 'var(--ink-soft)' }}>Tüm etiketler yerleştirildi.</div>}
          </div>
          <button
            className="btn btn-primary"
            style={{ marginTop: 24, width: '100%' }}
            disabled={inTray.length > 0}
            data-testid="check"
            onClick={() => {
              pp.setSelected(null);
              checkLabels.fire();
            }}
          >
            Kontrol Et
          </button>
        </div>
      )}

      {(phase === 'transfer' || phase === 'done') && (
        <div className="panel fade-in" style={{ left: 1260, top: 280, width: 600 }} data-testid="transfer-panel">
          <h3>Yön</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 22 }}>
            {['doğu', 'batı', 'yukarı', 'aşağı'].map((o) => (
              <button
                key={o}
                className={`chip ${yon === o ? (phase === 'done' ? 'correct' : 'selected') : ''} ${tWrong.includes('yon') && yon === o ? 'hint' : ''}`}
                disabled={phase === 'done'}
                data-testid={`yon-${o}`}
                onClick={() => {
                  sfx.tap();
                  setYon(o);
                  setTWrong((w) => w.filter((x) => x !== 'yon'));
                }}
              >
                {o[0].toLocaleUpperCase('tr') + o.slice(1)}
              </button>
            ))}
          </div>
          <h3>Doğrultu</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {['doğu–batı', 'düşey'].map((o) => (
              <button
                key={o}
                className={`chip ${dogrultu === o ? (phase === 'done' ? 'correct' : 'selected') : ''} ${tWrong.includes('dogrultu') && dogrultu === o ? 'hint' : ''}`}
                disabled={phase === 'done'}
                data-testid={`dogrultu-${o}`}
                onClick={() => {
                  sfx.tap();
                  setDogrultu(o);
                  setTWrong((w) => w.filter((x) => x !== 'dogrultu'));
                }}
              >
                {o[0].toLocaleUpperCase('tr') + o.slice(1)}
              </button>
            ))}
          </div>
          <button
            className="btn btn-primary"
            style={{ marginTop: 26, width: '100%' }}
            disabled={!yon || !dogrultu || phase === 'done'}
            data-testid="check"
            onClick={() => checkTransfer.fire()}
          >
            Kontrol Et
          </button>
        </div>
      )}

      {pp.ghost && (
        <div className="chip selected" style={{ position: 'absolute', left: pp.ghost.x - 140, top: pp.ghost.y - 44, width: 280, pointerEvents: 'none', zIndex: 30, opacity: 0.92 }}>
          {PROPS.find((p) => p.id === pp.ghost!.item)!.name}
        </div>
      )}

      {fb && <Feedback token={fb} kind={fb.kind} style={{ left: '50%', transform: 'translateX(-50%)', top: 118 }}>{fb.text}</Feedback>}
      {phase === 'transfer' && !fb && <div className="prompt-card fade-in">Kutuya uygulanan kuvvetin yönü ve doğrultusu nedir?</div>}
    </>
  );
}
