import { useEffect, useRef, useState } from 'react';
import { Crate } from '../../../art/objects';
import { usePlayer, useScript, useSignal } from '../../../engine/react';
import { sfx } from '../../../engine/sfx';
import { arrowLength, describeResultant, equation, relation, resultant, type Force, type Scale } from '../../../physics/forces';
import { positionFromRest } from '../../../physics/motion';
import { AdjustableArrow } from '../../../ui/force/AdjustableArrow';
import { ForceArrow } from '../../../ui/force/ForceArrow';
import { Grid, ScaleBadge } from '../../../ui/force/Grid';
import { ModelBadge, Stepper } from '../../../ui/widgets';
import { SceneSvg } from '../common';
import { T } from '../timings';

const SCALE: Scale = { newtonsPerCell: 1, pxPerCell: 36 };
const MAXF = 6;
const CX = 960;
const ROWS = [622, 677, 732];
const R_ROW = 842;
const FLOOR = 768;

type Goal = 'ayni' | 'zit' | 'uc';
const GOALS: Array<{ id: Goal; label: string }> = [
  { id: 'ayni', label: 'Aynı yönlü kuvvetler' },
  { id: 'zit', label: 'Zıt yönlü kuvvetler' },
  { id: 'uc', label: 'Üç kuvvet' },
];

