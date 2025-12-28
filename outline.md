## 1) The game in one sentence

A side‑scrolling “helicopter” game where the player is a **music note** flying through **moving sheet music**, and the only control is **your voice**: you sing **solfège (Do–Re–Mi–Fa–Sol–La–Ti)** to move the note up/down on the staff and slip through gaps; if you miss, you **bounce back** and keep trying until you hit the right pitch.

---

## 2) Player experience and flow

### A. Landing / Start

* Screen shows:

  * Title + short instructions
  * Big **“Start / Enable Microphone”** button (required for browser audio permissions)
  * **Privacy note:** “Mic is used only locally; nothing is uploaded.”
  * Optional toggles:

    * “Movable Do (recommended)” vs “Fixed Do = C” (explained below)
    * “Keyboard fallback controls” (for people without mic / permission denied)

### B. Microphone setup

* On Start click:

  * Request mic permission (`getUserMedia`)
  * If allowed:

    * Show a **calibration step** (very short, 2–3 seconds)
  * If denied/unavailable:

    * Offer **keyboard mode** (still playable)

### C. Calibration (so people don’t need perfect pitch)

Two modes you can support; the default can be **Movable Do**:

1. **Movable Do (recommended default)**

* Prompt: “Sing a comfortable **Do** (any pitch). Hold it steady.”
* The game captures the stable pitch frequency and stores it as `doFrequency`.
* Then the other solfège targets are defined relative to that Do:

  * Re = Do + 2 semitones, Mi = +4, Fa = +5, Sol = +7, La = +9, Ti = +11
* This makes the game playable for anyone, regardless of key.

2. **Fixed Do (optional)**

* Define Do as a fixed pitch class (e.g., C) and accept any octave.
* This is harder for most people unless they have reference pitch.

### D. Gameplay loop (core)

* The note avatar sits around ~25% from the left of the screen.
* The “sheet music world” scrolls from right → left (so it feels like you’re moving forward).
* You encounter **barriers** that leave a **single safe gap** aligned to a staff position.
* Each barrier clearly shows the required solfège (e.g., “MI”) and highlights the matching staff lane.
* You sing the matching solfège pitch to move into that lane and pass through.
* If you’re in the wrong lane (or off‑pitch), you **collide** and:

  * **Bounce back** (small rewind / elastic knockback)
  * No “death”
  * You can attempt again immediately until you pass

---

## 3) Visual design (music‑themed “helicopter”)

### A. Background: scrolling sheet music

* Draw (or use an SVG texture) for:

  * 5 staff lines
  * Occasional measure bar lines
  * Subtle paper texture (optional)
* Scroll this background continuously to create motion.

### B. Player avatar: a music note

* A simple eighth note / quarter note icon:

  * Slight bobbing animation
  * Tiny “tail flutter” or wobble on movement (optional)
* Position corresponds to a **lane** on the staff (or between lines).

### C. Obstacles: “barriers” that feel musical

Keep them simple and readable:

* Obstacles are vertical blocks styled like:

  * Thick bar lines + black blocks
  * Or “rest symbols” / ink blobs
* Each obstacle has **one gap lane** (safe passage).
* On the obstacle, render:

  * The solfège label (“DO”, “RE”, etc.)
  * A small notehead icon at the target lane

### D. Feedback overlays (minimal but helpful)

* Top-left:

  * Current recognized solfège (or “—” if none)
  * A small “in tune” indicator (✅ / ~ / ❌)
* Near the obstacle:

  * “Sing: SOL” (when approaching)
* On collision:

  * “Try again” + optionally “Sharp / Flat” hint

---

## 4) Core mechanic: how singing maps to movement

### A. Lanes tied to solfège (simple + robust)

Instead of continuous analog flight, use discrete “lanes”:

* 7 lanes: Do, Re, Mi, Fa, Sol, La, Ti
* Visually map lanes to staff positions (bottom → top):

  * Lane 1 (lowest): Do
  * …
  * Lane 7 (highest): Ti

**Why lanes are ideal here:**

