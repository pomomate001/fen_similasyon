import { useState } from 'react';
import { useScript } from '../../../engine/react';
import { sfx } from '../../../engine/sfx';
import { arrowLength, equation, formatN, resultant } from '../../../physics/forces';
import { positionFromRest } from '../../../physics/motion';
import { ForceArrow } from '../../../ui/force/ForceArrow';
import { ModelBadge, RuleCard } from '../../../ui/widgets';
import { FreezeBadge, SceneSvg } from '../common';
import { GRAVITY, KALKIS_LIFT, MOTOR, RK_CENTER, RK_SCALE, RocketBackdrop, RocketGauge, RocketGrid, RocketOnPad, RocketScaleBadge } from '../rocket';
import { T } from '../timings';

const R = resultant([MOTOR, GRAVITY]);
const LM = arrowLength(MOTOR.magnitude, RK_SCALE);
const LG = arrowLength(GRAVITY.magnitude, RK_SCALE);
const LR = arrowLength(R.magnitude, RK_SCALE);
const R_X = RK_CENTER.x + 170;

/** Sahne 7 — Zıt yönlü kuvvetlerin bileşkesi: hesapla, çiz, hareketle ilişkilendir. */
export function S07Bileske() {
  const [pulse, setPulse] = useState(false);
  /** 0: yerçekimi oku merkezde; 1: motor okunun ucuna taşındı */
  const [slide, setSlide] = useState(0);
  /** 0..1: üst üste binen kısım silinir */
  const [cancel, setCancel] = useState(0);
  const [rP, setRP] = useState(0);
  const [eqStep, setEqStep] = useState(0);
  const [launch, setLaunch] = useState(0);
  const [frozen, setFrozen] = useState(true);
  const [card, setCard] = useState(false);

  useScript(async (s) => {
    await s.wait(0.4);
    setPulse(true);
    await s.narrate('s7.a');
    setPulse(false);
    await s.narrate('s7.b', {
      cues: [
        [0.25, () => void s.animate(0, 1, 1.3, setSlide, 'power2.inOut')],
        [0.7, () => void s.animate(0, 1, 1.0, setCancel, 'power1.inOut')],
      ],
    });
    setEqStep(1);
    await s.narrate('s7.c', { cues: [[0.4, () => setEqStep(2)]] });
    await s.narrate('s7.d', { cues: [[0.2, () => void s.animate(0, 1, T.arrowDraw, setRP, 'power2.out')]] });
    await s.wait(0.3);
    // Zaman yeniden akar: başlangıçta duran roket bileşke yönünde giderek hızlanarak yükselir
    setFrozen(false);
    const dist = 900;
    const tEnd = T.rocketLaunch;
    const k = (2 * dist) / (tEnd * tEnd) / R.magnitude;
    await s.narrate('s7.e', {
      cues: [[0.25, () => void s.animate(0, tEnd, tEnd, (t) => setLaunch(positionFromRest(R.magnitude, 1 / k, t)), 'none')]],
    });
    await s.wait(0.4);
    setCard(true);
    sfx.success();
    await s.narrate('s7.kart');
    s.complete();
  });

  // Yerçekimi oku: merkezden aşağı → motor okunun ucundan aşağı (uç uca)
  const gTailY = RK_CENTER.y - LM * slide;
  // Silinme: motor okunun görünür uzunluğu kısalır (LM → LR), yerçekimi oku solar
  const motorLen = LM - LG * cancel;
  const forcesVisible = launch === 0;

  return (
    <>
      <SceneSvg>
        <RocketBackdrop dim={frozen} />
        {forcesVisible && <RocketGrid />}
        <RocketGauge />
        <RocketOnPad lift={KALKIS_LIFT} rise={launch} flame={1 + Math.min(1, launch / 200) * 0.3} />
        {forcesVisible && (
          <g>
            {cancel > 0 && cancel < 1 && (
              <rect
                x={RK_CENTER.x - 30}
                y={RK_CENTER.y - LM}
                width={60}
                height={LG}
                rx={8}
                fill="#fff"
                opacity={0.85 * Math.sin(cancel * Math.PI)}
              />
            )}
            <ForceArrow
              x={RK_CENTER.x}
              y={RK_CENTER.y}
              axis="dusey"
              sign={1}
              length={cancel > 0 ? motorLen : LM}
              magnitude={MOTOR.magnitude}
              showPoint
              highlightHead={pulse}
              label={cancel < 0.5 ? `F₁ = ${formatN(MOTOR.magnitude)}` : undefined}
              sublabel={cancel < 0.5 ? 'motor' : undefined}
              labelPos="left"
              labelGap={120}
              kind={cancel >= 1 ? 'faded' : 'force'}
              testId="arrow-motor"
            />
            <ForceArrow
              x={RK_CENTER.x}
              y={gTailY}
              axis="dusey"
              sign={-1}
              length={LG}
              magnitude={GRAVITY.magnitude}
              highlightHead={pulse}
              label={slide < 0.1 ? `F₂ = ${formatN(GRAVITY.magnitude)}` : undefined}
              sublabel={slide < 0.1 ? 'yerçekimi' : undefined}
              labelPos="left"
              labelGap={120}
              opacity={1 - cancel}
              testId="arrow-gravity"
            />
          </g>
        )}
        <g transform={`translate(0 ${-launch})`}>
          {rP > 0 && (
            <ForceArrow
              x={R_X}
              y={RK_CENTER.y}
              axis="dusey"
              sign={1}
              length={LR}
              progress={rP}
              kind="resultant"
              magnitude={R.magnitude}
              showPoint={launch === 0}
              label={rP > 0.7 ? `R = ${formatN(R.magnitude)}` : undefined}
              labelPos="right"
              labelGap={30}
              testId="arrow-r"
            />
          )}
        </g>
        {forcesVisible && <RocketScaleBadge />}
        {frozen && <FreezeBadge x={1300} y={160} />}
        {!frozen && (
          <g className="fade-in">
            <rect x={1110} y={130} width={380} height={66} rx={33} fill="rgba(27,35,51,0.85)" />
            <path d="M1150 178 v-30 m-12 12 l12 -14 l12 14" stroke="#fff" strokeWidth={5} fill="none" strokeLinecap="round" />
            <text x={1310} y={174} textAnchor="middle" fontSize={28} fontWeight={650} fill="#fff">
              Roket harekete geçti
            </text>
          </g>
        )}
      </SceneSvg>

      <ModelBadge>Model: hava direnci ihmal edildi · Değerler temsilîdir</ModelBadge>

      {eqStep > 0 && (
        <div className="panel fade-in" style={{ left: 1230, top: 360, width: 640 }} data-testid="equation-panel">
          <h3>Zıt yönlü kuvvetler</h3>
          <div style={{ fontSize: 26, color: 'var(--ink-soft)', marginBottom: 10 }}>Büyük kuvvet − küçük kuvvet</div>
          {eqStep > 1 && (
            <div className="equation fade-in" data-testid="equation">
              {equation([MOTOR, GRAVITY])}
            </div>
          )}
          {rP > 0.7 && (
            <div className="fade-in" style={{ marginTop: 12, fontSize: 28, fontWeight: 650, color: 'var(--resultant-dark)' }}>
              Yön: yukarı · Doğrultu: düşey
            </div>
          )}
        </div>
      )}
      {card && (
        <RuleCard title="Zıt yönlü kuvvetler" index={2} style={{ left: 1300, top: 640 }}>
          Büyükten küçük <b>çıkarılır</b>. Bileşke kuvvet <b>büyük kuvvetin yönündedir</b>.
        </RuleCard>
      )}
    </>
  );
}
