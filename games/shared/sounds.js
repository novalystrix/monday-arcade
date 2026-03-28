/**
 * Monday Arcade — Web Audio Synthesized Sound Library
 * No external audio files. All sounds generated with oscillators + envelopes.
 * AudioContext created lazily on first user gesture (browser autoplay policy).
 */
(function () {
  'use strict';

  let ctx = null;
  const MUTE_KEY = 'arcade-muted';

  function ensureCtx() {
    if (ctx) return ctx;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { /* silent */ }
    return ctx;
  }

  // Resume on first interaction (Safari / Chrome autoplay policy)
  function resumeOnGesture() {
    const resume = () => {
      ensureCtx();
      if (ctx && ctx.state === 'suspended') ctx.resume();
    };
    document.addEventListener('click', resume, { once: false, capture: true });
    document.addEventListener('touchstart', resume, { once: false, capture: true });
    document.addEventListener('keydown', resume, { once: false, capture: true });
  }
  resumeOnGesture();

  function isMuted() {
    return localStorage.getItem(MUTE_KEY) === '1';
  }

  function toggleMute() {
    const muted = !isMuted();
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
    // Update any existing buttons
    document.querySelectorAll('.arcade-sound-btn').forEach(b => {
      b.textContent = muted ? '🔇' : '🔊';
    });
    return muted;
  }

  // Helper: play an oscillator with gain envelope
  function play(fn) {
    try {
      if (isMuted()) return;
      const c = ensureCtx();
      if (!c || c.state === 'closed') return;
      if (c.state === 'suspended') c.resume();
      fn(c);
    } catch (e) { /* silent */ }
  }

  function osc(c, type, freq, startTime, duration, gainVal) {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(gainVal, startTime);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    o.connect(g);
    g.connect(c.destination);
    o.start(startTime);
    o.stop(startTime + duration + 0.05);
  }

  // ── Sounds ────────────────────────────────────────────────────────────

  /** Short click/tap feedback */
  function tap() {
    play(c => {
      const t = c.currentTime;
      osc(c, 'sine', 1200, t, 0.05, 0.15);
    });
  }

  /** Correct answer / positive action — ascending two-tone */
  function success() {
    play(c => {
      const t = c.currentTime;
      osc(c, 'sine', 520, t, 0.1, 0.15);
      osc(c, 'sine', 780, t + 0.08, 0.12, 0.15);
    });
  }

  /** Wrong answer / negative — low buzz */
  function error() {
    play(c => {
      const t = c.currentTime;
      osc(c, 'sawtooth', 130, t, 0.15, 0.1);
    });
  }

  /** Combo multiplier — pitch increases with n */
  function combo(n) {
    play(c => {
      const t = c.currentTime;
      const freq = 400 + Math.min(n || 1, 10) * 80;
      osc(c, 'sine', freq, t, 0.1, 0.15);
    });
  }

  /** Timer tick — subtle click */
  function tick() {
    play(c => {
      const t = c.currentTime;
      osc(c, 'sine', 900, t, 0.03, 0.08);
    });
  }

  /** Game over — descending tone */
  function gameOver() {
    play(c => {
      const t = c.currentTime;
      const o1 = c.createOscillator();
      const g1 = c.createGain();
      o1.type = 'sine';
      o1.frequency.setValueAtTime(440, t);
      o1.frequency.exponentialRampToValueAtTime(120, t + 0.5);
      g1.gain.setValueAtTime(0.18, t);
      g1.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      o1.connect(g1);
      g1.connect(c.destination);
      o1.start(t);
      o1.stop(t + 0.55);
    });
  }

  /** Victory fanfare — ascending arpeggio */
  function win() {
    play(c => {
      const t = c.currentTime;
      const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        osc(c, 'sine', freq, t + i * 0.15, 0.2, 0.12);
      });
      // Final shimmer
      osc(c, 'triangle', 1047, t + 0.6, 0.25, 0.08);
    });
  }

  /** Bubble/item pop — short high blip */
  function pop() {
    play(c => {
      const t = c.currentTime;
      const o1 = c.createOscillator();
      const g1 = c.createGain();
      o1.type = 'sine';
      o1.frequency.setValueAtTime(1400, t);
      o1.frequency.exponentialRampToValueAtTime(600, t + 0.08);
      g1.gain.setValueAtTime(0.12, t);
      g1.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      o1.connect(g1);
      g1.connect(c.destination);
      o1.start(t);
      o1.stop(t + 0.1);
    });
  }

  /** Create and append a mute toggle button */
  function initSoundButton(container) {
    const btn = document.createElement('button');
    btn.className = 'arcade-sound-btn';
    btn.textContent = isMuted() ? '🔇' : '🔊';
    btn.setAttribute('aria-label', 'Toggle sound');
    Object.assign(btn.style, {
      position: 'fixed',
      top: '12px',
      right: '16px',
      zIndex: '9999',
      background: 'rgba(30,30,50,0.7)',
      border: '1px solid #333',
      borderRadius: '8px',
      padding: '6px 10px',
      fontSize: '1.2rem',
      cursor: 'pointer',
      color: '#fff',
      lineHeight: '1',
      backdropFilter: 'blur(4px)',
    });
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMute();
    });
    (container || document.body).appendChild(btn);
    return btn;
  }

  // ── Export globally ───────────────────────────────────────────────────
  window.ArcadeSound = {
    tap, success, error, combo, tick, gameOver, win, pop,
    isMuted, toggleMute, initSoundButton
  };
})();
