import { test as base, expect, type Page } from '@playwright/test';

/** Hosts servidos pelo próprio site (o webServer local). Todo o resto é terceiro. */
export function isOwnHost(url: string, baseURL: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol === 'data:' || u.protocol === 'blob:' || u.protocol === 'about:') return true;
    return u.host === new URL(baseURL).host;
  } catch {
    return true;
  }
}

type Options = {
  /**
   * Fixa a preferência de idioma (localStorage 'dg-lang') no idioma da URL visitada,
   * como se o visitante já tivesse escolhido. Sem isso, perfis com user agent "não headless"
   * (ex.: Pixel 7) disparariam a detecção de 1ª visita e seriam redirecionados.
   * Testes da própria detecção desligam com test.use({ pinLangToUrl: false }).
   */
  pinLangToUrl: boolean;
};

type Fixtures = {
  /** Erros de JS não tratados (pageerror) da página principal. */
  pageErrors: Error[];
  /** Respostas >= 400 vindas do próprio host. */
  badResponses: string[];
  /** Requisições a terceiros bloqueadas (útil para depurar). */
  blockedRequests: string[];
};

export const test = base.extend<Options & Fixtures>({
  pinLangToUrl: [true, { option: true }],

  // Bloqueia terceiros (YouTube, Maps, GoatCounter, Google Fonts…): suíte rápida,
  // determinística e sem depender da rede.
  context: async ({ context, baseURL, pinLangToUrl }, use) => {
    await context.route(
      (url) => !isOwnHost(url.href, baseURL!),
      (route) => route.abort('blockedbyclient'),
    );
    if (pinLangToUrl) {
      await context.addInitScript(() => {
        try {
          if (!localStorage.getItem('dg-lang')) {
            localStorage.setItem('dg-lang', location.pathname.startsWith('/en/') ? 'en' : 'pt');
          }
        } catch {
          /* storage indisponível */
        }
      });
    }
    await use(context);
  },

  blockedRequests: async ({ context, baseURL }, use) => {
    const list: string[] = [];
    context.on('requestfailed', (r) => {
      if (!isOwnHost(r.url(), baseURL!)) list.push(r.url());
    });
    await use(list);
  },

  pageErrors: async ({ page }, use) => {
    const errors: Error[] = [];
    page.on('pageerror', (e) => errors.push(e));
    await use(errors);
  },

  badResponses: async ({ page, baseURL }, use) => {
    const bad: string[] = [];
    page.on('response', (r) => {
      if (r.status() >= 400 && isOwnHost(r.url(), baseURL!)) bad.push(`${r.status()} ${new URL(r.url()).pathname}`);
    });
    await use(bad);
  },
});

export { expect };

/** Espera a página ficar "assentada": load + fontes + JS de inicialização (window 'load'). */
export async function settle(page: Page): Promise<void> {
  await page.waitForLoadState('load');
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
}
