import {
  apexHeight,
  fallTime,
  positionFromRest,
  throwHeight,
  throwVelocity,
  timeToApex,
  v0ForApex,
  velocityFromRest,
} from './motion';

describe('durgun başlangıçtan hareket', () => {
  it('bileşke sıfırsa cisim durmaya devam eder', () => {
    for (const t of [0, 0.5, 1, 3]) expect(positionFromRest(0, 1, t)).toBe(0);
  });

  it('cisim bileşke yönünde harekete başlar ve giderek hızlanır', () => {
    const v1 = velocityFromRest(50, 1, 1);
    const v2 = velocityFromRest(50, 1, 2);
    expect(v1).toBeGreaterThan(0);
    expect(v2).toBeGreaterThan(v1);
    expect(positionFromRest(-30, 1, 1)).toBeLessThan(0);
  });

  it('aynı bileşke → aynı hareket (iki çocuk 30+20 N ile tek 50 N)', () => {
    for (const t of [0.3, 1, 2.2]) expect(positionFromRest(30 + 20, 5, t)).toBe(positionFromRest(50, 5, t));
  });

  it('büyük bileşke → daha hızlı harekete geçiş', () => {
    expect(positionFromRest(70, 1, 1)).toBeGreaterThan(positionFromRest(30, 1, 1));
  });
});

describe('yukarı atılan top (hava direnci ihmal)', () => {
  const g = 900;
  const v0 = v0ForApex(400, g);
  const th = { v0, g };

  it('tepe yüksekliği istenen değerdir', () => {
    expect(apexHeight(th)).toBeCloseTo(400, 6);
  });

  it('yükselirken yavaşlar, tepede hız sıfırdır, sonra aşağı yönde hızlanır', () => {
    const tA = timeToApex(th);
    expect(throwVelocity(th, tA * 0.5)).toBeGreaterThan(0);
    expect(throwVelocity(th, tA)).toBeCloseTo(0, 9);
    expect(throwVelocity(th, tA * 1.5)).toBeLessThan(0);
    expect(Math.abs(throwVelocity(th, tA * 1.8))).toBeGreaterThan(Math.abs(throwVelocity(th, tA * 1.4)));
  });

  it('hareket simetriktir: 2·tA anında yere döner', () => {
    expect(throwHeight(th, 2 * timeToApex(th))).toBeCloseTo(0, 6);
  });

  it('serbest düşüş süresi', () => {
    expect(fallTime(450, 900)).toBeCloseTo(1, 9);
  });
});
