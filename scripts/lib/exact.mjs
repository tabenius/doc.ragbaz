// Exact rational arithmetic over BigInt, so a numerical result can be *checked*
// rather than trusted.
//
// Floating-point solvers are judged against something. Without an exact answer the
// only available comparison is "does the residual look small", which every wrong
// solver passes — that is how six defects survived earlier in this work. These are
// the reference values: fraction-free Gaussian elimination (Bareiss), which keeps
// every intermediate an integer and therefore exact.
//
// Slow, and intended to be. It runs on small systems for the sake of a known answer.

/** An exact rational, kept normalised with a positive denominator. */
export class Frac {
  constructor(n, d = 1n) {
    if (d === 0n) throw new Error('division by zero');
    if (d < 0n) { n = -n; d = -d; }
    const g = gcd(n < 0n ? -n : n, d) || 1n;
    this.n = n / g; this.d = d / g;
  }
  static of(v) { return new Frac(BigInt(v)); }
  add(o) { return new Frac(this.n * o.d + o.n * this.d, this.d * o.d); }
  sub(o) { return new Frac(this.n * o.d - o.n * this.d, this.d * o.d); }
  mul(o) { return new Frac(this.n * o.n, this.d * o.d); }
  div(o) { return new Frac(this.n * o.d, this.d * o.n); }
  isZero() { return this.n === 0n; }
  /** Decimal rendering, for a table a person reads. */
  toString(digits = 12) {
    if (this.d === 1n) return this.n.toString();
    const scale = 10n ** BigInt(digits);
    const q = (this.n * scale) / this.d;
    const neg = q < 0n;
    const s = (neg ? -q : q).toString().padStart(digits + 1, '0');
    return `${neg ? '-' : ''}${s.slice(0, -digits)}.${s.slice(-digits)}`;
  }
}

/** Absolute value of a Frac. The denominator must travel with the numerator. */
export const absFrac = f => (f.n < 0n ? new Frac(-f.n, f.d) : f);

const gcd = (a, b) => (b === 0n ? a : gcd(b, a % b));

/**
 * Exact solution of A x = b, by Bareiss fraction-free elimination.
 *
 * Every intermediate entry is an integer, so nothing is rounded at any step; the
 * only division is exact because the Bareiss step divides by the previous pivot,
 * which is known to divide it exactly. Back substitution then uses Frac.
 */
export function exactSolve(Arows, brows) {
  const n = brows.length;
  const A = Arows.map((r, i) => r.map((v, j) => new Frac(BigInt(v), BigInt(1))).concat(new Frac(BigInt(brows[i]))));
  let prev = new Frac(1n);

  for (let k = 0; k < n - 1; k++) {
    if (A[k][k].isZero()) {
      // Partial pivoting on exact values: pick the largest magnitude available.
      let piv = -1, best = new Frac(0n);
      for (let i = k; i < n; i++) {
        const m = absFrac(A[i][k]);
        if (m.n * best.d > best.n * m.d) { best = m; piv = i; }
      }
      if (piv < 0 || best.isZero()) throw new Error('exact: matrix is singular');
      [A[k], A[piv]] = [A[piv], A[k]];
    }
    for (let i = k + 1; i < n; i++) {
      for (let j = k + 1; j <= n; j++) {
        A[i][j] = A[i][j].mul(A[k][k]).sub(A[i][k].mul(A[k][j])).div(prev);
      }
      A[i][k] = new Frac(0n);
    }
    prev = A[k][k];
  }
  const x = new Array(n);
  for (let i = n - 1; i >= 0; i--) {
    let acc = A[i][n];
    for (let j = i + 1; j < n; j++) acc = acc.sub(A[i][j].mul(x[j]));
    x[i] = acc.div(A[i][i]);
  }
  return x;
}

