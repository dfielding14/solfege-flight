Below is a **complete, working “drop-in” implementation** (no build tools) you can put into a folder on your GitHub Pages site. It’s a canvas-based side scroller where a **music note** moves through **sheet music**, controlled by **singing solfège**. Obstacles require a specific solfège degree; if you miss, you **bounce back** (no death) and can keep trying.

---

# 1) File structure to add to your GitHub Pages repo

Create a folder (example: `solfege-flight/`) in your repo:

```
solfege-flight/
  index.html
  style.css
  game.js
```

---

# 2) `solfege-flight/index.html`

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
        Sing <b>Do–Re–Mi–Fa–Sol–La–Ti</b> to move the note up and down on the staff.
        Match the solfège shown on the next barrier to slip through the gap.
      </p>
      <ul>
        <li>Click <b>Start</b> to enable your microphone (required by browsers).</li>
        <li>You'll calibrate by singing a comfortable <b>Do</b> (any pitch).</li>
        <li>If you miss a note you <b>bounce back</b> — no game over.</li>
      </ul>

      <div class="row">
        <button id="btn-start">Start / Enable Microphone</button>
        <button id="btn-keyboard" class="secondary">Play with Keyboard</button>
      </div>

      <label class="opt">
        <input type="checkbox" id="opt-skipcal" />
        Skip calibration (use C as Do)
      </label>

      <p class="small">
        Mic audio is processed locally in your browser. Nothing is uploaded.
        (Tip: headphones help.)
      </p>

      <p id="menu-error" class="error hidden"></p>
    </div>

    <!-- CALIBRATION -->
    <div id="screen-calibrate" class="screen hidden">
      <h2>Calibration</h2>
      <p>Sing a comfortable <b>Do</b> and hold it steady until the bar fills.</p>

      <div class="meter">
        <div id="cal-bar" class="meter-bar"></div>
      </div>

      <p id="cal-status" class="small">Listening…</p>

      <div class="row">
        <button id="btn-cal-retry" class="secondary">Retry</button>
        <button id="btn-cal-skip" class="secondary">Skip (use C as Do)</button>
      </div>
    </div>

    <!-- HUD -->
    <div id="hud" class="hud hidden">
      <div class="hud-row">
        <div><span class="label">Score:</span> <span id="hud-score">0</span></div>
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
        <button id="btn-restart" class="secondary">Restart</button>
      </div>
      <p class="small">Keyboard: Up/Down to move. (Mic control resumes after unpausing.)</p>
    </div>
  </div>

  <script src="game.js"></script>
</body>
</html>
```

---

# 3) `solfege-flight/style.css`

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
  max-width: 720px;
  margin: 6vh auto 0 auto;
  padding: 18px 18px;
  background: rgba(255, 255, 255, 0.88);
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

.opt {
  display: block;
  margin-top: 10px;
  user-select: none;
}

.small {
  font-size: 12px;
  opacity: 0.85;
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

ul {
  margin-top: 10px;
}
```

---

# 4) `solfege-flight/game.js`

