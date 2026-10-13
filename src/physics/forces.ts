/**
 * Aynı doğrultudaki kuvvetler için ortak hesaplama modülü.
 *
 * Ekranda görünen her değer (ok uzunluğu, etiket, işlem satırı, yön sözcüğü)
 * bu modüldeki fonksiyonlardan türetilir; böylece görsel ile hesap ayrışamaz.
 *
 * Kurallar (6. sınıf, FB.6.2.1):
 *  - Aynı yönlü kuvvetler: büyüklükler toplanır, R aynı yöndedir.
 *  - Zıt yönlü kuvvetler: büyükten küçük çıkarılır, R büyük kuvvetin yönündedir.
 *  - R'nin doğrultusu, kuvvetlerin doğrultusuyla aynıdır.
 */

/** yatay: doğu–batı doğrultusu (yandan görünüş), dusey: yukarı–aşağı doğrultusu */
export type Axis = 'yatay' | 'dusey';

/** +1: doğu (ekranda sağ) veya yukarı; -1: batı (ekranda sol) veya aşağı */
export type Sign = 1 | -1;

export interface Force {
  id: string;
  /** Newton cinsinden büyüklük, negatif olamaz */
  magnitude: number;
  sign: Sign;
  axis: Axis;
  /** Öğrenciye gösterilen ad, ör. "Yerçekimi kuvveti" */
  name?: string;
}

export interface Resultant {
  /** Newton cinsinden büyüklük (>= 0) */
  magnitude: number;
  /** 0 ise bileşke sıfırdır ve yönü yoktur */
  sign: Sign | 0;
  axis: Axis;
}

export function assertSameAxis(forces: readonly Force[]): Axis {
  if (forces.length === 0) throw new Error('En az bir kuvvet gerekir.');
  const axis = forces[0].axis;
  for (const f of forces) {
    if (f.axis !== axis) throw new Error('Kuvvetler aynı doğrultuda olmalıdır.');
    if (!(f.magnitude >= 0) || !Number.isFinite(f.magnitude)) {
      throw new Error(`Geçersiz büyüklük: ${f.magnitude}`);
    }
  }
  return axis;
}

/** Kayan nokta artıklarını temizler (ör. 0.1 + 0.2). */
function clean(n: number): number {
  return Math.round(n * 1000) / 1000;
}

export function resultant(forces: readonly Force[]): Resultant {
  const axis = assertSameAxis(forces);
  const signed = clean(forces.reduce((acc, f) => acc + f.sign * f.magnitude, 0));
  const sign: Sign | 0 = signed > 0 ? 1 : signed < 0 ? -1 : 0;
  return { magnitude: Math.abs(signed), sign, axis };
}

/** Kuvvetlerin büyüklüklerini yönlerine göre toplar. */
export function sideTotals(forces: readonly Force[]): { positive: number; negative: number } {
  let positive = 0;
  let negative = 0;
  for (const f of forces) {
    if (f.sign === 1) positive += f.magnitude;
    else negative += f.magnitude;
  }
  return { positive: clean(positive), negative: clean(negative) };
}

export type Relation = 'tek' | 'ayni-yonlu' | 'zit-yonlu';

export function relation(forces: readonly Force[]): Relation {
  const active = forces.filter((f) => f.magnitude > 0);
  if (active.length <= 1) return 'tek';
  const s = active[0].sign;
  return active.every((f) => f.sign === s) ? 'ayni-yonlu' : 'zit-yonlu';
}

export function directionName(axis: Axis, sign: Sign | 0): string {
  if (sign === 0) return 'yönü yok';
  if (axis === 'yatay') return sign === 1 ? 'doğu' : 'batı';
  return sign === 1 ? 'yukarı' : 'aşağı';
}

