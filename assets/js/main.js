/**
* Template Name: iPortfolio - v3.7.0
* Template URL: https://bootstrapmade.com/iportfolio-bootstrap-portfolio-websites-template/
* Author: BootstrapMade.com
* License: https://bootstrapmade.com/license/
*/
(function() {
  "use strict";

  /**
   * Tema claro/escuro — aplica o quanto antes (evita flash)
   */
  try {
    var savedTheme = localStorage.getItem('dg-theme');
    if (savedTheme === 'dark' ||
        (!savedTheme && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark-theme');
    }
  } catch (e) {}

  /**
   * PWA — manifesto + service worker (caminhos absolutos)
   */
  (function () {
    if (!document.querySelector('link[rel="manifest"]')) {
      var ml = document.createElement('link');
      ml.rel = 'manifest'; ml.href = '/manifest.json';
      document.head.appendChild(ml);
    }
    if (!document.querySelector('meta[name="theme-color"]')) {
      var tc = document.createElement('meta');
      tc.name = 'theme-color'; tc.content = '#149ddd';
      document.head.appendChild(tc);
    }
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('/sw.js').catch(function () {});
      });
    }
  })();

  /**
   * Botão flutuante de tema claro/escuro
   */
  (function () {
    var btn = document.createElement('button');
    btn.className = 'theme-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Alternar tema claro/escuro');
    btn.title = 'Alternar tema claro/escuro';
    function setIcon() {
      var dark = document.documentElement.classList.contains('dark-theme');
      btn.innerHTML = dark ? '<i class="bx bx-sun"></i>' : '<i class="bx bx-moon"></i>';
    }
    setIcon();
    btn.addEventListener('click', function () {
      var dark = document.documentElement.classList.toggle('dark-theme');
      try { localStorage.setItem('dg-theme', dark ? 'dark' : 'light'); } catch (e) {}
      setIcon();
    });
    document.body.appendChild(btn);
  })();

  /**
   * i18n — PT (padrão no HTML) / EN (dicionário)
   */
  (function () {
    var EN = {
      'nav.home': 'Home', 'nav.about': 'About', 'nav.resume': 'Resume', 'nav.skills': 'Skills',
      'nav.portfolio': 'Portfolio', 'nav.contact': 'Contact', 'nav.projects': 'Projects',
      'nav.game': 'Game', 'nav.blog': 'Blog',
      'nav.backend': 'Back-end', 'nav.frontend': 'Front-end', 'nav.devops': 'DevOps',
      'nav.dados': 'Data', 'nav.mobile': 'Mobile', 'nav.tracks': 'Tracks',
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
    var nodes = [].slice.call(document.querySelectorAll('[data-i18n]'));
    nodes.forEach(function (el) { el.setAttribute('data-pt', el.innerHTML); });
    var TYPED_EN = 'Quality Engineer, Developer, Game Dev, Teacher';
    var typedEl = document.querySelector('.typed');
    var typedPt = typedEl ? typedEl.getAttribute('data-typed-items') : null;
    function apply(lang) {
      nodes.forEach(function (el) {
        var k = el.getAttribute('data-i18n');
        if (lang === 'en' && EN[k] != null) el.innerHTML = EN[k];
        else el.innerHTML = el.getAttribute('data-pt');
      });
      if (typedEl) {
        typedEl.setAttribute('data-typed-items', lang === 'en' ? TYPED_EN : typedPt);
        if (window.__initTyped) window.__initTyped();
      }
      document.documentElement.setAttribute('lang', lang === 'en' ? 'en' : 'pt-br');
    }
    var lang = 'pt';
    try { lang = localStorage.getItem('dg-lang') || 'pt'; } catch (e) {}
    if (lang === 'en') apply('en');

    var btn = document.createElement('button');
    btn.className = 'lang-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Mudar idioma / change language');
    function setLabel() { btn.textContent = (lang === 'en') ? 'PT' : 'EN'; }
    setLabel();
    btn.addEventListener('click', function () {
      lang = (lang === 'en') ? 'pt' : 'en';
      try { localStorage.setItem('dg-lang', lang); } catch (e) {}
      apply(lang); setLabel();
    });
    document.body.appendChild(btn);
  })();

  /**
   * Autoavaliação por nível (checklist com progresso salvo no navegador)
   * Renderiza em qualquer página com <div data-self-assess data-track="...">.
   */
  (function () {
    var host = document.querySelector('[data-self-assess]');
    if (!host) return;
    var track = host.getAttribute('data-track');
    var LEVELS = [['junior', 'Júnior'], ['pleno', 'Pleno'], ['senior', 'Sênior']];
    var DATA = {
      backend: {
        junior: ['Explicar o ciclo request/response do HTTP', 'Diferenciar GET/POST/PUT/DELETE e status codes', 'Modelar tabelas e escrever JOINs em SQL', 'Entender o que é uma API REST', 'Saber o que é uma transação (ACID)'],
        pleno: ['Diferenciar autenticação de autorização (JWT/OAuth)', 'Identificar e resolver o problema N+1', 'Aplicar cache (cache-aside) e pensar na invalidação', 'Tratar erros, logs e configuração por ambiente', 'Escrever testes de unidade e integração'],
        senior: ['Escalar horizontalmente serviços stateless', 'Explicar o teorema CAP e consistência eventual', 'Projetar idempotência, retries e circuit breaker', 'Avaliar monolito vs microserviços', 'Pensar em observabilidade e SLOs']
      },
      frontend: {
        junior: ['Escrever HTML semântico e acessível', 'Dominar box model, flexbox e grid', 'Entender tipos, escopo e closures em JS', 'Manipular o DOM e eventos', 'Diferenciar == de ==='],
        pleno: ['Explicar o event loop (macro/microtasks)', 'Gerenciar estado e fluxo de dados unidirecional', 'Aplicar "lifting state up" e estado derivado', 'Entender reflow vs repaint', 'Otimizar a renderização de listas'],
        senior: ['Estruturar arquitetura de componentes e design system', 'Otimizar Core Web Vitals (LCP/CLS/INP)', 'Aplicar code splitting e lazy loading', 'Mitigar XSS e CSRF e entender CORS', 'Avaliar trade-offs de monorepo']
      },
      devops: {
        junior: ['Navegar no terminal Linux (permissões, processos, pipes)', 'Usar Git: branches, merge/rebase, resolver conflitos', 'Entender CI vs CD e um pipeline básico', 'Trabalhar com variáveis de ambiente', 'Ler e interpretar logs de build'],
        pleno: ['Criar imagens Docker e entender camadas', 'Provisionar com infraestrutura como código (Terraform)', 'Distinguir os 3 pilares de observabilidade', 'Configurar pipelines com estágios e artefatos', 'Diferenciar container de VM'],
        senior: ['Operar Kubernetes (pods, deployments, services)', 'Projetar alta disponibilidade (multi-AZ)', 'Aplicar least privilege e gestão de segredos', 'Levar segurança para o pipeline (shift-left)', 'Equilibrar custo e confiabilidade']
      },
      dados: {
        junior: ['Modelar tabelas, chaves e relacionamentos', 'Escrever agregações, GROUP BY e subqueries', 'Aplicar normalização (1FN/2FN/3FN)', 'Entender chave primária e estrangeira', 'Saber quando desnormalizar'],
        pleno: ['Usar índices e ler um plano de execução', 'Modelar fato/dimensão (star schema)', 'Construir pipelines ETL/ELT idempotentes', 'Diferenciar OLTP de OLAP', 'Garantir qualidade dos dados'],
        senior: ['Escolher o tipo certo de NoSQL', 'Aplicar particionamento e sharding', 'Projetar pipelines de streaming (Kafka)', 'Entender semânticas de entrega (exactly-once)', 'Escolher chave de partição evitando hotspots']
      },
      mobile: {
        junior: ['Entender o ciclo de vida do app e da tela', 'Implementar navegação (stack, tabs, deep links)', 'Fazer layout responsivo (dp, safe areas)', 'Salvar e restaurar estado de tela', 'Lidar com o botão voltar'],
        pleno: ['Escolher onde guardar estado e dados locais', 'Implementar offline-first e sincronização', 'Resolver conflitos de sincronização', 'Otimizar performance (60fps, listas)', 'Tratar bateria e rede como recursos finitos'],
        senior: ['Aplicar arquitetura testável (MVVM/MVI)', 'Implementar push notifications ponta a ponta', 'Publicar nas lojas (assinatura, review)', 'Versionar sem quebrar quem já instalou', 'Fazer rollout gradual']
      }
    };
    var data = DATA[track];
    if (!data) return;

    var KEY = 'dg-assess-' + track;
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { saved = {}; }

    var grid = host.querySelector('.self-assess-grid');
    var total = 0;
    LEVELS.forEach(function (lv) {
      var key = lv[0], items = data[key] || [];
      var col = document.createElement('div');
      col.className = 'self-assess-col lvl-' + key;
      var h = document.createElement('h4');
      h.textContent = lv[1];
      col.appendChild(h);
      items.forEach(function (text, i) {
        total++;
        var id = track + '-' + key + '-' + i;
        var lab = document.createElement('label');
        lab.className = 'self-assess-item';
        var cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.id = id;
        cb.checked = !!saved[id];
        cb.addEventListener('change', function () {
          if (cb.checked) saved[id] = 1; else delete saved[id];
          try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) {}
          update();
        });
        var span = document.createElement('span');
        span.textContent = text;
        lab.appendChild(cb);
        lab.appendChild(span);
        col.appendChild(lab);
      });
      grid.appendChild(col);
    });

    var barFill = host.querySelector('.self-assess-bar > span');
    var pctLabel = host.querySelector('.self-assess-pct');
    function update() {
      var done = Object.keys(saved).filter(function (k) { return saved[k]; }).length;
      var pct = total ? Math.round((done / total) * 100) : 0;
      if (barFill) barFill.style.width = pct + '%';
      if (pctLabel) pctLabel.textContent = done + '/' + total + ' · ' + pct + '%';
    }
    var resetBtn = host.querySelector('.self-assess-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        saved = {};
        try { localStorage.removeItem(KEY); } catch (e) {}
        host.querySelectorAll('.self-assess-item input').forEach(function (c) { c.checked = false; });
        update();
      });
    }
    update();
  })();

  /**
   * Analytics — GoatCounter (privacidade, sem cookies)
   * >>> PASSO ÚNICO: crie uma conta grátis em https://www.goatcounter.com
   *     e troque 'SEU-CODIGO' abaixo pelo código do seu site (ex.: 'diogomes').
   *     Isso ativa a contagem de visitas e a origem dos acessos em TODAS as páginas.
   */
  var GOATCOUNTER_CODE = 'diogomes';
  if (GOATCOUNTER_CODE && GOATCOUNTER_CODE !== 'SEU-CODIGO') {
    window.goatcounter = { endpoint: 'https://' + GOATCOUNTER_CODE + '.goatcounter.com/count' };
    var gcScript = document.createElement('script');
    gcScript.async = true;
    gcScript.setAttribute('data-goatcounter', window.goatcounter.endpoint);
    gcScript.src = '//gc.zgo.at/count.js';
    document.head.appendChild(gcScript);
  }

  /**
   * Eventos GoatCounter — o que as pessoas clicam
   * (cliques em "Assistir ao vídeo" e envios de comentário)
   */
  function gcSlug(s) {
    return (s || '').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'sem-titulo';
  }
  function gcEvent(path, title) {
    if (window.goatcounter && typeof window.goatcounter.count === 'function') {
      window.goatcounter.count({ path: path, title: title || path, event: true });
    }
  }

  // Extrai o ID do vídeo do YouTube de uma URL
  function gcYtId(href) {
    var m = href.match(/(?:youtu\.be\/|[?&]v=|embed\/)([\w-]{11})/);
    return m ? m[1] : null;
  }
  // Cliques em vídeos (links do YouTube e botões de play do portfólio)
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    var id = gcYtId(href);
    if (id) {
      var label = (a.getAttribute('title') || a.textContent || 'vídeo').trim();
      gcEvent('evento/video/' + id, 'Vídeo: ' + (label || id));
    } else if (/youtube\.com\/@/.test(href)) {
      gcEvent('evento/canal-youtube', 'Canal no YouTube');
    }
  });

  // Envio do formulário de comentário
  var commentForm = document.querySelector('.comment-form');
  if (commentForm) {
    commentForm.addEventListener('submit', function () {
      gcEvent('evento/comentario-enviado', 'Comentário enviado');
    });
  }

  /**
   * Easy selector helper function
   */
  const select = (el, all = false) => {
    el = el.trim()
    if (all) {
      return [...document.querySelectorAll(el)]
    } else {
      return document.querySelector(el)
    }
  }

  /**
   * Easy event listener function
   */
  const on = (type, el, listener, all = false) => {
    let selectEl = select(el, all)
    if (selectEl) {
      if (all) {
        selectEl.forEach(e => e.addEventListener(type, listener))
      } else {
        selectEl.addEventListener(type, listener)
      }
    }
  }

  /**
   * Easy on scroll event listener 
   */
  const onscroll = (el, listener) => {
    el.addEventListener('scroll', listener)
  }

  /**
   * Navbar links active state on scroll
   */
  let navbarlinks = select('#navbar .scrollto', true)
  const navbarlinksActive = () => {
    let position = window.scrollY + 200
    navbarlinks.forEach(navbarlink => {
      if (!navbarlink.hash) return
      let section = select(navbarlink.hash)
      if (!section) return
      if (position >= section.offsetTop && position <= (section.offsetTop + section.offsetHeight)) {
        navbarlink.classList.add('active')
      } else {
        navbarlink.classList.remove('active')
      }
    })
  }
  window.addEventListener('load', navbarlinksActive)
  onscroll(document, navbarlinksActive)

  /**
   * Scrolls to an element with header offset
   */
  const scrollto = (el) => {
    let elementPos = select(el).offsetTop
    window.scrollTo({
      top: elementPos,
      behavior: 'smooth'
    })
  }

  /**
   * Back to top button
   */
  let backtotop = select('.back-to-top')
  if (backtotop) {
    const toggleBacktotop = () => {
      if (window.scrollY > 100) {
        backtotop.classList.add('active')
      } else {
        backtotop.classList.remove('active')
      }
    }
    window.addEventListener('load', toggleBacktotop)
    onscroll(document, toggleBacktotop)
  }

  /**
   * Mobile nav toggle
   */
  on('click', '.mobile-nav-toggle', function(e) {
    select('body').classList.toggle('mobile-nav-active')
    this.classList.toggle('bi-list')
    this.classList.toggle('bi-x')
  })
  // Ativação por teclado (Enter/Espaço) — acessibilidade
  on('keydown', '.mobile-nav-toggle', function(e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.click() }
  })

  /**
   * Scrool with ofset on links with a class name .scrollto
   */
  on('click', '.scrollto', function(e) {
    if (select(this.hash)) {
      e.preventDefault()

      let body = select('body')
      if (body.classList.contains('mobile-nav-active')) {
        body.classList.remove('mobile-nav-active')
        let navbarToggle = select('.mobile-nav-toggle')
        navbarToggle.classList.toggle('bi-list')
        navbarToggle.classList.toggle('bi-x')
      }
      scrollto(this.hash)
    }
  }, true)

  /**
   * Scroll with ofset on page load with hash links in the url
   */
  window.addEventListener('load', () => {
    if (window.location.hash) {
      if (select(window.location.hash)) {
        scrollto(window.location.hash)
      }
    }
  });

  /**
   * Hero type effect (re-inicializável p/ troca de idioma)
   */
  var typedInstance = null;
  window.__initTyped = function () {
    var typed = select('.typed')
    if (!typed || typeof Typed === 'undefined') return
    if (typedInstance && typedInstance.destroy) { try { typedInstance.destroy() } catch (e) {} }
    typedInstance = new Typed('.typed', {
      strings: typed.getAttribute('data-typed-items').split(','),
      loop: true,
      typeSpeed: 100,
      backSpeed: 50,
      backDelay: 2000
    });
  };
  window.__initTyped();

  /**
   * Skills animation
   */
  let skilsContent = select('.skills-content');
  if (skilsContent) {
    new Waypoint({
      element: skilsContent,
      offset: '80%',
      handler: function(direction) {
        let progress = select('.progress .progress-bar', true);
        progress.forEach((el) => {
          el.style.width = el.getAttribute('aria-valuenow') + '%'
        });
      }
    })
  }

  /**
   * Porfolio isotope and filter
   */
  window.addEventListener('load', () => {
    let portfolioContainer = select('.portfolio-container');
    if (portfolioContainer) {
      let portfolioIsotope = new Isotope(portfolioContainer, {
        itemSelector: '.portfolio-item'
      });

      let portfolioFilters = select('#portfolio-flters li', true);

      on('click', '#portfolio-flters li', function(e) {
        e.preventDefault();
        portfolioFilters.forEach(function(el) {
          el.classList.remove('filter-active');
        });
        this.classList.add('filter-active');

        portfolioIsotope.arrange({
          filter: this.getAttribute('data-filter')
        });
        portfolioIsotope.on('arrangeComplete', function() {
          AOS.refresh()
        });
      }, true);
    }

  });

  /**
   * Blog isotope and filter
   */
  window.addEventListener('load', () => {
    let blogContainer = select('.blog-container');
    if (blogContainer) {
      let blogIsotope = new Isotope(blogContainer, {
        itemSelector: '.blog-item',
        layoutMode: 'fitRows'
      });

      let blogFilters = select('#blog-filters li', true);
      let blogCat = '*';
      let blogSearch = '';
      let noResults = select('#blog-no-results');

      const blogFilterFn = function (itemElem) {
        var el = itemElem || this;
        var okCat = blogCat === '*' || el.matches(blogCat);
        if (!okCat) return false;
        if (!blogSearch) return true;
        return (el.textContent || '').toLowerCase().indexOf(blogSearch) !== -1;
      };
      const arrangeBlog = function () {
        blogIsotope.arrange({ filter: blogFilterFn });
        setTimeout(function () {
          if (noResults) noResults.style.display = blogIsotope.filteredItems.length ? 'none' : 'block';
        }, 50);
      };

      on('click', '#blog-filters li', function (e) {
        e.preventDefault();
        blogFilters.forEach(function (el) { el.classList.remove('filter-active'); });
        this.classList.add('filter-active');
        blogCat = this.getAttribute('data-filter');
        arrangeBlog();
        blogIsotope.on('arrangeComplete', function () { AOS.refresh(); });
      }, true);

      const blogSearchInput = select('#blog-search');
      if (blogSearchInput) {
        blogSearchInput.addEventListener('input', function () {
          blogSearch = this.value.toLowerCase().trim();
          arrangeBlog();
        });
      }
    }

  });

  /**
   * Initiate portfolio lightbox
   */
  const portfolioLightbox = GLightbox({
    selector: '.portfolio-lightbox'
  });

  /**
   * Portfolio details slider
   */
  new Swiper('.portfolio-details-slider', {
    speed: 400,
    loop: true,
    autoplay: {
      delay: 5000,
      disableOnInteraction: false
    },
    pagination: {
      el: '.swiper-pagination',
      type: 'bullets',
      clickable: true
    }
  });

  /**
   * Testimonials slider
   */
  new Swiper('.testimonials-slider', {
    speed: 600,
    loop: true,
    autoplay: {
      delay: 5000,
      disableOnInteraction: false
    },
    slidesPerView: 'auto',
    pagination: {
      el: '.swiper-pagination',
      type: 'bullets',
      clickable: true
    },
    breakpoints: {
      320: {
        slidesPerView: 1,
        spaceBetween: 20
      },

      1200: {
        slidesPerView: 3,
        spaceBetween: 20
      }
    }
  });

  /**
   * Comentários aprovados (renderiza assets/comments.json)
   */
  const commentsList = select('#comments-list');
  if (commentsList) {
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
    const fmtDate = (d) => {
      if (!d) return '';
      const p = String(d).split('-');
      if (p.length === 3) return `${p[2]}/${p[1]}/${p[0]}`;
      return esc(d);
    };
    fetch('assets/comments.json', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : [])
      .then(items => {
        const empty = select('#comments-empty');
        if (!Array.isArray(items) || items.length === 0) {
          if (empty) empty.style.display = 'block';
          return;
        }
        commentsList.innerHTML = items.map(c => {
          const initial = esc((c.name || '?').trim().charAt(0).toUpperCase());
          return `<div class="comment-card">
              <div class="c-head">
                <div class="c-avatar">${initial}</div>
                <div>
                  <div class="c-name">${esc(c.name)}</div>
                  ${c.project ? `<div class="c-project">${esc(c.project)}</div>` : ''}
                </div>
              </div>
              <p class="c-msg">${esc(c.message)}</p>
              ${c.date ? `<div class="c-date"><i class="bi bi-clock"></i> ${fmtDate(c.date)}</div>` : ''}
            </div>`;
        }).join('');
      })
      .catch(() => {
        const empty = select('#comments-empty');
        if (empty) empty.style.display = 'block';
      });
  }

  /**
   * Animation on scroll
   */
  window.addEventListener('load', () => {
    AOS.init({
      duration: 1000,
      easing: 'ease-in-out',
      once: true,
      mirror: false
    })
  });

})()