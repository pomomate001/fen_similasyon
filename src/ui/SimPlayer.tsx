import { useEffect, useMemo, useState } from 'react';
import { NarrationAudio } from '../engine/audio';
import { PlayerController } from '../engine/controller';
import { parseEmphasis } from '../engine/narration';
import { PlayerProvider, usePlayer, usePlayerState } from '../engine/react';
import { sfx } from '../engine/sfx';
import type { SimDef } from '../engine/types';
import {
  IconCheck,
  IconHome,
  IconInfo,
  IconMute,
  IconNext,
  IconPause,
  IconPlay,
  IconPrev,
  IconReplay,
  IconRestart,
  IconSound,
  IconSwap,
} from './icons';
import { Stage } from './Stage';

export interface PlayerSettings {
  startIndex?: number;
  muted?: boolean;
  timeScale?: number;
}

type Side = 'left' | 'right';
const SIDE_KEY = 'fen.dockSide';

function readSide(): Side {
  try {
    return localStorage.getItem(SIDE_KEY) === 'right' ? 'right' : 'left';
  } catch {
    return 'left';
  }
}

export function SimPlayer({ sim, settings, onExit }: { sim: SimDef; settings: PlayerSettings; onExit: () => void }) {
  const controller = useMemo(() => {
    const audio = new NarrationAudio(sim.audioBase);
    return new PlayerController({
      sceneCount: sim.scenes.length,
      manifest: sim.narration,
      audio,
      startIndex: settings.startIndex,
      muted: settings.muted,
      timeScale: settings.timeScale,
    });
  }, [sim, settings.startIndex, settings.muted, settings.timeScale]);

  useEffect(() => () => controller.dispose(), [controller]);

  return (
    <PlayerProvider controller={controller}>
      <Stage>
        <PlayerChrome sim={sim} onExit={onExit} />
      </Stage>
    </PlayerProvider>
  );
}

