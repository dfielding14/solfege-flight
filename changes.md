You’re running into a **real, classic solfège + octave problem**, not just “bad calibration.”

### Why the old calibration felt inverted

In your current build, the game effectively treats pitch as **“which scale degree (Do/Re/…/Ti) regardless of octave”**. That means:

* A note **just below Do** (e.g., B below C) is **Ti** (same pitch class), and your game maps **Ti to the top lane**.
* So singing *slightly lower than Do* can make the character jump *up*.
* Singing higher can also “wrap” (octave effects) and feel like it moves the wrong way.

So even if the pitch detector is working, the **mapping logic is ambiguous near octave boundaries**.

### What I’m changing

1. Add a **Tutorial & Calibration wizard** (like a guitar tuner app):

* Shows live: **Hz**, **closest note name** (C4, A3, etc.), **cents offset**, **clarity**, **volume**
* Explains:

  * how pitch detection works
  * what solfège is
  * what the game expects (one-octave mapping)

2. Make calibration more robust:

* Two options:

  * **“Match C first (tuner-style)”** with a reference tone
  * **“Pick any comfortable Do”** (recommended if you don’t know C)
* Then a **guided full-scale calibration** (Do→Ti) with reference tones and “hold steady” progress.

3. Fix the “inversion” by changing the mapping:

* After calibration, the game maps your pitch into **one specific octave range** (Do…Ti).
* If you sing *below* Do, it clamps to Do (bottom).
* If you sing *above* Ti, it clamps to Ti (top).
* That guarantees: **higher pitch → higher position** (within the trained range).

---

# Drop-in update (replace your 3 files)

## 1) Replace `solfege-flight/index.html`

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Solfège Flight</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <canvas id="game" aria-label="Solfège Flight game canvas"></canvas>

  <div id="ui">
    <!-- MENU -->
    <div id="screen-menu" class="screen">
      <h1>Solfège Flight</h1>
      <p>
        Sing <b>Do–Re–Mi–Fa–Sol–La–Ti</b> to move the note on the staff.
        The game will guide you through a tuner-style calibration so “higher pitch goes up.”
      </p>

      <div class="row">
        <label class="opt">
          <span class="label">Level:</span>
          <select id="level-select"></select>
        </label>
      </div>
      <p id="level-desc" class="small"></p>

      <div class="row">
        <button id="btn-start">Start (Tutorial & Calibration)</button>
        <button id="btn-keyboard" class="secondary">Play with Keyboard</button>
      </div>

      <p class="small">
        Mic audio is processed locally in your browser. Nothing is uploaded.
        Headphones help if you use reference tones.
      </p>

      <p id="menu-error" class="error hidden"></p>
    </div>

    <!-- WIZARD -->
    <div id="screen-wizard" class="screen hidden">
      <div class="wizard-head">
        <h2 id="wiz-title">Tutorial & Calibration</h2>
        <div id="wiz-step" class="small">Step —</div>
      </div>

      <div class="split">
        <!-- Live Analysis -->
        <div class="panel">
          <h3>Live microphone analysis</h3>

          <div class="kv">
            <div><span class="label">Pitch:</span> <span id="live-freq">—</span></div>
            <div><span class="label">Closest note:</span> <span id="live-note">—</span></div>
          </div>

          <div class="kv">
            <div><span class="label">Clarity:</span> <span id="live-clarity">—</span></div>
            <div><span class="label">Volume:</span> <span id="live-volume">—</span></div>
          </div>

          <div class="gauge">
            <div class="gauge-center"></div>
            <div id="gauge-needle" class="gauge-needle"></div>
          </div>
          <div class="kv">
            <div><span class="label">Offset:</span> <span id="live-cents">—</span></div>
            <div><span class="label">Detected solfège:</span> <span id="live-solfege">—</span></div>
          </div>

          <div class="small muted">
            Tip: a steady vowel like “doo” or “ah” works better than consonants.
          </div>
        </div>

        <!-- Step Instructions -->
        <div class="panel">
          <h3 id="wiz-step-title">—</h3>
          <p id="wiz-text">—</p>

          <div id="wiz-mode" class="row hidden">
            <button id="btn-mode-c">Try to match C first (tuner-style)</button>
            <button id="btn-mode-do" class="secondary">Use any comfortable “Do”</button>
          </div>

          <div id="wiz-target" class="target hidden">
            <div class="kv">
              <div><span class="label">Target:</span> <span id="target-label">—</span></div>
              <div><span class="label">Hold:</span> <span id="hold-status">—</span></div>
            </div>

            <div class="row">
              <button id="btn-tone" class="secondary">Play reference tone</button>
              <button id="btn-tone2" class="secondary hidden">Play (alt octave)</button>
            </div>

            <div class="meter">
              <div id="hold-bar" class="meter-bar"></div>
            </div>

            <p id="target-hint" class="small muted"></p>
          </div>

          <div id="wiz-checklist" class="hidden">
            <p class="small muted">
              Scale checklist: try to make each one light up once.
            </p>
            <div id="checkgrid" class="checkgrid"></div>
          </div>

          <p id="wiz-error" class="error hidden"></p>

          <div class="row">
            <button id="btn-wiz-back" class="secondary">Back</button>
            <button id="btn-wiz-next">Next</button>
            <button id="btn-wiz-skip" class="secondary">Skip text</button>
          </div>

          <p class="small muted">
            Reference tones can leak into the mic if you use speakers—headphones are best.
          </p>
        </div>
      </div>
    </div>

    <!-- HUD -->
    <div id="hud" class="hud hidden">
      <div class="hud-row">
        <div><span class="label">Level:</span> <span id="hud-level">—</span></div>
        <div><span class="label">Progress:</span> <span id="hud-progress">0/0</span></div>
        <div><span class="label">Next:</span> <span id="hud-next">—</span></div>
      </div>

      <div class="hud-row">
        <div>
          <span class="label">You:</span> <span id="hud-you">—</span>
          <span id="hud-tune" class="small"></span>
        </div>

        <div class="mic">
          <span class="label">Mic:</span>
          <div class="meter slim"><div id="mic-bar" class="meter-bar"></div></div>
        </div>

        <button id="btn-pause" class="secondary smallbtn">Pause</button>
      </div>
    </div>

    <!-- PAUSED -->
    <div id="screen-paused" class="screen hidden">
      <h2>Paused</h2>
      <div class="row">
        <button id="btn-resume">Resume</button>
        <button id="btn-restart" class="secondary">Restart Level</button>
        <button id="btn-menu" class="secondary">Back to Menu</button>
      </div>
      <p class="small">Keyboard: Up/Down to move. Esc toggles pause.</p>
    </div>

    <!-- LEVEL COMPLETE -->
    <div id="screen-complete" class="screen hidden">
      <h2 id="complete-title">Level Complete!</h2>
      <p id="complete-stats" class="small"></p>
      <div class="row">
        <button id="btn-nextlevel">Next Level</button>
        <button id="btn-replay" class="secondary">Replay Level</button>
        <button id="btn-complete-menu" class="secondary">Back to Menu</button>
      </div>
    </div>
  </div>

  <script src="game.js"></script>
</body>
</html>
```

---

## 2) Replace `solfege-flight/style.css`

```css
html, body {
  width: 100%;
  height: 100%;
  margin: 0;
  overflow: hidden;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  background: #f8f4ea;
}

#game {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  display: block;
  background: #f8f4ea;
}

#ui {
  position: fixed;
  inset: 0;
  pointer-events: none;
}

.screen {
  pointer-events: auto;
  max-width: 980px;
  margin: 5vh auto 0 auto;
  padding: 18px 18px;
  background: rgba(255, 255, 255, 0.90);
  border: 1px solid rgba(0,0,0,0.12);
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.10);
}

