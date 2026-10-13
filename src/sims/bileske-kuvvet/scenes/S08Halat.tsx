import { useState } from 'react';
import { Kid } from '../../../art/characters';
import { Rope } from '../../../art/objects';
import { usePlayer, useLatest, useScript, useSignal } from '../../../engine/react';
import { sfx } from '../../../engine/sfx';
import { arrowLength, describeResultant, equation, resultant, sameResultant, type Force, type Scale } from '../../../physics/forces';
import { positionFromRest } from '../../../physics/motion';
import { AdjustableArrow } from '../../../ui/force/AdjustableArrow';
import { ForceArrow } from '../../../ui/force/ForceArrow';
import { EastWestStrip, Grid, ScaleBadge } from '../../../ui/force/Grid';
import { Feedback, ModelBadge, SuccessBurst } from '../../../ui/widgets';
import { Landscape, SceneSvg } from '../common';
import { T } from '../timings';

const SCALE: Scale = { newtonsPerCell: 10, pxPerCell: 40 };
const GROUND = 740;
const ROPE_Y = GROUND - 150;
const CX = 960;
const LEFT_X = [560, 420, 280];
const RIGHT_X = [1360, 1500, 1640];
const ARROW_Y = ROPE_Y;
const R_Y = 360;

const ORANGE = '#f08a24';
const GREEN = '#2f9e6b';

const BENCH = [
  { id: 'a', n: 10 },
  { id: 'b', n: 20 },
  { id: 'c', n: 20 },
  { id: 'd', n: 30 },
  { id: 'e', n: 40 },
];
type Team = 'turuncu' | 'yesil';

function teamForces(left: number[], right: number[]): Force[] {
  return [
    { id: 'turuncu', magnitude: left.reduce((a, b) => a + b, 0), sign: -1, axis: 'yatay' },
    { id: 'yesil', magnitude: right.reduce((a, b) => a + b, 0), sign: 1, axis: 'yatay' },
  ];
}

