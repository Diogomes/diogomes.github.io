/**
 * Busca global do site (search.html).
 * Índice gerado por scripts/build_search_index.py -> /assets/search-index.json
 */
(function () {
  "use strict";

  var input = document.getElementById('ss-input');
  var form = document.getElementById('ss-form');
  var filtersEl = document.getElementById('ss-filters');
  var countEl = document.getElementById('ss-count');
  var resultsEl = document.getElementById('ss-results');
  var emptyEl = document.getElementById('ss-empty');
  var emptyText = document.getElementById('ss-empty-text');
  if (!input || !resultsEl) return;

  var SECTION_ORDER = ['blog', 'backend', 'frontend', 'devops', 'dados', 'mobile', 'page'];
  var SECTION_ICON = {
    blog: 'bx-notepad', backend: 'bx-server', frontend: 'bx-code-alt', devops: 'bx-infinite',
    dados: 'bx-data', mobile: 'bx-mobile-alt', page: 'bx-file'
  };
  var UI = {
    pt: {
      all: 'Todos',
      loading: 'Carregando índice…',
      error: 'Não foi possível carregar o índice de busca.',
      hint: function (n) { return 'Digite para buscar em ' + n + ' páginas.'; },
      count: function (n) { return n === 1 ? '1 resultado' : n + ' resultados'; },
      none: function (q) { return 'Nenhum resultado para “' + q + '”. Tente outros termos ou remova o filtro.'; },
      sections: { blog: 'Blog', backend: 'Back-end', frontend: 'Front-end', devops: 'DevOps', dados: 'Dados', mobile: 'Mobile', page: 'Página' }
    },
    en: {
      all: 'All',
      loading: 'Loading index…',
      error: 'Could not load the search index.',
      hint: function (n) { return 'Type to search across ' + n + ' pages.'; },
      count: function (n) { return n === 1 ? '1 result' : n + ' results'; },
      none: function (q) { return 'No results for “' + q + '”. Try other terms or clear the filter.'; },
      sections: { blog: 'Blog', backend: 'Back-end', frontend: 'Front-end', devops: 'DevOps', dados: 'Data', mobile: 'Mobile', page: 'Page' }
    }
  };

  var pages = null;       // entradas do índice
  var prepared = {};      // cache por idioma: [{p, t, h, d, b}] normalizados
  var section = 'all';
  var timer = null;

  function lang() { return document.documentElement.lang === 'en' ? 'en' : 'pt'; }
  function ui() { return UI[lang()]; }

  function strip(s) {
    return s.normalize ? s.normalize('NFD').replace(/[̀-ͯ]/g, '') : s;
  }
  function norm(s) { return strip(String(s || '').toLowerCase()); }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* Normaliza mantendo o mapa de posições normalizadas -> originais (para destacar no texto original). */
  function normMap(s) {
    var out = '', map = [];
    for (var i = 0; i < s.length; i++) {
      var n = norm(s[i]);
      for (var k = 0; k < n.length; k++) { out += n[k]; map.push(i); }
    }
    map.push(s.length);
    return { text: out, map: map };
  }

  /* Intervalos [ini, fim) no texto original onde algum termo aparece. */
  function ranges(s, terms) {
    var nm = normMap(s), out = [];
    terms.forEach(function (t) {
      var from = 0, idx;
      while ((idx = nm.text.indexOf(t, from)) !== -1) {
        out.push([nm.map[idx], nm.map[idx + t.length - 1] + 1]);
        from = idx + t.length;
      }
    });
    out.sort(function (a, b) { return a[0] - b[0] || b[1] - a[1]; });
    var merged = [];
    out.forEach(function (r) {
      var last = merged[merged.length - 1];
      if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
      else merged.push(r.slice());
    });
    return merged;
  }

  function highlight(s, terms) {
    var rs = ranges(s, terms), html = '', pos = 0;
    rs.forEach(function (r) {
      html += esc(s.slice(pos, r[0])) + '<mark>' + esc(s.slice(r[0], r[1])) + '</mark>';
      pos = r[1];
    });
    return html + esc(s.slice(pos));
  }

  function snippet(entry, terms) {
    var sources = [entry.description, entry.body].concat(entry.headings || []);
    var LEN = 220;
    for (var i = 0; i < sources.length; i++) {
      var s = sources[i] || '';
      var rs = ranges(s, terms);
      if (!rs.length) continue;
      if (s.length <= LEN) return highlight(s, terms);
      var start = Math.max(0, rs[0][0] - 70);
      if (start > 0) {
        var sp = s.indexOf(' ', start);
        if (sp !== -1 && sp < rs[0][0]) start = sp + 1;
      }
      var end = Math.min(s.length, start + LEN);
      var sp2 = s.lastIndexOf(' ', end);
      if (end < s.length && sp2 > rs[0][1]) end = sp2;
      return (start > 0 ? '… ' : '') + highlight(s.slice(start, end), terms) + (end < s.length ? ' …' : '');
    }
    var d = entry.description || entry.body || '';
    return esc(d.length > LEN ? d.slice(0, LEN) + ' …' : d);
  }

  function prepare(l) {
    if (prepared[l]) return prepared[l];
    prepared[l] = pages.map(function (p) {
      var e = p[l];
      return {
        p: p,
        t: norm(e.title),
        h: norm((e.headings || []).join(' • ')),
        d: norm(e.description),
        b: norm(e.body)
      };
    });
    return prepared[l];
  }

  function tokens(q) {
    var seen = {};
    return norm(q).split(/[\s,;]+/).map(function (t) {
      return t.replace(/^[^\w]+|[^\w]+$/g, '') || t;
    }).filter(function (t) {
      if (!t || seen[t]) return false;
      seen[t] = true;
      return true;
    });
  }

  function wordStart(hay, t) {
    var i = hay.indexOf(t);
    while (i !== -1) {
      if (i === 0 || /[^a-z0-9]/.test(hay[i - 1])) return true;
      i = hay.indexOf(t, i + 1);
    }
    return false;
  }

  function search(q) {
    var terms = tokens(q);
    if (!terms.length) return { terms: terms, hits: [] };
    var nq = norm(q).trim();
    var hits = [];
    prepare(lang()).forEach(function (x, i) {
      var score = 0;
      for (var k = 0; k < terms.length; k++) {
        var t = terms[k], s = 0;
        if (x.t.indexOf(t) !== -1) s += wordStart(x.t, t) ? 14 : 10;
        if (x.h.indexOf(t) !== -1) s += wordStart(x.h, t) ? 7 : 5;
        if (x.d.indexOf(t) !== -1) s += 3;
        if (x.b.indexOf(t) !== -1) s += 1 + Math.min(2, (x.b.split(t).length - 2) * 0.25);
        if (!s) return; // AND: todos os termos precisam aparecer
        score += s;
      }
      if (terms.length > 1 && x.t.indexOf(nq) !== -1) score += 10;
      if (x.p.section === 'page' || /(^|\/)index\.html$/.test(x.p.url)) score -= 0.5;
      hits.push({ p: x.p, score: score, i: i });
    });
    hits.sort(function (a, b) { return b.score - a.score || a.i - b.i; });
    return { terms: terms, hits: hits };
  }

  function href(url) {
    return (lang() === 'en' ? '/en/' : '/') + url;
  }

  function renderFilters(hits, hasQuery) {
    var counts = {};
    hits.forEach(function (h) { counts[h.p.section] = (counts[h.p.section] || 0) + 1; });
    var u = ui();
    var items = [['all', u.all, hits.length]].concat(SECTION_ORDER.filter(function (s) {
      return pages.some(function (p) { return p.section === s; });
    }).map(function (s) { return [s, u.sections[s], counts[s] || 0]; }));
    filtersEl.innerHTML = items.map(function (it) {
      var active = it[0] === section;
      return '<button type="button" class="ss-chip' + (active ? ' active' : '') + '" data-section="' + it[0] + '" aria-pressed="' + active + '"' +
        (hasQuery && !it[2] && !active ? ' disabled' : '') + '>' +
        (it[0] !== 'all' ? '<i class="bx ' + SECTION_ICON[it[0]] + '" aria-hidden="true"></i> ' : '') + esc(it[1]) +
        (hasQuery ? ' <span class="ss-chip-n">' + it[2] + '</span>' : '') + '</button>';
    }).join('');
  }

  function render() {
    if (!pages) return;
    var q = input.value;
    var res = search(q);
    var hasQuery = res.terms.length > 0;
    var hits = res.hits;
    renderFilters(hits, hasQuery);
    if (section !== 'all') hits = hits.filter(function (h) { return h.p.section === section; });
    var u = ui(), l = lang();

    if (!hasQuery) {
      countEl.textContent = u.hint(pages.length);
      resultsEl.innerHTML = '';
      emptyEl.hidden = true;
      return;
    }
    countEl.textContent = u.count(hits.length);
    if (!hits.length) {
      resultsEl.innerHTML = '';
      emptyText.textContent = u.none(q.trim());
      emptyEl.hidden = false;
      return;
    }
    emptyEl.hidden = true;
    resultsEl.innerHTML = hits.map(function (h) {
      var e = h.p[l];
      var meta = '<span class="ss-sec ss-sec-' + h.p.section + '"><i class="bx ' + SECTION_ICON[h.p.section] + '" aria-hidden="true"></i> ' + esc(e.section) + '</span>' +
        (e.level ? '<span class="ss-level ss-lvl-' + esc(h.p.level) + '">' + esc(e.level) + '</span>' : '') +
        '<span class="ss-url">' + esc((l === 'en' ? '/en/' : '/') + h.p.url) + '</span>';
      return '<li class="ss-result"><a href="' + esc(href(h.p.url)) + '">' +
        '<div class="ss-meta">' + meta + '</div>' +
        '<h3 class="ss-title">' + highlight(e.title, res.terms) + '</h3>' +
        '<p class="ss-snippet">' + snippet(e, res.terms) + '</p>' +
        '</a></li>';
    }).join('');
  }

  function syncUrl() {
    try {
      var url = new URL(location.href);
      var q = input.value.trim();
      if (q) url.searchParams.set('q', q); else url.searchParams.delete('q');
      if (section !== 'all') url.searchParams.set('s', section); else url.searchParams.delete('s');
      history.replaceState(null, '', url.pathname + url.search + url.hash);
    } catch (e) {}
  }

  function update() {
    render();
    syncUrl();
  }

  input.addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(update, 150);
  });
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    clearTimeout(timer);
    update();
    input.blur();
  });
  filtersEl.addEventListener('click', function (ev) {
    var b = ev.target.closest('.ss-chip');
    if (!b || b.disabled) return;
    section = b.getAttribute('data-section');
    update();
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.key !== '/' || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    var t = ev.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    ev.preventDefault();
    input.focus();
    input.select();
  });
  document.addEventListener('dg:lang', render);

  // Estado inicial a partir da URL
  try {
    var params = new URLSearchParams(location.search);
    if (params.get('q')) input.value = params.get('q');
    var s = params.get('s');
    if (s && SECTION_ORDER.indexOf(s) !== -1) section = s;
  } catch (e) {}

  countEl.textContent = ui().loading;
  fetch('/assets/search-index.json')
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (data) {
      pages = data.pages || [];
      render();
      if (!input.value && window.matchMedia && matchMedia('(pointer: fine)').matches) input.focus({ preventScroll: true });
    })
    .catch(function () {
      countEl.textContent = ui().error;
    });
})();
