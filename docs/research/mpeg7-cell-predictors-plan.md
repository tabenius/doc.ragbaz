# MPEG-7 cell predictors — implementation plan

For recomputing every predictor used in **Abenius, *Classification of Cell Images
Using MPEG-7-influenced Descriptors and Support Vector Machines in Cell Morphology*,
arXiv:0812.2309** — efficiently, in Rust, on a laptop CPU first and an ESP32-class SoC
second.

## 0. First, the framing correction

The paper's predictors are **colour and texture** descriptors. Not shape.

| | |
| --- | --- |
| arXiv | **0812.2309** (stat.AP, cs.CV, stat.ML), submitted 2008-12-12 |
| Author | Tobias Abenius (`tobbe@tobbe.nu`) |
| Work type | Degree thesis (examensarbete), not a journal paper |
| Data | Blood cells, CellaVision DM-96 crops, labels from the DM-96 |
| Headline | 10.8% error (primary), 3.1% error (5 WBC types) |

"Morphology" in the title is the *domain* — discerning cell types from appearance.
The *descriptors* are: **Scalable Color (SCD), Color Structure (CSD), Color Layout
(CLD), Homogeneous Texture (HTD, Gabor-based)**, and **Visual Texture Features**
(Amadasun & King 1989), fed to an SVM.

So the shape descriptors — the ones whose names actually contain the word *shape* — are
absent. That is the most important structural fact about the recomputation, and it cuts
two ways:

* Recomputing "all predictors used in the paper" is a **bounded, well-specified** job:
  five descriptor families plus an SVM. Achievable.
* The obvious next result is that the **shape** family is missing, and it is the one
  most obviously aligned with "morphology". Adding it is an extension with a clear
  hypothesis behind it, not a reimplementation.

Plan below is ordered accordingly: Phase 1 is exact reproduction, Phase 5 is the shape
extension.

### 0.1 A measurement ceiling to state before optimising anything

Ground truth is CellaVision output, which the paper itself rates **90–95% correct**.

> A classifier agreeing perfectly with the labels cannot beat ~5–10% error, because the
> labels are wrong that often.

The reported 10.8% primary error therefore sits **at or near the label-noise floor**, and
the 10.8% vs 9.6% (libSVM) gap is not resolvable. Any optimisation effort must be aimed
at *throughput* first, and at accuracy only where accuracy is still improvable — which
is the *simplified* 5-class problem at 3.1%, not the primary one. This is the same
reliability-ceiling structure that appears elsewhere in this project: measure the
instrument before optimising against it.

## 1. Predictor inventory

### 1.1 What the paper states, verified from its text

| # | Descriptor | Specification given in the paper | Confidence |
| --- | --- | --- | --- |
| 1 | **Scalable Color (SCD)** | HSV uniformly quantised to **256 bins (16 H × 4 S × 4 V)**; each bin an 11-bit integer, mapped to a non-linear 4-bit representation, then **Haar-transformed** to shrink the descriptor | verified from text |
| 2 | **Color Structure (CSD)** | Described as an MPEG-7 colour descriptor; **bin counts not confirmed** | partial |
| 3 | **Color Layout (CLD)** | **8×8 blocks**, **2×2 interpolation sub-sampling** (block mean, not pixel), **DCT-II**, **zigzag scan**; keeps **first 6 Y, 3 U, 3 V** coefficients | verified from text |
| 4 | **Homogeneous Texture (HTD)** | **Gabor wavelet bank**; chosen over PWT, TWT and MR-SAR. **Scales, orientations, and the α/γ/θ parameters are not confirmed** | partial |
| 5 | **Visual Texture Features (VTF)** | From Amadasun & King 1989; approximate human texture perception | verified as present; parameters unconfirmed |
| 6 | **Classifier** | SVM; **polynomial kernel** best in the paper's own implementation; libSVM gave 9.6% vs 10.8% | verified |

### 1.2 What must be recovered from the full PDF before coding

These are **not** confirmed and must be read out of the thesis, not guessed:

- SCD: the "extended in size" factor, and the exact non-linear bin mapping.
- CSD: level count and structure-element size (stock MPEG-7 CSD uses 8 levels on
  Y/Cr/Cb over a 3×3 neighbourhood — **confirm before assuming**).
