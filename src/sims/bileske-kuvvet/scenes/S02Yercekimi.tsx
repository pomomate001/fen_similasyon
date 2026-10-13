import { useState } from 'react';
import { Apple, AppleTree } from '../../../art/nature';
import { Globe } from '../../../art/objects';
import { useScript } from '../../../engine/react';
import { positionFromRest } from '../../../physics/motion';
import { ForceArrow } from '../../../ui/force/ForceArrow';
import { APPLE_GROUND_Y, APPLE_HANG, FreezeBadge, GROUND_Y, Landscape, PolarArrow, SceneSvg, TREE } from '../common';
import { T } from '../timings';

/** 1 N = 120 px (Sahne 3'teki ızgarayla aynı ölçek) */
export const APPLE_ARROW = 120;
const FREEZE_Y = 640;

/** Sahne 2 — Yerçekimi kuvvetinin keşfi: düşen elma havada dondurulur, kuvvet oku çizilir. */
export function S02Yercekimi() {
  const [appleY, setAppleY] = useState(APPLE_HANG.y);
  const [frozen, setFrozen] = useState(false);
  const [arrowP, setArrowP] = useState(0);
  const [label, setLabel] = useState(false);
  const [globe, setGlobe] = useState(false);
  const [globeP, setGlobeP] = useState(0);
  const [inset, setInset] = useState(false);

  useScript(async (s) => {
    await s.wait(0.4);
    // Düşüş yeniden başlar ve belirli bir konumda "zaman durdurulur"
    const drop = APPLE_GROUND_Y - APPLE_HANG.y;
    const g = (2 * drop) / (T.appleFall * T.appleFall);
    const tFreeze = Math.sqrt((2 * (FREEZE_Y - APPLE_HANG.y)) / g);
    await s.animate(0, tFreeze, tFreeze, (t) => setAppleY(APPLE_HANG.y + positionFromRest(g, 1, t)), 'none');
    setFrozen(true);
    await s.wait(0.6);

    await s.narrate('s2.a', {
      cues: [
        [0.35, () => void s.animate(0, 1, T.arrowDraw, setArrowP, 'power2.out')],
        [0.75, () => setLabel(true)],
      ],
    });
    setGlobe(true);
    await s.narrate('s2.b', { cues: [[0.45, () => void s.animate(0, 1, 1.2, setGlobeP, 'power2.out')]] });
    await s.narrate('s2.c');
    setInset(true);
    await s.narrate('s2.d');
    s.complete();
  });

  const globeApples = [
    { a: -90, label: '' },
    { a: 0, label: '' },
    { a: 140, label: '' },
    { a: 215, label: '' },
  ];
  const G = { x: 1620, y: 395, r: 150 };

  return (
    <>
      <SceneSvg>
        <g className={`time-freeze ${frozen ? 'frozen' : ''}`}>
          <Landscape />
          <AppleTree baseX={TREE.baseX} groundY={GROUND_Y} branchTip={TREE.branchTip} />
        </g>
        {frozen && (
          <>
            <circle cx={APPLE_HANG.x} cy={FREEZE_Y + 6} r={86} fill="none" stroke="#fff" strokeWidth={5} strokeDasharray="10 12" className="fade-in" />
            <FreezeBadge x={APPLE_HANG.x} y={180} />
          </>
        )}
        <Apple x={APPLE_HANG.x} y={appleY} data-testid="apple" />
        <ForceArrow
          x={APPLE_HANG.x}
          y={FREEZE_Y}
          axis="dusey"
          sign={-1}
          length={APPLE_ARROW}
          progress={arrowP}
          showPoint={arrowP > 0}
          label={label ? 'Yerçekimi kuvveti' : undefined}
          labelPos="right"
          labelGap={40}
          testId="arrow-gravity"
        />

        {globe && (
          <g className="fade-in" data-testid="globe-panel">
            <rect x={1390} y={150} width={460} height={480} rx={30} fill="#fff" opacity={0.95} />
            <Globe x={G.x} y={G.y} r={G.r} />
            {globeApples.map(({ a }, i) => {
              const rad = (a * Math.PI) / 180;
              const d = G.r + 46;
              const ax = G.x + Math.cos(rad) * d;
              const ay = G.y + Math.sin(rad) * d;
              return (
                <g key={i}>
                  <Apple x={ax} y={ay} s={0.34} stem={false} />
                  <PolarArrow x={ax} y={ay} angle={a + 180} length={92} progress={globeP} width={8} />
                </g>
              );
            })}
            <circle cx={G.x} cy={G.y} r={7} fill="#1b2333" opacity={globeP} />
            <text x={G.x} y={604} textAnchor="middle" fontSize={26} fontWeight={650} fill="var(--ink)">
              Dünya'nın merkezine doğru
            </text>
          </g>
        )}

        {inset && (
          <g className="fade-in" data-testid="stem-inset">
            <rect x={1390} y={650} width={460} height={210} rx={30} fill="#fff" opacity={0.95} />
            <path d="M1450 700 C 1520 690, 1580 688, 1640 694" stroke="#7d5136" strokeWidth={12} strokeLinecap="round" fill="none" />
            <circle cx={1585} cy={706} r={22} className="glow-ring" />
            <Apple x={1585} y={760} s={0.85} />
            <text x={1690} y={760} fontSize={24} fontWeight={600} fill="var(--ink-soft)">
              Sap elmayı
            </text>
            <text x={1690} y={792} fontSize={24} fontWeight={600} fill="var(--ink-soft)">
              tutuyordu
            </text>
          </g>
        )}
      </SceneSvg>
    </>
  );
}
