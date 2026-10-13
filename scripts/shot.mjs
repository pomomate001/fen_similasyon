// Geliştirme yardımcısı: bir sahnede adımlar çalıştırıp ekran görüntüleri alır.
// Kullanım: node scripts/shot.mjs "<hash>" adım1 adım2 ...
// Adımlar: wait:<seçici> | click:<seçici> | sleep:<ms> | shot:<dosya> | size:<g>x<y> | drag:<seçici>:<dx>:<dy>
import { chromium } from '@playwright/test';

const [hash = '#/', ...steps] = process.argv.slice(2);
const base = process.env.BASE_URL ?? 'http://localhost:5173/';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && errors.push(m.text()));
await page.goto(base + hash);
for (const st of steps) {
  const i = st.indexOf(':');
  const cmd = st.slice(0, i);
  const arg = st.slice(i + 1);
  if (cmd === 'wait') await page.waitForSelector(arg, { timeout: 120000 });
  else if (cmd === 'click') await page.click(arg, { timeout: 120000 });
  else if (cmd === 'clickf') await page.click(arg, { timeout: 120000, force: true });
  else if (cmd === 'sleep') await page.waitForTimeout(Number(arg));
  else if (cmd === 'shot') await page.screenshot({ path: arg });
  else if (cmd === 'size') {
    const [w, h] = arg.split('x').map(Number);
    await page.setViewportSize({ width: w, height: h });
  } else if (cmd === 'drag') {
    const [sel, dx, dy] = arg.split('|');
    const box = await page.locator(sel).first().boundingBox();
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + Number(dx) / 2, y + Number(dy) / 2, { steps: 5 });
    await page.mouse.move(x + Number(dx), y + Number(dy), { steps: 5 });
    await page.mouse.up();
  }
  console.log('✓', st);
}
if (errors.length) console.log('KONSOL:\n' + errors.join('\n'));
await browser.close();
