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
        var src = wantCream ? 'assets/images/logo-cream.png' : 'assets/images/logo.png';
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
        burger.setAttribute('aria-label', 'Open menu');
      }
      onScroll(); // restore dark-hero logo state
    }
    function toggleMenu() {
      var open = document.body.classList.toggle('menu-open');
      if (burger) {
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
        burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      }
      onScroll(); // dark logo on the cream overlay, cream logo on the video
    }
    on(burger, 'click', toggleMenu);
    // close after tapping any link (mobile) and on Esc
    if (navLinks) {
      on(navLinks, 'click', function (e) {
        if (e.target.closest('.nav__link')) closeMenu();
      });
    }
    on(document, 'keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('menu-open')) closeMenu();
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
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
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
      if (el.closest('.ba, .rv-shot')) return 'View';
      if (el.closest('.cmp')) return 'Drag';
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

    function openModal() {
      lastFocus = document.activeElement;
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
      var focusable = modal.querySelector('a, button, [tabindex]');
      if (focusable) focusable.focus();
    }
    function closeModal() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    $$('[data-open-booking]').forEach(function (btn) {
      on(btn, 'click', function (e) { e.preventDefault(); openModal(); });
    });
    $$('[data-close-booking]').forEach(function (btn) {
      on(btn, 'click', closeModal);
    });
    on(document, 'keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
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
    /* The morph. It is the same photograph in both places, so instead of a
       new panel appearing over the page the picture that was clicked grows
       into the exhibit and shrinks back into the wall. Only one element in
       the document may carry a view-transition-name at a time, so the name
       is handed from the thumbnail to the lightbox inside the callback (the
       old snapshot is taken before it runs, the new one after) and dropped
       again the moment the transition is over. Without the API, or under
       reduced motion, every path below falls through to the plain open. */
    var NAME = 'exhibit';
    var named = null;

    function dropName() {
      if (named && named.style) named.style.removeProperty('view-transition-name');
      named = null;
    }
    function takeName(el) {
      dropName();
      if (el && el.style) { el.style.setProperty('view-transition-name', NAME); named = el; }
    }
    function canMorph() {
      return !reduceMotion && typeof document.startViewTransition === 'function';
    }
    function morph(from, to, change) {
      if (!canMorph() || !from || !to) { change(); return; }
      takeName(from);
      var t;
      try {
        t = document.startViewTransition(function () { takeName(to); change(); });
      } catch (e) { dropName(); change(); return; }
      if (t && t.finished && t.finished.then) {
        t.finished.then(function () { dropName(); }, function () { dropName(); });
      } else { dropName(); }
    }
    function currentThumb() {
      var list = visible();
      var fig = (current >= 0 && current < list.length) ? list[current] : null;
      return fig ? $('img', fig) : null;
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
      morph($('img', fig), img, function () { doOpen(fig); });
    }
    function close() {
      morph(img, currentThumb(), doClose);
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
        d.setAttribute('aria-label', 'Go to review ' + (i + 1));
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
        var parts = timeEl.textContent.split(/\s+to\s+/); // "10:00 AM to 11:00 PM"
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
      textEl.textContent = 'Open now';
    } else {
      statusEl.classList.add('is-closed');
      if (opensAt !== null && mins < opensAt && todayRow) {
        var h12 = Math.floor(opensAt / 60);
        var mm = opensAt % 60;
        var ampm = h12 >= 12 ? 'PM' : 'AM';
        var hh = h12 % 12; if (hh === 0) hh = 12;
        textEl.textContent = 'Closed · opens ' + hh + ':' + (mm < 10 ? '0' + mm : mm) + ' ' + ampm;
      } else {
        textEl.textContent = 'Closed now';
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

  /* =====================================================================
     15. BOOKING PAGE - branch · details · service · date · time.
     Each branch books online: the form posts to that branch's Soie System
     web app (see BOOKING_ENDPOINTS) which adds it to the reception Requests
     inbox with the phone and emails reception, then the page shows an
     on-page confirmation. A branch with no endpoint set falls back to a
     pre-filled WhatsApp handoff so nothing is lost.
     Slots follow the clinic's working hours (Sat to Thu 10:00 to 23:00,
     Fri 12:00 to 22:00), hourly, last start 1h before close; past times are
     hidden when the chosen date is today.
     Validation checks a field when the patient leaves it, and a blocked
     Confirm raises a summary at the top of the form that takes focus and
     links to each control still to fill.
     ===================================================================== */
  function initBooking() {
    var form = $('#bkForm');
    if (!form) return;

    // ── Where each branch's bookings are sent ────────────────────────────
    // Each branch posts to its own Soie System web app, which adds the booking
    // to that branch's Requests inbox (with the patient's phone) and emails
    // reception. A blank URL makes that branch fall back to the WhatsApp
    // handoff, so nothing is lost before a system is wired up.
    var BOOKING_ENDPOINTS = {
      'New Cairo':  'https://script.google.com/macros/s/AKfycbzhChuuZ4KKdi493yhwvLGYE7c7QkKFE0SsRbFfPNlx6FRNSeAPQVp0MRkbdQhOaTE/exec',
      'Mohandseen': 'https://script.google.com/macros/s/AKfycbwOHDi6U6MYSM-YMnZNCIn0Dhrvm3YE724wCuuLGJWxCT57ja01R6ReY7AN6yzKYu81ZQ/exec'
    };

    var serviceSel = $('#bkService');
    var dateInput  = $('#bkDate');
    var slotsWrap  = $('#bkSlots');
    var nameInput  = $('#bkName');
    var phoneInput = $('#bkPhone');
    var submit     = $('#bkSubmit');
    var submitLabel = $('#bkSubmitLabel');
    var waIcon     = $('#bkWaIcon');
    var note       = $('#bkNote');
    var done       = $('#bkDone');
    var summary     = $('#bkSummary');
    var summaryList = $('#bkSummaryList');
    var nameErr     = $('#bkNameErr');
    var phoneErr    = $('#bkPhoneErr');
    var sum = {
      branch:  $('#sumBranch'),
      name:    $('#sumName'),
      phone:   $('#sumPhone'),
      service: $('#sumService'),
      date:    $('#sumDate'),
      time:    $('#sumTime')
    };
    var selectedTime = '';
    var sent = false;
    var sending = false;      // a post is in flight; do not start a second one
    var postFailed = false;   // the request never left the device

    function pad(n) { return n < 10 ? '0' + n : String(n); }
    function fmt12(h) {
      var ampm = h >= 12 ? 'PM' : 'AM';
      var hh = h % 12; if (hh === 0) hh = 12;
      return hh + ':00 ' + ampm;
    }

    // limit the calendar to today → +60 days
    var today = new Date();
    var max = new Date(today.getTime() + 60 * 24 * 3600 * 1000);
    if (dateInput) {
      dateInput.min = today.getFullYear() + '-' + pad(today.getMonth() + 1) + '-' + pad(today.getDate());
      dateInput.max = max.getFullYear() + '-' + pad(max.getMonth() + 1) + '-' + pad(max.getDate());
    }

    function checked(name) {
      var el = form.querySelector('input[name="' + name + '"]:checked');
      return el || null;
    }

    function prettyDate(val) {
      if (!val) return 'Not set';
      var parts = val.split('-');
      var d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
      var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return days[d.getDay()] + ' ' + d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
    }

    function buildSlots() {
      if (!slotsWrap || !dateInput) return;
      selectedTime = '';
      slotsWrap.innerHTML = '';
      var val = dateInput.value;
      if (!val) {
        slotsWrap.innerHTML = '<p class="slots__hint">Choose a date first and the available times will appear here.</p>';
        update();
        return;
      }
      var parts = val.split('-');
      var d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      var friday = d.getDay() === 5;
      var open = friday ? 12 : 10;
      var close = friday ? 22 : 23;
      var now = new Date();
      var isToday = d.toDateString() === now.toDateString();
      var added = 0;
      for (var h = open; h < close; h++) {
        if (isToday && h <= now.getHours()) continue; // no past slots today
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'slot';
        b.textContent = fmt12(h);
        (function (btn) {
          on(btn, 'click', function () {
            $$('.slot', slotsWrap).forEach(function (s) { s.classList.remove('is-selected'); });
            btn.classList.add('is-selected');
            selectedTime = btn.textContent;
            update();
          });
        })(b);
        slotsWrap.appendChild(b);
        added++;
      }
      if (!added) {
        slotsWrap.innerHTML = '<p class="slots__hint">No more times today. Please pick the next day.</p>';
      }
      update();
    }

    // Some treatments run at one branch only (dentistry and veneers are
    // Mohandseen only). Hide those options when another branch is chosen,
    // and fall back to Consultation if the picked treatment is not offered
    // at the newly selected branch.
    function syncServiceOptions() {
      if (!serviceSel) return;
      var branchEl = checked('bkBranch');
      var branch = branchEl ? branchEl.value : 'New Cairo';
      var reset = false;
      $$('option[data-branch]', serviceSel).forEach(function (opt) {
        var allowed = opt.getAttribute('data-branch') === branch;
        opt.hidden = !allowed;
        opt.disabled = !allowed;
        if (!allowed && opt.selected) reset = true;
      });
      if (reset) serviceSel.value = 'Consultation';
    }

    function digits(s) { return (s || '').replace(/\D/g, ''); }
    function phoneValid() { return digits(phoneInput ? phoneInput.value : '').length >= 8; }
    function currentBranch() {
      var b = checked('bkBranch');
      return b ? b.value : 'New Cairo';
    }
    function branchEndpoint() { return BOOKING_ENDPOINTS[currentBranch()] || ''; }
    // A branch books online once its own system endpoint is wired up. If a
    // post has already failed to leave this device, the online route is not
    // working for this visitor, so the form falls back to WhatsApp for the
    // rest of the visit rather than swallowing a second booking.
    function useSystem() { return !postFailed && !!branchEndpoint(); }

    /* ── What is missing, and how we say so ───────────────────────────────
       One validator per field. Each returns '' when the field is fine, or
       the one short line the patient reads. The two text fields show their
       line under the input; date and time have no text field, so their
       lines appear only in the summary at the top of the form. Nothing
       here touches the submit gating, the payload or the endpoints.
       ------------------------------------------------------------------ */
    function todayStr() {
      var n = new Date();
      return n.getFullYear() + '-' + pad(n.getMonth() + 1) + '-' + pad(n.getDate());
    }

    // the first time a patient can still pick on the chosen date
    function firstSlot() {
      return slotsWrap ? slotsWrap.querySelector('button.slot:not([disabled])') : null;
    }

    function nameProblem() {
      var v = nameInput ? nameInput.value.trim() : '';
      if (!v) return 'Enter your full name.';
      if (v.length < 2) return 'Enter your full name, at least two characters.';
      return '';
    }

    // Only the online route needs a number typed in; the WhatsApp handoff
    // carries the patient's number in the chat itself.
    function phoneProblem() {
      if (!useSystem()) return '';
      var v = phoneInput ? phoneInput.value.trim() : '';
      if (!v) return 'Enter the phone number we should call you on.';
      if (!phoneValid()) return 'Enter at least eight digits of your phone number.';
      return '';
    }

    function dateProblem() {
      var v = dateInput ? dateInput.value : '';
      if (!v) return 'Choose the date you would like to visit.';
      if (v < todayStr()) return 'Choose today or a later date.';
      if (!firstSlot()) return 'No times are left on that date. Choose another day.';
      return '';
    }

    function timeProblem() {
      if (selectedTime) return '';
      if (dateProblem()) return '';   // the date is what to fix first
      return 'Choose one of the times shown.';
    }

    // an inline line under one input, tied to it by the aria-describedby
    // already in the markup; aria-invalid says the same thing to software
    function setFieldError(input, errEl, message) {
      if (errEl) {
        errEl.textContent = message || '';
        if (message) errEl.removeAttribute('hidden');
        else errEl.setAttribute('hidden', '');
      }
      if (input) {
        if (message) input.setAttribute('aria-invalid', 'true');
        else input.removeAttribute('aria-invalid');
      }
    }

    // A shown line must never outlive its problem, so clear any that the
    // patient has just fixed. This only ever removes a line: a half typed
    // name is not scolded mid word.
    function easeErrors() {
      if (nameInput && nameInput.getAttribute('aria-invalid') === 'true' && !nameProblem()) {
        setFieldError(nameInput, nameErr, '');
      }
      if (phoneInput && phoneInput.getAttribute('aria-invalid') === 'true' && !phoneProblem()) {
        setFieldError(phoneInput, phoneErr, '');
      }
    }

    // every problem the form currently has, in the order the fields appear
    function problems() {
      var list = [];
      var m = nameProblem();
      if (m) list.push({ href: '#bkName', message: m, target: function () { return nameInput; } });
      m = phoneProblem();
      if (m) list.push({ href: '#bkPhone', message: m, target: function () { return phoneInput; } });
      m = dateProblem();
      if (m) list.push({ href: '#bkDate', message: m, target: function () { return dateInput; } });
      m = timeProblem();
      if (m) list.push({ href: '#bkSlots', message: m, target: firstSlot });
      return list;
    }

    function fillSummary(list) {
      if (!summaryList) return;
      summaryList.innerHTML = '';
      list.forEach(function (p) {
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = p.href;
        a.textContent = p.message;
        on(a, 'click', function (e) {
          e.preventDefault();
          var el = p.target();
          if (el) { try { el.focus(); } catch (err) { /* nothing focusable */ } }
        });
        li.appendChild(a);
        summaryList.appendChild(li);
      });
    }

    function hideSummary() {
      if (summary) summary.setAttribute('hidden', '');
      if (summaryList) summaryList.innerHTML = '';
    }

    // While the summary is up it has to keep telling the truth, so rebuild
    // it from what is missing now and take it away once nothing is.
    function refreshSummary() {
      if (!summary || summary.hasAttribute('hidden')) return;
      var list = problems();
      if (!list.length) { hideSummary(); return; }
      var held = summary.contains(document.activeElement);
      fillSummary(list);
      if (held) { try { summary.focus(); } catch (e) { /* older browser */ } }
    }

    // A blocked Confirm is the one moment the patient needs the whole
    // picture: the inline lines and a summary that takes focus, with a link
    // per problem straight to the control that fixes it.
    function reportBlocked() {
      setFieldError(nameInput, nameErr, nameProblem());
      setFieldError(phoneInput, phoneErr, phoneProblem());
      var list = problems();
      if (!summary || !list.length) return;
      fillSummary(list);
      summary.removeAttribute('hidden');
      try { summary.focus(); } catch (e) { /* older browser */ }
    }

    function update() {
      if (sent) return;
      var branchEl = checked('bkBranch');
      var branch  = branchEl ? branchEl.value : 'New Cairo';
      var service = serviceSel ? serviceSel.value : 'Consultation';
      var dateVal = dateInput ? dateInput.value : '';
      var name    = nameInput ? nameInput.value.trim() : '';
      var phone   = phoneInput ? phoneInput.value.trim() : '';
      var online  = useSystem();   // this branch has its system endpoint wired

      if (sum.branch)  sum.branch.textContent  = branch;
      if (sum.name)    sum.name.textContent    = name  || 'Not set';
      if (sum.phone)   sum.phone.textContent   = phone || 'Not set';
      if (sum.service) sum.service.textContent = service;
      if (sum.date)    sum.date.textContent    = prettyDate(dateVal);
      if (sum.time)    sum.time.textContent    = selectedTime || 'Not set';

      // Online booking needs a phone so reception can call back; the WhatsApp
      // fallback keeps phone optional, since the chat carries the number.
      if (submitLabel) submitLabel.textContent = online ? 'Confirm booking' : 'Confirm via WhatsApp';
      if (waIcon) waIcon.style.display = online ? 'none' : '';   // no WhatsApp logo on 'Confirm booking'
      if (note) note.textContent = online
        ? 'We send your request straight to our ' + branch + ' reception, who call you back to confirm. Nothing is charged online.'
        : 'Your request opens in WhatsApp with every detail already filled in. Our team replies personally to confirm your slot; nothing is booked or charged automatically.';

      // whatever just changed, no shown message may still be lying
      easeErrors();
      refreshSummary();

      if (!submit) return;
      // The form marks the name Required and the summary asks for it, so the
      // gate has to agree: a booking with no name is not one reception can act
      // on, and promising a rule we do not enforce is worse than not asking.
      var ready = !!(dateVal && selectedTime && !nameProblem() && (!online || phoneValid()));
      submit.setAttribute('aria-disabled', ready ? 'false' : 'true');

      if (ready && !online) {
        // WhatsApp handoff (New Cairo, or Mohandseen before the sheet is wired)
        var wa = branchEl ? branchEl.getAttribute('data-wa') : '201000033766';
        var msg = 'Hello Soie Clinic! I would like to book an appointment.\n'
                + '• Branch: ' + branch + '\n'
                + (name  ? '• Name: '  + name  + '\n' : '')
                + (phone ? '• Phone: ' + phone + '\n' : '')
                + '• Treatment: ' + service + '\n'
                + '• Date: ' + prettyDate(dateVal) + '\n'
                + '• Time: ' + selectedTime;
        submit.href = 'https://wa.me/' + wa + '?text=' + encodeURIComponent(msg);
        submit.setAttribute('target', '_blank');
        // a real link again: the browser gives it focus and Enter for free
        submit.removeAttribute('role');
        submit.removeAttribute('tabindex');
      } else {
        // system submit is handled by the click listener; nothing to navigate to
        submit.removeAttribute('href');
        submit.removeAttribute('target');
        // An <a> with no href is neither focusable nor operable by keyboard,
        // so a patient using the keyboard or a screen reader could fill the
        // whole form and never reach Confirm. Make it a button in every sense
        // the markup allows; the keydown listener below supplies Enter and Space.
        submit.setAttribute('role', 'button');
        submit.setAttribute('tabindex', '0');
      }
    }

    // Post a Mohandseen booking to the reception sheet + email. Apps Script
    // web apps answer without CORS headers, so we send 'no-cors' (opaque
    // response) and confirm optimistically; the sheet and email are the
    // record of truth.
    // We cannot READ an opaque response, but we can still tell whether the
    // request left the device: fetch rejects when the network never carried
    // it. So a rejection is never dressed up as a confirmation. Anything
    // else, including a slow network, keeps the optimistic confirmation the
    // page has always shown.
    function confirmSent() {
      if (sent) return;
      sent = true;
      sending = false;
      hideSummary();
      setFieldError(nameInput, nameErr, '');
      setFieldError(phoneInput, phoneErr, '');
      if (note) note.hidden = true;
      if (done) done.hidden = false;
      if (submit) submit.style.display = 'none';
      // Confirm is now display:none, so focus would fall to the top of the
      // page and the confirmation would pass in silence. Put focus on it.
      if (done) {
        if (!done.hasAttribute('tabindex')) done.setAttribute('tabindex', '-1');
        try { done.focus(); } catch (e) { /* older browser */ }
      }
    }

    function sendFailed() {
      if (sent) return;
      sending = false;
      postFailed = true;             // useSystem() now offers WhatsApp instead
      if (done) done.hidden = true;  // nothing was confirmed, so nothing is claimed
      if (submit) submit.style.display = '';
      update();                      // rebuilds the WhatsApp link, label and note
      if (note) {
        note.hidden = false;
        note.textContent = 'We could not reach our booking system just now, so '
          + 'nothing has been sent yet. Please check your connection and try '
          + 'again, or tap the button above to send the same details to our '
          + 'reception on WhatsApp.';
        // the request state changed and nothing moved, so say so where the
        // patient is looking rather than repainting a paragraph in silence
        if (!note.hasAttribute('tabindex')) note.setAttribute('tabindex', '-1');
        try { note.focus(); } catch (e) { /* older browser */ }
      }
    }

    function sendToReception() {
      if (sent || sending) return;
      var payload = {
        action:      'saveWebBooking',
        branch:      currentBranch(),
        name:        nameInput ? nameInput.value.trim() : '',
        phone:       phoneInput ? phoneInput.value.trim() : '',
        service:     serviceSel ? serviceSel.value : 'Consultation',
        date:        dateInput ? dateInput.value : '',
        dateText:    prettyDate(dateInput ? dateInput.value : ''),
        time:        selectedTime,
        source:      'website',
        submittedAt: new Date().toISOString()
      };
      sending = true;
      var settled = false;
      function ok()   { if (settled) return; settled = true; confirmSent(); }
      function fail() { if (settled) return; settled = true; sendFailed(); }

      if (note) { note.hidden = false; note.textContent = 'Sending your request...'; }

      try {
        var post = fetch(branchEndpoint(), {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });
        if (post && post.then) {
          post.then(ok, fail);
          // A slow network is not a failure. If the request is still in the
          // air after a few seconds it has left the device, and the sheet is
          // the record of truth, so confirm rather than hold the patient.
          window.setTimeout(ok, 6000);
        } else { ok(); }
      } catch (e) { fail(); }   // no fetch at all, or it threw before sending
    }

    // pre-select the service passed from a treatment page. A Mohandseen-only
    // treatment (e.g. ?service=veneers) also switches the branch to match.
    try {
      var params = new URLSearchParams(window.location.search);
      var svcSlug = params.get('service');
      if (svcSlug && serviceSel) {
        var opt = serviceSel.querySelector('option[data-slug="' + svcSlug + '"]');
        if (opt) {
          var branchOnly = opt.getAttribute('data-branch');
          if (branchOnly) {
            var b = form.querySelector('input[name="bkBranch"][value="' + branchOnly + '"]');
            if (b) b.checked = true;
          }
          opt.selected = true;
        }
      }
    } catch (e) { /* URLSearchParams unsupported - defaults stay */ }

    syncServiceOptions();

    $$('input[name="bkBranch"]', form).forEach(function (r) {
      on(r, 'change', function () { syncServiceOptions(); update(); });
    });
    on(serviceSel, 'change', update);
    on(dateInput, 'change', buildSlots);
    on(nameInput, 'input', update);
    on(phoneInput, 'input', update);

    // Checked when the patient leaves the field, not on every keystroke and
    // not only at the end. Focus never moves on blur: they are on their way
    // to the next field and we do not pull them back.
    on(nameInput, 'blur', function () {
      setFieldError(nameInput, nameErr, nameProblem());
      refreshSummary();
    });
    on(phoneInput, 'blur', function () {
      setFieldError(phoneInput, phoneErr, phoneProblem());
      refreshSummary();
    });

    function activate(e) {
      if (submit.getAttribute('aria-disabled') === 'true') {
        e.preventDefault();
        reportBlocked();
        return;
      }
      if (useSystem()) {          // Mohandseen → website booking to the sheet
        e.preventDefault();
        sendToReception();
      }
      // otherwise the <a href="wa.me/…"> opens WhatsApp as before
    }

    on(submit, 'click', activate);
    on(submit, 'keydown', function (e) {
      // Only while it is standing in for a button. With a real href the
      // browser already handles Enter, and Space should scroll as usual.
      if (!submit || submit.hasAttribute('href')) return;
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();   // Space must not scroll the page out from under it
        activate(e);
      }
    });

    update();
  }

  /* =====================================================================
     16. FILMS - video[data-film] is a short, silent colour loop used as a
     page header background (its poster is the still it rests on). Nothing is
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
      if (s.loaded) return;
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
        if (s) load(s);
        obs.unobserve(en.target);
      });
    }, { rootMargin: '400px 0px', threshold: 0 });

    // observer B: play while on screen, pause when not. A band taller than the
    // viewport can never show 35% of itself, so filling half the screen counts too.
    var watch = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var s = stateOf(en.target);
        if (!s) return;
        var vh = window.innerHeight || document.documentElement.clientHeight || 0;
        var seen = en.isIntersecting && (en.intersectionRatio >= 0.35 ||
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
          bar.classList.toggle('is-up', !entries[0].isIntersecting);
        }, { threshold: 0 }).observe(hero);
      } else {
        bar.classList.add('is-up');
      }
    }
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
    safe(initReveals, 'reveals');
    safe(initCounters, 'counters');
    safe(initHeroVideo, 'hero video');
    safe(initParallax, 'parallax');
    safe(initCursor, 'cursor');
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
    safe(initBooking, 'booking');
    safe(initFilms, 'films');
    safe(initSilk, 'silk');
  });
})();
