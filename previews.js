/* The two project previews.
   Both play on their own while they are on screen, so a visitor can see they
   are interactive. Pointing at a preview pauses it; the first real click
   hands it over for good. Nothing moves with reduced motion or with the
   footer's Motion off switch. */
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
    function restartCue() {
      // Restart the fill line under the active tab or step, timed to this wait.
      cover.classList.remove('is-auto');
      cover.style.setProperty('--auto-ms', opts.delay() + 'ms');
      void cover.offsetWidth;
      if (auto && moving()) cover.classList.add('is-auto');
    }
    function schedule() {
      clearTimeout(timer);
      cover.classList.toggle('is-paused', !running());
      if (!running()) return;
      timer = setTimeout(function () {
        if (!running()) return;
        opts.next();
        restartCue();
        schedule();
      }, opts.delay());
    }
    function stop() {
      if (!auto) return;
      auto = false;
      clearTimeout(timer);
      cover.classList.remove('is-auto', 'is-paused');
      if (live) live.setAttribute('aria-live', 'polite');
    }
    // While it plays by itself, screen readers are not told about every turn.
    if (live) live.setAttribute('aria-live', 'off');
    cover.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { hovering = true; schedule(); } });
    cover.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { hovering = false; restartCue(); schedule(); } });
    cover.addEventListener('click', function (e) { if (e.isTrusted && e.target.closest('button')) stop(); });
    cover.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') stop(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) restartCue();
        schedule();
      }, { threshold: 0.45 }).observe(cover);
    }
    document.addEventListener('visibilitychange', schedule);
    new MutationObserver(function () { if (!moving()) cover.classList.remove('is-auto'); else restartCue(); schedule(); })
      .observe(root, { attributes: true, attributeFilter: ['data-motion'] });
    if (moving()) cover.classList.add('is-auto');
    return { stop: stop, isAuto: function () { return auto; } };
  }

  /* ---- PetNote: the pets, the places, the people ------------------------ */
  var pet = document.querySelector('.pet-cover');
  if (pet) {
    var tabs = Array.prototype.slice.call(pet.querySelectorAll('[data-pet-select]'));
    autoplay(pet, {
      live: pet.querySelector('.pet-stage'),
      delay: function () { return 3600; },
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
  var play = tape.querySelector('[data-at-play]');
  var playIcon = tape.querySelector('[data-at-play-icon]'), playLabel = tape.querySelector('[data-at-play-label]');
  var step = 0, playing = false, playTimer = 0;
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

  function setPlaying(value) {
    playing = value;
    clearTimeout(playTimer);
    play.setAttribute('aria-pressed', String(playing));
    playIcon.textContent = !moving() ? '→' : playing ? 'Ⅱ' : '▶';
    playLabel.textContent = !moving() ? 'Next step' : playing ? 'Pause the trace' : 'Play the trace';
    if (playing && moving()) tick();
  }
  function tick() {
    playTimer = setTimeout(function () {
      if (!playing) return;
      if (step === rows.length - 1) { setPlaying(false); return; }
      render(step + 1);
      tick();
    }, 1700);
  }

  var player = autoplay(tape, {
    live: caption,
    /* Each message holds a moment; the last one holds longer before the
       session starts over, so the context jump can be read. */
    delay: function () { return step === rows.length - 1 ? 3400 : 1900; },
    next: function () { render(step + 1); }
  });

  rows.forEach(function (row, n) {
    row.addEventListener('click', function () { setPlaying(false); render(n); });
  });
  tape.querySelector('[data-at-prev]').addEventListener('click', function () { setPlaying(false); render(step - 1); });
  tape.querySelector('[data-at-next]').addEventListener('click', function () { setPlaying(false); render(step + 1); });
  play.addEventListener('click', function () {
    if (!moving()) { render(step + 1); return; }
    if (!playing && step === rows.length - 1) render(0);
    setPlaying(!playing);
  });
  new MutationObserver(function () { setPlaying(playing && moving()); })
    .observe(root, { attributes: true, attributeFilter: ['data-motion'] });

  render(0, true);
  setPlaying(false);
})();
