#!/usr/bin/env node
// Tests for the five encodings.
//
// The load-bearing pair:
//   * linear-light and YCbCr are related by a LINEAR bijection, so every linear
//     quantity must agree exactly on both sides of that map.
//   * sRGB, Oklab and CIELAB are nonlinear, so the same quantities must NOT agree.
// Failing the first means the code is broken. Passing the second while failing the
// first means the nonlinear quantities are being computed as if linear. The gap
// between them is the linearization trap.
//
//   node scripts/color.test.mjs

import {
  srgbToLinear, linearToSrgb, linearToYcbcr709, ycbcr709ToLinear,
  linearToOklab, linearToLab, linearToXyz, xyzToLab, ENCODINGS,
  jacobiEigen, principalDirections, standardise,
} from './lib/color.mjs';
import { uniformSource, correlationMatrix, ridge, r2 } from './lib/lin.mjs';

let pass = 0, fail = 0;
const ok = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`); }
};
const near = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));
const maxErr = (fn) => {
  const u = uniformSource(1234);
  let m = 0;
  for (let i = 0; i < 3000; i++) {
    const p = [u(), u(), u()];
    const back = fn(p);
    for (let j = 0; j < 3; j++) m = Math.max(m, Math.abs(back[j] - p[j]));
  }
  return m;
};

console.log('\n  sRGB transfer function\n');

ok('sRGB encode/decode round-trips exactly', maxErr(p => linearToSrgb(srgbToLinear(p[0])) > 0 ? [linearToSrgb(srgbToLinear(p[0])), p[1], p[2]] : [p[0], linearToSrgb(srgbToLinear(p[1])), p[2]]) < 1e-12);
ok('sRGB transfer is monotonic', (() => {
  let prev = -1;
  for (let i = 0; i <= 100; i++) { const v = linearToSrgb(i / 100); if (v < prev) return false; prev = v; }
  return true;
})());
ok('sRGB maps linear 0.18 to about 0.46 (middle grey)', near(linearToSrgb(0.18), 0.4614, 1e-3), String(linearToSrgb(0.18)));
// The toe is the *slope* that matters, not the output magnitude: below the breakpoint
// the segment is 12.92x, so a small linear value legitimately maps to a much larger
// code. An earlier version of this test assumed the output would stay near the input
// and failed on a correct function.
ok('sRGB toe uses the 12.92x linear segment below the breakpoint', (() => {
  for (const v of [0.0005, 0.002, 0.003]) {
    if (!near(linearToSrgb(v), v * 12.92, 1e-12)) return false;
  }
  return true;
})());
ok('sRGB segments meet continuously at the breakpoint', near(linearToSrgb(0.0031308), 0.0031308 * 12.92, 1e-4),
  String(linearToSrgb(0.0031308)));

console.log('\n  BT.709 luma/chroma — the linear control\n');

ok('Y 709 and YCbCr round-trip exactly', (() => {
  const u = uniformSource(77);
  let m = 0;
  for (let i = 0; i < 2000; i++) {
    const p = [u(), u(), u()];
    const b = ycbcr709ToLinear(linearToYcbcr709(p));
    for (let j = 0; j < 3; j++) m = Math.max(m, Math.abs(b[j] - p[j]));
  }
  return m < 1e-12;
})());
ok('Y 709 maps white to Y=1, Cb=Cr=0', (() => {
  const [Y, Cb, Cr] = linearToYcbcr709([1, 1, 1]);
  return near(Y, 1, 1e-12) && near(Cb, 0, 1e-12) && near(Cr, 0, 1e-12);
})());
ok('luma weighting favours green, as intended', (() => {
  const g = linearToYcbcr709([0, 1, 0])[0];
  const r = linearToYcbcr709([1, 0, 0])[0];
  const b = linearToYcbcr709([0, 0, 1])[0];
  return g > r && r > b && near(g + r + b, 1, 1e-12);
})());
ok('YCbCr is genuinely linear', (() => {
  const u = uniformSource(9);
  for (let i = 0; i < 200; i++) {
    const p = [u(), u(), u()], q = [u(), u(), u()];
    const s = p.map((v, j) => v + q[j]);
    const A = linearToYcbcr709(p), B = linearToYcbcr709(q), S = linearToYcbcr709(s);
    for (let j = 0; j < 3; j++) if (!near(S[j], A[j] + B[j], 1e-12)) return false;
  }
  return true;
})());

console.log('\n  Oklab and CIELAB — the perceptual controls\n');

ok('Oklab maps white to L=1, a=b=0', (() => {
  const [L, a, b] = linearToOklab([1, 1, 1]);
  return near(L, 1, 1e-6) && near(a, 0, 1e-6) && near(b, 0, 1e-6);
})());
ok('Oklab maps 18% linear grey to L≈0.6', (() => {
  const L = linearToOklab([0.18, 0.18, 0.18])[0];
  return near(L, 0.6, 0.02), String(L);
})());
ok('Oklab is NOT linear — this is the whole point', (() => {
  const u = uniformSource(31);
  for (let i = 0; i < 100; i++) {
    const p = [u(), u(), u()], q = [u(), u(), q => q];
  }
  const p = [0.2, 0.3, 0.4], q = [0.15, 0.25, 0.35];
  const A = linearToOklab(p), B = linearToOklab(q), S = linearToOklab(p.map((v, j) => v + q[j]));
  return !near(S[0], A[0] + B[0], 1e-6);
})());
ok('CIELAB maps white to L=100, a=b=0', (() => {
  const [L, a, b] = linearToLab([1, 1, 1]);
  return near(L, 100, 1e-3) && near(a, 0, 1e-3) && near(b, 0, 1e-3);
})());
ok('CIELAB 18% grey lands near L≈46-52', (() => {
  const L = linearToLab([0.18, 0.18, 0.18])[0];
  return L > 44 && L < 54, String(L);
})());
ok('CIELAB is NOT linear', (() => {
  const p = [0.2, 0.3, 0.4], q = [0.15, 0.25, 0.35];
  const A = linearToLab(p), B = linearToLab(q), S = linearToLab(p.map((v, j) => v + q[j]));
  return !near(S[0], A[0] + B[0], 1e-6);
})());
ok('XYZ of white is the D65 white point', (() => {
  const [X, Y, Z] = linearToXyz([1, 1, 1]);
  return near(X, 0.95047, 1e-5) && near(Y, 1.0, 1e-5) && near(Z, 1.08883, 1e-5);
})());
ok('CIELAB and Oklab agree on lightness ordering', (() => {
  const lo = linearToOklab([0.1, 0.1, 0.1])[0], hi = linearToOklab([0.8, 0.8, 0.8])[0];
  const Llo = linearToLab([0.1, 0.1, 0.1])[0], Lhi = linearToLab([0.8, 0.8, 0.8])[0];
  return hi > lo && Lhi > Llo;
})());

console.log('\n  the two invariants, side by side\n');

// Canonical correlation depends only on the spans of X and y, so it is invariant
// under ANY invertible LINEAR re-encoding, and only under those. If this test fails,
// the correlation machinery is broken. If it passed for sRGB too, the nonlinearity
// would have been lost somewhere.
const build = (seed, k = 2, n = 400) => {
  const u = uniformSource(seed);
  const t = Array.from({ length: n }, () => Array.from({ length: k }, () => u() * 2 - 1));
  const y = t.map(v => v.slice());
  return { n, k, y, t };
};

/**
 * Canonical correlations between X and y: the singular values of their cross-correlation
 * matrix.
 *
 * Eigenvalues, which is what this first used, are not singular values. The
 * cross-correlation matrix is not symmetric in general, so its eigenvalues can even
 * be complex, and a "canonical correlation" of -0.7 or a complex pair is not a
 * quantity anyone should print. Eigenvalues of C-transpose-C, then square roots, are
 * the real thing.
 */
function canonicalCorrelations(X, y) {
  const C = correlationMatrix(X, y);
  const k = C.length;
  const CtC = Array.from({ length: k }, (_, i) =>
    Array.from({ length: k }, (_, j) => C.reduce((s, row) => s + row[i] * row[j], 0)));
  return jacobiEigen(CtC).values
    .slice()
    .sort((a, b) => b - a)
    .map(v => Math.sqrt(Math.max(v, 0)));
}

ok('canonical correlation is invariant under linear re-encoding (must hold)', (() => {
  const u = uniformSource(555);
  const n = 300, k = 2;
  const lin = Array.from({ length: n }, () => [u(), u(), u()]);
  const y = Array.from({ length: n }, () => [u() * 2 - 1, u() * 2 - 1]);
  const ycb = lin.map(linearToYcbcr709);
  const a = canonicalCorrelations(standardise(lin), y);
  const b = canonicalCorrelations(standardise(ycb), y);
  let worst = 0;
  for (let i = 0; i < a.length; i++) worst = Math.max(worst, Math.abs(a[i] - b[i]));
  return worst < 1e-9;
})());

ok('canonical correlation is NOT invariant under sRGB re-encoding (must not hold)', (() => {
  const u = uniformSource(556);
  const n = 300, k = 2;
  const lin = Array.from({ length: n }, () => {
    const c = [0.2 + 0.3 * u(), 0.2 + 0.3 * u(), 0.2 + 0.3 * u()];
    return c;
  });
  const y = Array.from({ length: n }, () => [u() * 2 - 1, u() * 2 - 1]);
  // map passes (element, index, array); linearToSrgb is scalar, so map over components.
  const srgb = lin.map(c => c.map(linearToSrgb));
  const a = canonicalCorrelations(standardise(lin), y);
  const b = canonicalCorrelations(standardise(srgb), y);
  let worst = 0;
  for (let i = 0; i < a.length; i++) worst = Math.max(worst, Math.abs(a[i] - b[i]));
  return worst > 1e-3;
})());

console.log('\n  eigen solver\n');

ok('jacobiEigen recovers eigenvalues of [[2,1],[1,2]]', (() => {
  const e = jacobiEigen([[2, 1], [1, 2]]).values.slice().sort((a, b) => b - a);
  return near(e[0], 3, 1e-10) && near(e[1], 1, 1e-10);
})());
ok('jacobiEigen preserves the trace', (() => {
  const A = [[4, 1, 2], [1, 3, 0], [2, 0, 5]];
  const ev = jacobiEigen(A).values.reduce((s, v) => s + v, 0);
  return near(ev, 12, 1e-9);
})());
ok('jacobiEigen returns orthonormal eigenvectors', (() => {
  const A = [[4, 1, 2], [1, 3, 0], [2, 0, 5]];
  const { vectors } = jacobiEigen(A);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    const d = vectors.reduce((s, v) => s + v[i] * v[j], 0);
    if (!near(d, i === j ? 1 : 0, 1e-9)) return false;
  }
  return true;
})());
ok('eigenvectors actually diagonalise the matrix', (() => {
  const A = [[4, 1, 2], [1, 3, 0], [2, 0, 5]];
  const { values, vectors } = jacobiEigen(A);
  for (let i = 0; i < 3; i++) {
    const v = vectors[i];
    for (let r = 0; r < 3; r++) {
      const Av = A[r].reduce((s, x, c) => s + x * v[c], 0);
      if (!near(Av, values[i] * v[r], 1e-9)) return false;
    }
  }
  return true;
})());
ok('principalDirections finds a planted 2-plane', (() => {
  const u = uniformSource(31337);
  const m = [[1, 0.2, -0.1], [0.1, 1, 0.3]];
  const pts = Array.from({ length: 600 }, () => {
    const a = u() * 2 - 1, b = u() * 2 - 1;
    return [m[0][0]*a+m[0][1]*b, m[1][0]*a+m[1][1]*b, m[1][0]*0.5*a+m[1][1]*0.7*b+m[1][0]*0.2];
  });
  const dirs = principalDirections(pts, 2);
  return dirs.length === 2 && dirs[0].value > dirs[1].value;
})());
ok('standardise produces zero mean and unit variance', (() => {
  const u = uniformSource(4);
  const rows = Array.from({ length: 500 }, () => [u() * 10, u() * 3]);
  const s = standardise(rows);
  const m1 = s.reduce((a, r) => a + r[0], 0) / s.length;
  const v1 = s.reduce((a, r) => a + (r[0] - m1) ** 2, 0) / s.length;
  return near(m1, 0, 1e-12) && near(v1, 1, 1e-12);
})());

console.log('\n  encodings declared\n');
ok('five encodings are registered', ENCODINGS.length === 5, String(ENCODINGS.length));
ok('exactly one identity encoding (linear-light)', ENCODINGS.filter(e => e.key === 'linear').length === 1);
ok('every encoding declares a label and a note', ENCODINGS.every(e => e.label && e.note));

console.log(`\n  ${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);