* Pitch detection is imperfect; lanes let you be forgiving.
* Makes “hit the note” gameplay clear.
* Keeps implementation simpler than continuous pitch-to-y mapping.

### B. Movement behavior

* When a solfège note is detected confidently:

  * Set the player’s **target lane** to that solfège
  * Animate y-position toward that lane with smoothing (so it glides)
* When no voice / unreliable pitch:

  * Either:

    * Hold current lane, or
    * Slowly drift toward a neutral middle lane (optional)

### C. “Not dying” requirement: bounce logic

When collision occurs:

* Do **not** end the run
* Apply a bounce effect:

  * Quick reverse of world scroll for a short time (e.g., 200–350ms)
  * Slight screen shake
  * Optional: brief invulnerability so it doesn’t “stick” jittering on the barrier
* The barrier stays in place; once you sing correctly and align to the gap, you pass.

---

## 5) Obstacle design that forces solfège use (but stays forgiving)

### A. Obstacle structure (MVP)

Each obstacle object contains:

* `x` position
* `gapLane` (1–7)
* `label` (DO/RE/MI/FA/SOL/LA/TI)
* `width`
* `passed` boolean

Rendering:

* Draw a vertical barrier spanning the playfield except for the gap lane region.

### B. Spawning logic

* Spawn obstacles at intervals based on scroll speed.
* Choose `gapLane` using rules to keep it fair:

  * Don’t jump more than 2–3 lanes from the previous obstacle early on
  * Increase allowed jumps as difficulty rises

### C. Difficulty ramp (still “very simple”)

Difficulty can increase via:

* Faster scroll speed over time
* Narrower gaps (slightly)
* More frequent obstacles

Because the player can’t die, difficulty feels like “how quickly can you clear” rather than survival.

### D. Scoring (optional but motivating)

Non-punishing scoring ideas:

* Time to clear each obstacle (faster = more points)
* Streak bonus for clearing without a bounce
* Total obstacles cleared

---

## 6) Audio + pitch detection pipeline (implementation outline)

### A. Browser APIs you’ll use

* `navigator.mediaDevices.getUserMedia({ audio: true })`
* Web Audio API:

  * `AudioContext`
  * `MediaStreamAudioSourceNode`
  * `AnalyserNode` (for time-domain samples)
* You’ll run pitch detection on a short rolling buffer.

### B. Basic steps

1. On Start click:

   * Create `AudioContext`
   * Request microphone stream
   * Connect stream → analyser
2. Each game tick (or ~30–60 times per second):

   * Pull a time-domain sample buffer from the analyser
   * Compute:

     * RMS volume (to ignore silence/noise)
     * Pitch estimate (frequency in Hz)
     * Confidence/clarity (so you don’t react to junk)
3. Convert frequency → nearest solfège lane (using calibration data)
4. Smooth decisions:

   * Require the detected lane to remain stable for N frames (e.g., 3–6) before committing
   * This prevents rapid jitter when someone has vibrato

### C. Pitch detection approach (choose one)

You have two good options:

1. **Use a small, client-side pitch detection library**

* Pros: faster to ship, more reliable, fewer edge cases
* Cons: adds a dependency (but still fine for GitHub Pages)

2. **Implement a lightweight algorithm**

* Common choices:

  * Autocorrelation method (simple)
  * YIN (more accurate, a bit more work)
* For an MVP, autocorrelation is often “good enough” for singing if you add smoothing + volume gating.

### D. Turning pitch into solfège (Movable Do version)

* After calibration sets `doFrequency`:
* Compute semitone distance:

  * `semitones = 12 * log2(freq / doFrequency)`
* Map to nearest of {0,2,4,5,7,9,11} (Do…Ti), octave-agnostic.
* Accept if within tolerance:

  * Example tolerance: ±50 cents (half a semitone) to start forgiving
* If outside tolerance:

  * Treat as “no valid solfège” (don’t move lanes)
  * Optionally show “sharp/flat” hint relative to the target lane when near an obstacle

### E. Handling real-world messiness

