import { useState } from 'react';
import { Kid } from '../../../art/characters';
import { Crate, Rope } from '../../../art/objects';
import { useLatest, useScript, useSignal } from '../../../engine/react';
import { sfx } from '../../../engine/sfx';
import { arrowLength, resultant, type Force, type Scale } from '../../../physics/forces';
import { ForceArrow } from '../../../ui/force/ForceArrow';
import { EastWestStrip } from '../../../ui/force/Grid';
import { Feedback, RuleCard } from '../../../ui/widgets';
import { SceneSvg } from '../common';

const Q2_SCALE: Scale = { newtonsPerCell: 5, pxPerCell: 30 };
const Q2: Force[] = [
  { id: 'a', magnitude: 15, sign: 1, axis: 'yatay' },
  { id: 'b', magnitude: 25, sign: -1, axis: 'yatay' },
];
const Q2_R = resultant(Q2);
const Q2_OPTIONS = [
  { id: 'x', magnitude: 40, sign: -1 as const },
  { id: 'ok', magnitude: Q2_R.magnitude, sign: Q2_R.sign as 1 | -1 },
  { id: 'y', magnitude: 10, sign: 1 as const },
];
const Q3_OPTIONS = [
  { id: 'ok', text: 'Cisme etki eden kuvvetlerin etkisini tek başına yapabilen kuvvettir.' },
  { id: 'enbuyuk', text: 'Cisme etki eden kuvvetlerden en büyüğüdür.' },
  { id: 'hareket', text: 'Cismin her zaman hareket ettiği yöndeki kuvvettir.' },
];

type Phase = 'intro' | 'q1' | 'q2' | 'q3' | 'summary' | 'teaser' | 'end';

