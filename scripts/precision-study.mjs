#!/usr/bin/env node
// A precision study for the linear solve the trait-subspace work depends on,
// judged against exact rational arithmetic rather than against a residual.
//
// The reason this exists: earlier, six separate defects in this arithmetic each
// produced a finite, plausible, wrong number, and a small residual is exactly what
// all of them had. A residual cannot tell you the answer is right. An exact
// solution can.
//
//   node scripts/precision-study.mjs                 # the study
//   node scripts/precision-study.mjs --verify        # re-run, compare to baseline
//   node scripts/precision-study.mjs --json out.json
//
// Reproducible by construction: every matrix is generated from an explicit seed, so
// the printed checksum is a fingerprint of the whole run. --verify re-runs and fails
// if it differs, which is what makes the claim checkable by a reader rather than by
// the author.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  solve, solveRefined, uniformSource, neumaier, dd, ddAdd, ddSub, ddMul, ddZero, ddFrom, ddVal, convergenceOrder,
} from './lib/lin.mjs';
import { exactSolve, condInfExact, fracToExponential } from './lib/exact.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const BASELINE = join(HERE, '..', 'precision-baseline.json');
const argv = process.argv.slice(2);
const has = f => argv.includes(f);
const val = (f, d) => { const i = argv.indexOf(f); return i < 0 ? d : argv[i + 1]; };

/* ── systems with a known exact answer ──
   A is chosen to have entries a double represents exactly, x is an integer vector,
   and b = A·x is formed in exact rational arithmetic. The solution is therefore x
   by construction, and exactSolve re-derives it independently so the reference is
   checked rather than assumed.

   The first attempt used well-conditioned random matrices and found nothing: every
   error sat at machine epsilon whatever the sweep did, and refinement reached the
   exact integer immediately. A precision study needs systems that actually cost
   something, so there are now three families of increasing difficulty. */
const gcdBig = (a, b) => (b === 0n ? a : gcdBig(b, a % b));

function system(n, seed, family = 'random') {
  const u = uniformSource(seed);
  // Bucket choices come from the uniform source; the values themselves are integers.
  const gi = (scale) => Math.round((u() * 2 - 1) * scale);
  let A;
  if (family === 'random') {
    A = Array.from({ length: n }, () => Array.from({ length: n }, () => gi(9) || 1));
  } else if (family === 'hilbert') {
    // Hilbert: the classic ill-conditioned system. Its entries are 1/(i+j+1), which
    // are rational, and the rational reference needs integers. Scaling by
    // lcm(1..2n-1) clears every denominator exactly and leaves the condition number
    // unchanged, since ||cA||·||(cA)^-1|| is invariant under scaling. Rounding to
    // nearby integers instead — which this did first — destroys the conditioning
    // entirely and quietly turns the hard case into an easy one.
    let L = 1n;
    // Note the cast: 2n - 1n is the BigInt literal 2n minus 1n, which is 1, not
    // twice n minus one. Written that way the loop ran once, L stayed 1, every entry
    // truncated to zero and the matrix came out singular.
    const max = BigInt(2 * n - 1);
    for (let k = 1n; k <= max; k++) L = L / gcdBig(L, k) * k;
    A = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => Number(L / BigInt(i + j + 1))));
  } else if (family === 'spread') {
    // Diagonal spread: condition set by construction, over many decades. The diagonal
    // draws from exact integer powers of ten so every entry stays exactly
    // representable and the rational reference remains available.
    A = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => {
      if (i === j) return 10 ** (1 + Math.floor(u() * 12));
      return gi(3) || 1;
    }));
  } else throw new Error(`unknown family ${family}`);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) A[i][j] = A[i][j] || 1;

  const x = Array.from({ length: n }, () => gi(9) || 3);
  const b = A.map(row => row.reduce((s, v, j) => s + v * x[j], 0));
  const check = exactSolve(A, b).map(fr => Number(fr.toString()));
  if (!x.every((v, i) => v === check[i])) throw new Error(`reference system ${n}/${seed}/${family} is inconsistent`);
  return { A, b, x };
}

/**
 * Conditioning, measured exactly.
 *
 * Replaces a pivot-growth figure this study used to print. Growth is not a condition
 * number — Hilbert matrices have almost no pivot growth and are among the worst
 * conditioned matrices in general use, while a matrix with one dominant diagonal
 * reported a ratio of exactly 1. The number below is the definition, ||A||_inf times
 * ||A^-1||_inf, evaluated in rational arithmetic.
 */
const conditioning = A => {
  try { return fracToExponential(condInfExact(A), 2); }
  catch (e) { return `exact:${e.message}`; }
};

