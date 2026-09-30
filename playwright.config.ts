import { defineConfig, devices } from '@playwright/test';

/**
 * Suíte E2E do site estático (servido pelo http.server do Python, como no GitHub Pages).
 *
 * Projetos:
 *  - desktop: smoke, i18n, funcionalidades e acessibilidade (Desktop Chrome)
 *  - mobile:  smoke e funcionalidades no Pixel 7 (viewport/touch de celular)
 *  - visual:  regressão visual (toHaveScreenshot). As baselines são geradas na imagem
 *             oficial do Playwright (a mesma do CI) e só rodam com CI=1 ou PW_VISUAL=1,
 *             porque fontes e rasterização variam entre sistemas operacionais.
 */
const PORT = Number(process.env.PORT || 8123);
const CI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  workers: CI ? 4 : undefined,
  timeout: 30_000,
  expect: {
    timeout: 5_000,
    toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled', caret: 'hide', scale: 'css' },
  },
  // Um só ambiente gera as baselines (o container do CI), então o caminho não leva SO/projeto.
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}{ext}',
  reporter: CI
    ? [['github'], ['list'], ['html', { open: 'never' }], ['json', { outputFile: 'test-results/results.json' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    locale: 'pt-BR',
    colorScheme: 'light',
    // O sw.js faz cache de páginas; nos testes queremos sempre a versão do disco.
    serviceWorkers: 'block',
  },
  projects: [
    {
      name: 'desktop',
      testIgnore: /visual\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      testMatch: /(smoke|features)\.spec\.ts/,
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'visual',
      testMatch: /visual\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
  ],
  webServer: {
    command: `python3 -m http.server ${PORT} --bind 127.0.0.1`,
    url: `http://127.0.0.1:${PORT}/index.html`,
    reuseExistingServer: !CI,
    stdout: 'ignore',
    stderr: 'ignore',
  },
});