.hud {
  pointer-events: auto;
  position: fixed;
  left: 12px;
  right: 12px;
  top: 12px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(0,0,0,0.12);
  border-radius: 12px;
  backdrop-filter: blur(4px);
}

.hud-row {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
}

.hidden { display: none; }

.row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 10px;
  align-items: center;
}

button {
  border: 1px solid rgba(0,0,0,0.25);
  background: white;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
  cursor: pointer;
}

button.secondary {
  background: rgba(255,255,255,0.65);
}

button.smallbtn {
  padding: 6px 10px;
  border-radius: 10px;
}

select {
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid rgba(0,0,0,0.25);
  background: white;
  font-size: 14px;
}

.opt {
  display: block;
  user-select: none;
}

.small {
  font-size: 12px;
  opacity: 0.9;
  line-height: 1.4;
}

.label {
  opacity: 0.7;
  margin-right: 6px;
}

.error {
  color: #b00020;
  font-size: 13px;
  margin-top: 10px;
}

.muted {
  opacity: 0.72;
}

.meter {
  width: 100%;
  height: 18px;
  border-radius: 10px;
  border: 1px solid rgba(0,0,0,0.18);
  background: rgba(0,0,0,0.05);
  overflow: hidden;
}

.meter.slim {
  width: 160px;
  height: 12px;
}

.meter-bar {
  height: 100%;
  width: 0%;
  background: rgba(0,0,0,0.65);
  transition: width 80ms linear;
}

