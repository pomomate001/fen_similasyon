import { expect, test, type Page } from '@playwright/test';
import { collectErrors, continueWhenReady, FAST, openScene } from './helpers';

/** Akıllı tahta ve dizüstü çözünürlükleri (+ 4:3 bir projeksiyon) */
const SIZES: Array<[number, number]> = [
  [1920, 1080],
  [1366, 768],
  [1280, 720],
  [1024, 768],
];

async function assertFits(page: Page, w: number, h: number) {
  const m = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    sh: document.documentElement.scrollHeight,
    iw: window.innerWidth,
    ih: window.innerHeight,
  }));
  expect(m.sw, 'yatay kaydırma olmamalı').toBeLessThanOrEqual(m.iw);
  expect(m.sh, 'dikey kaydırma olmamalı').toBeLessThanOrEqual(m.ih);
  const b = (await page.getByTestId('stage').boundingBox())!;
  expect(b.x).toBeGreaterThanOrEqual(-0.5);
  expect(b.y).toBeGreaterThanOrEqual(-0.5);
  expect(b.x + b.width).toBeLessThanOrEqual(w + 0.5);
  expect(b.y + b.height).toBeLessThanOrEqual(h + 0.5);
  expect(b.width / b.height).toBeCloseTo(16 / 9, 2);
}

async function assertInside(page: Page, testId: string, w: number, h: number, minSize = 44) {
  const b = (await page.getByTestId(testId).first().boundingBox())!;
  expect(b.x).toBeGreaterThanOrEqual(0);
  expect(b.y).toBeGreaterThanOrEqual(0);
  expect(b.x + b.width).toBeLessThanOrEqual(w);
  expect(b.y + b.height).toBeLessThanOrEqual(h);
  expect(Math.min(b.width, b.height), `${testId} dokunma hedefi`).toBeGreaterThanOrEqual(minSize);
}

for (const [w, h] of SIZES) {
  test(`ekran ${w}×${h}: taşma yok, kontroller erişilebilir`, async ({ page }) => {
    const errors = collectErrors(page);
    await page.setViewportSize({ width: w, height: h });

    await page.goto(`/?${FAST}#/`);
    await expect(page.getByTestId('home')).toBeVisible();
    await assertFits(page, w, h);
    await assertInside(page, 'start', w, h);
    await page.screenshot({ path: `test-results/ekran-${w}x${h}-ana-sayfa.png` });

    for (const n of [3, 6, 8, 10]) {
      await openScene(page, n);
      await page.waitForTimeout(1500);
      await assertFits(page, w, h);
      await assertInside(page, 'continue', w, h, 100 * (w / 1920) - 1);
      const dock = page.getByRole('toolbar', { name: 'Kontroller' }).getByRole('button');
      for (let i = 0; i < (await dock.count()); i++) {
        const bb = (await dock.nth(i).boundingBox())!;
        expect(bb.width).toBeGreaterThanOrEqual(Math.min(44, 88 * (w / 1920)) - 0.5);
        expect(bb.y + bb.height).toBeLessThanOrEqual(h);
      }
      await page.screenshot({ path: `test-results/ekran-${w}x${h}-sahne-${n}.png` });
    }
    expect(errors).toEqual([]);
  });
}

test('pencere boyutu değişince sahne yeniden ölçeklenir', async ({ page }) => {
  await openScene(page, 1);
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.waitForTimeout(200);
  await assertFits(page, 1280, 720);
  await page.setViewportSize({ width: 1600, height: 1200 });
  await page.waitForTimeout(200);
  await assertFits(page, 1600, 1200);
  await continueWhenReady(page);
});
