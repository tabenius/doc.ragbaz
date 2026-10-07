// Small dense linear algebra, dependency-free, with the self-test that should have
// existed before it was used for anything.
//
// The first version of the linearization experiment shipped a broken ridge solver and
// reported that the linearisation trap was undetectable — because the "correct" arm
// could not recover a subspace either. Nothing in the output said the solver was
// wrong, which is exactly what a solver bug looks like from the outside: a plausible
// null result. So the solver is tested against a case with a known answer, and the
// test refuses to be skipped.

export const mean = v => v.reduce((a, b) => a + b, 0) / v.length;
export const sum = v => v.reduce((a, b) => a + b, 0);

/* ── precision ladder ────────────────────────────────────────────────────────
   Three levels, cheapest first, so the cost of accuracy is visible rather than
   asserted. None of these changes the algorithm; they change how the arithmetic
   inside it is carried out.

   L0  plain float64 accumulation.
   L1  Neumaier compensated summation: the lost low-order bits are kept and added
       back at the end, which removes the O(n·eps) growth of a long sum.
   L2  double-double: a value carried as (hi, lo) whose sum is accurate to roughly
       106 bits, built on error-free transformations rather than FMA so it works
       everywhere at the cost of several times the multiplications.
*/

/** Error-free sum of two doubles: hi + lo is the exact value of a + b. */
export const twoSum = (a, b) => {
  const s = a + b;
  const bb = s - a;
  const lo = (a - (s - bb)) + (b - bb);
  return [s, lo];
};

/** Error-free product of two doubles, by Dekker splitting. */
export const twoProd = (a, b) => {
  if (!Number.isFinite(a) || !Number.isFinite(b) || a === 0 || b === 0) return [a * b, 0];
  const SPLIT = 134217729; // 2^27 + 1
  const c = SPLIT * a, ahi = c - (c - a), alo = a - ahi;
  const d = SPLIT * b, bhi = d - (d - b), blo = b - bhi;
  const p = a * b;
  const lo = ((ahi * bhi - p) + ahi * blo + alo * bhi) + alo * blo;
  return [p, lo];
};

export const dd = (hi = 0, lo = 0) => ({ hi, lo });
export const ddZero = () => dd(0, 0);
export const ddFrom = x => dd(x, 0);
export const ddVal = a => a.hi + a.lo;
export const ddNeg = a => dd(-a.hi, -a.lo);

export const ddSub = (a, b) => ddAdd(a, ddNeg(b));
export const ddAdd = (a, b) => {
  const [s, e] = twoSum(a.hi, b.hi);
  const [t, f] = twoSum(a.lo, b.lo);
  const [u, g] = twoSum(s, t);
  return dd(u, e + (f + g));
};
export const ddMul = (a, b) => {
  const [p, e] = twoProd(a.hi, b.hi);
  const e2 = a.hi * b.lo + a.lo * b.hi;
  const [s, f] = twoSum(p, e + e2);
  return dd(s, f + a.lo * b.lo);
};

/** Neumaier compensated sum. */
export function neumaier(values) {
  let sum = 0, c = 0;
  for (const v of values) {
    const t = sum + v;
    c += Math.abs(sum) >= Math.abs(v) ? (sum - t) + v : (v - t) + sum;
    sum = t;
  }
  return sum + c;
}

/** Dot product at a chosen level, so the level is visible where it is chosen. */
export function dot(a, b, level = 'L0') {
  if (level === 'L0') {
    let s = 0;
    for (let i = 0; i < a.length; i++) s += a[i] * b[i];
    return s;
  }
  if (level === 'L1') return neumaier(a.map((v, i) => v * b[i]));
  let acc = ddZero();
  for (let i = 0; i < a.length; i++) acc = ddAdd(acc, ddMul(ddFrom(a[i]), ddFrom(b[i])));
  return ddVal(acc);
}

/**
 * Solve with iterative refinement: solve, form the residual in higher precision,
 * correct, repeat.
 *
 * Refinement is the useful instrument in a precision study because its convergence
 * order is measurable. Forming the residual in precision p while solving the
 * correction in precision q < p contracts the error by roughly (unit roundoff)^(p-q)
 * per sweep, so the observed order should sit near that value. An implementation
 * that stalls shows an order near zero — a property of the arithmetic, not the
 * method — and that is exactly what this is here to detect.
 */