.mic {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Wizard layout */
.wizard-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.split {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

.panel {
  flex: 1 1 420px;
  border: 1px solid rgba(0,0,0,0.10);
  border-radius: 12px;
  padding: 12px;
  background: rgba(255,255,255,0.72);
}

.kv {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.target {
  margin-top: 10px;
}

/* Tuner gauge */
.gauge {
  position: relative;
  height: 18px;
  border-radius: 10px;
  border: 1px solid rgba(0,0,0,0.18);
  background: rgba(0,0,0,0.05);
  overflow: hidden;
  margin-top: 10px;
}

.gauge-center {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  background: rgba(0,0,0,0.25);
}

.gauge-needle {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  left: 50%;
  background: rgba(0,0,0,0.75);
  transform: translateX(-1px);
  transition: left 80ms linear;
}

/* Checklist */
.checkgrid {
  display: grid;
  grid-template-columns: repeat(7, minmax(40px, 1fr));
  gap: 8px;
  margin-top: 10px;
}

.check {
  text-align: center;
  padding: 8px 6px;
  border-radius: 10px;
  border: 1px solid rgba(0,0,0,0.18);
  background: rgba(0,0,0,0.05);
  font-weight: 700;
}

.check.ok {
  background: rgba(0,0,0,0.75);
  color: white;
}
```

---

## 3) Replace `solfege-flight/game.js`

This version adds:

* wizard tutorial + tuner UI
* “match C first” calibration option with reference tones
* guided Do→Ti scale calibration
* a monotonic mapping using boundaries so low notes never “wrap” upward

```js
(() => {
  'use strict';

  /********************
   * CONFIG
   ********************/
  const CONFIG = {
    // Pitch detection gates:
    minFreqHz: 80,
    maxFreqHz: 1100,
    minRms: 0.012,
    minClarity: 0.28,

    // Voice control smoothing:
    stableFramesNeeded: 3,

    // Calibration:
    holdSeconds: 0.85,
    captureToleranceCents: 55,     // for matching calibration targets
    tunerNeedleRangeCents: 50,     // needle shows [-50..+50]
    stabilityWindow: 14,           // for movable-Do stability check
    stabilityMaxDevCents: 28,

    // Gameplay:
    baseScrollSpeed: 240,
    maxScrollSpeed: 420,
    speedPerClear: 6,
    spawnTimeMin: 1.35,
    spawnTimeMax: 2.00,
    gapHeightFactor: 2.35,
    obstacleWidth: 74,

    // Bounce:
    bounceDuration: 0.26,
    bounceSpeedFactor: 0.62,
    collisionCooldown: 0.20,

    // Visual:
    staffSpacingMin: 18,
    staffSpacingMax: 30,
    noteSize: 16,
    noteHitboxW: 28,
    noteHitboxH: 20,
  };

  const SOLFEGE = [
    { name: 'DO',  semis: 0 },
    { name: 'RE',  semis: 2 },
    { name: 'MI',  semis: 4 },
    { name: 'FA',  semis: 5 },
    { name: 'SOL', semis: 7 },
    { name: 'LA',  semis: 9 },
    { name: 'TI',  semis: 11 },
  ];

  /********************
   * LEVELS (same as before)
   ********************/
  function levelScaleUp() { return ['DO','RE','MI','FA','SOL','LA','TI']; }
  function levelUpAndDown() {
    return ['DO','RE','MI','FA','SOL','LA','TI','LA','SOL','FA','MI','RE','DO'];
  }
  function levelCumulative() {
    const seq = [];
    for (let top = 0; top <= 6; top++) {
      for (let i = 0; i <= top; i++) seq.push(SOLFEGE[i].name);
      for (let i = top - 1; i >= 0; i--) seq.push(SOLFEGE[i].name);
    }
    return seq;
  }
  function level123454321() { return ['DO','RE','MI','FA','SOL','FA','MI','RE','DO']; }

  // (You can keep/remove extra melody levels; they’ll work best within one octave.)
  const LEVELS = [
    { title: 'Level 1 — Scale Up', desc: 'Do–Re–Mi–Fa–Sol–La–Ti', build: levelScaleUp },
    { title: 'Level 2 — Up & Down', desc: 'Do–Re–…–Ti–La–…–Do', build: levelUpAndDown },
    { title: 'Level 3 — Cumulative', desc: 'Do; Do–Re–Do; Do–Re–Mi–Re–Do; …', build: levelCumulative },
    { title: 'Level 4 — 1-2-3-4-5-4-3-2-1', desc: 'Classic warm-up pattern', build: level123454321 },
  ];

  /********************
   * UTIL
   ********************/
  const $ = (sel) => document.querySelector(sel);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smoothTo = (current, target, lambda, dt) => {
    const t = 1 - Math.exp(-lambda * dt);
    return lerp(current, target, t);
  };
  const rand = (a, b) => a + Math.random() * (b - a);
  const median = (arr) => {
    if (!arr.length) return null;
    const s = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  };
  const centsBetween = (freq, target) => 1200 * Math.log2(freq / target);

  /********************
   * NOTE NAME (tuner-style)
   ********************/
  const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

  function freqToMidi(freq) {
    return 69 + 12 * Math.log2(freq / 440);
  }
  function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  function describeFreq(freq) {
    if (!freq || !isFinite(freq) || freq <= 0) return null;

    const midi = freqToMidi(freq);
    const nearest = Math.round(midi);
    const noteIndex = ((nearest % 12) + 12) % 12;
    const octave = Math.floor(nearest / 12) - 1;
    const name = NOTE_NAMES[noteIndex];
    const cents = (midi - nearest) * 100;

    return {
      freq,
      midi,
      nearestMidi: nearest,
      noteIndex,
      octave,
      name,
      label: `${name}${octave}`,
      cents,
    };
  }

  function closestMidiOfClass(midi, noteIndexTarget) {
    // MIDI notes with desired class are noteIndexTarget + 12k
    const k = Math.round((midi - noteIndexTarget) / 12);
    return noteIndexTarget + 12 * k;
  }

  function centsToNoteClass(freq, noteIndexTarget) {
    const midi = freqToMidi(freq);
    const targetMidi = closestMidiOfClass(midi, noteIndexTarget);
    const targetFreq = midiToFreq(targetMidi);
    const cents = (midi - targetMidi) * 100;
    const octave = Math.floor(targetMidi / 12) - 1;
    const label = `${NOTE_NAMES[noteIndexTarget]}${octave}`;
    return { targetMidi, targetFreq, cents, label };
  }

  /********************
   * SCALE MAP (monotonic: Do..Ti within one octave)
   ********************/
  function buildScaleFromDo(doFreqHz) {
    return SOLFEGE.map(s => doFreqHz * Math.pow(2, s.semis / 12));
  }

  function buildBounds(scaleFreqs) {
    // 6 boundaries between 7 notes (geometric means)
    const b = [];
    for (let i = 0; i < 6; i++) b.push(Math.sqrt(scaleFreqs[i] * scaleFreqs[i + 1]));
    return b;
  }

  function laneFromBounds(freq, bounds) {
    if (freq < bounds[0]) return 0;
    for (let i = 0; i < bounds.length - 1; i++) {
      if (freq < bounds[i + 1]) return i + 1;
    }
    return 6;
  }

  function analyzeSolfege(freq, scaleFreqs, bounds) {
    const lane = laneFromBounds(freq, bounds);
    const target = scaleFreqs[lane];
    const centsOff = centsBetween(freq, target);
    return {
      lane,
      name: SOLFEGE[lane].name,
      targetFreq: target,
      centsOff,
    };
  }

  /********************
   * PITCH DETECTION (ACF + octave preference fix)
   ********************/
  function detectPitchACF(buf, sampleRate, tmp, minFreq, maxFreq) {
    const n = buf.length;

    let mean = 0;
    let rms = 0;
    for (let i = 0; i < n; i++) {
      const v = buf[i];
      mean += v;
      rms += v * v;
    }
    mean /= n;
    rms = Math.sqrt(rms / n);

    if (rms < CONFIG.minRms) return null;

    for (let i = 0; i < n; i++) tmp[i] = buf[i] - mean;

    const minLag = Math.floor(sampleRate / maxFreq);
    const maxLag = Math.floor(sampleRate / minFreq);

    let bestLag = -1;
    let bestCorr = 0;

    // normalized correlation scan
    for (let lag = minLag; lag <= maxLag; lag++) {
      let sum = 0, sumSq1 = 0, sumSq2 = 0;
      for (let i = 0; i < n - lag; i++) {
        const a = tmp[i];
        const b = tmp[i + lag];
        sum += a * b;
        sumSq1 += a * a;
        sumSq2 += b * b;
      }
      const denom = Math.sqrt(sumSq1 * sumSq2);
      const corr = denom ? (sum / denom) : 0;

      if (corr > bestCorr) {
        bestCorr = corr;
        bestLag = lag;
      }
    }

    if (bestLag < 0 || bestCorr < CONFIG.minClarity) return null;

    // Helper to compute corr at lag (for octave correction + refinement)
    const corrAt = (lag) => {
      if (lag < minLag || lag > maxLag) return 0;
      let sum = 0, sumSq1 = 0, sumSq2 = 0;
      for (let i = 0; i < n - lag; i++) {
        const a = tmp[i];
        const b = tmp[i + lag];
        sum += a * b;
        sumSq1 += a * a;
        sumSq2 += b * b;
      }
      const denom = Math.sqrt(sumSq1 * sumSq2);
      return denom ? (sum / denom) : 0;
    };

    // Octave preference: if half-lag is almost as good, pick it (reduces “octave down” errors).
    let lag = bestLag;
    let corr = bestCorr;
    for (let iter = 0; iter < 2; iter++) {
      const half = Math.round(lag / 2);
      if (half >= minLag) {
        const cHalf = corrAt(half);
        if (cHalf > corr * 0.92) {
          lag = half;
          corr = cHalf;
          continue;
        }
      }
      break;
    }

    // Parabolic refinement around chosen lag
    const c1 = corrAt(lag - 1);
    const c2 = corrAt(lag);
    const c3 = corrAt(lag + 1);
    const denom = (c1 - 2 * c2 + c3);

    let shift = 0;
    if (Math.abs(denom) > 1e-9) {
      shift = 0.5 * (c1 - c3) / denom;
      shift = clamp(shift, -1, 1);
    }

    const refinedLag = lag + shift;
    const freq = sampleRate / refinedLag;

    if (!isFinite(freq) || freq < minFreq || freq > maxFreq) return null;

    return { freq, rms, clarity: corr };
  }

  /********************
   * AUDIO INPUT
   ********************/
  class AudioInput {
    constructor() {
      this.audioCtx = null;
      this.analyser = null;
      this.source = null;
      this.stream = null;

      this.buf = null;
      this.tmp = null;

      this.enabled = false;
      this.latest = null;

      this._t = 0;
      this.hz = 30;
    }

    async start() {
      if (this.enabled) {
        if (this.audioCtx && this.audioCtx.state === 'suspended') await this.audioCtx.resume();
        return;
      }

      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextCtor) throw new Error('Web Audio API not supported in this browser.');

      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });

      this.audioCtx = new AudioContextCtor();
      this.source = this.audioCtx.createMediaStreamSource(this.stream);

      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.0;

      this.source.connect(this.analyser);

      this.buf = new Float32Array(this.analyser.fftSize);
      this.tmp = new Float32Array(this.buf.length);

      this.enabled = true;
      this.latest = null;

      if (this.audioCtx.state === 'suspended') await this.audioCtx.resume();
    }

    update(dt) {
      if (!this.enabled) return null;

      this._t += dt;
      const interval = 1 / this.hz;
      if (this._t < interval) return this.latest;
      this._t = 0;

      this.analyser.getFloatTimeDomainData(this.buf);
      this.latest = detectPitchACF(this.buf, this.audioCtx.sampleRate, this.tmp, CONFIG.minFreqHz, CONFIG.maxFreqHz);
      return this.latest;
    }
  }

  /********************
   * TONE PLAYER (reference tones)
   ********************/
  class TonePlayer {
    constructor(audioCtx) {
      this.ctx = audioCtx;
    }

    play(freq, seconds = 1.0) {
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      // gentle envelope
      const t0 = this.ctx.currentTime;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.20, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t0);
      osc.stop(t0 + seconds + 0.02);
    }
  }

  /********************
   * GAME
   ********************/
  class Game {
    constructor(canvas, ctx) {
      this.canvas = canvas;
      this.ctx = ctx;

      this.w = 0;
      this.h = 0;

      this.state = 'menu'; // menu | wizard | play | paused | complete

      // Sheet layout:
      this.staffSpacing = 24;
      this.staffTop = 0;
      this.staffBottom = 0;
      this.laneStep = 0;
      this.laneYs = [];

      // Player:
      this.player = {
        x: 160,
        y: 0,
        targetLane: 3,
        halfW: CONFIG.noteHitboxW / 2,
        halfH: CONFIG.noteHitboxH / 2,
      };

      // Obstacles / run:
      this.obstacles = [];
      this.spawnTimer = rand(CONFIG.spawnTimeMin, CONFIG.spawnTimeMax);
      this.scrollOffset = 0;
      this.bounceTimer = 0;
      this.collisionCooldown = 0;
      this.bounceHintTimer = 0;
      this.bounceHintText = '';
      this.bounceCount = 0;

      // Levels:
      this.levelIndex = 0;
      this.levelSeq = [];
      this.levelSpawnIndex = 0;
      this.clearedCount = 0;
      this.levelStartMs = 0;
      this.pendingLevelIndex = 0;

      // Audio:
      this.audio = new AudioInput();
      this.tone = null;
      this.keyboardOnly = false;

      // Calibration data:
      this.doFreqHz = null;
      this.scaleFreqs = null;
      this.scaleBounds = null;

      // Detection smoothing:
      this.detected = { lane: null, name: null, centsOff: null };
      this._laneCandidate = null;
      this._laneCandidateFrames = 0;

      // Wizard:
      this.wizStep = 0;
      this.wizMode = null;     // 'fixedC' | 'movable'
      this.wizHold = 0;
      this.wizHoldSamples = [];
      this.wizStability = [];  // for movable-Do stability
      this.wizScaleIndex = 1;  // start at RE (DO already captured)
      this.wizChecks = Array(7).fill(false);
      this.voiceEstimate = null; // optional C-octave suggestion

      // UI:
      this.ui = {
        screenMenu: $('#screen-menu'),
        screenWizard: $('#screen-wizard'),
        screenPaused: $('#screen-paused'),
        screenComplete: $('#screen-complete'),
        hud: $('#hud'),

        menuError: $('#menu-error'),

        levelSelect: $('#level-select'),
        levelDesc: $('#level-desc'),

        // Wizard elements:
        wizTitle: $('#wiz-title'),
        wizStep: $('#wiz-step'),
        wizStepTitle: $('#wiz-step-title'),
        wizText: $('#wiz-text'),
        wizError: $('#wiz-error'),
        wizModeRow: $('#wiz-mode'),
        wizTarget: $('#wiz-target'),
        targetLabel: $('#target-label'),
        holdStatus: $('#hold-status'),
        holdBar: $('#hold-bar'),
        targetHint: $('#target-hint'),
        btnTone: $('#btn-tone'),
        btnTone2: $('#btn-tone2'),
        wizChecklist: $('#wiz-checklist'),
        checkgrid: $('#checkgrid'),

        // Live analysis:
        liveFreq: $('#live-freq'),
        liveNote: $('#live-note'),
        liveClarity: $('#live-clarity'),
        liveVolume: $('#live-volume'),
        liveCents: $('#live-cents'),
        liveSolfege: $('#live-solfege'),
        gaugeNeedle: $('#gauge-needle'),

        // Wizard buttons:
        btnWizBack: $('#btn-wiz-back'),
        btnWizNext: $('#btn-wiz-next'),
        btnWizSkip: $('#btn-wiz-skip'),
        btnModeC: $('#btn-mode-c'),
        btnModeDo: $('#btn-mode-do'),

        // HUD:
        hudLevel: $('#hud-level'),
        hudProgress: $('#hud-progress'),
        hudNext: $('#hud-next'),
        hudYou: $('#hud-you'),
        hudTune: $('#hud-tune'),
        micBar: $('#mic-bar'),

        // Pause/complete:
        completeTitle: $('#complete-title'),
        completeStats: $('#complete-stats'),
      };

      this._initLevelMenu();
      this._initChecklist();
      this._bindEvents();
      this._showOnly('menu');
    }

    _initLevelMenu() {
      const sel = this.ui.levelSelect;
      sel.innerHTML = '';
      LEVELS.forEach((lvl, i) => {
        const opt = document.createElement('option');
        opt.value = String(i);
        opt.textContent = lvl.title;
        sel.appendChild(opt);
      });

      const updateDesc = () => {
        const i = parseInt(sel.value, 10) || 0;
        const seqNames = LEVELS[i].build();
        this.ui.levelDesc.textContent =
          `${LEVELS[i].desc} • ${seqNames.length} notes`;
      };

      sel.addEventListener('change', updateDesc);
      sel.value = '0';
      updateDesc();
    }

    _initChecklist() {
      const grid = this.ui.checkgrid;
      grid.innerHTML = '';
      SOLFEGE.forEach((s, i) => {
        const d = document.createElement('div');
        d.className = 'check';
        d.id = `check-${i}`;
        d.textContent = s.name;
        grid.appendChild(d);
      });
    }

    _bindEvents() {
      $('#btn-start').addEventListener('click', async () => {
        this.keyboardOnly = false;
        this.pendingLevelIndex = parseInt(this.ui.levelSelect.value, 10) || 0;
        await this._startMicAndWizard();
      });

      $('#btn-keyboard').addEventListener('click', () => {
        this.keyboardOnly = true;
        this.doFreqHz = null;
        this.scaleFreqs = null;
        this.scaleBounds = null;
        const idx = parseInt(this.ui.levelSelect.value, 10) || 0;
        this.beginLevel(idx);
      });

      $('#btn-pause').addEventListener('click', () => {
        if (this.state === 'play') this._enterPaused();
        else if (this.state === 'paused') this._enterPlay();
      });

      $('#btn-resume').addEventListener('click', () => this._enterPlay());
      $('#btn-restart').addEventListener('click', () => this.restartLevel());
      $('#btn-menu').addEventListener('click', () => this.enterMenu());

      $('#btn-nextlevel').addEventListener('click', () => {
        const next = (this.levelIndex + 1) % LEVELS.length;
        this.beginLevel(next);
      });
      $('#btn-replay').addEventListener('click', () => this.restartLevel());
      $('#btn-complete-menu').addEventListener('click', () => this.enterMenu());

      // Wizard buttons
      this.ui.btnWizBack.addEventListener('click', () => this._wizardBack());
      this.ui.btnWizNext.addEventListener('click', () => this._wizardNext());
      this.ui.btnWizSkip.addEventListener('click', () => {
        // skip intro text -> jump to choose mode
        if (this.state === 'wizard') this._setWizardStep(2);
      });

      this.ui.btnModeC.addEventListener('click', () => {
        this.wizMode = 'fixedC';
        this._setWizardStep(3);
      });
      this.ui.btnModeDo.addEventListener('click', () => {
        this.wizMode = 'movable';
        this._setWizardStep(3);
      });

      this.ui.btnTone.addEventListener('click', () => {
        if (!this.tone) return;
        const f = this._currentTargetToneFreq();
        if (f) this.tone.play(f, 1.0);
      });
      this.ui.btnTone2.addEventListener('click', () => {
        if (!this.tone) return;
        const f = this._currentTargetToneFreq(true);
        if (f) this.tone.play(f, 1.0);
      });

      window.addEventListener('keydown', (e) => {
        if (this.state !== 'play' && this.state !== 'paused') return;

        if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.player.targetLane = clamp(this.player.targetLane + 1, 0, 6);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.player.targetLane = clamp(this.player.targetLane - 1, 0, 6);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          if (this.state === 'play') this._enterPaused();
          else if (this.state === 'paused') this._enterPlay();
        }
      });

      document.addEventListener('visibilitychange', () => {
        if (document.hidden && this.state === 'play') this._enterPaused();
      });
    }

    onResize(w, h) {
      this.w = w;
      this.h = h;

      this.staffSpacing = clamp(Math.floor(this.h * 0.045), CONFIG.staffSpacingMin, CONFIG.staffSpacingMax);
      this.staffTop = Math.floor(this.h / 2 - this.staffSpacing * 2);
      this.staffBottom = this.staffTop + this.staffSpacing * 4;

      this.laneStep = this.staffSpacing / 2;

      this.laneYs = [];
      for (let i = 0; i < 7; i++) {
        const p = i + 1;
        this.laneYs[i] = this.staffBottom - p * this.laneStep;
      }

      this.player.x = Math.min(180, Math.floor(this.w * 0.25));
      this.player.y = this.laneYs[this.player.targetLane];

      for (const obs of this.obstacles) {
        const gapY = this.laneYs[obs.lane];
        const gapH = this.laneStep * CONFIG.gapHeightFactor;
        obs.gapTop = gapY - gapH / 2;
        obs.gapBottom = gapY + gapH / 2;
      }
    }

    async _startMicAndWizard() {
      try {
        this._setMenuError('');
        await this.audio.start();
        this.tone = new TonePlayer(this.audio.audioCtx);
        this._enterWizard();
      } catch (err) {
        console.error(err);
        this._setMenuError(
          'Microphone access failed. You can try again, or use “Play with Keyboard”. ' +
          (err && err.message ? `(${err.message})` : '')
        );
      }
    }

    _setMenuError(msg) {
      const el = this.ui.menuError;
      if (!msg) {
        el.classList.add('hidden');
        el.textContent = '';
      } else {
        el.classList.remove('hidden');
        el.textContent = msg;
      }
    }

    _showOnly(screen) {
      const { screenMenu, screenWizard, screenPaused, screenComplete, hud } = this.ui;
      screenMenu.classList.add('hidden');
      screenWizard.classList.add('hidden');
      screenPaused.classList.add('hidden');
      screenComplete.classList.add('hidden');
      hud.classList.add('hidden');

      if (screen === 'menu') screenMenu.classList.remove('hidden');
      if (screen === 'wizard') screenWizard.classList.remove('hidden');
      if (screen === 'paused') screenPaused.classList.remove('hidden');
      if (screen === 'complete') screenComplete.classList.remove('hidden');
      if (screen === 'play') hud.classList.remove('hidden');
    }

    enterMenu() {
      this.state = 'menu';
      this._showOnly('menu');
    }

    _enterWizard() {
      this.state = 'wizard';
      this._showOnly('wizard');

      // reset calibration & wizard state
      this.doFreqHz = null;
      this.scaleFreqs = null;
      this.scaleBounds = null;

      this.wizMode = null;
      this.wizStep = 0;
      this.wizHold = 0;
      this.wizHoldSamples = [];
      this.wizStability = [];
      this.wizScaleIndex = 1;
      this.wizChecks = Array(7).fill(false);
      this.voiceEstimate = null;

      this._updateChecklistUI();
      this._renderWizardUI();
    }

    _enterPlay() {
      this.state = 'play';
      this._showOnly('play');
    }

    _enterPaused() {
      this.state = 'paused';
      this._showOnly('paused');
    }

    _enterComplete() {
      this.state = 'complete';
      this._showOnly('complete');

      const ms = performance.now() - this.levelStartMs;
      const sec = ms / 1000;

      this.ui.completeTitle.textContent = `${LEVELS[this.levelIndex].title} — Complete!`;
      this.ui.completeStats.textContent =
        `Time: ${sec.toFixed(1)}s • Bounces: ${this.bounceCount} • Notes: ${this.levelSeq.length}`;
    }

    setLevel(index) {
      this.levelIndex = clamp(index, 0, LEVELS.length - 1);
      const seqNames = LEVELS[this.levelIndex].build();
      this.levelSeq = seqNames.map(name => {
        const n = String(name).trim().toUpperCase();
        const idx = SOLFEGE.findIndex(s => s.name === n);
        if (idx < 0) throw new Error(`Unknown solfège token: ${name}`);
        return idx;
      });
    }

    beginLevel(index) {
      this.setLevel(index);
      this.resetRunForLevel();
      this.levelStartMs = performance.now();
      this._enterPlay();
    }

    resetRunForLevel() {
      this.obstacles = [];
      this.scrollOffset = 0;

      this.bounceTimer = 0;
      this.collisionCooldown = 0;
      this.bounceHintTimer = 0;
      this.bounceHintText = '';
      this.bounceCount = 0;

      this.levelSpawnIndex = 0;
      this.clearedCount = 0;
      this.spawnTimer = 1.0;

      this.player.targetLane = 3;
      this.player.y = this.laneYs[this.player.targetLane];

      this.detected = { lane: null, name: null, centsOff: null };
      this._laneCandidate = null;
      this._laneCandidateFrames = 0;
    }

    restartLevel() {
      this.resetRunForLevel();
      this.levelStartMs = performance.now();
      this._enterPlay();
    }

    getScrollSpeed() {
      const speed = CONFIG.baseScrollSpeed + this.clearedCount * CONFIG.speedPerClear;
      return clamp(speed, CONFIG.baseScrollSpeed, CONFIG.maxScrollSpeed);
    }

    spawnObstacleForLane(lane) {
      const x = this.w + 60;
      const gapY = this.laneYs[lane];
      const gapH = this.laneStep * CONFIG.gapHeightFactor;

      this.obstacles.push({
        x,
        w: CONFIG.obstacleWidth,
        lane,
        label: SOLFEGE[lane].name,
        gapTop: gapY - gapH / 2,
        gapBottom: gapY + gapH / 2,
        passed: false,
      });
    }

    getUpcomingLabel() {
      const nextObs = this.obstacles.find(o => !o.passed);
      if (nextObs) return nextObs.label;
      if (this.levelSpawnIndex < this.levelSeq.length) return SOLFEGE[this.levelSeq[this.levelSpawnIndex]].name;
      return '—';
    }

    /********************
     * WIZARD LOGIC
     ********************/
    _setWizardStep(step) {
      this.wizStep = clamp(step, 0, 5);
      this._resetHold();
      this._renderWizardUI();
    }

    _wizardBack() {
      if (this.wizStep === 0) {
        this.enterMenu();
        return;
      }
      // going back across key points resets some progress
      if (this.wizStep === 3) {
        this.doFreqHz = null;
        this.scaleFreqs = null;
        this.scaleBounds = null;
        this.wizMode = null;
      }
      if (this.wizStep === 4) {
        this.wizScaleIndex = 1;
      }
      this._setWizardStep(this.wizStep - 1);
    }

    _wizardNext() {
      // enforce: you need a Do before leaving capture step
      if (this.wizStep === 2) {
        this._setWizardError('Choose a calibration method first.');
        return;
      }
      if (this.wizStep === 3 && !this.doFreqHz) {
        this._setWizardError('Sing and hold until it captures your Do.');
        return;
      }
      if (this.wizStep === 5) {
        // Start the selected level
        this.beginLevel(this.pendingLevelIndex);
        return;
      }
      this._setWizardStep(this.wizStep + 1);
    }

    _setWizardError(msg) {
      const el = this.ui.wizError;
      if (!msg) {
        el.classList.add('hidden');
        el.textContent = '';
      } else {
        el.classList.remove('hidden');
        el.textContent = msg;
      }
    }

    _resetHold() {
      this.wizHold = 0;
      this.wizHoldSamples = [];
      this.ui.holdBar.style.width = '0%';
      this.ui.holdStatus.textContent = '—';
      this._setWizardError('');
    }

    _updateHold(dt, ok, freq) {
      if (!ok) {
        this.wizHold = 0;
        this.wizHoldSamples = [];
        return false;
      }

      this.wizHold += dt;
      if (freq) this.wizHoldSamples.push(freq);

      const p = clamp(this.wizHold / CONFIG.holdSeconds, 0, 1);
      this.ui.holdBar.style.width = `${Math.floor(p * 100)}%`;
      return p >= 1;
    }

    _renderWizardUI() {
      // Common
      this.ui.wizStep.textContent = `Step ${this.wizStep + 1} / 6`;

      // Step-specific visibility
      this.ui.wizModeRow.classList.add('hidden');
      this.ui.wizTarget.classList.add('hidden');
      this.ui.wizChecklist.classList.add('hidden');
      this.ui.btnTone2.classList.add('hidden');

      // Default button label
      this.ui.btnWizNext.textContent = (this.wizStep === 5) ? 'Start Level' : 'Next';

      if (this.wizStep === 0) {
        this.ui.wizStepTitle.textContent = 'How the game hears your voice';
        this.ui.wizText.innerHTML =
          `Your browser estimates your <b>pitch</b> (frequency in Hz). Higher Hz means a higher note.<br><br>` +
          `In this game, the staff has <b>7 lanes</b>: <b>DO→TI</b> (one octave). ` +
          `We calibrate your “DO”, then the game recognizes the rest of the scale.`;
        return;
      }

      if (this.wizStep === 1) {
        this.ui.wizStepTitle.textContent = 'Microphone check (like a tuner)';
        this.ui.wizText.innerHTML =
          `Make a steady tone (hum or sing). Watch the live readout: Hz, note name, cents, clarity, volume.<br><br>` +
          `If the note jumps around, try a steady vowel (“doo”).`;
        return;
      }

      if (this.wizStep === 2) {
        this.ui.wizStepTitle.textContent = 'Choose a calibration method';
        this.ui.wizText.innerHTML =
          `<b>Option A:</b> Try to match a <b>C</b> first (tuner-style).<br>` +
          `<b>Option B:</b> Use any comfortable note as <b>DO</b> (recommended if you don’t know C).`;
        this.ui.wizModeRow.classList.remove('hidden');
        return;
      }

      if (this.wizStep === 3) {
        this.ui.wizTarget.classList.remove('hidden');

        if (this.wizMode === 'fixedC') {
          this.ui.wizStepTitle.textContent = 'Match C (tuner-style)';
          this.ui.wizText.innerHTML =
            `Sing a <b>C</b> (any octave) and hold it steady until the bar fills.<br><br>` +
            `This sets your DO = C in the octave you’re singing.`;
          this.ui.targetHint.textContent =
            `Try to keep it steady. If you can’t find C, go Back and choose “comfortable Do.”`;

          // Offer two octaves of reference (closest + one octave up/down)
          this.ui.btnTone2.classList.remove('hidden');
          this.ui.targetLabel.textContent = 'C (any octave)';
        } else {
          this.ui.wizStepTitle.textContent = 'Choose your DO';
          this.ui.wizText.innerHTML =
            `Sing any comfortable steady note and hold it. We’ll call that <b>DO</b>.<br><br>` +
            `Then we’ll guide you through DO→TI with reference tones.`;
          this.ui.targetLabel.textContent = 'Your DO (any steady pitch)';
          this.ui.targetHint.textContent =
            `Don’t worry about letter names. Just pick a comfortable pitch.`;
        }
        return;
      }

      if (this.wizStep === 4) {
        this.ui.wizTarget.classList.remove('hidden');

        const name = SOLFEGE[this.wizScaleIndex]?.name ?? '—';
        this.ui.wizStepTitle.textContent = 'Calibrate the scale (Do→Ti)';
        this.ui.wizText.innerHTML =
          `Now match each scale degree in the same octave. Use “Play reference tone” if needed.<br><br>` +
          `We’re currently capturing: <b>${name}</b>.`;
        this.ui.targetLabel.textContent = name;
        this.ui.targetHint.textContent =
          `Hold within the target; the bar fills when you’re close enough and steady.`;
        this.ui.btnWizNext.textContent = 'Skip (use theory)';
        return;
      }

      if (this.wizStep === 5) {
        this.ui.wizChecklist.classList.remove('hidden');
        this.ui.wizStepTitle.textContent = 'Test it';
        this.ui.wizText.innerHTML =
          `Try singing different pitches. The note on the staff should move <b>up</b> when you sing <b>higher</b>.<br><br>` +
          `Try lighting up the DO→TI checklist once. Then press <b>Start Level</b>.`;
        this.ui.btnWizNext.textContent = 'Start Level';
        return;
      }
    }

    _currentTargetToneFreq(altOctave = false) {
      if (!this.audio.enabled) return null;

      if (this.state !== 'wizard') return null;

      // Step 3 fixedC: play a C near the user's estimated pitch
      if (this.wizStep === 3 && this.wizMode === 'fixedC') {
        const base = this.voiceEstimate ?? 261.625565; // if unknown, C4
        const baseMidi = freqToMidi(base);
        const targetMidi = closestMidiOfClass(baseMidi, 0); // note class C
        let f = midiToFreq(targetMidi);
        if (altOctave) f *= 2; // "alt" just provides a different octave reference
        return f;
      }

      // Step 4: scale degree reference
      if (this.wizStep === 4 && this.scaleFreqs) {
        let f = this.scaleFreqs[this.wizScaleIndex];
        if (altOctave) f *= 2;
        return f;
      }

      return null;
    }

    _updateChecklistUI() {
      for (let i = 0; i < 7; i++) {
        const el = $(`#check-${i}`);
        if (!el) continue;
        if (this.wizChecks[i]) el.classList.add('ok');
        else el.classList.remove('ok');
      }
    }

    /********************
     * UPDATE LOOP
     ********************/
    update(dt) {
      const pitch = this.audio.update(dt);

      // Mic level meter (HUD)
      const rms = pitch ? pitch.rms : 0;
      const micLevel = clamp((rms - CONFIG.minRms) / 0.08, 0, 1);
      this.ui.micBar.style.width = `${Math.floor(micLevel * 100)}%`;

      if (this.state === 'wizard') {
        this._updateWizard(dt, pitch);
        return;
      }

      if (this.state === 'paused' || this.state === 'menu' || this.state === 'complete') return;
      if (this.state !== 'play') return;

      // HUD basics
      this.ui.hudLevel.textContent = `${this.levelIndex + 1}/${LEVELS.length}`;
      this.ui.hudProgress.textContent = `${this.clearedCount}/${this.levelSeq.length}`;
      this.ui.hudNext.textContent = this.getUpcomingLabel();

      // Voice control (if not keyboard-only)
      if (!this.keyboardOnly && this.doFreqHz && this.scaleFreqs && this.scaleBounds && pitch && pitch.clarity >= CONFIG.minClarity && pitch.rms >= CONFIG.minRms) {
        const sol = analyzeSolfege(pitch.freq, this.scaleFreqs, this.scaleBounds);

        if (this._laneCandidate === sol.lane) this._laneCandidateFrames++;
        else { this._laneCandidate = sol.lane; this._laneCandidateFrames = 1; }

        if (this._laneCandidateFrames >= CONFIG.stableFramesNeeded) {
          this.detected.lane = sol.lane;
          this.detected.name = sol.name;
          this.detected.centsOff = sol.centsOff;
          this.player.targetLane = sol.lane;
        }
      } else {
        this._laneCandidate = null;
        this._laneCandidateFrames = 0;
        if (!this.keyboardOnly) {
          this.detected.lane = null;
          this.detected.name = null;
          this.detected.centsOff = null;
        }
      }

      // HUD tuning
      if (this.detected.name) {
        this.ui.hudYou.textContent = this.detected.name;
        const c = this.detected.centsOff ?? 0;
        if (Math.abs(c) < 18) this.ui.hudTune.textContent = ' (in tune)';
        else this.ui.hudTune.textContent = c > 0 ? ' (sharp)' : ' (flat)';
      } else {
        this.ui.hudYou.textContent = '—';
        this.ui.hudTune.textContent = '';
      }

      // Movement/scroll
      const baseSpeed = this.getScrollSpeed();
      let speed = baseSpeed;

      if (this.bounceTimer > 0) {
        this.bounceTimer -= dt;
        speed = -baseSpeed * CONFIG.bounceSpeedFactor;
      }

      if (this.collisionCooldown > 0) this.collisionCooldown -= dt;
      if (this.bounceHintTimer > 0) this.bounceHintTimer -= dt;

      this.scrollOffset += speed * dt;

      // Spawn next from sequence
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        if (this.levelSpawnIndex < this.levelSeq.length) {
          const lane = this.levelSeq[this.levelSpawnIndex];
          this.levelSpawnIndex++;
          this.spawnObstacleForLane(lane);
        }

        if (this.levelSpawnIndex < this.levelSeq.length) {
          const ramp = clamp(this.clearedCount / 30, 0, 1);
          const tMin = lerp(CONFIG.spawnTimeMin, Math.max(0.9, CONFIG.spawnTimeMin - 0.35), ramp);
          const tMax = lerp(CONFIG.spawnTimeMax, Math.max(1.2, CONFIG.spawnTimeMax - 0.45), ramp);
          this.spawnTimer = rand(tMin, tMax);
        } else {
          this.spawnTimer = Infinity;
        }
      }

      // Move obstacles
      for (const obs of this.obstacles) obs.x -= speed * dt;
      this.obstacles = this.obstacles.filter(o => o.x + o.w > -120);

      // Player smoothing
      this.player.y = smoothTo(this.player.y, this.laneYs[this.player.targetLane], 14, dt);

      // Collisions
      const next = this.obstacles.find(o => !o.passed);
      if (next) {
        if (!next.passed && (next.x + next.w) < (this.player.x - this.player.halfW - 4)) {
          next.passed = true;
          this.clearedCount++;
        }

        const px = this.player.x, py = this.player.y;
        const left = px - this.player.halfW;
        const right = px + this.player.halfW;
        const top = py - this.player.halfH;
        const bottom = py + this.player.halfH;

        const overlapX = (right > next.x) && (left < next.x + next.w);
        if (overlapX && this.collisionCooldown <= 0) {
          const hitsTopBlock = top < next.gapTop;
          const hitsBottomBlock = bottom > next.gapBottom;

          if (hitsTopBlock || hitsBottomBlock) {
            this.bounceTimer = CONFIG.bounceDuration;
            this.collisionCooldown = CONFIG.collisionCooldown;
            this.bounceCount++;

            const need = SOLFEGE[next.lane].name;
            if (this.player.targetLane < next.lane) this.bounceHintText = `Need ${need} (higher ↑)`;
            else if (this.player.targetLane > next.lane) this.bounceHintText = `Need ${need} (lower ↓)`;
            else this.bounceHintText = `Need ${need}`;
            this.bounceHintTimer = 0.75;
          }
        }
      }

      if (this.clearedCount >= this.levelSeq.length && this.levelSeq.length > 0) {
        this._enterComplete();
      }
    }

    _updateWizard(dt, pitch) {
      // Update live analysis display
      const hasPitch = !!(pitch && pitch.clarity >= CONFIG.minClarity && pitch.rms >= CONFIG.minRms);
      const info = hasPitch ? describeFreq(pitch.freq) : null;

      this.ui.liveFreq.textContent = info ? `${info.freq.toFixed(1)} Hz` : '—';
      this.ui.liveNote.textContent = info ? `${info.label} (${info.cents >= 0 ? '+' : ''}${info.cents.toFixed(0)}¢)` : '—';
      this.ui.liveClarity.textContent = pitch ? pitch.clarity.toFixed(2) : '—';
      this.ui.liveVolume.textContent = pitch ? pitch.rms.toFixed(3) : '—';

      // Tuner needle: show cents from nearest note (or target, when applicable)
      let needleCents = info ? info.cents : 0;

      // Estimate a comfortable pitch during mic check step (to choose a better C octave ref)
      if (this.wizStep === 1 && hasPitch) {
        // Very lightweight: track a running "estimate"
        this.voiceEstimate = this.voiceEstimate
          ? lerp(this.voiceEstimate, pitch.freq, 0.08)
          : pitch.freq;
      }

      // If we already have a Do, compute solfege detection
      let sol = null;
      if (hasPitch && this.doFreqHz) {
        if (!this.scaleFreqs) this.scaleFreqs = buildScaleFromDo(this.doFreqHz);
        if (!this.scaleBounds) this.scaleBounds = buildBounds(this.scaleFreqs);
        sol = analyzeSolfege(pitch.freq, this.scaleFreqs, this.scaleBounds);
      }

      this.ui.liveSolfege.textContent = sol ? sol.name : '—';

      // Update preview note position on staff
      if (sol) this.player.targetLane = sol.lane;
      this.player.y = smoothTo(this.player.y, this.laneYs[this.player.targetLane], 14, dt);

      // Step logic
      if (this.wizStep === 0) {
        // Intro only
        this.ui.wizModeRow.classList.add('hidden');
        this.ui.wizTarget.classList.add('hidden');
      }

      if (this.wizStep === 1) {
        this.ui.wizModeRow.classList.add('hidden');
        this.ui.wizTarget.classList.add('hidden');
      }

      if (this.wizStep === 2) {
        this.ui.wizModeRow.classList.remove('hidden');
        this.ui.wizTarget.classList.add('hidden');
      }

      if (this.wizStep === 3) {
        this.ui.wizModeRow.classList.add('hidden');
        this.ui.wizTarget.classList.remove('hidden');

        if (this.wizMode === 'fixedC') {
          // Target: C note class
          if (hasPitch && info) {
            const cInfo = centsToNoteClass(pitch.freq, 0);
            needleCents = cInfo.cents;

            const ok = Math.abs(cInfo.cents) <= CONFIG.captureToleranceCents;
            this.ui.holdStatus.textContent = ok ? 'Good — hold steady…' : 'Aim for C…';
            this.ui.targetHint.textContent = ok ? 'Nice. Keep it steady to capture.' : 'If you’re far, try the reference tone.';
            const done = this._updateHold(dt, ok, pitch.freq);

            if (done) {
              // Set DO to the equal-tempered C in this octave (robust for theory)
              this.doFreqHz = cInfo.targetFreq;
              this.scaleFreqs = buildScaleFromDo(this.doFreqHz);
              this.scaleBounds = buildBounds(this.scaleFreqs);

              this._setWizardError('');
              this._setWizardStep(4);
              this.wizScaleIndex = 1;
            }
          } else {
            this.ui.holdStatus.textContent = 'Sing a steady C…';
          }
        } else {
          // Movable Do: any steady pitch (stability check)
          if (hasPitch && info) {
            this.wizStability.push(pitch.freq);
            while (this.wizStability.length > CONFIG.stabilityWindow) this.wizStability.shift();

            let stableOk = false;
            if (this.wizStability.length >= Math.floor(CONFIG.stabilityWindow * 0.75)) {
              const med = median(this.wizStability);
              let maxDev = 0;
              for (const f of this.wizStability) {
                const dev = Math.abs(centsBetween(f, med));
                if (dev > maxDev) maxDev = dev;
              }
              stableOk = maxDev <= CONFIG.stabilityMaxDevCents;
            }

            this.ui.holdStatus.textContent = stableOk ? 'Steady — hold…' : 'Hold a steadier pitch…';
            this.ui.targetHint.textContent =
              stableOk ? 'Great. Keep it steady to capture DO.' :
              'Try a steady vowel and avoid sliding up/down.';

            const done = this._updateHold(dt, stableOk, pitch.freq);
            if (done) {
              this.doFreqHz = median(this.wizHoldSamples) ?? pitch.freq;
              this.scaleFreqs = buildScaleFromDo(this.doFreqHz);
              this.scaleBounds = buildBounds(this.scaleFreqs);

              this._setWizardError('');
              this._setWizardStep(4);
              this.wizScaleIndex = 1;
            }
          } else {
            this.wizStability = [];
            this.ui.holdStatus.textContent = 'Sing a steady note…';
          }
        }
      }

      if (this.wizStep === 4) {
        // Guided scale: RE..TI
        this.ui.wizModeRow.classList.add('hidden');
        this.ui.wizTarget.classList.remove('hidden');

        if (!this.doFreqHz) {
          this._setWizardError('Missing DO. Go Back and capture DO first.');
          return;
        }

        // If user presses "Skip (use theory)" it will advance to test via Next button
        const lane = this.wizScaleIndex;
        const target = this.scaleFreqs[lane];

        if (hasPitch) {
          const cents = centsBetween(pitch.freq, target);
          needleCents = cents;

          // Provide octave hint
          const centsLow = centsBetween(pitch.freq, target / 2);
          const centsHigh = centsBetween(pitch.freq, target * 2);

          let hint = '';
          if (Math.abs(cents) <= CONFIG.captureToleranceCents) hint = 'Good — hold steady…';
          else if (Math.abs(centsLow) <= CONFIG.captureToleranceCents) hint = 'Sounds ~1 octave low. Try singing higher.';
          else if (Math.abs(centsHigh) <= CONFIG.captureToleranceCents) hint = 'Sounds ~1 octave high. Try singing lower.';
          else hint = 'Aim for the target…';

          this.ui.holdStatus.textContent = hint;

          const ok = Math.abs(cents) <= CONFIG.captureToleranceCents;
          const done = this._updateHold(dt, ok, pitch.freq);

          if (done) {
            // Replace the theoretical note with the captured median (slightly more personalized)
            const captured = median(this.wizHoldSamples) ?? pitch.freq;
            this.scaleFreqs[lane] = captured;
            this.scaleBounds = buildBounds(this.scaleFreqs);

            this._resetHold();
            this.wizScaleIndex++;

            if (this.wizScaleIndex > 6) {
              // move to test
              this._setWizardStep(5);
            } else {
              this._renderWizardUI();
            }
          }
        } else {
          this.ui.holdStatus.textContent = 'Sing and hold…';
        }
      }

      if (this.wizStep === 5) {
        // Test checklist
        this.ui.wizChecklist.classList.remove('hidden');

        if (sol) {
          this.wizChecks[sol.lane] = true;
          this._updateChecklistUI();
          needleCents = sol.centsOff;
          this.ui.holdStatus.textContent = 'Try hitting the others…';
        }
      }

      // Apply needle position
      const r = CONFIG.tunerNeedleRangeCents;
      const cClamped = clamp(needleCents, -r, r);
      const pct = ((cClamped + r) / (2 * r)) * 100;
      this.ui.gaugeNeedle.style.left = `${pct}%`;
      this.ui.liveCents.textContent = info ? `${needleCents >= 0 ? '+' : ''}${needleCents.toFixed(0)}¢` : '—';
    }

    /********************
     * RENDER
     ********************/
    render() {
      const ctx = this.ctx;

      ctx.clearRect(0, 0, this.w, this.h);
      ctx.fillStyle = '#f8f4ea';
      ctx.fillRect(0, 0, this.w, this.h);

      // Subtle paper dots
      ctx.globalAlpha = 0.05;
      ctx.fillStyle = '#000';
      for (let i = 0; i < 180; i++) {
        const x = (i * 97) % this.w;
        const y = (i * 53) % this.h;
        ctx.fillRect(x, y, 1, 1);
      }
      ctx.globalAlpha = 1;

      // Staff lines
      ctx.strokeStyle = 'rgba(0,0,0,0.45)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        const y = this.staffTop + i * this.staffSpacing;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(this.w, y);
        ctx.stroke();
      }

      // Measure lines scroll (also in wizard to feel musical)
      const measureSpacing = 210;
      const off = ((this.scrollOffset % measureSpacing) + measureSpacing) % measureSpacing;
      ctx.strokeStyle = 'rgba(0,0,0,0.18)';
      ctx.lineWidth = 2;
      for (let x = -off; x < this.w + measureSpacing; x += measureSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, this.staffTop - this.staffSpacing * 0.6);
        ctx.lineTo(x, this.staffBottom + this.staffSpacing * 0.6);
        ctx.stroke();
      }

      // Obstacles only during play
      if (this.state === 'play') {
        for (const obs of this.obstacles) this._drawObstacle(obs);
      }

      // Player note always visible (wizard preview or gameplay)
      this._drawNote(this.player.x, this.player.y);

      // Bounce hint
      if (this.state === 'play' && this.bounceHintTimer > 0 && this.bounceHintText) {
        ctx.globalAlpha = clamp(this.bounceHintTimer / 0.75, 0, 1);
        ctx.fillStyle = 'rgba(0,0,0,0.78)';
        ctx.font = '700 18px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.bounceHintText, this.w / 2, this.staffTop - 18);
        ctx.globalAlpha = 1;
      }

      // Footer
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.font = '12px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Sing solfège to move • Up/Down keys also work', 12, this.h - 14);
    }

    _drawObstacle(obs) {
      const ctx = this.ctx;
      const bandTop = this.staffTop - this.staffSpacing * 2.0;
      const bandBottom = this.staffBottom + this.staffSpacing * 2.0;

      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      ctx.fillRect(obs.x, bandTop, obs.w, obs.gapTop - bandTop);
      ctx.fillRect(obs.x, obs.gapBottom, obs.w, bandBottom - obs.gapBottom);

      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.font = '700 14px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
      ctx.textAlign = 'center';
      const labelY = clamp((obs.gapTop + obs.gapBottom) / 2, bandTop + 16, bandBottom - 10);
      ctx.fillText(obs.label, obs.x + obs.w / 2, labelY + 5);

      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      const cx = obs.x + obs.w / 2;
      const cy = this.laneYs[obs.lane];
      ctx.beginPath();
      ctx.ellipse(cx, cy, 6, 4, -0.35, 0, Math.PI * 2);
      ctx.fill();
    }

    _drawNote(x, y) {
      const ctx = this.ctx;
      const s = CONFIG.noteSize;

      ctx.fillStyle = 'rgba(0,0,0,0.92)';
      ctx.beginPath();
      ctx.ellipse(x, y, s * 0.85, s * 0.60, -0.35, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(0,0,0,0.92)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + s * 0.65, y - s * 0.15);
      ctx.lineTo(x + s * 0.65, y - s * 2.2);
      ctx.stroke();

      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + s * 0.65, y - s * 2.2);
      ctx.quadraticCurveTo(x + s * 1.45, y - s * 2.0, x + s * 1.05, y - s * 1.45);
      ctx.quadraticCurveTo(x + s * 0.82, y - s * 1.10, x + s * 1.35, y - s * 0.95);
      ctx.stroke();
    }
  }

  /********************
   * BOOTSTRAP
   ********************/
  const canvas = $('#game');
  const ctx = canvas.getContext('2d', { alpha: false });
  const game = new Game(canvas, ctx);

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    game.onResize(w, h);
  }

  window.addEventListener('resize', resize);
  resize();

  let last = performance.now();
  function frame(now) {
    const dt = clamp((now - last) / 1000, 0, 0.05);
    last = now;

    game.update(dt);
    game.render();

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

})();
```

---

# What this gives you immediately

* During calibration, the player sees **exactly what the mic hears**:

  * frequency (Hz)
  * closest note name (like a guitar tuner)
  * cents offset (needle)
  * clarity/volume
  * detected solfège once Do is set

* It **explains** the theory (in plain language) and shows the mapping.

* It fixes the “higher pitch goes down / lower goes up” issue by removing the wrap-around behavior.

---

# A quick note on octave / “high singer” behavior

This implementation intentionally treats the staff as **one octave: DO..TI**.

So:

* If you sing **above the calibrated TI**, it will clamp to TI (top).
* If you sing **below DO**, it clamps to DO (bottom).

That’s what makes the motion feel consistent for non-musicians.

If later you want melodies that span multiple octaves, we can add:

* a second staff octave (more lanes), or
* an “octave folding” mode (but that reintroduces the wrap confusion).

---

If you tell me whether you want the game to support the **octave DO** explicitly (Do at both bottom and top), I’ll adjust the staff lanes and the level format so you can include octave patterns cleanly (e.g., Do–Mi–Sol–Do’).