- HTD: number of scales and orientations, filter length, `α`, `γ`, and which statistics
  (mean and variance) are accumulated. Also the Gabor normalisation convention, which
  changes values.
- VTF: the number of co-occurrence offsets and the "negligibility" threshold.
- Image preprocessing: colour space of input, whether illumination is normalised, crop size.
- The exact feature vector assembly and scaling fed to the SVM.

**Phase 0 exists solely to fill this table from the PDF.** Coding against a guess here
produces a descriptor that is MPEG-7-*flavoured* and not the paper's, and the error is
invisible: the SVM still trains, the error rate still looks plausible, and the whole
exercise becomes a different experiment.

### 1.3 MPEG-7 part reference

The standard is MPEG-7 Part 2, **ISO/IEC 15978-4** (Visual). Confirm the edition and
clause numbers against a copy before citing them in code comments. Also relevant:
Manjunath, Ohm, Vasudevan & Yamada, *Color and Texture Descriptors*, IEEE TCSVT 11(6),
2001 — the canonical descriptor paper, cited by the thesis.

### 1.4 The shape family (Phase 5, as an extension)

Not in the paper. Listed because "morphology" invites it and the phase is cheap once
the pipeline exists. Curve and region descriptors from Part 2:

| Descriptor | What it measures | Rotation invariant? | Cost class |
| --- | --- | --- | --- |
| Centroid distance spectrum (`spec`) | Fourier of centroid-distance function | yes | O(n log n) with FFT, else O(n·k) |
| Radial histogram (`hist`) | 1st/2nd-order radial histograms | yes | O(n), histogram |
| Elliptic Fourier (`dft`) | elliptical-harmonic coefficients | no (magnitude is) | O(n·K) |
| Curvature (`curv`) | smoothed turning function | yes | O(n·w) |
| Shape matrix / multi-region (`mrsh`) | 2nd–4th order central moments | no | O(n), streaming |
| Region descriptor | extent, eccentricity, major/minor axes, Euler number, solidity, compactness, holes, convexity defects | partly | O(n) + O(n log n) hull |

**Invariant descriptors are the cheap test**: if a descriptor is documented as rotation
invariant and a rotation of the input changes it, the implementation is wrong. That is a
property test, not a golden vector, and it catches a whole class of bug that golden
vectors alone will not.

## 2. Software architecture

```
mpeg7-cells/
  core/          no_std-compatible, allocation-light, scalar reference
    src/quantize.rs      SCD/CSD level assignment
    src/hist.rs          deterministic per-thread histograms
    src/dct.rs           DCT-II (separable, 8-point fast path)
    src/haar.rs          2D Haar for SCD
    src/gabor.rs         separable Gabor bank
    src/vtf.rs           Amadasun & King
    src/shape.rs         Phase 5
  image/         image container, crop + colour conversion
  simd/          runtime-dispatched kernels; scalar fallbacks behind the same trait
  batch/         the CPU path: thread pool, per-thread state, ordered merge
  esp32/         Phase 4: no_std target, single thread, LittleFS, WiFi upload
  reference/     golden vectors + the tolerance harness
```

Design rules, each of which is there because its absence has caused a real defect
elsewhere in this project:

- **One trait per descriptor, three implementations: scalar, SIMD, ESP32.** The scalar
  one is the specification; SIMD and embedded are checked against it. A trait with two
  implementations and no third is a trait with one implementation and a fast path.
- **Reference implementations are written and frozen before any optimisation.** Optimise
  second, against a correctness oracle. The reverse order produces a fast wrong answer
  and a test suite that agrees with it.
- **Determinism is a hard requirement.** Histograms are accumulated per thread into
  private bins and merged **in fixed thread order**, never with atomics. This is bit-exact
  across runs and thread counts, which is what makes the golden-vector harness and the
  ESP32 comparison meaningful.
- **`no_std` at the core boundary.** `core` compiles with `#![no_std]` and takes
  `&[u8]` slices, so Phase 4 is a target change rather than a rewrite.

## 3. Per-descriptor algorithm and cost

Let `W×H` be the input, `N = W·H`.

### SCD — Scalable Color
1. RGB → HSV, per pixel. Branchless: HSV from float or from a 5:5:5/6:5:5 lookup.
2. Quantise: `h_q = h·16`, `s_q = s·4`, `v_q = v·4` → 256 bins.
3. Histogram, 256 bins, three separable arrays.
4. Haar-transform the 16×4×4 lattice, keep the most significant coefficients.

