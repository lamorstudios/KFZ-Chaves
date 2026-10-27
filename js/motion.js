(function () {
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  var hasSplit = !!window.SplitText;
  if (hasSplit) gsap.registerPlugin(SplitText);

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer: fine)').matches;
  var desktop = window.matchMedia('(min-width: 900px)').matches;
  var EASE = 'expo.out';
  var done = new WeakSet();

  function $(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function once(el) { if (!el || done.has(el)) return false; done.add(el); return true; }

  /* Alte, einfache Einblendungen der Seite abschalten, damit nichts doppelt animiert */
  function killLegacy() {
    try { if (typeof observer !== 'undefined' && observer.disconnect) observer.disconnect(); } catch (e) {}
    $('#page-start .bento-card,#page-start .review-card,#page-start .blog-card,#page-start .faq-item,#page-start .usp-item,#page-start .phil-grid').forEach(function (el) {
      el.style.opacity = ''; el.style.transform = ''; el.style.transition = '';
    });
    $('.reveal-h').forEach(function (h) { h.classList.remove('reveal-h'); h.classList.add('in'); });
  }

  if (reduce) { document.addEventListener('DOMContentLoaded', killLegacy); return; }

  /* ---------- Bausteine ---------- */
  function st(trigger, start) { return { trigger: trigger, start: start || 'top 86%', once: true }; }

  function splitLines(el) {
    if (!hasSplit) return null;
    try { return SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'm-line', autoSplit: false }); } catch (e) { return null; }
  }

  function headline(h) {
    if (!once(h)) return;
    var sp = splitLines(h);
    if (sp && sp.lines.length) {
      gsap.from(sp.lines, { yPercent: 115, rotate: 2.5, duration: 1.25, ease: EASE, stagger: 0.11, scrollTrigger: st(h, 'top 88%'),
        onComplete: function () { try { sp.revert(); } catch (e) {} } });
    } else {
      gsap.from(h, { y: 40, opacity: 0, duration: 1.1, ease: EASE, scrollTrigger: st(h) });
    }
  }

  function eyebrow(el) {
    if (!once(el)) return;
    gsap.fromTo(el, { clipPath: 'inset(0 100% 0 0)', x: -12 }, { clipPath: 'inset(0 0% 0 0)', x: 0, duration: 1.1, ease: 'power4.out', scrollTrigger: st(el, 'top 90%'), clearProps: 'clipPath,transform' });
  }

  function rise(els, opts) {
    els = els.filter(once);
    if (!els.length) return;
    opts = opts || {};
    gsap.from(els, Object.assign({ y: 50, opacity: 0, duration: 1.1, ease: EASE, stagger: 0.08, clearProps: 'transform,opacity', scrollTrigger: st(opts.trigger || els[0], opts.start) }, opts.vars || {}));
  }

  /* Line-Icons zeichnen sich selbst */
  function drawIcons(root, trigger) {
    var shapes = $('svg.ico path, svg.ico circle, svg.ico rect, svg.ico polygon', root);
    if (!shapes.length) return;
    shapes.forEach(function (p) { p.setAttribute('pathLength', '1'); p.style.strokeDasharray = '1'; p.style.strokeDashoffset = '1'; });
    gsap.to(shapes, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut', stagger: 0.03, scrollTrigger: st(trigger || root, 'top 85%'),
      onComplete: function () { shapes.forEach(function (p) { p.style.strokeDasharray = ''; p.style.strokeDashoffset = ''; }); } });
  }

  /* Bild-Reveal: Maske öffnet sich, Bild zoomt zurück */
  function imageReveal(box, delay) {
    if (!once(box)) return;
    var img = box.querySelector('img');
    var tl = gsap.timeline({ scrollTrigger: st(box, 'top 88%'), delay: delay || 0 });
    tl.fromTo(box, { clipPath: 'inset(18% 12% 18% 12% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 1.5, ease: 'expo.inOut', clearProps: 'clipPath' });
    if (img) tl.fromTo(img, { scale: 1.35 }, { scale: 1, duration: 1.8, ease: 'expo.out', clearProps: 'transform' }, 0);
    if (img && desktop) {
      gsap.fromTo(img, { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: box, start: 'top bottom', end: 'bottom top', scrub: true } });
    }
  }

  /* 3D-Kippen der Karten mit der Maus */
  function tilt(card, max) {
    if (!fine || card.dataset.tilt) return;
    card.dataset.tilt = '1';
    max = max || 6;
    gsap.set(card, { transformPerspective: 900 });
    var rx = gsap.quickTo(card, 'rotationX', { duration: 0.6, ease: 'power3.out' });
    var ry = gsap.quickTo(card, 'rotationY', { duration: 0.6, ease: 'power3.out' });
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      ry(px * max); rx(-py * max);
    });
    card.addEventListener('pointerleave', function () { rx(0); ry(0); });
  }

  /* Magnetische Buttons */
  function magnetic(btn) {
    if (!fine || btn.dataset.mag) return;
    btn.dataset.mag = '1';
    var xTo = gsap.quickTo(btn, 'x', { duration: 0.5, ease: 'power3.out' });
    var yTo = gsap.quickTo(btn, 'y', { duration: 0.5, ease: 'power3.out' });
    btn.addEventListener('pointermove', function (e) {
      var r = btn.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * 0.28); yTo((e.clientY - r.top - r.height / 2) * 0.38);
    });
    btn.addEventListener('pointerleave', function () { xTo(0); yTo(0); });
  }

  /* ---------- Hero ---------- */
  function heroIntro() {
    var hero = document.querySelector('#page-start .hero');
    if (!hero || !once(hero)) return;
    var h1 = hero.querySelector('h1');
    var tl = gsap.timeline({ defaults: { ease: EASE } });
    var canvas = hero.querySelector('.hero-canvas');
    if (canvas) tl.from(canvas, { opacity: 0, scale: 1.12, duration: 2.2, ease: 'power2.out' }, 0);
    tl.from(hero.querySelector('.hero-eyebrow'), { y: 24, opacity: 0, filter: 'blur(6px)', duration: 1, clearProps: 'filter' }, 0.15);
    if (h1 && hasSplit) {
      var sp = SplitText.create(h1, { type: 'words,chars', charsClass: 'm-char' });
      gsap.set(h1, { perspective: 700 });
      tl.from(sp.chars, { yPercent: 105, rotationX: -85, opacity: 0, transformOrigin: '50% 100% -30px', duration: 1.3, stagger: 0.022 }, 0.25)
        .add(function () { try { sp.revert(); } catch (e) {} });
    } else if (h1) {
      tl.from(h1, { y: 40, opacity: 0, duration: 1.2 }, 0.25);
    }
    var sub = hero.querySelector('.hero-sub');
    if (sub) {
      var ss = splitLines(sub);
      tl.from(ss ? ss.lines : sub, { yPercent: ss ? 110 : 0, y: ss ? 0 : 20, opacity: ss ? 1 : 0, duration: 1.1, stagger: 0.08,
        onComplete: function () { if (ss) try { ss.revert(); } catch (e) {} } }, 0.8);
    }
    tl.from($('.hero-actions > *', hero), { y: 30, opacity: 0, scale: 0.94, duration: 1, stagger: 0.1, clearProps: 'transform,opacity' }, 1.0);
    var strip = document.querySelector('#page-start .contact-strip');
    if (strip) tl.from(strip, { yPercent: 100, opacity: 0, duration: 1.1, clearProps: 'transform,opacity' }, 1.1);

    /* Beim Runterscrollen: Inhalt gleitet weg, Hintergrund taucht tiefer */
    var content = hero.querySelector('.hero-content');
    gsap.to(content, { y: -110, scale: 0.94, opacity: 0.15, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 } });
    if (canvas) gsap.to(canvas, { scale: 1.18, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 } });
  }

  /* ---------- Startseite ---------- */
  function startPage(root) {
    var phil = root.querySelector('.phil-grid');
    if (phil) {
      rise($('.lead', phil), { trigger: phil, vars: { y: 30 } });
      rise($('.badge', phil), { trigger: phil, start: 'top 70%', vars: { y: 16, scale: 0.85, stagger: 0.07, ease: 'back.out(2)' } });
      rise($('.phil-link-btn', phil), { trigger: phil, start: 'top 65%' });
      var pimg = phil.querySelector('.phil-img'); if (pimg) imageReveal(pimg, 0.1);
    }

    var cs = root.querySelector('.counter-strip');
    if (cs && once(cs)) {
      gsap.from($('.counter-item', cs), { y: 40, opacity: 0, filter: 'blur(8px)', duration: 1.2, ease: EASE, stagger: 0.12, clearProps: 'filter,transform,opacity', scrollTrigger: st(cs, 'top 85%') });
      var sweep = document.createElement('div'); sweep.className = 'm-sweep'; cs.appendChild(sweep);
      gsap.fromTo(sweep, { xPercent: -100 }, { xPercent: 260, duration: 2.2, ease: 'power2.inOut', scrollTrigger: st(cs, 'top 75%') });
    }

    $('.mosaic-item', root).forEach(function (m, i) { imageReveal(m, i * 0.08); });

    var bento = root.querySelector('.bento');
    if (bento) {
      gsap.set(bento, { perspective: 1200 });
      var cards = $('.bento-card', bento).filter(once);
      gsap.from(cards, { y: 90, rotationX: 14, opacity: 0, transformOrigin: '50% 0%', duration: 1.3, ease: EASE, stagger: 0.09, clearProps: 'transform,opacity', scrollTrigger: st(bento, 'top 85%') });
      drawIcons(bento, bento);
      cards.forEach(function (c) { tilt(c, 5); });
    }

    $('.quickcalc, .maint-checker', root).forEach(function (box) {
      if (!once(box)) return;
      var tl = gsap.timeline({ scrollTrigger: st(box, 'top 85%') });
      tl.from(box, { y: 60, scale: 0.94, opacity: 0, duration: 1.2, ease: EASE, clearProps: 'transform,opacity' })
        .from($('h3, p, .qc-field, .mc-field, .field, button, label', box).slice(0, 14), { y: 18, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.05, clearProps: 'transform,opacity' }, 0.35);
    });

    var usp = root.querySelector('.usp-strip');
    if (usp) {
      rise($('.usp-item', usp), { trigger: usp, vars: { y: 60, stagger: 0.12 } });
      drawIcons(usp, usp);
    }

    var rg = root.querySelector('.reviews-grid');
    if (rg) {
      var rc = $('.review-card', rg).filter(once);
      gsap.from(rc, { y: 70, opacity: 0, scale: 0.94, rotation: function (i) { return i % 2 ? 1.5 : -1.5; }, duration: 1.2, ease: EASE,
        stagger: { each: 0.08, grid: 'auto', from: 'start' }, clearProps: 'transform,opacity', scrollTrigger: st(rg, 'top 85%') });
      $('.review-stars, .stars', rg).forEach(function (s) { gsap.from(s, { scale: 0.4, opacity: 0, duration: 0.7, ease: 'back.out(3)', scrollTrigger: st(rg, 'top 70%') }); });
    }

    var faq = root.querySelector('.faq-list');
    if (faq) rise($('.faq-item', faq), { trigger: faq, vars: { x: -40, y: 0, stagger: 0.06 } });

    var rb = root.querySelector('.referral-banner');
    if (rb && once(rb)) {
      var tl2 = gsap.timeline({ scrollTrigger: st(rb, 'top 85%') });
      tl2.fromTo(rb, { clipPath: desktop ? 'inset(10% 40% 10% 40% round 60px)' : 'inset(14% 6% 14% 6% round 40px)' }, { clipPath: 'inset(0% 0% 0% 0% round 28px)', duration: 1.4, ease: 'expo.inOut', clearProps: 'clipPath' })
         .from(rb.children, { y: 30, opacity: 0, duration: 1, ease: EASE, stagger: 0.12, clearProps: 'transform,opacity' }, 0.6);
    }

    var pr = root.querySelector('.partner-row');
    if (pr) {
      rise($('img', pr), { trigger: pr, vars: { y: 30, scale: 0.6, ease: 'back.out(2.2)', stagger: 0.15 } });
      $('img', pr).forEach(function (im, i) { gsap.to(im, { y: -6, duration: 2.4 + i * 0.4, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.5 }); });
    }

    var rec = root.querySelector('.recruiting-grid');
    if (rec) {
      var card = rec.querySelector('.recruiting-card');
      if (card && once(card)) {
        gsap.from(card, { x: desktop ? 80 : 0, y: desktop ? 0 : 50, rotationY: desktop ? -12 : 0, transformPerspective: 1000, opacity: 0, duration: 1.4, ease: EASE, clearProps: 'transform,opacity', scrollTrigger: st(rec, 'top 80%') });
        rise($('.recruiting-list > *', card), { trigger: rec, start: 'top 70%', vars: { x: 30, y: 0, stagger: 0.08 } });
        drawIcons(card, rec);
        tilt(card, 4);
      }
      rise($('.recruiting-content > *:not(h2):not(.eyebrow)', rec), { trigger: rec, vars: { y: 24 } });
    }

    var nl = root.querySelector('.newsletter-wrap');
    if (nl) rise($('.newsletter-wrap > *:not(h2):not(.eyebrow)', root), { trigger: nl, vars: { y: 24 } });
  }

  /* ---------- Unterseiten ---------- */
  function subPage(root) {
    var ph = root.querySelector('.page-hero, .detail-hero');
    if (ph && once(ph)) {
      var bg = ph.querySelector('.page-hero-bg');
      if (bg) {
        gsap.fromTo(bg, { scale: 1.25 }, { scale: 1, duration: 2.2, ease: 'expo.out' });
        gsap.to(bg, { yPercent: 18, ease: 'none', scrollTrigger: { trigger: ph, start: 'top top', end: 'bottom top', scrub: true } });
      }
      var h1 = ph.querySelector('h1');
      if (h1 && hasSplit) {
        var sp = SplitText.create(h1, { type: 'words,chars', charsClass: 'm-char' });
        gsap.set(h1, { perspective: 700 });
        gsap.from(sp.chars, { yPercent: 100, rotationX: -80, opacity: 0, transformOrigin: '50% 100% -30px', duration: 1.1, ease: EASE, stagger: 0.018, delay: 0.1, onComplete: function () { try { sp.revert(); } catch (e) {} } });
      }
      gsap.from($('p, .eyebrow, span.eyebrow', ph), { y: 20, opacity: 0, duration: 1, ease: EASE, delay: 0.5, stagger: 0.1, clearProps: 'transform,opacity' });
    }
    $('.service-card', root).forEach(function (c) { tilt(c, 5); });
    rise($('.service-card', root), { vars: { y: 70, stagger: 0.1 } });
    var rows = $('.service-row', root);
    if (rows.length) { rise(rows, { trigger: rows[0], vars: { x: -30, y: 0, stagger: 0.06 } }); drawIcons(rows[0].parentElement, rows[0]); }
    rise($('.pillar', root), { vars: { y: 50, scale: 0.92, stagger: 0.08 } });
    $('.pillar', root).forEach(function (p) { drawIcons(p, p); tilt(p, 6); });
    rise($('.blog-card', root), { vars: { y: 60, stagger: 0.08 } });
    $('.blog-card', root).forEach(function (b) { tilt(b, 4); });
    $('.about-text-block p, .legal-wrap > *', root).slice(0, 30).forEach(function (p) { rise([p], { vars: { y: 24, duration: 0.9 } }); });
    $('img', root).forEach(function (im) {
      var box = im.parentElement;
      if (box && !box.closest('.blog-card, .service-card, .bento-card, .mosaic-item, .phil-img, nav, footer, .partner-row') && box.getBoundingClientRect().width > 200) imageReveal(box);
    });
  }

  /* ---------- Gemeinsam für jede Seite ---------- */
  function common(root) {
    $('h2.display', root).forEach(headline);
    $('.eyebrow', root).forEach(function (e) { if (!e.closest('.hero, .page-hero, .detail-hero')) eyebrow(e); });
    $('.sec .lead', root).forEach(function (l) { if (!l.closest('.phil-grid')) rise([l], { vars: { y: 26 } }); });
    $('.btn-blue, .btn-ghost, .rb-btn, .nl-btn', root).forEach(magnetic);
  }

  function footerAnim() {
    var f = document.getElementById('site-footer');
    if (!f || !once(f)) return;
    rise($('.footer-brand > *, .footer-col > *', f), { trigger: f, start: 'top 92%', vars: { y: 30, stagger: 0.06 } });
  }

  function initPage(pg) {
    if (!pg || pg.dataset.motion) return;
    pg.dataset.motion = '1';
    common(pg);
    if (pg.id === 'page-start') { heroIntro(); startPage(pg); } else subPage(pg);
    footerAnim();
    ScrollTrigger.refresh();
  }

  /* Fortschrittsbalken oben */
  function progressBar() {
    var bar = document.createElement('div'); bar.className = 'm-progress'; document.body.appendChild(bar);
    gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });
  }

  /* Seitenwechsel mit weichem Übergang */
  function wrapShowPage() {
    if (typeof window.showPage !== 'function' || window.showPage._m) return;
    var orig = window.showPage;
    var veil = document.createElement('div'); veil.className = 'm-veil'; document.body.appendChild(veil);
    var busy = false;
    var wrapped = function (n) {
      var target = document.getElementById('page-' + n);
      var current = document.querySelector('.page.active');
      if (busy || !target || target === current) { orig(n); ScrollTrigger.refresh(); return; }
      busy = true;
      gsap.timeline({ onComplete: function () { busy = false; } })
        .set(veil, { display: 'block', transformOrigin: '50% 100%' })
        .fromTo(veil, { scaleY: 0 }, { scaleY: 1, duration: 0.45, ease: 'power4.in' })
        .add(function () {
          orig(n);
          window.scrollTo(0, 0);
          initPage(target);
          ScrollTrigger.refresh();
        })
        .set(veil, { transformOrigin: '50% 0%' })
        .to(veil, { scaleY: 0, duration: 0.6, ease: 'power4.out' })
        .set(veil, { display: 'none' });
    };
    wrapped._m = true;
    window.showPage = wrapped;
    try { showPage = wrapped; } catch (e) {}
  }

  function boot() {
    killLegacy();
    progressBar();
    wrapShowPage();
    initPage(document.querySelector('.page.active') || document.getElementById('page-start'));
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
