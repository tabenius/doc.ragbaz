// Five colour encodings, treated as an experimental factor rather than a background
// assumption.
//
// All five are invertible maps of the same underlying colour. That is the whole
// reason this module can answer the question it exists for: a *linear* subspace in one
// space becomes a *curved* set in another, so "does the trait live in a linear
// subspace" is not invariant under re-encoding, and nothing else about the data is.
//
// Two invariants must hold exactly and are asserted in the test suite:
//
//   linear-light <-> BT.709 YCbCr is a LINEAR bijection, so any linear subspace,
//   any canonical correlation and any least-squares fit must be identical on both
//   sides of it. If those disagree, the implementation is wrong.
//
//   sRGB, Oklab and CIELAB are nonlinear, so the same quantities must NOT be
//   identical. The gap between these two facts is the linearization trap, measured.

/* ── sRGB (IEC 61966-2-1) ───────────────────────────────────────────────────
   The transfer function, not a colour space in the perceptual sense: it exists
   because CRTs emit light nonlinearly. Equal code steps are not equal perceptual
   steps, which is the entire reason the inverse exists. */

export const srgbToLinear = c =>
  c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

export const linearToSrgb = l =>
  l <= 0.0031308 ? l * 12.92 : 1.055 * Math.pow(l, 1 / 2.4) - 0.055;

/* ── BT.709 luma/chroma ───────────────────────────────────────────────────
   A transport decision, not a perceptual-uniformity one: Y is weighted toward
   luminance so that chroma can be subsampled (4:2:0 discards three quarters of it
   and the image survives, because we notice brightness more than hue). This is a
   linear map from linear-light, which is what makes it the control for the
   invariance check above. */

export const linearToYcbcr709 = ([r, g, b]) => {
  const Y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return [Y, (b - Y) / 1.8556, (r - Y) / 1.5748];
};

export const ycbcr709ToLinear = ([Y, Cb, Cr]) => {
  const b = Y + 1.8556 * Cb;
  const r = Y + 1.5748 * Cr;
  const g = (Y - 0.2126 * r - 0.0722 * b) / 0.7152;
  return [r, g, b];
};

/* ── Oklab (Ottosson 2020) ────────────────────────────────────────────────
   Perceptually uniform by construction: the cube root is placed where the eye's
   response is a power law, so a uniform step in L* is a uniform step in
   appearance. This is the control that should behave. */

export const linearToOklab = ([r, g, b]) => {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  ];
};

/* ── CIELAB (CIE 1976) ───────────────────────────────────────────────────
   The historical perceptual space, via XYZ under D65. Included as a second control
   with a different construction history than Oklab: if the two agree and sRGB
   disagrees, the disagreement is about the transfer curve, not about perceptual
   modelling in general. */

export const linearToXyz = ([r, g, b]) => [
  0.4124564 * r + 0.3575761 * g + 0.1804375 * b,
  0.2126729 * r + 0.7151522 * g + 0.0721750 * b,
  0.0193339 * r + 0.1191920 * g + 0.9503041 * b,
];

// D65, the white point sRGB is defined against.
const D65 = [0.95047, 1.0, 1.08883];

// f(t) with the linear toe near zero, per CIE 1976. The toe matters: without it,
// dark colours — where a trait difference would most plausibly live — are the ones
// the cube root mangles.
const labF = t => {
  const d = 6 / 29;
  return t > d * d * d ? Math.cbrt(t) : t / (3 * d * d) + 4 / 29;
};

export const xyzToLab = ([X, Y, Z]) => {
  const [fx, fy, fz] = [labF(X / D65[0]), labF(Y / D65[1]), labF(Z / D65[2])];
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
};

export const linearToLab = rgb => xyzToLab(linearToXyz(rgb));

import { solve, centre } from './lin.mjs';

/* ── the battery ─────────────────────────────────────────────────────────
   Canonical representations. The first entry is linear-light because it is the
   physical one: it is what a light meter measures, and what compositing and any
   radiometric argument are actually about. */

export const ENCODINGS = [
  { key: 'srgb', label: 'sRGB encoded', note: 'nonlinear transfer, display-referred', to: linearToSrgb, from: srgbToLinear },
  { key: 'linear', label: 'linear-light sRGB', note: 'physical radiance, compositing-correct', to: c => c, from: c => c },
  { key: 'ycbcr', label: 'BT.709 YCbCr', note: 'luma-weighted, subsampling-oriented', to: linearToYcbcr709, from: ycbcr709ToLinear },
  { key: 'oklab', label: 'Oklab', note: 'perceptually uniform by construction', to: linearToOklab, from: null },
  { key: 'lab', label: 'CIELAB', note: 'historical perceptual control', to: linearToLab, from: null },
];

export const encodingByKey = key => ENCODINGS.find(e => e.key === key);

/** Encode a linear-light colour into every space at once. */
export const encodeAll = rgb => ENCODINGS.map(e => ({ key: e.key, label: e.label, note: e.note, v: e.to(rgb) }));