Cost `O(N)`. **Vectorises well**: the conversion and the quantisation are pure
element-wise, the histogram is the only irregular step. Optimisation: a 16×4×4 index
computes as `(h_q<<5)|(s_q<<2)|v_q` — three shifts, no multiply, which is what makes
this fast rather than the histogram being.

### CSD — Color Structure
Per 3×3 neighbourhood, compare centre to the 8 neighbours, threshold each colour
channel into levels, accumulate.

Cost `O(9N)` = `O(N)`, **memory-bound**, and the most GPU-friendly descriptor in the set
because it is a pure stencil with no reduction dependency. SIMD: process 8 or 16 pixels
per register; the neighbourhood comparisons are 9 shifted-and-masked loads, which on
AVX2 is a handful of instructions per vector.

### CLD — Color Layout
1. Block-average 8×8 blocks with 2×2 interpolation.
2. DCT-II on each of Y, U, V, keeping 8×8.
3. Zigzag, take 6 + 3 + 3.

Cost `O(64·64) = O(4096)` for a standard 64-block CLD — **this is a few thousand
operations, not a workload.** Do not optimise it. On a cell crop of 64×64 the whole CLD
costs less than a single Gabor filter pass. Optimisation effort here is wasted, and
should be redirected to Gabor, which is the actual cost centre.

### HTD — Homogeneous Texture (Gabor)
For each `(scale, orientation)` pair, filter, then accumulate mean and variance.

Cost `O(K·N·kx·ky)` where `K = n_scales · n_orientations`.

**The single largest optimisation available: Gabor is separable.**
`g(x,y) = g_x(x; α,γ,θ) · g_y(y; α,γ,θ)`, so a 2D convolution of cost `kx·ky` becomes
two passes of cost `kx + ky`. For `kx = ky = 11` that is **121 → 22, a 5.5× reduction**,
and it changes the memory traffic pattern to something a CPU cache handles well.
This is the plan's main CPU-side win and it is exact, not approximate.

Further: compute the filter bank on the **spatial** side for the small image sizes here
rather than via FFT. An FFT-based Gabor only pays when the image is much larger than
the kernel; at 64×64 with an 11-tap kernel, direct separable convolution is both faster
and simpler. Revisit if crops grow to 1024².

### VTF — Amadasun & King
Mean and variance from first and second moments, third-moment measures from
co-occurrence sums, then a negligibility threshold and 3-bit quantisation.

Cost `O(N·k)` for `k` co-occurrence offsets. Mostly a reduction: one pass with a small
fixed number of accumulators, so it is **fused into the same pass** as the channel
statistics to halve memory traffic.

### Total per image, at 64×64
Roughly: SCD `4·10³` ops, CSD `4·10⁴`, CLD `4·10³`, HTD `K·64·64·22` (≈ 10⁵ for K=8),
VTF `10⁴`. **Gabor is 70–80% of the work.** Effort allocation should follow that number,
not the number of descriptors.

## 4. Verification

Three independent layers, because golden vectors alone miss an entire class of bug.

1. **Golden vectors.** A reference implementation (port the thesis's C++, or a careful
   Python port) emits exact descriptor vectors for ~20 fixed inputs. The Rust
   implementation must match within a stated per-descriptor tolerance. The tolerance is
   per descriptor, not global: the CLD is a DCT and should agree to ~1e-6; the SCD
   histogram is integer-valued and should agree **exactly**.
2. **Invariance properties.** Rotate a disc: a rotation-invariant descriptor must be
   unchanged. Rescale after normalisation: must be unchanged. Permute nothing. Each
   property is asserted against the *documented* behaviour, and a failure means either
   the implementation or the reading of the standard is wrong.
3. **Cross-implementation agreement.** The laptop build, the ESP32 build and the
   reference must agree within tolerance on identical input. This is the only check that
   the embedded port is doing the same thing as the desktop one, and it is the reason
   `core` is `no_std` with one shared implementation rather than two reimplementations.

Add a fuzz target that feeds random and adversarial crops (single-pixel, all-foreground,
checkerboard, NaN-free but extreme dynamic range) and asserts the pipeline never
panics and never emits NaN. A NaN in a feature vector propagates silently into an SVM
and produces a model that trains and does not work.

