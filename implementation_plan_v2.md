Below is a **concrete implementation upgrade** that adds a real **Level system** where each level is a **fixed solfège sequence** (vocal exercise / melody). Obstacles are no longer random: they spawn in the exact order of the selected level’s sequence.

You’ll replace your current files with these updated versions.

---

# 1) Replace `solfege-flight/index.html` with this

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

      <div class="row">
        <label class="opt">
          <span class="label">Level:</span>
          <select id="level-select"></select>
        </label>
      </div>

      <p id="level-desc" class="small"></p>

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

# 2) Replace `solfege-flight/style.css` with this (small update: `select` styling)

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
  max-width: 760px;
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

# 3) Replace `solfege-flight/game.js` with this (adds Levels + sequences)

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
    toleranceCents: 65,     // bigger = easier matching
    stableFramesNeeded: 3,  // require same solfege for N detections before moving

    // Calibration:
    calibrationSeconds: 1.0,  // hold Do for ~1 second
    calibrationHz: 30,        // sampling rate for pitch checks

    // Gameplay:
    baseScrollSpeed: 240,     // px/s
    maxScrollSpeed: 420,
    speedPerClear: 6,         // speed ramp with notes cleared
    spawnTimeMin: 1.35,
    spawnTimeMax: 2.00,
    gapHeightFactor: 2.35,    // gapHeight = laneStep * this
    obstacleWidth: 74,

    // Bounce (no-death):
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

  // Name -> lane index
  const NAME_TO_LANE = Object.create(null);
  for (let i = 0; i < SOLFEGE.length; i++) NAME_TO_LANE[SOLFEGE[i].name] = i;
  // Friendly aliases:
  NAME_TO_LANE.SO = NAME_TO_LANE.SOL;
  NAME_TO_LANE.SI = NAME_TO_LANE.TI;

  function normalizeToken(tok) {
    if (typeof tok === 'number') return tok;
    return String(tok).trim().toUpperCase();
  }

  function namesToLanes(seq) {
    return seq.map((tok) => {
      if (typeof tok === 'number') return clamp(tok, 0, 6);
      const name = normalizeToken(tok);
      const lane = NAME_TO_LANE[name];
      if (lane === undefined) throw new Error(`Unknown solfège token: "${tok}"`);
      return lane;
    });
  }

  function previewNames(seqNames, maxLen = 48) {
    const s = seqNames.join('–');
    if (s.length <= maxLen) return s;
    return s.slice(0, maxLen - 1) + '…';
  }

  /********************
   * LEVELS (edit/add here)
   * Each level "build" returns an array of solfège tokens (e.g., 'DO', 'RE', ...).
   ********************/
  function levelScaleUp() {
    return ['DO','RE','MI','FA','SOL','LA','TI'];
  }

  function levelUpAndDown() {
    // Do–Re–Mi–Fa–Sol–La–Ti then back down (no double-Ti)
    return ['DO','RE','MI','FA','SOL','LA','TI','LA','SOL','FA','MI','RE','DO'];
  }

  function levelCumulative() {
    // Do,
    // Do–Re–Do,
    // Do–Re–Mi–Re–Do,
    // ...
    // up to Ti
    const seq = [];
    for (let top = 0; top <= 6; top++) {
      for (let i = 0; i <= top; i++) seq.push(SOLFEGE[i].name);
      for (let i = top - 1; i >= 0; i--) seq.push(SOLFEGE[i].name);
    }
    return seq;
  }

  function level123454321() {
    return ['DO','RE','MI','FA','SOL','FA','MI','RE','DO'];
  }

  function levelArpeggio() {
    // Octave doesn't matter in this game; DO can be sung low or high.
    return ['DO','MI','SOL','DO','SOL','MI','DO'];
  }

  function levelTwinkle() {
    // "Twinkle Twinkle Little Star" in scale degrees (major)
    return [
      'DO','DO','SOL','SOL','LA','LA','SOL',
      'FA','FA','MI','MI','RE','RE','DO',

      'SOL','SOL','FA','FA','MI','MI','RE',
      'SOL','SOL','FA','FA','MI','MI','RE',

      'DO','DO','SOL','SOL','LA','LA','SOL',
      'FA','FA','MI','MI','RE','RE','DO',
    ];
  }

  function levelMary() {
    // "Mary Had a Little Lamb" (common version) in degrees (major)
    return [
      'MI','RE','DO','RE','MI','MI','MI',
      'RE','RE','RE',
      'MI','SOL','SOL',
      'MI','RE','DO','RE','MI','MI','MI',
      'MI','RE','RE','MI','RE','DO',
    ];
  }

  const LEVELS = [
    { title: 'Level 1 — Scale Up', desc: 'Do–Re–Mi–Fa–Sol–La–Ti', build: levelScaleUp },
    { title: 'Level 2 — Up & Down', desc: 'Do–Re–…–Ti–La–…–Do', build: levelUpAndDown },
    { title: 'Level 3 — Cumulative', desc: 'Do; Do–Re–Do; Do–Re–Mi–Re–Do; …', build: levelCumulative },
    { title: 'Level 4 — 1-2-3-4-5-4-3-2-1', desc: 'Classic warm-up pattern', build: level123454321 },
    { title: 'Level 5 — Arpeggio', desc: 'Do–Mi–Sol–Do–Sol–Mi–Do', build: levelArpeggio },
    { title: 'Level 6 — Twinkle (degrees)', desc: 'Do Do Sol Sol La La Sol …', build: levelTwinkle },
    { title: 'Level 7 — Mary (degrees)', desc: 'Mi Re Do Re Mi Mi Mi …', build: levelMary },
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

    for (let lag = minLag; lag <= maxLag; lag++) {
      let sum = 0;
      let sumSq1 = 0;
      let sumSq2 = 0;

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
      // Already started? just ensure the context is running.
      if (this.enabled) {
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
          await this.audioCtx.resume();
        }
        return;
      }

      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextCtor) throw new Error('Web Audio API not supported in this browser.');

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

      this.state = 'menu'; // menu | calibrate | play | paused | complete

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

      // Motion:
      this.scrollOffset = 0;

      // Bounce:
      this.bounceTimer = 0;
      this.collisionCooldown = 0;
      this.bounceHintTimer = 0;
      this.bounceHintText = '';
      this.bounceCount = 0;

      // Level system:
      this.levelIndex = 0;
      this.levelNames = [];
      this.levelSeq = [];       // lane indices
      this.levelSpawnIndex = 0; // how many notes have been spawned as obstacles
      this.clearedCount = 0;    // how many notes have been cleared
      this.levelStartMs = 0;
      this.pendingLevelIndex = 0;

      // Audio / solfege control:
      this.audio = new AudioInput();
      this.keyboardOnly = false;
      this.doFreqHz = null;

      // detection smoothing:
      this.detected = { lane: null, name: null, centsOff: null };
      this._laneCandidate = null;
      this._laneCandidateFrames = 0;

      // calibration:
      this.calSamples = [];
      this.calTargetCount = Math.ceil(CONFIG.calibrationSeconds * CONFIG.calibrationHz);
      this.calProgress = 0;
      this.calDone = false;

      // UI:
      this.ui = {
        screenMenu: $('#screen-menu'),
        screenCal: $('#screen-calibrate'),
        screenPaused: $('#screen-paused'),
        screenComplete: $('#screen-complete'),
        hud: $('#hud'),

        menuError: $('#menu-error'),
        optSkipCal: $('#opt-skipcal'),

        levelSelect: $('#level-select'),
        levelDesc: $('#level-desc'),

        calBar: $('#cal-bar'),
        calStatus: $('#cal-status'),

        hudLevel: $('#hud-level'),
        hudProgress: $('#hud-progress'),
        hudNext: $('#hud-next'),
        hudYou: $('#hud-you'),
        hudTune: $('#hud-tune'),
        micBar: $('#mic-bar'),

        completeTitle: $('#complete-title'),
        completeStats: $('#complete-stats'),
      };

      this._initLevelMenu();
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
          `${LEVELS[i].desc} • ${seqNames.length} notes • ` +
          `Preview: ${previewNames(seqNames)}`;
      };

      sel.addEventListener('change', updateDesc);
      sel.value = '0';
      updateDesc();
    }

    _bindEvents() {
      $('#btn-start').addEventListener('click', async () => {
        this.keyboardOnly = false;
        const skip = this.ui.optSkipCal.checked;
        this.pendingLevelIndex = parseInt(this.ui.levelSelect.value, 10) || 0;
        await this._startWithMic(skip);
      });

      $('#btn-keyboard').addEventListener('click', () => {
        this.keyboardOnly = true;
        this.doFreqHz = 261.625565; // C4 (only used for HUD mapping; keyboard doesn't need it)
        const idx = parseInt(this.ui.levelSelect.value, 10) || 0;
        this.beginLevel(idx);
      });

      $('#btn-cal-retry').addEventListener('click', () => {
        this._resetCalibration();
      });

      $('#btn-cal-skip').addEventListener('click', () => {
        this.doFreqHz = 261.625565; // C4
        this.beginLevel(this.pendingLevelIndex);
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

      // If resized mid-level, keep obstacle gaps aligned
      for (const obs of this.obstacles) {
        const gapY = this.laneYs[obs.lane];
        const gapH = this.laneStep * CONFIG.gapHeightFactor;
        obs.gapTop = gapY - gapH / 2;
        obs.gapBottom = gapY + gapH / 2;
      }
    }

    async _startWithMic(skipCalibration) {
      try {
        this._setMenuError('');
        await this.audio.start();

        // If skipping calibration, or already calibrated once, just start.
        if (skipCalibration) {
          this.doFreqHz = 261.625565;
          this.beginLevel(this.pendingLevelIndex);
          return;
        }

        if (this.doFreqHz) {
          this.beginLevel(this.pendingLevelIndex);
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
      const { screenMenu, screenCal, screenPaused, screenComplete, hud } = this.ui;
      screenMenu.classList.add('hidden');
      screenCal.classList.add('hidden');
      screenPaused.classList.add('hidden');
      screenComplete.classList.add('hidden');
      hud.classList.add('hidden');

      if (screen === 'menu') screenMenu.classList.remove('hidden');
      if (screen === 'calibrate') screenCal.classList.remove('hidden');
      if (screen === 'paused') screenPaused.classList.remove('hidden');
      if (screen === 'complete') screenComplete.classList.remove('hidden');
      if (screen === 'play') hud.classList.remove('hidden');
    }

    enterMenu() {
      this.state = 'menu';
      this._showOnly('menu');
    }

    _enterCalibration() {
      this.state = 'calibrate';
      this._showOnly('calibrate');
      this._resetCalibration();
    }

    _resetCalibration() {
      this.calSamples = [];
      this.calProgress = 0;
      this.calDone = false;
      this.ui.calBar.style.width = '0%';
      this.ui.calStatus.textContent = 'Listening… (hold Do steady)';
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
      this.levelNames = seqNames;
      this.levelSeq = namesToLanes(seqNames);
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
      this.spawnTimer = 1.0; // give player a beat before first obstacle

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
      const width = CONFIG.obstacleWidth;
      const x = this.w + 60;

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

    getUpcomingLane() {
      // Prefer the next unpassed obstacle; otherwise the next note that hasn't spawned yet.
      const nextObs = this.obstacles.find(o => !o.passed);
      if (nextObs) return nextObs.lane;
      if (this.levelSpawnIndex < this.levelSeq.length) return this.levelSeq[this.levelSpawnIndex];
      return null;
    }

    getUpcomingLabel() {
      const nextObs = this.obstacles.find(o => !o.passed);
      if (nextObs) return nextObs.label;
      if (this.levelSpawnIndex < this.levelSeq.length) return SOLFEGE[this.levelSeq[this.levelSpawnIndex]].name;
      return '—';
    }

    update(dt) {
      // Audio update always (meter)
      const pitch = this.audio.update(dt);

      // Mic level meter
      const rms = pitch ? pitch.rms : 0;
      const micLevel = clamp((rms - CONFIG.minRms) / 0.08, 0, 1);
      this.ui.micBar.style.width = `${Math.floor(micLevel * 100)}%`;

      // Calibration logic
      if (this.state === 'calibrate') {
        if (!this.calDone && pitch && pitch.clarity >= CONFIG.minClarity && pitch.rms >= CONFIG.minRms) {
          this.calSamples.push(pitch.freq);

          this.calProgress = clamp(this.calSamples.length / this.calTargetCount, 0, 1);
          this.ui.calBar.style.width = `${Math.floor(this.calProgress * 100)}%`;

          if (this.calSamples.length >= this.calTargetCount) {
            this.calDone = true;
            const doFreq = median(this.calSamples);
            this.doFreqHz = doFreq;
            this.ui.calStatus.textContent = `Captured Do ≈ ${doFreq.toFixed(1)} Hz`;

            setTimeout(() => {
              // Start the level chosen at the menu
              this.beginLevel(this.pendingLevelIndex);
            }, 250);
          }
        } else if (!this.calDone) {
          this.ui.calStatus.textContent = 'Listening… (try a steady vowel like “doo”)';
        }

        return;
      }

      if (this.state === 'paused') return;
      if (this.state === 'menu') return;
      if (this.state === 'complete') return;

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
            this.player.targetLane = sol.lane;
          }
        } else {
          this._laneCandidate = null;
          this._laneCandidateFrames = 0;
          this.detected.lane = null;
          this.detected.name = null;
          this.detected.centsOff = null;
        }
      } else {
        if (!this.keyboardOnly) {
          this.detected.lane = null;
          this.detected.name = null;
          this.detected.centsOff = null;
        }
        this._laneCandidate = null;
        this._laneCandidateFrames = 0;
      }

      // HUD
      this.ui.hudLevel.textContent = `${this.levelIndex + 1}/${LEVELS.length}`;
      this.ui.hudProgress.textContent = `${this.clearedCount}/${this.levelSeq.length}`;
      this.ui.hudNext.textContent = this.getUpcomingLabel();

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

      if (this.bounceTimer > 0) {
        this.bounceTimer -= dt;
        speed = -baseSpeed * CONFIG.bounceSpeedFactor;
      }

      if (this.collisionCooldown > 0) this.collisionCooldown -= dt;
      if (this.bounceHintTimer > 0) this.bounceHintTimer -= dt;

      this.scrollOffset += speed * dt;

      // Spawn next obstacle from the LEVEL sequence
      if (this.spawnTimer !== Infinity) {
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
          if (this.levelSpawnIndex < this.levelSeq.length) {
            const lane = this.levelSeq[this.levelSpawnIndex];
            this.levelSpawnIndex++;
            this.spawnObstacleForLane(lane);
          }

          // Schedule next spawn if there are still notes left
          if (this.levelSpawnIndex < this.levelSeq.length) {
            // Slight in-level ramp (optional)
            const ramp = clamp(this.clearedCount / 30, 0, 1);
            const tMin = lerp(CONFIG.spawnTimeMin, Math.max(0.9, CONFIG.spawnTimeMin - 0.35), ramp);
            const tMax = lerp(CONFIG.spawnTimeMax, Math.max(1.2, CONFIG.spawnTimeMax - 0.45), ramp);
            this.spawnTimer = rand(tMin, tMax);
          } else {
            this.spawnTimer = Infinity;
          }
        }
      }

      // Move obstacles
      for (const obs of this.obstacles) {
        obs.x -= speed * dt;
      }

      // Remove off-screen obstacles
      this.obstacles = this.obstacles.filter(o => o.x + o.w > -120);

      // Player y smoothing
      const targetY = this.laneYs[this.player.targetLane];
      this.player.y = smoothTo(this.player.y, targetY, 14, dt);

      // Collision / passing against the NEXT unpassed obstacle
      const next = this.obstacles.find(o => !o.passed);
      if (next) {
        // Passed?
        if (!next.passed && (next.x + next.w) < (this.player.x - this.player.halfW - 4)) {
          next.passed = true;
          this.clearedCount++;
        }

        // Collision check near player
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

      // Level complete?
      if (this.clearedCount >= this.levelSeq.length && this.levelSeq.length > 0) {
        this._enterComplete();
      }
    }

    render() {
      const ctx = this.ctx;

      // Background paper
      ctx.clearRect(0, 0, this.w, this.h);
      ctx.fillStyle = '#f8f4ea';
      ctx.fillRect(0, 0, this.w, this.h);

      // Subtle paper texture
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

      // Highlight upcoming lane (even before obstacle is spawned)
      const upcomingLane = this.getUpcomingLane();
      if (upcomingLane !== null) {
        const y = this.laneYs[upcomingLane];
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
        ctx.globalAlpha = clamp(this.bounceHintTimer / 0.75, 0, 1);
        ctx.fillStyle = 'rgba(0,0,0,0.78)';
        ctx.font = '700 18px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.bounceHintText, this.w / 2, this.staffTop - 18);
        ctx.globalAlpha = 1;
      }

      // Footer hint
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.font = '12px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Sing solfège to move • Up/Down keys also work', 12, this.h - 14);
    }

    _drawObstacle(obs) {
      const ctx = this.ctx;

      // Define a play band slightly beyond the staff for nicer visuals:
      const bandTop = this.staffTop - this.staffSpacing * 2.0;
      const bandBottom = this.staffBottom + this.staffSpacing * 2.0;

      // Blocks
      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      ctx.fillRect(obs.x, bandTop, obs.w, obs.gapTop - bandTop);
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

      // Stem
      ctx.strokeStyle = 'rgba(0,0,0,0.92)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + s * 0.65, y - s * 0.15);
      ctx.lineTo(x + s * 0.65, y - s * 2.2);
      ctx.stroke();

      // Flag
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

# 4) How to add your own new levels (your “vocal exercises and melodies”)

Add a new builder function, then add it to `LEVELS`.

Example: a simple repeating pattern (Do–Mi–Re–Fa–Mi–Sol–…)

```js
function levelMyExercise() {
  return ['DO','MI','RE','FA','MI','SOL','FA','LA','SOL','TI','LA','DO'];
}

LEVELS.push({
  title: 'Level X — My Exercise',
  desc: 'Do–Mi–Re–Fa…',
  build: levelMyExercise
});
```

---

# 5) What you now get

* ✅ Level selector on the menu
* ✅ Levels are **exact sequences**, not random
* ✅ A real **Level Complete** screen with “Next Level / Replay”
* ✅ Your examples implemented:

  * Level 1: ascending scale
  * Level 2: ascending then descending
  * Level 3: cumulative “Do; Do-Re-Do; Do-Re-Mi-Re-Do; …”
* ✅ Extra example levels (“1-2-3-4-5-4-3-2-1”, arpeggio, Twinkle, Mary)

---

If you tell me 2–3 specific vocal exercises you like (e.g., “sirens”, “1-3-5-8-5-3-1”, “major scale in thirds”, “chromatic”), I’ll encode them as additional levels in the same format.