/** Sahne 11 — Kapanış: kısa kontroller, özet ve sonraki konuya merak sorusu. */
export function S11Kapanis() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [yon, setYon] = useState<string | null>(null);
  const [dog, setDog] = useState<string | null>(null);
  const [pick, setPick] = useState<string | null>(null);
  const [wrong, setWrong] = useState<string | null>(null);
  const [fb, setFb] = useState<{ kind: 'ok' | 'hint'; text: string } | null>(null);
  const answer = useSignal<boolean>();
  const st = useLatest({ yon, dog });

  useScript(async (s) => {
    await s.narrate('s11.a');
    const ask = async (p: Phase, narr: string) => {
      setPhase(p);
      setPick(null);
      setWrong(null);
      setFb(null);
      answer.clear();
      s.narrateBg(narr);
      for (;;) {
        const ok = await s.waitFor(answer);
        if (ok) {
          sfx.success();
          setFb({ kind: 'ok', text: 'Doğru!' });
          await s.say('s11.dogru');
          break;
        }
        sfx.retry();
        setFb({ kind: 'hint', text: 'Tekrar düşünelim.' });
        await s.say('s11.yanlis');
      }
      await s.wait(0.4);
    };
    await ask('q1', 's11.q1');
    await ask('q2', 's11.q2');
    await ask('q3', 's11.q3');
    setFb(null);
    setPhase('summary');
    await s.narrate('s11.ozet');
    await s.wait(0.6);
    setPhase('teaser');
    await s.narrate('s11.merak');
    await s.waitContinue();
    setPhase('end');
    await s.narrate('s11.son');
    s.complete();
  });

  const choose = (id: string, ok: boolean) => {
    sfx.tap();
    setPick(id);
    setWrong(ok ? null : id);
    answer.fire(ok);
  };

  return (
    <>
      <SceneSvg>
        <defs>
          <linearGradient id="endBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f3efff" />
            <stop offset="1" stopColor="#e9f3ee" />
          </linearGradient>
        </defs>
        <rect width={1920} height={1080} fill="url(#endBg)" />

        {phase === 'q1' && (
          <g className="fade-in">
            <Crate x={700} y={470} size={170} />
            <ForceArrow x={615} y={470} axis="yatay" sign={-1} length={260} showPoint label="F" labelPos="above" testId="q1-arrow" />
            <EastWestStrip x={320} y={640} width={760} />
          </g>
        )}
        {phase === 'q2' && (
          <g className="fade-in">
            <Crate x={960} y={360} size={130} />
            <ForceArrow x={1025} y={345} axis="yatay" sign={1} length={arrowLength(15, Q2_SCALE)} showPoint label="15 N" labelPos="tip" />
            <ForceArrow x={895} y={375} axis="yatay" sign={-1} length={arrowLength(25, Q2_SCALE)} showPoint label="25 N" labelPos="tip" />
            <EastWestStrip x={560} y={470} width={800} />
          </g>
        )}
        {(phase === 'teaser' || phase === 'end') && (
          <g className="fade-in" data-testid="teaser">
            <rect x={0} y={760} width={1920} height={320} fill="#a8d08a" />
            <line x1={960} y1={750} x2={960} y2={800} stroke="#fff" strokeWidth={8} strokeDasharray="12 8" />
            <Rope x1={360} x2={1560} y={610} marker={960} />
            {[560, 420].map((x, i) => (
              <Kid key={`l${i}`} x={x} y={760} pose="pull" shirt="#f08a24" hairStyle={i ? 'long' : 'short'} />
            ))}
            {[1360, 1500].map((x, i) => (
              <Kid key={`r${i}`} x={x} y={760} pose="pull" flip shirt="#2f9e6b" hairStyle={i ? 'curly' : 'short'} />
            ))}
            <ForceArrow x={644} y={610} axis="yatay" sign={-1} length={200} showPoint />
            <ForceArrow x={1276} y={610} axis="yatay" sign={1} length={200} showPoint />
            <text x={960} y={500} textAnchor="middle" fontSize={120} fontWeight={800} fill="var(--interact)" opacity={0.9}>
              ?
            </text>
          </g>
        )}
      </SceneSvg>

      {phase === 'q1' && (
        <div className="panel fade-in" style={{ left: 1180, top: 250, width: 620 }} data-testid="q1-panel">
          <h3>Yön</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
            {['Doğu', 'Batı', 'Yukarı', 'Aşağı'].map((o) => (
              <button key={o} className={`chip ${yon === o ? 'selected' : ''}`} data-testid={`q1-yon-${o}`} onClick={() => (sfx.tap(), setYon(o))}>
                {o}
              </button>
            ))}
          </div>
          <h3>Doğrultu</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {['Doğu–batı', 'Düşey'].map((o) => (
              <button key={o} className={`chip ${dog === o ? 'selected' : ''}`} data-testid={`q1-dog-${o}`} onClick={() => (sfx.tap(), setDog(o))}>
                {o}
              </button>
            ))}
          </div>
          <button
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 22 }}
            disabled={!yon || !dog}
            data-testid="check"
            onClick={() => answer.fire(st.current.yon === 'Batı' && st.current.dog === 'Doğu–batı')}
          >
            Kontrol Et
          </button>
        </div>
      )}

      {phase === 'q2' && (
        <div className="fade-in" style={{ position: 'absolute', left: 0, right: 0, top: 540, display: 'flex', gap: 30, justifyContent: 'center' }}>
          {Q2_OPTIONS.map((o) => (
            <button
              key={o.id}
              className={`chip ${pick === o.id ? (wrong === o.id ? 'hint' : 'correct') : ''}`}
              style={{ width: 420, height: 180, flexDirection: 'column', gap: 6 }}
              data-testid={`q2-${o.id}`}
              onClick={() => choose(o.id, o.id === 'ok')}
            >
              <svg width="380" height="90" viewBox="0 0 380 90" aria-hidden="true">
                <ForceArrow x={o.sign === 1 ? 70 : 310} y={45} axis="yatay" sign={o.sign} length={arrowLength(o.magnitude, Q2_SCALE)} kind="resultant" thickness={14} />
              </svg>
              R = {o.magnitude} N · {o.sign === 1 ? 'doğu' : 'batı'}
            </button>
          ))}
        </div>
      )}

      {phase === 'q3' && (
        <div className="fade-in" style={{ position: 'absolute', left: 320, right: 320, top: 260, display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={{ fontSize: 36, fontWeight: 750, textAlign: 'center', marginBottom: 6 }}>Bileşke kuvvet için hangi cümle doğrudur?</div>
          {Q3_OPTIONS.map((o) => (
            <button
              key={o.id}
              className={`chip ${pick === o.id ? (wrong === o.id ? 'hint' : 'correct') : ''}`}
              style={{ justifyContent: 'flex-start', textAlign: 'left', minHeight: 100 }}
              data-testid={`q3-${o.id}`}
              onClick={() => choose(o.id, o.id === 'ok')}
            >
              {o.text}
            </button>
          ))}
        </div>
      )}

      {phase === 'summary' && (
        <>
          <div className="panel fade-in" style={{ left: 180, top: 200, width: 1560, textAlign: 'center' }} data-testid="summary">
            <h3 style={{ fontSize: 38, color: 'var(--resultant-dark)' }}>Bileşke kuvvet (R)</h3>
            <div style={{ fontSize: 30 }}>Bir cisme etki eden kuvvetlerin etkisini tek başına yapabilen kuvvettir.</div>
          </div>
          <RuleCard title="Aynı yönlü kuvvetler" index={1} style={{ left: 300, top: 420, width: 600 }}>
            Büyüklükler <b>toplanır</b>. R aynı yöndedir. <br />
            <span style={{ fontWeight: 700, color: 'var(--ink)' }}>30 N + 20 N = 50 N</span>
          </RuleCard>
          <RuleCard title="Zıt yönlü kuvvetler" index={2} style={{ left: 1020, top: 420, width: 600 }}>
            Büyükten küçük <b>çıkarılır</b>. R büyük kuvvetin yönündedir. <br />
            <span style={{ fontWeight: 700, color: 'var(--ink)' }}>100 N − 10 N = 90 N</span>
          </RuleCard>
        </>
      )}

      {(phase === 'teaser' || phase === 'end') && (
        <>
          <div className="badge-model" style={{ left: 60, top: 330, fontSize: 28, fontWeight: 750, color: '#9a4f06' }}>
            Turuncu takım · 50 N
          </div>
          <div className="badge-model" style={{ left: 'auto', right: 60, top: 330, fontSize: 28, fontWeight: 750, color: '#1d6b47' }}>
            Yeşil takım · 50 N
          </div>
        </>
      )}
      {(phase === 'teaser' || phase === 'end') && (
        <div className="prompt-card fade-in" style={{ top: 130 }} data-testid="teaser-card">
          <div style={{ fontSize: 22, color: 'var(--interact)', fontWeight: 700, letterSpacing: '0.06em' }}>SONRAKİ KONUYA MERAK</div>
          İki takım halatı aynı büyüklükte kuvvetle çekiyor. Sizce ne olur?
        </div>
      )}

      {(phase === 'q1' || phase === 'q2' || phase === 'q3') && (
        <div className="badge-model" style={{ top: 116 }}>
          Kontrol {phase === 'q1' ? 1 : phase === 'q2' ? 2 : 3} / 3
        </div>
      )}
      {fb && <Feedback token={fb} kind={fb.kind} style={{ right: 120, top: 116 }}>{fb.text}</Feedback>}
    </>
  );
}