## 5. Laptop path — Intel Core Ultra 7 155H

Verified on this host: **x86_64, 16 cores / 22 threads, AVX2 + FMA + AVX-VNNI, L1d 544 KiB,
L2 18 MiB, L3 24 MiB.**

### Threading
- The unit of parallelism is **the image**, not the pixel. A cell crop is small; splitting
  one across threads costs more in synchronisation than it returns. Use one image per
  task, work-stealing over 16 workers.
- Per-worker histogram bins, merged in **worker-id order** after the batch. Deterministic.
- Rayon is the obvious choice and one line to add. If it is unwanted, `std::thread` with a
  work queue is ~60 lines.

### SIMD
- **Start portable.** `core::simd` (`std::simd`, portable SIMD) for the element-wise work:
  HSV conversion, quantisation, the CSD stencil, the DCT pass, and the Gabor 1-D passes.
  One implementation, portable to the ESP32's Xtensa SIMD in Phase 4.
- **Then x86 intrinsics** behind `#[target_feature(enable = "avx2,fma")]`, runtime-detected
  via `is_x86_feature_detected!`, with a scalar fallback. Only where measurement shows a
  win.
- **AVX-VNNI is the surprise worth exploiting.** It does fused 8/16-bit integer dot
  products. The CSD's neighbourhood comparisons and the co-occurrence sums are
  dot-product-shaped, and VNNI is not used by any compiler autovectorisation path. This is
  the most likely place to beat a naive AVX2 build by a wide margin — and it is worth a
  targeted microbenchmark before any larger optimisation.
- **Do not use `-C target-cpu=native` for the shipped binary.** Produce a baseline binary
  plus one AVX2 binary, dispatched at runtime. A machine that is not this one should still
  run it.

### Expected result
Order-of-magnitude target, to be replaced by measurement: **sub-millisecond per 64×64
crop on one core**, and therefore **not compute-bound at any realistic dataset size.**
The bottleneck for a real blood-cell dataset is image decode and I/O, not descriptors.
State that expectation now, because it determines whether Phase 3 is worth anything.

## 6. GPU — postponed, and the honest case against it

**Deferred. Recorded here so the deferral is a decision with a reason and a trigger,
not an omission.**

### What would not help
- **CLD.** A few thousand operations per image. A GPU kernel launch costs more than the
  entire descriptor.
- **Small histograms.** The SCD's 256 bins and the CSD's structure counts are tiny
  reductions. On a GPU they become atomics contention or shared-memory privatised
  histograms — both of which are slower than a private per-thread histogram on a CPU, and
  both of which reintroduce the non-determinism the design deliberately removed.
- **Shape descriptors.** The convex hull is `O(n log n)` and inherently sequential.
  Contour curvature is a running integral with sequential dependence. **GPU-hostile by
  structure**, not merely unimplemented.
- **SVM inference.** A few microseconds of arithmetic. Pointless to offload.

### What would help
- **Gabor (HTD), on large images.** A 2D separable convolution over many thousands of
  tiles is exactly the shape GPUs are good at. The 5.5× from separability is orthogonal
  and applies to both.
- **CSD (stencil), on large images.** Pure stencil, no reduction dependency, near-perfect
  occupancy.
- **A large pre-filter**, if one is ever introduced: chromaticity in Lab, illumination
  normalisation. Pixel-wise, embarrassingly parallel, ideal.

### The threshold that should trigger the reconsideration
> GPU work is justified when a single image is **≥ 1024×1024** *and* the batch is
> **≥ 10⁴ tiles**.

Below that, per-image work is microseconds and the cost is dominated by launch overhead
and data movement. At 64×64 crops with a 10⁵-image dataset, a 16-core CPU finishes the
whole set in roughly a second — and a GPU would be slower.

### How, when it is justified
1. Port only `gabor` and `csd` to `wgpu` or CUDA. Leave everything else on the CPU.
2. Use the **same** `Descriptor` traits with a CUDA backend, so the scalar reference
   remains the oracle and the cross-implementation test (§4.3) covers the GPU.
3. Tile-aware: one tile per workgroup, rows of the separable pass in shared memory.
4. Precompute the filter bank on the GPU once — it is identical for every tile.
5. **Expect the transfer to dominate.** On a whole-slide pyramid, the data movement will
   exceed the compute by a wide margin, which means a GPU pipeline needs a tile cache or
   it will lose. This is the most likely reason a future GPU version underperforms, and it
   should be the first thing measured.

