## Goal

Animate **only the flag** (top curved stroke), keeping its base attached to the stem, with a gentle periodic motion.

---

## Patch instructions

### 1) Add a small animation clock

In the `Game` constructor, add:

```js
this.animT = 0;
```

At the **very top** of `update(dt)` (before any early `return`), add:

```js
this.animT += dt;
```

This ensures the flap animates even during menus/tutorial screens if the note is visible.

---

### 2) Wrap the *flag drawing* in a tiny rotation

In `_drawNote(x, y)` (where you currently draw the flag with two `quadraticCurveTo`s), do this:

* Define `t` from the animation clock
* Compute a small angle `theta` using `sin()`
* `ctx.save()` / `translate` to the **stem top** / `rotate(theta)` / draw the same flag / `ctx.restore()`

**Replace only the flag block** with:

```js
// Flag (gentle flap)
const t = this.animT;

// Stem top (anchor point for the flap)
const stemTopX = x + s * 0.65;
const stemTopY = y - s * 2.2;

// Gentle, not distracting: ~1.3 Hz + tiny harmonic
const theta =
  Math.sin(t * 8.0) * 0.08 +     // main flap (~4.6°)
  Math.sin(t * 16.0 + 1.2) * 0.02; // subtle variation (~1.1°)

ctx.save();
ctx.translate(stemTopX, stemTopY);
ctx.rotate(theta);
ctx.translate(-stemTopX, -stemTopY);

// draw the flag exactly like before
ctx.lineWidth = 3;
ctx.beginPath();
ctx.moveTo(stemTopX, stemTopY);
ctx.quadraticCurveTo(x + s * 1.45, y - s * 2.0, x + s * 1.05, y - s * 1.45);
ctx.quadraticCurveTo(x + s * 0.82, y - s * 1.10, x + s * 1.35, y - s * 0.95);
ctx.stroke();

ctx.restore();
```

That’s it—this keeps the flag’s base fixed at the stem top and gives a natural flutter.

---

## Tuning knobs (if you want it even gentler)

Tell your agent:

* Reduce flap angle: change `0.08` → `0.06`
* Slow it down: change `t * 8.0` → `t * 6.5`
* Remove harmonic entirely by deleting the second `Math.sin(...) * 0.02` term
