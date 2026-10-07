/* Cross-section motion. Everything here is progressive: without JS the page is complete. */
(function () {
  var root = document.documentElement;
  if (!window.gsap || !window.ScrollTrigger) { root.classList.remove('intro'); return; }
  gsap.registerPlugin(ScrollTrigger);

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var stage = $('.stage');
  var box = $('.stage__planes');
  var planes = $$('.plane');
  var chapters = $$('.ch');
  var thread = $('.thread');
  var line = $('.thread__a .thread__line');
  var lineA = $('.thread__a');
  var lineB = $('.thread__b');
  var lineC = $('.thread__c');
  var touched = false;
  var hoverApi = null;
  var rows = $$('.inv__row');
  function lightRows(i) { rows.forEach(function (r) { r.classList.toggle('is-lit', +r.dataset.layer === i); }); }
  ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(function (ev) { window.addEventListener(ev, function () { touched = true; }, { passive: true, once: true }); });
  var pulse = $('.thread__pulse');
  var endCap = $('.layers__end');
  var tip = $('.tip');
  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var cssNum = function (n) { return parseFloat(getComputedStyle(box).getPropertyValue(n)) || 0; };
  var sw = function () { return box.offsetWidth; };
  var compact = function () { var g = cssNum('--gap'), e = cssNum('--ex'); return g / (g + e); };

  /* ---------- active layer: tint + dim by class, artwork draws itself in ---------- */
  var current = -1;
  function draw(i) {
    if (reduceMQ.matches || i < 0 || !planes[i]) return;
    var paths = $$('.plane__art path[pathLength]', planes[i]);
    gsap.fromTo(paths, { strokeDashoffset: 1 }, {
      strokeDashoffset: 0, duration: 0.6, ease: 'power2.inOut', overwrite: true,
      stagger: { amount: 0.32 }
    });
  }
  function setActive(i) {
    if (i === current) return;
    current = i;
    if (i < 0) { delete stage.dataset.active; } else { stage.dataset.active = i; }
    planes.forEach(function (p, k) { p.classList.toggle('is-active', k === i); });
    draw(i);
  }
  /* active index is always derived from all chapter triggers, so any jump (Home key, logo link) resolves correctly */
  var sts = [];
  function resolve() {
    var idx = -1;
    sts.forEach(function (t, k) { if (t.isActive) idx = k; });
    setActive(idx);
  }
  /* below 1024 the sticky strip covers the top of the viewport, so the trigger line sits under it */
  var narrow = function () { return window.innerWidth < 1024; };
  var lineAt = function (i) {
    if (!narrow()) return '55%';
    var h = stage.offsetHeight * (i === 0 ? 1 : 0.62);
    return Math.round(h + window.innerHeight * 0.3) + 'px';
  };
  chapters.forEach(function (ch, i) {
    sts.push(ScrollTrigger.create({
      trigger: ch, start: function () { return 'top ' + lineAt(i); },
      endTrigger: i === chapters.length - 1 ? '.layers' : ch,
      end: function () { return 'bottom ' + lineAt(i + 1 > 4 ? 4 : i + 1); },
      onToggle: resolve
    }));
  });
  ScrollTrigger.addEventListener('refresh', resolve);

  /* phones: the sticky strip tightens once the first chapter has been read */
  ScrollTrigger.create({
    trigger: chapters[1], start: 'top 70%', endTrigger: '.layers', end: 'bottom top',
    toggleClass: { targets: stage, className: 'is-tight' }
  });

  /* ---------- stack inventory rows and planes are one system ---------- */
  rows.forEach(function (r) {
    var i = +r.dataset.layer;
    r.addEventListener('pointerenter', function () {
      if (hoverApi) { if (i >= 0) hoverApi.explode(i); else hoverApi.all(); }
      else { lightRows(i); planes.forEach(function (p, k) { p.classList.toggle('is-hover', k === i); }); }
    });
    r.addEventListener('pointerleave', function () {
      if (hoverApi) hoverApi.restore(200);
      else { lightRows(-9); planes.forEach(function (p) { p.classList.remove('is-hover'); }); }
    });
  });

  /* ---------- planes are buttons: jump to their chapter ---------- */
  $$('.plane__hit, .plane__label').forEach(function (b) {
    b.addEventListener('click', function () {
      var h = document.getElementById('ch' + b.dataset.go);
      h.closest('.ch').scrollIntoView({ behavior: reduceMQ.matches ? 'auto' : 'smooth', block: 'center' });
      h.focus({ preventScroll: true });
    });
  });

  /* one slow breath of the exploded view if the visitor has not touched anything yet */
  function idleCue() {
    if (touched || reduceMQ.matches || window.scrollY > 4 || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    touched = true;
    var bodies = planes.map(function (p) { return $('.plane__body', p); });
    var h = line.getBoundingClientRect().height;
    gsap.timeline()
      .to(bodies, { y: function (k) { return (k - 2) * 10; }, duration: 0.9, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 0)
      .fromTo(pulse, { y: 0, autoAlpha: 1, scale: 1 }, { y: h, duration: 1.4, ease: 'sine.inOut' }, 0.2)
      .to(pulse, { autoAlpha: 0, scale: 2, duration: 0.35 }, '>')
      .set(bodies, { clearProps: 'transform' });
  }

  var mm = gsap.matchMedia();

  /* ---------- 1. intro (text is CSS-animated and paints without JS); planes + thread here ---------- */
  mm.add('(prefers-reduced-motion: no-preference)', function () {
    var bodies = $$('.plane__body');
    gsap.set(bodies, { y: function (i) { return -80 - i * 8; }, autoAlpha: 0 });
    gsap.set('.plane__art', { autoAlpha: 0 });
    gsap.set('.plane__label', { autoAlpha: 0, x: -10 });
    gsap.set(line, { scaleY: 0 });
    root.classList.remove('intro');
    var tl = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: function () { idleT = setTimeout(idleCue, 1500); } })
      .to(bodies, { y: 0, autoAlpha: 1, duration: 0.62, ease: 'back.out(1.7)', stagger: { each: 0.07, from: 'end' }, clearProps: 'transform,opacity,visibility' }, 0)
      .to('.plane__art', { autoAlpha: 1, duration: 0.4, stagger: { each: 0.05, from: 'end' }, clearProps: 'opacity,visibility' }, 0.45)
      .to('.plane__label', { autoAlpha: 1, x: 0, duration: 0.35, stagger: 0.04, clearProps: 'all' }, 0.6)
      .to(line, { scaleY: compact, duration: 0.3, ease: 'power2.inOut' }, 0.88);
    var idleT;
    return function () { tl.kill(); clearTimeout(idleT); };
  });
  mm.add('(prefers-reduced-motion: reduce)', function () { root.classList.remove('intro'); });

  /* ---------- 2. the request thread: retracts as you leave the hero, then draws down through the chapters ---------- */
  mm.add('(prefers-reduced-motion: no-preference)', function () {
    gsap.set(lineB, { scaleY: 0 });
    gsap.set(endCap, { autoAlpha: 0, x: -12 });
    gsap.to(lineA, {
      scaleY: 0, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top+=24 top', end: 'bottom 40%', scrub: 0.5 }
    });
    gsap.to(lineB, {
      scaleY: 1, ease: 'none',
      scrollTrigger: { trigger: chapters[0], start: 'top 55%', endTrigger: chapters[chapters.length - 1], end: 'top 55%', scrub: 0.6 }
    });
    var st = ScrollTrigger.create({
      trigger: chapters[chapters.length - 1], start: 'top 40%', once: true,
      onEnter: function () {
        gsap.fromTo(pulse, { y: 0, autoAlpha: 1 }, {
          y: function () { return thread.offsetHeight; }, duration: 1.1, delay: 0.35, ease: 'power1.inOut',
          onComplete: function () {
            gsap.to(pulse, { autoAlpha: 0, scale: 2.2, duration: 0.4, ease: 'power2.out' });
            gsap.to(endCap, { autoAlpha: 1, x: 0, duration: 0.6, ease: 'power3.out' });
          }
        });
      }
    });
    return function () { st.kill(); };
  });

  /* ---------- 3. desktop: stack separates, each chapter pulls its layer forward ---------- */
  mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', function () {
    gsap.to(planes.concat(thread), {
      y: function (i) { return ((i === 5 ? 0 : i) - 2) * sw() * cssNum('--ex'); },
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 25%', scrub: 0.6, invalidateOnRefresh: true }
    });
    chapters.forEach(function (ch, i) {
      gsap.timeline({ scrollTrigger: { trigger: ch, start: 'top 85%', end: 'bottom 25%', scrub: 0.6, invalidateOnRefresh: true } })
        .fromTo(planes[i], { x: 0 }, { x: function () { return -sw() * 0.17; }, ease: 'power2.out', duration: 0.3 })
        .to(planes[i], { x: function () { return -sw() * 0.17; }, duration: 0.4, ease: 'none' })
        .to(planes[i], { x: 0, ease: 'power2.in', duration: 0.3 });
    });
  });

  /* ---------- 3b. signature: hover or focus a layer to explode the stack around it ----------
     One invisible zone owns hover. The layer is picked from the pointer's Y against each layer's
     RESTING centre, so lifting layers never changes which one is under the pointer. */
  mm.add('(min-width: 1024px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', function () {
    var bodies = planes.map(function (p) { return $('.plane__body', p); });
    var shadows = planes.map(function (p) { return $('.plane__shadow', p); });
    var svgs = planes.map(function (p) { return $('.plane__svg', p); });
    var faces = planes.map(function (p) { return $('.plane__face', p); });
    var titles = chapters.map(function (c) { return $('.ch__h', c).textContent.replace(/\.$/, ''); });
    var zone = $('.stage__zone');
    var header = $('.top');
    var hovered = -1, leaveT, raf = 0, lastY = 0;
    function rest(k) {
      var r = faces[k].getBoundingClientRect(), dy = gsap.getProperty(bodies[k], 'y');
      return { top: r.top - dy, bottom: r.bottom - dy, mid: r.top + r.height / 2 - dy };
    }
    function pick(y) {
      var best = 0, d = Infinity;
      for (var k = 0; k < planes.length; k++) { var dd = Math.abs(y - rest(k).mid); if (dd < d) { d = dd; best = k; } }
      return best;
    }
    function explode(i) {
      clearTimeout(leaveT);
      touched = true;
      if (i === hovered) return;
      hovered = i;
      stage.classList.add('is-exploding');
      planes.forEach(function (p, k) { p.classList.toggle('is-hover', k === i); });
      lightRows(i);
      /* lift layers above just enough to clear the hovered face, but never under the header;
         whatever cannot be gained upward is taken by pushing this layer and those below down */
      var lift = 0, push = 0;
      if (i > 0) {
        var needed = -6 - (rest(i - 1).bottom - rest(i).top) - 6;
        var hb = header.getBoundingClientRect().bottom;
        var allowed = Math.max(8, hb + 8) - rest(0).top;
        lift = Math.min(0, Math.max(Math.min(needed, -34), allowed));
        push = Math.max(0, lift - needed);
      }
      var yFor = function (k) { return k < i ? lift : (k === i ? -6 + push : 14 + push); };
      bodies.forEach(function (b, k) {
        gsap.to(b, { y: yFor(k), duration: 0.48, ease: 'power3.out', delay: k < i ? (i - 1 - k) * 0.03 : 0, overwrite: 'auto' });
      });
      /* the scroll-active layer steps back into the stack and dims while another layer is inspected */
      bodies.forEach(function (b, k) {
        var back = (k === current && k !== i) ? -gsap.getProperty(planes[k], 'x') : 0;
        gsap.to(b, { x: back, duration: 0.4, ease: 'power3.out', overwrite: 'auto' });
      });
      gsap.to(svgs, { autoAlpha: function (k) { return k === i ? 1 : (k < i || k === current ? 0.55 : 1); }, duration: 0.3, overwrite: 'auto' });
      gsap.to(shadows, { autoAlpha: function (k) { return k === i ? 1 : 0; }, y: function (k) { return k === i ? 22 + push : 16; }, duration: 0.4, ease: 'power3.out', overwrite: 'auto' });
      draw(i);
      /* thread extends to the layer, then the pulse runs down and stops there */
      var tr = thread.getBoundingClientRect();
      var target = Math.max(0, rest(i).mid + yFor(i) - tr.top);
      var frac = Math.min(1, target / thread.offsetHeight);
      gsap.to(lineC, { scaleY: frac, duration: 0.18, ease: 'power2.out', overwrite: 'auto' });
      gsap.fromTo(pulse, { y: 0, autoAlpha: 1, scale: 1 }, { y: target, duration: 0.42, delay: 0.18, ease: 'power2.inOut', overwrite: 'auto' });
      /* tooltip under the label, crossfading between layers */
      var lab = $('.plane__label', planes[i]).getBoundingClientRect();
      var box0 = box.getBoundingClientRect();
      tip.textContent = titles[i];
      gsap.set(tip, { x: lab.left - box0.left + 8, y: lab.bottom - gsap.getProperty(bodies[i], 'y') + yFor(i) - box0.top - 4 });
      gsap.fromTo(tip, { autoAlpha: 0.2, yPercent: 15 }, { autoAlpha: 1, yPercent: 0, duration: 0.22, ease: 'power2.out', overwrite: 'auto' });
    }
    function restore(delay) {
      clearTimeout(leaveT);
      leaveT = setTimeout(function () {
        hovered = -1;
        stage.classList.remove('is-exploding');
        planes.forEach(function (p) { p.classList.remove('is-hover'); });
        lightRows(-9);
        gsap.to(bodies, { y: 0, x: 0, duration: 0.35, ease: 'power2.out', overwrite: 'auto' });
        gsap.to(svgs, { autoAlpha: 1, duration: 0.3, overwrite: 'auto' });
        gsap.to(shadows, { autoAlpha: 0, y: 16, duration: 0.3, overwrite: 'auto' });
        gsap.to([pulse, tip], { autoAlpha: 0, duration: 0.15, overwrite: 'auto' });
        gsap.to(lineC, { scaleY: 0, duration: 0.3, ease: 'power2.in', delay: 0.1, overwrite: 'auto' });
      }, delay);
    }
    function move(e) {
      lastY = e.clientY;
      clearTimeout(leaveT);
      if (raf) return;
      raf = requestAnimationFrame(function () { raf = 0; explode(pick(lastY)); });
    }
    var offs = [];
    function on(el, ev, fn) { el.addEventListener(ev, fn); offs.push(function () { el.removeEventListener(ev, fn); }); }
    on(zone, 'pointerenter', move);
    on(zone, 'pointermove', move);
    on(zone, 'pointerleave', function () { restore(200); });
    on(zone, 'click', function (e) {
      var i = pick(e.clientY), h = document.getElementById('ch' + i);
      h.closest('.ch').scrollIntoView({ behavior: 'smooth', block: 'center' });
      h.focus({ preventScroll: true });
    });
    planes.forEach(function (p, i) {
      var lb = $('.plane__label', p);
      on(lb, 'focus', function () { explode(i); });
      on(lb, 'blur', function () { restore(200); });
    });
    /* the day-to-day row has no layer: it sends one request down the whole thread */
    function all() {
      clearTimeout(leaveT);
      if (hovered >= 0) {
        hovered = -1; stage.classList.remove('is-exploding');
        planes.forEach(function (p) { p.classList.remove('is-hover'); });
        gsap.to(bodies, { y: 0, x: 0, duration: 0.35, ease: 'power2.out', overwrite: 'auto' });
        gsap.to(svgs, { autoAlpha: 1, duration: 0.3, overwrite: 'auto' });
        gsap.to(shadows, { autoAlpha: 0, duration: 0.3, overwrite: 'auto' });
        gsap.to(tip, { autoAlpha: 0, duration: 0.15, overwrite: 'auto' });
      }
      lightRows(-1);
      gsap.to(lineC, { scaleY: 1, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
      gsap.fromTo(pulse, { y: 0, autoAlpha: 1, scale: 1 }, { y: thread.offsetHeight, duration: 0.9, ease: 'power1.inOut', overwrite: 'auto' });
    }
    hoverApi = { explode: explode, restore: restore, all: all };
    return function () {
      offs.forEach(function (f) { f(); });
      hoverApi = null;
      gsap.set(bodies.concat(shadows, svgs, tip, lineC), { clearProps: 'all' });
      stage.classList.remove('is-exploding');
      planes.forEach(function (p) { p.classList.remove('is-hover'); });
    };
  });

  mm.add('(hover: hover) and (prefers-reduced-motion: reduce)', function () {
    var offs = [];
    planes.forEach(function (p) {
      var k0 = planes.indexOf(p);
      var on = function () { p.classList.add('is-hover'); lightRows(k0); }, off = function () { p.classList.remove('is-hover'); lightRows(-9); };
      [$('.plane__hit', p), $('.plane__label', p)].forEach(function (el) {
        el.addEventListener('pointerenter', on); el.addEventListener('pointerleave', off);
        offs.push(function () { el.removeEventListener('pointerenter', on); el.removeEventListener('pointerleave', off); });
      });
    });
    return function () { offs.forEach(function (f) { f(); }); };
  });

  /* ---------- 4. content reveals (short fade-up; skipped under reduced motion) ---------- */
  mm.add('(prefers-reduced-motion: no-preference)', function () {
    var vh0 = window.innerHeight;
    var below = function (el) { return el.getBoundingClientRect().top > vh0; };
    chapters.forEach(function (ch) {
      if (!below(ch)) return;
      gsap.from($$('.ch__meta, .ch__h, .ch__p, .more', ch), {
        y: 28, autoAlpha: 0, duration: 0.8, stagger: 0.07, ease: 'power3.out', clearProps: 'all',
        scrollTrigger: { trigger: ch, start: 'top 80%', once: true }
      });
    });
    var rv = $$('.row, .work h2, .path h2, .path__body, .contact h2, .contact__mail, .ctas--end').filter(below);
    gsap.set(rv, { autoAlpha: 0, y: 22 });
    ScrollTrigger.batch(rv, {
      start: 'top 90%', once: true,
      onEnter: function (b) { gsap.to(b, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.06, ease: 'power3.out', clearProps: 'all' }); }
    });
  });

  /* ---------- 5. magnetic controls, fine pointers only ---------- */
  mm.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', function () {
    var offs = [];
    $$('.cta').forEach(function (el) {
      var xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' });
      var yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
      var r;
      function enter() { r = el.getBoundingClientRect(); }
      function move(e) {
        if (!r) enter();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.22);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.32);
      }
      function leave() { r = null; xTo(0); yTo(0); }
      el.addEventListener('pointerenter', enter);
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerleave', leave);
      offs.push(function () {
        el.removeEventListener('pointerenter', enter);
        el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerleave', leave);
        gsap.set(el, { clearProps: 'transform' });
      });
    });
    return function () { offs.forEach(function (f) { f(); }); };
  });

  /* ---------- 6. expanders: native <details>, enhanced with a FLIP of everything that moves ---------- */
  function movers(det) {
    var ch = det.closest('.ch');
    var list = $$('.ch__meta, .ch__h, .ch__p, summary', ch);
    var after = false;
    chapters.forEach(function (c) { if (after) list.push(c); if (c === ch) after = true; });
    list = list.concat($$('.work, .path, .contact, .foot'));
    var vh = window.innerHeight;
    return list.filter(function (el) {
      var r = el.getBoundingClientRect();
      return r.top < vh * 1.6 && r.bottom > -vh * 0.5;
    });
  }

  $$('.more').forEach(function (det) {
    var sum = $('summary', det);
    var body = $('.more__body', det);
    var busy = false;
    sum.addEventListener('click', function (e) {
      if (reduceMQ.matches) return;          /* native instant toggle */
      e.preventDefault();
      if (busy) return;
      busy = true;
      var els = movers(det);
      var first = els.map(function (el) { return el.getBoundingClientRect().top; });
      var opening = !det.open;
      det.open = !det.open;
      var last = els.map(function (el) { return el.getBoundingClientRect().top; });
      var done = function () {
        gsap.set(els, { clearProps: 'transform' });
        gsap.set(body, { clearProps: 'all' });
        busy = false;
        ScrollTrigger.refresh();
      };
      if (opening) {
        var sumShift = first[els.indexOf(sum)] - last[els.indexOf(sum)] || 0;
        els.forEach(function (el, i) { gsap.set(el, { y: first[i] - last[i] }); });
        gsap.timeline({ onComplete: done })
          .to(els, { y: 0, duration: 0.6, ease: 'power3.out' }, 0)
          .fromTo(body, { y: sumShift - 8, autoAlpha: 0, clipPath: 'inset(0% 0% 100% 0%)' },
                        { y: 0, autoAlpha: 1, clipPath: 'inset(0% 0% 0% 0%)', duration: 0.6, ease: 'power3.out' }, 0)
          .from($$('li', body), { y: 10, opacity: 0, duration: 0.45, stagger: 0.045, ease: 'power2.out', clearProps: 'all' }, 0.1);
      } else {
        det.open = true;                     /* keep it open while it animates closed */
        gsap.timeline({ onComplete: function () { det.open = false; done(); } })
          .to(els, { y: function (i) { return last[i] - first[i]; }, duration: 0.4, ease: 'power2.inOut' }, 0)
          .to(body, { autoAlpha: 0, y: -6, clipPath: 'inset(0% 0% 100% 0%)', duration: 0.32, ease: 'power2.in' }, 0);
      }
    });
  });

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
})();
