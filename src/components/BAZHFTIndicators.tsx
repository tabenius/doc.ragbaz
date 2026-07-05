import { useState, useMemo } from 'react';

const mono = 'ui-monospace, SFMono-Regular, "Intel One Mono", monospace';

// ─── Seeded deterministic mock data ─────────────────────────────────────────
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function mockPrices(n: number, seed = 7, base = 142, vol = 1.4): number[] {
  const rand = lcg(seed);
  const prices: number[] = [base];
  for (let i = 1; i < n; i++) {
    const drift = 0.04;
    const shock = (rand() - 0.49) * vol;
    prices.push(Math.max(base * 0.6, prices[i - 1] + drift + shock));
  }
  return prices;
}

function mockVolumes(n: number, seed = 13): number[] {
  const rand = lcg(seed);
  return Array.from({ length: n }, () => 200 + rand() * 800);
}

// ─── Technical computations ─────────────────────────────────────────────────
function sma(data: number[], period: number): number[] {
  return data.map((_, i) => {
    if (i < period - 1) return NaN;
    let s = 0;
    for (let j = i - period + 1; j <= i; j++) s += data[j];
    return s / period;
  });
}

function ema(data: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const result: number[] = new Array(data.length).fill(NaN);
  let prev = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result[period - 1] = prev;
  for (let i = period; i < data.length; i++) {
    prev = data[i] * k + prev * (1 - k);
    result[i] = prev;
  }
  return result;
}

