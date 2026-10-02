import { test, expect, settle } from './support/fixtures';
import { loadQuizBank, plain, type Level } from './support/quiz-data';

test.describe('blog: filtros e busca', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/blog/index.html');
    await settle(page); // o Isotope é iniciado no window 'load'
  });

  test('filtra por categoria e volta para "Todos"', async ({ page }) => {
    const items = page.locator('.blog-item');
    const visible = page.locator('.blog-item:visible');
    const total = await items.count();
    const testes = await page.locator('.blog-item.cat-testes').count();
    expect(testes).toBeGreaterThan(0);
    expect(testes).toBeLessThan(total);

    await page.locator('#blog-filters li', { hasText: 'Testes' }).click();
    await expect(page.locator('#blog-filters li.filter-active')).toHaveText('Testes');
    await expect(visible).toHaveCount(testes);
    for (const cls of await visible.evaluateAll((els) => els.map((e) => e.className))) {
      expect(cls).toContain('cat-testes');
    }

    await page.locator('#blog-filters li', { hasText: 'Todos' }).click();
    await expect(visible).toHaveCount(total);
  });

  test('busca por texto e mostra estado vazio', async ({ page }) => {
    const visible = page.locator('.blog-item:visible');
    const search = page.getByRole('searchbox', { name: 'Buscar nos artigos' });

    const matching = await page
      .locator('.blog-item')
      .evaluateAll((els) => els.filter((e) => e.textContent!.toLowerCase().includes('flaky')).length);
    expect(matching).toBeGreaterThan(0);

    await search.fill('flaky');
    await expect(visible).toHaveCount(matching); // espera a animação do Isotope terminar
    for (const text of await visible.allInnerTexts()) expect(text.toLowerCase()).toContain('flaky');
    await expect(page.locator('#blog-no-results')).toBeHidden();

    await search.fill('xyzzy-sem-resultado');
    await expect(visible).toHaveCount(0);
    await expect(page.locator('#blog-no-results')).toBeVisible();

    await search.fill('');
    await expect(visible).toHaveCount(await page.locator('.blog-item').count());
  });
});

