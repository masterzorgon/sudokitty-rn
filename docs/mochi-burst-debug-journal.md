# Mochi burst effect: issues, crash analysis, and attempted solutions

This document records the **Sudokitty React Native** “mochi burst” feature: what we built, how it crashed, what we tried, and where things stand. It is meant for future debugging, onboarding, or revisiting visuals (e.g. sprites) without repeating the same dead ends.

---

## 1. Feature goal

After a successful **mochi IAP**, show a short **particle burst** that:

- Originates near the **bottom** of the screen (purchase context).
- Moves toward the **header mochi counter** (measured layout).
- Respects **reduced motion** (skip or simplify).
- Integrates with existing **haptics/audio** (`playFeedback("unitComplete")` on completion).

**Architecture (intended):**

| Piece                                  | Role                                                                                 |
| -------------------------------------- | ------------------------------------------------------------------------------------ |
| `src/stores/fxStore.ts`                | `triggerMochiBurst`, `burstId`, `burstAmount`, `targetLayout` from `measureInWindow` |
| `HeaderPill.tsx` (mochi variant)       | Reports pill position/size to `fxStore`                                              |
| `app/_layout.tsx`                      | Mounts `MochiBurstOverlay` above content                                             |
| `store.tsx` / `MochiPurchaseSheet.tsx` | Call `triggerMochiBurst` after successful purchase                                   |
| `MochiBurstOverlay.tsx`                | Full-screen overlay, particle simulation + rendering                                 |

Asset added for a sprite-based look: `assets/images/icons/mochi-point-sprite.png` (51×44).

---

## 2. Observed problem

### 2.1 Symptom

The app **crashes** when the burst runs—often **immediately** after logs indicated the burst had **started** (e.g. “Burst started”), not only after a long run.

### 2.2 Crash character (native / Hermes)

Reports showed patterns such as:

- **`EXC_CRASH (SIGABRT)`** on the **main thread**.
- **`HermesRuntimeImpl::throwPendingError()`** (JS exception surfaced natively).
- Stacks involving **Reanimated**’s frame pipeline, e.g.:
  - **`AnimationFrameBatchinator::flush()`** / **`-[AnimationFrameQueue executeQueue:]`**
  - **`worklets::scheduleOnUI`**
  - **`RNSkia::PictureCmd`** / **`convertPropertyImpl<sk_sp<SkPicture>>`** (Skia `Picture` / image paths)

So the failure was tied to **per-frame UI work** coordinated by Reanimated (and in some attempts, Skia), not a simple React render exception in JS alone.

---

## 3. Root-cause hypotheses (technical)

These are the main theories that matched both **code structure** and **native stacks**:

1. **Reanimated frame batching**  
   `useFrameCallback` (and similar APIs that hook the UI thread display link) register work with Reanimated’s **`AnimationFrameBatchinator`**. Any bug, overload, or incompatible combination in that path can abort with the stacks we saw—even if “physics” logic looks correct in JS.

2. **Skia + Reanimated interop**  
   Using **`Picture`**, **`useDerivedValue`**, **`useImage` / textures**, or **`Atlas`** in ways that cross the UI/worklet boundary has produced crashes in **`PictureCmd`** / **`SkPicture`** conversion. That points to **prop updates** or **image lifetime** on the UI thread, not just “draw circles.”

3. **High-frequency `runOnJS`**  
   Driving **`setState` from a worklet every frame** (`runOnJS` ~60 Hz) can stress bridges and timing; combined with (1), it may contribute to instability even when rendering is “just” `View`s.

4. **Many animated nodes**  
   Dozens of **`useAnimatedStyle`** / **`Animated.View`** instances updating each frame also route through Reanimated’s scheduling; stacks still referenced **`AnimationFrameBatchinator`** when this was tried.

**Important lesson:** Replacing **Skia** with **plain `View`** dots did **not** reliably stop crashes while **`useFrameCallback`** (or heavy Reanimated-per-frame work) remained. The common thread was **Reanimated’s animation frame pipeline**, not only Skia.

---

## 4. Attempted solutions (chronological)

### 4.1 Skia + images + `PictureRecorder` / derived values

- **Idea:** Render particles with `@shopify/react-native-skia`, images, or recorded pictures; animate with Reanimated shared values / derived values.
- **Outcome:** Crashes involving **`SkImage`**, **`worklets::scheduleOnUI`**, or **`PictureCmd`** / **`convertPropertyImpl<sk_sp<SkPicture>>`**.
- **Takeaway:** This path is sensitive to **how** images and picture props are updated from worklets each frame.

### 4.2 Declarative Skia `<Atlas>`

- **Idea:** Single atlas, many instances with transforms/colors from derived values.
- **Outcome:** Launch or burst-time issues (reported as problematic for this use case).
- **Takeaway:** Atlas can be correct for some effects; here it didn’t stabilize the build quickly enough.

