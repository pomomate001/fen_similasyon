import { expect, type Page } from '@playwright/test';

/** Hızlandırılmış ve sessiz test modu */
export const FAST = 'ses=0&hiz=20';

export function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  return errors;
}

export async function openScene(page: Page, n: number, extra = FAST) {
  await page.goto(`/?${extra}#/sim/bileske-kuvvet?sahne=${n}`);
  await expect(page.getByTestId('stage')).toBeVisible();
}

/** Sahne bekleme noktasına gelene kadar bekler ve Devam Et'e basar */
export async function continueWhenReady(page: Page) {
  const btn = page.getByTestId('continue');
  await expect(btn).toHaveClass(/ready/, { timeout: 120_000 });
  await btn.click();
}

/** 1920×1080 sahne pikselini ekran pikseline çeviren ölçek */
export async function stageScale(page: Page) {
  const box = await page.getByTestId('stage').boundingBox();
  return box!.width / 1920;
}

/** Bir sürükleme tutamacını sahne koordinatlarında (dx, dy) kadar sürükler */
export async function dragBy(page: Page, testId: string, dx: number, dy: number) {
  const s = await stageScale(page);
  const h = page.getByTestId(`${testId}-handle`);
  await expect(h).toBeVisible();
  const b = (await h.boundingBox())!;
  const x = b.x + b.width / 2;
  const y = b.y + b.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + (dx * s) / 3, y + (dy * s) / 3, { steps: 4 });
  await page.mouse.move(x + dx * s, y + dy * s, { steps: 6 });
  await page.mouse.up();
}

export async function value(page: Page, testId: string) {
  return Number(await page.getByTestId(testId).getAttribute('data-value'));
}
