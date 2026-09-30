#!/usr/bin/env python3
"""Gera a versão estática em inglês do site em /en/ e atualiza o sitemap.xml.

As páginas em português são a fonte da verdade. Cada uma já carrega o inglês
nos mecanismos do assets/js/i18n.js:
  data-i18n="chave"      → dicionário EN do i18n.js
  data-en="..."          → innerHTML em inglês
  data-en-ATRIBUTO="..." → valor do atributo em inglês
  data-lang="pt|en"      → blocos alternativos
  <html data-title-en>   → título da aba
Este script aplica tudo isso e grava en/<mesmo caminho>, para que o inglês
tenha URL própria (indexável, com hreflang).

Uso:
  python3 scripts/build_en.py          # gera en/ e sitemap.xml
  python3 scripts/build_en.py --check  # sai com 1 se algo estiver desatualizado (CI)
"""
import json
import posixpath
import re
import subprocess
import sys
from pathlib import Path

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
BASE = 'https://diogomes.github.io/'
# Páginas sem versão EN própria (a 404 é servida em qualquer caminho e troca o idioma no lugar)
SKIP = {'404.html'}
NOT_IN_SITEMAP = {'404.html', 'analytics.html', 'moderacao.html', 'obrigado.html', 'cv.html'}
BANNER = ' Gerado por scripts/build_en.py a partir de /{src} — não edite; edite a página em PT. '
URL_ATTRS = ('href', 'src', 'poster', 'data-src', 'data-bg')
ABSOLUTE = re.compile(r'^(?:[a-z][a-z0-9+.-]*:|//|/|#|\?)', re.I)


def source_pages():
    out = subprocess.check_output(['git', 'ls-files', '*.html'], cwd=ROOT, text=True).split()
    extra = [p for p in ('search.html',) if (ROOT / p).exists() and p not in out]
    return sorted(p for p in out + extra
                  if not p.startswith(('assets/', 'en/', 'scripts/')) and p not in SKIP)


def load_dict():
    """Lê o dicionário EN (var EN = {...}) e o TYPED_EN do i18n.js."""
    js = (ROOT / 'assets/js/i18n.js').read_text()
    body = js[js.index('var EN = {'):]
    body = body[:body.index('\n  };')]
    pairs = re.findall(r"'([\w.]+)':\s*(\"(?:[^\"\\]|\\.)*\"|'(?:[^'\\]|\\.)*')", body)
    d = {}
    for k, v in pairs:
        v = v[1:-1]
        d[k] = v.replace("\\'", "'").replace('\\"', '"')
    typed = re.search(r"var TYPED_EN = '([^']*)'", js)
    return d, typed.group(1) if typed else None


def descriptions():
    """Descrições EN por página, vindas do índice de busca (se existir)."""
    p = ROOT / 'assets/search-index.json'
    if not p.exists():
        return {}
    data = json.loads(p.read_text())
    items = data.get('pages', data) if isinstance(data, dict) else data
    out = {}
    for it in items:
        en = it.get('en') or {}
        desc = en.get('description') or en.get('desc')
        if it.get('url') and desc:
            out[it['url']] = desc
    return out


def rel_asset(url, src_dir=''):
    """Recursos relativos (não-HTML) apontam de volta para o original em PT.

    A página en/<dir>/x.html está um nível abaixo de <dir>/x.html; o recurso é
    resolvido a partir de <dir>/ e reescrito relativo a en/<dir>/ (ex.: em
    dados/, 'feed.xml' vira '../../dados/feed.xml', e '../assets/a.css' vira
    '../../assets/a.css').
    """
    if not url or ABSOLUTE.match(url):
        return url
    path = url.split('#')[0].split('?')[0]
    if path.endswith('.html') or path == '':
        return url
    rest = url[len(path):]
    target = posixpath.normpath(posixpath.join(src_dir, path))
    return posixpath.relpath(target, posixpath.join('en', src_dir) if src_dir else 'en') + rest


def page_url(path):
    return '' if path == 'index.html' else path