/* ── small symmetric eigenproblem ─────────────────────────────────────────
   Jacobi rotation. Unconditionally stable, needs no normalisation strategy, and
   for a 3x3 costs nothing. An iterative power method on a near-degenerate
   covariance would give unstable subspaces, which is precisely the kind of quiet
   wrongness this project keeps having to undo. */

export function jacobiEigen(Ain, sweeps = 60) {
  const n = Ain.length;
  const A = Ain.map(r => r.slice());
  const V = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
  for (let s = 0; s < sweeps; s++) {
    let off = 0;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += A[i][j] * A[i][j];
    if (off < 1e-30) break;
    for (let p = 0; p < n; p++) {
      for (let q = p + 1; q < n; q++) {
        if (Math.abs(A[p][q]) < 1e-300) continue;
        const theta = (A[q][q] - A[p][p]) / (2 * A[p][q]);
        const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        const c = 1 / Math.sqrt(t * t + 1), sn = t * c;
        for (let k = 0; k < n; k++) {
          const akp = A[k][p], akq = A[k][q];
          A[k][p] = c * akp - sn * akq;
          A[k][q] = sn * akp + c * akq;
        }
        for (let k = 0; k < n; k++) {
          const apk = A[p][k], aqk = A[q][k];
          A[p][k] = c * apk - sn * aqk;
          A[q][k] = sn * apk + c * aqk;
        }
        for (let k = 0; k < n; k++) {
          const vkp = V[k][p], vkq = V[k][q];
          V[k][p] = c * vkp - sn * vkq;
          V[k][q] = sn * vkp + c * vkq;
        }
      }
    }
  }
  return { values: Array.from({ length: n }, (_, i) => A[i][i]), vectors: Array.from({ length: n }, (_, i) => V.map(row => row[i])) };
}

/**
 * Canonical correlations between X and Y: square roots of the eigenvalues of
 * Sxx^-1 Sxy Syy^-1 Syx.
 *
 * This is emphatically NOT the singular values of the element-wise correlation
 * matrix, which is the mistake it replaces. Whitening needs the full inverse of
 * Sxx; dividing each column by its own standard deviation only achieves that when
 * the columns are uncorrelated. The wrong version returned 0.100/0.055 where the
 * right one returns 0.030/0.055 — and, the giveaway, it CHANGED under an invertible
 * linear re-encoding of X. A true canonical correlation depends only on the two
 * subspaces, so it cannot change. That invariance test is what caught the error,
 * which is why it is a test and not a comment.
 */
export function canonicalCorrelations(X, Y) {
  const n = X.length;
  const Mx = centre(X), My = centre(Y);
  const cross = (A, B) => {
    const r = A[0].length, c = B[0].length;
    const out = Array.from({ length: r }, () => new Array(c).fill(0));
    for (let i = 0; i < n; i++) for (let a = 0; a < r; a++) for (let b = 0; b < c; b++) out[a][b] += A[i][a] * B[i][b] / n;
    return out;
  };
  const transpose = A => Array.from({ length: A[0].length }, (_, i) => A.map(r => r[i]));
  const mul = (A, B) => Array.from({ length: A.length }, (_, i) =>
    Array.from({ length: B[0].length }, (_, j) => A[i].reduce((acc, v, k) => acc + v * B[k][j], 0)));
  const inv = A => Array.from({ length: A.length }, (_, i) => solve(A, A.map((_, j) => (i === j ? 1 : 0))));
  const Sxy = cross(Mx, My);
  const K = mul(mul(mul(inv(cross(Mx, Mx)), Sxy), inv(cross(My, My))), transpose(Sxy));
  return jacobiEigen(K).values.slice().sort((a, b) => b - a).map(v => Math.sqrt(Math.max(v, 0)));
}

/** Principal directions of a set of rows, largest first. */
export function principalDirections(rows, count) {
  const n = rows.length, k = rows[0].length;
  const mu = Array.from({ length: k }, (_, j) => rows.reduce((s, r) => s + r[j], 0) / n);
  const C = Array.from({ length: k }, () => new Array(k).fill(0));
  for (const r of rows) {
    const d = r.map((v, j) => v - mu[j]);
    for (let a = 0; a < k; a++) for (let b = 0; b < k; b++) C[a][b] += d[a] * d[b] / n;
  }
  const { values, vectors } = jacobiEigen(C);
  const order = Array.from({ length: k }, (_, i) => i).sort((a, b) => values[b] - values[a]);
  return order.slice(0, count).map(i => ({ value: values[i], vector: vectors[i] }));
}

/** Zero mean, unit variance per column. Removes trivial scale differences so the
    comparison is about geometry rather than about which encoding happens to use
    larger numbers — otherwise the fit is measuring units, not structure. */
export function standardise(rows) {
  const n = rows.length, k = rows[0].length;
  const mu = [], sd = [];
  for (let j = 0; j < k; j++) {
    const col = rows.map(r => r[j]);
    const m = col.reduce((s, v) => s + v, 0) / n;
    const v = col.reduce((s, x) => s + (x - m) ** 2, 0) / n;
    mu.push(m); sd.push(Math.sqrt(v));
  }
  return rows.map(r => r.map((v, j) => (sd[j] ? (v - mu[j]) / sd[j] : 0)));
}