test.describe('busca global (search.html)', () => {
  const results = (page: import('@playwright/test').Page) => page.locator('#ss-results .ss-result');

  test('lê ?q= da URL, ignora acentos e atualiza a URL ao digitar', async ({ page }) => {
    await page.goto('/search.html?q=automação');
    const input = page.locator('#ss-input');
    await expect(input).toHaveValue('automação');
    await expect(results(page).first()).toBeVisible();
    const comAcento = await results(page).count();
    await expect(page.locator('#ss-count')).toHaveText(`${comAcento} resultados`);
    await expect(results(page).first().locator('mark').first()).toBeVisible();

    await input.fill('automacao');
    await expect(page).toHaveURL(/\?q=automacao$/);
    await expect(page.locator('#ss-count')).toHaveText(`${comAcento} resultados`);

    // links da versão PT não levam para /en/
    for (const href of await results(page).locator('a').evaluateAll((as) => as.map((a) => a.getAttribute('href')))) {
      expect(href).toMatch(/^\/(?!en\/)/);
    }
  });

  test('sem resultados mostra a mensagem de vazio', async ({ page }) => {
    await page.goto('/search.html?q=xyzzy-sem-resultado');
    await expect(page.locator('#ss-empty')).toBeVisible();
    await expect(page.locator('#ss-empty-text')).toContainText('xyzzy-sem-resultado');
    await expect(results(page)).toHaveCount(0);
  });

  test('na versão EN os resultados apontam para /en/', async ({ page }) => {
    await page.goto('/en/search.html?q=flaky');
    await expect(results(page).first()).toBeVisible();
    await expect(page.locator('#ss-count')).toHaveText(/^\d+ results?$/);
    const hrefs = await results(page).locator('a').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) expect(href).toMatch(/^\/en\//);

    await results(page).first().locator('a').click();
    await expect(page).toHaveURL(/\/en\/.+\.html$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });
});

test.describe('trilhas: autoavaliação e quiz', () => {
  const TRACK = 'backend';
  const LEVEL: Level = 'junior';
  const bank = loadQuizBank();

  test('autoavaliação persiste após recarregar', async ({ page }) => {
    await page.goto(`/${TRACK}/index.html`);
    const pct = page.locator('.self-assess-pct');
    await expect(pct).toHaveText('0/15 · 0%');

    await page.locator(`#${TRACK}-${LEVEL}-0`).check();
    await page.locator(`#${TRACK}-pleno-1`).check();
    await expect(pct).toHaveText('2/15 · 13%');

    await page.reload();
    await expect(page.locator(`#${TRACK}-${LEVEL}-0`)).toBeChecked();
    await expect(page.locator(`#${TRACK}-pleno-1`)).toBeChecked();
    await expect(pct).toHaveText('2/15 · 13%');

    await page.locator('.self-assess-reset').click();
    await expect(pct).toHaveText('0/15 · 0%');
    await page.reload();
    await expect(page.locator(`#${TRACK}-${LEVEL}-0`)).not.toBeChecked();
  });

  test('quiz: acertar todas de um nível dá placar cheio e marca a autoavaliação', async ({ page }) => {
    const questions = bank[TRACK][LEVEL];
    expect(questions.length).toBeGreaterThan(0);

    await page.goto(`/${TRACK}/index.html`);
    const quiz = page.locator('[data-track-quiz]');
    await quiz.getByRole('radio', { name: /Júnior/ }).check();
    await quiz.getByRole('button', { name: 'Começar quiz' }).click();

    for (const [i, q] of questions.entries()) {
      await expect(quiz.locator('.tq-meta')).toContainText(`${i + 1}/${questions.length}`);
      await expect(quiz.locator('.tq-q [data-lang="pt"]')).toHaveText(plain(q.q[0]));
      await quiz.locator(`.tq-options input[value="${q.a}"]`).check();
      await quiz.getByRole('button', { name: 'Responder' }).click();
      await expect(quiz.locator('.tq-feedback')).toContainText('Correto!');
      await quiz.locator('.tq-next').click();
    }

    const result = quiz.locator(`.tq-result.lvl-${LEVEL}`);
    await expect(result.locator('.tq-score')).toContainText(`${questions.length}/${questions.length}`);
    await expect(result).toHaveClass(/is-full/);

    await result.getByRole('button', { name: /Marcar Júnior na autoavaliação/ }).click();
    await expect(result.locator('.tq-mark-status')).toContainText('marcados na autoavaliação');
    for (let i = 0; i < 5; i++) await expect(page.locator(`#${TRACK}-${LEVEL}-${i}`)).toBeChecked();

    const saved = await page.evaluate((t) => JSON.parse(localStorage.getItem(`dg-quiz-${t}`) || '{}'), TRACK);
    expect(saved[LEVEL]).toMatchObject({ score: questions.length, total: questions.length, wrong: [] });
  });

  test('quiz: resposta errada mostra a correta e o artigo para revisar', async ({ page }) => {
    const q = bank[TRACK][LEVEL][0];
    const wrong = [0, 1, 2, 3].find((k) => k !== q.a)!;

    await page.goto(`/${TRACK}/index.html`);
    const quiz = page.locator('[data-track-quiz]');
    await quiz.getByRole('radio', { name: /Júnior/ }).check();
    await quiz.getByRole('button', { name: 'Começar quiz' }).click();
    await quiz.locator(`.tq-options input[value="${wrong}"]`).check();
    await quiz.getByRole('button', { name: 'Responder' }).click();
    await expect(quiz.locator('.tq-feedback')).toContainText('Não foi dessa vez.');
    await expect(quiz.locator('.tq-option.is-correct [data-lang="pt"]')).toHaveText(plain(q.o[q.a][0]));
    await expect(quiz.locator(`.tq-more a[href="${q.l}"]`)).toBeVisible();
  });
});

test.describe('artigo: sumário, progresso e copiar código', () => {
  const ARTICLE = '/blog/playwright-testes-e2e.html';

  test('o sumário lista as seções e navega até elas', async ({ page }) => {
    await page.goto(ARTICLE);
    const toc = page.locator('nav.post-toc');
    await expect(toc).toBeAttached();
    const summary = toc.locator('summary');
    if (!(await toc.locator('details').evaluate((d: HTMLDetailsElement) => d.open))) await summary.click();

    const links = toc.locator('.post-toc-list a');
    expect(await links.count()).toBeGreaterThanOrEqual(3);
    const target = links.nth(1);
    const href = (await target.getAttribute('href'))!;
    expect(href).toMatch(/^#/);
    await target.click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
    await expect(page.locator(href)).toBeInViewport();
  });

  test('a barra de progresso acompanha a rolagem', async ({ page }) => {
    await page.goto(ARTICLE);
    const bar = page.getByRole('progressbar', { name: 'Progresso de leitura' });
    await expect(bar).toHaveAttribute('aria-valuenow', '0');
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(bar).toHaveAttribute('aria-valuenow', '100');
  });

  test('o botão copiar coloca o código na área de transferência', async ({ page, context, baseURL }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: baseURL });
    await page.goto(ARTICLE);
    const block = page.locator('.post-body [data-lang="pt"] .post-code').first();
    const pre = block.locator('pre');
    const btn = block.locator('.post-copy');
    const code = (await pre.locator('code').innerText()).replace(/\n$/, '');

    await btn.click();
    await expect(btn).toHaveText('Copiado!');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(code);
  });
});

