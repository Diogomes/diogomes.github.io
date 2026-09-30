/**
 * i18n — PT (padrão no HTML) / EN
 * Carregado em todas as páginas antes do main.js. O <head> de cada página já
 * define <html lang="en"> cedo (antes do render) quando o visitante escolheu inglês.
 */
(function () {
  "use strict";
  var EN = {
    'nav.home': 'Home', 'nav.about': 'About', 'nav.resume': 'Resume', 'nav.skills': 'Skills',
    'nav.portfolio': 'Portfolio', 'nav.contact': 'Contact', 'nav.projects': 'Projects',
    'nav.game': 'Game', 'nav.blog': 'Blog',
    'nav.backend': 'Back-end', 'nav.frontend': 'Front-end', 'nav.devops': 'DevOps',
    'nav.dados': 'Data', 'nav.mobile': 'Mobile', 'nav.tracks': 'Tracks', 'nav.search': 'Search',
    'hero.iam': "I'm",
    'about.h2': 'About',
    'about.intro': 'I like technology and how it can help us solve problems.',
    'about.h3': 'Quality Engineer & Developer',
    'about.lead': 'Ensuring product quality from the standpoint of code accessibility and value generation for the customer.',
    'about.role.l': 'Role:', 'about.role.v': 'Quality Engineer @ Liferay',
    'about.site.l': 'Website:', 'about.city.l': 'City:', 'about.city.v': 'Recife, Pernambuco',
    'about.edu.l': 'Education:', 'about.edu.v': "CS · Master's",
    'about.email.l': 'E-mail:', 'about.focus.l': 'Focus:', 'about.focus.v': 'QA · Automation · Game Dev',
    'skills.h2': 'Skills',
    'skills.intro': 'Experience in end-to-end test automation in Java, JavaScript and Python, with BDD/TDD/ATDD and CI/CD. Below are the main tools and technologies I use.',
    'resume.h2': 'Resume',
    'resume.intro': 'Quality Engineer at Liferay for 5+ years, working on LATAM/EMEA-scale projects — from planning and running manual and automated tests to mentoring QAs. End-to-end automation with Selenium, Playwright, Cypress and Appium (Java, JavaScript, Python), aligned with BDD, TDD, ATDD and Scrum. A scientific background (MSc in Biomedical Engineering) brings a rigorous, investigative way of thinking about quality. Currently deepening functional programming and game development in personal projects.',
    'portfolio.h2': 'Portfolio',
    'portfolio.intro': "A selection of projects, games and tutorials I've produced. Click play to watch each item's video.",
    'tracks.h2': 'Study tracks',
    'tracks.intro': 'Blogs by field and seniority level — what to understand at each stage of your career, for technical interviews and day-to-day work.',
    'assess.title': 'Self-assessment: where are you?',
    'assess.intro': 'Check what you already master. Your progress is saved in this browser only.',
    'assess.reset': 'Reset',
    'contact.h2': 'Contact', 'contact.location': 'Location:', 'contact.email': 'Email:', 'contact.call': 'Call:',
    'footer.credits': 'Designed by'
  };
  // Mecanismos (ver também o CSS de [data-lang]):
  //   data-i18n="chave"      → texto compartilhado, vem do dicionário EN acima
  //   data-en="texto"        → tradução inline do conteúdo (innerHTML) do elemento
  //   data-en-ATRIBUTO="..." → tradução de um atributo (alt, title, placeholder, aria-label, content...)
  //   data-lang="pt|en"      → blocos alternativos; o CSS esconde o do idioma inativo
  //   <html data-title-en>   → título da aba em inglês
  var nodes = [].slice.call(document.querySelectorAll('[data-i18n], [data-en]'));
  nodes.forEach(function (el) { el.setAttribute('data-pt', el.innerHTML); });
  var attrNodes = [].slice.call(document.querySelectorAll('*')).filter(function (el) {
    return [].some.call(el.attributes, function (a) { return a.name.indexOf('data-en-') === 0; });
  });
  attrNodes.forEach(function (el) {
    [].slice.call(el.attributes).forEach(function (a) {
      if (a.name.indexOf('data-en-') !== 0) return;
      var attr = a.name.slice(8);
      el.setAttribute('data-pt-' + attr, el.getAttribute(attr) || '');
    });
  });
  var root = document.documentElement;
  var titlePt = document.title;
  var TYPED_EN = 'Quality Engineer, Developer, Game Dev, Teacher';
  var typedEl = document.querySelector('.typed');
  var typedPt = typedEl ? typedEl.getAttribute('data-typed-items') : null;
  if (typedEl && typedEl.hasAttribute('data-en-data-typed-items')) TYPED_EN = typedEl.getAttribute('data-en-data-typed-items');
  function apply(lang) {
    var en = lang === 'en';
    nodes.forEach(function (el) {
      var val = null;
      if (en) val = el.hasAttribute('data-en') ? el.getAttribute('data-en') : EN[el.getAttribute('data-i18n')];
      el.innerHTML = (val != null) ? val : el.getAttribute('data-pt');
    });
    attrNodes.forEach(function (el) {
      [].slice.call(el.attributes).forEach(function (a) {
        if (a.name.indexOf('data-en-') !== 0) return;
        var attr = a.name.slice(8);
        if (attr === 'data-typed-items') return;
        el.setAttribute(attr, en ? a.value : el.getAttribute('data-pt-' + attr));
      });
    });
    if (typedEl) {
      typedEl.setAttribute('data-typed-items', en ? TYPED_EN : typedPt);
      if (window.__initTyped) window.__initTyped();
    }
    document.title = (en && root.getAttribute('data-title-en')) || titlePt;
    root.setAttribute('lang', en ? 'en' : 'pt-br');
    window.DG_LANG = en ? 'en' : 'pt';
    document.dispatchEvent(new CustomEvent('dg:lang', { detail: window.DG_LANG }));
  }
  // Páginas geradas em /en/ já vêm traduzidas (html[data-static-lang]); o idioma é o da página
  var lang = 'pt';
  try { lang = localStorage.getItem('dg-lang') || 'pt'; } catch (e) {}
  if (root.hasAttribute('data-static-lang')) lang = root.getAttribute('lang') === 'en' ? 'en' : 'pt';
  window.DG_LANG = lang;
  window.dgT = function (pt, en) { return window.DG_LANG === 'en' ? en : pt; };
  if (lang === 'en') apply('en');

  var btn = document.createElement('button');
  btn.className = 'lang-toggle';
  btn.type = 'button';
  function setLabel() {
    btn.textContent = (lang === 'en') ? 'PT' : 'EN';
    var label = (lang === 'en') ? 'Mudar para português' : 'Switch to English';
    btn.setAttribute('aria-label', label);
    btn.title = label;
  }
  setLabel();
  btn.addEventListener('click', function () {
    lang = (lang === 'en') ? 'pt' : 'en';
    try { localStorage.setItem('dg-lang', lang); } catch (e) {}
    // Páginas com versão estática no outro idioma (/en/...): navega até ela
    var alt = document.querySelector('link[rel="alternate"][hreflang="' + (lang === 'en' ? 'en' : 'pt-BR') + '"]');
    if (alt) {
      var u = new URL(alt.href);
      location.href = u.pathname + location.search + location.hash;
      return;
    }
    apply(lang); setLabel();
  });
  document.body.appendChild(btn);
})();
