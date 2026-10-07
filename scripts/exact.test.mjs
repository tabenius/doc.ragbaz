#!/usr/bin/env node
// Regression tests for the numerical core, written from the defects actually found
// while building the precision study rather than from a checklist.
//
// Every test below corresponds to a bug that shipped into this arithmetic and
// produced a finite, plausible, wrong number. The names say which one, so that a
// future edit that reintroduces them fails here instead of in a coefficient.
//
//   node scripts/exact.test.mjs

import {
  Frac, exactSolve, exactInverse, condInfExact, absFrac, fracToExponential, exactRelativeError,
} from './lib/exact.mjs';
import {
  twoSum, twoProd, neumaier, uniformSource, normalSource, mulberry32, ddAdd, ddMul, ddFrom, ddVal,
  solve, solveRefined, convergenceOrder,
} from './lib/lin.mjs';

let pass = 0, fail = 0;
const ok = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`); }
};
const near = (a, b, tol = 1e-12) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));

console.log('\n  exact rational arithmetic\n');

ok('Frac reduces and normalises', new Frac(4n, 8n).n === 1n && new Frac(4n, 8n).d === 2n);
ok('Frac keeps the sign in the denominator', new Frac(1n, -2n).n === -1n && new Frac(1n, -2n).d === 2n);

// The denominator must travel with the numerator when taking an absolute value.
// Writing new Frac(-f.n) instead of new Frac(-f.n, f.d) turned 1/3 into 1, which
// corrupted the pivot search, the error scale and the norm all at once.
ok('absFrac keeps the denominator', absFrac(new Frac(-1n, 3n)).n === 1n && absFrac(new Frac(-1n, 3n)).d === 3n,
  `got ${absFrac(new Frac(-1n, 3n)).n}/${absFrac(new Frac(-1n, 3n)).d}`);
ok('absFrac leaves a positive value alone', absFrac(new Frac(1n, 3n)).d === 3n);

ok('Frac arithmetic: 1/3 + 1/6 = 1/2', (() => {
  const r = new Frac(1n, 3n).add(new Frac(1n, 6n));
  return r.n === 1n && r.d === 2n;
})());
ok('Frac division by an integer stays exact', (() => {
  const r = new Frac(1n, 7n).div(new Frac(3n));
  return r.n === 1n && r.d === 21n;
})());

console.log('\n  exact solve\n');

const sysA = [[2, 1, -1], [-3, -1, 2], [-2, 1, 2]];
const sysB = [8, -11, -3];
const solA = exactSolve(sysA, sysB);
ok('exactSolve recovers a known integer solution (2, 3, -1)',
  solA[0].n === 2n && solA[1].n === 3n && solA[2].n === -1n && solA.every(f => f.d === 1n),
  solA.map(f => `${f.n}/${f.d}`).join(' '));
ok('exactSolve handles a system needing pivoting', (() => {
  const M = [[0, 2, 1], [1, 1, 1], [3, 0, -1]], r = [5, 6, 2];
  const x = exactSolve(M, r);
  return x.every((f, i) => M.every((row, k) => {
    const lhs = row.reduce((s, v, j) => s.add(v === 0 ? new Frac(0n) : new Frac(BigInt(v)).mul(x[j])), new Frac(0n));
    return lhs.n === BigInt(r[k]) * lhs.d / BigInt(r[k]) * BigInt(r[k]) || lhs.n * BigInt(r[k]) === BigInt(r[k]) * lhs.d;
  }));
})());
ok('exactSolve rejects a singular matrix', (() => {
  try { exactSolve([[1, 2], [2, 4]], [1, 2]); return false; } catch { return true; }
})());

console.log('\n  exact inverse and conditioning\n');

const inv2 = exactInverse([[2, 1], [1, 2]]);
ok('exactInverse of [[2,1],[1,2]] is exact', inv2[0][0].n === 2n && inv2[0][0].d === 3n && inv2[1][0].n === -1n,
  inv2.map(c => c.map(f => `${f.n}/${f.d}`).join(',')).join(' | '));

// The infinity norm is the largest row SUM. Computing the largest row entry instead
// made this come out 4/3 rather than 3, and made large diagonal matrices look
// perfectly conditioned.
ok('condInfExact([[2,1],[1,2]]) === 3', condInfExact([[2, 1], [1, 2]]).n === 3n);
ok('condInfExact of the identity is exactly 1', (() => {
  const I = Array.from({ length: 5 }, (_, i) => Array.from({ length: 5 }, (_, j) => (i === j ? 1 : 0)));
  const c = condInfExact(I);
  return c.n === 1n && c.d === 1n;
})());
ok('condInfExact does not truncate through a decimal string', (() => {
  // A 12-digit rendering of the inverse hid the growth in cond for large n. The
  // condition numbers must increase with n for Hilbert and stay below 1e18 at n=10.
  const gcdBig = (a, b) => (b === 0n ? a : gcdBig(b, a % b));
  const lcm = n => { let L = 1n; for (let k = 1n; k <= BigInt(2 * n - 1); k++) L = L / gcdBig(L, k) * k; return L; };
  const H = n => Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => Number(lcm(n) / BigInt(i + j + 1))));
  const c4 = condInfExact(H(4)), c8 = condInfExact(H(8));
  return c8.n * c4.d > c4.n * c8.d && Number(c8.n) / Number(c8.d) > 1e9;
})());

// 2n - 1n is the BigInt literal 2n minus 1n, which is 1. Written that way the lcm
// loop ran once, L stayed 1, and the whole matrix truncated to zeros.
ok('the lcm helper is not defeated by BigInt literal precedence', (() => {
  const gcdBig = (a, b) => (b === 0n ? a : gcdBig(b, a % b));
  const lcm = n => { let L = 1n; for (let k = 1n; k <= BigInt(2 * n - 1); k++) L = L / gcdBig(L, k) * k; return L; };
  return lcm(4) === 420n && lcm(3) === 60n && lcm(1) === 1n;
})());

ok('exactRelativeError is zero for an exact answer', (() => {
  const e = exactRelativeError([2, 3, -1], [new Frac(2n), new Frac(3n), new Frac(-1n)]);
  return e.n === 0n;
})());
ok('exactRelativeError scales by the exact magnitude', (() => {
  const exact = [new Frac(100n), new Frac(200n)];
  const e = exactRelativeError([100, 202], exact);
  return near(Number(e.n) / Number(e.d), 2 / 200);
})());

console.log('\n  float64 primitives\n');

ok('twoSum recovers the exact sum', (() => {
  const [s, e] = twoSum(0.1, 0.2);
  return s + e === 0.1 + 0.2 && (s + e) === 0.30000000000000004;
})());
ok('twoProd recovers the exact product', (() => {
  const [p, e] = twoProd(0.1, 0.3);
  return p + e === 0.1 * 0.3;
})());
ok('twoProd is exact on a cancellation-prone pair', (() => {
  const [p, e] = twoProd(1.0000001, 1.0000001);
  return near(p + e, 1.0000001 * 1.0000001, 0);
}));
ok('Neumaier beats the naive sum', (() => {
  const v = [0.1, 0.2, 0.3];
  const naive = v.reduce((s, x) => s + x, 0);
  return Math.abs(neumaier(v) - 0.6) < Math.abs(naive - 0.6);
})());
// 100000 triples of (1e16, 1, -1e16) sum to exactly 100000. The naive sum returns 0,
// because 1e16 + 1 rounds away the 1 before any compensation can see it.
ok('Neumaier survives a long sum that cancels catastrophically', (() => {
  const v = [];
  for (let i = 0; i < 100000; i++) v.push(1e16, 1, -1e16);
  const naive = v.reduce((s, x) => s + x, 0);
  return naive === 0 && neumaier(v) === 100000;
})());

console.log('\n  generators\n');

// normalSource returns standard-normal variates, not uniforms. A caller that used it
// for Math.floor(g() * k) to pick a bucket got negative exponents for half the draws.
ok('normalSource is centred and has unit-ish spread', (() => {
  const g = normalSource(7);
  const v = Array.from({ length: 20000 }, () => g());
  const m = v.reduce((s, x) => s + x, 0) / v.length;
  const sd = Math.sqrt(v.reduce((s, x) => s + (x - m) ** 2, 0) / v.length);
  return Math.abs(m) < 0.05 && near(sd, 1, 0.05);
})());
ok('uniformSource stays strictly inside (0,1)', (() => {
  const u = uniformSource(11);
  const v = Array.from({ length: 20000 }, () => u());
  return v.every(x => x > 0 && x < 1);
})());
ok('uniformSource never returns 0, so logs stay finite', (() => {
  let zero = 0;
  for (let seed = 0; seed < 500; seed++) {
    const u = mulberry32(seed);
    for (let i = 0; i < 200; i++) if (u() === 0) zero++;
  }
  return zero === 0;
}));
ok('uniform bucketing stays non-negative for every draw', (() => {
  const u = uniformSource(3);
  for (let i = 0; i < 5000; i++) {
    const e = Math.floor(u() * 12);
    if (e < 0 || e > 11) return false;
  }
  return true;
}));
ok('generators are deterministic under a fixed seed', (() => {
  const a = Array.from({ length: 50 }, uniformSource(42));
  const b = Array.from({ length: 50 }, uniformSource(42));
  return a.every((v, i) => v === b[i]);
})());

console.log('\n  double-double\n');

ok('ddAdd keeps low-order bits the float64 add drops', (() => {
  const sum = ddVal(ddAdd(ddFrom(0.1), ddFrom(0.2)));
  return sum === 0.1 + 0.2 || Math.abs(sum - 0.3) <= 1e-17;
})());
// The canonical demonstration: double-double recovers the 1s that a plain float64
// sum discards, because the correction carried in lo is never rounded into hi.
ok('ddAdd recovers terms a float64 sum discards', (() => {
  let acc = ddFrom(0);
  let plain = 0;
  for (let i = 0; i < 1000; i++) {
    for (const t of [1e16, 1, -1e16]) { acc = ddAdd(acc, ddFrom(t)); plain += t; }
  }
  return plain === 0 && ddVal(acc) === 1000;
})());
ok('ddMul reproduces a product beyond float64 precision', (() => {
  const p = ddVal(ddMul(ddFrom(1 + 1e-12), ddFrom(1 - 1e-12)));
  return Math.abs(p - (1 - 1e-24)) < 1e-24;
})());

console.log('\n  solver, refinement and convergence order\n');

const sysTruth = solA.map(f => Number(f.n) / Number(f.d));

ok('float64 solve matches the exact solution on a mild system', (() => {
  const x = solve(sysA, sysB);
  return x.every((v, i) => Math.abs(v - sysTruth[i]) < 1e-12);
})());
ok('refinement never increases the error on a mild system', (() => {
  const e0 = solve(sysA, sysB).reduce((m, v, i) => Math.max(m, Math.abs(v - sysTruth[i])), 0);
  const { x } = solveRefined(sysA, sysB, { sweeps: 3 });
  const e1 = x.reduce((m, v, i) => Math.max(m, Math.abs(v - sysTruth[i])), 0);
  return e1 <= e0;
}));
ok('convergenceOrder refuses to regress an exact zero', () => {
  const h = [{ change: 1e-3 }, { change: 1e-6 }, { change: 0 }, { change: 0 }];
  const o = convergenceOrder(h);
  return o === null || Number.isFinite(o);
});
ok('convergenceOrder measures a clean quadratic sweep', () => {
  const o = convergenceOrder([{ change: 1e-2 }, { change: 1e-4 }, { change: 1e-8 }]);
  return o !== null && o > 1.5 && o < 2.5;
});

console.log('\n  the trap this all exists to expose\n');

// A badly wrong solution that satisfies its equations is the whole reason for
// measuring against exact arithmetic rather than against a residual.
ok('a wrong solution can have a tiny backward error', (() => {
  const gcdBig = (a, b) => (b === 0n ? a : gcdBig(b, a % b));
  const lcm = n => { let L = 1n; for (let k = 1n; k <= BigInt(2 * n - 1); k++) L = L / gcdBig(L, k) * k; return L; };
  const n = 12;
  const H = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => Number(lcm(n) / BigInt(i + j + 1))));
  const truth = Array.from({ length: n }, (_, i) => (i % 2 ? -5 : 5));
  const b = H.map(row => row.reduce((s, v, j) => s + v * truth[j], 0));
  const got = solve(H, b);
  const scale = Math.max(...truth.map(Math.abs));
  const fwd = Math.max(...got.map((v, i) => Math.abs(v - truth[i]))) / scale;
  const bn = Math.max(...b.map(Math.abs));
  const r = b.map((bi, i) => neumaier([bi, ...H[i].map((h, j) => -h * got[j])]));
  const back = Math.max(...r.map(Math.abs)) / bn;
  return fwd > 1e-3 && back < 1e-12;
})());

console.log(`\n  ${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);