import fs from 'node:fs';
import path from 'node:path';

export const ROOT = path.resolve(__dirname, '..', '..');
const SITE = 'https://diogomes.github.io';

/** Páginas publicadas mas fora do sitemap (mesma lista de NOT_IN_SITEMAP em scripts/build_en.py). */
export const OUTSIDE_SITEMAP = ['404.html', 'analytics.html', 'moderacao.html', 'obrigado.html', 'cv.html'];
/** A 404 não tem versão /en/ própria: troca o idioma no lugar. */
const NO_EN = new Set(['404.html']);

/** Caminhos (ex.: "/", "/en/blog/index.html") listados no sitemap.xml. */
export function sitemapPaths(): string[] {
  const xml = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim().replace(SITE, '') || '/');
}

/** Todas as páginas do site: sitemap + páginas fora dele, em PT e EN. */
export function allPages(): string[] {
  const extra = OUTSIDE_SITEMAP.flatMap((p) => (NO_EN.has(p) ? [`/${p}`] : [`/${p}`, `/en/${p}`]));
  return [...new Set([...sitemapPaths(), ...extra])].sort();
}

export const isEnglish = (p: string): boolean => p === '/en/' || p.startsWith('/en/');

/** Arquivos .html no disco que são páginas do site (fora de assets/, scripts/, node_modules…). */
export function htmlFilesOnDisk(): string[] {
  const out: string[] = [];
  const skip = new Set(['assets', 'scripts', 'node_modules', 'tests', 'test-results', 'playwright-report', 'blob-report']);
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name.startsWith('.') || skip.has(e.name)) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name.endsWith('.html')) out.push('/' + path.relative(ROOT, full).split(path.sep).join('/'));
    }
  };
  walk(ROOT);
  return out.sort();
}

/** "/" ↔ "/index.html" e "/en/" ↔ "/en/index.html" são a mesma página. */
export const normalize = (p: string): string => (p.endsWith('/') ? p + 'index.html' : p);
