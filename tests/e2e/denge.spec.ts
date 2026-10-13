import { expect, test } from '@playwright/test';
import { collectErrors } from './helpers';

/** Dengelenmiş ve Dengelenmemiş Kuvvetler: giriş animasyonu → balonlarla denge → dengeyi bozma */
test('balonlu öğrenci: denge, balon ekleme/çıkarma ve bileşke', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/?ses=0#/');
  await page.getByTestId('ready-dengelenmis-kuvvetler').click();

  const root = page.getByTestId('denge');
  await expect(root).toHaveAttribute('data-phase', 'ready');
  await page.getByTestId('gender-erkek').click();
  await expect(page.getByTestId('kid')).toHaveAttribute('data-gender', 'erkek');
  await page.getByTestId('denge-start').click();
  await expect(root).toHaveAttribute('data-phase', 'live', { timeout: 30_000 });
  await expect(root).toHaveAttribute('data-balloons', '5');

  // Kuvvetler: 5 × 100 N yukarı, 500 N aşağı
  await page.getByTestId('toggle-forces').click();
  await expect(page.getByTestId('arrow-balloon')).toHaveCount(5);
  await expect(page.getByTestId('arrow-weight')).toHaveAttribute('data-magnitude', '500');

  // Bileşke: 0 N
  await page.getByTestId('toggle-resultant').click();
  const card = page.getByTestId('resultant-card');
  await expect(card).toHaveAttribute('data-value', '0');
  await expect(card).toContainText('R = 500 N − 500 N = 0 N');

  // Balon ekle → bileşke yukarı 100 N
  await page.getByTestId('balloon-add').click();
  await expect(root).toHaveAttribute('data-balloons', '6');
  await expect(card).toHaveAttribute('data-value', '100');

  // İki balon çıkar → bileşke aşağı 100 N
  await page.getByTestId('balloon-remove').click();
  await page.getByTestId('balloon-remove').click();
  await expect(root).toHaveAttribute('data-balloons', '4');
  await expect(card).toHaveAttribute('data-value', '-100');
  await expect(card).toContainText('R = 500 N − 400 N = 100 N');

  // Sıfırla → 5 balon, R = 0
  await page.getByTestId('reset').click();
  await expect(root).toHaveAttribute('data-balloons', '5');
  await expect(card).toHaveAttribute('data-value', '0');

  // Sürükle-bırak (dengede, hareketsizken): bir balonu uzağa çekince bırakılır
  await page.waitForTimeout(800);
  const b = (await page.getByTestId('balloon-0').locator('circle').boundingBox())!;
  const x = b.x + b.width / 2;
  const y = b.y + b.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 150, y - 100, { steps: 5 });
  await page.mouse.move(x - 350, y - 250, { steps: 5 });
  await page.mouse.up();
  await expect(root).toHaveAttribute('data-balloons', '4');

  // Yedek kutudan sürükleyip öğrenciye bırakınca eklenir
  const tray = (await page.getByTestId('balloon-tray').boundingBox())!;
  const kid = (await page.getByTestId('kid').boundingBox())!;
  await page.mouse.move(tray.x + tray.width / 2, tray.y + tray.height / 2);
  await page.mouse.down();
  await page.mouse.move(tray.x - 100, tray.y, { steps: 5 });
  await page.mouse.move(kid.x + kid.width / 2, kid.y, { steps: 8 });
  await page.mouse.up();
  await expect(root).toHaveAttribute('data-balloons', '5');
  await expect(card).toHaveAttribute('data-value', '0');

  expect(errors).toEqual([]);
});