def transform(src, en_dict, typed_en, en_desc):
    html = (ROOT / src).read_text()
    soup = BeautifulSoup(html, 'html.parser')
    root = soup.html

    # blocos PT saem; blocos EN ficam (sem o marcador)
    for el in soup.select('[data-lang="pt"]'):
        el.decompose()
    for el in soup.select('[data-lang="en"]'):
        del el['data-lang']

    for el in soup.select('[data-en]'):
        val = el['data-en']
        del el['data-en']
        el.clear()
        el.append(BeautifulSoup(val, 'html.parser'))
    for el in soup.select('[data-i18n]'):
        key = el['data-i18n']
        del el['data-i18n']
        if key in en_dict:
            el.clear()
            el.append(BeautifulSoup(en_dict[key], 'html.parser'))

    for el in soup.find_all(True):
        for attr in [a for a in el.attrs if a.startswith('data-en-')]:
            el[attr[8:]] = el[attr]
            del el[attr]
    typed = soup.select_one('.typed')
    if typed is not None and typed_en and 'data-typed-items' in typed.attrs:
        typed['data-typed-items'] = typed_en

    # <html>, <title>
    title_en = root.get('data-title-en')
    root['lang'] = 'en'
    root['data-static-lang'] = ''
    if 'data-title-en' in root.attrs:
        del root['data-title-en']
    if title_en and soup.title:
        soup.title.string = title_en

    # URLs próprias da versão EN
    en_url = BASE + 'en/' + page_url(src)
    for sel in ('link[rel="canonical"]',):
        for el in soup.select(sel):
            el['href'] = en_url
    for el in soup.select('meta[property="og:url"]'):
        el['content'] = en_url
    for el in soup.select('input[name="_next"]'):
        el['value'] = el.get('value', '').replace(BASE, BASE + 'en/')
    desc = en_desc.get(src)
    if desc:
        for el in soup.select('meta[name="description"]'):
            el['content'] = desc
    for el in soup.select('script[type="application/ld+json"]'):
        el.string = (el.string or '').replace('"inLanguage": "pt-BR"', '"inLanguage": "en"')

    # caminhos relativos de recursos
    src_dir = posixpath.dirname(src)
    for el in soup.find_all(True):
        for attr in URL_ATTRS:
            if attr in el.attrs and isinstance(el[attr], str):
                el[attr] = rel_asset(el[attr], src_dir)
        if 'srcset' in el.attrs:
            el['srcset'] = ', '.join(
                ' '.join([rel_asset(part.split()[0], src_dir)] + part.split()[1:])
                for part in el['srcset'].split(',') if part.strip())
        if 'style' in el.attrs and 'url(' in el['style']:
            el['style'] = re.sub(r"url\((['\"]?)([^)'\"]+)\1\)",
                                 lambda m: f"url({m.group(1)}{rel_asset(m.group(2), src_dir)}{m.group(1)})",
                                 el['style'])

    out = str(soup)
    out = out.replace('<!DOCTYPE html>', '<!DOCTYPE html>\n<!--' + BANNER.format(src=src) + '-->', 1)
    return out


def sitemap(pages):
    old = (ROOT / 'sitemap.xml').read_text()
    lastmod = dict(re.findall(r'<loc>([^<]+)</loc>\s*<lastmod>([^<]+)</lastmod>', old))
    rows = ['<?xml version="1.0" encoding="UTF-8"?>',
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
            '        xmlns:xhtml="http://www.w3.org/1999/xhtml">']
    for p in pages:
        if p in NOT_IN_SITEMAP:
            continue
        pt = BASE + page_url(p)
        en = BASE + 'en/' + page_url(p)
        mod = lastmod.get(pt) or lastmod.get(en)
        for loc in (pt, en):
            rows.append('  <url>')
            rows.append(f'    <loc>{loc}</loc>')
            if mod:
                rows.append(f'    <lastmod>{mod}</lastmod>')
            rows.append(f'    <xhtml:link rel="alternate" hreflang="pt-BR" href="{pt}"/>')
            rows.append(f'    <xhtml:link rel="alternate" hreflang="en" href="{en}"/>')
            rows.append(f'    <xhtml:link rel="alternate" hreflang="x-default" href="{pt}"/>')
            rows.append('  </url>')
    rows.append('</urlset>')
    return '\n'.join(rows) + '\n'


def main():
    check = '--check' in sys.argv
    en_dict, typed_en = load_dict()
    en_desc = descriptions()
    pages = source_pages()
    expected = {f'en/{p}': transform(p, en_dict, typed_en, en_desc) for p in pages}
    expected['sitemap.xml'] = sitemap(pages)

    stale = []
    for rel, content in expected.items():
        path = ROOT / rel
        if not path.exists() or path.read_text() != content:
            stale.append(rel)
            if not check:
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(content)
    orphans = [str(p.relative_to(ROOT)) for p in (ROOT / 'en').rglob('*.html')
               if str(p.relative_to(ROOT)) not in expected] if (ROOT / 'en').exists() else []
    if not check:
        for o in orphans:
            (ROOT / o).unlink()

    if check:
        if stale or orphans:
            print('Versão EN desatualizada. Rode: python3 scripts/build_en.py')
            for s in stale + orphans:
                print('  -', s)
            sys.exit(1)
        print(f'OK: {len(pages)} páginas EN em dia.')
    else:
        print(f'{len(pages)} páginas; {len(stale)} atualizadas; {len(orphans)} removidas.')


if __name__ == '__main__':
    main()
