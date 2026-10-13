import { expect, test } from '@playwright/test';
import { collectErrors, continueWhenReady, openScene } from './helpers';

test.describe('öğretmen kontrolleri', () => {
  test('duraklat: zaman ve anlatım durur, sürdür ile devam eder', async ({ page }) => {
    await openScene(page, 2, 'ses=0&hiz=1');
    const sub = page.getByTestId('subtitle');
    await expect(sub).toContainText('yerçekimi', { timeout: 30_000 });
    await page.getByRole('button', { name: 'Duraklat' }).click();
    await expect(page.getByTestId('pause-overlay')).toBeVisible();
    const before = await sub.textContent();
    await page.waitForTimeout(6000);
    expect(await sub.textContent()).toBe(before);
    await expect(page.getByTestId('continue')).toBeDisabled();
    await page.getByTestId('pause-overlay').getByRole('button', { name: 'Sürdür' }).click();
    await expect(page.getByTestId('pause-overlay')).toBeHidden();
    await expect(sub).not.toHaveText(before ?? '', { timeout: 30_000 });
  });

  test('soru sahnesi kendiliğinden geçmez; Devam Et beklenir', async ({ page }) => {
    await openScene(page, 1, 'ses=0&hiz=20');
    await expect(page.getByTestId('continue')).toHaveClass(/ready/, { timeout: 60_000 });
    await page.waitForTimeout(3000);
    await expect(page.getByTestId('scene-elma')).toBeVisible();
    await expect(page.getByTestId('question')).toBeVisible();
  });

  test('hızlı art arda Devam Et tıklamaları birden fazla sahne atlatmaz', async ({ page }) => {
    await openScene(page, 1, 'ses=0&hiz=20');
    const btn = page.getByTestId('continue');
    await expect(btn).toHaveClass(/ready/, { timeout: 60_000 });
    await btn.click();
    await btn.click({ force: true });
    await btn.click({ force: true });
    await expect(page.getByTestId('scene-yercekimi')).toBeVisible();
    await page.waitForTimeout(800);
    await expect(page.getByTestId('scene-yercekimi')).toBeVisible();
  });

  test('önceki sahne, sahne haritası ve klavye/kumanda', async ({ page }) => {
    await openScene(page, 3, 'ses=0&hiz=20');
    await page.getByRole('button', { name: 'Önceki sahne' }).click();
    await expect(page.getByTestId('scene-yercekimi')).toBeVisible();
    await page.waitForTimeout(500); // gezinme kilidi (350 ms) yanlışlıkla art arda dokunuşları yok sayar
    await page.getByRole('button', { name: /7\. sahne/ }).click();
    await expect(page.getByTestId('scene-bileske')).toBeVisible();
    await page.waitForTimeout(500);
    await page.keyboard.press('ArrowLeft');
    await expect(page.getByTestId('scene-roket')).toBeVisible();
  });

  test('simülasyonu yeniden başlatma onay ister', async ({ page }) => {
    await openScene(page, 5, 'ses=0&hiz=20');
    await page.getByRole('button', { name: 'Simülasyonu yeniden başlat' }).click();
    await page.getByRole('button', { name: 'Vazgeç' }).click();
    await expect(page.getByTestId('scene-araba')).toBeVisible();
    await page.getByRole('button', { name: 'Simülasyonu yeniden başlat' }).click();
    await page.getByRole('button', { name: 'Baştan başlat' }).click();
    await expect(page.getByTestId('scene-elma')).toBeVisible();
  });

  test('anlatımı tekrar dinle ve ses aç/kapat', async ({ page }) => {
    await openScene(page, 1, 'ses=0&hiz=20');
    await expect(page.getByTestId('continue')).toHaveClass(/ready/, { timeout: 60_000 });
    const replay = page.getByRole('button', { name: 'Anlatımı tekrar dinle' });
    await expect(replay).toBeEnabled();
    await replay.click();
    await expect(page.getByTestId('subtitle')).toContainText('duran cisimleri harekete', { timeout: 10_000 });
    await expect(page.getByTestId('subtitle')).toContainText('sizce', { timeout: 20_000 });
    await page.getByRole('button', { name: 'Sesi aç' }).click();
    await expect(page.getByRole('button', { name: 'Sesi kapat' })).toBeVisible();
    await page.getByRole('button', { name: 'Sesi kapat' }).click();
    await expect(page.getByRole('button', { name: 'Sesi aç' })).toBeVisible();
  });

  test('öğretmen notları ve kontrolleri diğer tarafa alma', async ({ page }) => {
    await openScene(page, 4, 'ses=0&hiz=20');
    await page.getByRole('button', { name: 'Öğretmen notları' }).click();
    await expect(page.getByLabel('Öğretmen notları').last()).toContainText('kavram yanılgısı');
    const before = (await page.getByTestId('continue').boundingBox())!.x;
    await page.getByRole('button', { name: /Kontrolleri (sağa|sola) al/ }).click();
    const after = (await page.getByTestId('continue').boundingBox())!.x;
    expect(Math.abs(after - before)).toBeGreaterThan(500);
  });

  test('ana sayfaya dönüş onaylı; "Yakında" içerik başlatılamaz', async ({ page }) => {
    await openScene(page, 2, 'ses=0&hiz=20');
    await page.getByRole('button', { name: 'Ana sayfa' }).click();
    await page.getByRole('button', { name: 'Ana sayfaya dön' }).click();
    await expect(page.getByTestId('home')).toBeVisible();
    const soon = page.getByTestId('soon-dengelenmis-kuvvetler');
    await expect(soon).toHaveAttribute('aria-disabled', 'true');
    await soon.click();
    await expect(page.getByTestId('home')).toBeVisible();
  });

  test('sahne geçişlerinde durum temizliği: geri dönülen sahne baştan ve hatasız başlar', async ({ page }) => {
    const errors = collectErrors(page);
    await openScene(page, 6, 'ses=0&hiz=20');
    await page.getByTestId('chip-motor').click();
    await page.getByTestId('zone-up').click({ force: true });
    await page.getByRole('button', { name: 'Önceki sahne' }).click();
    await expect(page.getByTestId('scene-araba')).toBeVisible();
    await page.waitForTimeout(400);
    await page.getByRole('button', { name: /6\. sahne/ }).click();
    await expect(page.getByTestId('chip-motor')).toBeVisible({ timeout: 60_000 }); // yerleştirme sıfırlandı
    await expect(page.getByTestId('placed-up-motor')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
});

test.describe('ses', () => {
  test('ses dosyaları yüklenir (200)', async ({ page }) => {
    const ok: string[] = [];
    page.on('response', (r) => {
      if (r.url().includes('/audio/bileske-kuvvet/') && r.status() < 400) ok.push(r.url());
    });
    await page.goto('/?hiz=4#/');
    await page.getByTestId('start').click();
    await expect(page.getByTestId('continue')).toHaveClass(/ready/, { timeout: 60_000 });
    expect(ok.some((u) => u.endsWith('s1.a.mp3'))).toBe(true);
    expect(ok.some((u) => u.endsWith('s1.b.mp3'))).toBe(true);
  });

  test('eksik/bozuk ses dosyasında simülasyon sessizce devam eder', async ({ page }) => {
    const errors = collectErrors(page);
    await page.route('**/audio/**', (r) => r.fulfill({ status: 404, body: '' }));
    await page.goto('/?hiz=8#/');
    await page.getByTestId('start').click();
    await continueWhenReady(page);
    await expect(page.getByTestId('scene-yercekimi')).toBeVisible();
    await expect(page.getByTestId('subtitle')).toContainText('yerçekimi', { timeout: 30_000 });
    expect(errors.filter((e) => !/404|Failed to load resource/.test(e))).toEqual([]);
  });
});
