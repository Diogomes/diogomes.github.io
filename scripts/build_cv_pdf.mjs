// Gera os PDFs do currículo a partir de cv.html (PT) e en/cv.html (EN).
// Uso: node scripts/build_cv_pdf.mjs   (rode antes: python3 scripts/build_en.py)
// Requer o Playwright (npm i -D playwright, ou instalado globalmente).
import { createRequire } from 'node:module';
import { execSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require('playwright'); }
catch { playwright = require(path.join(execSync('npm root -g').toString().trim(), 'playwright')); }

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8790;
const server = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: root, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 600));

const jobs = [
  { page: 'cv.html', lang: 'pt', out: 'assets/Diogo-Gomes-CV.pdf' },
  { page: 'en/cv.html', lang: 'en', out: 'assets/Diogo-Gomes-CV-en.pdf' },
];
const browser = await playwright.chromium.launch();
try {
  for (const j of jobs) {
    const ctx = await browser.newContext();
    // fixa a preferência para que o redirecionamento de idioma não troque a página
    await ctx.addInitScript(l => { try { localStorage.setItem('dg-lang', l); } catch (e) {} }, j.lang);
    const pg = await ctx.newPage();
    await pg.goto(`http://localhost:${PORT}/${j.page}`, { waitUntil: 'networkidle' });
    await pg.emulateMedia({ media: 'print' });
    await pg.pdf({ path: path.join(root, j.out), format: 'Letter', printBackground: true, preferCSSPageSize: true });
    console.log('ok', j.out);
    await ctx.close();
  }
} finally {
  await browser.close();
  server.kill();
}