/** Sahne 9 — Kuvvet Laboratuvarı: kuvvetleri değiştir, bileşkeyi tahmin et, göster, oynat. */
export function S09Laboratuvar() {
  const ctrl = usePlayer();
  const [vals, setVals] = useState<number[]>([3, 2]);
  const [guess, setGuess] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [offset, setOffset] = useState(0);
  const [done, setDone] = useState<Goal[]>([]);
  const [verdict, setVerdict] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const allDone = useSignal();
  const play = useSignal<number>();
  const announced = useRef(false);

  const forces: Force[] = vals.map((v, i) => ({ id: `F${i + 1}`, magnitude: Math.abs(v), sign: v < 0 ? -1 : 1, axis: 'yatay' }));
  const R = resultant(forces);
  const active = forces.filter((f) => f.magnitude > 0);

  useScript(async (s) => {
    // Hareket oynatma isteği: betik içinde (duraklatılabilir) çalışır
    void (async () => {
      for (;;) {
        const signedR = await s.waitFor(play);
        setBusy(true);
        if (signedR === 0) {
          ctrl.showCaption('R = 0 N: başlangıçta duran kutu harekete geçmez.');
          await s.wait(1.2);
        } else {
          const k = (2 * 380) / (T.labMotion * T.labMotion) / 18;
          await s.animate(0, T.labMotion, T.labMotion, (t) => setOffset(positionFromRest(signedR, 1 / k, t)), 'none');
        }
        setBusy(false);
      }
    })().catch(() => undefined);
    await s.narrate('s9.a');
    s.narrateBg('s9.b');
    await s.waitFor(allDone);
    await s.narrate('s9.done');
    s.complete();
  });

  // Değerler değişince sonuç gizlenir ve kutu başa döner
  const change = (fn: () => void) => {
    if (busy) return;
    fn();
    setRevealed(false);
    setVerdict(null);
    setOffset(0);
  };

  const reveal = () => {
    if (busy) return;
    setRevealed(true);
    const signedGuess = guess;
    const signedR = R.sign * R.magnitude;
    const ok = signedGuess === signedR;
    if (ok) sfx.success();
    else sfx.tap();
    setVerdict(ok ? 'Tahmininiz doğru!' : `Tahmininiz: ${guess === 0 ? '0 N' : `${Math.abs(guess)} N ${guess > 0 ? 'doğu' : 'batı'}`}`);
    const rel = relation(active);
    const add: Goal[] = [];
    if (rel === 'ayni-yonlu') add.push('ayni');
    if (rel === 'zit-yonlu') add.push('zit');
    if (active.length >= 3) add.push('uc');
    setDone((d) => Array.from(new Set([...d, ...add])));
  };

  useEffect(() => {
    if (!announced.current && GOALS.every((g) => done.includes(g.id))) {
      announced.current = true;
      allDone.fire();
    }
  }, [done, allDone]);

  const gridCols = 36;
  const gx = CX - (gridCols / 2) * SCALE.pxPerCell;

  return (
    <>
      <SceneSvg>
        <defs>
          <linearGradient id="labBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#eef3f8" />
            <stop offset="1" stopColor="#e3eaf2" />
          </linearGradient>
        </defs>
        <rect width={1920} height={1080} fill="url(#labBg)" />
        <rect x={0} y={FLOOR} width={1920} height={20} fill="#cfd7e2" />
        <Grid x={gx} y={ROWS[0] - 54} cols={gridCols} rows={9} cell={SCALE.pxPerCell} opacity={0.75} />
        <g transform={`translate(${offset} 0)`}>
          <Crate x={CX} y={FLOOR - 92} size={180} />
          {forces.map((f, i) =>
            busy || revealed ? (
              f.magnitude > 0 && (
                <ForceArrow
                  key={f.id}
                  x={CX}
                  y={ROWS[i]}
                  axis="yatay"
                  sign={f.sign}
                  length={arrowLength(f.magnitude, SCALE)}
                  magnitude={f.magnitude}
                  label={`F${'₁₂₃'[i]} = ${f.magnitude} N`}
                  labelPos="tip"
                  testId={`lab-f${i + 1}`}
                />
              )
            ) : (
              <AdjustableArrow
                key={f.id}
                x={CX}
                y={ROWS[i]}
                axis="yatay"
                value={vals[i]}
                onChange={(v) => change(() => setVals((a) => a.map((x, j) => (j === i ? v : x))))}
                scale={SCALE}
                max={MAXF}
                step={1}
                allowFlip
                label={(v) => (v === 0 ? undefined : `F${'₁₂₃'[i]} = ${Math.abs(v)} N`)}
                labelPos="tip"
                trackHalf={26}
                testId={`lab-f${i + 1}`}
              />
            ),
          )}
        </g>
        <text x={gx - 20} y={R_ROW + 10} textAnchor="end" fontSize={28} fontWeight={700} fill="var(--resultant-dark)">
          R
        </text>
        <circle cx={CX} cy={R_ROW} r={9} fill="var(--point)" stroke="#fff" strokeWidth={3} pointerEvents="none" />
        {!revealed && !busy && (
          <AdjustableArrow
            x={CX}
            y={R_ROW}
            axis="yatay"
            value={guess}
            onChange={(v) => {
              setGuess(v);
              setVerdict(null);
            }}
            scale={SCALE}
            max={18}
            step={1}
            allowFlip
            kind="ghost"
            label={(v) => (v === 0 ? undefined : `Tahmin: ${Math.abs(v)} N`)}
            labelPos="tip"
            testId="lab-guess"
          />
        )}
        {revealed && (
          <g transform={`translate(${offset} 0)`}>
            {guess !== 0 && (
              <ForceArrow x={CX} y={R_ROW + 1} axis="yatay" sign={guess > 0 ? 1 : -1} length={arrowLength(Math.abs(guess), SCALE)} kind="ghost" opacity={0.6} />
            )}
            {R.sign !== 0 ? (
              <ForceArrow x={CX} y={R_ROW} axis="yatay" sign={R.sign} length={arrowLength(R.magnitude, SCALE)} kind="resultant" magnitude={R.magnitude} label={`R = ${R.magnitude} N`} labelPos="tip" testId="lab-r" />
            ) : (
              <text x={CX + 30} y={R_ROW + 12} fontSize={32} fontWeight={700} fill="var(--resultant-dark)" data-testid="lab-r-zero">
                R = 0 N
              </text>
            )}
          </g>
        )}
        <ScaleBadge x={40} y={ROWS[0] - 40} cell={SCALE.pxPerCell} newtons={1} />
        <text x={gx - 16} y={ROWS[1] + 10} textAnchor="end" fontSize={26} fontWeight={650} fill="var(--ink-soft)">◄ Batı</text>
        <text x={gx + gridCols * SCALE.pxPerCell + 16} y={ROWS[1] + 10} fontSize={26} fontWeight={650} fill="var(--ink-soft)">Doğu ►</text>
      </SceneSvg>

      <ModelBadge>Model: kutuya etki eden kuvvetler · Sürtünme ihmal edildi</ModelBadge>

      <div className="panel" style={{ left: 120, top: 160, width: 880, padding: '16px 26px' }} data-testid="lab-controls">
        {vals.map((v, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 6, transform: 'scale(0.9)', transformOrigin: 'left center', height: 84 }}>
            <span style={{ fontSize: 30, fontWeight: 750, color: 'var(--force-dark)', width: 60 }}>F{'₁₂₃'[i]}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                [-1, '◄ Batı'],
                [1, 'Doğu ►'],
              ].map(([sg, lb]) => (
                <button
                  key={sg}
                  className={`chip ${(v < 0 ? -1 : 1) === sg ? 'selected' : ''}`}
                  style={{ minHeight: 70, padding: '0 20px', fontSize: 26 }}
                  data-testid={`lab-dir-${i + 1}-${sg === 1 ? 'dogu' : 'bati'}`}
                  disabled={busy}
                  onClick={() => change(() => setVals((a) => a.map((x, j) => (j === i ? (sg as number) * Math.max(1, Math.abs(x)) : x))))}
                >
                  {lb}
                </button>
              ))}
            </div>
            <Stepper
              value={Math.abs(v)}
              onChange={(m) => change(() => setVals((a) => a.map((x, j) => (j === i ? (x < 0 ? -m : m) : x))))}
              step={1}
              min={0}
              max={MAXF}
              format={(m) => `${m} N`}
              disabled={busy}
              testId={`lab-step-${i + 1}`}
            />
          </div>
        ))}
        <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
          {vals.length < 3 ? (
            <button className="btn" style={{ minHeight: 64, fontSize: 24 }} disabled={busy} data-testid="lab-add" onClick={() => change(() => setVals((a) => [...a, -2]))}>
              + Üçüncü kuvveti ekle
            </button>
          ) : (
            <button className="btn" style={{ minHeight: 64, fontSize: 24 }} disabled={busy} data-testid="lab-remove" onClick={() => change(() => setVals((a) => a.slice(0, 2)))}>
              − Üçüncü kuvveti kaldır
            </button>
          )}
        </div>
      </div>

      <div className="panel" style={{ left: 1040, top: 160, width: 780, padding: '16px 26px' }} data-testid="lab-actions">
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-primary" disabled={busy || revealed} data-testid="lab-show" onClick={reveal}>
            Göster
          </button>
          <button
            className="btn"
            disabled={busy || !revealed}
            data-testid="lab-play"
            onClick={() => {
              setOffset(0);
              play.fire(R.sign * R.magnitude);
            }}
          >
            ▶ Hareketi oynat
          </button>
          <button className="btn" disabled={busy} data-testid="lab-reset" onClick={() => change(() => undefined)}>
            Sıfırla
          </button>
        </div>
        <div style={{ minHeight: 96, marginTop: 14 }}>
          {revealed ? (
            <>
              <div className="equation" style={{ fontSize: 36 }} data-testid="lab-equation">
                {active.length ? equation(forces) : 'R = 0 N'}
              </div>
              <div style={{ fontSize: 24, color: 'var(--ink-soft)', marginTop: 4 }}>
                {describeResultant(R)}
                {verdict ? ` · ${verdict}` : ''}
              </div>
            </>
          ) : (
            <div style={{ fontSize: 24, color: 'var(--ink-soft)', lineHeight: 1.4 }}>
              Önce mavi oku sürükleyerek bileşkeyi <b>tahmin edin</b>, sonra <b>Göster</b>'e basın.
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
          {GOALS.map((g) => (
            <span
              key={g.id}
              data-testid={`goal-${g.id}`}
              data-done={done.includes(g.id)}
              style={{
                padding: '8px 16px',
                borderRadius: 999,
                fontSize: 21,
                fontWeight: 650,
                background: done.includes(g.id) ? 'var(--success-soft)' : 'var(--paper-2)',
                color: done.includes(g.id) ? '#12673b' : 'var(--ink-soft)',
              }}
            >
              {done.includes(g.id) ? '✓ ' : '○ '}
              {g.label}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
