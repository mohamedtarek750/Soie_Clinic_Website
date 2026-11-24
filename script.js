/* =====================================================================
   Soie Clinic - script.js
   Vanilla JavaScript. No libraries, no frameworks.
   Handles: loader, sticky nav, mobile menu, scroll-spy, scroll reveals,
   animated counters, hero parallax, custom cursor, booking modal,
   gallery filtering, lightbox, testimonials slider, back-to-top,
   footer year, live "open / closed" working-hours status, the FAQ
   accordion, and the booking page (branch · service · date · time →
   pre-filled WhatsApp handoff). Every module guards for its elements,
   so the same file is shared safely across all pages of the site.
   All motion respects the user's prefers-reduced-motion setting.
   ===================================================================== */
(function () {
  'use strict';
  document.documentElement.classList.replace('no-js','js');

  /* ---------- tiny helpers ---------- */
  var $  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var mq = function (q) {
    try { return !!(window.matchMedia && window.matchMedia(q).matches); }
    catch (e) { return false; }
  };
  var reduceMotion = mq('(prefers-reduced-motion: reduce)');
  var finePointer  = mq('(hover: hover) and (pointer: fine)');
  var raf = window.requestAnimationFrame
    ? window.requestAnimationFrame.bind(window)
    : function (fn) { return window.setTimeout(function () { fn(Date.now()); }, 16); };

  var on = function (el, evt, fn, opts) { if (el) el.addEventListener(evt, fn, opts || false); };
  var dynamicArabic = {
    "Open menu": "فتح القائمة",
    "Close menu": "إغلاق القائمة",
    "View": "عرض",
    "Drag": "اسحب",
    "Go to review {number}": "انتقل إلى الرأي {number}",
    "Open now": "مفتوح الآن",
    "Closed now": "مغلق الآن",
    "Closed · opens {time}": "مغلق · يفتح الساعة {time}"
  };
  var isArabic = function () { return document.documentElement.lang.startsWith('ar'); };
  function translate(dictionary, value, variables) {
    var translated = isArabic() ? dictionary[value] || value : value;
    return translated.replace(/\{(\w+)\}/g, function (match, key) {
      return variables && variables[key] !== undefined ? variables[key] : match;
    });
  }
  var t = function (value, variables) { return translate(dynamicArabic, value, variables); };
  var displayTime = function (value) {
    return isArabic() ? value.replace(/AM/g, 'صباحًا').replace(/PM/g, 'مساءً') : value;
  };
  function measure(event, branch, treatment) {
    window.dataLayer = window.dataLayer || [];
    var context = { branch: branch || '', treatment: treatment || '' };
    window.dataLayer.push({ event: event, branch: context.branch, treatment: context.treatment });
    if (typeof window.gtag === 'function') window.gtag('event', event, context);
  }
  on(document, 'click', function (e) {
    var action = e.target.closest('a[href], button[data-event]');
    if (!action) return;
    var href = action.getAttribute('href') || '';
    var event = action.dataset.event;
    if (!event) {
      if (href.startsWith('https://wa.me/')) event = 'whatsapp_click';
      else if (href.startsWith('tel:')) event = 'call_click';
      else if (/^https:\/\/(maps\.app\.goo\.gl|(?:www\.)?google\.[^/]+\/maps|maps\.google\.)/.test(href)) event = 'map_click';
    }
    if (!event) return;
    var page = document.body.dataset.page || '';
    var branch = action.closest('[data-branch]')?.dataset.branch || (page.startsWith('/branches/') ? page.split('/').pop() : '');
    var treatmentPage = /^\/(?:treatments\/|dentistry(?:\/|$)|plastic-surgery$)/.test(page);
    var treatment = action.dataset.treatment || (treatmentPage ? page.split('/').pop() : '');
    if (action.id === 'bkSubmit') {
      branch = document.querySelector('input[name=bkBranch]:checked')?.dataset.branch;
      treatment = document.querySelector('#bkService option:checked')?.dataset.slug;
    }
    measure(event, branch, treatment);
  });
  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else { fn(); }
  }

  /* =====================================================================
     1. LOADER - reveal the page once everything is in
     ===================================================================== */
  function initLoader() {
    var loader = $('#loader');
    if (!loader) return;

    function done() {
      loader.classList.add('is-done');
      document.body.classList.remove('is-loading');
      // hand over to the arrival sequence (section 35): it must not play
      // behind the curtain, so it starts only once the curtain is going
      document.documentElement.classList.add('is-arrived');
      // remove from the flow after the fade so it never traps focus
      window.setTimeout(function () {
        if (loader && loader.parentNode) loader.parentNode.removeChild(loader);
      }, 900);
    }

    if (reduceMotion) { done(); return; }

    // A beat for the thread, then out of the way: the hero's own arrival
    // sequence is the moment worth watching, and it cannot start until
    // this lifts. Keeping the curtain longer only delays the site.
    var minVisible = 620;
    var start = Date.now();
    window.addEventListener('load', function () {
      var wait = Math.max(0, minVisible - (Date.now() - start));
      window.setTimeout(done, wait);
    });
    // hard fallback in case 'load' is slow
    window.setTimeout(done, 4500);
  }

  /* =====================================================================
     2. STICKY NAV + MOBILE MENU + SCROLL-SPY
     ===================================================================== */
  function initNav() {
    var nav      = $('#nav');
    var burger   = $('#burger');
    var navLinks = $('#navLinks');
    var links    = $$('.nav__link');

    /* pages with a dark video hero need light nav ink + the cream logo
       while the bar is still transparent */
    var darkHero = !!$('.hero--video, .page-hero--media');
    var logoImg = nav ? $('.nav__logo img', nav) : null;
    if (darkHero && nav) nav.classList.add('nav--dark-hero');

    /* shrink / frost the bar after a little scroll */
    function onScroll() {
      if (!nav) return;
      var scrolled = window.scrollY > 24;
      nav.classList.toggle('is-scrolled', scrolled);
      if (darkHero && logoImg) {
        var wantCream = !scrolled && !document.body.classList.contains('menu-open');
        var src = wantCream ? '/assets/images/logo-cream.png' : '/assets/images/logo.png';
        if (logoImg.getAttribute('src') !== src) logoImg.setAttribute('src', src);
      }
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    /* mobile burger */
    function closeMenu() {
      document.body.classList.remove('menu-open');
      if (burger) {
        burger.setAttribute('aria-expanded', 'false');
        burger.setAttribute('aria-label', t('Open menu'));
      }
      syncMenu();
      onScroll(); // restore dark-hero logo state
    }
    function toggleMenu() {
      var open = document.body.classList.toggle('menu-open');
      if (burger) {
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
        burger.setAttribute('aria-label', t(open ? 'Close menu' : 'Open menu'));
      }
      syncMenu();
      onScroll(); // dark logo on the cream overlay, cream logo on the video
    }
    function syncMenu() {
      var open = document.body.classList.contains('menu-open');
      if (navLinks) navLinks.inert = mq('(max-width: 1160px)') && !open;
      $$('main, footer').forEach(function (el) { el.inert = open; });
    }
    syncMenu();
    on(window, 'resize', function () {
      if (!mq('(max-width: 1160px)')) closeMenu();
      else syncMenu();
    });
    on(burger, 'click', toggleMenu);
    function menuLabel() {
      if (burger) burger.setAttribute('aria-label', t(document.body.classList.contains('menu-open') ? 'Close menu' : 'Open menu'));
    }

    menuLabel();
    // close after tapping any link (mobile) and on Esc
    if (navLinks) {
      on(navLinks, 'click', function (e) {
        if (e.target.closest('.nav__link')) closeMenu();
      });
    }
    on(document, 'keydown', function (e) {
      if (!document.body.classList.contains('menu-open')) return;
      if (e.key === 'Escape') { closeMenu(); if (burger) burger.focus(); }
      if (e.key === 'Tab' && nav) {
        var focusable = $$('a, button', nav).filter(function (el) { return el.getClientRects().length > 0; });
        var first = focusable[0], last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    /* scroll-spy: highlight the section currently in view */
    var sections = links
      .map(function (l) {
        var id = l.getAttribute('href');
        return id && id.charAt(0) === '#' ? document.getElementById(id.slice(1)) : null;
      })
      .filter(Boolean);

    if ('IntersectionObserver' in window && sections.length) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var id = en.target.id;
          links.forEach(function (l) {
            l.classList.toggle('is-active', l.getAttribute('href') === '#' + id);
          });
        });
      }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
      sections.forEach(function (s) { spy.observe(s); });
    }
  }

  /* =====================================================================
     3. SCROLL REVEALS + gold-thread draw
     Elements with [data-reveal] fade/slide in. [data-reveal-delay="n"]
     gives an explicit order; otherwise we stagger siblings automatically.
     .thread-divider draws its gold line when it enters the viewport.
     ===================================================================== */
  function initReveals() {
    var revealEls = $$('[data-reveal]');
    var threads   = $$('.thread-divider, .hero__thread');

    if (reduceMotion || !('IntersectionObserver' in window)) {
      revealEls.forEach(function (el) { el.classList.add('is-in'); });
      threads.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    // auto-stagger: index each element among its reveal siblings
    var groups = new Map();
    revealEls.forEach(function (el) {
      var parent = el.parentNode;
      var idx = groups.get(parent) || 0;
      if (!el.hasAttribute('data-reveal-delay')) {
        el.dataset._autodelay = idx;
      }
      groups.set(parent, idx + 1);
    });

    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        var step = el.hasAttribute('data-reveal-delay')
          ? parseInt(el.getAttribute('data-reveal-delay'), 10)
          : parseInt(el.dataset._autodelay || 0, 10);
        // a short cap: a section should read as one thing arriving, not as
        // eight queueing, so the whole group lands inside about 200ms
        el.style.transitionDelay = (Math.min(step, 4) * 0.045) + 's';
        el.classList.add('is-in');
        obs.unobserve(el);
      });
    }, { rootMargin: '0px', threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });

    var iot = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        obs.unobserve(en.target);
      });
    }, { threshold: 0.35 });
    threads.forEach(function (el) { iot.observe(el); });
  }

  /* =====================================================================
     4. ANIMATED COUNTERS
     .stat__num[data-count] counts up when scrolled into view.
     Supports data-decimals, data-suffix, data-pad (zero-pad width).
     ===================================================================== */
  function initCounters() {
    var nums = $$('.stat__num[data-count]');
    if (!nums.length) return;

    function format(el, value) {
      var dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
      var pad = parseInt(el.getAttribute('data-pad') || '0', 10);
      var suf = el.getAttribute('data-suffix') || '';
      var out = dec > 0 ? value.toFixed(dec) : String(Math.round(value));
      if (pad > 0) {
        var intPart = out.split('.')[0];
        while (intPart.length < pad) { intPart = '0' + intPart; }
        out = dec > 0 ? intPart + out.slice(out.indexOf('.')) : intPart;
      }
      return out + suf;
    }

    function run(el) {
      var target = parseFloat(el.getAttribute('data-count')) || 0;
      if (reduceMotion) { el.textContent = format(el, target); return; }
      var dur = 1600, t0 = null;
      function tick(ts) {
        if (t0 === null) t0 = ts;
        var p = Math.min(1, (ts - t0) / dur);
        var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
        el.textContent = format(el, target * eased);
        if (p < 1) raf(tick);
        else el.textContent = format(el, target);
      }
      raf(tick);
    }

    if (!('IntersectionObserver' in window)) { nums.forEach(run); return; }
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        run(en.target);
        obs.unobserve(en.target);
      });
    }, { threshold: 0.6 });
    nums.forEach(function (el) {
      el.textContent = format(el, 0); // markup holds the final value for no-JS; reset before animating
      io.observe(el);
    });
  }

  /* =====================================================================
     4b. HERO VIDEO - the muted ambient clinic reel behind the hero.
     It must play on every device (the OS "reduce animations" setting on
     some laptops used to strip it out, leaving a bare veil - never
     again). The element always stays in the DOM so its poster shows
     while loading or wherever autoplay is refused; first tap, click or
     key press retries playback for strict browsers.
     ===================================================================== */
  function initHeroVideo() {
    var v = $('.hero__video');
    if (!v) return;
    // the property (not just the attribute) is what autoplay policies check
    v.muted = true;
    v.setAttribute('muted', '');
    v.defaultMuted = true;

    function tryPlay() {
      var p = v.play && v.play();
      if (p && p.catch) p.catch(function () { /* poster keeps showing - fine */ });
    }
    on(document, 'touchstart', tryPlay, { once: true, passive: true });
    on(document, 'pointerdown', tryPlay, { once: true, passive: true });
    on(document, 'keydown', tryPlay, { once: true });
    on(v, 'canplay', tryPlay, { once: true });
    tryPlay();
  }

  /* =====================================================================
     5. HERO PARALLAX - subtle depth on [data-parallax] elements
     ===================================================================== */
  function initParallax() {
    if (reduceMotion) return;
    var els = $$('[data-parallax]');
    if (!els.length) return;

    var ticking = false;
    function update() {
      var y = window.scrollY;
      els.forEach(function (el) {
        var f = parseFloat(el.getAttribute('data-parallax')) || 0;
        el.style.transform = 'translate3d(0,' + (y * f).toFixed(1) + 'px,0)';
      });
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { raf(update); ticking = true; }
    }, { passive: true });
    update();
  }

  /* =====================================================================
     6. CUSTOM CURSOR - a gold dot + trailing ring (fine pointers only)
     ===================================================================== */
  function initCursor() {
    var dot  = $('#cursorDot');
    var ring = $('#cursorRing');
    if (!dot || !ring) return;
    if (!finePointer || reduceMotion) { return; } // keep native cursor on touch

    document.body.classList.add('cursor-on');

    var mx = window.innerWidth / 2, my = window.innerHeight / 2;
    var rx = mx, ry = my;

    on(document, 'mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
    });

    function loop() {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
      raf(loop);
    }
    raf(loop);

    // grow the ring over interactive things
    var hoverSel = 'a, button, .ba, .filter, .s-card, input, textarea, [data-open-booking]';
    on(document, 'mouseover', function (e) {
      if (e.target.closest(hoverSel)) ring.classList.add('is-hover');
    });
    on(document, 'mouseout', function (e) {
      if (e.target.closest(hoverSel)) ring.classList.remove('is-hover');
    });
    on(document, 'mouseleave', function () {
      dot.style.opacity = '0'; ring.style.opacity = '0';
    });
    on(document, 'mouseenter', function () {
      dot.style.opacity = ''; ring.style.opacity = '';
    });

    /* The ring earns its place: where the action is not obvious it says the
       word. Text goes into the ring itself, so nothing new is created and
       nothing is laid out. Fine pointers only, which is already the gate
       this whole module sits behind. */
    function labelFor(el) {
      if (!el || !el.closest) return '';
      if (el.closest('.ba, .rv-shot')) return t('View');
      if (el.closest('.cmp')) return t('Drag');
      return '';
    }
    function setLabel(word) {
      if (ring.textContent === word) return;
      ring.textContent = word;
      ring.classList.toggle('has-label', !!word);
    }
    on(document, 'mouseover', function (e) { setLabel(labelFor(e.target)); });
    on(document, 'mouseout', function (e) {
      if (!e.relatedTarget) setLabel('');   // the pointer left the document
    });

  }

  /* =====================================================================
     7. BOOKING MODAL - opened by any [data-open-booking]
     ===================================================================== */
  function initModal() {
    var modal = $('#bookingModal');
    if (!modal) return;
    var lastFocus = null;
    var closeTimer;

    function openModal() {
      window.clearTimeout(closeTimer);
      modal.setAttribute('aria-hidden', 'false');
      if (!modal.open) {
        lastFocus = document.activeElement;
        modal.showModal();
      }
      modal.classList.add('is-open');
      document.body.classList.add('modal-open');
      var focusable = modal.querySelector('a, button, [tabindex]');
      if (focusable) focusable.focus();
    }
    function closeModal() {
      window.clearTimeout(closeTimer);
      modal.classList.remove('is-open');
      closeTimer = window.setTimeout(function () {
        modal.close();
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
        if (lastFocus && lastFocus.getClientRects().length) lastFocus.focus({ preventScroll: true });
      }, reduceMotion ? 0 : 180);
    }

    $$('[data-open-booking]').forEach(function (btn) {
      on(btn, 'click', function (e) { e.preventDefault(); openModal(); });
    });
    $$('[data-close-booking]').forEach(function (btn) {
      on(btn, 'click', closeModal);
    });
    on(modal, 'cancel', function (e) {
      e.preventDefault();
      closeModal();
    });

    // simple focus trap while open
    on(modal, 'keydown', function (e) {
      if (e.key !== 'Tab' || !modal.classList.contains('is-open')) return;
      var f = $$('a, button, [tabindex]:not([tabindex="-1"])', modal)
        .filter(function (el) { return el.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* =====================================================================
     8. GALLERY FILTER - .filter[data-filter] toggles .ba[data-cat]
     ===================================================================== */
  function initGalleryFilter() {
    var buttons = $$('.filter');
    var items   = $$('.ba');
    if (!buttons.length || !items.length) return;

    buttons.forEach(function (btn) {
      on(btn, 'click', function () {
        var cat = btn.getAttribute('data-filter');
        buttons.forEach(function (b) {
          var active = b === btn;
          b.classList.toggle('is-active', active);
          b.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        items.forEach(function (fig) {
          var show = cat === 'all' || fig.getAttribute('data-cat') === cat;
          fig.classList.toggle('is-hidden', !show);
        });
      });
    });
  }

  /* =====================================================================
     9. LIGHTBOX - click a before/after card to view it enlarged.
     Prev/Next step through whatever is currently visible.
     ===================================================================== */
  function initLightbox() {
    var box  = $('#lightbox');
    var img  = $('#lbImg');
    var cap  = $('#lbCap');
    if (!box || !img) return;
    var closeBtn = $('#lbClose');
    var prevBtn  = $('#lbPrev');
    var nextBtn  = $('#lbNext');
    var all = $$('.ba, .rv-shot'); // before/after cards + review screenshots
    var current = -1;
    var lastFocus = null;

    function visible() {
      return all.filter(function (f) { return !f.classList.contains('is-hidden'); });
    }
    function show(fig) {
      var pic = $('img', fig);
      var name = $('.ba__name', fig);
      if (!pic) return;
      img.setAttribute('src', pic.getAttribute('src'));
      img.setAttribute('alt', pic.getAttribute('alt') || '');
      if (cap) cap.textContent = name ? name.textContent : '';
    }
    function doOpen(fig) {
      lastFocus = document.activeElement;
      var list = visible();
      current = list.indexOf(fig);
      show(fig);
      box.classList.add('is-open');
      box.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
      if (closeBtn) closeBtn.focus();
    }
    function doClose() {
      box.classList.remove('is-open');
      box.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    function openAt(fig) {
      doOpen(fig);
    }
    function close() {
      doClose();
    }
    function step(dir) {
      var list = visible();
      if (!list.length) return;
      current = (current + dir + list.length) % list.length;
      show(list[current]);
    }

    all.forEach(function (fig) {
      fig.setAttribute('tabindex', '0');
      fig.setAttribute('role', 'button');
      on(fig, 'click', function () { openAt(fig); });
      on(fig, 'keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openAt(fig); }
      });
    });
    on(closeBtn, 'click', close);
    on(prevBtn, 'click', function () { step(-1); });
    on(nextBtn, 'click', function () { step(1); });
    on(box, 'click', function (e) { if (e.target === box) close(); }); // backdrop
    on(document, 'keydown', function (e) {
      if (!box.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
    });
  }

  /* =====================================================================
     10. TESTIMONIALS SLIDER - transform track, dots, auto-advance, swipe
     ===================================================================== */
  function initTestimonials() {
    var track = $('#tstTrack');
    if (!track) return;
    var cards = $$('.tst__card', track);
    if (cards.length < 2) return;
    var prev = $('#tstPrev');
    var next = $('#tstNext');
    var dotsWrap = $('#tstDots');
    var index = 0;
    var timer = null;
    var DELAY = 5600;

    // build dots
    var dots = [];
    if (dotsWrap) {
      cards.forEach(function (_, i) {
        var d = document.createElement('button');
        d.className = 'tst__dot';
        d.type = 'button';
        d.setAttribute('aria-label', t('Go to review {number}', { number: i + 1 }));
        on(d, 'click', function () { go(i); reset(); });
        dotsWrap.appendChild(d);
        dots.push(d);
      });
    }

    function go(i) {
      index = (i + cards.length) % cards.length;
      track.style.transform = 'translateX(' + (-index * 100) + '%)';
      dots.forEach(function (d, di) { d.classList.toggle('is-active', di === index); });
    }
    function nextSlide() { go(index + 1); }
    function prevSlide() { go(index - 1); }

    function start() {
      if (reduceMotion) return;
      stop();
      timer = window.setInterval(nextSlide, DELAY);
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function reset() { stop(); start(); }

    on(next, 'click', function () { nextSlide(); reset(); });
    on(prev, 'click', function () { prevSlide(); reset(); });

    // pause on hover / focus
    var vp = $('.tst__viewport') || track.parentNode;
    on(vp, 'mouseenter', stop);
    on(vp, 'mouseleave', start);
    on(vp, 'focusin', stop);
    on(vp, 'focusout', start);

    // touch swipe
    var x0 = null;
    on(track, 'touchstart', function (e) { x0 = e.touches[0].clientX; stop(); }, { passive: true });
    on(track, 'touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) { dx < 0 ? nextSlide() : prevSlide(); }
      x0 = null; start();
    });

    // pause when the tab is hidden
    on(document, 'visibilitychange', function () {
      document.hidden ? stop() : start();
    });

    go(0);
    start();
  }

  /* =====================================================================
     10a. BEFORE/AFTER COMPARISON SLIDER - the hidden range input drives
     the --pos CSS var; drag, touch and arrow keys all come for free.
     ===================================================================== */
  function initCompare() {
    $$('.cmp').forEach(function (cmp) {
      var range = $('.cmp__range', cmp);
      if (!range) return;

      function value() {
        var v = parseFloat(range.value);
        return isNaN(v) ? 50 : v;
      }

      var target  = value();   // where the pointer has asked the seam to be
      var pos     = target;    // where the seam is actually drawn right now
      var running = false;
      var keyed   = false;     // the last change came from the keyboard

      function paint() { cmp.style.setProperty('--pos', pos.toFixed(2) + '%'); }
      function land()  { pos = target; running = false; paint(); }

      // Silk, not glass: the seam follows the hand with the same lerp the
      // cursor ring uses, so it trails a little and then settles instead of
      // stopping dead on the last pixel.
      function loop() {
        pos += (target - pos) * 0.18;
        if (Math.abs(target - pos) < 0.04) { pos = target; running = false; }
        paint();
        if (running) raf(loop);
      }

      function apply() {
        target = value();
        // arrow keys are an exact instruction, not a drag: they land at once
        if (reduceMotion || keyed) { land(); return; }
        if (!running) { running = true; raf(loop); }
      }

      on(range, 'keydown',    function () { keyed = true; });
      on(range, 'mousedown',  function () { keyed = false; });
      on(range, 'pointerdown', function () { keyed = false; });
      on(range, 'touchstart', function () { keyed = false; }, { passive: true });
      on(range, 'input', apply);
      paint();
    });
  }

  /* =====================================================================
     10b. REVIEW STRIP - arrow buttons step the snap-scrolling screenshot
     strip by one card; native swipe/scroll works as-is.
     ===================================================================== */
  function initReviewStrip() {
    var strip = $('#rvStrip');
    if (!strip) return;
    function step(dir) {
      var card = $('.rv-shot', strip);
      var gap = 18;
      var w = card ? card.getBoundingClientRect().width + gap : 320;
      strip.scrollBy({ left: dir * w, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
    on($('#rvPrev'), 'click', function () { step(-1); });
    on($('#rvNext'), 'click', function () { step(1); });
  }

  /* =====================================================================
     11. BACK-TO-TOP button
     ===================================================================== */
  function initToTop() {
    var btn = $('#toTop');
    if (!btn) return;
    function onScroll() {
      btn.classList.toggle('is-visible', window.scrollY > 600);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    on(btn, 'click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* =====================================================================
     12. FOOTER YEAR
     ===================================================================== */
  function initYear() {
    var y = $('#year');
    if (y) y.textContent = String(new Date().getFullYear());
  }

  /* =====================================================================
     13. WORKING HOURS - highlight today + live open / closed status.
     We read today's row straight from the DOM so the status always
     matches whatever hours are shown (no duplicated data to keep in sync).
     ===================================================================== */
  function initHours() {
    var rows = $$('.hours__row');
    var statusEl = $('#openStatus');
    var textEl = $('#openStatusText');
    if (!rows.length) return;

    var now = new Date();
    var today = now.getDay();            // 0 = Sunday … 6 = Saturday
    var mins = now.getHours() * 60 + now.getMinutes();
    var todayRow = null;

    rows.forEach(function (row) {
      var d = parseInt(row.getAttribute('data-day'), 10);
      var isToday = d === today;
      row.classList.toggle('is-today', isToday);
      if (isToday) todayRow = row;
    });

    if (!statusEl || !textEl) return;

    function parseTime(str) {
      // expects e.g. "10:00 AM" -> minutes since midnight
      var m = str.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (!m) return null;
      var h = parseInt(m[1], 10) % 12;
      var min = parseInt(m[2], 10);
      if (/PM/i.test(m[3])) h += 12;
      return h * 60 + min;
    }

    var open = false, opensAt = null;
    if (todayRow) {
      var timeEl = $('.hours__time', todayRow);
      if (timeEl) {
        var parts = (timeEl.getAttribute('data-hours') || timeEl.textContent).split(/\s+to\s+/);
        if (parts.length === 2) {
          var start = parseTime(parts[0]);
          var end = parseTime(parts[1]);
          if (start !== null && end !== null) {
            open = mins >= start && mins < end;
            opensAt = start;
          }
        }
      }
    }

    statusEl.classList.remove('is-open', 'is-closed');
    if (open) {
      statusEl.classList.add('is-open');
      textEl.textContent = t('Open now');
    } else {
      statusEl.classList.add('is-closed');
      if (opensAt !== null && mins < opensAt && todayRow) {
        var h12 = Math.floor(opensAt / 60);
        var mm = opensAt % 60;
        var ampm = h12 >= 12 ? 'PM' : 'AM';
        var hh = h12 % 12; if (hh === 0) hh = 12;
        textEl.textContent = t('Closed · opens {time}', { time: displayTime(hh + ':' + (mm < 10 ? '0' + mm : mm) + ' ' + ampm) });
      } else {
        textEl.textContent = t('Closed now');
      }
    }
  }

  /* =====================================================================
     14. FAQ ACCORDION - native <details>; opening one closes its siblings
     so the list stays calm and scannable.
     ===================================================================== */
  function initAccordion() {
    $$('.acc').forEach(function (acc) {
      var items = $$('details', acc);
      items.forEach(function (d) {
        on(d, 'toggle', function () {
          if (!d.open) return;
          items.forEach(function (other) {
            if (other !== d) other.open = false;
          });
        });
      });
    });
  }

  /* Old device tab bookmarks now open the permanent device page.
     Fragments never reach the server, so HTTP redirects cannot migrate them. */
  function initLegacyDeviceLinks() {
    var path = window.location.pathname.replace(/^\/ar(?=\/|$)/, '') || '/';
    var catalogue = /^\/devices(?:\/index\.html|\.html|\/)?$/.test(path);
    var home = path === '/' || path === '/index.html';
    var hash;
    try { hash = decodeURIComponent(window.location.hash.slice(1)); }
    catch (e) { return; }
    if (home) {
      if (hash.indexOf('home-') !== 0) return;
      hash = hash.slice(5);
    } else if (!catalogue) return;
    var match = /^(indiba|cutera|finexel)(?:-(video|faq-title))?$/.exec(hash);
    if (!match) return;
    var routes = { indiba: '/devices/indiba-deep-care', cutera: '/devices/cutera-excel-hr', finexel: '/devices/finexel-fractional-co2' };
    var fragment = match[2] === 'video' ? '#' + match[1] + '-video' : match[2] ? '#device-faq' : '';
    window.location.replace((isArabic() ? '/ar' : '') + routes[match[1]] + window.location.search + fragment);
  }

  /* =====================================================================
     16. FILMS - video[data-film] is a short, silent loop used as a page
     background or inline device video (its poster is the still it rests on). Nothing is
     fetched until the film is approached (its src lives in data-src; narrow screens
     may get data-src-portrait), it plays only while it is on screen, and
     the [data-media-toggle] button that follows it lets anyone pause it.
     Reduced motion, Save-Data or no IntersectionObserver: the video is
     never loaded, the poster stays, and the toggles are hidden.
     ===================================================================== */
  function initFilms() {
    var films = $$('video[data-film]');
    if (!films.length) return;

    var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    var saveData = !!(conn && conn.saveData);

    // narrow screens get the portrait cut, so give them its poster as well:
    // the still and the first frame then match (also when no film ever loads)
    if (mq('(max-width: 760px)')) {
      films.forEach(function (v) {
        var portrait = v.getAttribute('data-src-portrait');
        if (portrait) v.poster = portrait.replace('assets/videos/', 'assets/videos/posters/').replace(/\.mp4$/, '.jpg');
      });
    }

    if (reduceMotion || saveData || !('IntersectionObserver' in window)) {
      $$('.film-toggle').forEach(function (t) { t.setAttribute('hidden', ''); });
      return;
    }

    // the toggle is the film's next sibling or, for a header background,
    // the next sibling of the film's .hero-bg wrapper
    function toggleFor(v) {
      var t = v.nextElementSibling;
      if (t && t.hasAttribute('data-media-toggle')) return t;
      t = v.parentNode ? v.parentNode.nextElementSibling : null;
      return (t && t.hasAttribute('data-media-toggle')) ? t : null;
    }

    var states = films.map(function (v) {
      // the property (not just the attribute) is what autoplay policies check
      v.muted = true;
      v.defaultMuted = true;
      v.setAttribute('muted', '');
      v.setAttribute('playsinline', '');
      v.loop = true;
      try { v.disablePictureInPicture = true; } catch (e) { /* unsupported - fine */ }
      return { video: v, toggle: toggleFor(v), loaded: false, failed: false, inView: false, userPaused: false };
    });

    function stateOf(v) {
      for (var i = 0; i < states.length; i++) { if (states[i].video === v) return states[i]; }
      return null;
    }

    // the name stays "Pause video"; aria-pressed alone says whether it is paused
    function sync(s) {
      if (s.toggle) s.toggle.setAttribute('aria-pressed', s.userPaused ? 'true' : 'false');
      if (s.video.parentNode && s.video.parentNode.classList) {
        s.video.parentNode.classList.toggle('is-paused', s.userPaused);
      }
    }

    // attach the source once, on first approach
    function load(s) {
      if (s.loaded || s.video.closest('[hidden]')) return;
      s.loaded = true;
      var v = s.video;
      var portrait = v.getAttribute('data-src-portrait');
      var src = (portrait && mq('(max-width: 760px)')) ? portrait : v.getAttribute('data-src');
      if (!src) { s.failed = true; return; }
      v.preload = 'auto';   // markup says "none" so nothing is fetched before this moment
      v.src = src;
      v.load();
    }

    function pause(s) {
      if (!s.video.paused) s.video.pause();
    }

    function play(s) {
      if (s.video.closest('[hidden]')) { pause(s); return; }
      if (s.userPaused || s.failed || !s.inView || document.hidden) return;
      load(s);
      if (s.failed) return;
      states.forEach(function (o) { if (o !== s) pause(o); }); // never more than one film playing
      var p = s.video.play && s.video.play();
      if (p && p.catch) {
        p.catch(function (err) {
          // Autoplay refused (e.g. a low-power mode): keep the poster and offer
          // "Play", since a tap is allowed to start it. A play() interrupted by
          // our own pause() (AbortError) is not a refusal and is ignored.
          if (err && err.name === 'NotAllowedError') { s.userPaused = true; sync(s); }
        });
      }
    }

    states.forEach(function (s) {
      on(s.video, 'playing', function () { s.video.classList.add('is-film-live'); });
      on(s.video, 'error', function () {
        // missing or undecodable file: the poster stays, the control goes
        s.failed = true;
        if (s.toggle) s.toggle.setAttribute('hidden', '');
      });
      on(s.toggle, 'click', function () {
        s.userPaused = !s.userPaused;
        if (s.userPaused) pause(s); else play(s);
        sync(s);
      });
      sync(s);
    });

    // observer A: fetch just before the film scrolls into view, once
    var approach = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var s = stateOf(en.target);
        if (s) {
          load(s);
          if (s.loaded) obs.unobserve(en.target);
        }
      });
    }, { rootMargin: '400px 0px', threshold: 0 });

    // observer B: play while on screen, pause when not. A band taller than the
    // viewport can never show 35% of itself, so filling half the screen counts too.
    var watch = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var s = stateOf(en.target);
        if (!s) return;
        var vh = window.innerHeight || document.documentElement.clientHeight || 0;
        var seen = !s.video.closest('[hidden]') && en.isIntersecting && (en.intersectionRatio >= 0.35 ||
          (vh > 0 && en.intersectionRect && en.intersectionRect.height >= vh * 0.5));
        s.inView = !!seen;
        if (s.inView) play(s); else pause(s);
      });
    }, { threshold: [0, 0.1, 0.2, 0.35, 0.5, 0.75] });

    // start watching only once the page itself has loaded, so a film in the
    // first screen never competes with the fonts, the CSS or its own poster
    function start() {
      states.forEach(function (s) {
        approach.observe(s.video);
        watch.observe(s.video);
      });
    }
    if (document.readyState === 'complete') start(); else on(window, 'load', start);

    // a hidden tab plays nothing; coming back resumes whatever is on screen
    on(document, 'visibilitychange', function () {
      states.forEach(function (s) {
        if (document.hidden) pause(s); else play(s);
      });
    });

    // Reduce Motion switched on mid-visit: stop every film and leave it stopped
    var motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    function onMotionChange(e) {
      if (!e.matches) return;
      states.forEach(function (s) { s.userPaused = true; pause(s); sync(s); });
    }
    if (motionQuery && motionQuery.addEventListener) motionQuery.addEventListener('change', onMotionChange);
    else if (motionQuery && motionQuery.addListener) motionQuery.addListener(onMotionChange);
  }

  /* =====================================================================
     17. SILK - the motion system (its CSS lives in section 35).
     Three jobs, all of them cheap:
       A  add html.is-arrived one frame in, which hands the header over to
          its own arrival sequence instead of the generic reveal.
       C  on a fine pointer only, write a smoothed -1..1 pointer offset into
          --px / --py on every [data-silk] element. CSS decides what moves;
          this never touches layout and stops the moment the pointer rests.
       G  raise the booking bar once the header has scrolled away.
     Reduced motion: the arrival still fires (CSS lands it instantly), the
     lean never starts, and the bar appears without sliding.
     ===================================================================== */
  function initSilk() {
    var root = document.documentElement;

    /* A - the arrival. Pages with a loader are handed over by initLoader
       when the curtain lifts, so the sequence is never spent behind it. */
    function arrive() { root.classList.add('is-arrived'); }
    if (reduceMotion || !$('#loader')) {
      if (reduceMotion) arrive();
      else raf(function () { raf(arrive); });
    }

    /* C - the lean */
    var leaners = $$('[data-silk]');
    if (leaners.length && finePointer && !reduceMotion) {
      root.classList.add('silk-pointer');
      var tx = 0, ty = 0, cx = 0, cy = 0, running = false;

      function step() {
        cx += (tx - cx) * 0.08;
        cy += (ty - cy) * 0.08;
        for (var i = 0; i < leaners.length; i++) {
          leaners[i].style.setProperty('--px', cx.toFixed(4));
          leaners[i].style.setProperty('--py', cy.toFixed(4));
        }
        // keep going only while there is still distance to cover
        if (Math.abs(tx - cx) > 0.0015 || Math.abs(ty - cy) > 0.0015) raf(step);
        else running = false;
      }

      on(window, 'mousemove', function (e) {
        var w = window.innerWidth || 1, h = window.innerHeight || 1;
        tx = (e.clientX / w) * 2 - 1;
        ty = (e.clientY / h) * 2 - 1;
        if (!running) { running = true; raf(step); }
      }, { passive: true });
    }

    /* G - the booking bar */
    var bar = $('[data-bookbar]');
    if (bar) {
      bar.hidden = false;
      var hero = $('.page-hero');
      if (hero && 'IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          var shown = !entries[0].isIntersecting;
          bar.classList.toggle('is-up', shown);
          bar.inert = !shown;
          bar.setAttribute('aria-hidden', String(!shown));
        }, { threshold: 0 }).observe(hero);
      } else {
        bar.classList.add('is-up');
      }
    }
  }

  /* The homepage booking shortcut appears only after the hero has passed. */
  function initSignatureBookbar() {
    var bar = $('[data-signature-bookbar]');
    var hero = $('.sig-hero');
    if (!bar || !hero) return;
    bar.hidden = false;
    function update() {
      var shown = hero.getBoundingClientRect().bottom <= ($('#nav') ? $('#nav').offsetHeight : 0);
      bar.classList.toggle('is-up', shown);
      bar.inert = !shown;
      bar.setAttribute('aria-hidden', String(!shown));
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(update, { rootMargin: '-' + ($('#nav') ? $('#nav').offsetHeight : 0) + 'px 0px 0px' }).observe(hero);
    } else { on(window, 'scroll', update, { passive: true }); }
    on(window, 'resize', update);
    update();
  }

  /* =====================================================================
     BOOT
     ===================================================================== */
  function safe(fn, name) {
    try { fn(); }
    catch (e) {
      if (window.console && console.warn) console.warn('Soie: "' + name + '" failed -', e);
    }
  }

  // The deferred booking script is included only on the booking page.
  if ($('#bkForm')) {
    window.SoieBookingUI = { $, $$, on, translate, displayTime, isArabic, measure };
  }

  safe(initLoader, 'loader'); // start immediately so the fade feels responsive

  // Pages without a curtain start their arrival the moment this file runs.
  // This file sits at the end of <body>, so the header already exists, and
  // waiting for DOMContentLoaded would leave it blank for longer than it has
  // to be on a slow connection. Pages with a loader are handed over by it.
  if (!$('#loader')) {
    safe(function () { document.documentElement.classList.add('is-arrived'); }, 'arrival');
  }
  ready(function () {
    safe(initNav, 'nav');
    safe(initLegacyDeviceLinks, 'legacy device links');
    safe(initReveals, 'reveals');
    safe(initCounters, 'counters');
    safe(initHeroVideo, 'hero video');
    safe(initModal, 'modal');
    safe(initGalleryFilter, 'gallery filter');
    safe(initLightbox, 'lightbox');
    safe(initTestimonials, 'testimonials');
    safe(initReviewStrip, 'review strip');
    safe(initCompare, 'compare slider');
    safe(initToTop, 'to-top');
    safe(initYear, 'year');
    safe(initHours, 'hours');

    safe(initAccordion, 'accordion');
    safe(initFilms, 'films');
    safe(initSilk, 'silk');
    safe(initSignatureBookbar, 'home booking shortcut');
  });
})();
