import { useState } from 'react';
import { Kid, Robot } from '../../../art/characters';
import { Cart } from '../../../art/objects';
import { useLatest, useScript, useSignal } from '../../../engine/react';
import { sfx } from '../../../engine/sfx';
import { arrowLength, equation, resultant, type Force, type Scale } from '../../../physics/forces';
import { positionFromRest } from '../../../physics/motion';
import { AdjustableArrow } from '../../../ui/force/AdjustableArrow';
import { ForceArrow } from '../../../ui/force/ForceArrow';
import { EastWestStrip, Grid, ScaleBadge } from '../../../ui/force/Grid';
import { Feedback, ModelBadge, RuleCard, Stepper, SuccessBurst } from '../../../ui/widgets';
import { Landscape, SceneSvg } from '../common';
import { T } from '../timings';

const SCALE: Scale = { newtonsPerCell: 10, pxPerCell: 50 };
/** Uç uca ekleme diyagramının ölçeği (daha büyük çizim) */
const DSCALE: Scale = { newtonsPerCell: 10, pxPerCell: 70 };
const G1 = 470; // 1. şerit zemini
const G2 = 820; // 2. şerit zemini
const START_X = 520;
/** Doğru kuvvette (50 N) arabanın yarış boyunca aldığı yol (px) */
const RACE_DIST = 600;

const F1: Force = { id: 'itme', magnitude: 30, sign: 1, axis: 'yatay' };
const F2: Force = { id: 'cekme', magnitude: 20, sign: 1, axis: 'yatay' };
const R = resultant([F1, F2]);