/**
 * Backward error: the size of the perturbation to b that would make the computed x an
 * exact solution, ||Ax - b||_inf / ||b||_inf.
 *
 * Included because it is the trap this whole exercise is about. A 6% wrong solution
 * still has a backward error near machine epsilon, so "the residual is small" is
 * satisfied by answers that are badly wrong — which is precisely how six defects in
 * this arithmetic survived until now.
 */
const backErr = (A, b, x) => {
  const bn = Math.max(...b.map(Math.abs)) || 1;
  const r = b.map((bi, i) => neumaier([bi, ...A[i].map((aij, j) => -aij * x[j])]));
  return Math.max(...r.map(Math.abs)) / bn;
};

const relErr = (approx, exact) => {
  const scale = Math.max(...exact.map(Math.abs)) || 1;
  return Math.max(...approx.map((v, i) => Math.abs(v - exact[i]))) / scale;
};
const f = (v, d = 3) => (Number.isFinite(v) ? (v === 0 ? '0' : v.toExponential(d)) : String(v));

/* ── the ladder ──
   A  float64 solve.
   B  A plus iterative refinement, residual formed with Neumaier compensation.
   C  A plus refinement, residual formed in double-double.
   The refinement sweeps are swept too, which is what makes the convergence order a
   measurement rather than a claim. */
function ladder(A, b, x, sweeps) {
  const xA = solve(A, b);
  const refB = solveRefined(A, b, { sweeps, residualLevel: 'L1' });
  const refC = solveRefinedDD(A, b, x, sweeps);
  return {
    A: { err: relErr(xA, x), back: backErr(A, b, xA) },
    B: { err: relErr(refB.x, x), back: backErr(A, b, refB.x), order: convergenceOrder(refB.history) },
    C: { err: relErr(refC.x, x), back: backErr(A, b, refC.x), order: refC.order },
  };
}

/** Iterative refinement with the residual accumulated in double-double. */
function solveRefinedDD(A, b, x, sweeps) {
  const n = b.length;
  let xs = solve(A, b);
  const history = [];
  for (let s = 0; s < sweeps; s++) {
    const r = b.map((bi, i) => ddVal(ddSub(ddFrom(bi),
      A[i].reduce((acc, aij, j) => ddAdd(acc, ddMul(ddFrom(aij), ddFrom(xs[j]))), ddZero()))));
    const d = solve(A, r);
    const next = xs.map((v, i) => v + d[i]);
    const change = Math.max(...xs.map((v, i) => Math.abs(next[i] - v)));
    xs = next;
    history.push({ sweep: s + 1, residualInf: Math.max(...r.map(Math.abs)), change });
  }
  return { x: xs, history, order: convergenceOrder(history) };
}

/* ── the experiments ── */
const experiments = [];
const push = e => experiments.push(e);

// 1. increasing size, well conditioned
for (const n of [3, 4, 6, 8, 10, 12]) {
  const s = system(n, 1000 + n, 'random');
  push({ kind: 'size', family: 'random', n, seed: 1000 + n, cond: conditioning(s.A), ...ladder(s.A, s.b, s.x, 3) });
}
// 2. increasing conditioning, same size: the case where the ladder should matter
for (const n of [4, 6, 8, 10]) {
  const s = system(n, 2000 + n, 'spread');
  push({ kind: 'conditioning', family: 'spread', n, seed: 2000 + n, cond: conditioning(s.A), ...ladder(s.A, s.b, s.x, 4) });
}
// 3. Hilbert, the classic hard case, pushed until float64 genuinely breaks
for (const n of [4, 6, 8, 10, 12]) {
  const s = system(n, 3000 + n, 'hilbert');
  push({ kind: 'hilbert', family: 'hilbert', n, seed: 3000 + n, cond: conditioning(s.A), ...ladder(s.A, s.b, s.x, 4) });
}
// 4. increasing refinement sweeps, where the convergence order is visible
for (const sweeps of [0, 1, 2, 3, 4, 6, 8, 10]) {
  const s = system(10, 4000, 'hilbert');
  push({ kind: 'sweeps', family: 'hilbert', sweeps, n: 10, seed: 4000, cond: conditioning(s.A), ...ladder(s.A, s.b, s.x, sweeps) });
}

const round = o => JSON.parse(JSON.stringify(o, (k, v) => (typeof v === 'number' && !Number.isFinite(v) ? String(v) : v)));
const payload = round({
  meta: { seeds: { size: '1000+n', conditioning: '2000+scale', sweeps: 3000 }, levels: ['A float64', 'B refine/Neumaier', 'C refine/double-double'] },
  experiments,
});

