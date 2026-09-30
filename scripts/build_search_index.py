#!/usr/bin/env python3
"""Gera assets/search-index.json para a busca global (search.html).

Varre as páginas PT versionadas no git e extrai, para "pt" e "en":
título, descrição, headings (h2/h3) e um trecho do corpo normalizado.

Uso:
  python3 scripts/build_search_index.py          # (re)gera o índice
  python3 scripts/build_search_index.py --check  # sai 1 se o índice versionado estiver desatualizado
"""
import copy
import json
import re
import subprocess
import sys
from pathlib import Path

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "search-index.json"
BODY_MAX = 1500

EXCLUDE_FILES = {"404.html", "obrigado.html", "analytics.html", "moderacao.html", "search.html"}
EXCLUDE_DIRS = ("assets/", "en/")

SECTIONS = {
    "blog": ("blog", "Blog", "Blog"),
    "backend": ("backend", "Back-end", "Back-end"),
    "frontend": ("frontend", "Front-end", "Front-end"),
    "devops": ("devops", "DevOps", "DevOps"),
    "dados": ("dados", "Dados", "Data"),
    "mobile": ("mobile", "Mobile", "Mobile"),
}
PAGE_SECTION = ("page", "Página", "Page")

LEVELS = {"junior": ("Júnior", "Junior"), "pleno": ("Pleno", "Mid-level"), "senior": ("Sênior", "Senior")}

# Elementos que não fazem parte do conteúdo pesquisável
DROP_SELECTORS = [
    "script", "style", "noscript", "template", "nav", "header", "footer", "form",
    "pre", "code", "iframe", "svg", "button", "input", "textarea", "select",
    ".breadcrumbs", ".post-related", ".post-back", ".post-meta", ".post-tags",
    ".back-to-top", ".mobile-nav-toggle", ".portfolio-flters", "#portfolio-flters",
    ".blog-toolbar", ".blog-no-results", ".rss-link", ".post-card-foot",
]


def list_pages():
    out = subprocess.run(["git", "ls-files", "*.html"], cwd=ROOT, capture_output=True, text=True, check=True).stdout
    pages = []
    for p in out.split():
        if p in EXCLUDE_FILES or p.startswith(EXCLUDE_DIRS):
            continue
        pages.append(p)
    return sorted(pages)


def norm_space(s):
    return re.sub(r"\s+", " ", s or "").strip()


def clean_title(t):
    t = norm_space(t)
    t = re.sub(r"\s+[-—–]\s+Diogo Gomes(?=\s*($|\|))", "", t)
    return t.strip(" |")


def load_i18n_dict():
    """Lê o dicionário EN compartilhado (data-i18n="chave") de assets/js/i18n.js."""
    js = (ROOT / "assets" / "js" / "i18n.js").read_text(encoding="utf-8")
    m = re.search(r"var EN = \{(.*?)\n\s*\};", js, re.S)
    if not m:
        return {}
    pairs = re.findall(r"'([\w.-]+)'\s*:\s*(?:'((?:[^'\\]|\\.)*)'|\"((?:[^\"\\]|\\.)*)\")", m.group(1))
    return {k: (a or b).replace("\\'", "'").replace('\\"', '"') for k, a, b in pairs}


I18N_EN = load_i18n_dict()


def localize(el, lang):
    """Devolve uma cópia de `el` renderizada no idioma `lang` (como o i18n.js faria)."""
    el = copy.copy(el)
    other = "en" if lang == "pt" else "pt"
    for x in el.select(f'[data-lang="{other}"]'):
        x.decompose()
    if lang == "en":
        nodes = [el] if (el.has_attr("data-en") or el.has_attr("data-i18n")) else []
        nodes += el.select("[data-en], [data-i18n]")
        for x in nodes:
            val = x.get("data-en")
            if val is None:
                val = I18N_EN.get(x.get("data-i18n"))
            if val is None:
                continue
            x.clear()
            frag = BeautifulSoup(val, "html.parser")
            for c in list(frag.contents):
                x.append(c)
    return el


def text_of(el):
    if el is None:
        return ""
    return norm_space(el.get_text(" "))


def truncate(s, n):
    if len(s) <= n:
        return s
    cut = s[:n]
    sp = cut.rfind(" ")
    return cut[: sp if sp > n * 0.8 else n]


