/* Venom CTAs (v5.0, 13th note: taut, wrapping, pulling): a glossy black pill that hunts for a host. Near: a glossy neck swells and 6-10 ink hairs ooze toward
   the pointer. Close: the whole sheaf lunges and knots round it (core blob, curled tips, re-grips), follows it like wet hair
   and hauls on it (button leans, tug pulses, heaves). Far or flicked: tips shorten into the button, spikes and droplets fly,
   the pill wobbles. Parked on the button: a few drips sway. Sibling controls are never grabbed. The cursor is never touched.
   Progressive: fine pointer + motion only; nothing runs far from a button. */
(function () {
  if (!window.gsap) return;
  var DC = document, DE = DC.documentElement, M = Math, PI = M.PI, TAU = PI * 2, sin = M.sin, cos = M.cos, sqrt = M.sqrt, min = M.min, max = M.max, abs = M.abs, exp = M.exp, atan2 = M.atan2, pow = M.pow, hy = M.hypot, RN = M.random;
  var NEAR = 200, GRIP = 117, SNAP = 245, WAKE = 230, PX = 255, PY = 225, NS = 20, NK = 12, N = 14, INK = '#16181b';
  function cl(v, a, b) { return v < a ? a : v > b ? b : v; }
  /* smooth pseudo-noise in -1..1: two incommensurate sines (cheap, no hashing) */
  function nz(s, t) { return sin(s * 1.3 + t) * .6 + sin(s * 2.9 - t * 1.71) * .4; }

  gsap.matchMedia().add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) and (min-width: 1024px)', function () {

    var mx = 0, my = 0, has = false, running = false, queued = false, T = 0, lt = 0, spd = 0, pvx = 0, pvy = 0;
    var btns = [...DC.querySelectorAll('.cta--primary')].map(a => {
      /* one plain canvas (no CSS filter), absolutely placed in the button's own list, layered above the section's text and buttons */
      var cv = DC.createElement('canvas'), host = a.closest('ul') || a.parentNode;
      cv.className = 'venom'; cv.ariaHidden = 'true'; cv.width = cv.height = 0;
      host.classList.add('venom-host'); host.appendChild(cv); a.classList.add('cta--venom');
      var b = { a: a, host: host, cv: cv, sx: cv.getContext('2d'), ic: a.querySelector('.cta__ic') || a, s: [], k: [] };
      z0(b);
      for (var i = 0; i < NS; i++) b.s.push({ on: 0 });
      for (i = 0; i < NK; i++) b.k.push({});
      a._v = b;
      return b;
    });
    function U(lo, hi) { return lo + (hi - lo) * RN(); }

    /* layout read: only when dirty (resize, fonts); everything per-frame is arithmetic (v4.3 fix 8) */
    function measure(b) {
      var a = b.a, c = b.cv;
      b.mc++; b.d = min(2, devicePixelRatio);
      b.bw = a.offsetWidth; b.bh = a.offsetHeight; b.rr = b.bh / 2;
      /* never let the canvas add scroll extent: room below is limited to what the document already has */
      c.style.display = 'none';
      var r = b.host.getBoundingClientRect(); b.dh = DE.scrollHeight; b.ot = a.offsetTop; b.tp = r.top + scrollY + b.ot;
      b.ol = a.offsetLeft; b.ox = r.left + scrollX + b.ol - PX; b.pd = 0;
      c.style.cssText = `left:${a.offsetLeft - PX}px;will-change:transform`; /* v5.7 fix 4: its own layer, moved by transform only */
      place(b);
      /* sibling controls in canvas space, inflated 4px: ink never crosses them (fix 4) */
      b.R = [...b.host.querySelectorAll('a')].filter(e => e !== a).map(e => { var q = e.getBoundingClientRect(), x = scrollX - b.ox, y = scrollY - b.oy; return [q.left + x - 4, q.top + y - 4, q.right + x + 4, q.bottom + y + 4]; });
      b.dirty = 0; b.clr = 0; clear(b);
    }
    /* canvas box from cached layout: pads pt above / pm below, never past the document's own extent */
    function place(b) {
      var c = b.cv, d = b.d, pb = cl(b.dh - (b.tp + b.bh) - 2, 0, b.pm), W, H, st = c.style;
      b.w = b.bw + PX * 2; b.h = b.bh + b.pt + pb; b.oy = b.tp - b.pt;
      st.top = b.ot - PY + 'px'; st.transform = `translateY(${PY - b.pt}px)`; /* v5.7 fix 4: re-anchoring moves the canvas on the compositor (a top change re-laid-out and re-painted mid-grip: the dropped frame) */ st.width = b.w + 'px'; st.height = b.h + 'px';
      W = b.w * d + .5 | 0; H = b.h * d + .5 | 0;
      if (c.width !== W) c.width = W; if (c.height !== H) c.height = H;
    }
    /* scrolling can move the host in page space (pinned sections): one rect read refreshes the page origin; canvas-local state moves with the host */
    function pos(b) { var r = b.host.getBoundingClientRect(); b.tp = r.top + scrollY + b.ot; b.ox = r.left + scrollX + b.ol - PX; b.oy = b.tp - b.pt; b.pd = 0; }
    function probe(b) {
      var cx = mx + scrollX - b.ox, cy = my + scrollY - b.oy, y0 = b.pt + b.rr, x0 = PX + b.rr, x1 = x0 + b.bw - b.bh;
      /* distance from the resting pill (no lean): the snap distance never depends on the pull (fix 6) */
      b.dR = has ? hy(cx - cl(cx, x0, x1), cy - y0) - b.rr : 1e4; y0 += b.py; x0 += b.px; x1 += b.px;
      var qx = cl(cx, x0, x1), dx = cx - qx, dy = cy - y0, l = hy(dx, dy) || 1;
      b.mx = cx; b.my = cy; b.qx = qx; b.qy = y0; b.x0 = x0; b.x1 = x1; b.nx = dx / l; b.ny = dy / l; b.dist = has ? l - b.rr : 1e4;
    }
    function check() {
      queued = false;
      if (running) return;
      for (var i = 0; i < btns.length; i++) {
        var b = btns[i];
        if (b.dirty) measure(b); else if (b.pd) pos(b);
        probe(b);
        if (pre < 2 && b.dist < WAKE * 2) pw(1);
        if (b.dist < WAKE) { start(); return; }
      }
    }
    /* 11th note + fix 5: while gripped, ONE inline cursor write on <html> per direction/frame change; plain auto on release */
    var cur = -1, HS = DE.style;
    function grab(n) { if (n !== cur) { var u = `url(assets/cursor/v${n >> 2}-${n & 3}`; HS.cursor = n < 0 ? 'auto' : `image-set(${u}.png) 1x,${u}@2x.png) 2x) 20 18,auto`; cur = n; } }
    /* re-anchor the canvas toward the pointer side (fix 2): pads 60/390 while gripped, 225/225 otherwise; canvas-local state shifts with it */
    function anchor(b, m) { if (m === b.up) return; var o = b.pt; b.up = m; b.pt = m < 0 ? PY : m ? 390 : 60; b.pm = m < 0 ? PY : m ? 60 : 390; place(b); o = b.pt - o; b.R.forEach(r => { r[1] += o; r[3] += o; }); b.s.forEach(S => { S.ty += o; }); b.k.forEach(k => { k.y += o; }); b.clr = 0; clear(b); probe(b); } /* arithmetic only (fix 8) */
    /* first wake: fetch and decode all 48 cursor PNGs (about 27KB, local), so the first grip never waits on an image (v5.1 fix 6) */
    var pre = 0; (window.requestIdleCallback || setTimeout)(() => pre || pw(0), { timeout: 1500 });
    function start() { if (running || DC.hidden) return; running = true; gsap.ticker.add(tick); if (pre < 2) pw(1); }
    /* v5.7 fix 4: the cursor tiles decode at idle after load; the canvas is sized and the draw path warmed as the pointer enters 2 x WAKE, a beat before the first grip and never long before it (an idle canvas is hibernated and pays again on first ink) */
    function pw(w0) { if (!pre) for (var k = 0; k < 48; k++) { var im = new Image(); im.src = `assets/cursor/v${k / 6 | 0}-${(k >> 1) % 3}${k & 1 ? '@2x' : ''}.png`; im.decode && im.decode().catch(() => 0); } pre = w0 ? 2 : 1; if (w0) btns.forEach(b => { if (b.dirty) measure(b); var c = b.sx; c.globalAlpha = 0; for (var w = 0; w < 40; w++) { rope(c, 9, 9, 9, 20, 30, 60, 40, 140, 42, 160, 45, 170, 7, 1.6, 1, 1); rope(c, 9, 9, 12, 30, 20, 60, 30, 90, 30, 90, 40, 120, 3.5, 3.5, .6, 0, 0); curl(c, 50, 50, 11, 0, 3, 9, 2, 1); var k; for (k = 0; k < 6; k++) curl(c, 50, 50, 8.4 + k * .3, k + w, (w & 1 ? -.52 : .55) * TAU / 6, 8.7 + k * .3, 3 - k / 6, 3 - (k + 1) / 6); /* the fist's coil segments, in their own shape */ ln(9, 9, 30, 40); rib(c, SP, 6, 3.5); dot(c, 30, 40, 3); eo(c); c.translate(60, 30); c.scale(1.02, .98); c.roundRect(-40, -20, 80, 40, 19); c.fill(); c.arc(50, 50, 4, 0, 1); c.fill(); c.restore(); } c.globalAlpha = 1; }); /* first wake (v5.7: 40 passes, so the draw path tiers up before the first grip): warm the draw path once, invisibly (fix 6) */ }
    function stop() {
      running = false; gsap.ticker.remove(tick); grab(-1);
      btns.forEach(b => {
        rs(b); b.a.classList.remove('is-caught');
        z0(b);
      });
    }
    function z0(b) { b.mc = b.cg = b.st = b.oz = b.gr = b.nl = b.nlv = b.dp = b.px = b.py = b.vx = b.vy = b.sv2 = b.bt = 0; b.rt = b.sp = b.hv = b.dq = b.up = -1; b.sc = b.sa = b.dirty = 1; b.pt = b.pm = PY; }
    function rs(b) { clear(b); b.a.style.translate = b.a.style.scale = ''; b.ic.style.transition = ''; }
    function clear(b) { if (!b.clr) { b.sx.setTransform(1, 0, 0, 1, 0, 0); b.sx.clearRect(0, 0, b.cv.width, b.cv.height); b.clr = 1; } }
    function queue() { if (!running && !queued) { queued = true; requestAnimationFrame(check); } }
    function onMove(e) {
      var t = e.timeStamp, dt = t - lt, x = e.clientX, y = e.clientY;
      if (dt > 0 && dt < 100) { pvx += ((x - mx) / dt - pvx) * .5; pvy += ((y - my) / dt - pvy) * .5; spd = hy(pvx, pvy); }
      lt = t; mx = x; my = y; has = true; queue();
    }
    function onOut(e) { if (!e.relatedTarget) has = false; }
    function onResize() { btns.forEach(b => { b.dirty = 1; }); }
    function onScroll() { btns.forEach(b => { b.pd = 1; }); queue(); }
    function onVis() { if (DC.hidden && running) stop(); }
    var P = { passive: true }, LS = [[window, 'pointermove', onMove], [DC, 'pointerout', onOut], [DC, 'visibilitychange', onVis], [window, 'scroll', onScroll], [window, 'resize', onResize]];
    LS.forEach(l => l[0].addEventListener(l[1], l[2], P));
    DC.fonts.ready.then(onResize);

    function tick(time, dtMs) {
      var t0 = performance.now(), dt = min(dtMs, 50) / 1000, live = false, g = 0;
      T += dt;
      if (t0 - lt > 80) { pvx *= .8; pvy *= .8; spd *= .8; }
      for (var i = 0, b; b = btns[i]; i++) { if (step(b, dt)) live = true; if (b.st === 2) g = ((M.round(atan2(b.qy - b.my, b.qx - b.mx) / PI * 4) + 8) % 8) * 4 + (T / .16 | 0) % 3 + 1; }
      /* the ink on the arrow runs toward the button (8 directions), 3 frames cycled every 160ms */
      grab(g - 1);
      if (!live) stop();
      if (g = window.__venomT) g.push(performance.now() - t0);
    }

    /* a new episode: 10-13 ink hairs (40% in near-identical pairs, a quarter thick), each with its own root, wave, lag and grip point */
    function seed(b) {
      b.st = 1; b.mc = 0; pos(b); probe(b); /* the host may have finished a reveal transform since the last read: one rect read per episode */ b.hn = b.rg = .4; b.fa = atan2(b.ny, b.nx); b.fq = b.qx; b.sd = U(0, 500); b.ep = -~b.ep % 3; b.bs = (b.ep - 1) * U(1.2, 1.6) + U(-.2, .2); b.cw0 = U(1.08, 1.14); /* the ropes root across most of the facing edge (60-90% once kept on the facing side) */ /* lean left / centre / right in turn, random amount: back-to-back episodes never repeat */ b.fl = -1;
      /* v5.1: 5-7 ropes (6-8.5px at the edge -> 1.6-2.5px at the knot) and 3-6 webbing hairs, rooted unevenly across the curtain */
      var nr = b.nr = 5, nh = 2, /* five ropes in a solid-core cable (16-20px) and two hairs that cross it */ n = nr + nh, i, S, dd = 0; b.oq = 0; /* the ooze clock (was b.ot, which is also the button's offsetTop) */
      for (i = 0; i < NS; i++) {
        S = b.s[i]; S.on = i < n ? 1 : 0; S.ns = RN() * 900; S.rope = i < nr;
        S.u = S.rope ? ((i + .5 + U(-.3, .3)) / nr * 2 - 1) * .95 : 0;
        S.w = S.rope ? U(6, 7.5) : 1; S.vf = U(6, 10) * TAU; /* a plucked-string vibration at 6-10Hz */
        S.ga = i % 4 * 1.1 - 1.65 + b.bs + U(-.2, .2); S.gr = U(5, 9);
        S.cw = i % 2 || i > 4 ? 0 : (RN() < .5 || -1) * U(.6, .8) * TAU; /* 3 rope tips coil 1-1.5 turns round the hotspot */
        var q5 = (i * 3 + b.ep) % 5; S.dw = i % 2 ? 7.8 : 6.2; S.dl = 21 + q5 * 3.6; S.dn = ((i * 2 + b.ep + 1) % 5 - 2) * .087; S.dj = (q5 - 2) * 3; S.dd = dd; dd += .017; /* v5.7 fix 3: per episode the drips deal out lengths 25-40, leans +-10deg and root offsets as a spread, and all arrive within 0.35s */ /* ooze teardrops: uneven widths, staggered growth */
        S.tx = NaN;
      }
      b.s[nr].u = -.5; b.s[nr + 1].u = .5; b.sz = [U(0, TAU), RN() < .5 ? 1 : 2]; /* the hairs root between ropes; 1-2 drifting slits */
    }
    /* knot: 3 overlapping ellipses (r 4-7, random turn) + 3 finger-tips, re-dealt on every regrab (fix 7) */
    function rk(b) { b.kq = RN() * 99; b.k0 = U(8.5, 10); b.cp = U(0, TAU); b.ko = [U(-2, 2), U(-2, 2)]; b.cs = (RN() < .5 || -1) * U(.5, .55) * TAU; } /* one turn direction and length per grab: the three coils cross r=12 exactly 120deg apart */ /* the ellipse set and the coil turns/phase are re-dealt on every grab */ /* union radius 7-10px */
    /* strands let go: each shortens along its own straight line into the curtain, after a small throw across the bundle (lat*8) */
    function dl(b) { var o = RN() * 7 | 0; b.s.forEach((S, i) => { i = (i + o) % 7; S.cv = (i & 1 ? -.0017 : .0017) * (80 + i * 60 % 130); S.lf = .82 + i * 5 % 7 * .06; }); } /* v5.8 fix 1: per snap, each strand gets its own tip curl (+-8-20deg) and length (1 +- 0.2) */
    function release(b, r) { dl(b); var v = hy(pvx, pvy); b.svx = v > .3 ? pvx / v : cos(b.fa); b.svy = v > .3 ? pvy / v : sin(b.fa); b.rt = r || 0; b.st = b.dist <= 0 ? 1 : 0; b.s.forEach(S => { var o = S.u * 8; S.tx -= b.ny * o; S.ty += b.nx * o; }); }
    /* snap: release + 6-12 concave spikes, 3-6 droplets, a 9Hz edge bulge; the arrow disc switches colour instantly */
    function snap(b) {
      release(b); b.sp = 0; b.sqx = b.qx - b.px; b.sa0 = atan2(b.ny, b.nx);
      b.ic.style.transition = 'none';
      var n = 6 + (RN() * 7 | 0), nd = 3 + (RN() * 4 | 0);
      for (var i = 0; i < NK; i++) {
        var k = b.k[i]; k.l = i < n ? i ? U(15, 35) : U(28, 35) : 0; k.a = b.sa0 + U(-1.6, 1.6); k.w = U(2, 3.5); k.r = i < nd ? U(1.5, 3.5) : 0; k.lf = U(.3, .5);
        var v = U(70, 190), c = cos(k.a), s = sin(k.a); k.x = b.qx + c * (b.rr + 4); k.y = b.qy + s * (b.rr + 4); k.u = c * v; k.v = s * v - 60;
      }
    }

    function step(b, dt) {
      if (b.dirty) measure(b); else if (b.pd) pos(b);
      probe(b);
      /* gripped: anchor toward the pointer side, flipping with +-20px hysteresis; back to centred once the ink is gone */
      anchor(b, b.st === 2 ? +(b.my < b.qy + (b.up > 0 ? 20 : b.up ? 0 : -20)) : b.rt >= 0 || b.sp >= 0 ? b.up : -1);
      /* the knot never leaves the canvas: pointer target clamped 14px inside */
      var rr = b.rr, qy = b.qy, Mx = cl(b.mx, 14, b.w - 14), My = cl(b.my, 14, b.h - 14);
      var d = b.dist, i, j, k, S, z, bl = b.bk = has && hit(b, b.qx + b.nx * rr, qy + b.ny * rr, Mx, My);
      b.bt = bl ? b.bt + dt : 0;
      /* recoil done (the last hair lands at 260ms): the button overshoots 4px the other way */
      if (b.rt >= 0 && (b.rt += dt) > .25) { b.rt = -1; b.gr = 0; b.vx -= b.nx * 42; b.vy -= b.ny * 42; for (i = 0; i < NS; i++) b.s[i].tx = NaN; }
      if (b.dq >= 0) b.dq += dt;
      if (b.sp >= 0 && (b.sp += dt) > .6) { b.sp = -1; b.ic.style.transition = ''; }
      /* episode: 0 rest, 1 near (ooze; parked when d <= 0), 2 gripped. Retraction (rt) and splash (sp) run on their own clocks, so a regrab is possible 250ms after a snap */
      if (b.st === 0) { if (d < NEAR && !bl && b.rt < 0) seed(b); }
      else if (b.st === 1) { if (d > 0 && d < GRIP && !bl && b.rt < 0) { b.st = 2; b.g0 = 1; rk(b); } else if ((d > NEAR + 20 || bl) && b.oz < .02 && b.dp < .02 && b.rt < 0) b.st = 0; }
      else if (d <= 0 || b.bt > .1) { release(b, .06); b.dq = 0; }
      else if (b.dR > SNAP || (spd > 2.6 && d > 105)) snap(b);
      var near = b.st === 1, grip = b.st === 2, pk = near && d <= 0, rtg = b.rt >= 0, live = near && !pk && !bl;
      /* flick: 3-5 hairs lash at where the pointer is heading, then recoil */
      if (b.fl >= 0 && (b.fl += dt) > .7) b.fl = -1;
      if (live && !rtg && b.fl < 0 && spd > 1.5) { b.fl = 0; var fs = min(80, 40 / spd); b.fx = Mx + pvx * fs; b.fy = My + pvy * fs; /* lash lands at most 40px past the pointer */ b.fn = 4 + (RN() * 3 | 0); dl(b); }
      var fk = b.fl >= 0 && b.fl < .2, e6 = ek(dt, 6);
      b.oz += ((live ? cl((NEAR - d) / (NEAR - GRIP), 0, 1) : 0) - b.oz) * ek(dt, 12);
      b.gr += ((grip ? 1 : 0) - b.gr) * (ek(dt, grip ? 16 : 10));
      b.dp = 0; /* v5.8b (14th note): nothing is drawn while the pointer is on the pill: no parked drips */
      if (b.cg !== grip) b.a.classList.toggle('is-caught', b.cg = grip);
      /* heaves: irregular hauls while gripped */
      var h = 0, ht = -1;
      if (grip && d > 30) { b.hn -= dt; if (b.hn <= 0) { b.hv = 0; b.hn = U(.6, 1.2); } }
      if (b.hv >= 0) { b.hv += dt; ht = b.hv; h = ht < .2 ? ht / .2 : ht < .55 ? 1 - (ht - .2) / .35 : (b.hv = -1, 0); h *= h; }
      /* the button leans toward the pointer and squashes along the pull; a 9Hz wobble after a snap */
      var pull = grip ? min(14, max(0, 8 + .04 * (d - 60)) * cl(d / 40, 0, 1) + 4 * h) : 0;
      var tx = b.nx * pull, ty = b.ny * pull, dmp = grip ? 11 : 5.5;
      b.vx += ((tx - b.px) * 110 - b.vx * dmp) * dt; b.vy += ((ty - b.py) * 110 - b.vy * dmp) * dt; b.px += b.vx * dt; b.py += b.vy * dt;
      b.a.style.translate = abs(b.px) + abs(b.py) > .01 ? `${b.px}px ${b.py}px` : '';
      var ten = grip ? cl(d / 250, 0, 1) : 0, stv = 1 + .06 * ten + .03 * h, ac = 1 - .04 * ten - .02 * h;
      b.sv2 += ((stv - b.sc) * 700 - b.sv2 * 14) * dt; b.sc += b.sv2 * dt;
      b.sa += (ac - b.sa) * min(1, dt * 25);
      var wb = b.sp >= 0 ? .035 * exp(-5 * b.sp) * sin(TAU * 9 * b.sp) : 0, horiz = abs(b.nx) > abs(b.ny), sxv = (horiz ? b.sc : b.sa) + wb, syv = (horiz ? b.sa : b.sc) - wb * .6;
      b.a.style.scale = abs(sxv - 1) + abs(syv - 1) > .002 ? sxv + ' ' + syv : '';
      /* neck length: a spring, so it overshoots and settles; heaves pulse it */
      var D0 = hy(Mx - b.qx, My - qy) - rr;
      var nlT = grip ? 11 + 7 * h : live ? (2 + 4 * b.oz) * min(1, b.oz * 8) : 0; /* ooze: a bulge 6 + 10*oz px (v4.3 fix 4) */
      b.nlv += ((nlT - b.nl) * 160 - b.nlv * 18) * dt; b.nl += b.nlv * dt;
      if (!b.st && !rtg && b.sp < 0 && b.oz < .01 && b.gr < .01 && b.dp < .01 && abs(b.nl) < .3) {
        b.nl = b.nlv = 0; clear(b);
        return d < WAKE || abs(b.px) + abs(b.py) + abs(b.vx) + abs(b.vy) > .3 || abs(b.sc - 1) + abs(b.sv2) > .01;
      }

      var sx = b.sx, nl = max(0, b.nl), da = atan2(b.ny, b.nx) - b.fa, fk2 = ek(dt, grip ? 14 : 9);
      /* the root slides round the edge with a little lag, so the bundle bends like wet hair when the pointer circles */
      da -= TAU * M.round(da / TAU); b.fa += da * fk2;
      var cw = ((b.x1 - b.x0) * cl((abs(sin(b.fa)) - .5) * 5 + .5, 0, 1) + 2.09 * rr) * (.7 + .41 * cl((D0 - 60) / 100, 0, 1)) * b.cw0, /* v5.3: 35% of the facing arc at <= 60px, 60% from 160px */ /* the facing flat plus the facing part of both caps; <= 125px at long stretch, 30-40% of the edge within 70px (v5.2 fix 2) */ cm = max(0, cw / 2 - rr * .6), clo = b.x0 + cm, chi = b.x1 - cm; b.fq += ((clo > chi ? (b.x0 + b.x1) / 2 : cl((b.x0 + b.x1) / 2 + (b.qx - (b.x0 + b.x1) / 2) * .35, clo, chi)) - b.fq) * fk2; /* centred on the facing edge, leaning a third toward the pointer */
      var ux = cos(b.fa), uy = sin(b.fa), pxv = -uy, pyv = ux;
      sx.setTransform(b.d, 0, 0, b.d, 0, 0); sx.clearRect(0, 0, b.w, b.h); sx.fillStyle = INK; b.clr = 0;
      /* v5.1 (fix 1): the curtain IS the ropes. Each rope and hair is rooted 4px inside the pill at its own place across the facing
         62-78%, runs straight and taut to the grip, and the ropes merge only in a band <= 18px deep whose hem scallops up between them */
      var bd = min(18, nl, max(3, D0 * .08)), /* v5.5: the swell is shallower at short spans, so the ropes separate just past it */ cx0 = cl(b.fq, b.x0, b.x1), ex, ey, t0 = 0, t1 = 3 * rr; for (j = 0; j < 12; j++) { z = (t0 + t1) / 2; ex = cx0 + ux * z; ey = qy + uy * z; hy(ex - cl(ex, b.x0, b.x1), ey - qy) < rr ? t0 = z : t1 = z; } /* v5.4: the axis starts ON the outline, where the facing ray from the curtain centre leaves the pill (the pill is erased now) */ var rl = [], str = 0, ga = 0, grr = 0, kq = 412 - 400 * b.gr, rk2 = rtg ? min(1, b.rt / .04) : 0;
      b.rl = b.vb = b.sq = b.wm = b.bw3 = b.t30 = 0; b.rg2 = []; b.dz = []; b.mw = []; b.hm = [];
      /* master clarification (BUNDLE, not CONE): the bundle axis runs from the curtain centre to the grip (the tips' centroid);
         each strand joins it by 30% of the span, runs in its own slot along it, and separates only in the last ~30px */
      var tcx = 0, tcy = 0, tn = 0; b.s.forEach(S => { if (S.on && S.tx === S.tx) { tcx += S.tx; tcy += S.ty; tn++; } }); if (grip || !tn) { tcx = Mx; tcy = My; } else { tcx /= tn; tcy /= tn; }
      var AL = hy(tcx - ex, tcy - ey) || 1, aux = (tcx - ex) / AL, auy = (tcy - ey) / AL, nxa = -auy, nya = aux; b.ax = [ex, ey, tcx, tcy];
      if (grip && (b.rg -= dt) < 0) { b.rg = U(.25, .6); rk(b); }
      if (live && !grip) b.oq = d < NEAR ? b.oq + dt : 0; /* the ooze grows by time once inside 200px, whatever the approach speed */
      var sc0 = sp(b, ex, ey);
      for (i = 0; i < NS; i++) {
        S = b.s[i]; if (!S.on) continue;
        /* roots stay on the side that faces the pull (outline normal within ~60deg of it): no rope starts round the cap on the far edge */
        /* v5.2c: roots spaced by arc length along the pill's own outline, centred on the facing edge, kept on the facing side */
        for (z = S.u * cw / 2, j = 0; j < 6; j++, z *= .85) { ps(b, sc0 + z); if (NX * ux + NY * uy > .45) break; }
        var ax = EX - NX * 4, ay = EY - NY * 4;
        if (S.tx !== S.tx) { S.tx = ax; S.ty = ay; }
        if (!rtg) {
          var gx = ax, gy = ay, rate = 7;
          if (grip) {
            /* grip: tips land round the hotspot (outside the 3.5px gap), the bundle twisting slowly, clenching on each heave */
            ga = b.fa + S.ga + .6 * sin(T * 1.3 + i); grr = S.gr * (1 - .25 * h);
            gx = Mx + cos(ga) * grr; gy = My + sin(ga) * grr; rate = 26;
          } else if (fk && i < b.fn && b.fl > i * .005) { var fq = (24 * i / (b.fn - 1) - 12) * .7; gx = b.fx - pvy * fq; gy = b.fy + pvx * fq; rate = 60; } /* flick: hairs evenly spread +-12px across the throw, 0-25ms apart */
          var kr = grip && b.g0 ? 1 : ek(dt, rate); S.tx += (gx - S.tx) * kr; S.ty += (gy - S.ty) * kr;
          if (grip) kp(S, 'tx', 'ty', Mx, My, kq);
        }
        var dx = S.tx - ax, dy = S.ty - ay, D = hy(dx, dy) || 1, nxp = -auy, nyp = aux;
        if (S.rope) rl.push([S.u, ax, ay, D > 2 ? dx / D : ux, D > 2 ? dy / D : uy, S]);
        /* recoil: each strand is drawn to s = (1-x)^1.5 of its path, x over 220ms, 0-24ms apart; the hairs let go within 30ms, so only the ropes retract */
        var sm = rtg ? S.rope ? pow(1 - cl((b.rt - i % 4 * .008) / .22, 0, 1), 1.5) : 1 - min(1, b.rt / .03) : 1;
        /* taut (13th note): a slight gravity curve and a plucked-string vibration (<= 1.5px) that grows with stretch, both on the bundle */
        str = grip ? cl((AL - 60) / 160, 0, 1) : 0;
        var vb = 1.5 * str * sin(S.vf * T + S.ns), sg = AL * .012, o1 = vb / .75, fo = b.fl >= 0 && !grip && !rtg, so = S.rope ? ((b.nr - 1) / 2 - i) * (fo ? 6.4 : 3.2) : (i - b.nr ? -6.4 : 6.4) /* v5.5: a flick throws separate strands (6.4px pitch, no wrist); slot order = root order across the axis (+u roots lie on the -n side): ropes never cross */, s2 = S.rope ? so : -so; /* v5.3: ropes on a 3.2px pitch (overlapping: one solid cable); each hair crosses it, slot -> opposite slot */
        if (D < 1.5 || !(grip || rtg || (b.fl >= 0 && b.fl < .45 && i < b.fn && S.rope)) || AL < 120 && grip && !S.rope) continue; /* short spans: the ropes only (v5.6 fix 1: the edge hair bowed; the core slit carries the fibre read) */
        if (fo && b.fl >= .2) sm = pow(1 - cl((b.fl - .2 - i % 4 * .008) / .22, 0, 1), 1.5); /* v5.5 fix 4: after the throw each strand whips back along its own path, 8ms apart (no wedge) */
        if (sm < .02) continue;
        /* v5.2 fix 2: the path is root -> (quadratic, leaving along the pill's normal) -> its slot on the axis at 30% of the span (later at short
           range, so >= 3 ropes stay separate) -> straight along the slot -> 30px before the tip -> tip. The slot is never relaxed or scaled. */
        var jf = .3 /* v5.4 fix 4: every span joins its slot by 30% (one solid core, short or long) */, tx2 = S.tx, ty2 = S.ty, d2 = sm * AL; z = abs(ux) > .6 && grip ? AL * .55 : min(max(AL * jf, (ax - ex) * aux + (ay - ey) * auy + 14), AL * .6); /* v5.7 fix 1: corner poses (pointer within 45deg of a pill end) join at 55% of the span (no J-hook); a root ahead of the join joins 14px past itself */ /* a root ahead of the join on an oblique axis joins 14px past itself (no hairpin) */
        if (rtg) { so *= 1 - min(1, b.rt / .06); var fan = ((i % 5) - 2) * 4 * min(1, b.rt / .03); tx2 = ex + b.svx * d2 - b.svy * fan; ty2 = ey + b.svy * d2 + b.svx * fan; z = min(z, d2 * .5); } /* v5.7 fix 2: the tips fan +-8px across the snap axis (pointer velocity at snap), never a blade */ /* recoil: the slots collapse onto the axis within 60ms and every strand retracts along it */
        var jx = ex + aux * z + nxp * so, jy = ey + auy * z + nyp * so, e2 = max(z, hy(tx2 - ex, ty2 - ey) - min(30, AL * .2)), /* separation zone min(30px, 20% of the span) */ lb = .1 * (e2 - z), lo2 = so + cl((s2 + o1) * (fo ? 1 : .65) - so, -lb, lb), /* v5.4: the slots draw in to 65% by K: the cable narrows into the fist like a wrist */ kx = ex + aux * e2 + nxp * lo2, ky = ey + auy * e2 + nyp * lo2 + min(sg, lb); /* the slot change J -> K (crossing, sag, vibration) only as fast as the room allows */
        if (grip && AL < 120) { /* v5.5 fix 1: short spans: the last min(12px, 15%) before the fist splits into 3 tips entering it; the hair lies on the core's outer edge */
          var kr = b.k0 * b.gr, gq = i < 2 ? 1 : i > 2 ? -1 : 0; lo2 = gq * 4; /* by K the ropes gather into 3 groups (0, +-4) */
          e2 = max(z, AL * .8 + 1, AL - kr - min(12, (AL - kr) * .15)); tx2 = Mx - aux * kr * .3 + nxp * gq * 6; ty2 = My - auy * kr * .3 + nyp * gq * 6; /* the split starts past 80% (R8 fix 4 holds) and the 3 tips end inside the fist */ kx = ex + aux * e2 + nxp * lo2; ky = ey + auy * e2 + nyp * lo2; }
        var f = (1 - .35 * str) * (1 - .25 * h) * (1 - .6 * rk2) * (.55 + .45 * cl((D0 - 40) / 50, 0, 1)), w0 = S.rope ? /* ropes thin at short range so >= 3 stay separate */ grip || rtg ? max(1.4, S.w * f) : cl(S.w * .5, 2.6, 4) : S.w; if (S.rope && grip && AL < 120) w0 = min(w0, 1.4); /* short spans: thin roots, so >= 3 ropes stay apart on the hem side of the join */
        var wb2 = rtg || fo && b.fl >= .2; if (wb2) { var q1 = (tx2 - ax) * S.lf, q2 = (ty2 - ay) * S.lf, c3 = cos(S.cv), s3 = sin(S.cv); tx2 = ax + q1 * .5 + (q1 * c3 - q2 * s3) * .5; ty2 = ay + q2 * .5 + (q1 * s3 + q2 * c3) * .5; } /* fix 1: curled, unequal strands */
        if (rtg || fo) { var f3 = cut(b, ax, ay, tx2, ty2); tx2 = ax + (tx2 - ax) * f3; ty2 = ay + (ty2 - ay) * f3; } /* fix 3: every recoil/whip strand ends >= 4px short of a sibling (geometry, no mask) */
        if (fo) { kx = ax + (tx2 - ax) * (wb2 ? .5 : .7); ky = ay + (ty2 - ay) * (wb2 ? .5 : .7); } var wq = fo ? 0 : cl((e2 - z) / 10, 0, 1), jbx = kx + (jx - kx) * wq, jby = ky + (jy - ky) * wq, cxv = jbx - ax, cyv = jby - ay, cl2 = hy(cxv, cyv) || 1; cxv /= cl2; cyv /= cl2;
          var ex2 = kx - jbx + cxv * .3, ey2 = ky - jby + cyv * .3, el = hy(ex2, ey2) || 1; ex2 /= el; ey2 /= el; var l4 = cl2 / 3, mx3 = cxv, my3 = cyv; /* v5.7 fix 1: every root leaves along its chord (measured: starting on the pill normal adds 2-12deg per 6px at the corners) */ /* v5.6 fix 1: leave between the chord and the even arc's mirror, so the outward bow (chord/2 * tan(theta/2) for the full arc) stays <= 2.5px */
          /* root -> its slot J (by 30% of the span) as one even arc: leaves along the mirror of its arrival about the chord, arrives along the slot; then straight down the slot to K (<= 12deg per 6px) */
          RJ = AL * .35; L3 = rope(sx, ax, ay, ax + mx3 * l4, ay + my3 * l4, jbx - ex2 * l4, jby - ey2 * l4, jbx, jby, kx, ky, tx2, ty2, w0, S.rope ? 1.6 : S.w, rtg ? 1 : sm, S.rope && !fo, grip && AL < 120 ? -9 : bd + 4); var lx = ax + mx3 * l4, ly = ay + my3 * l4, cxj = jbx - lx, cyj = jby - ly, cn = hy(cxj, cyj) || 1, sgE = cxj * (ey - ly) - cyj * (ex - lx) > 0 ? 1 : -1; for (k = 1; k < 7; k++) { if (k > 1) b.bw3 = max(b.bw3, -sgE * (cxj * (RY[k] - ly) - cyj * (RX[k] - lx)) / cn); if (k > 1 && RL[k] < 30) { var h1 = atan2(RY[k] - RY[k - 1], RX[k] - RX[k - 1]) - atan2(RY[k - 1] - RY[k - 2], RX[k - 1] - RX[k - 2]); b.t30 = max(b.t30, abs((h1 + 9.42) % 6.28 - 3.14) * 344 / max(6, RL[k] - RL[k - 2])); } } /* suite: bulge outside the chord; turn per 6px over the first 30px */ /* one cubic root -> funnel -> slot -> down the slot (no elbow), then straight to the tip */
        if (S.rope) { b.wm = max(b.wm, w0); b.mw.push(cl(w0 * .75, 4.2, 6)); } /* the drawn mid width (v5.3 solid core) */
        /* chord rule per strand: its cable (slot -> tip) is straight within 4% */
        if (grip) { b.vb = max(b.vb, abs(vb)); b.sq = max(b.sq, (abs(o1) * .75 + sg * .5) / AL); } /* bowing: only vibration and sag bend a strand */
        if (wb2) { b.rl = max(b.rl, sm); b.rg2.push([tx2, ty2, kx, ky, ax, ay]); } /* suite: tip, bend, root of every recoil/whip strand */
      }
      /* 1-2 light slits (1px) drifting along the cable between ropes, suggesting twist (fix 1) */
      sx.strokeStyle = INK; /* destination-out takes the source alpha: an opaque stroke, or the slit only fades the ink */
      if (grip) { var g2 = b.sz[0] < PI ? 1.6 : -1.6, z3 = AL * .3, e3 = max(AL * .8 + 1, AL - b.k0 * b.gr - min(12, (AL - b.k0 * b.gr) * .15)); eo(sx); sx.lineWidth = 1; sx.moveTo(ex + aux * z3 + nxa * g2, ey + auy * z3 + nya * g2); sx.lineTo(ex + aux * AL * .8 + nxa * g2 * (1 - .35 * cl((AL * .8 - z3) / (e3 - z3 || 1), 0, 1)), ey + auy * AL * .8 + nya * g2 * (1 - .35 * cl((AL * .8 - z3) / (e3 - z3 || 1), 0, 1))); sx.stroke(); sx.restore(); } /* v5.5 fix 1 (every span since v5.6): one visible 1px slit between two ropes, join -> 80%, following the wrist */
      b.g0 = 0; rl.sort((p, q) => p[0] - q[0]);
      /* v5.2 fix 1: the band grows out of the pill. Its top is the pill's own underside (4px inside the fill), its ends curve in tangent
         to the pill, and its hem is one smooth wave: bd out at each rope, 4px shallower between neighbours. No straight top, no corners. */
      b.bo2 = [];
      if (bd > .5 && rl.length > 1) {
        var L0 = rl[0], L1 = rl[rl.length - 1];
        var s0 = sp(b, L0[1], L0[2]), PP = 2 * (b.x1 - b.x0) + TAU * rr, ds = sp(b, L1[1], L1[2]) - s0; ds -= PP * M.round(ds / PP); /* arc length along the pill's own outline */
        var kk2 = pow(rtg ? cl(1 - b.rt / .22, 0, 1) : b.fl >= .2 && !grip ? cl(1 - (b.fl - .2) / .22, 0, 1) : 1, 2.5); if (kk2 < 1) { if (hy(L0[1] - Mx, L0[2] - My) > hy(L1[1] - Mx, L1[2] - My)) s0 += ds * (1 - kk2); ds *= kk2; } /* v5.8 fix 1: on recoil the band shortens from its far end, at the ropes' rate */
        for (j = 0; j <= 48; j++) { var t = j / 48; ps(b, s0 + ds * t); BX[j] = EX - NX * 4; BY[j] = EY - NY * 4; z = sin(PI * t); z *= z * bd; BX[97 - j] = EX + NX * z; BY[97 - j] = EY + NY * z; } /* v5.5 fix 2: a root swell h = H sin^2(pi t), no shelf, no scallops */
        sx.beginPath(); sx.moveTo(BX[0], BY[0]); for (j = 1; j < 97; j++) sx.quadraticCurveTo(BX[j], BY[j], (BX[j] + BX[j + 1]) / 2, (BY[j] + BY[j + 1]) / 2); sx.lineTo(BX[97], BY[97]); sx.fill(); /* v5.5 fix 6: midpoint quadratic spline (same points) */ b.bo2 = BX; b.hm = BY; /* (the suite reads both arrays) */
        /* v5.4 fix 1: the band is matte solid ink (the pill's own CSS highlight carries the gloss) */
      }
      /* a 0.8px highlight down the two thickest ropes, hugging their lit edge, stopping 10px short of the knot */
      /* ooze (fix 5): 5-7 teardrops from the rope roots, uneven widths, pinched at 40%, a bead r = 0.45*root width, leaning <= 25deg toward the pointer, growing 40-120ms apart */
      if (b.oz > .05 && !grip && !rtg && b.fl < 0) rl.forEach(R => { /* v5.8: no ooze under a flick (its beads merged with the strands) */
        var S = R[5], ax = R[1], ay = R[2], qx2 = cl(ax, b.x0, b.x1), nx = ax - qx2, ny = ay - qy, l = hy(nx, ny) || 1, vx = Mx - ax, vy = My - ay, an;
        nx /= l; ny /= l; ax -= ny * S.dj; ay += nx * S.dj; an = cl(atan2(nx * vy - ny * vx, nx * vx + ny * vy), -.26, .26) + S.dn; vx = nx * cos(an) - ny * sin(an); vy = nx * sin(an) + ny * cos(an);
        var w = max(6, S.dw * min(1, .4 + b.oz * 2)), pw = max(3, w * .6), L = /* v5.6 fix 3: root 6-8, neck 0.6 x root (>= 3px) at 40%, bead r 0.45 x root */ (S.dl + 4) * cl((b.oq - S.dd) / .25, 0, 1), /* v5.7 fix 3: full length 0.25-0.35s after entering 200px */ r = .45 * w; for (var g3 = 0; hit(b, ax, ay, ax + vx * (L + w), ay + vy * (L + w)); g3++) { if (g3 > 4) return; L *= .75; } /* v5.8 fix 3: a drip never reaches a sibling (shortened, else not drawn) */ var kx = ax + vx * L * .4, ky = ay + vy * L * .4, bx2 = ax + vx * (L - r), by2 = ay + vy * (L - r);
        if (L < 2) return;
        ln(ax, ay, kx, ky); rib(sx, SP, w, pw); ln(kx, ky, bx2, by2); rib(sx, SP, pw, max(3, 1.8 * r)); dot(sx, bx2, by2, r); /* v5.4 fix 6: >= 3px over the first 70%, bead r = 0.45 * root width */
        b.dz.push([w, pw, r, an * 57.3, L - 4, min(w, pw, pw + (max(3, 1.8 * r) - pw) * min(1, .3 * L / max(.1, .6 * L - r))), pw, ax, ay]);
      });
      /* knot (fix 4): 6 ellipses (union r 7-10) just short of the hotspot, squeezing on heaves; 3-5 tips coil 1-1.5 turns on top; a 4px gap keeps the arrow tip visible */
      if (b.gr > .05 && !rtg) {
        /* v5.2 fix 4: a fist, not a washer: a lumpy disc r0*(1 + 0.15*noise(3*theta)), re-dealt per grab, clenching on heaves;
           3 coils (2.2px, 1-1.25 turns at r 9-11) on top; a 50deg notch toward -135deg (the arrow tip) keeps the tip itself ink-free */
        var ks = (1 - .15 * sqrt(h)) * b.gr * b.k0, kx0 = Mx + b.ko[0], ky0 = My + b.ko[1]; b.kk = [kx0, ky0, ks];
        sx.beginPath(); for (j = 0; j < 24; j++) { var th = j / 24 * TAU, rr2 = KR[j] = ks * (1 + .15 * nz(b.kq, th * 3 + T * 2)); j ? sx.lineTo(kx0 + cos(th) * rr2, ky0 + sin(th) * rr2) : sx.moveTo(kx0 + cos(th) * rr2, ky0 + sin(th) * rr2); } sx.fill();
        /* 3 short tapered coils (0.5-0.55 turn) at 7/9/11px (scaled with the fist), 120deg apart from a random start, each ending in a 1.5px bead (fix 2) */
        /* v5.4 fix 3: 3 coils (0.5-0.55 turn, 120deg apart) hug the fist's own edge: 3 -> 2px wide, each starts 0.6px inside it and ends 0.5px outside in a 1.1px bead (outer edge <= body + 1.6px), so every coil is joined to the body (no ring) */
        b.ca = []; if (b.gr > .5) for (k = 0; k < 3; k++) { var a0 = b.cp + k * TAU / 3, th = b.cs * b.gr, q = 6; for (j = 0; j < q; j++) { var u0 = j / q, u1 = (j + 1) / q, aa = a0 + th * u0, ab = a0 + th * u1; curl(sx, kx0, ky0, rb(aa) - .6 + 1.1 * u0, aa, th / q, rb(ab) - .6 + 1.1 * u1, 3 - u0, 3 - u1); } var ae = a0 + th, re = rb(ae) + .5; dot(sx, kx0 + cos(ae) * re, ky0 + sin(ae) * re, 1.1); b.ca.push([a0, th, re]); }
        eo(sx); sx.moveTo(Mx, My); sx.arc(Mx, My, 4.5, -2.79, -1.92); sx.fill(); dot(sx, Mx, My, 1.6); sx.restore();
      }
      /* parked on the button: a few short drips sway on the edge nearest the pointer (no grip) */
      /* parked: 2-3 straight teardrops 6-14px, each ending in a bead r = 0.35*length (>= 2px), swaying +-3px at 0.4Hz as a rotation about the root (v4.3 fix 7) */
      b.dr = [];
      if (b.dp > .01) {
        var nd = 2 + (b.sd * 7 | 0) % 2;
        for (k = 0; k < nd; k++) {
          var bx = cl(b.qx + (k - (nd - 1) / 2) * 12, b.x0, b.x1), by = qy + rr - 2, fr = 6 + 8 * (b.sd * (k + 3) % 1), Ld = fr * b.dp, th = 3 / fr * sin(TAU * .4 * T + k * 1.7 + b.sd), dx2 = sin(th), dy2 = cos(th), bx2 = bx + dx2 * Ld, by2 = by + dy2 * Ld;
          set(SP, bx, by, bx + dx2 * Ld / 3, by + dy2 * Ld / 3, bx + dx2 * Ld * 2 / 3, by + dy2 * Ld * 2 / 3, bx2, by2);
          rib(sx, SP, 3, 3); dot(sx, bx2, by2, max(2, .35 * Ld)); b.dr.push([bx, by, bx2, by2]);
        }
      }
      /* splash: concave spikes rise in 60ms, hold, then spring back elastically; droplets fall (the pill itself wobbles at 9Hz via its CSS scale) */
      if (b.sp >= 0) {
        var t = b.sp, cxs = b.sqx + b.px, f2 = t < .06 ? t / .06 : t < .15 ? 1 : (z = min(1, (t - .15) / .45), (1 - z) * (.8 + .2 * cos(z * 18))); /* rise 60ms, hold 90ms, then melt back over 450ms with an elastic ripple; clean by 600ms (fix 2) */
        b.sl = 0;
        for (i = 0; i < NK; i++) {
          k = b.k[i]; var ca = cos(k.a), sa = sin(k.a), L2 = k.l * f2;
          if (L2 > .5 && (pj(b, cxs + ca * rr, qy + sa * rr, -1), !hit(b, EX, EY, EX + ca * (L2 + 4), EY + sa * (L2 + 4)))) { /* v5.8 fix 3 */
            b.sl = max(b.sl, L2); pj(b, cxs + ca * rr, qy + sa * rr, -1);
            var mx2 = EX + ca * L2 * .3, my2 = EY + sa * L2 * .3;
            sx.beginPath(); sx.moveTo(EX - sa * k.w, EY + ca * k.w); sx.quadraticCurveTo(mx2, my2, EX + ca * L2, EY + sa * L2); sx.quadraticCurveTo(mx2, my2, EX + sa * k.w, EY - ca * k.w); sx.fill();
          }
          if (k.r) { k.v += 600 * dt; k.x += k.u * dt; k.y += k.v * dt; if (hit(b, k.x, k.y, k.x, k.y) || t > k.lf) k.r = 0; else dot(sx, k.x, k.y, 1.5 + (k.r - 1.5) * (1 - t / k.lf)); } /* solid droplets live 300-500ms, shrinking to 1.5px (never grey dust), and die on a sibling */
        }
      }
      /* v5.4 fix 2: nothing inside the pill: erase its outline (leaning and squashed like the button) inset 0.5px, so the band still overlaps the edge by its AA pixel */
      var hx = (b.x1 - b.x0) / 2 + rr - .5; eo(sx); sx.translate((b.x0 + b.x1) / 2, qy); sx.scale(sxv, syv); sx.roundRect(-hx, .5 - rr, hx * 2, rr * 2 - 1, rr - .5); sx.fill(); sx.restore();
      return true;
    }
    /* keep o[a],o[c] within r of (x,y) */
    function kp(o, a, c, x, y, r) { var u = o[a] - x, v = o[c] - y, l = hy(u, v); if (l > r) { o[a] = x + u / l * r; o[c] = y + v / l * r; } }
    function ek(dt, k) { return 1 - exp(-dt * k); }
    function dot(c, x, y, r) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
    /* the point on the pill outline nearest (x,y), pushed o px outward */
    var EX, EY;
    function pj(b, x, y, o) { var qx = cl(x, b.x0, b.x1), vx = x - qx, vy = y - b.qy, l = hy(vx, vy) || 1; EX = qx + vx / l * (b.rr + o); EY = b.qy + vy / l * (b.rr + o); }
    /* does segment (x,y)-(X,Y) touch a sibling's rect (inflated 4px)? exact slab test, no closures (fix 8) */
    function eo(c) { c.save(); c.globalCompositeOperation = 'destination-out'; c.beginPath(); } /* erase mode (bytes) */
    function cut(b, x, y, X, Y) { for (var f = 1; f > .1 && hit(b, x, y, x + (X - x) * f, y + (Y - y) * f); f -= .1); return f; }
    function hit(b, x, y, X, Y) {
      for (var i = 0, R = b.R, r; r = R[i]; i++) {
        for (var t0 = 0, t1 = 1, e = 0, o, v, a1, a2; e < 2; e++) {
          o = e ? y : x; v = (e ? Y : X) - o;
          if (v) { a1 = (r[e] - o) / v; a2 = (r[e + 2] - o) / v; t0 = max(t0, min(a1, a2)); t1 = min(t1, max(a1, a2)); } else if (o <= r[e] || o >= r[e + 2]) t1 = -1;
        }
        if (t0 < t1) return 1;
      }
    }
    /* a finger: an arc of radius r0 round (cx,cy) from angle a0 through th, drawn as a tapered ribbon */
    function curl(c, cx, cy, r0, a0, th, r1, wa, wb) { r1 = r1 || r0; var a1 = a0 + th, kk = 4 / 3 * M.tan(th / 4), x0 = cx + cos(a0) * r0, y0 = cy + sin(a0) * r0, x3 = cx + cos(a1) * r1, y3 = cy + sin(a1) * r1; set(SP, x0, y0, x0 - kk * r0 * sin(a0), y0 + kk * r0 * cos(a0), x3 + kk * r1 * sin(a1), y3 - kk * r1 * cos(a1), x3, y3); rib(c, SP, wa || 2.2, wb || wa || 2.2); }
    var SP = F(8), QX, QY, QTX, QTY;
    /* a rope: quadratic root->slot, straight slot->k, straight k->tip; width w0 (root) -> 0.85*w0 along the cable -> w1 over the last 30px.
       sm < 1 draws only the first sm of its length. Writes the outline into HX/HY and fills one path. */
    var RX = F(16), RY = F(16), RL = F(16);
    function rope(c, ax, ay, cx, cy, dx, dy, jx, jy, kx, ky, tx, ty, w0, w1, sm, tap, hd) {
      var n = 0, i, t, u, L = 0, wc = tap ? cl(w0 * .75, 4.2, 6) : w0; /* v5.3: 4.2-6px ropes on a 3.2px pitch: one solid ~17px cable */
      for (i = 0; i <= 7; i++) { t = i / 7; u = 1 - t; RX[n] = u * u * u * ax + 3 * u * u * t * cx + 3 * u * t * t * dx + t * t * t * jx; RY[n++] = u * u * u * ay + 3 * u * u * t * cy + 3 * u * t * t * dy + t * t * t * jy; }
      for (i = 1; i <= 3; i++) { RX[n] = jx + (kx - jx) * i / 3; RY[n++] = jy + (ky - jy) * i / 3; }
      for (i = 1; i <= 4; i++) { RX[n] = kx + (tx - kx) * i / 4; RY[n++] = ky + (ty - ky) * i / 4; }
      for (RL[0] = 0, i = 1; i < n; i++) RL[i] = L += hy(RX[i] - RX[i - 1], RY[i] - RY[i - 1]);
      var m = 0, cut = sm * L;
      for (i = 0; i < n; i++) {
        var px = RX[i], py = RY[i];
        if (RL[i] > cut) { t = (cut - RL[i - 1]) / (RL[i] - RL[i - 1] || 1); px = RX[i - 1] + (px - RX[i - 1]) * t; py = RY[i - 1] + (py - RY[i - 1]) * t; }
        var a = max(0, i - 1), e = min(n - 1, i + 1), dx = RX[e] - RX[a], dy = RY[e] - RY[a], l = hy(dx, dy) || 1, sl = min(RL[i], cut),
          hw = .5 * (sl < min(RL[7], RJ) ? w0 + (wc - w0) * sl / min(RL[7], RJ) : w1 + (wc - w1) * pow(cl((L - sl) / max(6, L - RL[10]), 0, 1), .7)) /* taper only past K (the separation zone) */ + (tap ? 2.5 * pow(cl((hd + 6 - sl) / 6, 0, 1), 2) : 0); /* one 4-6px fillet per rope where it leaves the band */
        HX[m] = px - dy / l * hw; HY[m] = py + dx / l * hw; HX[31 - m] = px + dy / l * hw; HY[31 - m] = py - dx / l * hw; m++;
        if (RL[i] > cut) break;
      }
      c.beginPath(); c.moveTo(HX[0], HY[0]); for (i = 1; i < m; i++) c.lineTo(HX[i], HY[i]); for (i = 32 - m; i < 32; i++) c.lineTo(HX[i], HY[i]); c.fill();
      return L;
    }
    /* the pill outline by arc length: s = 0 at the bottom-left corner of the flat, running right along the bottom, round the right cap, back along the top, round the left cap */
    function rb(a) { a = (a % TAU + TAU) % TAU / TAU * 24; var i0 = a | 0; return KR[i0] + (KR[(i0 + 1) % 24] - KR[i0]) * (a - i0); } /* v5.7 fix 4: hoisted (a per-frame closure here re-tiered V8 mid-grip: the cold hitch) */
    var RJ = 12, KR = F(24), NX, NY, BX = F(98), BY = F(98);
    function ps(b, s) {
      var L = b.x1 - b.x0, r = b.rr, P = 2 * L + TAU * r, a; s = (s % P + P) % P;
      if (s < L) { NX = 0; NY = 1; EX = b.x0 + s; EY = b.qy + r; return; }
      if ((s -= L) < PI * r) { a = PI / 2 - s / r; NX = cos(a); NY = sin(a); EX = b.x1 + NX * r; EY = b.qy + NY * r; return; }
      if ((s -= PI * r) < L) { NX = 0; NY = -1; EX = b.x1 - s; EY = b.qy - r; return; }
      a = -PI / 2 - (s - L) / r; NX = cos(a); NY = sin(a); EX = b.x0 + NX * r; EY = b.qy + NY * r;
    }
    function sp(b, x, y) {
      var L = b.x1 - b.x0, r = b.rr, a = atan2(y - b.qy, x - cl(x, b.x0, b.x1));
      if (x > b.x0 && x < b.x1) return y > b.qy ? x - b.x0 : L + PI * r + b.x1 - x;
      if (x >= b.x1) return L + (PI / 2 - a) * r;
      if (a > 0) a -= TAU; return 2 * L + PI * r + (-PI / 2 - a) * r;
    }
    function ln(a, b, c, d) { set(SP, a, b, a + (c - a) / 3, b + (d - b) / 3, a + (c - a) * 2 / 3, b + (d - b) * 2 / 3, c, d); }
    function set(P, a, b, c, d, e, f, g, h) { P[0] = a; P[1] = b; P[2] = c; P[3] = d; P[4] = e; P[5] = f; P[6] = g; P[7] = h; }
    function cub(P, s) {
      var r = 1 - s, u = r * r, w = s * s, v = 2 * r * s, a = u * r, p = 3 * u * s, q = 3 * r * w, t = w * s; /* no closures: this runs ~600 times a frame (fix 8) */
      QX = a * P[0] + p * P[2] + q * P[4] + t * P[6]; QY = a * P[1] + p * P[3] + q * P[5] + t * P[7];
      var tx = u * (P[2] - P[0]) + v * (P[4] - P[2]) + w * (P[6] - P[4]), ty = u * (P[3] - P[1]) + v * (P[5] - P[3]) + w * (P[7] - P[5]), l = hy(tx, ty) || 1;
      QTX = tx / l; QTY = ty / l;
    }
    /* a ribbon: the cubic P drawn up to s = sm as a filled tapered band (w0 at the root -> w1 at the tip), with a fine wobble that fades toward the tip and the tug bulge */
    function F(n) { return new Float32Array(n); }
    var HX = F(32), HY = F(32);
    function rib(c, P, w0, w1) {
      for (var j = 0; j <= N; j++) {
        var s = j / N, hw = .5 * (w1 + (w0 - w1) * (1 - s));
        cub(P, s);
        HX[j] = QX - QTY * hw; HY[j] = QY + QTX * hw; HX[2 * N + 1 - j] = QX + QTY * hw; HY[2 * N + 1 - j] = QY - QTX * hw;
      }
      c.beginPath(); c.moveTo(HX[0], HY[0]); for (j = 1; j < 2 * N + 2; j++) c.lineTo(HX[j], HY[j]); c.fill();
    }

    return function () {
      LS.forEach(l => l[0].removeEventListener(l[1], l[2], P));
      if (running) { running = false; gsap.ticker.remove(tick); } grab(-1);
      btns.forEach(b => {
        rs(b); b.a.classList.remove('cta--venom', 'is-caught'); b.cv.remove(); b.host.classList.remove('venom-host');
      });
    };
  });
})();