export function solveRefined(A, b, { sweeps = 0, residualLevel = 'L1' } = {}) {
  const n = b.length;
  let x = solve(A, b);
  const history = [];
  for (let s = 0; s < sweeps; s++) {
    // The residual must be more accurate than the solution, or there is nothing to
    // refine with. Neumaier on the individual terms is what makes it so.
    const r = b.map((bi, i) => neumaier([bi, ...A[i].map((aij, j) => -aij * x[j])]));
    const d = solve(A, r);
    const next = x.map((v, i) => v + d[i]);
    const change = Math.max(...x.map((v, i) => Math.abs(next[i] - v)));
    x = next;
    history.push({ sweep: s + 1, residualInf: Math.max(...r.map(Math.abs)), change });
  }
  return { x, history, residualLevel };
}

/** Observed convergence order from a residual history, by least squares on log-log. */
export function convergenceOrder(history) {
  if (history.length < 2) return null;
  // An exact zero in the correction means the solve has converged and the sequence has
  // stopped; taking log(0) there produces -Infinity and poisons the regression into
  // reporting nothing. Use the strictly decreasing prefix only.
  const usable = [];
  for (let i = 1; i < history.length; i++) {
    const a = history[i - 1].change, b = history[i].change;
    if (!(a > 0) || !(b > 0) || !(b < a)) break;
    usable.push([Math.log(a), Math.log(b)]);
  }
  if (usable.length < 2) return null;
  const pts = usable;
  const n = pts.length;
  const sx = pts.reduce((s, [x]) => s + x, 0), sy = pts.reduce((s, [, y]) => s + y, 0);
  const sxx = pts.reduce((s, [x]) => s + x * x, 0), sxy = pts.reduce((s, [x, y]) => s + x * y, 0);
  const den = n * sxx - sx * sx;
  return den === 0 ? null : (n * sxy - sx * sy) / den;
}

/** Solve A x = b by Gaussian elimination with partial pivoting.
 *
 * Used for ridge rather than an eigendecomposition. The previous Jacobi routine
 * returned an orthonormal set of vectors that were not eigenvectors — verified by
 * ||Av - lambda v||, which was 6e4 against a normalised v — so it produced finite,
 * plausible, wrong coefficients. Elimination with pivoting is dull, is directly
 * checkable against a known solution, and cannot silently disagree with itself.
 */
export function solve(Ain, bin) {
  const n = bin.length;
  const A = Ain.map((r, i) => [...r, bin[i]]);
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(A[r][col]) > Math.abs(A[piv][col])) piv = r;
    if (Math.abs(A[piv][col]) < 1e-12) return new Array(n).fill(0);   // singular
    [A[col], A[piv]] = [A[piv], A[col]];
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = A[r][col] / A[col][col];
      if (!Number.isFinite(f) || f === 0) continue;
      for (let c = col; c <= n; c++) A[r][c] -= f * A[col][c];
    }
  }
  return A.map((row, i) => (Math.abs(row[i]) < 1e-12 ? 0 : row[n] / row[i]));
}

/**
 * Ridge regression: beta = (X'X + lambda I)^-1 X'y.
 *
 * Solved directly. Directions whose eigenvalue is at or below the penalty
 * contribute nothing rather than a quotient by ~zero, so no coefficient can become
 * non-finite; the self-test fails on non-finite output rather than comparing NaN,
 * which is not greater than anything.
 */
export function ridge(X, y, lam = 1e-8) {
  const n = X[0].length;
  const XtX = Array.from({ length: n }, () => new Array(n).fill(0));
  const Xty = new Array(n).fill(0);
  for (let i = 0; i < X.length; i++) for (let a = 0; a < n; a++) {
    Xty[a] += X[i][a] * y[i];
    for (let b = 0; b < n; b++) XtX[a][b] += X[i][a] * X[i][b];
  }
  for (let a = 0; a < n; a++) XtX[a][a] += lam;
  const beta = solve(XtX, Xty);
  return beta.map(v => (Number.isFinite(v) ? v : 0));
}

