import type { Page } from '@playwright/test';
import { test, expect, settle } from './support/fixtures';

/*
 * Regressão visual. Screenshots dependem de fontes e da rasterização do SO, então as baselines
 * (tests/__screenshots__) são geradas SÓ na imagem oficial do Playwright — a mesma do CI:
 *   npm run test:visual:update   (container, --update-snapshots)
 *   npm run test:visual:docker   (container, compara)
 * Fora dele os testes são pulados, a não ser com PW_VISUAL=1 (ex.: já dentro de um container).
 */
test.skip(!process.env.CI && !process.env.PW_VISUAL, 'visual: rode no container (npm run test:visual:docker) ou com PW_VISUAL=1');

/** Congela o que muda sozinho: animações do AOS, efeito de digitação e cursores. */
const FREEZE_CSS = `
  *, *::before, *::after { transition: none !important; animation: none !important; caret-color: transparent !important; }
  [data-aos] { opacity: 1 !important; transform: none !important; }
  .typed-cursor { display: none !important; }
`;

async function open(page: Page, path: string): Promise<void> {
  await page.addInitScript((css) => {
    document.addEventListener('DOMContentLoaded', () => {
      const s = document.createElement('style');
      s.textContent = css;
      document.head.appendChild(s);
    });
  }, FREEZE_CSS);
  await page.goto(path);
  await settle(page);
  await page.waitForLoadState('networkidle'); // índice de busca, comentários, Isotope
  // O typed.js reescreve o texto do hero em loop: fixa um valor para a foto
  await page.evaluate(() => {
    const el = document.querySelector('.typed');
    if (el) el.textContent = 'Quality Engineer';
  });
}

const SCREENS: { name: string; path: string; mask?: string[] }[] = [
  { name: 'pt-home-hero', path: '/index.html', mask: ['.typed'] },
  { name: 'pt-projects-top', path: '/projects.html' },
  { name: 'pt-blog-index', path: '/blog/index.html' },
  { name: 'pt-article', path: '/blog/testes-flaky.html' },
  { name: 'pt-track-backend', path: '/backend/index.html' },
  // Contagem e resultados dependem do índice gerado: mascarados para não quebrar a cada artigo novo
  { name: 'pt-search', path: '/search.html?q=playwright', mask: ['#ss-results', '#ss-count', '.ss-chip-n'] },
  { name: 'en-home-hero', path: '/en/index.html', mask: ['.typed'] },
  { name: 'en-blog-index', path: '/en/blog/index.html' },
];

for (const s of SCREENS) {
  test(`visual: ${s.name}`, async ({ page }) => {
    await open(page, s.path);
    await expect(page).toHaveScreenshot(`${s.name}.png`, {
      mask: (s.mask ?? []).map((sel) => page.locator(sel)),
    });
  });
}
