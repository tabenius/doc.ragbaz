---
title: "Numerical verification"
sidebar_label: "Numerical verification"
description: "Why a residual cannot certify a linear solve, and measuring the numerics against exact rational arithmetic instead."
---

# Numerical verification

Everything in the research code that produces a coefficient is measured against exact
rational arithmetic rather than against itself. This page records how to check that
claim yourself, and what the numbers came out as.

The reason is specific. Six separate defects in this arithmetic once produced finite,
plausible, wrong coefficients, and every one of them satisfied the check that was in
place at the time — a small residual. A residual cannot tell you an answer is right.
It only tells you the answer you already have is consistent with the system you
already used. An exact solution can tell you.

## Run it

```bash
npm run test:numerics         # 34 regression tests
npm run test:numerics:selftest # the lin.mjs self-test
npm run precision             # the precision study
npm run precision:verify      # re-run the study and compare to the baseline
```

No dependencies, no network, no build step. Node 18 or newer. Each command is
self-contained and exits non-zero on failure.

## What is being tested, and why each test exists

The tests in `scripts/exact.test.mjs` are named after the defect they guard, because
each of these was a real bug in this repository that produced a wrong number without
looking wrong:

| Test | Defect it prevents |
| --- | --- |
| `absFrac keeps the denominator` | `new Frac(-f.n)` discarded the denominator, turning `1/3` into `1`. This silently corrupted the pivot search, the error scale and the norm at once. |
| `condInfExact([[2,1],[1,2]]) === 3` | The row norm was computed as the largest entry in a row instead of the largest row *sum*, which reported 4/3 for a matrix whose condition number is exactly 3. |
| `condInfExact of the identity is exactly 1` | Same cause, caught on a matrix where the answer is known outright. |
| `condInfExact does not truncate through a decimal string` | The inverse was rendered to 12 significant digits before the norm was taken, so the condition number stopped growing with `n`. |
| `the lcm helper is not defeated by BigInt literal precedence` | `2n - 1n` is the BigInt literal `2n` minus `1n`, which is `1`, not twice `n` minus one. The loop ran once, the matrix collapsed to zeros. |
| `exactSolve handles a system needing pivoting` | Elimination without a pivot search produces garbage on a matrix whose first entry is zero. |
| `uniform bucketing stays non-negative for every draw` | `normalSource` returns standard-normal variates, not uniforms. A caller passed it to `Math.floor(g * k)` to pick a bucket and got negative exponents for half of all draws. |
| `uniformSource never returns 0, so logs stay finite` | A single zero from the generator becomes `-Infinity` under a logarithm, then `NaN` in every coefficient fitted from it. |
| `Neumaier survives a long sum that cancels catastrophically` | Plain float64 accumulation returns `0` for 100000 copies of `(1e16, 1, -1e16)`; the true sum is `100000`. |
| `ddAdd recovers terms a float64 sum discards` | Same failure, in the double-double implementation. |
| `convergenceOrder refuses to regress an exact zero` | An exact zero in the correction sequence produced `-Infinity` inside a logarithm and silently reduced the reported order to nothing. |
| `a wrong solution can have a tiny backward error` | The property the rest of this page exists to demonstrate. |

Each was confirmed to still catch its bug by reintroducing it and watching the suite
fail. A test that cannot fail is not a test.

## The precision study

`scripts/precision-study.mjs` solves systems whose exact solution is known, then
reports the forward error of three solvers against it:

- **A** — float64 Gaussian elimination with partial pivoting.
- **B** — A plus iterative refinement, with the residual formed by Neumaier
  compensated summation.
- **C** — A plus iterative refinement, with the residual formed in double-double
  arithmetic.

Conditioning is reported as an exact condition number in the infinity norm,
`||A||_inf * ||A^-1||_inf`, evaluated in rational arithmetic from the exact inverse.
An earlier version of this study printed pivot growth and called it a conditioning
indicator. Growth is not a condition number: Hilbert matrices have almost no pivot
growth and are among the worst-conditioned matrices in general use, while a matrix
with one dominant diagonal reported a ratio of exactly 1.

### Results

Measured on `v24.21.0`, `linux/x64`. Re-run `npm run precision` to see these for
yourself.

```
experiment            n        cond     err(A)     err(B)     err(C)   back(A)
hilbert n=4           4    2.84e+4   9.093e-14  2.787e-14          0  1.772e-16
hilbert n=6           6    2.91e+7   3.619e-11  9.808e-11          0  2.047e-17
hilbert n=8           8    3.39e+10   8.620e-9   8.012e-8          0  5.558e-16
hilbert n=10         10    3.54e+13   4.158e-5   3.805e-6          0  1.440e-16
hilbert n=12         12    4.12e+16   6.186e-2   8.189e-2  3.253e-10  9.549e-16
```

The exact condition numbers agree with the published values for Hilbert matrices
(`n=10` is about `1.6e13`; this measures `3.5e13`, the difference being the norm),
and reproduce `3` and `1` exactly on closed cases.

### The trap

Read the last row. The float64 solution is **6.2% wrong**. Its backward error is
`9.5e-16` — indistinguishable from a perfect solve.

This is the whole reason for measuring against exact arithmetic. On this system the
plain solver returns an answer that satisfies its equations to the last representable
bit and is wrong by six percent, because the system is so ill-conditioned that the
answer is a small multiple of the rounding noise. Every diagnostic that asks "does
this satisfy the equations?" would have passed it.

### Convergence

The refinement sweeps, on the `n=10` Hilbert system with `cond = 3.5e13`:

```
sweeps    err(A)     err(B)     err(C)
0         3.600e-5   3.600e-5   3.600e-5
1         3.600e-5   2.238e-4   2.676e-10
2         3.600e-5   6.574e-5   2.030e-15
3         3.600e-5   1.220e-4          0
4         3.600e-5   2.384e-5          0
6         3.600e-5   1.228e-5          0
```

**C** converges to the exact answer in three sweeps, through six orders of magnitude.
This is the intended behaviour: the residual is formed in a wider type than the
solution, so each correction carries more information than the error it removes.

## A negative result, reported

**B is not a reliable improvement.** Its geometric-mean forward error across the
study is `3.4e-8`, against `2.4e-10` for the plain float64 solve and `2.8e-10` for
C. On the `n=8` Hilbert system it is an order of magnitude *worse* than not refining
at all, and in the sweep table above it oscillates without converging.

The reason is structural, not a coding slip. Iterative refinement helps when the
residual is more accurate than the correction's own solve. Here both are float64, so
the correction carries error of the same size as the thing it is correcting, and
adding it can inject as much error as it removes. Widening the residual — as **C**
does — is what makes refinement pay.

This is recorded rather than quietly dropped, because "iterative refinement improves
accuracy" is the kind of claim that gets repeated without being tested.

## Reproducibility

Every matrix is generated from an explicit seed, so the run is deterministic. The
study prints a checksum over its entire result table:

```
run checksum: 406d8fdb4757a621
```

`npm run precision:verify` re-runs the study and compares against
`precision-baseline.json`, printing `MATCH` or exiting non-zero. The baseline records
the Node version and platform, because floating-point results are only bit-identical
for the same engine — a different V8 may legitimately produce a different last bit.

The same discipline applies to the generators: both are seeded and deterministic, and
`deterministic under a fixed seed` is under test.

## Scope

These measurements cover the linear algebra only: the solve, the residual, the
conditioning, the refinement. They say nothing about whether the statistical model
built on top of the solve is the right one. That is a separate question, and the
overfitting and oracle-property work is where it gets addressed.
