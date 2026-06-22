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
   * Hero type effect
   */
  const typed = select('.typed')
  if (typed) {
    let typed_strings = typed.getAttribute('data-typed-items')
    typed_strings = typed_strings.split(',')
    new Typed('.typed', {
      strings: typed_strings,
      loop: true,
      typeSpeed: 100,
      backSpeed: 50,
      backDelay: 2000
    });
  }

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

      const blogFilterFn = function () {
        var el = this;
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