/** Sahne 8 — Halat çekme: tahmin et, bileşkeyi çiz, takım kur. */
export function S08Halat() {
  const ctrl = usePlayer();
  const [round, setRound] = useState<1 | 2>(1);
  const [step, setStep] = useState<'intro' | 'predict' | 'draw' | 'move' | 'build' | 'done'>('intro');
  const [prediction, setPrediction] = useState<string | null>(null);
  const [rValue, setRValue] = useState(0);
  const [offset, setOffset] = useState(0);
  const [fb, setFb] = useState<{ kind: 'ok' | 'hint'; text: string } | null>(null);
  const [burst, setBurst] = useState(false);
  const [showTrueR, setShowTrueR] = useState(false);
  // 2. tur: takım üyeleri (bank kimlikleri)
  const [members, setMembers] = useState<Record<Team, string[]>>({ turuncu: [], yesil: [] });
  const [picked, setPicked] = useState<string | null>(null);

  const predicted = useSignal<string>();
  const check = useSignal();
  const rRef = useLatest(rValue);
  const membersRef = useLatest(members);

  const value = (id: string) => BENCH.find((b) => b.id === id)!.n;
  const left = round === 1 ? [20, 20] : members.turuncu.map(value);
  const right = round === 1 ? [35, 35] : members.yesil.map(value);
  const forces = teamForces(left, right);
  const R = resultant(forces);

  useScript(async (s) => {
    const move = async (signedR: number) => {
      const dist = 150;
      const k = (2 * dist) / (T.rope * T.rope) / Math.abs(signedR);
      await s.animate(0, T.rope, T.rope, (t) => setOffset(positionFromRest(signedR, 1 / k, t)), 'none');
    };

    await s.narrate('s8.a');
    setStep('predict');
    s.narrateBg('s8.t1');
    const p = await s.waitFor(predicted);
    const truth = resultant(teamForces([20, 20], [35, 35]));
    const ok = p === 'dogu';
    if (ok) sfx.success();
    setStep('draw');
    await s.say(ok ? 's8.t1.tahmin.dogru' : 's8.t1.tahmin.yanlis');
    for (;;) {
      await s.waitFor(check);
      const v = rRef.current;
      const drawn = { magnitude: Math.abs(v), sign: (v > 0 ? 1 : v < 0 ? -1 : 0) as 1 | -1 | 0, axis: 'yatay' as const };
      if (sameResultant(drawn, truth)) {
        sfx.success();
        setBurst(true);
        setFb({ kind: 'ok', text: `${equation(teamForces([20, 20], [35, 35]))} · doğu yönünde` });
        setStep('move');
        await s.say('s8.t1.dogru', { cues: [[0.5, () => void move(truth.magnitude)]] });
        break;
      }
      sfx.retry();
      const wrongDir = drawn.sign !== truth.sign;
      setFb({ kind: 'hint', text: wrongDir ? 'Bileşke, büyük kuvvetin yönündedir.' : 'Büyük kuvvetten küçük kuvveti çıkaralım.' });
      await s.say(wrongDir ? 's8.t1.ipucu.yon' : 's8.t1.ipucu.buyukluk');
    }
    await s.wait(0.6);

    // 2. tur: takımları kur
    setBurst(false);
    setFb(null);
    setOffset(0);
    setRound(2);
    setStep('build');
    s.narrateBg('s8.t2');
    for (;;) {
      await s.waitFor(check);
      const m = membersRef.current;
      const L = m.turuncu.map(value);
      const Rr = m.yesil.map(value);
      const res = resultant(teamForces(L, Rr));
      if (L.length > 0 && Rr.length > 0 && res.sign === -1 && res.magnitude === 10) {
        sfx.success();
        setShowTrueR(true);
        setBurst(true);
        setFb({ kind: 'ok', text: `${equation(teamForces(L, Rr))} · batı yönünde` });
        setStep('done');
        await s.say('s8.t2.dogru', { cues: [[0.3, () => void move(-10)]] });
        break;
      }
      sfx.retry();
      setFb({
        kind: 'hint',
        text:
          L.length === 0 || Rr.length === 0
            ? 'Her takımda en az bir oyuncu olmalı.'
            : `Şu an: ${describeResultant(res)}. Turuncu takım 10 N fazla olmalı.`,
      });
      await s.say('s8.t2.ipucu');
    }
    await s.wait(0.6);
    setBurst(false);
    s.complete();
  });

  const benchFree = BENCH.filter((b) => !members.turuncu.includes(b.id) && !members.yesil.includes(b.id));
  const addTo = (team: Team) => {
    if (!picked || step !== 'build') return;
    if (members[team].length >= 3) {
      ctrl.showCaption('Bir takımda en fazla 3 oyuncu olabilir.');
      return;
    }
    sfx.place();
    setFb(null);
    setMembers((m) => ({ ...m, [team]: [...m[team], picked] }));
    setPicked(null);
  };
  const removeFrom = (team: Team, id: string) => {
    if (step !== 'build') return;
    sfx.tap();
    setFb(null);
    setMembers((m) => ({ ...m, [team]: m[team].filter((x) => x !== id) }));
  };

  const leftCount = round === 1 ? 2 : members.turuncu.length;
  const rightCount = round === 1 ? 2 : members.yesil.length;
  const LW = arrowLength(forces[0].magnitude, SCALE);
  const LE = arrowLength(forces[1].magnitude, SCALE);

  return (
    <>
      <SceneSvg>
        <Landscape />
        <rect x={0} y={GROUND} width={1920} height={1080 - GROUND} fill="#a8d08a" />
        <line x1={CX} y1={GROUND - 10} x2={CX} y2={GROUND + 40} stroke="#fff" strokeWidth={8} strokeDasharray="14 10" />

        {(step === 'draw' || step === 'move' || showTrueR || (round === 1 && step !== 'intro' && step !== 'predict')) && (
          <g opacity={0.9}>
            <Grid x={CX - 12 * SCALE.pxPerCell} y={R_Y - SCALE.pxPerCell / 2} cols={24} rows={1} cell={SCALE.pxPerCell} />
          </g>
        )}

        <g transform={`translate(${offset} 0)`}>
          <Rope x1={300} x2={1620} y={ROPE_Y} marker={CX} />
          {LEFT_X.slice(0, leftCount).map((x, i) => {
            const id = round === 2 ? members.turuncu[i] : undefined;
            return (
              <g key={`l${i}`} onPointerDown={id ? () => removeFrom('turuncu', id) : undefined} style={id ? { cursor: 'pointer' } : undefined} data-testid={id ? `member-${id}` : undefined}>
                <Kid x={x} y={GROUND} pose="pull" shirt={ORANGE} hair={['#3b2a20', '#6b4a2b', '#2d211b'][i]} hairStyle={(['short', 'long', 'curly'] as const)[i]} />
                {id && (
                  <text x={x} y={GROUND - 320} textAnchor="middle" className="svg-label" fontSize={28} fill="#9a4f06">
                    {value(id)} N
                  </text>
                )}
              </g>
            );
          })}
          {RIGHT_X.slice(0, rightCount).map((x, i) => {
            const id = round === 2 ? members.yesil[i] : undefined;
            return (
              <g key={`r${i}`} onPointerDown={id ? () => removeFrom('yesil', id) : undefined} style={id ? { cursor: 'pointer' } : undefined} data-testid={id ? `member-${id}` : undefined}>
                <Kid x={x} y={GROUND} pose="pull" flip shirt={GREEN} hair={['#2d211b', '#3b2a20', '#6b4a2b'][i]} hairStyle={(['curly', 'short', 'long'] as const)[i]} />
                {id && (
                  <text x={x} y={GROUND - 320} textAnchor="middle" className="svg-label" fontSize={28} fill="#1d6b47">
                    {value(id)} N
                  </text>
                )}
              </g>
            );
          })}
          {forces[0].magnitude > 0 && (
            <ForceArrow x={LEFT_X[0] + 84} y={ARROW_Y} axis="yatay" sign={-1} length={LW} magnitude={forces[0].magnitude} showPoint testId="arrow-turuncu" />
          )}
          {forces[1].magnitude > 0 && (
            <ForceArrow x={RIGHT_X[0] - 84} y={ARROW_Y} axis="yatay" sign={1} length={LE} magnitude={forces[1].magnitude} showPoint testId="arrow-yesil" />
          )}
          {showTrueR && R.sign !== 0 && (
            <ForceArrow x={CX} y={R_Y} axis="yatay" sign={R.sign} length={arrowLength(R.magnitude, SCALE)} kind="resultant" magnitude={R.magnitude} showPoint label={`R = ${R.magnitude} N`} labelPos="above" testId="arrow-r-true" />
          )}
        </g>

        {(step === 'draw' || (step === 'move' && round === 1)) && (
          <g transform={`translate(${offset} 0)`}>
            <AdjustableArrow
              x={CX}
              y={R_Y}
              axis="yatay"
              value={rValue}
              onChange={(v) => {
                setRValue(v);
                setFb(null);
              }}
              scale={SCALE}
              max={120}
              step={10}
              allowFlip
              kind={step === 'move' ? 'resultant' : 'ghost'}
              disabled={step !== 'draw'}
              label={(v) => (v === 0 ? undefined : `R = ${Math.abs(v)} N`)}
              labelPos="above"
              testId="r-drawer"
            />
          </g>
        )}
        {(step === 'draw' || step === 'move' || showTrueR) && <ScaleBadge x={60} y={800} cell={SCALE.pxPerCell} newtons={10} />}
        {step !== 'build' && <EastWestStrip x={300} y={GROUND + 130} width={1320} />}
        {burst && <SuccessBurst x={CX + offset} y={ROPE_Y} r={160} />}
      </SceneSvg>

      <ModelBadge>Model: halata etki eden kuvvetler · Sürtünme ihmal edildi</ModelBadge>

      {step !== 'intro' && (
        <>
          <div className="badge-model" style={{ left: 60, top: 300, fontSize: 28, fontWeight: 750, color: '#9a4f06' }} data-testid="total-turuncu">
            Turuncu takım · {forces[0].magnitude} N
          </div>
          <div className="badge-model" style={{ left: 'auto', right: 60, top: 300, fontSize: 28, fontWeight: 750, color: '#1d6b47' }} data-testid="total-yesil">
            Yeşil takım · {forces[1].magnitude} N
          </div>
        </>
      )}
      {round === 2 && step === 'build' && (
        <>
          {(['turuncu', 'yesil'] as Team[]).map((t) => (
            <div
              key={t}
              data-testid={`team-${t}`}
              onPointerUp={() => addTo(t)}
              style={{
                position: 'absolute',
                left: t === 'turuncu' ? 180 : 1180,
                top: 260,
                width: 560,
                height: 500,
                borderRadius: 30,
                border: `5px dashed ${picked ? (t === 'turuncu' ? ORANGE : GREEN) : 'transparent'}`,
                background: picked ? 'rgba(255,255,255,0.18)' : 'transparent',
                cursor: picked ? 'pointer' : 'default',
              }}
            >
            </div>
          ))}
          <div className="fade-in" style={{ position: 'absolute', left: 300, right: 300, top: 790, display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'center' }}>
            {benchFree.map((b) => (
              <button
                key={b.id}
                className={`chip ${picked === b.id ? 'selected' : ''}`}
                data-testid={`bench-${b.id}`}
                style={{ minWidth: 150 }}
                onClick={() => {
                  sfx.tap();
                  setPicked(picked === b.id ? null : b.id);
                }}
              >
                {b.n} N
              </button>
            ))}
            <button className="btn btn-primary" data-testid="check" onClick={() => check.fire()}>
              Kontrol Et
            </button>
          </div>
        </>
      )}

      {step === 'predict' && (
        <div className="panel fade-in" style={{ left: '50%', transform: 'translateX(-50%)', top: 120, width: 1000, textAlign: 'center' }} data-testid="predict-panel">
          <h3>Tahmininiz: Halat hangi yöne hareket eder?</h3>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            {[
              ['bati', '◄ Batıya'],
              ['dogu', 'Doğuya ►'],
              ['yok', 'Hareket etmez'],
            ].map(([id, label]) => (
              <button
                key={id}
                className={`chip ${prediction === id ? 'selected' : ''}`}
                data-testid={`predict-${id}`}
                onClick={() => {
                  sfx.tap();
                  setPrediction(id);
                  predicted.fire(id);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'draw' && (
        <div className="fade-in" style={{ position: 'absolute', left: 840, top: 400 }}>
          <button className="btn btn-primary" data-testid="check" onClick={() => check.fire()}>
            Kontrol Et
          </button>
        </div>
      )}
      {step === 'draw' && !fb && (
        <div className="prompt-card fade-in" style={{ top: 120 }}>
          Mavi okun ucunu sürükleyin.
        </div>
      )}
      {fb && <Feedback token={fb} kind={fb.kind} style={{ left: '50%', transform: 'translateX(-50%)', top: 120 }}>{fb.text}</Feedback>}
    </>
  );
}
