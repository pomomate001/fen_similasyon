import { useEffect, useState } from 'react';

/**
 * Bağımlılıksız hash yönlendirme: uygulama bir klasörden veya USB'den
 * (sunucu yapılandırması gerekmeden) açılabilsin.
 *   #/                      → ana sayfa
 *   #/sim/bileske-kuvvet    → simülasyon
 * Sorgu parametreleri (test/önizleme): ?sahne=3&ses=0&hiz=10
 */
export interface Route {
  name: 'home' | 'sim';
  simId?: string;
  params: URLSearchParams;
}

export function parseRoute(hash: string, search: string): Route {
  const h = hash.replace(/^#/, '');
  const [path, q = ''] = h.split('?');
  const params = new URLSearchParams(search);
  new URLSearchParams(q).forEach((v, k) => params.set(k, v));
  const m = path.match(/^\/sim\/([\w-]+)/);
  if (m) return { name: 'sim', simId: m[1], params };
  return { name: 'home', params };
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash, window.location.search));
  useEffect(() => {
    const on = () => setRoute(parseRoute(window.location.hash, window.location.search));
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export function navigate(path: string) {
  window.location.hash = path;
}
