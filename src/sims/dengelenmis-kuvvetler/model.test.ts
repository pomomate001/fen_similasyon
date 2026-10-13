import { acceleration, clampBalloons, kidForces, netEquation, netForce, step, START_BALLOONS } from './model';

describe('balonlu öğrenci — kuvvet modeli', () => {
  it('başlangıçta 5 balon: 5 × 100 N yukarı, 500 N aşağı, R = 0 N', () => {
    const f = kidForces(START_BALLOONS);
    expect(f.filter((x) => x.sign === 1).map((x) => x.magnitude)).toEqual([100, 100, 100, 100, 100]);
    expect(f.filter((x) => x.sign === -1).map((x) => x.magnitude)).toEqual([500]);
    expect(netForce(START_BALLOONS)).toEqual({ magnitude: 0, sign: 0, axis: 'dusey' });
    expect(netEquation(START_BALLOONS)).toBe('R = 500 N − 500 N = 0 N');
  });

  it('balon eklenince bileşke yukarı, çıkarılınca aşağı yöndedir', () => {
    expect(netForce(6)).toEqual({ magnitude: 100, sign: 1, axis: 'dusey' });
    expect(netEquation(6)).toBe('R = 600 N − 500 N = 100 N');
    expect(netForce(4)).toEqual({ magnitude: 100, sign: -1, axis: 'dusey' });
    expect(netEquation(4)).toBe('R = 500 N − 400 N = 100 N');
    expect(netEquation(0)).toBe('R = 500 N');
  });

  it('ivme = R / m (50 kg)', () => {
    expect(acceleration(5)).toBe(0);
    expect(acceleration(6)).toBe(2);
    expect(acceleration(3)).toBe(-4);
    expect(acceleration(0)).toBe(-10);
  });

  it('dengelenmiş kuvvetler: duran durur, hareket eden sabit süratle devam eder', () => {
    let m = { h: 0, v: 0 };
    for (let i = 0; i < 100; i++) m = step(m, 5, 0.02);
    expect(m).toEqual({ h: 0, v: 0 });

    m = { h: 0, v: -1.5 };
    for (let i = 0; i < 100; i++) m = step(m, 5, 0.02);
    expect(m.v).toBe(-1.5);
    expect(m.h).toBeCloseTo(-3, 6);
  });

  it('dengelenmemiş kuvvetler: duran cisim bileşke yönünde hızlanır', () => {
    let up = { h: 0, v: 0 };
    let down = { h: 0, v: 0 };
    for (let i = 0; i < 50; i++) {
      up = step(up, 7, 0.02);
      down = step(down, 4, 0.02);
    }
    expect(up.v).toBeCloseTo(4, 6);
    expect(up.h).toBeGreaterThan(0);
    expect(down.v).toBeCloseTo(-2, 6);
    expect(down.h).toBeLessThan(0);
  });

  it('balon sayısı 0–8 aralığında tutulur', () => {
    expect(clampBalloons(-2)).toBe(0);
    expect(clampBalloons(12)).toBe(8);
  });
});
