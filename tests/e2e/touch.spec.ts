import { expect, test, type Page } from '@playwright/test';
import { collectErrors, openScene, stageScale, value } from './helpers';

test.use({ hasTouch: true });

/** Gerçek dokunmatik sürükleme (Chromium CDP dokunma olayları → pointerType: touch) */
async function touchDrag(page: Page, testId: string, dx: number, dy: number) {
  const s = await stageScale(page);
  const b = (await page.getByTestId(`${testId}-handle`).boundingBox())!;
  const x = b.x + b.width / 2;
  const y = b.y + b.height / 2;
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let i = 1; i <= 8; i++) {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: x + (dx * s * i) / 8, y: y + (dy * s * i) / 8 }],
    });
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

test('dokunmatik: önce kart, sonra hedef seçerek yerleştirme (roket)', async ({ page }) => {
  const errors = collectErrors(page);
  await openScene(page, 6);
  await page.getByTestId('chip-motor').tap();
  await expect(page.getByTestId('chip-motor')).toHaveClass(/selected/);
  await page.getByTestId('zone-up').tap({ force: true });
  await page.getByTestId('chip-yer').tap();
  await page.getByTestId('zone-down').tap({ force: true });
  await expect(page.getByTestId('placed-up-motor')).toHaveCount(1);
  await expect(page.getByTestId('placed-down-yer')).toHaveCount(1);
  await page.getByTestId('check').tap();
  await expect(page.getByTestId('feedback-ok')).toBeVisible({ timeout: 60_000 });
  expect(errors).toEqual([]);
});

test('dokunmatik: ok ucunu parmakla sürükleyerek bileşke çizme (halat)', async ({ page }) => {
  await openScene(page, 8);
  await page.getByTestId('predict-dogu').tap();
  await touchDrag(page, 'r-drawer', 120, 0);
  expect(await value(page, 'r-drawer')).toBe(30);
});

test('dokunmatik: eksen üzerine tek dokunuşla değer seçme (hassas sürükleme gerekmez)', async ({ page }) => {
  await openScene(page, 9);
  const s = await stageScale(page);
  const stage = (await page.getByTestId('stage').boundingBox())!;
  // Tahmin şeridi: merkez 960, satır 842; 4 N batı = 960 − 4×36
  await page.touchscreen.tap(stage.x + (960 - 144) * s, stage.y + 842 * s);
  expect(await value(page, 'lab-guess')).toBe(-4);
});

test('dokunmatik: ikinci parmak (avuç) sürüklemeyi bozmaz', async ({ page }) => {
  await openScene(page, 8);
  await page.getByTestId('predict-dogu').tap();
  const s = await stageScale(page);
  const b = (await page.getByTestId('r-drawer-handle').boundingBox())!;
  const x = b.x + b.width / 2;
  const y = b.y + b.height / 2;
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
  // ikinci parmak ekranın başka yerine değer
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [
      { x, y, id: 1 },
      { x: 200, y: 600, id: 2 },
    ],
  });
  for (let i = 1; i <= 6; i++) {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [
        { x: x + (80 * s * i) / 6, y, id: 1 },
        { x: 200 + i * 30, y: 600, id: 2 },
      ],
    });
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  expect(await value(page, 'r-drawer')).toBe(20);
});
