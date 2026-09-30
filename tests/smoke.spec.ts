import { test, expect } from './support/fixtures';
import { allPages, htmlFilesOnDisk, isEnglish, normalize } from './support/pages';

const PAGES = allPages();

test.describe('smoke: todas as páginas carregam', () => {
  for (const path of PAGES) {
    test(`${path}`, { tag: '@smoke' }, async ({ page, pageErrors, badResponses }) => {
      const res = await page.goto(path, { waitUntil: 'load' });
      expect(res?.status(), 'status HTTP da página').toBeLessThan(400);

      // Não houve redirecionamento de idioma (a preferência está fixada no idioma da URL)
      expect(normalize(new URL(page.url()).pathname)).toBe(normalize(path));
      await expect(page.locator('html')).toHaveAttribute('lang', isEnglish(path) ? 'en' : /^pt/);
      await expect(page).toHaveTitle(/\S/);
      await expect(page.locator('h1, h2').first()).toBeVisible();

      expect(pageErrors.map((e) => e.message), 'erros de JavaScript').toEqual([]);
      expect(badResponses, 'recursos do próprio site com erro').toEqual([]);
    });
  }
});

test('toda página HTML publicada está no sitemap ou na lista explícita de exceções', async () => {
  const known = new Set(PAGES.map(normalize));
  const orphans = htmlFilesOnDisk().filter((f) => !known.has(f));
  expect(orphans).toEqual([]);
});