/** "doğu yönünde", "aşağı yönde" gibi doğal ifade */
export function directionPhrase(axis: Axis, sign: Sign | 0): string {
  if (sign === 0) return 'yönü yok';
  if (axis === 'yatay') return sign === 1 ? 'doğu yönünde' : 'batı yönünde';
  return sign === 1 ? 'yukarı yönde' : 'aşağı yönde';
}

export function lineName(axis: Axis): string {
  return axis === 'yatay' ? 'doğu–batı' : 'düşey';
}

/** Sayıyı Türkçe ondalık biçimde yazar: 2.5 -> "2,5" */
export function formatNumber(n: number): string {
  const v = clean(n);
  return Number.isInteger(v) ? String(v) : String(v).replace('.', ',');
}

export function formatN(n: number): string {
  return `${formatNumber(n)} N`;
}

/**
 * Bileşke işlem satırı. Ders kitabıyla aynı biçim:
 *  aynı yönlü:  R = 30 N + 20 N = 50 N
 *  zıt yönlü:   R = 100 N − 10 N = 90 N
 *  çok kuvvet:  R = (20 N + 10 N) − 15 N = 15 N
 */
export function equation(forces: readonly Force[]): string {
  const active = forces.filter((f) => f.magnitude > 0);
  const r = resultant(forces);
  if (active.length === 0) return 'R = 0 N';
  if (active.length === 1) return `R = ${formatN(active[0].magnitude)}`;

  const rel = relation(active);
  if (rel === 'ayni-yonlu') {
    return `R = ${active.map((f) => formatN(f.magnitude)).join(' + ')} = ${formatN(r.magnitude)}`;
  }
  const pos = active.filter((f) => f.sign === 1).map((f) => f.magnitude);
  const neg = active.filter((f) => f.sign === -1).map((f) => f.magnitude);
  const { positive, negative } = sideTotals(active);
  const [big, small] = positive >= negative ? [pos, neg] : [neg, pos];
  const group = (list: number[]) =>
    list.length === 1 ? formatN(list[0]) : `(${list.map(formatN).join(' + ')})`;
  return `R = ${group(big)} − ${group(small)} = ${formatN(r.magnitude)}`;
}

/** Ölçek: 1 kare kaç newton, 1 kare kaç piksel */
export interface Scale {
  newtonsPerCell: number;
  pxPerCell: number;
}

export function pxPerNewton(scale: Scale): number {
  return scale.pxPerCell / scale.newtonsPerCell;
}

/** Ok uzunluğu daima büyüklükle orantılıdır. */
export function arrowLength(magnitude: number, scale: Scale): number {
  return magnitude * pxPerNewton(scale);
}

/** Ok ucunun ekran koordinatlarındaki birim vektörü (SVG'de y aşağı doğru artar). */
export function screenVector(axis: Axis, sign: Sign): { dx: number; dy: number } {
  if (axis === 'yatay') return { dx: sign, dy: 0 };
  return { dx: 0, dy: -sign };
}

/** Bir kuvvet okunun uç noktası (uygulama noktası + uzunluk * yön) */
export function arrowTip(
  origin: { x: number; y: number },
  force: Pick<Force, 'axis' | 'sign' | 'magnitude'>,
  scale: Scale,
): { x: number; y: number } {
  const { dx, dy } = screenVector(force.axis, force.sign);
  const len = arrowLength(force.magnitude, scale);
  return { x: origin.x + dx * len, y: origin.y + dy * len };
}

/** Bileşke, beklenen değerle (büyüklük + yön) aynı mı? */
export function sameResultant(a: Resultant, b: Resultant): boolean {
  return a.axis === b.axis && clean(a.magnitude) === clean(b.magnitude) && a.sign === b.sign;
}

/** Öğrenciye okunacak tam açıklama: "50 N, doğu yönünde, doğu–batı doğrultusunda" */
export function describeResultant(r: Resultant): string {
  if (r.sign === 0) return 'R = 0 N';
  return `R = ${formatN(r.magnitude)}, ${directionPhrase(r.axis, r.sign)}`;
}
