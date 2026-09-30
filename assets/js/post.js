/**
 * post.js — UX de leitura dos artigos
 *  - barra de progresso de leitura (fixa no topo)
 *  - sumário gerado dos h2/h3 do bloco de idioma visível (sidebar sticky >= 1200px,
 *    <details> colapsável no topo do artigo em telas menores) com destaque da seção atual
 *  - botão "Copiar" em cada <pre>
 * Textos de UI conforme document.documentElement.lang ('en' ou 'pt-br').
 */
(function () {
  "use strict";

  var body = document.querySelector('.post-body') || document.querySelector('.portfolio-description');
  if (!body) return;

  var root = document.documentElement;
  var TXT = {
    pt: { toc: 'Neste artigo', copy: 'Copiar', copied: 'Copiado!', failed: 'Erro ao copiar', copyLabel: 'Copiar código', copiedMsg: 'Código copiado para a área de transferência', progress: 'Progresso de leitura' },
    en: { toc: 'On this page', copy: 'Copy', copied: 'Copied!', failed: 'Copy failed', copyLabel: 'Copy code', copiedMsg: 'Code copied to clipboard', progress: 'Reading progress' }
  };
  function isEn() { return root.lang === 'en'; }
  function t(key) { return TXT[isEn() ? 'en' : 'pt'][key]; }
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Região live para leitores de tela ---------- */
  var live = document.createElement('div');
  live.className = 'post-sr-only';
  live.setAttribute('role', 'status');
  live.setAttribute('aria-live', 'polite');
  document.body.appendChild(live);
  function announce(msg) {
    live.textContent = '';
    setTimeout(function () { live.textContent = msg; }, 50);
  }

  /* ---------- Blocos de idioma ---------- */
  function blocks() {
    var list = [].filter.call(body.children, function (el) { return el.hasAttribute('data-lang'); });
    return list.length ? list : [body];
  }
  function activeBlock() {
    var list = blocks();
    var want = isEn() ? 'en' : 'pt';
    for (var i = 0; i < list.length; i++) if (list[i].getAttribute('data-lang') === want) return list[i];
    for (var j = 0; j < list.length; j++) if (list[j].offsetParent !== null) return list[j];
    return list[0];
  }
  function headingsOf(block) {
    return [].filter.call(block.querySelectorAll('h2, h3'), function (h) {
      return !h.closest('.post-related, .post-toc') && h.textContent.trim();
    });
  }

  /* ---------- Ids para headings ---------- */
  function slugify(s) {
    return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'secao';
  }
  blocks().forEach(function (block) {
    var suffix = block.getAttribute('data-lang') === 'en' ? '-en' : '';
    headingsOf(block).forEach(function (h) {
      if (h.id) return;
      var base = slugify(h.textContent) + suffix, id = base, n = 2;
      while (document.getElementById(id)) id = base + '-' + (n++);
      h.id = id;
    });
  });

  /* ---------- Barra de progresso ---------- */
  var bar = document.createElement('div');
  bar.className = 'post-progress';
  bar.setAttribute('role', 'progressbar');
  bar.setAttribute('aria-valuemin', '0');
  bar.setAttribute('aria-valuemax', '100');
  bar.innerHTML = '<span class="post-progress-fill"></span>';
  var fill = bar.firstChild;
  document.body.appendChild(bar);

  var ticking = false;
  function updateProgress() {
    ticking = false;
    var r = body.getBoundingClientRect();
    var start = r.top + window.scrollY;
    var total = r.height - window.innerHeight * 0.6;
    var p;
    if (total <= 0) {
      var docMax = document.documentElement.scrollHeight - window.innerHeight;
      p = docMax > 0 ? window.scrollY / docMax : 1;
    } else {
      p = (window.scrollY - start + window.innerHeight * 0.25) / total;
    }
    p = Math.max(0, Math.min(1, p));
    fill.style.transform = 'scaleX(' + p + ')';
    bar.setAttribute('aria-valuenow', String(Math.round(p * 100)));
  }
  function onScroll() {
    if (!ticking) { ticking = true; window.requestAnimationFrame(updateProgress); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  /* ---------- Sumário ---------- */
  var mq = window.matchMedia('(min-width: 1200px)');
  var col = body.closest('[class*="col-"]');
  var row = col && col.parentElement && col.parentElement.classList.contains('row') ? col.parentElement : null;
  var section = body.closest('section');
  var nav = null, details = null, aside = null, observer = null, links = [];

  function buildToc() {
    if (observer) { observer.disconnect(); observer = null; }
    if (nav) nav.remove();
    if (aside) { aside.remove(); aside = null; }
    if (row) { row.classList.remove('post-has-toc'); col.classList.remove('post-main-col'); }
    if (section) section.classList.remove('post-toc-section');
    nav = null; links = [];

    var heads = headingsOf(activeBlock());
    if (heads.length < 3) return;

    nav = document.createElement('nav');
    nav.className = 'post-toc';
    nav.setAttribute('aria-label', t('toc'));
    details = document.createElement('details');
    var summary = document.createElement('summary');
    summary.className = 'post-toc-title';
    summary.innerHTML = '<i class="bx bx-list-ul" aria-hidden="true"></i> <span></span>';
    summary.lastChild.textContent = t('toc');
    var ol = document.createElement('ol');
    ol.className = 'post-toc-list';
    heads.forEach(function (h) {
      var li = document.createElement('li');
      li.className = 'post-toc-' + h.tagName.toLowerCase();
      var a = document.createElement('a');
      a.href = '#' + h.id;
      a.textContent = h.textContent.trim();
      a.addEventListener('click', function () {
        if (!mq.matches) details.open = false;
        setActive(a);
      });
      li.appendChild(a);
      ol.appendChild(li);
      links.push(a);
    });
    details.appendChild(summary);
    details.appendChild(ol);
    nav.appendChild(details);
    place();
    observe(heads);
  }

  function place() {
    if (!nav) return;
    if (mq.matches && row) {
      if (!aside) {
        aside = document.createElement('aside');
        aside.className = 'post-toc-aside';
        col.insertAdjacentElement('afterend', aside);
      }
      row.classList.add('post-has-toc');
      col.classList.add('post-main-col');
      if (section) section.classList.add('post-toc-section');
      aside.appendChild(nav);
      details.open = true;
    } else {
      if (aside) { aside.remove(); aside = null; }
      if (row) { row.classList.remove('post-has-toc'); col.classList.remove('post-main-col'); }
      if (section) section.classList.remove('post-toc-section');
      body.parentNode.insertBefore(nav, body);
      details.open = false;
    }
  }

  function setActive(a) {
    links.forEach(function (l) {
      if (l === a) l.setAttribute('aria-current', 'true');
      else l.removeAttribute('aria-current');
    });
    if (a && mq.matches && aside) {
      var box = nav.querySelector('.post-toc-list');
      var top = a.offsetTop, h = a.offsetHeight;
      if (top < box.scrollTop || top + h > box.scrollTop + box.clientHeight) {
        box.scrollTop = top - box.clientHeight / 2;
      }
    }
  }

  function observe(heads) {
    if (!('IntersectionObserver' in window)) return;
    var byId = {};
    links.forEach(function (l) { byId[l.hash.slice(1)] = l; });
    var visible = new Set();
    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var idx = heads.indexOf(e.target);
        if (e.isIntersecting) {
          visible.add(idx);
        } else {
          visible.delete(idx);
          // saiu pela parte de baixo da faixa (rolando para cima): a seção anterior volta a ser a atual
          var cur = links.indexOf(nav && nav.querySelector('[aria-current]'));
          if (e.rootBounds && e.boundingClientRect.top > e.rootBounds.bottom && cur === idx && idx > 0) {
            setActive(links[idx - 1]);
          }
        }
      });
      if (visible.size) setActive(links[Math.min.apply(null, Array.from(visible))]);
    }, { rootMargin: '0px 0px -65% 0px', threshold: 0 });
    heads.forEach(function (h) { observer.observe(h); });
    // estado inicial
    var initial = null;
    heads.forEach(function (h) { if (h.getBoundingClientRect().top < 120) initial = byId[h.id]; });
    setActive(initial || links[0]);
  }

  var onMq = function () { place(); onScroll(); };
  if (mq.addEventListener) mq.addEventListener('change', onMq); else mq.addListener(onMq);

  /* ---------- Botão copiar ---------- */
  var copyBtns = [];
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
      ok ? resolve() : reject(new Error('copy failed'));
    });
  }
  function labelBtn(btn) {
    btn.querySelector('span').textContent = t(btn._state || 'copy');
    btn.setAttribute('aria-label', btn._state === 'copied' ? t('copied') : t('copyLabel'));
  }
  [].forEach.call(body.querySelectorAll('pre'), function (pre) {
    if (pre.parentNode.classList.contains('post-code')) return;
    var wrap = document.createElement('div');
    wrap.className = 'post-code';
    pre.parentNode.insertBefore(wrap, pre);
    wrap.appendChild(pre);
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'post-copy';
    btn.innerHTML = '<i class="bx bx-copy" aria-hidden="true"></i><span></span>';
    labelBtn(btn);
    var timer;
    btn.addEventListener('click', function () {
      var code = pre.querySelector('code') || pre;
      copyText(code.innerText.replace(/\n$/, '')).then(function () {
        btn._state = 'copied';
        btn.classList.add('is-copied');
        btn.querySelector('i').className = 'bx bx-check';
        announce(t('copiedMsg'));
      }, function () {
        btn._state = 'failed';
        announce(t('failed'));
      }).then(function () {
        labelBtn(btn);
        clearTimeout(timer);
        timer = setTimeout(function () {
          btn._state = null;
          btn.classList.remove('is-copied');
          btn.querySelector('i').className = 'bx bx-copy';
          labelBtn(btn);
        }, 2000);
      });
    });
    wrap.appendChild(btn);
    copyBtns.push(btn);
  });

  /* ---------- Idioma ---------- */
  function applyLang() {
    bar.setAttribute('aria-label', t('progress'));
    copyBtns.forEach(labelBtn);
    buildToc();
    onScroll();
  }
  document.addEventListener('dg:lang', applyLang);
  applyLang();
  window.addEventListener('load', onScroll);
  if (reduceMotion) bar.classList.add('no-motion');
})();