function rsiCalc(data: number[], period = 14): number[] {
  const result: number[] = new Array(data.length).fill(NaN);
  if (data.length < period + 1) return result;
  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const d = data[i] - data[i - 1];
    if (d > 0) avgGain += d; else avgLoss += -d;
  }
  avgGain /= period; avgLoss /= period;
  result[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  for (let i = period + 1; i < data.length; i++) {
    const d = data[i] - data[i - 1];
    const g = d > 0 ? d : 0, l = d < 0 ? -d : 0;
    avgGain = (avgGain * (period - 1) + g) / period;
    avgLoss = (avgLoss * (period - 1) + l) / period;
    result[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return result;
}

function macdCalc(data: number[], fast = 12, slow = 26, signal = 9): { macd: number[]; signal: number[]; hist: number[] } {
  const fastEma = ema(data, fast);
  const slowEma = ema(data, slow);
  const macdLine = data.map((_, i) =>
    isNaN(fastEma[i]) || isNaN(slowEma[i]) ? NaN : fastEma[i] - slowEma[i]
  );
  const validFrom = slow - 1;
  const signalLine: number[] = new Array(data.length).fill(NaN);
  const k = 2 / (signal + 1);
  let prev = macdLine.slice(validFrom, validFrom + signal).reduce((a, b) => a + b, 0) / signal;
  signalLine[validFrom + signal - 1] = prev;
  for (let i = validFrom + signal; i < data.length; i++) {
    prev = macdLine[i] * k + prev * (1 - k);
    signalLine[i] = prev;
  }
  const hist = macdLine.map((v, i) =>
    isNaN(v) || isNaN(signalLine[i]) ? NaN : v - signalLine[i]
  );
  return { macd: macdLine, signal: signalLine, hist };
}

function stochasticCalc(highs: number[], lows: number[], closes: number[], k = 14, d = 3): { k: number[]; d: number[] } {
  const kLine: number[] = closes.map((_, i) => {
    if (i < k - 1) return NaN;
    const h = Math.max(...highs.slice(i - k + 1, i + 1));
    const l = Math.min(...lows.slice(i - k + 1, i + 1));
    return h === l ? 50 : ((closes[i] - l) / (h - l)) * 100;
  });
  const dLine = sma(kLine.map(v => isNaN(v) ? 0 : v), d).map((v, i) => i < k + d - 2 ? NaN : v);
  return { k: kLine, d: dLine };
}

function bollingerCalc(data: number[], period = 20, mult = 2): { mid: number[]; upper: number[]; lower: number[] } {
  const mid = sma(data, period);
  const upper: number[] = [];
  const lower: number[] = [];
  data.forEach((_, i) => {
    if (i < period - 1) { upper.push(NaN); lower.push(NaN); return; }
    const slice = data.slice(i - period + 1, i + 1);
    const mean = mid[i];
    const stddev = Math.sqrt(slice.reduce((a, v) => a + (v - mean) ** 2, 0) / period);
    upper.push(mean + mult * stddev);
    lower.push(mean - mult * stddev);
  });
  return { mid, upper, lower };
}

// ─── Last-valid helper (replaces Array.prototype.findLast for older targets) ─
function lastValid(arr: number[], fallback: number): number {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (!isNaN(arr[i])) return arr[i];
  }
  return fallback;
}

// ─── SVG helpers ────────────────────────────────────────────────────────────
function toPath(xs: number[], ys: number[], W: number, H: number,
  xMin: number, xMax: number, yMin: number, yMax: number): string {
  const pts = xs.map((x, i) => {
    const px = ((x - xMin) / (xMax - xMin)) * W;
    const py = H - ((ys[i] - yMin) / (yMax - yMin)) * H;
    return `${px.toFixed(1)},${py.toFixed(1)}`;
  }).filter((_, i) => !isNaN(ys[i]));
  if (!pts.length) return '';
  return 'M' + pts.join('L');
}

// ─── PriceChart ─────────────────────────────────────────────────────────────
export function BAZHFTPriceChart({
  seed = 7, bars = 60, showSMA20 = true, showSMA50 = true, showBB = true,
}: {
  seed?: number; bars?: number; showSMA20?: boolean; showSMA50?: boolean; showBB?: boolean;
}) {
  const prices = useMemo(() => mockPrices(bars, seed), [bars, seed]);
  const sm20 = useMemo(() => sma(prices, 20), [prices]);
  const sm50 = useMemo(() => sma(prices, 50), [prices]);
  const bb = useMemo(() => bollingerCalc(prices, 20), [prices]);

  const xs = prices.map((_, i) => i);
  const validPrices = prices.filter(p => !isNaN(p));
  const yMin = Math.min(...validPrices, ...(showBB ? bb.lower.filter(v => !isNaN(v)) : [])) * 0.99;
  const yMax = Math.max(...validPrices, ...(showBB ? bb.upper.filter(v => !isNaN(v)) : [])) * 1.01;
  const W = 600, H = 180;

  const current = prices[prices.length - 1];
  const prev = prices[prices.length - 2];
  const chg = ((current - prev) / prev) * 100;
  const bullish = chg >= 0;

  function line(data: number[], color: string, width = 1.5, dash?: string) {
    const valid = xs.filter((_, i) => !isNaN(data[i]));
    if (!valid.length) return null;
    const d = toPath(valid, valid.map(i => data[i]), W, H, 0, bars - 1, yMin, yMax);
    return <path d={d} stroke={color} strokeWidth={width} fill="none"
      strokeDasharray={dash} vectorEffect="non-scaling-stroke" />;
  }

  const bbArea = bb.upper.map((_, i) => {
    if (isNaN(bb.upper[i]) || isNaN(bb.lower[i])) return null;
    return i;
  }).filter(Boolean) as number[];

  const bbTopPath = toPath(bbArea, bbArea.map(i => bb.upper[i]), W, H, 0, bars - 1, yMin, yMax);
  const bbBotPath = toPath(bbArea, bbArea.map(i => bb.lower[i]), W, H, 0, bars - 1, yMin, yMax);
  const bbFill = bbTopPath && bbBotPath
    ? `${bbTopPath}L${bbBotPath.substring(1).split('L').reverse().join('L')}Z`
    : '';

  const pricePath = toPath(xs, prices, W, H, 0, bars - 1, yMin, yMax);

  return (
    <div style={{ background: '#0f0f10', border: '1px solid #2a2a2a', borderRadius: 6, overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #2a2a2a', flexWrap: 'wrap', gap: 6 }}>
        <span style={{ fontFamily: mono, fontSize: 11, color: '#f3c46c', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          BAZ/USD · 1H
        </span>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 700, color: bullish ? '#b8bb26' : '#fb4934' }}>
            {current.toFixed(2)}
          </span>
          <span style={{ fontFamily: mono, fontSize: 11, color: bullish ? '#b8bb26' : '#fb4934' }}>
            {bullish ? '+' : ''}{chg.toFixed(2)}%
          </span>
          {showBB && <span style={{ fontFamily: mono, fontSize: 10, color: '#7ab8ff', background: '#122230', borderRadius: 3, padding: '1px 5px', border: '1px solid #7ab8ff44' }}>BB20</span>}
          {showSMA20 && <span style={{ fontFamily: mono, fontSize: 10, color: '#fe8019', background: '#1a1208', borderRadius: 3, padding: '1px 5px', border: '1px solid #fe801944' }}>SMA20</span>}
          {showSMA50 && <span style={{ fontFamily: mono, fontSize: 10, color: '#d3869b', background: '#1e1218', borderRadius: 3, padding: '1px 5px', border: '1px solid #d3869b44' }}>SMA50</span>}
        </div>
      </div>
      <div style={{ width: '100%', overflow: 'hidden' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }} preserveAspectRatio="none">
          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map(f => (
            <line key={f} x1={0} y1={H * f} x2={W} y2={H * f}
              stroke="#2a2a2a" strokeWidth={0.5} />
          ))}
          {/* Bollinger band fill */}
          {showBB && bbFill && <path d={bbFill} fill="#7ab8ff08" />}
          {/* Bollinger bands */}
          {showBB && line(bb.upper, '#7ab8ff44', 1)}
          {showBB && line(bb.lower, '#7ab8ff44', 1)}
          {showBB && line(bb.mid, '#7ab8ff', 1, '3 3')}
          {/* SMAs */}
          {showSMA50 && line(sm50, '#d3869b', 1.5)}
          {showSMA20 && line(sm20, '#fe8019', 1.5)}
          {/* Price line */}
          <path d={pricePath + `L${((bars - 1) / (bars - 1)) * W},${H}L0,${H}Z`}
            fill={bullish ? '#b8bb2608' : '#fb493408'} />
          <path d={pricePath} stroke={bullish ? '#b8bb26' : '#fb4934'} strokeWidth={2}
            fill="none" vectorEffect="non-scaling-stroke" />
          {/* Current price line */}
          <line x1={0} y1={H - ((current - yMin) / (yMax - yMin)) * H}
            x2={W} y2={H - ((current - yMin) / (yMax - yMin)) * H}
            stroke={bullish ? '#b8bb2666' : '#fb493466'} strokeWidth={0.5} strokeDasharray="4 4" />
        </svg>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 12px', borderTop: '1px solid #1a1a1a' }}>
        <span style={{ fontFamily: mono, fontSize: 9, color: '#4a4744' }}>T-{bars}h</span>
        <span style={{ fontFamily: mono, fontSize: 9, color: '#4a4744' }}>NOW</span>
      </div>
    </div>
  );
}

// ─── RSI Gauge ──────────────────────────────────────────────────────────────
export function BAZHFTRSIGauge({
  value, label = 'RSI·14', size = 100,
}: { value: number; label?: string; size?: number }) {
  const clamped = Math.max(0, Math.min(100, isNaN(value) ? 50 : value));
  const pct = clamped / 100;
  const r = 36, cx = 50, cy = 50;
  const startAngle = -220 * (Math.PI / 180);
  const sweep = 260 * (Math.PI / 180);
  const circumference = r * sweep;

  const color = clamped > 70 ? '#fb4934' : clamped < 30 ? '#b8bb26' : '#f3c46c';
  const zone = clamped > 70 ? 'overbought' : clamped < 30 ? 'oversold' : 'neutral';

  function arcPath(from: number, to: number, radius: number) {
    const sa = startAngle + from * sweep;
    const ea = startAngle + to * sweep;
    const x1 = cx + radius * Math.cos(sa), y1 = cy + radius * Math.sin(sa);
    const x2 = cx + radius * Math.cos(ea), y2 = cy + radius * Math.sin(ea);
    const large = (to - from) * sweep > Math.PI ? 1 : 0;
    return `M${x1},${y1} A${radius},${radius} 0 ${large} 1 ${x2},${y2}`;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 0' }}>
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
        {/* Track */}
        <path d={arcPath(0, 1, r)} stroke="#2a2a2a" strokeWidth={6} fill="none" strokeLinecap="round" />
        {/* Zones */}
        <path d={arcPath(0, 0.3, r)} stroke="#b8bb2622" strokeWidth={6} fill="none" />
        <path d={arcPath(0.7, 1, r)} stroke="#fb493422" strokeWidth={6} fill="none" />
        {/* Value arc */}
        {pct > 0 && <path d={arcPath(0, pct, r)} stroke={color} strokeWidth={6} fill="none" strokeLinecap="round" />}
        {/* Zone labels */}
        <text x={cx - r - 2} y={cy + 10} textAnchor="end" fontSize="7" fill="#b8bb26" fontFamily={mono}>30</text>
        <text x={cx + r + 2} y={cy + 10} textAnchor="start" fontSize="7" fill="#fb4934" fontFamily={mono}>70</text>
        {/* Center value */}
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize="18" fontWeight="700"
          fill={color} fontFamily={mono}>{Math.round(clamped)}</text>
      </svg>
      <span style={{ fontFamily: mono, fontSize: 9, color: '#9e9487', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
      <span style={{ fontFamily: mono, fontSize: 8, color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{zone}</span>
    </div>
  );
}

// ─── Oscillator Bar ──────────────────────────────────────────────────────────
export function BAZHFTOscillatorBar({
  label, value, min = 0, max = 100, overdone = { low: 20, high: 80 },
}: {
  label: string; value: number; min?: number; max?: number;
  overdone?: { low: number; high: number };
}) {
  const clamped = Math.max(min, Math.min(max, isNaN(value) ? (min + max) / 2 : value));
  const pct = (clamped - min) / (max - min);
  const lowPct = (overdone.low - min) / (max - min);
  const highPct = (overdone.high - min) / (max - min);
  const color = pct > highPct ? '#fb4934' : pct < lowPct ? '#b8bb26' : '#f3c46c';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontFamily: mono, fontSize: 10, color: '#9e9487', minWidth: 80, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, position: 'relative', height: 8, background: '#1a1a1a', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: `${lowPct * 100}%`, width: `${(highPct - lowPct) * 100}%`, height: '100%', background: '#2a2a2a' }} />
        <div style={{
          position: 'absolute', left: 0, width: `${pct * 100}%`, height: '100%',
          background: color, borderRadius: 4, transition: 'width 0.3s ease',
        }} />
      </div>
      <span style={{ fontFamily: mono, fontSize: 10, color, minWidth: 36, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
        {clamped.toFixed(1)}
      </span>
    </div>
  );
}

// ─── MACD Panel ──────────────────────────────────────────────────────────────
export function BAZHFTMACDPanel({ seed = 7, bars = 60 }: { seed?: number; bars?: number }) {
  const prices = useMemo(() => mockPrices(bars, seed), [bars, seed]);
  const { macd, signal, hist } = useMemo(() => macdCalc(prices), [prices]);

  const validHist = hist.filter(v => !isNaN(v));
  if (!validHist.length) return null;

  const W = 600, H = 80;
  const histMax = Math.max(...validHist.map(Math.abs)) * 1.1;
  const yMid = H / 2;

  return (
    <div style={{ background: '#0f0f10', border: '1px solid #2a2a2a', borderRadius: 6, overflow: 'hidden' }}>
      <div style={{ padding: '6px 12px', borderBottom: '1px solid #1a1a1a', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontFamily: mono, fontSize: 10, color: '#f3c46c', textTransform: 'uppercase', letterSpacing: '0.1em' }}>MACD</span>
        <span style={{ fontFamily: mono, fontSize: 9, color: '#9e9487' }}>12 / 26 / 9</span>
        <div style={{ display: 'flex', gap: 10, marginLeft: 'auto' }}>
          <span style={{ fontFamily: mono, fontSize: 9, color: '#7ab8ff' }}>── signal</span>
          <span style={{ fontFamily: mono, fontSize: 9, color: '#f3c46c' }}>── macd</span>
        </div>
      </div>
      <div style={{ width: '100%', overflow: 'hidden' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }} preserveAspectRatio="none">
          <line x1={0} y1={yMid} x2={W} y2={yMid} stroke="#2a2a2a" strokeWidth={0.5} />
          {hist.map((v, i) => {
            if (isNaN(v)) return null;
            const x = (i / (bars - 1)) * W;
            const barH = (Math.abs(v) / histMax) * (H / 2 - 2);
            const y = v >= 0 ? yMid - barH : yMid;
            const barW = Math.max(1, W / bars - 1);
            return (
              <rect key={i} x={x - barW / 2} y={y} width={barW} height={barH}
                fill={v >= 0 ? '#b8bb2644' : '#fb493444'} />
            );
          })}
          {/* MACD line */}
          <path d={toPath(
            hist.map((_, i) => i).filter(i => !isNaN(macd[i])),
            hist.map((_, i) => i).filter(i => !isNaN(macd[i])).map(i => macd[i]),
            W, H, 0, bars - 1, -histMax, histMax
          )} stroke="#f3c46c" strokeWidth={1.5} fill="none" vectorEffect="non-scaling-stroke" />
          {/* Signal line */}
          <path d={toPath(
            signal.map((_, i) => i).filter(i => !isNaN(signal[i])),
            signal.map((_, i) => i).filter(i => !isNaN(signal[i])).map(i => signal[i]),
            W, H, 0, bars - 1, -histMax, histMax
          )} stroke="#7ab8ff" strokeWidth={1.5} fill="none" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
    </div>
  );
}

// ─── Volume Chart ─────────────────────────────────────────────────────────────
export function BAZHFTVolumeChart({ seed = 7, bars = 60 }: { seed?: number; bars?: number }) {
  const prices = useMemo(() => mockPrices(bars, seed), [bars, seed]);
  const volumes = useMemo(() => mockVolumes(bars, seed + 5), [bars, seed]);
  const maxVol = Math.max(...volumes);
  const W = 600, H = 50;

  return (
    <div style={{ width: '100%', overflow: 'hidden' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }} preserveAspectRatio="none">
        {volumes.map((v, i) => {
          const x = (i / (bars - 1)) * W;
          const barH = (v / maxVol) * H;
          const barW = Math.max(1, W / bars - 1);
          const bullish = i > 0 ? prices[i] >= prices[i - 1] : true;
          return (
            <rect key={i} x={x - barW / 2} y={H - barH} width={barW} height={barH}
              fill={bullish ? '#b8bb2630' : '#fb493430'} />
          );
        })}
      </svg>
    </div>
  );
}

// ─── Full indicator suite ────────────────────────────────────────────────────
export function BAZHFTIndicatorSuite({ seed = 7 }: { seed?: number }) {
  const [bars, setBars] = useState(60);
  const bars8 = bars;

  const prices = useMemo(() => mockPrices(bars8, seed), [bars8, seed]);
  const rsiData = useMemo(() => rsiCalc(prices, 14), [prices]);
  const stoch = useMemo(() => stochasticCalc(prices, prices, prices, 14, 3), [prices]);
  const { macd, signal, hist } = useMemo(() => macdCalc(prices), [prices]);

  const rsiNow = lastValid(rsiData, 50);
  const stochK = lastValid(stoch.k, 50);
  const stochD = lastValid(stoch.d, 50);
  const macdNow = lastValid(macd, 0);
  const signalNow = lastValid(signal, 0);
  const histNow = lastValid(hist, 0);

  const sm20 = sma(prices, 20);
  const sm50 = sma(prices, Math.min(50, prices.length));
  const lastPrice = prices[prices.length - 1];
  const sma20Now = sm20[sm20.length - 1];
  const sma50Now = sm50[sm50.length - 1];

  const trendSignal = sma20Now > sma50Now ? 'bullish' : 'bearish';
  const rsiSignal = rsiNow > 70 ? 'sell' : rsiNow < 30 ? 'buy' : 'neutral';
  const macdSignal = histNow > 0 ? 'bullish' : 'bearish';

  const overallSignal: 'BUY' | 'SELL' | 'HOLD' =
    (trendSignal === 'bullish' && rsiSignal !== 'sell' && macdSignal === 'bullish') ? 'BUY' :
    (trendSignal === 'bearish' && rsiSignal !== 'buy' && macdSignal === 'bearish') ? 'SELL' : 'HOLD';

  const signalColor = overallSignal === 'BUY' ? '#b8bb26' : overallSignal === 'SELL' ? '#fb4934' : '#f3c46c';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: '16px 0', fontFamily: mono }}>
      {/* Header bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: '#121212', border: '1px solid #2a2a2a', borderRadius: 6,
        padding: '10px 14px', flexWrap: 'wrap', gap: 8,
      }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#f3c46c', letterSpacing: '0.08em' }}>BAZ.HFT · INDICATOR SUITE</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {[30, 60, 90].map(n => (
              <button key={n} onClick={() => setBars(n)}
                style={{
                  fontSize: 9, padding: '2px 7px', cursor: 'pointer', borderRadius: 3,
                  background: bars === n ? '#2a1d12' : 'transparent',
                  border: `1px solid ${bars === n ? '#f3c46c' : '#3a3735'}`,
                  color: bars === n ? '#f3c46c' : '#737373',
                }}>{n}H</button>
            ))}
          </div>
        </div>
        <div style={{
          padding: '4px 14px', borderRadius: 4, border: `2px solid ${signalColor}`,
          background: `${signalColor}18`,
          fontSize: 12, fontWeight: 700, color: signalColor, letterSpacing: '0.12em',
        }}>{overallSignal}</div>
      </div>

      {/* Price chart */}
      <BAZHFTPriceChart seed={seed} bars={bars} />

      {/* Volume */}
      <div style={{ background: '#0f0f10', border: '1px solid #2a2a2a', borderRadius: 6, overflow: 'hidden', padding: '6px 12px' }}>
        <div style={{ fontSize: 9, color: '#4a4744', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Volume</div>
        <BAZHFTVolumeChart seed={seed} bars={bars} />
      </div>

      {/* Oscillators row — responsive grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
        {/* RSI */}
        <div style={{ background: '#121212', border: '1px solid #2a2a2a', borderRadius: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0' }}>
          <BAZHFTRSIGauge value={rsiNow} label="RSI · 14" size={96} />
        </div>

        {/* Stochastic */}
        <div style={{ background: '#121212', border: '1px solid #2a2a2a', borderRadius: 6, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 10, color: '#f3c46c', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Stochastic 14/3</div>
          <BAZHFTOscillatorBar label="%K" value={stochK} overdone={{ low: 20, high: 80 }} />
          <BAZHFTOscillatorBar label="%D" value={stochD} overdone={{ low: 20, high: 80 }} />
        </div>

        {/* MACD readings */}
        <div style={{ background: '#121212', border: '1px solid #2a2a2a', borderRadius: 6, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 10, color: '#f3c46c', textTransform: 'uppercase', letterSpacing: '0.1em' }}>MACD 12/26/9</div>
          {[
            { label: 'MACD', value: macdNow, color: '#f3c46c' },
            { label: 'Signal', value: signalNow, color: '#7ab8ff' },
            { label: 'Hist', value: histNow, color: histNow >= 0 ? '#b8bb26' : '#fb4934' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1a1a1a', paddingBottom: 4 }}>
              <span style={{ fontSize: 10, color: '#737373' }}>{label}</span>
              <span style={{ fontSize: 11, color, fontVariantNumeric: 'tabular-nums' }}>{value.toFixed(3)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* MACD chart */}
      <BAZHFTMACDPanel seed={seed} bars={bars} />

      {/* Indicator table — responsive */}
      <div style={{ background: '#121212', border: '1px solid #2a2a2a', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ padding: '8px 12px', borderBottom: '1px solid #2a2a2a', fontSize: 10, color: '#f3c46c', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Indicator Summary
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: '#0f0f10' }}>
                {['Indicator', 'Period', 'Value', 'Signal'].map(h => (
                  <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: '#737373', fontWeight: 600, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'SMA', period: '20', value: sma20Now.toFixed(2), sig: lastPrice > sma20Now ? 'above' : 'below', sigColor: lastPrice > sma20Now ? '#b8bb26' : '#fb4934' },
                { name: 'SMA', period: '50', value: sma50Now.toFixed(2), sig: lastPrice > sma50Now ? 'above' : 'below', sigColor: lastPrice > sma50Now ? '#b8bb26' : '#fb4934' },
                { name: 'RSI', period: '14', value: rsiNow.toFixed(1), sig: rsiNow > 70 ? 'overbought' : rsiNow < 30 ? 'oversold' : 'neutral', sigColor: rsiNow > 70 ? '#fb4934' : rsiNow < 30 ? '#b8bb26' : '#f3c46c' },
                { name: 'Stoch %K', period: '14', value: stochK.toFixed(1), sig: stochK > 80 ? 'overbought' : stochK < 20 ? 'oversold' : 'neutral', sigColor: stochK > 80 ? '#fb4934' : stochK < 20 ? '#b8bb26' : '#f3c46c' },
                { name: 'MACD Hist', period: '12/26/9', value: histNow.toFixed(3), sig: histNow > 0 ? 'bullish' : 'bearish', sigColor: histNow > 0 ? '#b8bb26' : '#fb4934' },
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #1a1a1a', background: i % 2 === 0 ? 'transparent' : '#0a0a0a' }}>
                  <td style={{ padding: '7px 10px', color: '#d8c29d', whiteSpace: 'nowrap' }}>{row.name}</td>
                  <td style={{ padding: '7px 10px', color: '#737373', whiteSpace: 'nowrap' }}>{row.period}</td>
                  <td style={{ padding: '7px 10px', color: '#f3c46c', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{row.value}</td>
                  <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>
                    <span style={{ background: `${row.sigColor}18`, border: `1px solid ${row.sigColor}44`, borderRadius: 3, padding: '1px 6px', color: row.sigColor, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{row.sig}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Oscillator panel for Luna ────────────────────────────────────────────────
export function BAZLunaPhasePanel({ seed = 3 }: { seed?: number }) {
  const rand = lcg(seed);
  const phases = Array.from({ length: 28 }, (_, i) => {
    const phase = (i / 28) * 2 * Math.PI;
    return {
      label: `D${i + 1}`,
      signal: Math.sin(phase) + (rand() - 0.5) * 0.3,
      volume: 0.5 + Math.abs(Math.sin(phase)) * 0.5 + rand() * 0.2,
    };
  });

  const W = 600, H = 100;
  const vals = phases.map(p => p.signal);
  const yMin = Math.min(...vals) * 1.1, yMax = Math.max(...vals) * 1.1;

  return (
    <div style={{ background: '#0f0f10', border: '1px solid #2a2a2a', borderRadius: 6, overflow: 'hidden', margin: '12px 0' }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #1a1a1a', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontFamily: mono, fontSize: 10, color: '#d3869b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Signal timeline · 28-bar</span>
        <span style={{ fontFamily: mono, fontSize: 9, color: '#737373' }}>enriched oscillation · WS stream</span>
      </div>
      <div style={{ width: '100%', overflow: 'hidden' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }} preserveAspectRatio="none">
          <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke="#2a2a2a" strokeWidth={0.5} />
          {/* Signal fill */}
          <path d={
            toPath(phases.map((_, i) => i), vals, W, H, 0, 27, yMin, yMax) +
            `L${W},${H / 2}L0,${H / 2}Z`
          } fill="#d3869b10" />
          {/* Signal line */}
          <path d={toPath(phases.map((_, i) => i), vals, W, H, 0, 27, yMin, yMax)}
            stroke="#d3869b" strokeWidth={2} fill="none" vectorEffect="non-scaling-stroke" />
          {/* Phase markers */}
          {[0, 7, 14, 21].map(idx => (
            <g key={idx}>
              <line x1={(idx / 27) * W} y1={0} x2={(idx / 27) * W} y2={H}
                stroke="#3a2a18" strokeWidth={0.5} strokeDasharray="3 3" />
            </g>
          ))}
        </svg>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 12px', borderTop: '1px solid #1a1a1a', flexWrap: 'wrap', gap: 4 }}>
        {['T-28', 'T-21', 'T-14', 'T-7'].map((l) => (
          <span key={l} style={{ fontFamily: mono, fontSize: 9, color: '#4a4744' }}>{l}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Palantir data stream panel ───────────────────────────────────────────────
export function BAZPalantirStreamPanel({ seed = 11 }: { seed?: number }) {
  const rand = lcg(seed);
  const streams = [
    { label: 'market.tick', color: '#7ab8ff', values: Array.from({ length: 40 }, () => rand() * 100) },
    { label: 'order.flow', color: '#f3c46c', values: Array.from({ length: 40 }, () => rand() * 100) },
    { label: 'sentiment.nlp', color: '#b8bb26', values: Array.from({ length: 40 }, () => rand() * 100) },
    { label: 'risk.exposure', color: '#fb4934', values: Array.from({ length: 40 }, () => rand() * 100) },
  ];

  return (
    <div style={{ background: '#0f0f10', border: '1px solid #2a2a2a', borderRadius: 6, overflow: 'hidden', margin: '12px 0' }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #1a1a1a', fontFamily: mono, fontSize: 10, color: '#7ab8ff', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        Data Streams · Live Feed
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {streams.map(({ label, color, values }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px', borderBottom: '1px solid #1a1a1a' }}>
            <span style={{ fontFamily: mono, fontSize: 9, color, minWidth: 120, flexShrink: 0 }}>{label}</span>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <svg viewBox={`0 0 400 30`} style={{ width: '100%', display: 'block', height: 30 }} preserveAspectRatio="none">
                <path d={toPath(values.map((_, i) => i), values, 400, 30, 0, 39, 0, 100)}
                  stroke={color} strokeWidth={1.5} fill="none" vectorEffect="non-scaling-stroke" />
              </svg>
            </div>
            <span style={{ fontFamily: mono, fontSize: 9, color, minWidth: 40, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
              {values[values.length - 1].toFixed(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
