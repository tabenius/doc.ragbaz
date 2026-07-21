---
title: Face Expression Mesh Morphing
sidebar_label: Face mesh morphing
description: Public handoff for face.ragbaz.cc, the RAGBAZ Vision face-expression mesh morphing viewer.
---

# Face Expression Mesh Morphing

**Canonical app: [face.ragbaz.cc](https://face.ragbaz.cc/)**

Face is an interactive RAGBAZ Vision surface for exploring expression morphs
across a 10 by 10 matrix of face tiles. It renders a full-bleed Three.js canvas,
loads MediaPipe-style landmark meshes, and interpolates between two selected
expressions while sampling each source texture at its own face-point UVs.

The useful review unit is not only the animation. It is the pipeline:

```text
expression tiles -> landmark meshes -> shared triangles -> dual UV shader -> morph controls
```

## What the viewer demonstrates

| Surface | What it proves |
|---|---|
| expression matrix | the operator can choose source and destination expressions |
| morph slider | intermediate geometry and texture states are inspectable |
| wireframe mode | triangle topology remains visible during the blend |
| random mode | the mesh can traverse arbitrary expression pairs |
| fullscreen / immersive | the artifact can be used as a presentation surface |
| responsive drawer | the same 100-expression matrix works on phone, tablet, and desktop |

## Runtime model

The source app lives in `/data/src/face.ragbaz.cc/viewer`. The deployable static
root is assembled by `/data/src/face.ragbaz.cc/build.sh`:

```text
viewer/dist/          -> build/
images/              -> build/images/
output/meshes.json   -> build/output/meshes.json
```

The data model is intentionally compact:

| File | Role |
|---|---|
| `images/redhead-cut_r*_c*.png` | expression tile textures |
| `output/meshes.json` | landmark positions and shared triangulation |
| `viewer/src/components/FaceMesh.jsx` | R3F mesh, shader, dual UV attributes |
| `viewer/src/components/GridPicker.jsx` | expression matrix picker |
| `viewer/src/components/Controls.jsx` | morph playback and visual debugging controls |

## Rendering technique

Each expression has landmark points in normalized image space. The renderer
builds a `BufferGeometry` from the source and destination landmarks, then
updates only the position buffer as morph amount `t` changes:

```text
point(t) = pointA + (pointB - pointA) * t
```

The shader keeps two UV attributes:

| Attribute | Samples |
|---|---|
| `uvA` | texture A at source landmark coordinates |
| `uvB` | texture B at destination landmark coordinates |

The fragment shader blends `textureA(uvA)` and `textureB(uvB)` by `t`. That is
why the texture follows the face points instead of sliding over a static plane.

## Status boundary

The current app is an interactive morphing and visualization surface. It is not
an identity system, recognition system, medical tool, or biometric verifier.
Treat the images and meshes as demonstration assets unless a later project
adds consent tracking, provenance, and privacy review.

## Related material

- [School article: Face Mesh Morphing Techniques](https://ragbaz.cc/school/vision/face-mesh-morphing-techniques)
- [RAGBAZ Design System](../products/ragbaz-design-system)
- [MATCHES](../products/matches), for another RAGBAZ motion and transform surface