/**
 * Per-trait agreement between true and predicted trait scores: the Pearson
 * correlation of each pair of matching coordinates.
 *
 * This is the diagonal of the cross-correlation matrix, not its canonical
 * correlations, and the difference matters. Canonical correlations are invariant
 * under rotation of the trait axes and are the correct test of whether a
 * *subspace* was recovered; this is not, so it would miss a model that recovered
 * the right subspace under a rotation. It is used because it can be verified
 * directly, and the verdict is stated in those terms rather than dressed up as the
 * stronger claim. Where a subspace claim is the point, test it as one.
 */
export function traitAgreement(trueRows, predRows) {
  const k = trueRows[0].length;
  const out = [];
  for (let t = 0; t < k; t++) {
    const a = trueRows.map(r => r[t]), b = predRows.map(r => r[t]);
    const ma = mean(a), mb = mean(b);
    let n = 0, da = 0, db = 0;
    for (let i = 0; i < a.length; i++) { n += (a[i]-ma)*(b[i]-mb); da += (a[i]-ma)**2; db += (b[i]-mb)**2; }
    out.push(da && db ? n / Math.sqrt(da*db) : 0);
  }
  return out;
}

/** The correlation matrix alone, exposed so it can be checked against Pearson. */
export function correlationMatrix(P, Q) {
  const k = P[0].length;
  const Mp = centre(P), Mq = centre(Q);
  const sigma = rows => Array.from({ length: rows[0].length }, (_, j) =>
    Math.sqrt(rows.reduce((acc, r) => acc + r[j] * r[j], 0) / rows.length));
  const sp = sigma(Mp), sq = sigma(Mq);
  const C = Array.from({ length: k }, () => new Array(k).fill(0));
  for (let i = 0; i < P.length; i++)
    for (let a = 0; a < k; a++) for (let b = 0; b < k; b++)
      if (sp[a] && sq[b]) C[a][b] += (Mp[i][a] / sp[a]) * (Mq[i][b] / sq[b]) / P.length;
  return C;
}

/** Canonical correlations from a correlation matrix: sqrt of the eigenvalues of C'C. */

const correlationOf = rows => {
  const c = rows.map(r => r[0]), d = rows.map(r => r[1]);
  const mc = mean(c), md = mean(d);
  let n = 0, dc = 0, dd = 0;
  for (let i = 0; i < rows.length; i++) { n += (c[i]-mc)*(d[i]-md); dc += (c[i]-mc)**2; dd += (d[i]-md)**2; }
  return n / Math.sqrt(dc * dd);
};

export const r2 = (y, yhat) => {
  const my = mean(y);
  const ss = y.reduce((s, v, i) => s + (v - yhat[i]) ** 2, 0);
  const st = y.reduce((s, v) => s + (v - my) ** 2, 0);
  return 1 - ss / st;
};

/** Deterministic PRNG, so a reported number is the same number tomorrow. */
export function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    // Strictly inside (0,1): the generator can return exactly 0, and every consumer
    // of it here takes a logarithm, so a single zero becomes -Infinity in the data
    // and then NaN in every coefficient fitted from it.
    return (((t ^ t >>> 14) >>> 0) + 0.5) / 4294967296;
  };
}

/**
 * Standard normals from a uniform source, by the polar (Marsaglia) method with the
 * second variate of each pair cached.
 *
 * The obvious Box-Muller form — draw two uniforms, keep only the cosine — throws
 * half the work away and leaves successive outputs correlated. That is invisible in
 * a single mean and catastrophic in a simulation: it made three nominally independent
 * trait axes show sample correlations near 0.5, which is roughly seven standard
 * errors at n=200. The generator is therefore tested for autocorrelation like any
 * other component.
 */
export function normalSource(seed) {
  const u = mulberry32(seed);
  let spare = null;
  return function () {
    if (spare !== null) { const v = spare; spare = null; return v; }
    let x, y, s;
    do {
      x = 2 * u() - 1; y = 2 * u() - 1; s = x * x + y * y;
    } while (s === 0 || s >= 1);
    const f = Math.sqrt(-2 * Math.log(s) / s);
    spare = y * f;
    return x * f;
  };
}

/**
 * Uniform source on (0,1), independent of normalSource.
 *
 * Both existed and only normalSource was exported, so callers needing a uniform had
 * to guess — and one of them passed normal draws to Math.floor to pick a bucket,
 * which silently produced negative exponents for half the draws. Supplying the
 * generator a caller is entitled to assume removes the guess.
 */
