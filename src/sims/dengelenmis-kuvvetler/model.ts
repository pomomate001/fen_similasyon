import { equation, resultant, type Force, type Resultant } from '../../physics/forces';

/**
 * Balonlarla havada asılı kalan öğrenci — düşey doğrultuda kuvvet modeli.
 *
 * Değerler temsilîdir: öğrencinin ağırlığı 500 N (≈ 50 kg, g ≈ 10 m/s²),
 * her balonun net kaldırma kuvveti 100 N. Hava direnci ihmal edilir; bu yüzden
 * bileşke sıfır olduğunda öğrenci duruyorsa durur, hareket ediyorsa sabit
 * süratle devam eder (ders kitabı s. 57).
 */
export const WEIGHT_N = 500;
export const BALLOON_N = 100;
export const G = 10;
export const MASS_KG = WEIGHT_N / G;

export const START_BALLOONS = 5;
export const MIN_BALLOONS = 0;
export const MAX_BALLOONS = 8;

export function clampBalloons(n: number): number {
  return Math.max(MIN_BALLOONS, Math.min(MAX_BALLOONS, Math.round(n)));
}

/** Ekranda ayrı ayrı gösterilen kuvvetler: her balon için bir ok + ağırlık */
export function kidForces(balloons: number): Force[] {
  const list: Force[] = [{ id: 'agirlik', magnitude: WEIGHT_N, sign: -1, axis: 'dusey', name: 'Yer çekimi kuvveti' }];
  for (let i = 0; i < balloons; i++) {
    list.push({ id: `balon-${i}`, magnitude: BALLOON_N, sign: 1, axis: 'dusey', name: 'Balonun kuvveti' });
  }
  return list;
}

export function netForce(balloons: number): Resultant {
  return resultant(kidForces(balloons));
}

/**
 * İşlem satırı: balonların toplam kuvveti tek terim olarak yazılır
 * (R = 500 N − 500 N = 0 N), sekiz ayrı "100 N" yerine.
 */
export function netEquation(balloons: number): string {
  return equation([
    { id: 'balonlar', magnitude: balloons * BALLOON_N, sign: 1, axis: 'dusey' },
    { id: 'agirlik', magnitude: WEIGHT_N, sign: -1, axis: 'dusey' },
  ]);
}

/** İvme (m/s²), yukarı pozitif */
export function acceleration(balloons: number): number {
  const r = netForce(balloons);
  return (r.sign * r.magnitude) / MASS_KG;
}

export interface Motion {
  /** Yükseklik (m), yukarı pozitif */
  h: number;
  /** Hız (m/s), yukarı pozitif */
  v: number;
}

/** Yarı örtük Euler adımı; R = 0 iken hız hiç değişmez. */
export function step(m: Motion, balloons: number, dt: number): Motion {
  const v = m.v + acceleration(balloons) * dt;
  return { v, h: m.h + v * dt };
}
