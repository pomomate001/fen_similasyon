import { expect, test, type Page } from '@playwright/test';
import { collectErrors, continueWhenReady, dragBy, FAST, value } from './helpers';

/**
 * Uçtan uca: bir öğrenci simülasyonu ana sayfadan başlatıp 11 sahneyi
 * (bazı yanlış denemelerle birlikte) sonuna kadar tamamlar.
 */
async function scene(page: Page, id: string) {
  await expect(page.getByTestId(`scene-${id}`)).toBeVisible({ timeout: 60_000 });
}

test('öğrenci simülasyonu baştan sona tamamlar', async ({ page }) => {
  test.setTimeout(600_000);
  const errors = collectErrors(page);
  await page.goto(`/?${FAST}#/`);
  await expect(page.getByTestId('home')).toBeVisible();
  await expect(page.getByTestId('soon-dengelenmis-kuvvetler')).toBeVisible();
  await page.getByTestId('start').click();

  // S1–S2: izle, tartış, devam et
  await scene(page, 'elma');
  await expect(page.getByTestId('continue')).toBeDisabled();
  await continueWhenReady(page);
  await scene(page, 'yercekimi');
  const g = page.getByTestId('arrow-gravity');
  await expect(g).toHaveAttribute('data-axis', 'dusey');
  await expect(g).toHaveAttribute('data-sign', '-1');
  await continueWhenReady(page);

  // S3: önce yanlış, sonra doğru etiketleme
  await scene(page, 'ozellikler');
  await page.getByTestId('chip-yon').click();
  await page.getByTestId('slot-nokta').click();
  for (const p of ['nokta', 'dogrultu', 'buyukluk']) {
    const target = p === 'nokta' ? 'yon' : p;
    await page.getByTestId(`chip-${p}`).click();
    await page.getByTestId(`slot-${target}`).click();
  }
  await page.getByTestId('check').click();
  await expect(page.getByTestId('feedback-hint')).toBeVisible();
  await expect(page.getByTestId('chip-yon')).toBeVisible(); // yanlış etiketler geri döndü
  await page.getByTestId('chip-yon').click();
  await page.getByTestId('slot-yon').click();
  await page.getByTestId('chip-nokta').click();
  await page.getByTestId('slot-nokta').click();
  await page.getByTestId('check').click();
  await expect(page.getByTestId('transfer-panel')).toBeVisible({ timeout: 60_000 });
  await page.getByTestId('yon-doğu').click();
  await page.getByTestId('dogrultu-doğu–batı').click();
  await page.getByTestId('check').click();
  await continueWhenReady(page);

  // S4: tartışma noktası + üç an
  await scene(page, 'top');
  await continueWhenReady(page);
  await page.getByTestId('tray-yukari').click();
  await page.getByTestId('moment-B').locator('rect').first().click({ force: true });
  await page.getByTestId('check').click();
  await expect(page.getByTestId('feedback-hint')).toContainText('değmeyen el');
  await page.getByTestId('placed-B-yukari').click({ force: true }); // yanlış oku kaldır
  await page.getByTestId('tray-el').click();
  await page.getByTestId('moment-A').locator('rect').first().click({ force: true });
  for (const m of ['A', 'B', 'C']) {
    await page.getByTestId('tray-yer').click();
    await page.getByTestId(`moment-${m}`).locator('rect').first().click({ force: true });
  }
  await expect(page.getByTestId('moment-A')).toHaveAttribute('data-arrows', 'el,yer');
  await expect(page.getByTestId('moment-B')).toHaveAttribute('data-arrows', 'yer');
  await page.getByTestId('check').click();
  await continueWhenReady(page);

  // S5: robot önce az, sonra doğru kuvvet
  await scene(page, 'araba');
  await page.getByTestId('try').click();
  await expect(page.getByTestId('feedback-hint')).toBeVisible({ timeout: 60_000 });
  const plus = page.getByTestId('robot-stepper').getByRole('button', { name: 'Artır' });
  for (let i = 0; i < 4; i++) await plus.click();
  await expect(page.getByTestId('robot-panel')).toContainText('50 N');
  await page.getByTestId('try').click();
  await expect(page.getByTestId('equation')).toContainText('R = 30 N + 20 N = 50 N', { timeout: 60_000 });
  await expect(page.getByTestId('arrow-r')).toHaveAttribute('data-magnitude', '50');
  await continueWhenReady(page);

  // S6: önce ters yerleştir, sonra doğru
  await scene(page, 'roket');
  await page.getByTestId('chip-yer').click();
  await page.getByTestId('zone-up').click({ force: true });
  await page.getByTestId('chip-motor').click();
  await page.getByTestId('zone-down').click({ force: true });
  await page.getByTestId('check').click();
  await expect(page.getByTestId('feedback-hint')).toBeVisible();
  await page.getByTestId('chip-motor').click();
  await page.getByTestId('zone-up').click({ force: true });
  await page.getByTestId('chip-yer').click();
  await page.getByTestId('zone-down').click({ force: true });
  await page.getByTestId('check').click();
  await continueWhenReady(page);

  // S7: hesap ve çizim
  await scene(page, 'bileske');
  await expect(page.getByTestId('equation')).toHaveText('R = 100 N − 10 N = 90 N', { timeout: 60_000 });
  const r = page.getByTestId('arrow-r');
  await expect(r).toHaveAttribute('data-magnitude', '90');
  await expect(r).toHaveAttribute('data-sign', '1');
  await expect(r).toHaveAttribute('data-length', '378'); // 90 N × 4,2 px/N
  await continueWhenReady(page);

  // S8: halat çekme
  await scene(page, 'halat');
  await page.getByTestId('predict-dogu').click();
  await dragBy(page, 'r-drawer', -80, 0); // yanlış yön: 20 N batı
  expect(await value(page, 'r-drawer')).toBe(-20);
  await page.getByTestId('check').click();
  await expect(page.getByTestId('feedback-hint')).toBeVisible({ timeout: 60_000 });
  await dragBy(page, 'r-drawer', 200, 0); // -20 → +30
  expect(await value(page, 'r-drawer')).toBe(30);
  await page.getByTestId('check').click();
  await expect(page.getByTestId('bench-d')).toBeVisible({ timeout: 60_000 });
  for (const [b, t] of [
    ['d', 'turuncu'],
    ['b', 'turuncu'],
    ['e', 'yesil'],
  ]) {
    await page.getByTestId(`bench-${b}`).click();
    await page.getByTestId(`team-${t}`).click();
  }
  await expect(page.getByTestId('total-turuncu')).toContainText('50 N');
  await expect(page.getByTestId('total-yesil')).toContainText('40 N');
  await page.getByTestId('check').click();
  await expect(page.getByTestId('arrow-r-true')).toHaveAttribute('data-sign', '-1', { timeout: 60_000 });
  await continueWhenReady(page);

  // S9: laboratuvar — üç deney türü
  await scene(page, 'laboratuvar');
  await page.getByTestId('lab-show').click(); // 3 N + 2 N doğu: aynı yönlü
  await expect(page.getByTestId('lab-equation')).toHaveText('R = 3 N + 2 N = 5 N');
  await page.getByTestId('lab-dir-2-bati').click(); // zıt yönlü
  await page.getByTestId('lab-show').click();
  await expect(page.getByTestId('lab-equation')).toHaveText('R = 3 N − 2 N = 1 N');
  await page.getByTestId('lab-add').click(); // üç kuvvet: 3 doğu, 2 batı, 2 batı
  await page.getByTestId('lab-show').click();
  await expect(page.getByTestId('lab-equation')).toHaveText('R = (2 N + 2 N) − 3 N = 1 N');
  await page.getByTestId('lab-play').click();
  await expect(page.getByTestId('goal-uc')).toHaveAttribute('data-done', 'true');
  await continueWhenReady(page);

  // S10: görevler
  await scene(page, 'gorevler');
  for (const [c, b] of [
    ['a', 'ayni'],
    ['b', 'zit'],
    ['c', 'ayni'],
    ['d', 'zit'],
  ]) {
    await page.getByTestId(`card-${c}`).click();
    await page.getByTestId(`bin-${b}`).click({ position: { x: 300, y: 250 } });
  }
  await page.getByTestId('check').click();
  // g2: 3 + 4 = 7 N doğu (1 kare = 50 px)
  await expect(page.getByTestId('task-g2')).toBeVisible({ timeout: 60_000 });
  await page.getByTestId('check').click(); // boş çizim → ipucu
  await expect(page.getByTestId('feedback-hint')).toBeVisible();
  await dragBy(page, 'task-r', 350, 0);
  await page.getByTestId('check').click();
  // g3: 5 N yukarı − 3 N aşağı = 2 N yukarı
  await expect(page.getByTestId('task-g3')).toBeVisible({ timeout: 60_000 });
  await dragBy(page, 'task-r', 0, -100);
  await page.getByTestId('check').click();
  // g4: 10 N doğu − 6 N batı = 4 N doğu (1 kare = 2 N = 50 px)
  await expect(page.getByTestId('task-g4')).toBeVisible({ timeout: 60_000 });
  await dragBy(page, 'task-r', 100, 0);
  await page.getByTestId('check').click();
  // g5: (3 + 2) batı − 4 doğu = 1 N batı
  await expect(page.getByTestId('task-g5')).toBeVisible({ timeout: 60_000 });
  await dragBy(page, 'task-r', -50, 0);
  await page.getByTestId('check').click();
  // g6: F2 = 8 N doğu (1 N'dan başlar)
  await expect(page.getByTestId('task-g6')).toBeVisible({ timeout: 60_000 });
  await dragBy(page, 'task-f2', 350, 0);
  expect(await value(page, 'task-f2')).toBe(8);
  await page.getByTestId('check').click();
  // g7: önce en büyük (12 N), sonra en küçük (2 N)
  await expect(page.getByTestId('task-g7')).toBeVisible({ timeout: 60_000 });
  await page.getByTestId('flip-2').click();
  await expect(page.getByTestId('task-live-r')).toHaveAttribute('data-magnitude', '12');
  await page.getByTestId('check').click();
  await expect(page.getByTestId('task-header')).toContainText('şimdi en küçük', { timeout: 60_000 });
  await page.getByTestId('flip-3').click();
  await expect(page.getByTestId('task-live-r')).toHaveAttribute('data-magnitude', '2');
  await page.getByTestId('check').click();
  await continueWhenReady(page);

  // S11: kapanış
  await scene(page, 'kapanis');
  await page.getByTestId('q1-yon-Batı').click();
  await page.getByTestId('q1-dog-Doğu–batı').click();
  await page.getByTestId('check').click();
  await page.getByTestId('q2-x').click({ timeout: 60_000 }); // yanlış
  await expect(page.getByTestId('feedback-hint')).toBeVisible();
  await page.getByTestId('q2-ok').click();
  await page.getByTestId('q3-hareket').click({ timeout: 60_000 }); // kavram yanılgısı çeldiricisi
  await expect(page.getByTestId('feedback-hint')).toBeVisible();
  await page.getByTestId('q3-ok').click();
  await expect(page.getByTestId('summary')).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId('teaser-card')).toBeVisible({ timeout: 60_000 });
  await continueWhenReady(page); // merak sorusu tartışması
  await expect(page.getByTestId('continue')).toContainText('Bitir', { timeout: 60_000 });
  await continueWhenReady(page);
  await expect(page.getByTestId('finished')).toBeVisible();

  expect(errors).toEqual([]);
});