* Add a minimum volume threshold so background noise doesn’t move the character.
* Treat unvoiced consonants and breath as “no pitch.”
* Provide a simple “Mic level” meter so users know they’re being heard.

---

## 7) Game loop and physics (simple, predictable)

### A. Timing

* Use `requestAnimationFrame` for rendering and game updates.
* Use delta time (`dt`) to keep motion consistent across machines.

### B. World scrolling model

Simplest approach:

* Player stays at a fixed x position.
* Obstacles and background move left at `scrollSpeed`.

### C. Collision detection

* Use simple rectangle collision:

  * Player has a small bounding box around the note icon
  * Each obstacle has two rectangles (top block + bottom block) with a gap in between based on lane
* On collision:

  * Trigger bounce behavior

### D. Bounce behavior (no-death)

When collision happens:

* Play a short knockback state:

  * Temporarily reverse scroll speed or reduce it sharply and move the obstacle/player apart
  * Lock input for a tiny moment if needed to prevent repeated collision detection on the same frame
* Then resume forward scroll.

---

## 8) UI/UX details that make it feel good quickly

### A. Clear prompt of “what to sing”

* As an obstacle approaches (e.g., within 2–3 seconds of travel time):

  * Show “Next: MI” and highlight the Mi lane on the staff
* This makes it feel like a rhythm/pitch challenge rather than guesswork.

### B. Real-time pitch helper (tiny)

* Show:

  * The detected solfège label
  * “In tune / sharp / flat”
* Keep it minimal so it doesn’t clutter.

### C. Pause / resume

* If the tab loses focus, auto-pause.
* Provide a pause button.

### D. Accessibility

* Keyboard fallback:

  * Up/down arrow cycles lanes
  * Or number keys 1–7 map to Do–Ti
* Optional “reduced motion” setting for sensitive users.

---

## 9) Suggested file/folder structure for GitHub Pages

Keep it “static-site simple” (no build step required):

* `/game/`

  * `index.html` (the game page you’ll embed/link to)
  * `style.css`
  * `/js/`

    * `main.js` (bootstraps everything)
    * `game.js` (state, loop, collisions, scoring)
    * `render.js` (canvas drawing: staff, note, obstacles)
    * `audio.js` (mic setup, analyser, pitch polling)
    * `pitch.js` (pitch detection + solfège mapping)
    * `levels.js` (obstacle generation / difficulty)
    * `ui.js` (menus, calibration UI, overlays)
  * `/assets/`

    * note SVG(s)
    * optional background texture(s)

Integration options:

* Link to it from your main site: “Play the Singing Note Game”
* Or embed via an `<iframe>` pointing at `/game/`

---

## 10) Key edge cases to plan for up front

### A. Mic permission / insecure context

* `getUserMedia` requires HTTPS (GitHub Pages is HTTPS) or localhost.
* If someone opens the file directly (`file://`), it won’t work—show a helpful message.

### B. Mobile constraints

* iOS Safari requires user gesture to start AudioContext (your Start button covers this).
* Some devices aggressively noise-suppress; keep volume threshold forgiving.

### C. Pitch detection reliability

* Vibrato can cause rapid pitch swings:

  * Use smoothing / “stable for N frames” logic
* Background music near the mic:

  * Encourage headphones in the instructions

### D. People singing in different octaves

* Treat octave as irrelevant (match pitch class / scale degree), so low and high Do both work.

---

## 11) MVP checklist (what to build first, in order)

1. **Canvas scene**: staff lines + scrolling background
2. **Player note**: lane-based y movement (temporary keyboard control)
3. **Obstacle**: single-gap barrier + collision detection
4. **Bounce instead of death**: knockback state + retry loop
5. **Mic capture**: permission flow + RMS meter
6. **Pitch detection**: frequency estimate + confidence
7. **Movable Do calibration**: set Do reference + solfège mapping
8. **Tie singing → lane selection**
9. **Obstacle prompts**: show which solfège to sing next
10. **Polish**: subtle animations, sound effects (optional), scoring