## 7. ESP32-class SoC

### Target: ESP32-S3
Chosen over the original ESP32 for two reasons, both decisive:

* **Single-precision FPU in hardware.** The original ESP32 has no FPU; every float
  multiply is software. A Gabor bank is float-heavy, so this alone is worth roughly an
  order of magnitude.
* **Xtensa SIMD** for the pixel-wise paths, which is what `core::simd` targets.

S2 and C3 both lack an FPU. If the target must be the original ESP32, the Gabor
implementation needs `f32`→fixed-point or Q-format paths, which is a separate and
substantive piece of work — flag it rather than discovering it in Phase 4.

*(Family specifications above are from knowledge; confirm against the datasheet for the
specific part before sizing the memory budget.)*

### Memory budget — this is the binding constraint

SRAM is ~512 KB, shared by everything including the WiFi stack.

| Item | Bytes |
| --- | --- |
| One 64×64 `u8` crop | 4 096 |
| One 64×64 `f32` plane | 16 384 |
| One 64×64 `f32` Gabor accumulator (2 planes) | 32 768 |
| Per-filter 11-tap kernel (`f32`) | 44 × 2 |
| 256-bin SCD histogram × 3 channels | 3 072 |
| Descriptor vector (all families, `f32`) | ~2 000 |
| **Working set, one tile at a time** | **≈ 60 KB** |

Rules that follow:

- **One tile at a time, never a whole image.** A 256×256 `f32` plane is 256 KB and does
  not fit alongside a WiFi stack. Tiling to 64×64 is not an optimisation here, it is a
  precondition.
- **No allocation in the hot path.** Fixed-size arrays only. A heap allocation in a
  WiFi-adjacent embedded path is a fragmentation bug waiting for a long uptime.
- **Streaming histogram accumulation** per tile, merged into the global bins once.
- **`f32` throughout, no `f64`.** A double costs twice the memory for no accuracy a
  descriptor needs — and see the numerical-verification work in this project for why
  "the answer is right" and "the arithmetic is right" are different questions.

### Single thread, as specified
One core, no RTOS task on the compute path. The WiFi stack runs on the other core if the
part has two. Rationale: at 64×64 the whole descriptor set is a few hundred thousand
MACs — milliseconds, not seconds. Threading would add synchronisation and a scheduler
for no measurable gain. **Revisit only if image size grows by an order of magnitude.**

### Storage
Flash is ~4–8 MB with roughly 10⁵ erase cycles. Two consequences:

* **Never rewrite a database in place.** Use an **append-only record log** plus periodic
  compaction, not SQLite. SQLite's page-granular writes and WAL are the wrong shape for
  flash wear, and its memory floor is well above what is available. The design here is a
  flat fixed-size record per cell — path, timestamp, and the descriptor vector —
  written sequentially, with a small header holding the next free offset. Compaction
  rewrites the log only when it exceeds a threshold, and the threshold is what protects
  the erase budget.
* **LittleFS** on SPI flash for the log. It handles wear levelling; do not put a
  wear-levelling problem on top of a filesystem that already solves it.
* Format is **self-describing**: a magic number, a schema version, and the record
  length. A reader that guesses is a reader that breaks on the first firmware change.

### Transport
Results go over **WiFi to the laptop**, not to the cloud. Two reasons: the data is
clinical, and the laptop is the thing that trains the model anyway.

- `POST` batches of descriptor vectors to a local endpoint, gzip-compressed.
- **RAGBAZ-reader's daemon is a natural ingest target** — it already runs a loopback HTTP
  API with SQLite, and an `/v1/ingest` route taking a batch of vectors is a small
  addition to an existing service rather than a new one.
- **Retry with backoff, and buffer in flash.** The laptop is not always up. A dropped
  batch is not lost, it is deferred. Store-and-forward is the correct pattern for a
  device that is intermittently connected to something that is the source of truth.
- Ship the **raw crop hash** with the vector so the dataset can be audited later against
  the images, rather than trusting that a vector and its cell stayed together.

### What the ESP32 is *not* for
**No training, no SVM fitting, no feature selection, no hyperparameter search.** Those
stay on the laptop. The division of labour is: *the device describes, the laptop
concludes.* A 240 MHz microcontroller attempting SVM training would be a project in
itself with no bearing on the paper.

