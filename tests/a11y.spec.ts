import AxeBuilder from '@axe-core/playwright';
import { test, expect, settle } from './support/fixtures';

/** Páginas principais (uma de cada tipo), nas duas línguas. */
const PAGES = [
  '/index.html',
  '/projects.html',
  '/blog/index.html',
  '/blog/testes-flaky.html',
  '/backend/index.html',
  '/search.html?q=teste',
  '/cv.html',
];

const BLOCKING = new Set(['serious', 'critical']);

for (const path of PAGES.flatMap((p) => [p, `/en${p}`])) {
  test(`axe (WCAG 2 A/AA): ${path}`, async ({ page }, testInfo) => {
    // Mostra tudo que o AOS esconderia até o scroll: o axe precisa avaliar o estado final (contraste real).
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        const s = document.createElement('style');
        s.textContent = '[data-aos]{opacity:1!important;transform:none!important;transition:none!important}';
        document.head.appendChild(s);
      });
    });
    await page.goto(path);
    await settle(page);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      // Conteúdo de terceiros (bloqueado nos testes) não é do site.
      .exclude('iframe')
      .analyze();

    await testInfo.attach('axe-results.json', { body: JSON.stringify(results.violations, null, 2), contentType: 'application/json' });

    const blocking = results.violations
      .filter((v) => BLOCKING.has(v.impact ?? ''))
      .map((v) => ({ rule: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 5).map((n) => n.target.join(' ')) }));
    expect(blocking, 'violações serious/critical').toEqual([]);
  });
}