```js
(() => {
  'use strict';

  /********************
   * CONFIG (tweak me)
   ********************/
  const CONFIG = {
    // Pitch detection / solfege mapping:
    minFreqHz: 80,
    maxFreqHz: 1000,
    minRms: 0.012,          // silence gate (raise if room noise triggers movement)
    minClarity: 0.28,       // autocorrelation confidence gate (raise for stricter)
    toleranceCents: 65,     // how close to the solfege degree is "accepted" (bigger = easier)
    stableFramesNeeded: 3,  // require the same solfege for N detections before moving

    // Calibration:
    calibrationSeconds: 1.0,  // hold Do for ~1 second
    calibrationHz: 30,        // sampling rate for pitch checks

    // Gameplay:
    baseScrollSpeed: 240,     // px/s
    maxScrollSpeed: 420,
    speedPerScore: 6,         // speed ramp with score (0 = constant)
    spawnTimeMin: 1.35,       // seconds between obstacles (higher = easier)
    spawnTimeMax: 2.00,
    gapHeightFactor: 2.35,    // gapHeight = laneStep * this
    obstacleWidth: 74,

    // Bounce (no-death):
    bounceDuration: 0.26,
    bounceSpeedFactor: 0.62,     // reverse speed = scrollSpeed * factor
    collisionCooldown: 0.20,     // prevents rapid re-collision chatter

    // Visual:
    staffSpacingMin: 18,
    staffSpacingMax: 30,
    noteSize: 16,            // visual size
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

  function wrapToHalfOctave(semiDiff) {
    // Wrap semitone difference to [-6, 6] for closest pitch-class match
    let d = semiDiff % 12;
    if (d < -6) d += 12;
    if (d > 6) d -= 12;
    return d;
  }

  function freqToSolfege(freqHz, doFreqHz, toleranceCents) {
    if (!freqHz || !doFreqHz || freqHz <= 0 || doFreqHz <= 0) return null;

    const semisFromDo = 12 * Math.log2(freqHz / doFreqHz);
    const mod = ((semisFromDo % 12) + 12) % 12;

    let best = null;
    for (let i = 0; i < SOLFEGE.length; i++) {
      const target = SOLFEGE[i].semis;
      const diffSemis = wrapToHalfOctave(mod - target);
      const centsOff = diffSemis * 100;
      const absCents = Math.abs(centsOff);
      if (!best || absCents < best.absCents) {
        best = { lane: i, name: SOLFEGE[i].name, centsOff, absCents };
      }
    }

    if (!best || best.absCents > toleranceCents) return null;
    return best;
  }

  /********************
   * PITCH DETECTION (normalized autocorrelation)
   ********************/
  function detectPitchACF(buf, sampleRate, tmp, minFreq, maxFreq) {
    const n = buf.length;

    // Compute mean + RMS
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

    // DC removal into tmp
    for (let i = 0; i < n; i++) tmp[i] = buf[i] - mean;

    const minLag = Math.floor(sampleRate / maxFreq);
    const maxLag = Math.floor(sampleRate / minFreq);

    let bestLag = -1;
    let bestCorr = 0;

    for (let lag = minLag; lag <= maxLag; lag++) {
      let sum = 0;
      let sumSq1 = 0;
      let sumSq2 = 0;

      // normalized correlation
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

    // Refine lag with parabolic interpolation around bestLag
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

    const c1 = corrAt(bestLag - 1);
    const c2 = corrAt(bestLag);
    const c3 = corrAt(bestLag + 1);
    const denom = (c1 - 2 * c2 + c3);

    let shift = 0;
    if (Math.abs(denom) > 1e-9) {
      shift = 0.5 * (c1 - c3) / denom;
      shift = clamp(shift, -1, 1);
    }

    const refinedLag = bestLag + shift;
    const freq = sampleRate / refinedLag;

    if (!isFinite(freq) || freq < minFreq || freq > maxFreq) return null;

    return {
      freq,
      rms,
      clarity: bestCorr,
    };
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
      this.hz = CONFIG.calibrationHz;
    }

    async start() {
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextCtor) throw new Error('Web Audio API not supported in this browser.');

      // Request mic
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
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

      // Some browsers start AudioContext suspended until user gesture; start() is called by a click.
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }
    }

    update(dt) {
      if (!this.enabled) return null;
      this._t += dt;
      const interval = 1 / this.hz;
      if (this._t < interval) return this.latest;
      this._t = 0;

      this.analyser.getFloatTimeDomainData(this.buf);

      const p = detectPitchACF(
        this.buf,
        this.audioCtx.sampleRate,
        this.tmp,
        CONFIG.minFreqHz,
        CONFIG.maxFreqHz
      );

      this.latest = p;
      return p;
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
      this.dpr = 1;

      this.state = 'menu'; // menu | calibrate | play | paused

      // Sheet music layout:
      this.staffSpacing = 24;
      this.staffTop = 0;
      this.staffBottom = 0;
      this.laneStep = 0;
      this.laneYs = [];

      // Player:
      this.player = {
        x: 160,
        y: 0,
        lane: 3,
        targetLane: 3,
        halfW: CONFIG.noteHitboxW / 2,
        halfH: CONFIG.noteHitboxH / 2,
      };

      // Obstacles:
      this.obstacles = [];
      this.spawnTimer = rand(CONFIG.spawnTimeMin, CONFIG.spawnTimeMax);
      this.lastGapLane = 3;

      // Motion:
      this.scrollOffset = 0;

      // Bounce:
      this.bounceTimer = 0;
      this.collisionCooldown = 0;
      this.bounceHintTimer = 0;
      this.bounceHintText = '';

      // Score:
      this.score = 0;

      // Audio / solfege control:
      this.audio = new AudioInput();
      this.keyboardOnly = false;

      this.doFreqHz = null;

      // detection smoothing
      this.detected = {
        lane: null,
        name: null,
        centsOff: null,
      };
      this._laneCandidate = null;
      this._laneCandidateFrames = 0;

      // calibration
      this.calSamples = [];
      this.calTargetCount = Math.ceil(CONFIG.calibrationSeconds * CONFIG.calibrationHz);
      this.calProgress = 0;

      // UI bindings:
      this.ui = {
        screenMenu: $('#screen-menu'),
        screenCal: $('#screen-calibrate'),
        screenPaused: $('#screen-paused'),
        hud: $('#hud'),

        menuError: $('#menu-error'),
        optSkipCal: $('#opt-skipcal'),

        calBar: $('#cal-bar'),
        calStatus: $('#cal-status'),

        hudScore: $('#hud-score'),
        hudNext: $('#hud-next'),
        hudYou: $('#hud-you'),
        hudTune: $('#hud-tune'),
        micBar: $('#mic-bar'),
      };

      this._bindEvents();
    }

    _bindEvents() {
      $('#btn-start').addEventListener('click', async () => {
        this.keyboardOnly = false;
        const skip = this.ui.optSkipCal.checked;
        await this._startWithMic(skip);
      });

      $('#btn-keyboard').addEventListener('click', () => {
        this.keyboardOnly = true;
        this.doFreqHz = 261.625565; // C4 as "Do" (only for HUD mapping; keyboard doesn't need)
        this._enterPlay();
      });

      $('#btn-cal-retry').addEventListener('click', () => {
        this._resetCalibration();
      });

      $('#btn-cal-skip').addEventListener('click', () => {
        this.doFreqHz = 261.625565; // C4
        this._enterPlay();
      });

      $('#btn-pause').addEventListener('click', () => {
        if (this.state === 'play') this._enterPaused();
        else if (this.state === 'paused') this._enterPlay();
      });

      $('#btn-resume').addEventListener('click', () => this._enterPlay());
      $('#btn-restart').addEventListener('click', () => this.restart());

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

      // Pick a staff spacing based on viewport height.
      this.staffSpacing = clamp(Math.floor(this.h * 0.045), CONFIG.staffSpacingMin, CONFIG.staffSpacingMax);

      // Place staff roughly centered vertically.
      this.staffTop = Math.floor(this.h / 2 - this.staffSpacing * 2);
      this.staffBottom = this.staffTop + this.staffSpacing * 4;

      // Lanes are based on half-steps between lines/spaces.
      this.laneStep = this.staffSpacing / 2;

      // Use positions 1..7 out of 0..8 so we leave a little margin.
      // Lane 0 (DO) lowest; lane 6 (TI) highest.
      this.laneYs = [];
      for (let i = 0; i < 7; i++) {
        const p = i + 1; // 1..7
        this.laneYs[i] = this.staffBottom - p * this.laneStep;
      }

      // Player position
      this.player.x = Math.min(180, Math.floor(this.w * 0.25));
      this.player.y = this.laneYs[this.player.lane];
    }

    async _startWithMic(skipCalibration) {
      try {
        this._setMenuError('');
        await this.audio.start();

        if (skipCalibration) {
          this.doFreqHz = 261.625565; // C4
          this._enterPlay();
          return;
        }

        this._enterCalibration();
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
      const { screenMenu, screenCal, screenPaused, hud } = this.ui;
      screenMenu.classList.add('hidden');
      screenCal.classList.add('hidden');
      screenPaused.classList.add('hidden');
      hud.classList.add('hidden');

      if (screen === 'menu') screenMenu.classList.remove('hidden');
      if (screen === 'calibrate') screenCal.classList.remove('hidden');
      if (screen === 'paused') screenPaused.classList.remove('hidden');
      if (screen === 'play') hud.classList.remove('hidden');
    }

    _enterCalibration() {
      this.state = 'calibrate';
      this._showOnly('calibrate');
      this._resetCalibration();
    }

    _resetCalibration() {
      this.calSamples = [];
      this.calProgress = 0;
      this.ui.calBar.style.width = '0%';
      this.ui.calStatus.textContent = 'Listening… (hold Do steady)';
      this.doFreqHz = null;
    }

    _enterPlay() {
      this.state = 'play';
      this._showOnly('play');
    }

    _enterPaused() {
      this.state = 'paused';
      this._showOnly('paused');
    }

    restart() {
      this.score = 0;
      this.obstacles = [];
      this.spawnTimer = rand(CONFIG.spawnTimeMin, CONFIG.spawnTimeMax);
      this.lastGapLane = 3;

      this.scrollOffset = 0;

      this.bounceTimer = 0;
      this.collisionCooldown = 0;
      this.bounceHintTimer = 0;
      this.bounceHintText = '';

      this.player.lane = 3;
      this.player.targetLane = 3;
      this.player.y = this.laneYs[this.player.lane];

      this.detected.lane = null;
      this.detected.name = null;
      this.detected.centsOff = null;
      this._laneCandidate = null;
      this._laneCandidateFrames = 0;

      // If using mic and not skipping calibration, go back to calibration.
      // Otherwise go straight to play.
      if (!this.keyboardOnly && this.audio.enabled && !this.ui.optSkipCal.checked && !this.doFreqHz) {
        this._enterCalibration();
      } else {
        this._enterPlay();
      }
    }

    getScrollSpeed() {
      const speed = CONFIG.baseScrollSpeed + this.score * CONFIG.speedPerScore;
      return clamp(speed, CONFIG.baseScrollSpeed, CONFIG.maxScrollSpeed);
    }

    spawnObstacle() {
      const width = CONFIG.obstacleWidth;
      const x = this.w + 60;

      // Lane choice: mostly small steps from previous lane so it's singable.
      let lane = this.lastGapLane;
      const stepChoices = [-2, -1, 0, 1, 2];
      const step = stepChoices[Math.floor(Math.random() * stepChoices.length)];
      lane = clamp(lane + step, 0, 6);

      // Occasional bigger jump (keeps variety)
      if (Math.random() < 0.18) {
        lane = Math.floor(Math.random() * 7);
      }

      this.lastGapLane = lane;

      const gapY = this.laneYs[lane];
      const gapH = this.laneStep * CONFIG.gapHeightFactor;

      this.obstacles.push({
        x,
        w: width,
        lane,
        label: SOLFEGE[lane].name,
        gapTop: gapY - gapH / 2,
        gapBottom: gapY + gapH / 2,
        passed: false,
      });
    }

    update(dt) {
      // Audio update (even when paused/calibrating so meters work)
      const pitch = this.audio.update(dt);

      // Mic level meter
      const rms = pitch ? pitch.rms : 0;
      const micLevel = clamp((rms - CONFIG.minRms) / 0.08, 0, 1);
      this.ui.micBar.style.width = `${Math.floor(micLevel * 100)}%`;

      // Calibration logic
      if (this.state === 'calibrate') {
        if (pitch && pitch.clarity >= CONFIG.minClarity && pitch.rms >= CONFIG.minRms) {
          this.calSamples.push(pitch.freq);

          this.calProgress = clamp(this.calSamples.length / this.calTargetCount, 0, 1);
          this.ui.calBar.style.width = `${Math.floor(this.calProgress * 100)}%`;

          if (this.calSamples.length >= this.calTargetCount) {
            const doFreq = median(this.calSamples);
            this.doFreqHz = doFreq;
            this.ui.calStatus.textContent = `Captured Do ≈ ${doFreq.toFixed(1)} Hz`;
            // Enter play after a short beat for feedback
            setTimeout(() => this._enterPlay(), 250);
          }
        } else {
          this.ui.calStatus.textContent = 'Listening… (try a steady vowel like “doo”)';
        }

        // Still render calibration screen background + staff
        return;
      }

      // If paused, don’t advance world, but still render.
      if (this.state === 'paused') return;

      if (this.state !== 'play') return;

      // Solfege mapping (mic control)
      if (!this.keyboardOnly && this.doFreqHz && pitch && pitch.clarity >= CONFIG.minClarity && pitch.rms >= CONFIG.minRms) {
        const sol = freqToSolfege(pitch.freq, this.doFreqHz, CONFIG.toleranceCents);
        if (sol) {
          if (this._laneCandidate === sol.lane) {
            this._laneCandidateFrames++;
          } else {
            this._laneCandidate = sol.lane;
            this._laneCandidateFrames = 1;
          }

          if (this._laneCandidateFrames >= CONFIG.stableFramesNeeded) {
            this.detected.lane = sol.lane;
            this.detected.name = sol.name;
            this.detected.centsOff = sol.centsOff;

            this.player.targetLane = sol.lane; // CONTROL: sing to move lane
          }
        } else {
          this._laneCandidate = null;
          this._laneCandidateFrames = 0;
          this.detected.lane = null;
          this.detected.name = null;
          this.detected.centsOff = null;
        }
      } else {
        // no reliable solfege detected
        if (!this.keyboardOnly) {
          this.detected.lane = null;
          this.detected.name = null;
          this.detected.centsOff = null;
        }
        this._laneCandidate = null;
        this._laneCandidateFrames = 0;
      }

      // Update HUD
      this.ui.hudScore.textContent = `${this.score}`;

      // tuning hint
      if (this.detected.name) {
        this.ui.hudYou.textContent = this.detected.name;
        const c = this.detected.centsOff ?? 0;
        if (Math.abs(c) < 18) this.ui.hudTune.textContent = ' (in tune)';
        else this.ui.hudTune.textContent = c > 0 ? ' (sharp)' : ' (flat)';
      } else {
        this.ui.hudYou.textContent = '—';
        this.ui.hudTune.textContent = '';
      }

      // Movement and obstacles
      const baseSpeed = this.getScrollSpeed();
      let speed = baseSpeed;

      // Bounce state reverses motion briefly
      if (this.bounceTimer > 0) {
        this.bounceTimer -= dt;
        speed = -baseSpeed * CONFIG.bounceSpeedFactor;
      }

      if (this.collisionCooldown > 0) this.collisionCooldown -= dt;
      if (this.bounceHintTimer > 0) this.bounceHintTimer -= dt;

      this.scrollOffset += speed * dt;

      // Spawn obstacles (timer-based)
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawnObstacle();

        // Slight difficulty ramp (spawn a little faster as score increases)
        const ramp = clamp(this.score / 30, 0, 1);
        const tMin = lerp(CONFIG.spawnTimeMin, Math.max(0.9, CONFIG.spawnTimeMin - 0.35), ramp);
        const tMax = lerp(CONFIG.spawnTimeMax, Math.max(1.2, CONFIG.spawnTimeMax - 0.45), ramp);

        this.spawnTimer = rand(tMin, tMax);
      }

      // Move obstacles
      for (const obs of this.obstacles) {
        obs.x -= speed * dt; // NOTE: subtract because world moves left when speed positive
        // (If speed is negative during bounce, obstacles move right.)
      }

      // Remove off-screen obstacles
      this.obstacles = this.obstacles.filter(o => o.x + o.w > -100);

      // Player y smoothing toward target lane
      const targetY = this.laneYs[this.player.targetLane];
      this.player.y = smoothTo(this.player.y, targetY, 14, dt);

      // Determine next obstacle
      const next = this.obstacles.find(o => !o.passed);
      this.ui.hudNext.textContent = next ? next.label : '—';

      // Check passing / collision
      if (next) {
        // Mark passed for score
        if (!next.passed && (next.x + next.w) < (this.player.x - this.player.halfW - 4)) {
          next.passed = true;
          this.score++;
        }

        // Collision check if near player
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
            // Trigger bounce, but do NOT die.
            this.bounceTimer = CONFIG.bounceDuration;
            this.collisionCooldown = CONFIG.collisionCooldown;

            // Helpful hint text (higher/lower)
            if (this.player.targetLane < next.lane) this.bounceHintText = 'Sing higher ↑';
            else if (this.player.targetLane > next.lane) this.bounceHintText = 'Sing lower ↓';
            else this.bounceHintText = 'Try again';
            this.bounceHintTimer = 0.65;
          }
        }
      }
    }

    render() {
      const ctx = this.ctx;

      // Background paper
      ctx.clearRect(0, 0, this.w, this.h);
      ctx.fillStyle = '#f8f4ea';
      ctx.fillRect(0, 0, this.w, this.h);

      // Subtle paper texture (tiny dots)
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

      // Measure lines scrolling
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

      // Highlight lane for next obstacle (subtle)
      const next = this.obstacles.find(o => !o.passed);
      if (next) {
        const y = this.laneYs[next.lane];
        ctx.globalAlpha = 0.10;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, y - this.laneStep * 0.55, this.w, this.laneStep * 1.1);
        ctx.globalAlpha = 1;
      }

      // Obstacles
      for (const obs of this.obstacles) {
        this._drawObstacle(obs);
      }

      // Player note
      this._drawNote(this.player.x, this.player.y);

      // Bounce hint text
      if (this.bounceHintTimer > 0 && this.bounceHintText) {
        ctx.globalAlpha = clamp(this.bounceHintTimer / 0.65, 0, 1);
        ctx.fillStyle = 'rgba(0,0,0,0.78)';
        ctx.font = '700 18px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.bounceHintText, this.w / 2, this.staffTop - 18);
        ctx.globalAlpha = 1;
      }

      // Small footer hint on the canvas itself
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.font = '12px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Sing solfège to move • Up/Down keys also work', 12, this.h - 14);
    }

    _drawObstacle(obs) {
      const ctx = this.ctx;

      // Blocks
      ctx.fillStyle = 'rgba(0,0,0,0.85)';

      const topH = Math.max(0, obs.gapTop - (this.staffTop - this.staffSpacing * 2.0));
      const bottomY = obs.gapBottom;
      const bottomH = Math.max(0, (this.staffBottom + this.staffSpacing * 2.0) - bottomY);

      // Define a play band slightly beyond the staff for nicer visuals:
      const bandTop = this.staffTop - this.staffSpacing * 2.0;
      const bandBottom = this.staffBottom + this.staffSpacing * 2.0;

      // Top block
      ctx.fillRect(obs.x, bandTop, obs.w, obs.gapTop - bandTop);

      // Bottom block
      ctx.fillRect(obs.x, obs.gapBottom, obs.w, bandBottom - obs.gapBottom);

      // Label
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.font = '700 14px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
      ctx.textAlign = 'center';

      const labelY = clamp((obs.gapTop + obs.gapBottom) / 2, bandTop + 16, bandBottom - 10);
      ctx.fillText(obs.label, obs.x + obs.w / 2, labelY + 5);

      // Tiny target notehead marker in the gap
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

      // Notehead
      ctx.fillStyle = 'rgba(0,0,0,0.92)';
      ctx.beginPath();
      ctx.ellipse(x, y, s * 0.85, s * 0.60, -0.35, 0, Math.PI * 2);
      ctx.fill();

      // Stem (up)
      ctx.strokeStyle = 'rgba(0,0,0,0.92)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + s * 0.65, y - s * 0.15);
      ctx.lineTo(x + s * 0.65, y - s * 2.2);
      ctx.stroke();

      // Flag (simple curve)
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

# 5) How to integrate into your `github.io` site

### Option A: Link to the game page

If this is a **user site repo** (`<username>.github.io`):

* Put the folder in the repo root: `solfege-flight/`
* Then link to it from your homepage:

  ```html
  <a href="/solfege-flight/">Play Solfège Flight</a>
  ```

If this is a **project site** (`<username>.github.io/<repo>/`):

* Link like:

  ```html
  <a href="/<repo>/solfege-flight/">Play Solfège Flight</a>
  ```

### Option B: Embed it in an iframe

```html
<iframe
  src="/solfege-flight/"
  width="100%"
  height="700"
  style="border:0; border-radius:12px;"
  allow="microphone"
></iframe>
```

Note: some browsers require `allow="microphone"` to pass mic permissions into iframes cleanly.

---

# 6) What you can tweak quickly

In `game.js`, change these:

* `toleranceCents`: bigger = more forgiving pitch matching
* `minRms`: bigger = ignores more background noise
* `baseScrollSpeed`, `spawnTimeMin/Max`: difficulty pacing
* `gapHeightFactor`: bigger = easier obstacle gaps

---

# 7) Expected behavior checklist (matches your requirements)

* ✅ **Character is a music note**
* ✅ Moves through a **sheet music** background
* ✅ Movement is controlled by **singing** (mic access via browser)
* ✅ Uses **solfège Do–Re–Mi–Fa–Sol–La–Ti** (scale degrees) after calibrating “Do”
* ✅ **No death**: if you miss, you **bounce back** and can keep trying until you hit the right note