/** Sahne 5 — Aynı yönlü kuvvetler ve bileşke kuvvetin tanımı ("aynı etkiyi tek başına yapan kuvvet"). */
export function S05Araba() {
  const [robotF, setRobotF] = useState(10);
  const [x1, setX1] = useState(0);
  const [x2, setX2] = useState(0);
  const [phase, setPhase] = useState<'intro' | 'adjust' | 'racing' | 'explain' | 'done'>('intro');
  const [fb, setFb] = useState<{ kind: 'ok' | 'hint'; text: string } | null>(null);
  const [combine, setCombine] = useState(0);
  const [showR, setShowR] = useState(0);
  const [eq, setEq] = useState(false);
  const [def, setDef] = useState(false);
  const [card, setCard] = useState(false);
  const [burst, setBurst] = useState(false);
  const [lane2, setLane2] = useState(1);
  const [arrowsShown, setArrowsShown] = useState(0);
  const tryIt = useSignal();
  const robotRef = useLatest(robotF);

  useScript(async (s) => {
    await s.wait(0.4);
    await s.narrate('s5.a', { cues: [[0.4, () => void s.animate(0, 1, 1.2, setArrowsShown, 'power2.out')]] });
    await s.narrate('s5.a2');
    setPhase('adjust');
    s.narrateBg('s5.b');

    const k = (2 * RACE_DIST) / (T.race * T.race) / R.magnitude; // ivme / N
    for (;;) {
      await s.waitFor(tryIt);
      const F = robotRef.current;
      setPhase('racing');
      setFb(null);
      await s.animate(0, T.race, T.race, (t) => {
        setX1(positionFromRest(R.magnitude, 1 / k, t));
        setX2(positionFromRest(F, 1 / k, t));
      }, 'none');
      await s.wait(0.5);
      if (F === R.magnitude) {
        sfx.success();
        setBurst(true);
        setFb({ kind: 'ok', text: 'İki araba tamamen aynı hareket etti!' });
        await s.say('s5.fb.dogru');
        break;
      }
      sfx.retry();
      setFb({ kind: 'hint', text: F < R.magnitude ? 'Robotun arabası geride kaldı.' : 'Robotun arabası öne geçti.' });
      await s.say(F < R.magnitude ? 's5.fb.az' : 's5.fb.cok');
      setX1(0);
      setX2(0);
      setPhase('adjust');
    }

    setBurst(false);
    setFb(null);
    await s.animate(1, 0, 0.5, setLane2);
    setX1(0);
    setPhase('explain');
    setDef(true);
    await s.narrate('s5.tanim');
    await s.narrate('s5.toplama', { cues: [[0.2, () => void s.animate(0, 1, 1.6, setCombine, 'power2.inOut')]] });
    await s.animate(0, 1, 0.9, setShowR, 'power2.out');
    setEq(true);
    await s.narrate('s5.sonuc');
    setCard(true);
    sfx.success();
    await s.narrate('s5.kart');
    setPhase('done');
    s.complete();
  });

  const cart1 = START_X + x1;
  const cart2 = START_X + x2;
  const L1 = arrowLength(F1.magnitude, SCALE);
  const L2 = arrowLength(F2.magnitude, SCALE);
  const D1 = arrowLength(F1.magnitude, DSCALE);
  const D2 = arrowLength(F2.magnitude, DSCALE);
  const DR = arrowLength(R.magnitude, DSCALE);
  // 1. şerit kuvvetlerinin uygulama noktaları
  const pushPt = { x: cart1 - 158, y: G1 - 188 };
  const pullPt = { x: cart1 + 152, y: G1 - 150 };
  // Uç uca ekleme hedefleri (ızgara satırları)
  const gx = 170;
  const rowF = 650;
  const rowR = 720;
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const f1Pos = { x: lerp(pushPt.x, gx, combine), y: lerp(pushPt.y, rowF, combine) };
  const f2Pos = { x: lerp(pullPt.x, gx + D1, combine), y: lerp(pullPt.y, rowF, combine) };
  const len1 = lerp(L1, D1, combine);
  const len2 = lerp(L2, D2, combine);

  return (
    <>
      <SceneSvg>
        <Landscape />
        <rect x={0} y={G1 + 4} width={1920} height={26} fill="#c9b48e" opacity={0.85} />
        <rect x={0} y={G2 + 4} width={1920} height={26} fill="#c9b48e" opacity={0.85 * lane2} />

        {/* 1. şerit: iki arkadaş */}
        <g data-testid="lane-1">
          {combine > 0 && (
            <g opacity={combine}>
              <Grid x={gx} y={rowF - 35} cols={6} rows={2} cell={DSCALE.pxPerCell} />
            </g>
          )}
          <Kid x={cart1 - 250} y={G1} pose="push" shirt="#e0a43a" hair="#4a3426" hairStyle="long" />
          <Cart x={cart1} y={G1} wheelRot={x1 * 1.9} />
          <path d={`M${cart1 + 146} ${G1 - 96} L${cart1 + 152} ${G1 - 150}`} stroke="#6e7a8e" strokeWidth={8} strokeLinecap="round" />
          <line x1={pullPt.x} y1={pullPt.y} x2={cart1 + 380 - 84} y2={G1 - 150} stroke="#b48d50" strokeWidth={7} />
          <Kid x={cart1 + 380} y={G1} pose="pull" flip shirt="#5aa9a0" hair="#2d211b" />
          <ForceArrow x={f1Pos.x} y={f1Pos.y} axis="yatay" sign={1} length={len1} progress={arrowsShown} magnitude={30} showPoint={combine < 0.05} label="F₁ = 30 N" sublabel={combine < 0.05 ? 'itme' : undefined} labelPos="above" testId="arrow-f1" />
          <ForceArrow x={f2Pos.x} y={f2Pos.y} axis="yatay" sign={1} length={len2} progress={arrowsShown} magnitude={20} showPoint={combine < 0.05} label="F₂ = 20 N" sublabel={combine < 0.05 ? 'çekme' : undefined} labelPos="above" testId="arrow-f2" />
          {showR > 0 && (
            <ForceArrow x={gx} y={rowR} axis="yatay" sign={1} length={DR} progress={showR} kind="resultant" magnitude={R.magnitude} label={showR > 0.8 ? `R = ${R.magnitude} N` : undefined} labelPos="tip" testId="arrow-r" />
          )}
          {combine > 0.95 && <ScaleBadge x={gx} y={rowR + 60} cell={40} newtons={10} />}
        </g>

        {/* 2. şerit: robot */}
        {lane2 > 0 && (
          <g opacity={lane2} data-testid="lane-2">
            <Robot x={cart2 - 252} y={G2} glow={phase === 'racing'} />
            <Cart x={cart2} y={G2} wheelRot={x2 * 1.9} tint="#cfd8e6" />
            {phase === 'adjust' ? (
              <AdjustableArrow
                x={cart2 - 158}
                y={G2 - 188}
                axis="yatay"
                value={robotF}
                onChange={(v) => setRobotF(Math.max(10, v))}
                scale={SCALE}
                max={90}
                step={10}
                fixedSign={1}
                label={(v) => `F = ${v} N`}
                labelPos="above"
                testId="robot-arrow"
              />
            ) : (
              <ForceArrow x={cart2 - 158} y={G2 - 188} axis="yatay" sign={1} length={arrowLength(robotF, SCALE)} magnitude={robotF} label={`F = ${robotF} N`} labelPos="above" testId="robot-arrow-static" />
            )}
            <EastWestStrip x={420} y={G2 + 52} width={900} />
          </g>
        )}

        {(phase === 'racing' || fb) && lane2 > 0 && x1 > 0 && (
          <g>
            <line x1={cart1 + 150} y1={G1 - 210} x2={cart1 + 150} y2={G2 + 10} stroke="#7b879b" strokeWidth={3} strokeDasharray="8 10" />
            <line x1={cart2 + 150} y1={G2 - 210} x2={cart2 + 150} y2={G2 + 10} stroke="var(--interact)" strokeWidth={3} strokeDasharray="8 10" />
          </g>
        )}
        {burst && <SuccessBurst x={cart2} y={G2 - 120} r={150} />}
      </SceneSvg>

      <ModelBadge>Model: sürtünme ihmal edildi · Arabalar özdeş</ModelBadge>

      {lane2 > 0.5 && phase !== 'racing' && x1 === 0 && (
        <div className="badge-model fade-in" style={{ left: 1450, top: G1 - 74, fontWeight: 650, fontSize: 24, color: 'var(--ink)' }}>
          1. araba: iki arkadaş
        </div>
      )}

      {phase === 'adjust' && (
        <div className="panel fade-in" style={{ left: 1430, top: 520, width: 440 }} data-testid="robot-panel">
          <h3>2. araba: robotun kuvveti</h3>
          <Stepper value={robotF} onChange={setRobotF} step={10} min={10} max={90} format={(v) => `${v} N`} testId="robot-stepper" />
          <button className="btn btn-primary" style={{ marginTop: 22, width: '100%' }} data-testid="try" onClick={() => tryIt.fire()}>
            Dene
          </button>
        </div>
      )}

      {def && (
        <div className="panel fade-in" style={{ left: 720, top: 540, width: 740 }} data-testid="definition">
          <h3 style={{ color: 'var(--resultant-dark)' }}>Bileşke kuvvet (net kuvvet) · R</h3>
          <div style={{ fontSize: 28, lineHeight: 1.45 }}>
            Bir cisme etki eden birden fazla kuvvetin etkisini <b>tek başına</b> yapabilen kuvvettir.
          </div>
          {eq && (
            <div className="equation fade-in" style={{ marginTop: 18 }} data-testid="equation">
              {equation([F1, F2])} <span style={{ fontSize: 30, color: 'var(--ink-soft)' }}>· doğu yönünde</span>
            </div>
          )}
        </div>
      )}
      {card && (
        <RuleCard title="Aynı yönlü kuvvetler" index={1} style={{ left: 1490, top: 540, width: 400 }}>
          Büyüklükler <b>toplanır</b>. Bileşke kuvvet de aynı yöndedir.
        </RuleCard>
      )}
      {fb && <Feedback token={fb} kind={fb.kind} style={{ left: '50%', transform: 'translateX(-50%)', top: 112 }}>{fb.text}</Feedback>}
    </>
  );
}
