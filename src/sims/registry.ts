import type { ComponentType } from 'react';
import type { SimDef } from '../engine/types';

/** Simülasyonlar ayrı paketlere bölünerek gerektiğinde yüklenir. */
export const simRegistry: Record<string, () => Promise<SimDef>> = {
  'bileske-kuvvet': () => import('./bileske-kuvvet').then((m) => m.default),
};

export interface StandaloneSimProps {
  params: URLSearchParams;
  onExit: () => void;
}

/**
 * Anlatımsız, tek sahnelik simülasyonlar: sahne motorunu ve SimPlayer'ı kullanmaz,
 * kendi denetimlerini çizer.
 */
export const standaloneRegistry: Record<string, () => Promise<ComponentType<StandaloneSimProps>>> = {
  'dengelenmis-kuvvetler': () => import('./dengelenmis-kuvvetler/DengeSim').then((m) => m.default),
};