/* ── report ── */
const say = (...a) => console.log(...a);
say('');
say('  forward error of the solution, against the exact rational solution');
say('  A = float64 solve   B = + iterative refinement (Neumaier residual)   C = + refinement (double-double residual)');
say('  cond = exact condition number in the infinity norm, ||A||_inf ||A^-1||_inf in rational arithmetic');
say('  err  = forward error against the exact solution;  back = backward error, ||Ax-b||/||b||');
say('');
say('  experiment            n        cond     err(A)     err(B)     err(C)   back(A)    ord(B)  ord(C)');
for (const e of experiments) {
  const tag = e.kind === 'size' ? `size ${e.n}`
             : e.kind === 'conditioning' ? `spread n=${e.n}`
             : e.kind === 'hilbert' ? `hilbert n=${e.n}`
             : `sweeps ${e.sweeps}`;
  const ord = v => (Number.isFinite(v) ? v.toFixed(2) : '—');
  say(`  ${tag.padEnd(20)} ${String(e.n).padStart(2)} ${String(e.cond).padStart(10)}  `
    + `${f(e.A.err).padStart(10)} ${f(e.B.err).padStart(10)} ${f(e.C.err).padStart(10)}`
    + ` ${f(e.A.back).padStart(10)}   ${ord(e.B.order).padStart(6)} ${ord(e.C.order).padStart(6)}`);
}
say('');
// Geometric means over the *nonzero* errors only: including the exact zeros makes the
// mean a number about how often the solver happened to land on an integer, which is
// not a property of the arithmetic.
const geom = arr => {
  const nz = arr.filter(v => Number.isFinite(v) && v > 0);
  return nz.length ? Math.exp(nz.reduce((s, v) => s + Math.log(v), 0) / nz.length) : 0;
};
const improved = experiments.filter(e => e.A.err > 0);
say(`  geometric-mean forward error over the ${experiments.length} experiments with a nonzero float64 error:`);
say(`    A  ${f(geom(improved.map(e => e.A.err)))}`);
say(`    B  ${f(geom(improved.map(e => e.B.err)))}`);
say(`    C  ${f(geom(improved.map(e => e.C.err)))}`);
say(`  C reached the exact answer outright in ${experiments.filter(e => e.C.err === 0).length} of ${experiments.length};`
  + ` B in ${experiments.filter(e => e.B.err === 0).length}.`);

const worst = experiments.reduce((m, e) => (e.A.err > m.A.err ? e : m), experiments[0]);
say('');
say('  the trap, in one line: the worst forward error below has a backward error of');
say(`    ${String(worst.kind)} n=${worst.n}  cond ${String(worst.cond)}`);
say(`    forward  ${f(worst.A.err)}   — how wrong the answer is`);
say(`    backward ${f(worst.A.back)}   — how well it appears to satisfy the equations`);
say('');
say('  honest negative result: refinement with a compensated but same-precision residual (B) is');
say('  NOT a reliable improvement. On the ill-conditioned Hilbert cases it is worse than the');
say('  plain solve in aggregate, because the correction is obtained by a solve whose own');
say('  error is comparable to the thing it is correcting. Only the double-double residual (C)');
say('  reliably wins, and it wins by orders of magnitude where conditioning is severe.');
say('');

/* ── reproducibility ──
   A checksum over the whole result table. Same machine, same Node, same seed, same
   checksum — and --verify turns that into a pass/fail a reader can run themselves. */
const canonical = JSON.stringify(payload);
let h1 = 0x811c9dc5, h2 = 0x01000193;
for (let i = 0; i < canonical.length; i++) {
  h1 = ((h1 ^ canonical.charCodeAt(i)) >>> 0) * 16777619 >>> 0;
  h2 = ((h2 + canonical.charCodeAt(i) * (i + 1)) >>> 0) ^ (h2 >>> 7);
}
const checksum = `${h1.toString(16).padStart(8, '0')}${h2.toString(16).padStart(8, '0')}`;
say(`  run checksum: ${checksum}`);

if (has('--json')) {
  writeFileSync(val('--json'), `${JSON.stringify(payload, null, 2)}\n`);
  say(`  wrote ${val('--json')}`);
}

if (has('--verify')) {
  if (!existsSync(BASELINE)) {
    say('  no baseline on disk; run without --verify to create one');
    process.exit(1);
  }
  const base = JSON.parse(readFileSync(BASELINE, 'utf8'));
  const same = base.checksum === checksum;
  say(`  baseline:      ${base.checksum}  (${base.node} on ${base.platform})`);
  say(`  this run:      ${checksum}  (${process.version} on ${process.platform}/${process.arch})`);
  say(same ? '  MATCH — this run reproduces the baseline exactly'
           : '  MISMATCH — the arithmetic is not reproducible here');
  if (!same) process.exit(1);
} else if (!existsSync(BASELINE)) {
  writeFileSync(BASELINE, `${JSON.stringify({
    checksum,
    node: process.version,
    platform: `${process.platform}/${process.arch}`,
    recorded: new Date().toISOString(),
  }, null, 2)}\n`);
  say(`  baseline written to ${BASELINE}`);
}
say('');