import fs from 'node:fs';
import { join } from 'node:path';
import type { Page } from '@playwright/test';
import { test, expect } from './support/fixtures';
import { ROOT, allPages, isEnglish, sitemapPaths } from './support/pages';

const SITE = 'https://diogomes.github.io';
const PAGES = allPages();
const EN_PAGES = PAGES.filter(isEnglish);
const PT_PAGES = PAGES.filter((p) => !isEnglish(p));

/** Palavras muito frequentes em PT e raras em inglês técnico (heurística, não um detector de idioma). */
const PT_WORDS =
  /\b(não|você|são|também|está|então|quando|porque|sobre|artigo|trilha|dados|nível|leia|voltar|comentário|assistir|página|através|isso|muito|pelo|pela|alternar)\b/i;

/**
 * Texto em PT permitido nas páginas EN, com o motivo:
 *  - "learnCode: Testes" é o nome do produto (curso) e não se traduz;
 *  - "São Paulo" é nome próprio;
 *  - "Mudar para português" é o rótulo do botão de idioma, escrito de propósito no idioma de destino.
 *  - comentários de visitantes (assets/comments.json) ficam no idioma em que foram escritos
 *    (aparecem em projects.html e na moderação).
 */
type Comment = { name?: string; project?: string; message?: string };
const COMMENTS: Comment[] = JSON.parse(fs.readFileSync(join(ROOT, 'assets/comments.json'), 'utf8'));
const ALLOWED_PT = [
  'learnCode: Testes',
  'São Paulo',
  'Mudar para português',
  ...COMMENTS.flatMap((c) => [c.message, c.name, c.project]).filter((t): t is string => !!t),
];
const IGNORE_SELECTOR = 'script, style, noscript, pre, code';

/** Trechos de texto visíveis (fora de pre/code) que casam com a heurística de PT. */
async function visiblePortuguese(page: Page): Promise<string[]> {
  return page.evaluate(
    ({ re, allowed, ignore }) => {
      const R = new RegExp(re, 'i');
      const hits: string[] = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let n: Node | null;
      while ((n = walker.nextNode())) {
        const el = n.parentElement;
        let text = (n.textContent || '').trim();
        if (!el || !text || el.closest(ignore)) continue;
        if (!el.checkVisibility({ visibilityProperty: true })) continue;
        for (const a of allowed) text = text.split(a).join('');
        if (R.test(text)) hits.push(text.slice(0, 90));
      }
      // Nomes acessíveis e dicas também são "texto" para quem usa leitor de tela
      for (const el of document.querySelectorAll('[aria-label], [title], [placeholder], img[alt]')) {
        if (el.closest(ignore)) continue;
        for (const a of ['aria-label', 'title', 'placeholder', 'alt']) {
          let v = el.getAttribute(a) || '';
          for (const ok of allowed) v = v.split(ok).join('');
          if (R.test(v)) hits.push(`[${a}] ${v.slice(0, 80)}`);
        }
      }
      return hits;
    },
    { re: PT_WORDS.source, allowed: ALLOWED_PT, ignore: IGNORE_SELECTOR },
  );
}

test.describe('i18n: páginas EN não mostram português', () => {
  for (const path of EN_PAGES) {
    test(path, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle'); // comentários vêm de fetch
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      await expect(page.locator('.lang-toggle')).toHaveText('PT');
      expect(await visiblePortuguese(page)).toEqual([]);
    });
  }
});

test.describe('i18n: páginas PT não mostram blocos em inglês', () => {
  for (const path of PT_PAGES) {
    test(path, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('html')).toHaveAttribute('lang', /^pt/);
      await expect(page.locator('.lang-toggle')).toHaveText('EN');
      const visibleEn = await page.locator('[data-lang="en"]').evaluateAll((els) =>
        els.filter((e) => e.checkVisibility()).map((e) => e.textContent!.trim().slice(0, 80)),
      );
      expect(visibleEn).toEqual([]);
    });
  }
});

