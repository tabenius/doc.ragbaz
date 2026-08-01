import { useId } from 'react';

const mono = 'var(--font-mono)';

export type Segment = { label: string; value: number; color: string };

/** Labeled donut chart with a legend. Values need not sum to 100 — they're
 * normalized internally. Used throughout the perf-review page for resource
 * breakdowns (time / storage / bandwidth / memory / CPU). */
export function DonutChart({
  segments,
  size = 168,
  thickness = 26,
  centerLabel,
  centerSublabel,
  unit = '',
}: {
  segments: Segment[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerSublabel?: string;
  unit?: string;
}) {
  const total = segments.reduce((sum, s) => sum + Math.max(0, s.value), 0) || 1;
  const r = 50 - thickness / 2;
  const cx = 50;
  const cy = 50;

  let cursor = -Math.PI / 2; // start at 12 o'clock
  const arcs = segments.map((s) => {
    const frac = Math.max(0, s.value) / total;
    const sweep = frac * Math.PI * 2;
    const start = cursor;
    const end = cursor + sweep;
    cursor = end;
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const large = sweep > Math.PI ? 1 : 0;
    // Full circle (single segment) needs two arcs — a single arc path can't
    // close on itself.
    const isFullCircle = frac >= 0.9999;
    const d = isFullCircle
      ? `M${cx - r},${cy} A${r},${r} 0 1 1 ${cx + r},${cy} A${r},${r} 0 1 1 ${cx - r},${cy}`
      : `M${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2}`;
    return { d, color: s.color, pct: frac * 100, label: s.label, value: s.value };
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
        <svg viewBox="0 0 100 100" width={size} height={size} style={{ display: 'block' }}>
          {arcs.map((a, i) => (
            <path
              key={i}
              d={a.d}
              stroke={a.color}
              strokeWidth={thickness}
              fill="none"
              strokeLinecap={arcs.length > 1 ? 'butt' : 'round'}
            />
          ))}
        </svg>
        {(centerLabel || centerSublabel) && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            {centerLabel && (
              <span style={{ fontFamily: mono, fontSize: 20, fontWeight: 700, color: 'var(--fg-1)' }}>
                {centerLabel}
              </span>
            )}
            {centerSublabel && (
              <span
                style={{
                  fontFamily: mono,
                  fontSize: 10,
                  color: 'var(--fg-4)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {centerSublabel}
              </span>
            )}
          </div>
        )}
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
        {arcs.map((a, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontFamily: mono, fontSize: 12.5 }}>
            <span
              style={{
                display: 'inline-block',
                width: 10,
                height: 10,
                borderRadius: 2,
                background: a.color,
                flex: 'none',
              }}
            />
            <span style={{ color: 'var(--fg-2)', minWidth: 0 }}>{a.label}</span>
            <span style={{ color: 'var(--fg-4)', marginLeft: 'auto', paddingLeft: 10 }}>
              {a.pct.toFixed(0)}%
              {unit ? ` · ${formatNum(a.value)}${unit}` : ''}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatNum(n: number): string {
  if (n >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (n >= 10) return n.toFixed(1);
  return n.toFixed(2);
}

export type Series = { name: string; color: string; values: number[] };

/** Grouped bar chart: one group of bars per category, one bar per series
 * within the group. Used for cross-configuration comparisons (latency
 * percentiles, throughput, resource use) where categories are the metric
 * buckets (p50/p95/p99, or a single-category throughput comparison) and
 * series are the three configurations under test. */
export function GroupedBarChart({
  categories,
  series,
  unit = '',
  height = 220,
  logScale = false,
}: {
  categories: string[];
  series: Series[];
  unit?: string;
  height?: number;
  logScale?: boolean;
}) {
  const gid = useId();
  const allValues = series.flatMap((s) => s.values);
  const max = Math.max(...allValues, 1);
  const scale = (v: number) => {
    if (!logScale) return v / max;
    // log1p keeps zero meaningful and avoids -Infinity.
    return Math.log1p(v) / Math.log1p(max);
  };

  const padTop = 22; // room for value labels above the tallest bar
  const chartH = height - padTop - 28; // minus x-axis label row
  const groupGap = 22;
  const barGap = 5;
  const groupW = 100 / categories.length;

  return (
    <div style={{ width: '100%' }}>
      <svg
        viewBox={`0 0 600 ${height}`}
        width="100%"
        height={height}
        preserveAspectRatio="none"
        style={{ display: 'block', overflow: 'visible' }}
      >
        {/* baseline */}
        <line x1={0} y1={padTop + chartH} x2={600} y2={padTop + chartH} stroke="var(--border-2)" strokeWidth={1} />
        {categories.map((cat, ci) => {
          const groupX = (ci * groupW * 6) + groupGap / 2;
          const groupWidthPx = groupW * 6 - groupGap;
          const barW = (groupWidthPx - barGap * (series.length - 1)) / series.length;
          return (
            <g key={`${gid}-${ci}`}>
              {series.map((s, si) => {
                const v = s.values[ci] ?? 0;
                const h = scale(v) * chartH;
                const x = groupX + si * (barW + barGap);
                const y = padTop + chartH - h;
                return (
                  <g key={si}>
                    <rect x={x} y={y} width={barW} height={Math.max(h, 1)} fill={s.color} rx={2} />
                    <text
                      x={x + barW / 2}
                      y={y - 5}
                      textAnchor="middle"
                      fontSize="10.5"
                      fontFamily={mono}
                      fill="var(--fg-3)"
                    >
                      {formatNum(v)}
                      {unit}
                    </text>
                  </g>
                );
              })}
              <text
                x={groupX + groupWidthPx / 2}
                y={padTop + chartH + 18}
                textAnchor="middle"
                fontSize="11"
                fontFamily={mono}
                fill="var(--fg-4)"
              >
                {cat}
              </text>
            </g>
          );
        })}
      </svg>
      <ul
        style={{
          listStyle: 'none',
          margin: '10px 0 0',
          padding: 0,
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {series.map((s, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: mono, fontSize: 12 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color, display: 'inline-block' }} />
            <span style={{ color: 'var(--fg-2)' }}>{s.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A row of headline stat cards. */
export function StatGrid({
  stats,
}: {
  stats: { label: string; value: string; sublabel?: string; color?: string }[];
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 10,
        margin: '18px 0',
      }}
    >
      {stats.map((s, i) => (
        <div
          key={i}
          style={{
            background: 'var(--bg-2)',
            border: '1px solid var(--border-2)',
            borderRadius: 'var(--r-3)',
            padding: '12px 14px',
          }}
        >
          <div
            style={{
              fontFamily: mono,
              fontSize: 10,
              color: 'var(--fg-4)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 4,
            }}
          >
            {s.label}
          </div>
          <div style={{ fontFamily: mono, fontSize: 22, fontWeight: 700, color: s.color ?? 'var(--fg-1)' }}>
            {s.value}
          </div>
          {s.sublabel && (
            <div style={{ fontFamily: mono, fontSize: 11, color: 'var(--fg-4)', marginTop: 2 }}>{s.sublabel}</div>
          )}
        </div>
      ))}
    </div>
  );
}

/** Panel wrapper matching the site's card styling, with a title bar. */
export function ChartPanel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: 'var(--bg-2)',
        border: '1px solid var(--border-2)',
        borderRadius: 'var(--r-3)',
        padding: '16px 18px 18px',
        margin: '20px 0',
      }}
    >
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontFamily: mono, fontSize: 13, fontWeight: 700, color: 'var(--orange-1)' }}>{title}</div>
        {subtitle && (
          <div style={{ fontFamily: mono, fontSize: 11.5, color: 'var(--fg-4)', marginTop: 3 }}>{subtitle}</div>
        )}
      </div>
      {children}
    </div>
  );
}

export const PALETTE = {
  wordpress: 'var(--fg-4)',
  gatekeeper: 'var(--blue-1)',
  detcordon: 'var(--gruv-orange)',
  good: 'var(--green-1)',
  warn: 'var(--yellow-1)',
  bad: 'var(--red-1)',
};
