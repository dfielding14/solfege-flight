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
    analysisHz: 30,

    // Voice control smoothing:
    stableFramesNeeded: 3,
    controlToleranceCents: 90,

    // Calibration:
    holdSeconds: 0.6,
    captureToleranceCents: 120,
    tunerNeedleRangeCents: 180,
    stabilityWindow: 14,
    stabilityMaxDevCents: 65,
    wizardSmoothFactor: 0.15,
    gameplaySmoothFactor: 0.22,

    // Wizard ambiance:
    wizardScrollSpeed: 60,

    // Gameplay:
    baseScrollSpeed: 240,
    maxScrollSpeed: 420,
    speedPerClear: 6,
    spawnTimeMin: 1.35,
    spawnTimeMax: 2.0,
    gapHeightFactor: 2.35,
    obstacleWidth: 74,

    // Bounce:
    bounceDuration: 0.26,
    bounceSpeedFactor: 0.62,
    collisionCooldown: 0.2,

    // Visual:
    staffSpacingMin: 18,
    staffSpacingMax: 30,
    noteSize: 16,
    noteHitboxW: 28,
    noteHitboxH: 20,
  };

  const COLORS = {
    paperTop: '#f7efdf',
    paperBottom: '#efe1c8',
    ink: 'rgba(30, 25, 20, 0.92)',
    inkSoft: 'rgba(30, 25, 20, 0.45)',
    inkFaint: 'rgba(30, 25, 20, 0.18)',
    label: 'rgba(255, 255, 255, 0.95)',
  };

  const FONTS = {
    label: '700 14px "Space Grotesk", sans-serif',
    obstacleLabel: '700 22px "Space Grotesk", sans-serif',
    hint: '12px "Space Grotesk", sans-serif',
    heading: '700 18px "Fraunces", serif',
  };

  const SOLFEGE = [
    { name: 'DO', semis: 0 },
    { name: 'RE', semis: 2 },
    { name: 'MI', semis: 4 },
    { name: 'FA', semis: 5 },
    { name: 'SOL', semis: 7 },
    { name: 'LA', semis: 9 },
    { name: 'TI', semis: 11 },
  ];

  // Name -> lane index
  const NAME_TO_LANE = Object.create(null);
  for (let i = 0; i < SOLFEGE.length; i++) NAME_TO_LANE[SOLFEGE[i].name] = i;
  // Friendly aliases
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
      if (lane === undefined) throw new Error(`Unknown solfege token: "${tok}"`);
      return lane;
    });
  }

  function previewNames(seqNames, maxLen = 48) {
    const s = seqNames.join('-');
    if (s.length <= maxLen) return s;
    return s.slice(0, maxLen - 3) + '...';
  }

  /********************
   * LEVELS (edit/add here)
   ********************/
  function levelScaleUp() {
    return ['DO', 'RE', 'MI', 'FA', 'SOL', 'LA', 'TI'];
  }

  function levelUpAndDown() {
    return ['DO', 'RE', 'MI', 'FA', 'SOL', 'LA', 'TI', 'LA', 'SOL', 'FA', 'MI', 'RE', 'DO'];
  }

  function levelCumulative() {
    const seq = [];
    for (let top = 0; top <= 6; top++) {
      for (let i = 0; i <= top; i++) seq.push(SOLFEGE[i].name);
      for (let i = top - 1; i >= 0; i--) seq.push(SOLFEGE[i].name);
    }
    return seq;
  }

  function level123454321() {
    return ['DO', 'RE', 'MI', 'FA', 'SOL', 'FA', 'MI', 'RE', 'DO'];
  }

  function levelArpeggio() {
    return ['DO', 'MI', 'SOL', 'DO', 'SOL', 'MI', 'DO'];
  }

  function levelTwinkle() {
    return [
      'DO', 'DO', 'SOL', 'SOL', 'LA', 'LA', 'SOL',
      'FA', 'FA', 'MI', 'MI', 'RE', 'RE', 'DO',
      'SOL', 'SOL', 'FA', 'FA', 'MI', 'MI', 'RE',
      'SOL', 'SOL', 'FA', 'FA', 'MI', 'MI', 'RE',
      'DO', 'DO', 'SOL', 'SOL', 'LA', 'LA', 'SOL',
      'FA', 'FA', 'MI', 'MI', 'RE', 'RE', 'DO',
    ];
  }

  function levelMary() {
    return [
      'MI', 'RE', 'DO', 'RE', 'MI', 'MI', 'MI',
      'RE', 'RE', 'RE',
      'MI', 'SOL', 'SOL',
      'MI', 'RE', 'DO', 'RE', 'MI', 'MI', 'MI',
      'MI', 'RE', 'RE', 'MI', 'RE', 'DO',
    ];
  }

  const LEVELS = [
    { title: 'Level 1 - Scale Up', desc: 'Do-Re-Mi-Fa-Sol-La-Ti', build: levelScaleUp },
    { title: 'Level 2 - Up and Down', desc: 'Do-Re-...-Ti-La-...-Do', build: levelUpAndDown },
    { title: 'Level 3 - Cumulative', desc: 'Do; Do-Re-Do; Do-Re-Mi-Re-Do; ...', build: levelCumulative },
    { title: 'Level 4 - 1-2-3-4-5-4-3-2-1', desc: 'Classic warm-up pattern', build: level123454321 },
    { title: 'Level 5 - Arpeggio', desc: 'Do-Mi-Sol-Do-Sol-Mi-Do', build: levelArpeggio },
    { title: 'Level 6 - Twinkle (degrees)', desc: 'Do Do Sol Sol La La Sol ...', build: levelTwinkle },
    { title: 'Level 7 - Mary (degrees)', desc: 'Mi Re Do Re Mi Mi Mi ...', build: levelMary },
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
  const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

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
      return denom ? (sum / denom) : 0;
    };

    // Octave preference: if half-lag is almost as good, pick it to reduce octave errors.
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

    return {
      freq,
      rms,
      clarity: corr,
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
      this.hz = CONFIG.analysisHz;
    }

    async start() {
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
   * TONE PLAYER (reference tones)
   ********************/
  class TonePlayer {
    constructor(audioCtx) {
      this.ctx = audioCtx;
    }

    play(freq, seconds = 1.0) {
      if (!this.ctx || !freq) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      const t0 = this.ctx.currentTime;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.2, t0 + 0.02);
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

      // Sheet music layout
      this.staffSpacing = 24;
      this.staffTop = 0;
      this.staffBottom = 0;
      this.laneStep = 0;
      this.laneYs = [];

      // Player
      this.player = {
        x: 160,
        y: 0,
        targetLane: 3,
        halfW: CONFIG.noteHitboxW / 2,
        halfH: CONFIG.noteHitboxH / 2,
      };

      // Obstacles
      this.obstacles = [];
      this.spawnTimer = rand(CONFIG.spawnTimeMin, CONFIG.spawnTimeMax);

      // Motion
      this.scrollOffset = 0;

      // Bounce
      this.bounceTimer = 0;
      this.collisionCooldown = 0;
      this.bounceHintTimer = 0;
      this.bounceHintText = '';
      this.bounceCount = 0;

      // Level system
      this.levelIndex = 0;
      this.levelSeq = [];
      this.levelSpawnIndex = 0;
      this.clearedCount = 0;
      this.levelStartMs = 0;
      this.pendingLevelIndex = 0;
      this.speedScale = 1;
      this.controlToleranceCents = CONFIG.controlToleranceCents;

      // Audio control
      this.audio = new AudioInput();
      this.tone = null;
      this.keyboardOnly = false;

      // Calibration data
      this.doFreqHz = null;
      this.scaleFreqs = null;
      this.scaleBounds = null;

      // Detection smoothing
      this.detected = { lane: null, name: null, centsOff: null };
      this._laneCandidate = null;
      this._laneCandidateFrames = 0;

      // Wizard
      this.wizStep = 0;
      this.wizMode = null; // fixedC | movable
      this.wizHold = 0;
      this.wizHoldSamples = [];
      this.wizStability = [];
      this.wizScaleIndex = 1;
      this.wizChecks = Array(7).fill(false);
      this.voiceEstimate = null;
      this.smoothedFreq = null;
      this.smoothedGameplayFreq = null;
      this.animT = 0;
      this.smoothedGameplayFreq = null;
      this.smoothedFreq = null;

      // UI
      this.ui = {
        screenMenu: $('#screen-menu'),
        screenWizard: $('#screen-wizard'),
        screenPaused: $('#screen-paused'),
        screenComplete: $('#screen-complete'),
        hud: $('#hud'),

        menuError: $('#menu-error'),

        levelSelect: $('#level-select'),
        levelDesc: $('#level-desc'),
        speedSlider: $('#speed-slider'),
        speedValue: $('#speed-value'),
        difficultySlider: $('#difficulty-slider'),
        difficultyValue: $('#difficulty-value'),

        // Wizard elements
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

        // Live analysis
        liveFreq: $('#live-freq'),
        liveNote: $('#live-note'),
        liveClarity: $('#live-clarity'),
        liveVolume: $('#live-volume'),
        liveCents: $('#live-cents'),
        liveSolfege: $('#live-solfege'),
        gaugeNeedle: $('#gauge-needle'),

        // Wizard buttons
        btnWizBack: $('#btn-wiz-back'),
        btnWizNext: $('#btn-wiz-next'),
        btnWizSkip: $('#btn-wiz-skip'),
        btnModeC: $('#btn-mode-c'),
        btnModeDo: $('#btn-mode-do'),

        // HUD
        hudLevel: $('#hud-level'),
        hudProgress: $('#hud-progress'),
        hudNext: $('#hud-next'),
        hudYou: $('#hud-you'),
        hudTune: $('#hud-tune'),
        micBar: $('#mic-bar'),
        btnReport: $('#btn-report'),

        // Pause/complete
        completeTitle: $('#complete-title'),
        completeStats: $('#complete-stats'),
        btnReportPaused: $('#btn-report-paused'),
      };

      this._initLevelMenu();
      this._initSpeedControl();
      this._initDifficultyControl();
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
          `${LEVELS[i].desc} - ${seqNames.length} notes - ` +
          `Preview: ${previewNames(seqNames)}`;
      };

      sel.addEventListener('change', updateDesc);
      sel.value = '0';
      updateDesc();
    }

    _initSpeedControl() {
      const slider = this.ui.speedSlider;
      if (!slider) return;
      const parsed = parseFloat(slider.value);
      this.speedScale = Number.isFinite(parsed) ? parsed : 1;
      this._updateSpeedLabel();
      slider.addEventListener('input', () => {
        const next = parseFloat(slider.value);
        this.speedScale = Number.isFinite(next) ? next : 1;
        this._updateSpeedLabel();
      });
    }

    _updateSpeedLabel() {
      if (!this.ui.speedValue) return;
      this.ui.speedValue.textContent = `${Math.round(this.speedScale)}x`;
    }

    _initDifficultyControl() {
      const slider = this.ui.difficultySlider;
      if (!slider) return;
      const parsed = parseFloat(slider.value);
      this.controlToleranceCents = Number.isFinite(parsed) ? parsed : CONFIG.controlToleranceCents;
      this._updateDifficultyLabel();
      slider.addEventListener('input', () => {
        const next = parseFloat(slider.value);
        this.controlToleranceCents = Number.isFinite(next) ? next : CONFIG.controlToleranceCents;
        this._updateDifficultyLabel();
      });
    }

    _updateDifficultyLabel() {
      if (!this.ui.difficultyValue) return;
      const cents = Math.round(this.controlToleranceCents);
      this.ui.difficultyValue.textContent = `±${cents}c`;
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
        this._resetCalibrationData();
        const idx = parseInt(this.ui.levelSelect.value, 10) || 0;
        this.beginLevel(idx);
      });

      $('#btn-pause').addEventListener('click', () => {
        if (this.state === 'play') this._enterPaused();
        else if (this.state === 'paused') this._enterPlay();
      });

      if (this.ui.btnReport) {
        this.ui.btnReport.addEventListener('click', () => {
          this.reportIssue('hud-button');
        });
      }

      $('#btn-resume').addEventListener('click', () => this._enterPlay());
      $('#btn-restart').addEventListener('click', () => this.restartLevel());
      $('#btn-menu').addEventListener('click', () => this.enterMenu());
      if (this.ui.btnReportPaused) {
        this.ui.btnReportPaused.addEventListener('click', () => {
          this.reportIssue('paused-button');
        });
      }

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
        if (this.state === 'wizard' && this.wizStep < 2) this._setWizardStep(2);
      });

      this.ui.btnModeC.addEventListener('click', () => {
        this.wizMode = 'fixedC';
        this._resetCalibrationData();
        this._setWizardStep(3);
      });
      this.ui.btnModeDo.addEventListener('click', () => {
        this.wizMode = 'movable';
        this._resetCalibrationData();
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
          'Microphone access failed. You can try again, or use "Play with Keyboard". ' +
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

      this._resetCalibrationData();
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

    _resetCalibrationData() {
      this.doFreqHz = null;
      this.scaleFreqs = null;
      this.scaleBounds = null;
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

      this.ui.completeTitle.textContent = `${LEVELS[this.levelIndex].title} - Complete!`;
      this.ui.completeStats.textContent =
        `Time: ${sec.toFixed(1)}s | Bounces: ${this.bounceCount} | Notes: ${this.levelSeq.length}`;
    }

    setLevel(index) {
      this.levelIndex = clamp(index, 0, LEVELS.length - 1);
      const seqNames = LEVELS[this.levelIndex].build();
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
      this.spawnTimer = 1.0 * this.getSpawnTimeScale();

      this.player.targetLane = 3;
      this.player.y = this.laneYs[this.player.targetLane];

      this.detected = { lane: null, name: null, centsOff: null };
      this._laneCandidate = null;
      this._laneCandidateFrames = 0;
      this.smoothedGameplayFreq = null;
    }

    restartLevel() {
      this.resetRunForLevel();
      this.levelStartMs = performance.now();
      this._enterPlay();
    }

    getScrollSpeed() {
      const scale = this.speedScale || 1;
      const base = CONFIG.baseScrollSpeed * scale;
      const max = CONFIG.maxScrollSpeed * scale;
      const speed = base + this.clearedCount * CONFIG.speedPerClear * scale;
      return clamp(speed, base, max);
    }

    getSpawnTimeScale() {
      const scale = clamp(this.speedScale || 1, 1, 10);
      return 1 / scale;
    }

    _ensureSpawnSpacing(baseSpeed) {
      const last = this.obstacles[this.obstacles.length - 1];
      if (!last) return true;
      const spawnX = this.w + 60;
      const gap = spawnX - (last.x + last.w);
      const minGap = Math.max(CONFIG.obstacleWidth * 2.4, 160);
      if (gap >= minGap) return true;
      const speed = Math.max(60, baseSpeed);
      const delay = (minGap - gap) / speed;
      this.spawnTimer = Math.max(this.spawnTimer, delay);
      return false;
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
      const nextObs = this.obstacles.find(o => !o.passed);
      if (nextObs) return nextObs.lane;
      if (this.levelSpawnIndex < this.levelSeq.length) return this.levelSeq[this.levelSpawnIndex];
      return null;
    }

    getUpcomingLabel() {
      const nextObs = this.obstacles.find(o => !o.passed);
      if (nextObs) return nextObs.label;
      if (this.levelSpawnIndex < this.levelSeq.length) return SOLFEGE[this.levelSeq[this.levelSpawnIndex]].name;
      return '--';
    }

    reportIssue(reason) {
      const round = (v, digits = 2) => (
        typeof v === 'number' && Number.isFinite(v) ? Number(v.toFixed(digits)) : v
      );

      const report = {
        time: new Date().toISOString(),
        reason,
        state: this.state,
        levelIndex: this.levelIndex,
        levelTitle: LEVELS[this.levelIndex] ? LEVELS[this.levelIndex].title : null,
        speedScale: this.speedScale,
        controlToleranceCents: this.controlToleranceCents,
        clearedCount: this.clearedCount,
        levelSpawnIndex: this.levelSpawnIndex,
        spawnTimer: round(this.spawnTimer, 3),
        scrollOffset: round(this.scrollOffset, 2),
        bounceTimer: round(this.bounceTimer, 3),
        collisionCooldown: round(this.collisionCooldown, 3),
        bounceHintTimer: round(this.bounceHintTimer, 3),
        bounceHintText: this.bounceHintText,
        bounceCount: this.bounceCount,
        player: {
          x: round(this.player.x, 1),
          y: round(this.player.y, 1),
          targetLane: this.player.targetLane,
        },
        detected: this.detected ? {
          lane: this.detected.lane,
          name: this.detected.name,
          centsOff: round(this.detected.centsOff, 1),
        } : null,
        calibration: {
          doFreqHz: round(this.doFreqHz, 2),
          scaleFreqs: this.scaleFreqs ? this.scaleFreqs.map(f => round(f, 2)) : null,
          scaleBounds: this.scaleBounds ? this.scaleBounds.map(v => round(v, 2)) : null,
        },
        obstacles: this.obstacles.map(o => ({
          x: round(o.x, 1),
          w: round(o.w, 1),
          lane: o.lane,
          gapTop: round(o.gapTop, 1),
          gapBottom: round(o.gapBottom, 1),
          passed: o.passed,
        })),
        audio: this.audio && this.audio.latest ? {
          freq: round(this.audio.latest.freq, 2),
          rms: round(this.audio.latest.rms, 4),
          clarity: round(this.audio.latest.clarity, 3),
        } : null,
        viewport: {
          w: this.w,
          h: this.h,
          staffTop: round(this.staffTop, 1),
          staffBottom: round(this.staffBottom, 1),
          laneStep: round(this.laneStep, 2),
        },
      };

      if (!window.__solfegeReports) window.__solfegeReports = [];
      window.__solfegeReports.push(report);
      console.warn('[Solfege Flight] Report', report);
      return report;
    }

    /********************
     * WIZARD LOGIC
     ********************/
    _setWizardStep(step) {
      this.wizStep = clamp(step, 0, 5);
      if (this.wizStep === 3) this.wizStability = [];
      this._resetHold();
      this._renderWizardUI();
    }

    _wizardBack() {
      if (this.wizStep === 0) {
        this.enterMenu();
        return;
      }

      if (this.wizStep === 1) {
        this._setWizardStep(0);
        return;
      }

      if (this.wizStep === 2) {
        this._setWizardStep(1);
        return;
      }

      if (this.wizStep === 3) {
        this._resetCalibrationData();
        this.wizMode = null;
        this._setWizardStep(2);
        return;
      }

      if (this.wizStep === 4) {
        this._resetCalibrationData();
        this.wizScaleIndex = 1;
        this.wizChecks = Array(7).fill(false);
        this._updateChecklistUI();
        this._setWizardStep(3);
        return;
      }

      if (this.wizStep === 5) {
        this.wizScaleIndex = 1;
        this.wizChecks = Array(7).fill(false);
        this._updateChecklistUI();
        this._setWizardStep(4);
      }
    }

    _wizardNext() {
      if (this.wizStep === 2) {
        this._setWizardError('Choose a calibration method first.');
        return;
      }
      if (this.wizStep === 3 && !this.doFreqHz) {
        this._setWizardError('Sing and hold until it captures your Do.');
        return;
      }
      if (this.wizStep === 4) {
        if (!this.doFreqHz) {
          this._setWizardError('Missing Do. Go Back and capture it first.');
          return;
        }
        if (!this.scaleFreqs) this.scaleFreqs = buildScaleFromDo(this.doFreqHz);
        if (!this.scaleBounds) this.scaleBounds = buildBounds(this.scaleFreqs);
        this._setWizardStep(5);
        return;
      }
      if (this.wizStep === 5) {
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
      this.ui.holdStatus.textContent = '--';
      this._setWizardError('');
    }

    _updateHold(dt, ok, freq) {
      if (!ok) {
        this.wizHold = 0;
        this.wizHoldSamples = [];
        this.ui.holdBar.style.width = '0%';
        return false;
      }

      this.wizHold += dt;
      if (freq) this.wizHoldSamples.push(freq);

      const p = clamp(this.wizHold / CONFIG.holdSeconds, 0, 1);
      this.ui.holdBar.style.width = `${Math.floor(p * 100)}%`;
      return p >= 1;
    }

    _renderWizardUI() {
      this.ui.wizStep.textContent = `Step ${this.wizStep + 1} / 6`;

      this.ui.wizModeRow.classList.add('hidden');
      this.ui.wizTarget.classList.add('hidden');
      this.ui.wizChecklist.classList.add('hidden');
      this.ui.btnTone2.classList.add('hidden');
      this.ui.btnTone.classList.add('hidden');
      this.ui.btnWizSkip.classList.add('hidden');

      this.ui.btnWizNext.textContent = (this.wizStep === 5) ? 'Start Level' : 'Next';

      if (this.wizStep <= 1) {
        this.ui.btnWizSkip.classList.remove('hidden');
      }

      if (this.wizStep === 0) {
        this.ui.wizStepTitle.textContent = 'How the game hears your voice';
        this.ui.wizText.innerHTML =
          'Your browser estimates your <b>pitch</b> (frequency in Hz). Higher Hz means a higher note.<br><br>' +
          'In this game, the staff has <b>7 lanes</b>: <b>DO to TI</b> (one octave). ' +
          'We calibrate your DO, then the game recognizes the rest of the scale.';
        return;
      }

      if (this.wizStep === 1) {
        this.ui.wizStepTitle.textContent = 'Microphone check (like a tuner)';
        this.ui.wizText.innerHTML =
          'Make a steady tone (hum or sing). Watch the live readout: Hz, note name, cents, clarity, volume.<br><br>' +
          'If the note jumps around, try a steady vowel ("doo").';
        return;
      }

      if (this.wizStep === 2) {
        this.ui.wizStepTitle.textContent = 'Choose a calibration method';
        this.ui.wizText.innerHTML =
          '<b>Option A:</b> Try to match a <b>C</b> first (tuner-style).<br>' +
          '<b>Option B:</b> Use any comfortable note as <b>DO</b>.';
        this.ui.wizModeRow.classList.remove('hidden');
        return;
      }

      if (this.wizStep === 3) {
        this.ui.wizTarget.classList.remove('hidden');
        this.ui.btnTone.classList.remove('hidden');

        if (this.wizMode === 'fixedC') {
          this.ui.wizStepTitle.textContent = 'Match C (tuner-style)';
          this.ui.wizText.innerHTML =
            'Sing a <b>C</b> (any octave) and hold it steady until the bar fills.<br><br>' +
            'This sets your DO = C in the octave you are singing.';
          this.ui.targetHint.textContent =
            'If you cannot find C, go Back and choose "comfortable DO".';

          this.ui.btnTone2.classList.remove('hidden');
          this.ui.targetLabel.textContent = 'C (any octave)';
        } else {
          this.ui.wizStepTitle.textContent = 'Choose your DO';
          this.ui.wizText.innerHTML =
            'Sing any comfortable steady note and hold it. We will call that <b>DO</b>.<br><br>' +
            'Then we will guide you through DO to TI.';
          this.ui.targetLabel.textContent = 'Your DO (any steady pitch)';
          this.ui.targetHint.textContent =
            'Do not worry about letter names. Just pick a comfortable pitch.';
          this.ui.btnTone.classList.add('hidden');
        }
        return;
      }

      if (this.wizStep === 4) {
        this.ui.wizTarget.classList.remove('hidden');
        this.ui.btnTone.classList.remove('hidden');
        this.ui.btnTone2.classList.remove('hidden');

        const name = SOLFEGE[this.wizScaleIndex]?.name ?? '--';
        this.ui.wizStepTitle.textContent = 'Calibrate the scale (DO to TI)';
        this.ui.wizText.innerHTML =
          'Match each scale degree in the same octave. Use "Play reference tone" if needed.<br><br>' +
          `We are capturing: <b>${name}</b>.`;
        this.ui.targetLabel.textContent = name;
        this.ui.targetHint.textContent =
          'Hold within the target. The bar fills when you are close and steady.';
        this.ui.btnWizNext.textContent = 'Skip (use theory)';
        return;
      }

      if (this.wizStep === 5) {
        this.ui.wizChecklist.classList.remove('hidden');
        this.ui.wizStepTitle.textContent = 'Test it';
        this.ui.wizText.innerHTML =
          'Try singing different pitches. The note on the staff should move <b>up</b> when you sing <b>higher</b>.<br><br>' +
          'Try lighting up the DO to TI checklist once. Then press <b>Start Level</b>.';
        this.ui.btnWizNext.textContent = 'Start Level';
      }
    }

    _smoothWizardFreq(freq) {
      if (!freq || !Number.isFinite(freq)) return null;
      if (!this.smoothedFreq) {
        this.smoothedFreq = freq;
        return freq;
      }
      const alpha = CONFIG.wizardSmoothFactor;
      this.smoothedFreq = lerp(this.smoothedFreq, freq, alpha);
      return this.smoothedFreq;
    }

    _smoothGameplayFreq(freq) {
      if (!freq || !Number.isFinite(freq)) return null;
      if (!this.smoothedGameplayFreq) {
        this.smoothedGameplayFreq = freq;
        return freq;
      }
      const alpha = CONFIG.gameplaySmoothFactor;
      this.smoothedGameplayFreq = lerp(this.smoothedGameplayFreq, freq, alpha);
      return this.smoothedGameplayFreq;
    }

    _currentTargetToneFreq(altOctave = false) {
      if (!this.audio.enabled) return null;
      if (this.state !== 'wizard') return null;

      if (this.wizStep === 3 && this.wizMode === 'fixedC') {
        const base = this.voiceEstimate ?? 261.625565;
        const baseMidi = freqToMidi(base);
        const targetMidi = closestMidiOfClass(baseMidi, 0);
        let f = midiToFreq(targetMidi);
        if (altOctave) f *= 2;
        return f;
      }

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
      this.animT += dt;
      const pitch = this.audio.update(dt);

      const rms = pitch ? pitch.rms : 0;
      const micLevel = clamp((rms - CONFIG.minRms) / 0.08, 0, 1);
      this.ui.micBar.style.width = `${Math.floor(micLevel * 100)}%`;

      if (this.state === 'wizard') {
        this.scrollOffset += CONFIG.wizardScrollSpeed * dt;
        this._updateWizard(dt, pitch);
        return;
      }

      if (this.state === 'paused' || this.state === 'menu' || this.state === 'complete') return;
      if (this.state !== 'play') return;

      // HUD
      this.ui.hudLevel.textContent = `${this.levelIndex + 1}/${LEVELS.length}`;
      this.ui.hudProgress.textContent = `${this.clearedCount}/${this.levelSeq.length}`;
      this.ui.hudNext.textContent = this.getUpcomingLabel();

      // Voice control
      if (!this.keyboardOnly && this.doFreqHz && this.scaleFreqs && this.scaleBounds && pitch && pitch.clarity >= CONFIG.minClarity && pitch.rms >= CONFIG.minRms) {
        const freq = this._smoothGameplayFreq(pitch.freq);
        const sol = analyzeSolfege(freq, this.scaleFreqs, this.scaleBounds);
        const tiCents = centsBetween(freq, this.scaleFreqs[6]);
        if (freq >= this.scaleFreqs[5] * 0.98 && Math.abs(tiCents) <= this.controlToleranceCents * 1.2) {
          sol.lane = 6;
          sol.name = 'TI';
          sol.centsOff = tiCents;
        }
        const inTune = Math.abs(sol.centsOff) <= this.controlToleranceCents;

        if (inTune) {
          if (this._laneCandidate === sol.lane) this._laneCandidateFrames++;
          else {
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
          this.detected = { lane: null, name: null, centsOff: null };
        }
      } else {
        this._laneCandidate = null;
        this._laneCandidateFrames = 0;
        this.smoothedGameplayFreq = null;
        if (!this.keyboardOnly) {
          this.detected = { lane: null, name: null, centsOff: null };
        }
      }

      if (this.detected.name) {
        this.ui.hudYou.textContent = this.detected.name;
        const c = this.detected.centsOff ?? 0;
        if (Math.abs(c) < 18) this.ui.hudTune.textContent = ' (in tune)';
        else this.ui.hudTune.textContent = c > 0 ? ' (sharp)' : ' (flat)';
      } else {
        this.ui.hudYou.textContent = '--';
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

      // Spawn next from sequence
      if (this.spawnTimer !== Infinity) {
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
          if (!this._ensureSpawnSpacing(baseSpeed)) return;
          if (this.levelSpawnIndex < this.levelSeq.length) {
            const lane = this.levelSeq[this.levelSpawnIndex];
            this.levelSpawnIndex++;
            this.spawnObstacleForLane(lane);
          }

          if (this.levelSpawnIndex < this.levelSeq.length) {
            const ramp = clamp(this.clearedCount / 30, 0, 1);
            const tMin = lerp(CONFIG.spawnTimeMin, Math.max(0.9, CONFIG.spawnTimeMin - 0.35), ramp);
            const tMax = lerp(CONFIG.spawnTimeMax, Math.max(1.2, CONFIG.spawnTimeMax - 0.45), ramp);
            this.spawnTimer = rand(tMin, tMax) * this.getSpawnTimeScale();
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
      this.player.y = smoothTo(this.player.y, this.laneYs[this.player.targetLane], 14, dt);

      // Collision / passing against the next unpassed obstacle
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
            if (this.player.targetLane < next.lane) this.bounceHintText = `Need ${need} (higher)`;
            else if (this.player.targetLane > next.lane) this.bounceHintText = `Need ${need} (lower)`;
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
      const hasPitch = !!(pitch && pitch.clarity >= CONFIG.minClarity && pitch.rms >= CONFIG.minRms);
      if (!hasPitch) this.smoothedFreq = null;
      const freq = hasPitch ? this._smoothWizardFreq(pitch.freq) : null;
      const info = freq ? describeFreq(freq) : null;

      this.ui.liveFreq.textContent = info ? `${info.freq.toFixed(1)} Hz` : '--';
      this.ui.liveNote.textContent = info ? `${info.label} (${info.cents >= 0 ? '+' : ''}${info.cents.toFixed(0)}c)` : '--';
      this.ui.liveClarity.textContent = pitch ? pitch.clarity.toFixed(2) : '--';
      this.ui.liveVolume.textContent = pitch ? pitch.rms.toFixed(3) : '--';

      let needleCents = info ? info.cents : 0;

      if (this.wizStep === 1 && freq) {
        this.voiceEstimate = this.voiceEstimate
          ? lerp(this.voiceEstimate, freq, 0.08)
          : freq;
      }

      let sol = null;
      if (freq && this.doFreqHz) {
        if (!this.scaleFreqs) this.scaleFreqs = buildScaleFromDo(this.doFreqHz);
        if (!this.scaleBounds) this.scaleBounds = buildBounds(this.scaleFreqs);
        sol = analyzeSolfege(freq, this.scaleFreqs, this.scaleBounds);
      }

      this.ui.liveSolfege.textContent = sol ? sol.name : '--';

      if (sol) this.player.targetLane = sol.lane;
      this.player.y = smoothTo(this.player.y, this.laneYs[this.player.targetLane], 14, dt);

      if (this.wizStep === 3) {
        this.ui.wizModeRow.classList.add('hidden');
        this.ui.wizTarget.classList.remove('hidden');

        if (this.wizMode === 'fixedC') {
          if (freq && info) {
            const cInfo = centsToNoteClass(freq, 0);
            needleCents = cInfo.cents;

            const ok = Math.abs(cInfo.cents) <= CONFIG.captureToleranceCents;
            this.ui.holdStatus.textContent = ok ? 'Good - hold steady...' : 'Aim for C...';
            this.ui.targetHint.textContent = ok ? 'Nice. Keep it steady to capture.' : 'If you are far, try the reference tone.';
            const done = this._updateHold(dt, ok, freq);

            if (done) {
              this.doFreqHz = cInfo.targetFreq;
              this.scaleFreqs = buildScaleFromDo(this.doFreqHz);
              this.scaleBounds = buildBounds(this.scaleFreqs);

              this._setWizardError('');
              this.wizScaleIndex = 1;
              this.wizChecks = Array(7).fill(false);
              this._updateChecklistUI();
              this._setWizardStep(4);
            }
          } else {
            this.ui.holdStatus.textContent = 'Sing a steady C...';
          }
        } else {
          if (freq && info) {
            this.wizStability.push(freq);
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

            this.ui.holdStatus.textContent = stableOk ? 'Steady - hold...' : 'Hold a steadier pitch...';
            this.ui.targetHint.textContent =
              stableOk ? 'Great. Keep it steady to capture DO.' :
              'Try a steady vowel and avoid sliding up or down.';

            const done = this._updateHold(dt, stableOk, freq);
            if (done) {
              this.doFreqHz = median(this.wizHoldSamples) ?? freq;
              this.scaleFreqs = buildScaleFromDo(this.doFreqHz);
              this.scaleBounds = buildBounds(this.scaleFreqs);

              this._setWizardError('');
              this.wizScaleIndex = 1;
              this.wizChecks = Array(7).fill(false);
              this._updateChecklistUI();
              this._setWizardStep(4);
            }
          } else {
            this.wizStability = [];
            this.ui.holdStatus.textContent = 'Sing a steady note...';
          }
        }
      }

      if (this.wizStep === 4) {
        this.ui.wizTarget.classList.remove('hidden');

        if (!this.doFreqHz) {
          this._setWizardError('Missing DO. Go Back and capture DO first.');
          return;
        }

        const lane = this.wizScaleIndex;
        const target = this.scaleFreqs[lane];
        const tolerance = CONFIG.captureToleranceCents + (lane === 6 ? 20 : 0);

        if (freq) {
          const cents = centsBetween(freq, target);
          const centsLow = centsBetween(freq, target / 2);
          const centsHigh = centsBetween(freq, target * 2);

          const candidates = [
            { cents, adjust: 1, label: '' },
            { cents: centsLow, adjust: 2, label: 'lower octave' },
            { cents: centsHigh, adjust: 0.5, label: 'higher octave' },
          ];
          candidates.sort((a, b) => Math.abs(a.cents) - Math.abs(b.cents));
          const best = candidates[0];
          needleCents = best.cents;

          let hint = '';
          if (Math.abs(best.cents) <= tolerance && best.adjust !== 1) {
            hint = `Good - using ${best.label} (auto-adjusted)...`;
          } else if (Math.abs(best.cents) <= tolerance) {
            hint = 'Good - hold steady...';
          } else if (Math.abs(centsLow) <= tolerance) {
            hint = 'Sounds about 1 octave low. Try singing higher.';
          } else if (Math.abs(centsHigh) <= tolerance) {
            hint = 'Sounds about 1 octave high. Try singing lower.';
          } else {
            hint = 'Aim for the target...';
          }

          this.ui.holdStatus.textContent = hint;

          const ok = Math.abs(best.cents) <= tolerance;
          const adjustedFreq = freq * best.adjust;
          const done = this._updateHold(dt, ok, adjustedFreq);

          if (done) {
            const captured = median(this.wizHoldSamples) ?? adjustedFreq;
            this.scaleFreqs[lane] = captured;
            this.scaleBounds = buildBounds(this.scaleFreqs);

            this._resetHold();
            this.wizScaleIndex++;

            if (this.wizScaleIndex > 6) {
              this._setWizardStep(5);
            } else {
              this._renderWizardUI();
            }
          }
        } else {
          this.ui.holdStatus.textContent = 'Sing and hold...';
        }
      }

      if (this.wizStep === 5) {
        this.ui.wizChecklist.classList.remove('hidden');

        if (sol) {
          this.wizChecks[sol.lane] = true;
          this._updateChecklistUI();
          needleCents = sol.centsOff;
          this.ui.holdStatus.textContent = 'Try hitting the others...';
        }
      }

      const r = CONFIG.tunerNeedleRangeCents;
      const cClamped = clamp(needleCents, -r, r);
      const pct = ((cClamped + r) / (2 * r)) * 100;
      this.ui.gaugeNeedle.style.left = `${pct}%`;
      this.ui.liveCents.textContent = info ? `${needleCents >= 0 ? '+' : ''}${needleCents.toFixed(0)}c` : '--';
    }

    /********************
     * RENDER
     ********************/
    render() {
      const ctx = this.ctx;

      ctx.clearRect(0, 0, this.w, this.h);
      const gradient = ctx.createLinearGradient(0, 0, 0, this.h);
      gradient.addColorStop(0, COLORS.paperTop);
      gradient.addColorStop(1, COLORS.paperBottom);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, this.w, this.h);

      // Subtle paper texture
      ctx.globalAlpha = 0.06;
      ctx.fillStyle = COLORS.ink;
      for (let i = 0; i < 180; i++) {
        const x = (i * 97) % this.w;
        const y = (i * 53) % this.h;
        ctx.fillRect(x, y, 1, 1);
      }
      ctx.globalAlpha = 1;

      // Staff lines
      ctx.strokeStyle = COLORS.inkSoft;
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
      ctx.strokeStyle = COLORS.inkFaint;
      ctx.lineWidth = 2;
      for (let x = -off; x < this.w + measureSpacing; x += measureSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, this.staffTop - this.staffSpacing * 0.6);
        ctx.lineTo(x, this.staffBottom + this.staffSpacing * 0.6);
        ctx.stroke();
      }

      // Highlight upcoming lane
      let highlightLane = null;
      if (this.state === 'play') highlightLane = this.getUpcomingLane();
      if (this.state === 'wizard' && this.wizStep === 4) highlightLane = this.wizScaleIndex;

      if (highlightLane !== null) {
        const y = this.laneYs[highlightLane];
        ctx.globalAlpha = 0.12;
        ctx.fillStyle = COLORS.ink;
        ctx.fillRect(0, y - this.laneStep * 0.55, this.w, this.laneStep * 1.1);
        ctx.globalAlpha = 1;
      }

      // Obstacles only during play
      if (this.state === 'play') {
        for (const obs of this.obstacles) {
          this._drawObstacle(obs);
        }
      }

      // Player note
      this._drawNote(this.player.x, this.player.y);

      // Bounce hint
      if (this.state === 'play' && this.bounceHintTimer > 0 && this.bounceHintText) {
        ctx.globalAlpha = clamp(this.bounceHintTimer / 0.75, 0, 1);
        ctx.fillStyle = COLORS.ink;
        ctx.font = FONTS.heading;
        ctx.textAlign = 'center';
        ctx.fillText(this.bounceHintText, this.w / 2, this.staffTop - 18);
        ctx.globalAlpha = 1;
      }

      // Footer
      ctx.fillStyle = COLORS.inkSoft;
      ctx.font = FONTS.hint;
      ctx.textAlign = 'left';
      ctx.fillText('Sing solfege to move - Up/Down keys also work', 12, this.h - 14);
    }

    _drawObstacle(obs) {
      const ctx = this.ctx;

      const bandTop = this.staffTop - this.staffSpacing * 2.0;
      const bandBottom = this.staffBottom + this.staffSpacing * 2.0;

      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(obs.x, bandTop, obs.w, obs.gapTop - bandTop);
      ctx.fillRect(obs.x, obs.gapBottom, obs.w, bandBottom - obs.gapBottom);

      let labelY = bandTop - 12;
      if (labelY < 22) labelY = bandTop + 20;
      const labelAbove = labelY < bandTop;
      ctx.fillStyle = labelAbove ? COLORS.ink : COLORS.label;
      ctx.font = FONTS.obstacleLabel;
      ctx.textAlign = 'center';
      ctx.fillText(obs.label, obs.x + obs.w / 2, labelY);

      ctx.fillStyle = COLORS.label;
      const cx = obs.x + obs.w / 2;
      const cy = this.laneYs[obs.lane];
      ctx.beginPath();
      ctx.ellipse(cx, cy, 6, 4, -0.35, 0, Math.PI * 2);
      ctx.fill();
    }

    _drawNote(x, y) {
      const ctx = this.ctx;
      const s = CONFIG.noteSize;

      ctx.fillStyle = COLORS.ink;
      ctx.beginPath();
      ctx.ellipse(x, y, s * 0.85, s * 0.6, -0.35, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = COLORS.ink;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + s * 0.65, y - s * 0.15);
      ctx.lineTo(x + s * 0.65, y - s * 2.2);
      ctx.stroke();

      // Flag (gentle flap)
      const t = this.animT;

      const stemTopX = x + s * 0.65;
      const stemTopY = y - s * 2.2;

      const theta =
        Math.sin(t * 8.0) * 0.08 +
        Math.sin(t * 16.0 + 1.2) * 0.02;

      ctx.save();
      ctx.translate(stemTopX, stemTopY);
      ctx.rotate(theta);
      ctx.translate(-stemTopX, -stemTopY);

      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(stemTopX, stemTopY);
      ctx.quadraticCurveTo(x + s * 1.45, y - s * 2.0, x + s * 1.05, y - s * 1.45);
      ctx.quadraticCurveTo(x + s * 0.82, y - s * 1.10, x + s * 1.35, y - s * 0.95);
      ctx.stroke();

      ctx.restore();
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
