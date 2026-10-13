/**
 * Basitleştirilmiş hareket modeli (temsili).
 *
 * - Başlangıçta duran bir cisim, bileşke kuvvet sıfırdan farklıysa bileşke yönünde
 *   GİDEREK HIZLANARAK harekete başlar: x(t) = ½·a·t², a = R / m.
 * - Bileşke sıfırsa duran cisim durmaya devam eder.
 * - Yukarı atılan top: hava direnci ihmal; tek kuvvet yerçekimi (aşağı),
 *   y(t) = v0·t − ½·g·t² (yukarı pozitif).
 *
 * Animasyonlar yavaşlayarak "kendiliğinden durmaz"; sahne donmuş kareyle biter.
 * (Yavaşlayıp durma, ek bir kuvvet olduğunu ima ederdi.)
 */

/** Durgun başlangıçtan, sabit bileşke altında konum (piksel). signedR: işaretli bileşke. */
export function positionFromRest(signedR: number, mass: number, t: number, pxPerUnit = 1): number {
  if (mass <= 0) throw new Error('Kütle pozitif olmalıdır.');
  const a = signedR / mass;
  return 0.5 * a * t * t * pxPerUnit;
}

/** Durgun başlangıçtan hız. */
export function velocityFromRest(signedR: number, mass: number, t: number): number {
  return (signedR / mass) * t;
}

export interface Throw {
  /** başlangıç hızı (yukarı pozitif, piksel/sn) */
  v0: number;
  /** yerçekimi ivmesi büyüklüğü (piksel/sn²) */
  g: number;
}

/** Yukarı atılan topun yüksekliği (yukarı pozitif) */
export function throwHeight({ v0, g }: Throw, t: number): number {
  return v0 * t - 0.5 * g * t * t;
}

/** Yukarı atılan topun hızı (yukarı pozitif) */
export function throwVelocity({ v0, g }: Throw, t: number): number {
  return v0 - g * t;
}

/** Tepe noktasına çıkış süresi */
export function timeToApex({ v0, g }: Throw): number {
  return v0 / g;
}

/** Tepe yüksekliği */
export function apexHeight(th: Throw): number {
  return (th.v0 * th.v0) / (2 * th.g);
}

/** Verilen tepe yüksekliğine çıkacak başlangıç hızı */
export function v0ForApex(apex: number, g: number): number {
  return Math.sqrt(2 * g * apex);
}

/** Serbest düşüş: h yüksekliğinden düşme süresi */
export function fallTime(h: number, g: number): number {
  return Math.sqrt((2 * h) / g);
}
