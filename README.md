# diogomes.github.io

[![Quality](https://github.com/Diogomes/diogomes.github.io/actions/workflows/quality.yml/badge.svg)](https://github.com/Diogomes/diogomes.github.io/actions/workflows/quality.yml)

Portfólio e blog de Diogo Gomes (Quality Engineer): projetos, artigos sobre qualidade de software e
trilhas de estudo (back-end, front-end, DevOps, dados e mobile) com quiz e autoavaliação.

O site é **estático** (HTML/CSS/JS, sem build) e publicado pelo GitHub Pages a partir do branch `master`.
O português é o idioma padrão; a versão em inglês fica em `en/<mesmo caminho>` e é **gerada** a partir
das páginas em PT.

## Rodar localmente

```bash
python3 -m http.server 8080      # ou: npm run serve
# http://localhost:8080
```

## Testes

Suíte em [`tests/`](tests/) com [Playwright](https://playwright.dev) e [axe-core](https://github.com/dequelabs/axe-core):

| Arquivo | O que cobre |
|---|---|
| `smoke.spec.ts` | Todas as páginas (sitemap + fora dele, PT e EN) carregam sem erro de JS e sem 4xx/5xx do próprio site |
| `i18n.spec.ts` | Sem português visível nas páginas EN (e vice-versa), botão de idioma, redirecionamento por preferência, detecção na 1ª visita, canonical/hreflang |
| `features.spec.ts` | Filtros/busca do blog, busca global, autoavaliação, quiz, sumário/progresso/copiar código, tema escuro, formulário de contato (envio interceptado) |
| `a11y.spec.ts` | axe (WCAG 2 A/AA) nas páginas principais; falha em violações *serious*/*critical* |
| `visual.spec.ts` | Regressão visual (`toHaveScreenshot`) de telas-chave |

Terceiros (YouTube, Maps, GoatCounter, Google Fonts…) são bloqueados nos testes: a suíte é rápida e não depende da rede.

```bash
npm ci
npx playwright install chromium   # só na 1ª vez
npm test                          # sobe o servidor sozinho (webServer do playwright.config.ts)
npx playwright test --project=desktop tests/features.spec.ts   # um recorte
npm run report                    # abre o relatório HTML
```

Projetos: `desktop` (Desktop Chrome), `mobile` (Pixel 7: smoke e funcionalidades) e `visual`.

**Testes visuais**: screenshots dependem de fontes e da rasterização do sistema, então as baselines em
`tests/__screenshots__/` são geradas **só** na imagem oficial do Playwright, a mesma do CI. Fora dela eles
aparecem como *skipped*, a não ser com `CI=1` ou `PW_VISUAL=1`. Para comparar ou atualizar (Docker ou Podman):

```bash
npm run test:visual:docker        # compara, dentro de mcr.microsoft.com/playwright:v1.63.0-noble
npm run test:visual:update        # regrava as baselines (revise os PNGs antes de commitar)
```

Ao atualizar o `@playwright/test`, atualize junto a tag da imagem (package.json e `.github/workflows/quality.yml`) e regrave as baselines.

## CI (`.github/workflows/quality.yml`)

- **static** (bloqueante): `check_html.py`, `build_en.py --check`, `build_search_index.py --check` e links internos
  com lychee `--offline`. Links externos e o validador W3C rodam como informativos.
- **e2e** (bloqueante): a suíte do Playwright no container oficial; o relatório HTML fica como artifact `playwright-report`.
- **lighthouse** (informativo): mede o site já publicado.

## Geradores

Depois de editar qualquer página em PT, rode os dois primeiros e commite o resultado (o CI confere):

```bash
pip install beautifulsoup4
python3 scripts/build_en.py              # gera en/ e o sitemap.xml   (--check só confere)
python3 scripts/build_search_index.py    # gera assets/search-index.json (--check só confere)
python3 scripts/check_html.py            # tags balanceadas e ids únicos
node scripts/og-images.mjs               # imagens Open Graph dos artigos (PT e EN)
node scripts/build_cv_pdf.mjs            # PDFs do currículo a partir de cv.html e en/cv.html
```
