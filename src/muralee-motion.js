/*! MURALEE site motion v0.1.1. Copyright 2026 MURALEE LIMITED. All rights reserved. Assumes window.gsap and ScrollTrigger (Webflow site settings, GSAP enabled)
   and window.Lenis (loaded before this file). Honours prefers-reduced-motion; never hijacks touch.
   Hooks are data-m attributes so Webflow class renames do not break anything. */
(function () {
  'use strict';
  var d = document, H = d.documentElement, W = window;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var m = function (k, c) { return $$('[data-m~="' + k + '"]', c); };
  var m1 = function (k, c) { return $('[data-m~="' + k + '"]', c); };
  var RM = W.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = W.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var EASE = 'cubic-bezier(.23,1,.32,1)', EXPO = 'cubic-bezier(.16,1,.3,1)';
  var G = W.gsap, ST = W.ScrollTrigger, hasG = !!(G && ST);
  var FLAT = RM || !hasG;
  H.classList.add(FLAT ? 'is-flat' : 'js-motion');
  if (!FLAT) H.classList.add('js-motion');
  var rem = function () { return parseFloat(getComputedStyle(H).fontSize); };
  var isMob = function () { return W.innerWidth < 1200; };
  var anim = function (el, kf, o) { return el.animate ? el.animate(kf, o) : null; };

  /* ---------- Smooth scroll: Lenis on wheel only (syncTouch off, touch stays native) ---------- */
  var lenis = null;
  if (hasG) G.registerPlugin(ST);
  if (!FLAT && W.Lenis) {
    lenis = new W.Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: false, wheelMultiplier: 1 });
    lenis.on('scroll', ST.update);
    G.ticker.add(function (t) { lenis.raf(t * 1000); });
    G.ticker.lagSmoothing(0);
  }
  var sy = function () { return lenis ? lenis.scroll : W.scrollY; };
  var stopScroll = function (on) { if (lenis) { on ? lenis.stop() : lenis.start(); } d.body.classList.toggle('no-scroll', on); };

  /* ---------- Page dim (menu and region panel): opacity .1, scale .95 ---------- */
  var page = m1('page');
  function dim(on) {
    if (!page) return;
    page.style.transformOrigin = '50% ' + (sy() + W.innerHeight / 2) + 'px';
    if (FLAT) { page.style.opacity = on ? 0.1 : ''; return; }
    var cs = getComputedStyle(page);
    anim(page, [{ opacity: cs.opacity }, { opacity: on ? 0.1 : 1 }], { duration: 300, delay: on ? 0 : 100, easing: EASE, fill: 'forwards' });
    anim(page, [{ transform: cs.transform === 'none' ? 'none' : cs.transform }, { transform: on ? 'scale(.95)' : 'none' }], { duration: on ? 1200 : 800, easing: EXPO, fill: 'forwards' });
  }

  /* ---------- Menu below 1200: panel rows, focus trap, Escape ---------- */
  var tog = m1('menu-toggle'), menu = m1('menu'), overlay = m1('overlay');
  var regTog = m1('region-toggle'), regPanel = m1('region-panel');
  var menuOpen = false, regOpen = false;
  var rows = function () { return menu ? $$('.nav_link, .nav_social-link', menu) : []; };
  function focusables() { return [tog].concat(rows()).filter(Boolean); }
  function openMenu() {
    if (!menu || !isMob()) return;
    if (regOpen) closeRegions(true);
    menuOpen = true; tog.setAttribute('aria-expanded', 'true'); menu.classList.add('is-open');
    if (overlay) overlay.classList.add('is-on'); stopScroll(true);
    rows().forEach(function (it, i) {
      it.style.visibility = 'visible';
      if (FLAT) { it.style.opacity = 1; return; }
      anim(it, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: i * 35, easing: EASE, fill: 'forwards' });
      anim(it, [{ transform: 'translateY(100%) scale(1.03)' }, { transform: 'none' }], { duration: 800, delay: i * 35, easing: EXPO, fill: 'both' });
    });
    dim(true);
    setTimeout(function () { var f = rows()[0]; if (f) f.focus(); }, 60);
  }
  function closeMenu(keepDim, noFocus) {
    if (!menuOpen) return;
    menuOpen = false; tog.setAttribute('aria-expanded', 'false'); menu.classList.remove('is-open');
    if (overlay) overlay.classList.remove('is-on'); stopScroll(false);
    rows().forEach(function (it) {
      it.getAnimations && it.getAnimations().forEach(function (a) { a.cancel(); });
      it.style.opacity = ''; it.style.visibility = '';
    });
    if (!keepDim) dim(false);
    if (!noFocus) tog.focus();
  }
  if (tog) tog.addEventListener('click', function () { menuOpen ? closeMenu() : openMenu(); });
  function openRegions() {
    if (!regPanel) return;
    if (menuOpen) closeMenu(true, true);
    regOpen = true; regTog.setAttribute('aria-expanded', 'true'); regPanel.classList.add('is-open');
    if (overlay) overlay.classList.add('is-on'); stopScroll(true); dim(true);
  }
  function closeRegions(keepDim) {
    if (!regOpen) return;
    regOpen = false; regTog.setAttribute('aria-expanded', 'false'); regPanel.classList.remove('is-open');
    if (overlay) overlay.classList.remove('is-on'); stopScroll(false); if (!keepDim) dim(false);
  }
  if (regTog) regTog.addEventListener('click', function () { regOpen ? closeRegions() : openRegions(); });
  if (overlay) overlay.addEventListener('click', function () { closeRegions(); closeMenu(); });
  d.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { if (regOpen) { closeRegions(); regTog.focus(); } if (menuOpen) closeMenu(); }
    if (e.key === 'Tab' && menuOpen) {
      var f = focusables(), i = f.indexOf(d.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });
  W.addEventListener('resize', function () { if (!isMob() && menuOpen) closeMenu(false, true); });

  /* ---------- Current page dot and header notch (1200 and up) ---------- */
  var navLinks = m('nav').filter(function (a) { return !a.closest('.is-mobile-only'); });
  var path = location.pathname.replace(/\/$/, '') || '/';
  var activeIdx = -1;
  m('nav').forEach(function (a) {
    var h = (a.getAttribute('href') || '').replace(/\/$/, '');
    if (h && h !== '/' && h.charAt(0) === '/' && (path === h || path.indexOf(h + '/') === 0)) {
      a.setAttribute('aria-current', 'page');
      var k = navLinks.indexOf(a); if (k > -1) activeIdx = k;
    }
  });
  var shape = m1('notch'), strip = shape && $('.header_shape-top', shape);
  var hl = shape && $('.header_shape-l', shape), hr = shape && $('.header_shape-r', shape);
  if (shape && strip && navLinks.length) {
    var hoverIdx = -1;
    var bounds = function (i) { var sb = strip.getBoundingClientRect(), r = navLinks[i].getBoundingClientRect(), R = rem(); return { L: r.left - sb.left - R, Rt: sb.width - (r.right - sb.left + R), W: sb.width }; };
    var cls = function (instant, leave) { shape.classList.toggle('is-instant', !!instant); shape.classList.toggle('is-leave', !!leave); };
    var settle = function (instant) { if (instant) { void shape.offsetWidth; shape.classList.remove('is-instant'); } };
    var setNotch = function (i, instant, leave) { if (isMob()) return; var b = bounds(i); cls(instant, leave); hl.style.width = b.L + 'px'; hr.style.width = b.Rt + 'px'; settle(instant); };
    var collapseAt = function (i, instant, leave) { var b = bounds(i), t = b.W - b.Rt - b.L; cls(instant, leave); hl.style.width = (b.L + t / 2) + 'px'; hr.style.width = (b.Rt + t / 2) + 'px'; settle(instant); };
    var sync = function () { if (isMob()) return; if (activeIdx > -1) setNotch(activeIdx, true); else { hl.style.width = '0px'; hr.style.width = '100%'; } };
    navLinks.forEach(function (a, i) {
      var enter = function () { if (isMob()) return; if (hoverIdx < 0 && activeIdx < 0) collapseAt(i, true); hoverIdx = i; setNotch(i); };
      a.addEventListener('mouseenter', enter); a.addEventListener('focus', enter);
    });
    var leave = function () { if (isMob()) return; if (activeIdx > -1) setNotch(activeIdx); else if (hoverIdx > -1) collapseAt(hoverIdx, false, true); hoverIdx = -1; };
    $('.nav_list', menu).addEventListener('mouseleave', leave);
    menu.addEventListener('focusout', function (e) { if (!menu.contains(e.relatedTarget)) leave(); });
    W.addEventListener('resize', sync);
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(sync); else sync();
  }

  /* ---------- Coordinates roll (first visit per session only) ---------- */
  var coords = m1('coords');
  if (coords) {
    $$('.coords_group', coords).forEach(function (g) {
      g.innerHTML = g.textContent.split('').map(function (ch) { return '<span class="coords_char"><span>' + ch + '</span></span>'; }).join('');
    });
    var seen = false; try { seen = sessionStorage.getItem('mur_coords') === '1'; sessionStorage.setItem('mur_coords', '1'); } catch (e) { }
    if (!FLAT && !seen) $$('.coords_char>span', coords).forEach(function (el, i) {
      var a = anim(el, [{ transform: 'translateY(100%)' }, { transform: 'none' }], { duration: 600, delay: 900 + i * 28, easing: EASE, fill: 'both' });
      if (a) a.onfinish = function () { a.cancel(); };
    });
  }

  /* ---------- Fade ups ---------- */
  var fades = m('fade');
  if (FLAT || !('IntersectionObserver' in W)) fades.forEach(function (el) { el.classList.add('is-in'); });
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }); }, { threshold: 0.12 });
    fades.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Hover play tiles: fine pointer with hover only. Touch gets the poster. ---------- */
  if (FINE && !RM) m('tile').forEach(function (t) {
    var src = t.getAttribute('data-preview'); if (!src) return;
    var v = null;
    t.addEventListener('mouseenter', function () {
      if (W.innerWidth < 768) return;
      if (!v) { v = d.createElement('video'); v.className = 'tile_video'; v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'none'; v.setAttribute('aria-hidden', 'true'); v.src = src; $('.tile_media', t).appendChild(v); }
      var p = v.play(); if (p && p.catch) p.catch(function () { });
      t.classList.add('is-playing');
    });
    t.addEventListener('mouseleave', function () { t.classList.remove('is-playing'); if (v) v.pause(); });
  });

  /* ---------- Filters (Work, Journal) and Studio lists: aria-pressed buttons ---------- */
  m('filter').forEach(function (bar) {
    var scope = bar.closest('main') || d;
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      $$('button', bar).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      var f = b.getAttribute('data-filter'), l = b.getAttribute('data-list');
      if (f) $$('[data-category]', scope).forEach(function (it) { it.classList.toggle('is-hidden', !(f === 'all' || it.getAttribute('data-category') === f)); });
      if (l) $$('.list_names', scope).forEach(function (n) { var on = n.getAttribute('data-list') === l; n.hidden = !on; n.classList.toggle('is-active', on); });
      if (hasG) ST.refresh();
    });
  });
  var lp = m1('list-panel');
  if (lp && FINE) m('list-name', lp).forEach(function (a) {
    a.addEventListener('mouseenter', function () { if (isMob()) return; lp.classList.add('is-hover'); m('list-name', lp).forEach(function (x) { x.classList.toggle('is-on', x === a); }); });
    a.addEventListener('mouseleave', function () { lp.classList.remove('is-hover'); });
  });

  /* ---------- Booking: one short form (Start page and Home), inline errors, Calendly secondary ---------- */
  m('booking-form').forEach(function (form) {
    form.setAttribute('novalidate', '');
    var fields = $$('input, select, textarea', form).filter(function (f) { return f.type !== 'submit' && f.type !== 'hidden'; });
    var errFor = function (f) { var id = (f.getAttribute('aria-describedby') || '').split(' ').filter(function (x) { return /-err$/.test(x); })[0]; return id ? d.getElementById(id) : null; };
    var check = function (f) {
      var ok = f.checkValidity(), er = errFor(f);
      if (ok) f.removeAttribute('aria-invalid'); else f.setAttribute('aria-invalid', 'true');
      if (er) er.hidden = ok;
      return ok;
    };
    fields.forEach(function (f) {
      f.addEventListener('blur', function () { if (f.hasAttribute('aria-invalid') || f.value) check(f); });
      f.addEventListener('input', function () { if (f.hasAttribute('aria-invalid')) check(f); });
      f.addEventListener('change', function () { if (f.hasAttribute('aria-invalid')) check(f); });
    });
    /* capture phase so invalid submits never reach Webflow's handler */
    form.addEventListener('submit', function (e) {
      var bad = fields.filter(function (f) { return !check(f); });
      if (bad.length) { e.preventDefault(); e.stopImmediatePropagation(); bad[0].focus(); return; }
      var wrap = form.closest('.w-form'), done = wrap && $('.w-form-done', wrap);
      if (done) { var mo = new MutationObserver(function () { if (getComputedStyle(done).display !== 'none') { mo.disconnect(); done.setAttribute('tabindex', '-1'); done.focus({ preventScroll: true }); } }); mo.observe(done, { attributes: true, attributeFilter: ['style'] }); }
    }, true);
  });
  /* Calendly stays secondary: only loads after an explicit click */
  m('calendly-consent').forEach(function (consent) {
    consent.addEventListener('click', function (e) {
      var c = m1('calendly'); if (!c) return;
      var url = c.getAttribute('data-calendly-url') || c.getAttribute('data-calendly-base') || '';
      e.preventDefault();
      if (!url || /LINK_TBC/.test(url)) { consent.textContent = 'Calendly link coming soon'; return; }
      c.innerHTML = '<div class="calendly-inline-widget" data-url="' + url.replace(/"/g, '&quot;') + '" style="min-width:320px;height:660px;width:100%"></div>';
      var sc = d.createElement('script'); sc.src = 'https://assets.calendly.com/assets/external/widget.js'; sc.async = true; d.body.appendChild(sc);
    });
  });

  /* ---------- Page wipe: exit on internal link click, enter on load ---------- */
  var pels = m('pel');
  function enter(delay) {
    if (FLAT) return;
    var mob = isMob(), Hh = W.innerHeight;
    pels.forEach(function (el, i) {
      /* individual translate and scale so GSAP transforms on the same slab are never read mid wipe */
      var a = anim(el, [{ translate: '0 ' + Hh + 'px', scale: String(mob ? 1 : 1.03) }, { translate: '0 0', scale: '1' }], { duration: mob ? 700 : 875, delay: delay + i * 40, easing: EXPO, fill: 'both' });
      if (a) a.onfinish = function () { a.cancel(); };
    });
    var hd = m1('header'); if (hd) anim(hd, [{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay: 300, easing: EASE, fill: 'both' });
  }
  enter(150);
  W.addEventListener('pageshow', function (e) { if (e.persisted && page) { page.style.opacity = ''; page.style.transform = ''; } });
  d.addEventListener('click', function (e) {
    if (FLAT || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest('a[href]'); if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
    var u = new URL(a.href, location.href);
    if (u.origin !== location.origin || u.protocol.indexOf('http') !== 0) return;
    if (u.pathname === location.pathname && u.hash) return;
    if (u.href === location.href) { e.preventDefault(); closeMenu(); return; }
    e.preventDefault(); closeMenu(true, true); closeRegions(true);
    if (page) {
      page.style.transformOrigin = '50% ' + (sy() + W.innerHeight / 2) + 'px';
      anim(page, [{ transform: 'none' }, { transform: 'scale(.97)' }], { duration: 1000, easing: EXPO, fill: 'forwards' });
      anim(page, [{ opacity: 1 }, { opacity: 0 }], { duration: isMob() ? 250 : 370, easing: EASE, fill: 'forwards' });
    }
    setTimeout(function () { location.href = u.href; }, isMob() ? 250 : 370);
  });

  /* ---------- Home: stacked slabs, reel frame, work pin, curtains, depth, snap ---------- */
  var stack = m1('stack'), ctx = null, zones = [], NAT = [];
  function frameSize() {
    var frame = m1('reel-frame'); if (!frame) return;
    var R = rem(), vh = W.innerHeight, AV = vh - R * 6.2 - R, rs = frame.parentNode, Wd = rs.clientWidth, mob = W.innerWidth < 768;
    var S = mob ? Wd - 3 * R : Math.min(AV * 0.74, Wd * 0.42);
    if (!FLAT) { frame.style.width = frame.style.height = S + 'px'; frame.style.margin = (-S / 2) + 'px 0 0 ' + (-S / 2) + 'px'; }
    return { S: S, W: Wd, AV: AV };
  }
  function kill() {
    if (ctx) { ctx.revert(); ctx = null; } zones = [];
    if (stack) m('slab', stack).forEach(function (s) { s.style.visibility = ''; s.style.zIndex = ''; s.style.position = ''; s.style.top = ''; s.style.height = ''; });
  }
  function build() {
    kill(); if (!stack) return;
    var fs = frameSize(); if (FLAT) return;
    var R = rem(), vh = W.innerHeight, TOP = R * 6.2, PAD = R, AV = vh - TOP - PAD, mob = W.innerWidth < 768;
    H.style.setProperty('--vh', vh + 'px');
    var slabs = m('slab', stack).filter(function (s) { return s.parentNode === stack; });
    var reel = m1('reel', stack), hw = m1('work', stack), track = m1('work-track', stack), vp = m1('work-viewport', stack), frame = m1('reel-frame', stack);
    if (reel) reel.style.height = (AV + vh * (mob ? 1.1 : 1.5)) + 'px';
    var dist = 0;
    if (hw && track && vp) { if (!mob) { dist = Math.max(0, track.scrollWidth - vp.clientWidth); hw.style.height = (AV + dist) + 'px'; } else hw.style.height = ''; }
    var CH = vh * (mob ? 0.9 : 1);
    $$('[data-chapter]', stack).forEach(function (c) { c.style.height = (AV + CH) + 'px'; });
    slabs.forEach(function (s) { s.style.position = 'relative'; s.style.top = 'auto'; });
    var off = function (el) { return el.getBoundingClientRect().top + sy(); };
    var nat = slabs.map(function (s) { return { top: off(s), h: s.offsetHeight }; });
    NAT = slabs.map(function (s, i) { return { id: s.id, top: nat[i].top - TOP }; });
    var deps = m('depth', stack).filter(function (x) { return !x.closest('.is-tall'); }).map(function (x) { return { el: x, top: off(x), h: x.offsetHeight }; });
    slabs.forEach(function (s, i) { s.style.position = ''; s.style.top = Math.min(TOP, vh - PAD - nat[i].h) + 'px'; s.style.zIndex = i + 1; });
    var last = slabs[slabs.length - 1]; last.style.position = 'relative'; last.style.top = 'auto';
    var idx = function (el) { return slabs.indexOf(el); };
    ctx = G.context(function () {
      slabs.forEach(function (s, i) {
        var n = slabs[i + 1]; if (!n) return;
        var tg = s.classList.contains('is-tall') ? $('.slab_stage', s) : s, sh = tg && $(':scope>.slab_shade', tg);
        var a = nat[i + 1].top - vh, b = nat[i + 1].top - TOP;
        var tl = G.timeline({ scrollTrigger: { start: a, end: b, scrub: true, onLeave: function () { s.style.visibility = 'hidden'; }, onEnterBack: function () { s.style.visibility = ''; } } });
        tl.fromTo(tg, { scale: 1, x: 0, y: 0 }, { scale: 0.94, x: 0, y: 0, ease: 'none' }, 0);
        if (sh) tl.fromTo(sh, { opacity: 0 }, { opacity: 0.6, ease: 'none' }, 0);
      });
      if (reel && frame && fs) {
        var ri = idx(reel), k0 = Math.max(fs.W, AV) / fs.S * 1.14, r0 = nat[ri].top - TOP, r1 = r0 + vh * (mob ? 1.1 : 1.5);
        var cover = m1('cover', stack);
        if (cover) G.fromTo(cover, { yPercent: 0 }, { yPercent: -12, ease: 'none', scrollTrigger: { start: nat[ri].top - vh, end: r0, scrub: true } });
        G.timeline({ scrollTrigger: { start: r0 - vh * 0.35, end: r1, scrub: true } })
          .fromTo(frame, { scale: k0 }, { scale: 1, ease: 'power2.inOut', duration: 0.7 }, 0)
          .fromTo(m1('reel-media', stack), { scale: 1.3 }, { scale: 1, ease: 'power1.out', duration: 0.75 }, 0)
          .fromTo(m1('reel-tag', stack), { opacity: 0 }, { opacity: 1, duration: 0.1 }, 0.62)
          .fromTo(m('reel-fade', stack), { opacity: 0, y: 30 }, { opacity: 1, y: 0, ease: 'power2.out', duration: 0.18, stagger: 0.04 }, 0.6)
          .to({}, { duration: 0.15 });
      }
      if (!mob && dist > 0) {
        var w0 = nat[idx(hw)].top - TOP, tiles = $$('.tile_component', track), fill = m1('rail-fill', stack), num = m1('rail-num', stack), tot = m1('rail-total', stack);
        var count = tiles.filter(function (t) { return !t.classList.contains('is-end'); }).length;
        if (tot) tot.textContent = String(count).padStart(2, '0');
        var setx = G.quickSetter(track, 'x', 'px'), vw = vp.clientWidth;
        var meds = tiles.map(function (t) { var md = $('.tile_media', t); return { x: t.offsetLeft + t.offsetWidth / 2, set: md ? G.quickSetter(md, 'xPercent') : null }; });
        var upd = function (p) {
          var x = -dist * p; setx(x);
          meds.forEach(function (o) { if (o.set) o.set(G.utils.clamp(-9, 9, -((o.x + x - vw * 0.6) / vw) * 9)); });
          if (fill) fill.style.width = (p * 100) + '%';
          if (num) num.textContent = String(Math.min(count, 1 + Math.floor(p * count))).padStart(2, '0');
        };
        upd(0);
        ST.create({ start: w0, end: w0 + dist, onUpdate: function (st) { upd(st.progress); }, onRefresh: function (st) { upd(st.progress); } });
      }
      $$('[data-chapter]', stack).forEach(function (c) {
        var c0 = nat[idx(c)].top - TOP, c1 = c0 + CH;
        G.timeline({ scrollTrigger: { start: c0, end: c1, scrub: mob ? true : 0.4 } })
          .to($('.chapter_half.is-top', c), { yPercent: -51, ease: 'power2.inOut' }, 0)
          .to($('.chapter_half.is-bottom', c), { yPercent: 51, ease: 'power2.inOut' }, 0)
          .fromTo($$('.chapter_word', c), { scale: 1 }, { scale: 1.08, ease: 'power1.in' }, 0)
          .fromTo($('.chapter_under-inner', c), { scale: 0.9, opacity: 0.25 }, { scale: 1, opacity: 1, ease: 'power2.out' }, 0.1);
        /* v0.1.1: the curtain before the booking slab (#book) snaps onto the booking form itself */
        var nx = c.nextElementSibling, bk = (nx && nx.id === 'book') ? ($('[data-m~="booking-form"]', nx) || nx) : null;
        zones.push([c0, c1, bk]);
      });
      deps.forEach(function (o) { var md = $('.tile_media', o.el); if (md) G.fromTo(md, { yPercent: -7 }, { yPercent: 7, ease: 'none', scrollTrigger: { start: o.top - vh, end: o.top + o.h, scrub: true } }); });
    }, stack);
    ST.refresh();
  }
  /* Curtain snap: desktop wheel only (Lenis), never on touch */
  var snapT = null, snapping = false;
  if (lenis && FINE) lenis.on('scroll', function () {
    if (snapping || W.innerWidth < 768 || menuOpen || W.MURALEE.noSnap) return;
    clearTimeout(snapT);
    snapT = setTimeout(function () {
      var y = lenis.scroll, dir = lenis.direction || 1;
      for (var i = 0; i < zones.length; i++) {
        var a = zones[i][0], b = zones[i][1];
        if (y > a + 2 && y < b - 2) {
          var p = (y - a) / (b - a), to = dir > 0 ? (p > 0.12 ? b : a) : (p < 0.88 ? a : b);
          snapping = true;
          var hd = $('[data-m="header"]'), tgt = (to === b && zones[i][2]) ? zones[i][2] : to;
          lenis.scrollTo(tgt, { offset: tgt === to ? 0 : -((hd ? hd.offsetHeight : 0) + 24), duration: 1.1, easing: function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }, onComplete: function () { snapping = false; } });
          setTimeout(function () { snapping = false; }, 1400);
          break;
        }
      }
    }, 180);
  });
  if (stack) {
    var lastW = W.innerWidth, rT = null;
    W.addEventListener('resize', function () { if (W.innerWidth === lastW && W.innerWidth < 768) return; lastW = W.innerWidth; clearTimeout(rT); rT = setTimeout(build, 200); });
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(build); else W.addEventListener('load', build);
  }

  /* Hooks for QA screenshots */
  W.MURALEE = { openMenu: openMenu, closeMenu: closeMenu, openRegions: openRegions, rebuild: build, lenis: function () { return lenis; }, slabs: function () { return NAT; }, zones: function () { return zones; } };
})();