def section_of(path):
    first = path.split("/", 1)[0] if "/" in path else ""
    return SECTIONS.get(first, PAGE_SECTION)


def level_of(text):
    t = text.lower()
    for key, (pt, en) in LEVELS.items():
        if pt.lower() in t or en.lower() in t:
            return key
    return None


def load(path):
    return BeautifulSoup((ROOT / path).read_text(encoding="utf-8"), "html.parser")


def card_descriptions(pages):
    """Mapeia url -> {pt, en, level} a partir dos cards dos índices de seção."""
    cards = {}
    for p in pages:
        if not p.endswith("/index.html"):
            continue
        base = p.rsplit("/", 1)[0]
        soup = load(p)
        for card in soup.select(".post-card"):
            a = card.select_one("h3 a[href]")
            desc = card.select_one(".post-card-body p")
            if not a or not desc:
                continue
            href = a["href"].split("#")[0]
            if "/" in href or not href.endswith(".html"):
                continue
            url = f"{base}/{href}"
            cat = card.select_one(".post-cat")
            cards[url] = {
                "pt": text_of(localize(desc, "pt")),
                "en": text_of(localize(desc, "en")),
                "level": level_of(text_of(cat)) if cat and base != "blog" else None,
            }
    return cards


def extract(path, cards):
    soup = load(path)
    html = soup.find("html")
    sec_key, sec_pt, sec_en = section_of(path)

    main = soup.find("main") or soup.body
    main = copy.copy(main)
    for sel in DROP_SELECTORS:
        for x in main.select(sel):
            x.decompose()

    hero = soup.select_one(".post-hero")
    h1 = hero.find("h1") if hero else None
    level = None
    if sec_key not in ("blog", "page"):
        cat = hero.select_one(".post-cat") if hero else None
        if cat and "·" in text_of(cat):
            level = level_of(text_of(cat).split("·", 1)[1])
        if not level and path in cards:
            level = cards[path]["level"]

    body_root = main.select_one(".post-body") or main
    title_tag = soup.find("title")

    entry = {"url": path, "section": sec_key}
    if level:
        entry["level"] = level
    for lang in ("pt", "en"):
        if h1 is not None:
            title = text_of(localize(h1, lang))
        elif lang == "en" and html is not None and html.get("data-title-en"):
            title = html["data-title-en"]
        else:
            title = title_tag.get_text() if title_tag else path
        title = clean_title(title)

        root = localize(body_root, lang)
        headings = []
        for h in root.find_all(["h2", "h3"]):
            t = text_of(h)
            if t and t not in headings and t != title:
                headings.append(t)

        if path in cards and cards[path][lang]:
            desc = cards[path][lang]
        else:
            desc = ""
            for p in root.find_all("p"):
                t = text_of(p)
                if len(t) >= 60:
                    desc = t
                    break
        desc = truncate(desc, 300)

        body = truncate(text_of(root), BODY_MAX)
        data = {
            "title": title,
            "section": sec_pt if lang == "pt" else sec_en,
        }
        if level:
            data["level"] = LEVELS[level][0 if lang == "pt" else 1]
        data.update({"description": desc, "headings": headings, "body": body})
        entry[lang] = data
    return entry


def build():
    pages = list_pages()
    cards = card_descriptions(pages)
    entries = [extract(p, cards) for p in pages]
    doc = {"version": 1, "pages": entries}
    return json.dumps(doc, ensure_ascii=False, separators=(",", ":"), sort_keys=False) + "\n"


def main():
    out = build()
    if "--check" in sys.argv[1:]:
        current = OUT.read_text(encoding="utf-8") if OUT.exists() else ""
        if current != out:
            print(f"{OUT.relative_to(ROOT)} está desatualizado. Rode: python3 scripts/build_search_index.py", file=sys.stderr)
            sys.exit(1)
        print(f"{OUT.relative_to(ROOT)} OK")
        return
    OUT.write_text(out, encoding="utf-8")
    n = json.loads(out)["pages"]
    print(f"{OUT.relative_to(ROOT)}: {len(n)} páginas, {len(out.encode())} bytes")


if __name__ == "__main__":
    main()