test.describe('tema escuro', () => {
  test('alterna e persiste entre páginas', async ({ page }) => {
    await page.goto('/index.html');
    const html = page.locator('html');
    const toggle = page.getByRole('button', { name: 'Alternar tema claro/escuro' });
    await expect(html).not.toHaveClass(/dark-theme/);
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await toggle.click();
    await expect(html).toHaveClass(/dark-theme/);
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');

    await page.goto('/projects.html');
    await expect(html).toHaveClass(/dark-theme/);
    await page.locator('.lang-toggle').click(); // vai para /en/projects.html
    await expect(page).toHaveURL('/en/projects.html');
    await expect(html).toHaveClass(/dark-theme/);
    await page.getByRole('button', { name: 'Toggle light/dark theme' }).click();
    await page.reload();
    await expect(html).not.toHaveClass(/dark-theme/);
  });

  test('é aplicado no <head>, antes do primeiro paint (sem flash claro)', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('dg-theme', 'dark'));
    // Sem o main.js (fim do <body>), só o script inline do <head> pode aplicar o tema.
    await page.route('**/assets/js/main.js', (route) => route.abort());
    for (const path of ['/index.html', '/blog/testes-flaky.html', '/en/backend/index.html']) {
      await page.goto(path);
      await expect(page.locator('html'), path).toHaveClass(/dark-theme/);
    }
  });
});

test.describe('formulário de contato (FormSubmit interceptado)', () => {
  test('exige os campos obrigatórios e envia os dados esperados', async ({ page }) => {
    const posts: import('@playwright/test').Request[] = [];
    // Nunca envia de verdade: responde localmente no lugar do formsubmit.co
    await page.route('https://formsubmit.co/**', async (route) => {
      posts.push(route.request());
      await route.fulfill({ status: 200, contentType: 'text/html', body: '<h1>ok</h1>' });
    });

    await page.goto('/index.html#contact');
    const form = page.locator('#contact form.comment-form');
    const send = form.getByRole('button', { name: 'Enviar mensagem' });

    // Vazio: o navegador bloqueia o envio
    await send.click();
    expect(posts).toHaveLength(0);
    for (const label of ['Nome *', 'E-mail *', 'Assunto *', 'Mensagem *']) {
      await expect(form.getByLabel(label, { exact: true })).toHaveJSProperty('validity.valueMissing', true);
    }

    // E-mail inválido também bloqueia
    await form.getByLabel('Nome *', { exact: true }).fill('Ana Teste');
    await form.getByLabel('E-mail *', { exact: true }).fill('ana-sem-arroba');
    await form.getByLabel('Assunto *', { exact: true }).fill('Oportunidade');
    await form.getByLabel('Mensagem *', { exact: true }).fill('Olá! Mensagem de teste automatizado.');
    await send.click();
    expect(posts).toHaveLength(0);
    await expect(form.getByLabel('E-mail *', { exact: true })).toHaveJSProperty('validity.typeMismatch', true);

    await form.getByLabel('E-mail *', { exact: true }).fill('ana@example.com');
    const [request] = await Promise.all([page.waitForRequest('https://formsubmit.co/**'), send.click()]);

    expect(request.method()).toBe('POST');
    expect(request.url()).toBe('https://formsubmit.co/gomes.d.n05@gmail.com');
    const fields = Object.fromEntries(new URLSearchParams(request.postData() || ''));
    expect(fields).toMatchObject({
      name: 'Ana Teste',
      email: 'ana@example.com',
      assunto: 'Oportunidade',
      message: 'Olá! Mensagem de teste automatizado.',
      _next: 'https://diogomes.github.io/obrigado.html',
      _captcha: 'true',
      _honey: '',
    });
    expect(fields._subject).toContain('Novo contato');
  });
});