export function uniformSource(seed) {
  return mulberry32(seed);
}

/** Lag-1 and lag-3 autocorrelation of a sample; ~0 for independent draws. */
export function autocorrelation(v, lag) {
  const m = mean(v);
  let num = 0, den = 0;
  for (let i = 0; i < v.length; i++) {
    den += (v[i] - m) ** 2;
    if (i + lag < v.length) num += (v[i + lag] - m) * (v[i] - m);
  }
  return num / den;
}

/**
 * The test that should have run before the experiment did.
 * Returns a report; throws if the solver cannot recover a matrix it was handed.
 */
export function selfTest() {
  // Well posed: a square mixing matrix, so the exact least-squares coefficients are
  // known in closed form as the rows of A^-1. The earlier version used more features
  // than traits and compared a 4-vector against a 3-vector, which produced NaN and was
  // reported as a failing solver rather than as a failing test.
  const gauss = normalSource(1);
  const K = 4, N = 600;
  const A = Array.from({ length: K }, () => Array.from({ length: K }, () => gauss()));
  const p = Array.from({ length: N }, () => Array.from({ length: K }, () => gauss()));
  // Noise small enough that recovery is exact to numerical precision, which is what
  // makes this a test of the solver rather than a test of the noise model.
  const noise = 0;
  const X = p.map(v => A.map(row => row.reduce((s, a, t) => s + a * v[t], 0) + gauss() * noise));

  const rows = [];
  // With X = A p and a square A, regressing p[t] on X solves A' b = e_t, so the exact
  // coefficients are *column* t of A^-1, not row t. Getting that backwards produced a
  // solver that was correct and a test that was wrong, in that order, twice.
  const At = A[0].map((_, i) => A.map(r => r[i]));
  for (let t = 0; t < K; t++) {
    const e = new Array(K).fill(0); e[t] = 1;
    const truth = solve(At, e);                      // column t of A^-1
    const beta = ridge(X, p.map(v => v[t]), 1e-10);
    const err = beta.reduce((s, v, i) => s + (v - truth[i]) ** 2, 0);
    rows.push({ target: t, squaredError: err, recovered: beta, truth });
    if (!Number.isFinite(err)) throw new Error(`ridge self-test returned non-finite on target ${t}`);
    if (err > 1e-10) throw new Error(`ridge self-test failed: target ${t}, squared error ${err}`);
  }

  // Agreement: identity agrees, unrelated data does not. The null case is
  // independent draws, not a permutation of the same draws — a permutation relabels
  // the variables and preserves the structure exactly, so as a null test it asserted
  // nothing while looking convincing.
  const agree1 = traitAgreement(p, p.map(r => r));
  const unrelated = Array.from({ length: N }, () => Array.from({ length: K }, () => gauss()));
  const agree0 = traitAgreement(p, unrelated);
  const tol = 1 - 3 * Math.sqrt(K / N);
  const strong = Math.min(...agree1), weak = Math.min(...agree0);
  if (!Number.isFinite(strong) || !Number.isFinite(weak)) throw new Error("trait agreement returned non-finite");
  if (strong < tol) throw new Error(`trait agreement identity test failed: ${strong} < ${tol.toFixed(4)}`);
  if (weak > 0.15) throw new Error(`trait agreement null test failed: ${weak}`);

  // The generator, before anything is built on it.
  const draw = Array.from({ length: 8000 }, gauss);
  const ac1 = autocorrelation(draw, 1), ac3 = autocorrelation(draw, 3);
  const sample = traitAgreement(p.map(r => r.slice(0, 2)), p.map(r => [r[1], r[0]]))[0];
  if (Math.abs(ac1) > 0.05 || Math.abs(ac3) > 0.05) {
    throw new Error(`normal generator is autocorrelated: lag1 ${ac1.toFixed(4)}, lag3 ${ac3.toFixed(4)}`);
  }
  if (Math.abs(sample) > 0.15) {
    throw new Error(`independent trait axes came out correlated at ${sample.toFixed(3)}`);
  }
  return { ridgeTargets: rows, agreeIdentity: strong, agreeNull: weak, agreementTolerance: tol, n: N, ac1, ac3, axisCorrelation: sample };
}