/** Exact forward error: max_i |computed_i - exact_i| / max_i |exact_i|, from BigInts. */
export function exactRelativeError(computed, exact) {
  let worst = new Frac(0n);
  let scale = new Frac(0n);
  for (const e of exact) {
    const m = absFrac(e);
    if (m.n * scale.d > scale.n * m.d) scale = m;
  }
  if (scale.isZero()) return worst;
  for (let i = 0; i < exact.length; i++) {
    const d = new Frac(BigInt(computed[i])).sub(exact[i]);
    const r = absFrac(d).div(scale);
    if (r.n * worst.d > worst.n * r.d) worst = r;
  }
  return worst;
}

/**
 * Condition number in the 2-norm is expensive; for a precision study the quantity
 * that matters is how much the solution amplifies a perturbation, so the high-norm
 * estimate is enough and is labelled as an estimate rather than as cond_2.
 */
export function conditionEstimate(A) {
  const n = A.length;
  const absmax = Math.max(...A.flat().map(Math.abs));
  let amax = 0;
  for (let i = 0; i < n; i++) {
    const row = A[i].reduce((s, v) => s + Math.abs(v), 0);
    if (row > amax) amax = row;
  }
  return (n * absmax) / (amax || 1);
}

/**
 * Exact inverse as Frac columns, reusing the verified exact solver.
 *
 * Returns rationals rather than numbers on purpose. An earlier version converted
 * through Frac.toString(12) and the 12-digit truncation dominated the result, so the
 * inverse of an ill-conditioned matrix was quietly rounded to the point where its
 * condition number stopped growing with n. Anything that needs exactness must not
 * pass through a decimal string.
 */
export function exactInverse(A) {
  const n = A.length;
  const unit = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
  return Array.from({ length: n }, (_, j) => exactSolve(A, unit.map(r => r[j])));
}

/**
 * Sum of absolute values along a row — the infinity norm of a single row.
 *
 * This was a maximum of magnitudes, which is the infinity norm of nothing in
 * particular, and it made cond([[2,1],[1,2]]) come out as 4/3 instead of 3. The
 * largest entry and the sum of a row are different quantities.
 */
const rowInf = row => row.reduce((sum, f) => sum.add(absFrac(f)), new Frac(0n));

/**
 * Render a Frac for display.
 *
 * An earlier version normalised the mantissa by repeated BigInt division to keep the
 * conversion exact. It was longer than the arithmetic it wrapped, mixed a BigInt
 * exponent into a Number logarithm, and crashed. Exactness was never at risk here:
 * these values are only ever read, so the honest and obviously correct form is a
 * plain division. Anything that needs exactness must not pass through this.
 */
export const fracToNumber = f => {
  const v = Number(f.n) / Number(f.d);
  return Number.isFinite(v) ? v : (f.n < 0n ? -Infinity : Infinity);
};
export const fracToExponential = (f, digits = 3) => {
  const v = fracToNumber(f);
  return v === 0 ? '0' : v.toExponential(digits);
};


/**
 * Exact condition number in the infinity norm: ||A||_inf · ||A^-1||_inf.
 *
 * Deliberately exact rather than estimated. Earlier this study printed a "growth"
 * figure and called it a conditioning indicator; it is not one — Hilbert matrices
 * have minimal pivot growth and are still the worst-conditioned systems in common
 * use, and a large diagonal made the ratio collapse to 1. The number here is the
 * definition, computed in rational arithmetic, so it can settle the argument.
 */
export function condInfExact(A) {
  // The infinity norm is the largest *row* sum, so the matrix has to be reduced row
  // by row first; handing the matrix itself to rowInf silently iterated over rows as
  // if they were scalars.
  const matrixInf = M => M.reduce((best, r) => {
    const s = rowInf(r);
    return s.n * best.d > best.n * s.d ? s : best;
  }, new Frac(0n));
  const normA = matrixInf(A.map(r => r.map(v => new Frac(BigInt(v)))));
  const normInv = matrixInf(exactInverse(A));
  return normA.mul(normInv);
}