test.describe('i18n: botão de idioma e preferência', () => {
  const PT = '/blog/testes-flaky.html';
  const EN = '/en/blog/testes-flaky.html';

  test('alterna PT → EN → PT e persiste a escolha', async ({ page }) => {
    await page.goto(PT);
    await page.locator('.lang-toggle').click();
    await expect(page).toHaveURL(EN);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    expect(await page.evaluate(() => localStorage.getItem('dg-lang'))).toBe('en');

    await page.reload();
    await expect(page).toHaveURL(EN);
    await expect(page.locator('.lang-toggle')).toHaveText('PT');

    await page.locator('.lang-toggle').click();
    await expect(page).toHaveURL(PT);
    await expect(page.locator('html')).toHaveAttribute('lang', /^pt/);
    expect(await page.evaluate(() => localStorage.getItem('dg-lang'))).toBe('pt');
  });

  test.describe('com preferência salva', () => {
    test.use({ pinLangToUrl: false });

    for (const [pref, from, to] of [
      ['en', PT, EN],
      ['pt', EN, PT],
      ['en', '/', '/en/'],
    ] as const) {
      test(`preferência "${pref}" redireciona ${from} → ${to}, mantendo query e hash`, async ({ page }) => {
        await page.goto('/robots.txt'); // mesma origem, sem o script de idioma
        await page.evaluate((p) => localStorage.setItem('dg-lang', p), pref);
        await page.goto(`${from}?x=1#topo`);
        await expect(page).toHaveURL(`${to}?x=1#topo`);
      });
    }

    test('a 404 troca o idioma no lugar (não há /en/404.html)', async ({ page }) => {
      await page.goto('/robots.txt');
      await page.evaluate(() => localStorage.setItem('dg-lang', 'en'));
      await page.goto('/404.html');
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      await page.locator('.lang-toggle').click();
      await expect(page).toHaveURL('/404.html');
      await expect(page.locator('html')).toHaveAttribute('lang', /^pt/);
      await expect(page.locator('.lang-toggle')).toHaveText('EN');
    });
  });
});

test.describe('i18n: detecção na 1ª visita', () => {
  // Um user agent de navegador comum: o script ignora os que contêm "headless", "bot" etc.
  const DESKTOP_UA =
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

  test.describe('navegador em inglês (en-US)', () => {
    test.use({ pinLangToUrl: false, locale: 'en-US', userAgent: DESKTOP_UA });

    test('abre a página PT e vai para a versão EN', async ({ page }) => {
      await page.goto('/projects.html');
      await expect(page).toHaveURL('/en/projects.html');
      expect(await page.evaluate(() => localStorage.getItem('dg-lang'))).toBe('en');
    });
  });

  test.describe('navegador em português (pt-BR)', () => {
    test.use({ pinLangToUrl: false, locale: 'pt-BR', userAgent: DESKTOP_UA });

    test('abre a página EN e vai para a versão PT', async ({ page }) => {
      await page.goto('/en/projects.html');
      await expect(page).toHaveURL('/projects.html');
      expect(await page.evaluate(() => localStorage.getItem('dg-lang'))).toBe('pt');
    });
  });

  test.describe('robôs de busca', () => {
    test.use({ pinLangToUrl: false, locale: 'en-US', userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' });

    test('não são redirecionados nem gravam preferência', async ({ page }) => {
      await page.goto('/projects.html');
      await expect(page).toHaveURL('/projects.html');
      expect(await page.evaluate(() => localStorage.getItem('dg-lang'))).toBeNull();
    });
  });
});

test.describe('i18n: canonical e hreflang', () => {
  const linkRe = (html: string, rel: string, hreflang?: string): string | undefined => {
    for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
      const tag = m[0];
      const attr = (n: string) => tag.match(new RegExp(`\\b${n}="([^"]*)"`, 'i'))?.[1];
      if (attr('rel') === rel && (hreflang === undefined || attr('hreflang') === hreflang)) return attr('href');
    }
    return undefined;
  };

  // Pares PT/EN do sitemap: cada página aponta para si como canonical e as duas se referenciam.
  const ptPaths = sitemapPaths().filter((p) => !isEnglish(p));
  for (const pt of ptPaths) {
    const en = pt === '/' ? '/en/' : `/en${pt}`;
    test(`${pt} ↔ ${en}`, async ({ request }) => {
      for (const [path, self] of [[pt, pt], [en, en]]) {
        const res = await request.get(path);
        expect(res.status(), path).toBe(200);
        const html = await res.text();
        expect.soft(linkRe(html, 'canonical'), `${path} canonical`).toBe(SITE + self);
        expect.soft(linkRe(html, 'alternate', 'pt-BR'), `${path} hreflang pt-BR`).toBe(SITE + pt);
        expect.soft(linkRe(html, 'alternate', 'en'), `${path} hreflang en`).toBe(SITE + en);
        expect.soft(linkRe(html, 'alternate', 'x-default'), `${path} hreflang x-default`).toBe(SITE + pt);
      }
      expect(sitemapPaths(), 'versão EN no sitemap').toContain(en);
    });
  }
});