## 8. Schedule

| Phase | Work | Exit criterion | Est. |
| --- | --- | --- | --- |
| **0** | Recover the parameter table from the thesis PDF; obtain the image set; write the reference port | §1.2 table fully filled, no guesses; reference emits vectors for 20 inputs | 2–3 d |
| **1** | `core` scalar, exact, `no_std`; all five descriptor families; golden-vector harness | passes golden vectors at per-descriptor tolerance; property tests pass | 1 wk |
| **2** | CSD + Gabor + SCD SIMD (portable, then AVX2); 16-thread batch; ordered histogram merge | bit-identical to scalar on every input; measured speedup recorded per descriptor | 1–2 wk |
| **3** | *(deferred)* GPU | — | — |
| **4** | ESP32-S3 port: tile loop, no-alloc, append-only flash log, WiFi upload to the daemon | runs on hardware; agrees with the laptop build within tolerance; survives a 24 h soak | 2–3 wk |
| **5** | MPEG-7 **shape** family: centroid-distance spectrum, radial histogram, EFD, curvature, moments, region descriptor | rotation-invariance tests pass; accuracy on the 5-class problem compared against Phase 1 | 2 wk |
| **6** | Classifier: reproduce the paper's SVM, then re-evaluate on the shape-augmented set | report against the label-noise floor, not against 10.8% | 1 wk |

### Sequencing notes
- **Phase 0 gates everything.** Starting Phase 1 against guessed parameters produces a
  different experiment that looks right.
- **Phase 2 must not begin before Phase 1's harness is green**, and the harness must be
  *bit-identity* against scalar, not "close enough". A speedup measured against a
  reference that has already drifted measures the drift.
- **Phase 3 has an explicit trigger** (§6), not a date.
- **Phase 4 is the longest lead item** and the one most likely to be underestimated:
  embedded toolchain, hardware, and the fixed-point question if the target is the
  original ESP32.
- **Phase 5 is the only one that might change the paper's conclusions**, because it
  supplies descriptors the paper did not use. Treat its result as a new finding rather
  than as reproduction.

## 9. Honest register

| Claim | Status |
| --- | --- |
| arXiv:0812.2309 is the paper | **verified** — five independent sources agree on title, author, date, abstract |
| Descriptors are SCD, CSD, CLD, HTD, VTF | **verified** from the paper's body text |
| SCD is 16×4×4, 11-bit → Haar | **verified** from the paper's body text |
| CLD is 8×8, 2×2 interp, DCT-II, zigzag, 6+3+3 | **verified** from the paper's body text |
| 10.8% / 3.1% error, polynomial kernel, libSVM 9.6% | **verified** from the abstract and body |
| Ground truth 90–95% correct | **verified** — the paper says so |
| CSD and HTD exact parameters | **not confirmed** |
| "extended in size" factors, VTF parameters, preprocessing | **not confirmed** |
| ISO/IEC 15978-4 clause numbers | **not verified** — confirm before citing |
| MPEG-7 shape-descriptor names and behaviours | from working knowledge of Part 2; verify each |
| ESP32 family specs (SRAM, flash, FPU, SIMD) | from knowledge; **verify against the datasheet** |
| This host: Ultra 7 155H, 16C/22T, AVX2+FMA+VNNI, L3 24 MiB | **verified** on this machine |
| Per-image cost estimates | **estimates**, to be replaced by measurement |
| "Gabor is 70–80% of the work" | **estimate** from the cost model, not measured |
| "CPU finishes a 10⁵-crop dataset in about a second" | **estimate**; this is the claim Phase 2 must test first |

## Where to look

- `arxiv.org/abs/0812.2309` — the paper, and the only authority on §1.2
- Manjunath, Ohm, Vasudevan & Yamada, *Color and Texture Descriptors*, IEEE TCSVT 11(6),
  2001 — the descriptor definitions behind MPEG-7
- Camargo, Díaz & Romero, *Pap smear cell image classification using global MPEG-7
  descriptors* — CLD + SCD + Edge Histogram on cells, with an explicit note that nucleus
  segmentation is hard to achieve; useful prior art and a warning about the
  segmentation-free route
- Amadasun & King, *Textural features corresponding to perceptual properties of texture*,
  1989 — the VTF source
