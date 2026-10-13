import { useState } from 'react';
import { useScript, useSignal } from '../../../engine/react';
import { sfx } from '../../../engine/sfx';
import { EastWestStrip, UpDownGauge } from '../../../ui/force/Grid';
import { Feedback } from '../../../ui/widgets';
import { SceneSvg } from '../common';
import { DrawTask, MaxMinTask, MissingTask, SortTask, type CheckResult, type DrawCfg } from '../tasks';

interface TaskDef {
  id: string;
  narr: string;
  title: string;
  kind: 'sort' | 'draw' | 'missing' | 'maxmin';
  axis?: 'yatay' | 'dusey';
  cfg?: DrawCfg;
}

/** Görevler kolaydan zora: önce görsel ayırt etme, sonra çizim, en son akıl yürütme. */
export const TASKS: TaskDef[] = [
  { id: 'g1', narr: 's10.g1', title: 'Aynı yönlü mü, zıt yönlü mü?', kind: 'sort' },
  {
    id: 'g2',
    narr: 's10.g2',
    title: 'Bileşkeyi çiz: aynı yönlü kuvvetler',
    kind: 'draw',
    axis: 'yatay',
    cfg: {
      axis: 'yatay',
      scale: { newtonsPerCell: 1, pxPerCell: 50 },
      forces: [
        { magnitude: 3, sign: 1, at: 'dogu' },
        { magnitude: 4, sign: 1, at: 'dogu' },
      ],
      showValues: false,
      object: 'crate',
      hints: ['s10.ipucu.ayni', 's10.ipucu.kare'],
    },
  },
  {
    id: 'g3',
    narr: 's10.g3',
    title: 'Bileşkeyi çiz: iple çekilen kutu',
    kind: 'draw',
    axis: 'dusey',
    cfg: {
      axis: 'dusey',
      scale: { newtonsPerCell: 1, pxPerCell: 50 },
      forces: [
        { magnitude: 5, sign: 1, at: 'orta', note: 'ip' },
        { magnitude: 3, sign: -1, at: 'orta', note: 'yerçekimi' },
      ],
      showValues: true,
      object: 'rope',
      hints: ['s10.ipucu.zit', 's10.ipucu.kare'],
    },
  },
  {
    id: 'g4',
    narr: 's10.g4',
    title: 'Bileşkeyi çiz: her kare 2 N',
    kind: 'draw',
    axis: 'yatay',
    cfg: {
      axis: 'yatay',
      scale: { newtonsPerCell: 2, pxPerCell: 50 },
      forces: [
        { magnitude: 6, sign: -1, at: 'bati' },
        { magnitude: 10, sign: 1, at: 'dogu' },
      ],
      showValues: false,
      object: 'crate',
      hints: ['s10.ipucu.kare', 's10.ipucu.zit'],
    },
  },
  {
    id: 'g5',
    narr: 's10.g5',
    title: 'Bileşkeyi çiz: üç kuvvet',
    kind: 'draw',
    axis: 'yatay',
    cfg: {
      axis: 'yatay',
      scale: { newtonsPerCell: 1, pxPerCell: 50 },
      forces: [
        { magnitude: 3, sign: -1, at: 'dogu', note: 'itme' },
        { magnitude: 2, sign: -1, at: 'bati', note: 'çekme' },
        { magnitude: 4, sign: 1, at: 'dogu', note: 'çekme' },
      ],
      showValues: true,
      object: 'table',
      hints: ['s10.ipucu.uc', 's10.ipucu.zit'],
    },
  },
  { id: 'g6', narr: 's10.g6', title: 'Eksik kuvveti bul', kind: 'missing', axis: 'yatay' },
  { id: 'g7', narr: 's10.g7', title: '⭐ En büyük ve en küçük bileşke', kind: 'maxmin', axis: 'yatay' },
];

