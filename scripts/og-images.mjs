// Gera as imagens Open Graph (1200x630) de cada artigo, em PT e EN, e atualiza as <meta> do <head>.
// Uso: node scripts/og-images.mjs [pasta/arquivo.html ...]   (sem argumentos: todos os artigos)
//   Saída: assets/img/og/<pasta>-<slug>.png e assets/img/og/<pasta>-<slug>-en.png
//   Opção: --no-meta  só gera as imagens, sem alterar os HTML.
// Requer o Playwright (npm i -D playwright, ou instalado globalmente).
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require('playwright'); }
catch { playwright = require(path.join(execSync('npm root -g').toString().trim(), 'playwright')); }

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://diogomes.github.io';
const DIRS = ['blog', 'backend', 'frontend', 'devops', 'dados', 'mobile'];
const OUT = path.join(root, 'assets/img/og');
const SUFFIX = / - Diogo Gomes\s*$/;

const args = process.argv.slice(2);
const noMeta = args.includes('--no-meta');
const only = args.filter(a => !a.startsWith('--')).map(a => path.normalize(a));

const articles = DIRS.flatMap(d => fs.readdirSync(path.join(root, d))
  .filter(f => f.endsWith('.html') && f !== 'index.html')
  .map(f => path.join(d, f)))
  .filter(p => !only.length || only.includes(p))
  .sort();

const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Extrai do HTML (no navegador, via DOMParser) título, categoria e descrições PT/EN
function extract([html, indexHtml, file]) {
  const parse = s => new DOMParser().parseFromString(s, 'text/html');
  const doc = parse(html);
  const idx = indexHtml ? parse(indexHtml) : null;
  const clean = s => (s || '').replace(/\s+/g, ' ').trim();
  const textOf = (el, lang) => {
    if (!el) return '';
    const c = el.cloneNode(true);
    c.querySelectorAll(`[data-lang="${lang === 'en' ? 'pt' : 'en'}"]`).forEach(n => n.remove());
    if (lang === 'en') {
      const nodes = [c, ...c.querySelectorAll('[data-en]')].filter(n => n.hasAttribute && n.hasAttribute('data-en'));
      nodes.forEach(n => { n.innerHTML = n.getAttribute('data-en'); });
    }
    return clean(c.textContent);
  };
  const card = idx && [...idx.querySelectorAll('.post-card')]
    .find(cd => cd.querySelector(`h3 a[href="${file}"]`));
  const h1 = doc.querySelector('.post-hero h1');
  const titleTag = clean(doc.querySelector('title')?.textContent);
  const htmlEl = doc.documentElement;
  const tmp = document.createElement('div');
  const strip = s => { tmp.innerHTML = s || ''; return clean(tmp.textContent); };
  const catEl = doc.querySelector('.post-hero .post-cat') || card?.querySelector('.post-cat');
  const descEl = card?.querySelector('.post-card-body p[data-en]');
  return {
    titlePt: h1 ? textOf(h1, 'pt') : titleTag.replace(/ - Diogo Gomes\s*$/, ''),
    titleEn: strip(htmlEl.getAttribute('data-title-en')).replace(/ - Diogo Gomes\s*$/, ''),
    catPt: textOf(catEl, 'pt'),
    catEn: textOf(catEl, 'en'),
    descPt: clean(doc.querySelector('meta[property="og:description"]')?.getAttribute('content')
      || doc.querySelector('meta[name="description"]')?.getAttribute('content')),
    descEn: descEl ? strip(descEl.getAttribute('data-en')) : '',
  };
}

function updateMeta(html, info, urlPt, urlEn) {
  const head = html.slice(0, html.indexOf('</head>'));
  let h = head;
  // remove metas que serão recriadas
  h = h.replace(/^[ \t]*<meta (?:property|name)="(?:og:image(?::\w+)?|twitter:(?:card|image|title|description))"[^>]*>\r?\n/gm, '');
  const titleEnAttr = info.titleEn ? ` data-en-content="${esc(info.titleEn)}"` : '';
  const descEnAttr = info.descEn ? ` data-en-content="${esc(info.descEn)}"` : '';
  h = h.replace(/^([ \t]*)<meta property="og:title"[^\n]*$/m,
    (_, sp) => `${sp}<meta property="og:title" content="${esc(info.titlePt)}"${titleEnAttr}>`);
  if (info.descPt) {
    h = h.replace(/^([ \t]*)<meta property="og:description"[^\n]*$/m,
      (_, sp) => `${sp}<meta property="og:description" content="${esc(info.descPt)}"${descEnAttr}>`);
  }
  const block = sp => [
    `${sp}<meta property="og:image" content="${urlPt}" data-en-content="${urlEn}">`,
    `${sp}<meta property="og:image:width" content="1200">`,
    `${sp}<meta property="og:image:height" content="630">`,
    `${sp}<meta name="twitter:card" content="summary_large_image">`,
    `${sp}<meta name="twitter:image" content="${urlPt}" data-en-content="${urlEn}">`,
  ].join('\n');
  const anchor = /^([ \t]*)<meta property="og:url"[^\n]*$/m;
  if (!anchor.test(h)) throw new Error('og:url não encontrado');
  h = h.replace(anchor, (line, sp) => `${line}\n${block(sp)}`);
  // JSON-LD: imagem do artigo
  h = h.replace(/("image":\s*")https:\/\/diogomes\.github\.io\/assets\/img\/og[^"]*(")/, `$1${urlPt}$2`);
  return h + html.slice(head.length);
}

fs.mkdirSync(OUT, { recursive: true });
const browser = await playwright.chromium.launch();
try {
  const parser = await browser.newPage();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.goto(pathToFileURL(path.join(root, 'scripts/og-template.html')).href, { waitUntil: 'networkidle' });
  const indexCache = {};
  for (const rel of articles) {
    const [dir, file] = rel.split(path.sep);
    const abs = path.join(root, rel);
    const html = fs.readFileSync(abs, 'utf8');
    indexCache[dir] ??= fs.existsSync(path.join(root, dir, 'index.html'))
      ? fs.readFileSync(path.join(root, dir, 'index.html'), 'utf8') : '';
    const info = await parser.evaluate(extract, [html, indexCache[dir], file]);
    const slug = `${dir}-${file.replace(/\.html$/, '')}`;
    const isTrack = dir !== 'blog';
    const jobs = [
      { lang: 'pt', title: info.titlePt, cat: info.catPt || 'Blog', kind: isTrack ? 'Trilha de estudos' : 'Blog', out: `${slug}.png` },
      { lang: 'en', title: info.titleEn || info.titlePt, cat: info.catEn || info.catPt || 'Blog', kind: isTrack ? 'Study track' : 'Blog', out: `${slug}-en.png` },
    ];
    for (const j of jobs) {
      const size = await page.evaluate(d => window.render(d), j);
      await page.screenshot({ path: path.join(OUT, j.out), type: 'png' });
      const kb = Math.round(fs.statSync(path.join(OUT, j.out)).size / 1024);
      console.log(`${j.out.padEnd(52)} ${String(kb).padStart(4)} KB  font ${size}px  ${j.title}`);
    }
    if (!noMeta) {
      const urlPt = `${SITE}/assets/img/og/${slug}.png`;
      const urlEn = `${SITE}/assets/img/og/${slug}-en.png`;
      const updated = updateMeta(html, info, urlPt, urlEn);
      if (updated !== html) fs.writeFileSync(abs, updated);
      if (!info.descEn) console.warn(`  aviso: sem descrição EN para ${rel}`);
    }
  }
} finally {
  await browser.close();
}
