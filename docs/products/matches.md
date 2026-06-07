---
title: MATCHES
sidebar_position: 1
description: Autonomous cinematic battle simulation engine — the flagship RAGBAZ product.
---

# MATCHES

Path: `matches/`

**MATCHES** (v0.2.0) is an autonomous cinematic battle simulation engine. It combines procedural animation, tactical AI, emotional modeling, and cinematic direction in a single deterministic simulation loop. The runtime works identically in the browser (Three.js viewport), headless Node.js (deterministic testing), and via a Blender export pipeline (offline cinematic rendering).

A Tauri desktop shell wraps the web app for native distribution.

## Architecture

```
User Input (DSL / AI decisions)
  |
  v
Runtime Orchestrator (fixed-tick, per-actor)
  |
  ├── Combat State Machine
  ├── Locomotion State Machine
  ├── Fatigue / Emotional Memory / Crowd
  ├── Solve Pipeline (18 ordered stages)
  │     ├── Sample mixer (keyframe crossfade)
  │     ├── Foot IK / Terrain adaptation
  │     ├── Balance solving (center-of-mass)
  │     ├── Stance / Fatigue / Breathing overlays
  │     ├── Stagger / Recovery overlays
  │     ├── Expression blending
  │     ├── Momentum / Follow-through
  │     └── World-pose evaluation
  ├── Vertical physics (gravity)
  ├── Hero moment / Director updates
  └── Health monitoring (NaN/infinity drift)
       |
       v
[Three.js Viewport]  or  [Headless Snapshot]  or  [Blender Export Bundle]
```

## Engine Architecture (131 files in `src/editor/`)

### Runtime Core

The simulation runs on a fixed-tick clock. Each tick, `orchestrateRuntime()` iterates all actors:

1. **Combat state machine** — per-actor AI fighting transitions
2. **Locomotion state machine** — stride phase, grounded weight
3. **Fatigue system** — accumulation and decay per actor
4. **Emotional memory** — persistent per-actor emotional state tracking
5. **Crowd reactions** — battlefield attention and audience response
6. **Solve pipeline** — 18 ordered stages produce the final world-space pose
7. **Vertical physics** — gravity and impulse handling
8. **Actor kinematics** — derived velocities and accelerations
9. **Hero moment detection** — cinematic director decisions
10. **Runtime health monitoring** — NaN/infinity drift detection

### Solve Pipeline (18 Stages)

The animation pipeline transforms raw keyframe data into final world-space poses:

| Stage | Module | Purpose |
|---|---|---|
| 1 | `sampleMixer()` | Crossfade between animation clips |
| 2 | `lockFeetDuringContacts()` | World-space foot locking |
| 3 | `updateStanceStyle()` | Combat stance variation |
| 4 | `adaptActorToGround()` | Terrain slope compensation |
| 5 | `solveLegs()` | Leg IK solver |
| 6 | `updateBalance()` + apply | Center-of-mass balancing |
| 7 | `applyStanceStyleToPose()` | Stance overlay |
| 8 | `applyFatigueToPose()` | Fatigue slumping |
| 9 | `applyBreathingToPose()` | Breathing motion |
| 10 | `applyStaggerChainToPose()` | Stagger animation |
| 11 | `applyRecoveryBalance()` | Recovery balance |
| 12 | `blendExpressionIntoPose()` | Expression face/body |
| 13 | `makeBowPose()` / recovery ceremony | Cinematic ceremonies |
| 14 | `applyMomentumToPose()` | Momentum/recoil offset |
| 15 | `applyFollowThroughToPose()` | Follow-through dynamics |
| 16 | `makeLocalPose()` | Convert to local space |
| 17 | `evaluateWorldPose()` | Parent-space accumulation |
| 18 | `applyRootTransform()` | Commit root position/rotation |

### Key Architectural Principles

- **Deterministic solve pipeline** — all animation is produced through a registry of ordered solve stages, ensuring reproducible output across runs
- **Centralized event bus** — `runtime-event-bus.ts` routes all combat/emotional events, enabling reaction routing, emotional memory updates, and crowd reactions
- **Shared types** — actor types, poses, and scene state are shared between the simulation engine, Three.js viewport, and Blender export pipeline
- **Headless-first** — the runtime can be driven purely through Node.js without DOM or Three.js, proven by 37 automated tests
- **Seeded RNG** — all random number generation is seeded for determinism (`seeded-rng.ts`, `rng.ts`)
- **Runtime guards** — sanitize all positions/rotations and detect NaN/infinity drift (`runtime-guards.ts`, `runtime-sanitizer.ts`, `runtime-health-monitor.ts`)

## Dual Mode: Editor and Battle

The app operates in two modes sharing the identical runtime core:

### Editor Mode
- Manual DSL keyframe composition
- Timeline, DslEditor, Transport UI panels
- Per-keyframe easing and interpolation
- Pose library and storage

### Battle Mode (Autonomous)
- AI-driven fighter behaviors
- Tactical zone management (`battlefield-zones.ts`)
- Team AI, formations, and morale (`team-ai.ts`, `team-formations.ts`, `team-morale.ts`)
- Emotional storytelling (`emotional-story.ts`, `emotional-memory.ts`)
- Cinematic director with camera composition scoring (`camera-composition.ts`, `camera-confidence.ts`, `camera-director.ts`)

## Blender Export Pipeline