/** Sahne 10 — Mini meydan okumalar. Süre sınırı yok; ipuçları kademeli. */
export function S10Gorevler() {
  const [idx, setIdx] = useState(-1);
  const [stage, setStage] = useState<'max' | 'min'>('max');
  const [assist, setAssist] = useState(false);
  const [locked, setLocked] = useState(false);
  const [fb, setFb] = useState<{ kind: 'ok' | 'hint'; text: string } | null>(null);
  const [solved, setSolved] = useState<number[]>([]);
  const check = useSignal<CheckResult>();

  useScript(async (s) => {
    await s.narrate('s10.intro');
    for (let i = 0; i < TASKS.length; i++) {
      const t = TASKS[i];
      setIdx(i);
      setAssist(false);
      setLocked(false);
      setFb(null);
      setStage('max');
      check.clear();
      s.narrateBg(t.narr);
      let wrong = 0;
      let mm: 'max' | 'min' = 'max';
      for (;;) {
        const r = await s.waitFor(check);
        if (r.ok) {
          sfx.success();
          setFb({ kind: 'ok', text: 'Doğru!' });
          if (t.kind === 'maxmin') {
            // İki aşamalı görev: önce en büyük, sonra en küçük
            if (mm === 'max') {
              mm = 'min';
              setStage('min');
              await s.say('s10.g7.kucuk');
              setFb(null);
              wrong = 0;
              continue;
            }
          }
          setLocked(true);
          await s.say(i % 2 ? 's10.dogru2' : 's10.dogru1');
          setSolved((x) => [...x, i]);
          break;
        }
        wrong++;
        sfx.retry();
        setFb({ kind: 'hint', text: wrong >= 2 ? 'İpucu açıldı: oklara bakın.' : 'Tekrar deneyelim.' });
        if (wrong >= 2) setAssist(true);
        await s.say(r.hint ?? 's11.yanlis');
      }
      await s.wait(0.5);
    }
    setFb({ kind: 'ok', text: 'Bütün görevler tamamlandı!' });
    await s.narrate('s10.son');
    s.complete();
  });

  const t = idx >= 0 ? TASKS[idx] : null;
  const onCheck = (r: CheckResult) => check.fire(r);

  return (
    <>
      <SceneSvg>
        <defs>
          <linearGradient id="taskBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f5f1ff" />
            <stop offset="1" stopColor="#eaf2f7" />
          </linearGradient>
        </defs>
        <rect width={1920} height={1080} fill="url(#taskBg)" />
        {t?.axis === 'yatay' && <EastWestStrip x={560} y={860} width={800} />}
        {t?.axis === 'dusey' && <UpDownGauge x={560} y={250} height={560} />}
      </SceneSvg>

      {t && (
        <div key={t.id} className="fade-in" data-testid={`task-${t.id}`} style={{ position: 'absolute', inset: 0 }}>
          {t.kind === 'sort' && <SortTask assist={assist} locked={locked} onCheck={onCheck} />}
          {t.kind === 'draw' && t.cfg && <DrawTask cfg={t.cfg} assist={assist} locked={locked} onCheck={onCheck} />}
          {t.kind === 'missing' && <MissingTask assist={assist} locked={locked} onCheck={onCheck} />}
          {t.kind === 'maxmin' && <MaxMinTask stage={stage} assist={assist} locked={locked} onCheck={onCheck} />}
        </div>
      )}

      {t && (
        <div className="panel" style={{ left: 120, top: 116, padding: '16px 26px', display: 'flex', alignItems: 'center', gap: 22 }} data-testid="task-header">
          <div style={{ display: 'flex', gap: 8 }}>
            {TASKS.map((x, i) => (
              <span
                key={x.id}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  background: solved.includes(i) ? 'var(--success)' : i === idx ? 'var(--interact)' : 'var(--paper-2)',
                  display: 'inline-block',
                }}
              />
            ))}
          </div>
          <div style={{ fontSize: 30, fontWeight: 750 }}>
            {idx + 1}/{TASKS.length} · {t.kind === 'maxmin' ? `${t.title} — ${stage === 'max' ? 'önce en büyük' : 'şimdi en küçük'}` : t.title}
          </div>
        </div>
      )}
      {fb && <Feedback token={fb} kind={fb.kind} style={{ right: 120, top: 116 }}>{fb.text}</Feedback>}
    </>
  );
}
