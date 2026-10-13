import type { SimDef } from '../engine/types';

/** Simülasyonlar ayrı paketlere bölünerek gerektiğinde yüklenir. */
export const simRegistry: Record<string, () => Promise<SimDef>> = {
  'bileske-kuvvet': () => import('./bileske-kuvvet').then((m) => m.default),
};