function PlayerChrome({ sim, onExit }: { sim: SimDef; onExit: () => void }) {
  const ctrl = usePlayer();
  const st = usePlayerState();
  const [side, setSide] = useState<Side>(readSide);
  const [teacherOpen, setTeacherOpen] = useState(false);
  const [confirm, setConfirm] = useState<null | 'restart' | 'home'>(null);
  const scene = sim.scenes[st.sceneIndex];
  const Scene = scene.component;
  const ready = st.phase !== 'running';

  // Sunum kumandası / klavye: → PageDown Enter = Devam, ← PageUp = Önceki, P / Boşluk = Duraklat
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (confirm) return;
      if (['ArrowRight', 'PageDown', 'Enter'].includes(e.key)) {
        e.preventDefault();
        ctrl.pressContinue();
      } else if (['ArrowLeft', 'PageUp'].includes(e.key)) {
        e.preventDefault();
        ctrl.prev();
      } else if (e.key === ' ' || e.key.toLowerCase() === 'p') {
        e.preventDefault();
        ctrl.togglePause();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ctrl, confirm]);

  const flipSide = () => {
    const s: Side = side === 'left' ? 'right' : 'left';
    setSide(s);
    try {
      localStorage.setItem(SIDE_KEY, s);
    } catch {
      /* yok say */
    }
  };

  const continueLabel =
    st.continueLabel ??
    (st.phase === 'complete' && st.sceneIndex === sim.scenes.length - 1 ? 'Bitir' : 'Devam Et');

  const otherSide: Side = side === 'left' ? 'right' : 'left';

  return (
    <>
      <div className="scene-layer" key={`${st.sceneIndex}-${st.sceneKey}`} data-testid={`scene-${scene.id}`}>
        <Scene />
      </div>

      <header className="topbar">
        <button className="btn btn-icon" aria-label="Ana sayfa" onClick={() => setConfirm('home')}>
          <IconHome />
        </button>
        <div className="sim-title">{sim.title}</div>
        <nav className="progress" aria-label="Sahneler">
          {sim.parts.map((name, pi) => (
            <div key={name} className={`progress-part ${scene.part === pi ? 'is-current' : ''}`}>
              <span className="progress-part-name">{name}</span>
              {sim.scenes.map((sc, i) =>
                sc.part !== pi ? null : (
                  <button
                    key={sc.id}
                    className={`dot ${i === st.sceneIndex ? 'current' : i < st.sceneIndex ? 'done' : ''}`}
                    aria-label={`${i + 1}. sahne: ${sc.title}`}
                    title={sc.title}
                    onClick={() => ctrl.goTo(i)}
                  />
                ),
              )}
            </div>
          ))}
        </nav>
        <button
          className={`btn btn-icon ${teacherOpen ? 'is-on' : ''}`}
          aria-label="Öğretmen notları"
          onClick={() => setTeacherOpen((v) => !v)}
        >
          <IconInfo />
        </button>
      </header>

      <Subtitle side={side} />

      <div className={`dock side-${side}`} role="toolbar" aria-label="Kontroller">
        <button className="btn btn-icon" aria-label="Önceki sahne" title="Önceki sahne" onClick={() => ctrl.prev()}>
          <IconPrev />
        </button>
        <button
          className="btn btn-icon"
          aria-label="Anlatımı tekrar dinle"
          title="Anlatımı tekrar dinle"
          disabled={st.narrating || st.paused}
          onClick={() => ctrl.replay()}
        >
          <IconReplay />
        </button>
        <button
          className={`btn btn-icon ${st.paused ? 'is-on' : ''}`}
          aria-label={st.paused ? 'Sürdür' : 'Duraklat'}
          title={st.paused ? 'Sürdür' : 'Duraklat'}
          onClick={() => ctrl.togglePause()}
        >
          {st.paused ? <IconPlay /> : <IconPause />}
        </button>
        <button
          className={`btn btn-icon ${st.muted ? 'is-on' : ''}`}
          aria-label={st.muted ? 'Sesi aç' : 'Sesi kapat'}
          title={st.muted ? 'Sesi aç' : 'Sesi kapat'}
          onClick={() => ctrl.toggleMuted()}
        >
          {st.muted ? <IconMute /> : <IconSound />}
        </button>
        <button
          className="btn btn-icon"
          aria-label="Simülasyonu yeniden başlat"
          title="Simülasyonu yeniden başlat"
          onClick={() => setConfirm('restart')}
        >
          <IconRestart />
        </button>
      </div>

      <button
        className={`continue side-${otherSide} ${ready && !st.paused ? 'ready' : ''}`}
        disabled={!ready || st.paused}
        data-testid="continue"
        onClick={() => {
          sfx.unlock();
          ctrl.pressContinue();
        }}
      >
        {st.phase === 'complete' && st.sceneIndex === sim.scenes.length - 1 ? <IconCheck /> : <IconNext />}
        <span>{continueLabel}</span>
      </button>

      {teacherOpen && (
        <aside className="teacher-panel" aria-label="Öğretmen notları">
          <h3>Öğretmen Notları</h3>
          <p className="sub">
            {st.sceneIndex + 1}. sahne · {scene.title}
          </p>
          <ul>
            {(scene.teacherNotes ?? ['Bu sahne için ek not yok.']).map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
          <div className="row">
            <button className="btn" onClick={flipSide}>
              <IconSwap /> Kontrolleri {side === 'left' ? 'sağa' : 'sola'} al
            </button>
            <span>Kumanda: → Devam · ← Önceki · P Duraklat</span>
          </div>
        </aside>
      )}

      {st.paused && (
        <div className="overlay" data-testid="pause-overlay">
          <div className="pause-card">
            Duraklatıldı
            <button className="btn btn-primary" onClick={() => ctrl.setPaused(false)}>
              <IconPlay /> Sürdür
            </button>
          </div>
        </div>
      )}

      {confirm && (
        <div className="overlay">
          <div className="dialog" role="dialog" aria-modal="true">
            <h2>{confirm === 'restart' ? 'Baştan başlatılsın mı?' : 'Ana sayfaya dönülsün mü?'}</h2>
            <p>
              {confirm === 'restart'
                ? 'Simülasyon ilk sahneden yeniden başlar.'
                : 'Simülasyondan çıkılır; ilerleme kaydedilmez.'}
            </p>
            <div className="row">
              <button className="btn" onClick={() => setConfirm(null)}>
                Vazgeç
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  const c = confirm;
                  setConfirm(null);
                  if (c === 'restart') ctrl.restartAll();
                  else onExit();
                }}
              >
                {confirm === 'restart' ? 'Baştan başlat' : 'Ana sayfaya dön'}
              </button>
            </div>
          </div>
        </div>
      )}

      {st.finished && (
        <div className="overlay" data-testid="finished">
          <div className="dialog">
            <h2>Simülasyon tamamlandı 🎉</h2>
            <p>Bileşke kuvvet konusundaki tüm sahneleri bitirdiniz.</p>
            <div className="row">
              <button className="btn" onClick={() => ctrl.restartAll()}>
                <IconRestart /> Baştan başla
              </button>
              <button className="btn btn-primary" onClick={onExit}>
                <IconHome /> Ana sayfa
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Subtitle({ side }: { side: Side }) {
  const st = usePlayerState();
  const parts = st.subtitle ? parseEmphasis(st.subtitle.text) : [];
  const style = side === 'left' ? { left: 600, right: 250 } : { left: 250, right: 600 };
  return (
    <div
      className={`subtitle ${st.subtitle ? '' : 'hidden'}`}
      style={{ ...style, transform: 'none', bottom: 26, fontSize: 30, maxWidth: 'none' }}
      aria-live="polite"
      data-testid="subtitle"
    >
      {parts.map((p, i) => (p.em ? <em key={i}>{p.t}</em> : <span key={i}>{p.t}</span>))}
    </div>
  );
}