### 4.3 Skia `<Picture>` with circles only (“confetti style”)

- **Idea:** Remove images; draw simple geometry to avoid image lifetime issues.
- **Outcome:** Still hit **`PictureCmd`** / **`SkPicture`** conversion crashes.
- **Takeaway:** The problem wasn’t only “PNG bad, circles good”—**`Picture`** in this update pattern was still unsafe.

### 4.4 Skia `<Circle>` × N with many `useDerivedValue`s

- **Idea:** No `Picture`; many circles.
- **Outcome:** **`AnimationFrameBatchinator`**-related crashes.
- **Takeaway:** Volume of derived/UI-thread updates still went through Reanimated’s frame machinery.

### 4.5 `Animated.View` + `useAnimatedStyle` per particle

- **Idea:** Pure RN views, Reanimated for position/opacity.
- **Outcome:** Similar **batchinator** involvement when many nodes update every frame.
- **Takeaway:** Still **Reanimated-scheduled** per-frame work.

### 4.6 `useFrameCallback` + worklet physics + `runOnJS` + plain `View` render

- **Idea:** Physics on UI thread via `useFrameCallback`; push a snapshot to React state with `runOnJS` each frame; render **non-Skia** dots.
- **Outcome:** User reported **“same issue”** (crash pattern persisted).
- **Takeaway:** **Eliminating Skia from rendering was insufficient** while **`useFrameCallback`** remained—the crash aligned with **Reanimated’s frame callback / batching**, not Skia alone.

### 4.7 Current direction: `requestAnimationFrame` + plain JS physics (no worklets)

- **Idea:** Remove **`useFrameCallback`**, **`runOnJS`** from the physics loop, and **`"worklet"`** physics from the burst path entirely.
- **Implementation sketch:**
  - Store particle state in **`useRef`**.
  - Advance simulation in a **`requestAnimationFrame`** loop on the **JS thread**.
  - Call **`setState`** with a **shallow snapshot** of particles each frame (acceptable cost for ~12–40 particles for ~1.2s).
  - Keep **Zustand** subscription to update **target** position for “seek toward header” behavior.
- **Expected benefit:** No registration with **`AnimationFrameBatchinator`** for this effect; avoids the crash stacks that consistently mentioned that path.

**File:** `src/components/fx/MochiBurstOverlay.tsx` (as of the refactor that removes Reanimated from the burst loop).

---

## 5. Instrumentation (debug sessions)

During investigation, **HTTP ingest** logs (debug session id **`337cb5`**) were added to trace:

- Burst **start** (amount, particle count, viewport, whether target layout exists).
- Burst **finish** (elapsed time, reason: particles done vs timeout).
- **Reduced motion** skip.
- Marker for **“RAF + plain JS”** path vs earlier Reanimated paths.

These should be **removed** after crashes are **gone in practice** and the team agrees—do not treat them as permanent product telemetry.

---

## 6. Related files (quick reference)

| File                                          | Notes                                                 |
| --------------------------------------------- | ----------------------------------------------------- |
| `src/components/fx/MochiBurstOverlay.tsx`     | Burst overlay, simulation, rendering                  |
| `src/stores/fxStore.ts`                       | Burst trigger + target layout                         |
| `src/components/home/HeaderPill.tsx`          | `measureInWindow` → store                             |
| `app/_layout.tsx`                             | Overlay mount point                                   |
| `app/(tabs)/store.tsx`                        | Trigger on purchase success                           |
| `src/components/store/MochiPurchaseSheet.tsx` | Trigger on sheet purchase success                     |
| `assets/images/icons/mochi-point-sprite.png`  | Sprite asset (not required for stable dots-only path) |

---

## 7. Follow-ups (non-blocking)

1. **Visuals:** Restore **mochi sprite** using an approach that does **not** reintroduce per-frame Reanimated UI work or fragile Skia picture/image patterns—e.g. static `Image` in a `View` positioned by **JS-driven** `left`/`top`/`opacity` from the RAF loop (same state as dots), or a single Skia layer only if proven stable on device.
2. **Performance:** If `setState` every frame on low-end devices is hot, throttle snapshots (e.g. 30 FPS) or batch particles into fewer parent views—still without `useFrameCallback` unless Reanimated usage is proven safe in isolation.
3. **Cleanup:** Remove debug `fetch` instrumentation after sign-off.

---

## 8. Summary

The mochi burst crashed in native stacks pointing at **Hermes**, **Reanimated’s animation frame batching**, and (in Skia attempts) **`Picture` / image** conversion. Multiple rendering backends were tried; the recurring factor was **per-frame work scheduled through Reanimated** (`useFrameCallback`, many derived animated views, or Skia + Reanimated). The mitigating direction is to run **burst physics and React updates from a plain JS `requestAnimationFrame` loop** without worklets for that effect, then optionally refine visuals once stability is confirmed.