MATCHES exports simulated battles as Blender-ready JSON bundles for offline cinematic rendering.

### Export Flow

```
Simulation → ExternalRenderCapture (per-frame)
  → buildBlenderExportBundle()
    ├── bakeActorStage()    — per-actor bone tracks, root frames,
    │                          expression frames, contact frames
    ├── bakeCameraStage()   — per-camera position/target/FOV tracks
    └── bakeTimelineStage() — semantic cues + timeline markers
  → validateBlenderSceneExport() — structural bound enforcement
  → JSON artifact
```

### Blender Import (`tools/blender/import_matches_scene.py`)

Requires Blender 3.6+, no add-ons. Creates:
- `MATCHES_Actors` collection with armature objects (`MATCHES_<actorId>`)
- `MATCHES_Cameras` collection with keyframed camera objects
- Scene render FPS and frame_end from export metadata
- Y-up (MATCHES) to Z-up (Blender) coordinate transform
- Custom properties: `matches_id`, `matches_appearance`, `expression_label`, `vad_valence/arousal/dominance`, velocity, cloth hints
- Named timeline markers with `matches_marker_metadata` JSON

### Validation Contract

Strict structural bounds on every export:
- Max 32 actors, 8 cameras, 500 cues, 500 markers
- Max 100 bone tracks per actor, 10,000 frames per track
- All quaternions must be finite 4-element vectors
- Float ranges: intensity [0,1], FPS (0,240], duration [0,600]

### Export Sources

Three ways to get an export file:
1. **Browser** — click "export json" in battle viewport
2. **Sample** — `static/samples/matches-pilot-proof-export.v2.json` (canonical)
3. **Headless Node** — import `buildBlenderExportBundle` and write JSON

## Tests

37 deterministic regression tests in `tests/`, run via `node --loader ./tools/ts-loader.mjs`. No Jest, Mocha, or other test framework — zero-dependency sequential harness (`tests/run-all.mjs`).

| Category | Tests |
|---|---|
| Determinism | determinism-combat-rng, determinism-pose-sway, determinism-skills, replay-determinism, export-determinism, no-math-random-runtime, no-performance-now-simulation |
| Solve pipeline | solve-stage-order, runtime-solved-export, runtime-integrity |
| Combat | combat-contact-geometry, combat-intent-window, combat-behavior-group-a, combat-grappling-surprise, combat-phrases, combat-expression-hud, strike-semantics, ai-fighter |
| Blender | blender-export-contract, blender-appearance-roundtrip, image-export |
| Cinematic | cinematic-camera-layers, cinematic-montage, runtime-composition-silence |
| Spatial | spatial-grounding, temporal-smoothing, battlefield-zones |
| Headless | runtime-headless, headless-longrun |
| Schema/DSL | schema-compatibility, dsl-react-trigger, easing-per-kf, tactical-sequences, sound-cues |
| Infrastructure | simulation-worker, local-data-clear |

## Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Language | TypeScript (modules) | ES2020 / ESNext |
| UI Framework | React | ^18.3.1 |
| 3D Rendering | Three.js | ^0.174.0 |
| Build | Vite | ^8.0.12 |
| Desktop Shell | Tauri | ^2.0.0 |
| Docs | Docusaurus | ^3.5.2 |
| Code Quality | Prettier | ^3.8.3 |
| GIF Export | gifenc | ^1.0.3 |
| PNG Export | upng-js | ^2.1.0 |

## Directory Structure

```
matches/
├── src/
│   ├── App.tsx, main.tsx          — React entry
│   ├── DslEditor.tsx              — DSL editing panel
│   ├── Timeline.tsx               — Playhead/keyframe timeline
│   ├── Transport.tsx              — Playback transport controls
│   ├── editor/                    — Core engine (131 files)
│   │   ├── runtime-orchestrator.ts — Main per-tick orchestration
│   │   ├── solve-pipeline.ts       — Master solve pipeline
│   │   ├── runtime-event-bus.ts    — Centralized event routing
│   │   ├── autonomous-battle.ts    — Top-level battle orchestrator
│   │   ├── cinematic-director-runtime.ts
│   │   ├── dsl-compiler.ts         — DSL → Clip compiler
│   │   └── ... (combat, AI, IK, camera, expressions, etc.)
│   ├── export/                    — Blender export pipeline
│   │   ├── blender-bake-pipeline.ts
│   │   ├── blender-scene-export.ts
│   │   └── ... (bake stages, contracts, IK export)
│   ├── viewport/                  — Three.js rendering
│   │   ├── SceneViewport.tsx       — Battle mode viewport
│   │   ├── actor-renderer.ts       — Three.js actor meshes
│   │   ├── skeleton.ts             — Stick-figure skeleton
│   │   └── postprocess.ts          — Ember particles, effects
│   ├── headless/                  — Server-side runtime
│   │   └── runtime-headless.ts
│   ├── math/                      — Quaternion math
│   └── perf/                      — Performance governance
├── src-tauri/                     — Tauri desktop shell
├── tests/                         — 37 regression tests
├── tools/blender/                 — Blender Python import scripts
├── static/samples/                — Canonical export samples
└── docs/                          — Docusaurus docs (embedded)
```

## Current Status

**Version:** v0.2.0. Active development. The core engine, Blender export pipeline, and test suite are comprehensive. The Tauri desktop shell is minimal. The showcase reel and cinematic clips exist in `output/`.
