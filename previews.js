/* The two project previews.
   PetNote advances every 2.6 seconds; AgentTape every 2 seconds, so a visitor can
   see they are interactive. Pointing at a preview pauses it; the first real
   click hands it over for good. Nothing moves with reduced motion or with
   the footer's Motion off switch. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  function moving() { return !reduce.matches && root.dataset.motion !== 'paused'; }

  /* A preview that advances itself on a timer until a visitor takes over. */
  function autoplay(cover, opts) {
    var auto = true, visible = false, hovering = false, timer = 0;
    var live = opts.live;
    function running() { return auto && visible && !hovering && !document.hidden && moving(); }
    function schedule() {
      clearTimeout(timer);
      if (!running()) return;
      timer = setTimeout(function () {
        if (!running()) return;
        opts.next();
        schedule();
      }, opts.interval);
    }
    function stop() {
      if (!auto) return;
      auto = false;
      clearTimeout(timer);
      if (live) live.setAttribute('aria-live', 'polite');
    }
    // While it plays by itself, screen readers are not told about every turn.
    if (live) live.setAttribute('aria-live', 'off');
    cover.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { hovering = true; schedule(); } });
    cover.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { hovering = false; schedule(); } });
    cover.addEventListener('click', function (e) { if (e.isTrusted && e.target.closest('button')) stop(); });
    cover.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') stop(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        schedule();
      }, { threshold: 0.45 }).observe(cover);
    }
    document.addEventListener('visibilitychange', schedule);
    new MutationObserver(schedule).observe(root, { attributes: true, attributeFilter: ['data-motion'] });
  }

  /* ---- PetNote: the pets, the places, the people ------------------------ */
  var pet = document.querySelector('.pet-cover');
  if (pet) {
    var tabs = Array.prototype.slice.call(pet.querySelectorAll('[data-pet-select]'));
    autoplay(pet, {
      interval: 2600,
      live: pet.querySelector('.pet-stage'),
      next: function () {
        var i = tabs.findIndex(function (b) { return b.getAttribute('aria-pressed') === 'true'; });
        tabs[(i + 1) % tabs.length].click();   // the same switch a visitor's click makes
      }
    });
  }

  /* ---- AgentTape: an example session, one message at a time ------------- */
  var tape = document.querySelector('[data-at]');
  if (!tape) return;
  var win = tape.querySelector('.at-window');
  var rows = Array.prototype.slice.call(tape.querySelectorAll('.at-row'));
  var fill = tape.querySelector('[data-at-fill]'), jump = tape.querySelector('[data-at-jump]');
  var pct = tape.querySelector('[data-at-pct]'), count = tape.querySelector('[data-at-count]');
  var caption = tape.querySelector('[data-at-caption]');
  var step = 0;
  var JUMP = 10;   // a single step that adds this many points of context is flagged

  function render(i, quiet) {
    step = (i + rows.length) % rows.length;
    var ctx = Number(rows[step].dataset.ctx), prev = step ? Number(rows[step - 1].dataset.ctx) : 0;
    var isJump = ctx - prev >= JUMP;
    rows.forEach(function (row, n) {
      row.setAttribute('aria-pressed', String(n === step));
      row.classList.toggle('is-future', n > step);
      row.classList.remove('is-entering');
    });
    if (!quiet && moving()) { void rows[step].offsetWidth; rows[step].classList.add('is-entering'); }
    fill.style.setProperty('--fill', (isJump ? prev : ctx) + '%');
    jump.style.setProperty('--jump-from', prev + '%');
    jump.style.setProperty('--jump', (isJump ? ctx - prev : 0) + '%');
    win.classList.toggle('is-jump', isJump);
    pct.textContent = ctx + '%';
    count.textContent = String(step + 1).padStart(2, '0') + ' / ' + String(rows.length).padStart(2, '0');
    caption.textContent = rows[step].dataset.caption;
  }

  autoplay(tape, { interval: 2000, live: caption, next: function () { render(step + 1); } });

  rows.forEach(function (row, n) { row.addEventListener('click', function () { render(n); }); });
  tape.querySelector('[data-at-prev]').addEventListener('click', function () { render(step - 1); });
  tape.querySelector('[data-at-next]').addEventListener('click', function () { render(step + 1); });

  render(0, true);
})();
