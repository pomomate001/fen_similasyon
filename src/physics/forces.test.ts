import {
  arrowLength,
  arrowTip,
  describeResultant,
  directionName,
  equation,
  formatN,
  lineName,
  relation,
  resultant,
  type Force,
  type Scale,
} from './forces';

const f = (id: string, magnitude: number, sign: 1 | -1, axis: 'yatay' | 'dusey' = 'yatay'): Force => ({
  id,
  magnitude,
  sign,
  axis,
});

describe('bileşke kuvvet — bilimsel doğruluk', () => {
  it('aynı yönlü kuvvetler toplanır, R aynı yöndedir (30 N + 20 N doğu = 50 N doğu)', () => {
    const r = resultant([f('a', 30, 1), f('b', 20, 1)]);
    expect(r).toEqual({ magnitude: 50, sign: 1, axis: 'yatay' });
    expect(directionName(r.axis, r.sign)).toBe('doğu');
  });

  it('ders kitabı örneği K: 3 N + 4 N = 7 N', () => {
    expect(resultant([f('a', 3, -1), f('b', 4, -1)]).magnitude).toBe(7);
  });

  it('zıt yönlü kuvvetlerde fark alınır, R büyük kuvvetin yönündedir (roket)', () => {
    const r = resultant([f('motor', 100, 1, 'dusey'), f('g', 10, -1, 'dusey')]);
    expect(r).toEqual({ magnitude: 90, sign: 1, axis: 'dusey' });
    expect(directionName(r.axis, r.sign)).toBe('yukarı');
  });

  it('ders kitabı örneği L: 3 N doğu, 4 N batı → 1 N batı', () => {
    const r = resultant([f('a', 3, 1), f('b', 4, -1)]);
    expect(r).toEqual({ magnitude: 1, sign: -1, axis: 'yatay' });
  });

  it('eşit büyüklükte zıt yönlü kuvvetlerde bileşke sıfırdır ve yönü yoktur', () => {
    const r = resultant([f('a', 50, 1), f('b', 50, -1)]);
    expect(r.magnitude).toBe(0);
    expect(r.sign).toBe(0);
    expect(directionName(r.axis, r.sign)).toBe('yönü yok');
    expect(describeResultant(r)).toBe('R = 0 N');
  });

  it('üç kuvvet: 3 N batı + 2 N batı, 4 N doğu → 1 N batı', () => {
    const r = resultant([f('a', 3, -1), f('b', 2, -1), f('c', 4, 1)]);
    expect(r).toEqual({ magnitude: 1, sign: -1, axis: 'yatay' });
  });

  it('3 N, 4 N, 5 N: en büyük bileşke 12 N, en küçük 2 N', () => {
    const mags = [3, 4, 5];
    const results: number[] = [];
    for (const s1 of [1, -1] as const)
      for (const s2 of [1, -1] as const)
        for (const s3 of [1, -1] as const)
          results.push(resultant([f('a', mags[0], s1), f('b', mags[1], s2), f('c', mags[2], s3)]).magnitude);
    expect(Math.max(...results)).toBe(12);
    expect(Math.min(...results)).toBe(2);
  });

  it('farklı doğrultudaki kuvvetler reddedilir', () => {
    expect(() => resultant([f('a', 1, 1, 'yatay'), f('b', 1, 1, 'dusey')])).toThrow();
  });

  it('negatif büyüklük reddedilir', () => {
    expect(() => resultant([f('a', -1, 1)])).toThrow();
  });

  it('ondalık artıklar temizlenir', () => {
    expect(resultant([f('a', 0.1, 1), f('b', 0.2, 1)]).magnitude).toBe(0.3);
  });

  it('düşey doğrultuda coğrafi yön kullanılmaz', () => {
    expect(directionName('dusey', 1)).toBe('yukarı');
    expect(directionName('dusey', -1)).toBe('aşağı');
    expect(lineName('dusey')).toBe('düşey');
    expect(lineName('yatay')).toBe('doğu–batı');
  });
});

describe('ilişki türü', () => {
  it('aynı / zıt / tek', () => {
    expect(relation([f('a', 1, 1), f('b', 2, 1)])).toBe('ayni-yonlu');
    expect(relation([f('a', 1, 1), f('b', 2, -1)])).toBe('zit-yonlu');
    expect(relation([f('a', 1, 1), f('b', 0, -1)])).toBe('tek');
  });
});

describe('işlem satırı', () => {
  it('aynı yönlü', () => {
    expect(equation([f('a', 30, 1), f('b', 20, 1)])).toBe('R = 30 N + 20 N = 50 N');
  });
  it('zıt yönlü — büyükten küçük çıkarılır', () => {
    expect(equation([f('g', 10, -1, 'dusey'), f('m', 100, 1, 'dusey')])).toBe('R = 100 N − 10 N = 90 N');
  });
  it('üç kuvvet', () => {
    expect(equation([f('a', 20, -1), f('b', 10, -1), f('c', 15, 1)])).toBe('R = (20 N + 10 N) − 15 N = 15 N');
  });
  it('sıfır bileşke', () => {
    expect(equation([f('a', 40, -1), f('b', 40, 1)])).toBe('R = 40 N − 40 N = 0 N');
  });
  it('ondalık biçim Türkçe', () => {
    expect(formatN(2.5)).toBe('2,5 N');
  });
});

describe('ok geometrisi — görsel ile büyüklük uyumu', () => {
  const scale: Scale = { newtonsPerCell: 10, pxPerCell: 50 };

  it('ok uzunluğu büyüklükle orantılıdır', () => {
    expect(arrowLength(100, scale)).toBe(500);
    expect(arrowLength(10, scale)).toBe(50);
    expect(arrowLength(90, scale)).toBe(450);
  });

  it('bileşke okunun uzunluğu, kuvvet oklarının işaretli toplamına eşittir', () => {
    const forces = [f('m', 100, 1, 'dusey'), f('g', 10, -1, 'dusey')];
    const r = resultant(forces);
    const signedPx = forces.reduce((acc, x) => acc + x.sign * arrowLength(x.magnitude, scale), 0);
    expect(arrowLength(r.magnitude, scale)).toBe(Math.abs(signedPx));
  });

  it('yukarı yönlü ok ekranda yukarıyı (y azalan) gösterir; doğu sağı gösterir', () => {
    expect(arrowTip({ x: 0, y: 0 }, { axis: 'dusey', sign: 1, magnitude: 10 }, scale)).toEqual({ x: 0, y: -50 });
    expect(arrowTip({ x: 0, y: 0 }, { axis: 'dusey', sign: -1, magnitude: 10 }, scale)).toEqual({ x: 0, y: 50 });
    expect(arrowTip({ x: 0, y: 0 }, { axis: 'yatay', sign: 1, magnitude: 10 }, scale)).toEqual({ x: 50, y: 0 });
    expect(arrowTip({ x: 0, y: 0 }, { axis: 'yatay', sign: -1, magnitude: 10 }, scale)).toEqual({ x: -50, y: 0 });
  });
});
