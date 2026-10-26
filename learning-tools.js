/* Learning Tools — all local, nothing is sent anywhere.
   1. The panel lifts flat as it scrolls in (CSS); this marks when it is up,
      so the top edges can light in turn and every course can send its light
      into BoxArrow once.
   2. Card borders catch the pointer, and a soft light follows it.
   3. Pointing at a course sends a light into BoxArrow; the component that
      course teaches takes its colour and does its job.
   4. BoxArrow runs a small live system: requests fan out from a load
      balancer, most reads stop at a sharded cache, writes replicate, slow
      work goes through a queue, and now and then a server fails, the
      balancer routes around it, and it comes back.
   The page's "Motion off" switch and the system's reduced-motion setting
   both stop everything that moves here. */
(function () {
  'use strict';

  var root = document.documentElement;
  var grid = document.querySelector('[data-lt-grid]');
  if (!grid) return;
  var panel = grid.closest('.lt-panel');
  var hub = grid.querySelector('[data-hub]');
  var svg = hub && hub.querySelector('[data-sysmap]');
  var caption = hub && hub.querySelector('[data-hub-caption]');
  var cards = Array.prototype.slice.call(grid.querySelectorAll('.lt-card'));
  var courses = cards.filter(function (c) { return c.hasAttribute('data-link'); });
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  var wide = window.matchMedia('(min-width: 1240px)');
  var captionText = caption ? caption.textContent : '';
  var NS = 'http://www.w3.org/2000/svg';

  function moving() { return !reduce.matches && root.dataset.motion !== 'paused'; }
  function hueOf(card) { return getComputedStyle(card).getPropertyValue('--hue').trim(); }
  function node(id) { return svg.querySelector('[data-node="' + id + '"]'); }
  function flash(el, cls, ms) {
    if (!el) return;
    el.classList.remove(cls); void el.getBoundingClientRect(); el.classList.add(cls);
    clearTimeout(el['_t' + cls]);
    el['_t' + cls] = setTimeout(function () { el.classList.remove(cls); }, ms);
  }

  /* 1 · Entrance --------------------------------------------------------- */
  var entered = false;
  if (moving() && 'IntersectionObserver' in window) {
    root.classList.add('lt-motion');
    var sda = window.CSS && CSS.supports && CSS.supports('animation-timeline: view()');
    var seen = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      seen.disconnect();
      if (panel) panel.classList.add('is-up');
      grid.classList.add('is-in');
      entered = true;
      setTimeout(assemble, sda ? 650 : 1000);
    }, { threshold: sda && wide.matches ? 0.42 : 0.12 });
    seen.observe(grid);
  } else {
    grid.classList.add('is-in');
    entered = true;
  }

  /* 2 · Pointer light ---------------------------------------------------- */
  var amb = grid.querySelector('.lt-grid__amb');
  var rects = null;
  function measure() { rects = cards.map(function (c) { return c.getBoundingClientRect(); }); }
  grid.addEventListener('pointerenter', measure);
  window.addEventListener('scroll', function () { rects = null; }, { passive: true });
  window.addEventListener('resize', function () { rects = null; });
  grid.addEventListener('pointermove', function (e) {
    if (!fine.matches) return;
    if (!rects) measure();
    for (var i = 0; i < cards.length; i++) {
      cards[i].style.setProperty('--mx', (e.clientX - rects[i].left) + 'px');
      cards[i].style.setProperty('--my', (e.clientY - rects[i].top) + 'px');
    }
  });
  grid.addEventListener('pointerleave', function () {
    cards.forEach(function (c) { c.style.setProperty('--mx', '-400px'); c.style.setProperty('--my', '-400px'); });
    grid.classList.remove('is-hovering');
  });
  cards.forEach(function (card) {
    card.addEventListener('pointerenter', function () {
      if (!amb || !fine.matches || !moving()) return;
      amb.style.setProperty('--ax', (card.offsetLeft + card.offsetWidth / 2) + 'px');
      amb.style.setProperty('--ay', (card.offsetTop + card.offsetHeight / 2) + 'px');
      amb.style.setProperty('--amb', hueOf(card));
      grid.classList.add('is-hovering');
    });
  });

  if (!svg) return;

  /* 3 · Lights into BoxArrow -------------------------------------------- */
  var canvas = document.querySelector('[data-lt-flight]');
  /* The layer lives on <body>: a transformed ancestor (the panel, mid-lift)
     would otherwise become its containing block and offset every light. */
  if (canvas) document.body.appendChild(canvas);
  var ctx = canvas && canvas.getContext('2d');
  var flights = [], flightFrame = 0, dpr = 1;
  function sizeCanvas() {
    if (!canvas) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(innerWidth * dpr);
    canvas.height = Math.round(innerHeight * dpr);
  }
  function centre(el) { var r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  /* A light leaves the course's own loop and arcs into one component. */
  function fly(card, target, delay, done) {
    if (!ctx || !moving()) { if (done) setTimeout(done, delay || 0); return; }
    var from = card.querySelector('.lt-card__stage') || card;
    var a = centre(from), b = centre(target);
    var dist = Math.hypot(b[0] - a[0], b[1] - a[1]);
    flights.push({
      from: from, to: target, color: hueOf(card),
      start: performance.now() + (delay || 0),
      dur: Math.min(900, 360 + dist * 0.6),
      bend: (Math.random() < 0.5 ? -1 : 1) * (0.16 + Math.random() * 0.1),
      done: done
    });
    if (!flightFrame) { sizeCanvas(); flightFrame = requestAnimationFrame(drawFlights); }
  }
  function point(f, t) {
    var a = centre(f.from), b = centre(f.to);
    var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    var dx = b[0] - a[0], dy = b[1] - a[1];
    var cx = mx - dy * f.bend, cy = my + dx * f.bend;
    var u = 1 - t;
    return [u * u * a[0] + 2 * u * t * cx + t * t * b[0], u * u * a[1] + 2 * u * t * cy + t * t * b[1]];
  }
  function drawFlights(now) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.globalCompositeOperation = 'lighter';
    for (var i = flights.length - 1; i >= 0; i--) {
      var f = flights[i];
      var t = (now - f.start) / f.dur;
      if (t < 0) continue;
      if (t >= 1) { flights.splice(i, 1); if (f.done) f.done(); continue; }
      /* A tapered tail: short segments along the curve, thinning and fading
         toward the end, so the light reads as one comet, not a dotted line. */
      var prev = null;
      ctx.lineCap = 'round';
      ctx.strokeStyle = f.color;
      for (var k = 18; k >= 0; k--) {
        var p = point(f, ease(Math.max(0, t - k * 0.013)));
        if (prev) {
          var w = 1 - k / 18;
          ctx.globalAlpha = 0.7 * w * w;
          ctx.lineWidth = 0.5 + 2.8 * w;
          ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(p[0], p[1]); ctx.stroke();
        }
        prev = p;
      }
      var head = point(f, ease(t));
      var glow = ctx.createRadialGradient(head[0], head[1], 0, head[0], head[1], 14);
      glow.addColorStop(0, f.color);
      glow.addColorStop(1, 'transparent');
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(head[0], head[1], 14, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(head[0], head[1], 2.1, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    flightFrame = flights.length ? requestAnimationFrame(drawFlights) : 0;
    if (!flightFrame) ctx.clearRect(0, 0, innerWidth, innerHeight);
  }
  window.addEventListener('resize', function () { if (flightFrame) sizeCanvas(); });

  function targets(card) {
    var link = card.getAttribute('data-link');
    if (link === 'fault') return [servers[healthyServer()].g];
    return link.split(' ').map(node).filter(Boolean);
  }
  function tint(nodes, color, on) {
    nodes.forEach(function (n) {
      if (on) { n.style.setProperty('--link', color); n.classList.add('is-linked'); }
      else n.classList.remove('is-linked');
    });
  }

  var focused = null;
  function setCaption(card) {
    if (!caption) return;
    if (!card) { caption.textContent = captionText; caption.style.color = ''; return; }
    caption.textContent = '↳ ' + card.getAttribute('data-role') + ' · ' + card.querySelector('.lt-card__title').textContent;
    caption.style.color = hueOf(card);
  }
  function enter(card) {
    focused = card;
    var color = hueOf(card), list = targets(card);
    /* Bug Museum breaks the very server its light lands on. */
    var victim = card.getAttribute('data-link') === 'fault' ? servers.map(function (s) { return s.g; }).indexOf(list[0]) : -1;
    setCaption(card);
    list.forEach(function (n, i) {
      fly(card, n, i * 70, function () {
        if (focused !== card) return;
        tint([n], color, true);
        flash(n, 'is-hit', 260);
        if (i === 0) act(card, victim);
      });
    });
  }
  function leave(card) {
    if (focused === card) focused = null;
    tint(Array.prototype.slice.call(svg.querySelectorAll('.is-linked')), null, false);
    setCaption(null);
  }
  function hubEnter() {
    focused = hub;
    courses.forEach(function (card, i) {
      var color = hueOf(card);
      targets(card).forEach(function (n, j) {
        fly(card, n, i * 60 + j * 40, function () { if (focused === hub) { tint([n], color, true); flash(n, 'is-hit', 260); } });
      });
    });
  }
  if (fine.matches) {
    courses.forEach(function (card) {
      card.addEventListener('pointerenter', function () { enter(card); });
      card.addEventListener('pointerleave', function () { leave(card); });
    });
    hub.addEventListener('pointerenter', hubEnter);
    hub.addEventListener('pointerleave', function () { leave(hub); });
  }
  courses.forEach(function (card) {
    card.addEventListener('focus', function () { enter(card); });
    card.addEventListener('blur', function () { leave(card); });
  });

  /* Once, when the panel is up: every course sends its light in, and the
     diagram lights up in all eight colours before settling. */
  function assemble() {
    if (!moving()) return;
    courses.forEach(function (card, i) {
      var color = hueOf(card);
      targets(card).forEach(function (n, j) {
        fly(card, n, i * 110 + j * 50, function () {
          if (focused) return;
          tint([n], color, true);
          setTimeout(function () { if (!focused) tint([n], null, false); }, 1100);
        });
      });
    });
  }

  /* 4 · BoxArrow: a live system in 240 × 62 ----------------------------- */
  var layer = svg.querySelector('[data-packets]');
  function line(pts) {
    var segs = [], len = 0;
    for (var i = 1; i < pts.length; i++) {
      var l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      segs.push(l); len += l;
    }
    return { pts: pts, segs: segs, len: len };
  }
  function at(pl, d) {
    for (var i = 0; i < pl.segs.length; i++) {
      if (d <= pl.segs[i]) {
        var a = pl.pts[i], b = pl.pts[i + 1], t = pl.segs[i] ? d / pl.segs[i] : 0;
        return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      }
      d -= pl.segs[i];
    }
    return pl.pts[pl.pts.length - 1];
  }
  function upTo(pl, k) { var s = 0; for (var i = 0; i < k; i++) s += pl.segs[i]; return s; }

  var CLIENT_Y = [14.5, 47.5], SERVER_Y = [9.5, 31, 52.5], SHARD_X = [162.5, 193, 223.5];
  var servers = SERVER_Y.map(function (y, i) {
    var g = node('s' + (i + 1));
    return { g: g, bar: g.querySelector('.sys-load'), down: false, inflight: 0, load: 0 };
  });
  var cache = node('cache'), db = node('db'), replica = node('replica'), queue = node('queue'), worker = node('worker');
  var shards = cache.querySelectorAll('.sys-shard'), slots = queue.querySelectorAll('.sys-slot');
  var packets = [], rr = 0, jobs = 0;
  var t = 0, nextReq = 0.2, nextJob = 1.4, nextFail = 4.2, nextSpark = 6;

  function Packet(pts, opt) {
    this.pl = line(pts);
    this.d = 0; this.wait = 0; this.dying = 0;
    this.speed = opt.speed || 74;
    this.stops = opt.stops || [];
    this.hide = opt.hide || [];
    this.end = opt.end;
    var c = document.createElementNS(NS, 'circle');
    c.setAttribute('r', opt.r || 1.7);
    c.setAttribute('class', 'sys-packet' + (opt.cls ? ' ' + opt.cls : ''));
    c.setAttribute('opacity', '0');
    layer.appendChild(c);
    this.el = c;
    packets.push(this);
  }
  Packet.prototype.kill = function () { this.dying = 1; this.el.setAttribute('class', 'sys-packet sys-packet--drop'); };
  function setSlots() { for (var i = 0; i < slots.length; i++) slots[i].classList.toggle('is-full', i < jobs); }

  function request(only, client) {
    var s = -1;
    for (var n = 0; n < servers.length; n++) {
      var k = rr++ % servers.length;
      if (!servers[k].down) { s = k; break; }
    }
    if (s < 0) return;
    var cy = CLIENT_Y[client != null ? client : (Math.random() < 0.5 ? 0 : 1)], sy = SERVER_Y[s], srv = servers[s];
    var roll = Math.random();
    var target = only || (roll < 0.55 ? 'cache' : roll < 0.75 ? 'read' : roll < 0.88 ? 'write' : 'queue');
    var ty = target === 'cache' ? 9.5 : target === 'queue' ? 52.5 : 31;
    var shard = Math.floor(Math.random() * 3);
    var pts = [[22.5, cy], [31, cy], [31, 31], [40.5, 31], [61.5, 31], [72, 31], [72, sy], [82.5, sy], [122.5, sy], [134, sy], [134, ty], [146.5, ty]];
    pts.push(target === 'cache' ? [SHARD_X[shard], 9.5] : target === 'queue' ? [152, 52.5] : [156, 31]);
    var pl = line(pts);
    var lbIn = upTo(pl, 3), lbOut = upTo(pl, 4), sIn = upTo(pl, 7), sOut = upTo(pl, 8);
    new Packet(pts, {
      hide: [[lbIn, lbOut], [sIn, sOut]],
      stops: [
        { at: sIn, dur: 0.16, fn: function () { if (srv.down) return false; srv.inflight++; return true; } },
        { at: sOut, fn: function () { srv.inflight = Math.max(0, srv.inflight - 1); return true; } }
      ],
      end: function () {
        if (target === 'cache') flash(shards[shard], 'is-hit', 260);
        else if (target === 'read') flash(db, 'is-hit', 220);
        else if (target === 'write') {
          flash(db, 'is-hit', 220);
          new Packet([[184.5, 31], [201.5, 31], [208, 31]], { speed: 46, cls: 'sys-packet--async', hide: [[17, 24]], end: function () { flash(replica, 'is-hit', 260); } });
        } else { jobs = Math.min(slots.length, jobs + 1); setSlots(); }
      }
    });
  }

  function job() {
    if (!jobs) return;
    jobs--; setSlots();
    new Packet([[184.5, 52.5], [201.5, 52.5], [206, 52.5]], { speed: 40, cls: 'sys-packet--async', end: function () { flash(worker, 'is-busy', 800); } });
  }

  function healthyServer() {
    var up = [];
    servers.forEach(function (s, i) { if (!s.down) up.push(i); });
    return up.length ? up[Math.floor(Math.random() * up.length)] : 0;
  }
  function fail(index, fixed) {
    var up = servers.filter(function (s) { return !s.down; });
    var s = index != null ? servers[index] : up[Math.floor(Math.random() * up.length)];
    if (!s || s.down || up.length < 2) return;
    s.down = true; s.inflight = 0;
    s.g.classList.add('is-down');
    setTimeout(function () {
      s.down = false;
      s.g.classList.remove('is-down');
      flash(s.g, fixed ? 'is-fixed' : 'is-back', fixed ? 1200 : 1000);
    }, fixed ? 1700 : 2700);
  }

  /* What each course's component does when you point at the course. */
  function act(card, victim) {
    if (!running) return;
    var i;
    switch (card.getAttribute('data-role')) {
      case 'clients': for (i = 0; i < 4; i++) (function (i) { setTimeout(function () { request(null, i % 2); }, i * 130); })(i); break;
      case 'load drill': for (i = 0; i < 14; i++) (function (i) { setTimeout(function () { request(null, i % 2); }, i * 70); })(i); break;
      case 'load balancing': for (i = 0; i < 6; i++) setTimeout(function () { request(); }, i * 120); break;
      case 'API servers': for (i = 0; i < 5; i++) setTimeout(function () { request(); }, i * 110); break;
      case 'cache': for (i = 0; i < 5; i++) setTimeout(function () { request('cache'); }, i * 130); break;
      case 'database & replica': for (i = 0; i < 3; i++) setTimeout(function () { request('write'); }, i * 220); break;
      case 'queue & worker': for (i = 0; i < 3; i++) setTimeout(function () { request('queue'); }, i * 160); break;
      case 'failure & fix': fail(victim, true); break;
    }
  }

  function step(dt) {
    t += dt;
    if (t >= nextReq) { request(); nextReq = t + 0.26 + Math.random() * 0.24; }
    if (t >= nextJob) { job(); nextJob = t + 0.9 + Math.random() * 0.3; }
    if (t >= nextFail) { if (!focused) fail(); nextFail = t + 7 + Math.random() * 3; }
    /* Now and then a course sends its light in on its own. */
    if (t >= nextSpark) {
      if (entered && !focused && fine.matches && wide.matches) {
        var card = courses[Math.floor(Math.random() * courses.length)];
        var list = targets(card), color = hueOf(card);
        fly(card, list[0], 0, function () {
          if (focused) return;
          tint([list[0]], color, true); flash(list[0], 'is-hit', 260);
          setTimeout(function () { if (!focused) tint([list[0]], null, false); }, 900);
        });
      }
      nextSpark = t + 6.5 + Math.random() * 4;
    }

    for (var i = packets.length - 1; i >= 0; i--) {
      var p = packets[i];
      if (p.dying) {
        p.dying -= dt * 2.4;
        p.el.setAttribute('opacity', Math.max(0, p.dying).toFixed(3));
        if (p.dying <= 0) { p.el.remove(); packets.splice(i, 1); }
        continue;
      }
      if (p.wait > 0) { p.wait -= dt; continue; }
      var nd = p.d + p.speed * dt;
      if (p.stops.length && p.stops[0].at <= nd) {
        var s = p.stops.shift();
        p.d = s.at;
        if (s.fn && s.fn() === false) { p.kill(); continue; }
        p.wait = s.dur || 0;
      } else {
        p.d = Math.min(nd, p.pl.len);
      }
      var xy = at(p.pl, p.d), o = Math.min(1, p.d / 5, (p.pl.len - p.d) / 4 + 0.15);
      for (var h = 0; h < p.hide.length; h++) if (p.d > p.hide[h][0] + 0.5 && p.d < p.hide[h][1] - 0.5) o = 0;
      p.el.setAttribute('cx', xy[0].toFixed(2));
      p.el.setAttribute('cy', xy[1].toFixed(2));
      p.el.setAttribute('opacity', Math.max(0, o).toFixed(3));
      if (p.d >= p.pl.len) { if (p.end) p.end(); p.el.remove(); packets.splice(i, 1); }
    }

    for (var j = 0; j < servers.length; j++) {
      var sv = servers[j];
      sv.load += (Math.min(1, sv.inflight / 1.6) - sv.load) * Math.min(1, dt * 5);
      sv.bar.setAttribute('width', (19 * sv.load).toFixed(2));
    }
  }

  var running = false, last = 0, raf = 0, visible = false;
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    step(dt);
    raf = requestAnimationFrame(frame);
  }
  function start() { if (running || !moving()) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(raf); }
  function sync() { if (visible && !document.hidden && moving()) start(); else stop(); }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; sync(); }).observe(svg);
  } else { visible = true; }
  document.addEventListener('visibilitychange', sync);
  reduce.addEventListener && reduce.addEventListener('change', sync);
  /* Follow the page's own Motion on/off switch. */
  new MutationObserver(function () {
    sync();
    if (!moving()) { flights.length = 0; grid.classList.add('is-in'); }
  }).observe(root, { attributes: true, attributeFilter: ['data-motion'] });
  sync();
})();
