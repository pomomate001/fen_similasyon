import { useEffect, useState } from 'react';
import type { SimDef } from './engine/types';
import { Home } from './pages/Home';
import { navigate, useRoute } from './router';
import { simRegistry } from './sims/registry';
import { SimPlayer, type PlayerSettings } from './ui/SimPlayer';

export function App() {
  const route = useRoute();
  if (route.name === 'sim' && route.simId && simRegistry[route.simId]) {
    const p = route.params;
    const settings: PlayerSettings = {
      startIndex: p.has('sahne') ? Math.max(0, Number(p.get('sahne')) - 1) : undefined,
      muted: p.get('ses') === '0',
      timeScale: p.has('hiz') ? Math.max(0.25, Number(p.get('hiz')) || 1) : undefined,
    };
    return <SimLoader key={`${route.simId}?${p.toString()}`} simId={route.simId} settings={settings} />;
  }
  return <Home />;
}

function SimLoader({ simId, settings }: { simId: string; settings: PlayerSettings }) {
  const [sim, setSim] = useState<SimDef | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let alive = true;
    simRegistry[simId]()
      .then((s) => alive && setSim(s))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [simId]);
  if (error) return <div style={{ color: '#fff', padding: 40, fontSize: 28 }}>Simülasyon yüklenemedi.</div>;
  if (!sim) return null;
  return <SimPlayer sim={sim} settings={settings} onExit={() => navigate('/')} />;
}
