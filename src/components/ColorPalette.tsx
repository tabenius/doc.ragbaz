import React, { useState, useCallback } from 'react';

const mono = 'ui-monospace, SFMono-Regular, "Intel One Mono", monospace';

interface ColorEntry {
  token: string;
  value: string;
  use?: string;
}

export default function ColorPalette({
  title,
  desc,
  colors = [],
  inline = false,
}: {
  title?: string;
  desc?: string;
  colors: ColorEntry[];
  inline?: boolean;
}) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const copy = useCallback((hex: string, idx: number) => {
    navigator.clipboard.writeText(hex).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1200);
    });
  }, []);

  return (
    <div style={{ margin: '16px 0' }}>
      {(title || desc) && (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 10 }}>
          {title && <span style={{ fontFamily: mono, fontWeight: 700, fontSize: 12, color: '#ebdbb2' }}>{title}</span>}
          {desc && <span style={{ fontFamily: mono, fontSize: 11, color: '#928374' }}>{desc}</span>}
        </div>
      )}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 4,
        flexDirection: inline ? 'row' : 'column',
      }}>
        {colors.map((c, i) => {
          const isDark = isLight(c.value);
          const copied = copiedIdx === i;
          return (
            <button key={i} onClick={() => copy(c.value, i)}
              title={`Click to copy ${c.value}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                border: '1px solid #3c3836', borderRadius: 6, padding: 0, overflow: 'hidden',
                background: 'transparent', fontFamily: mono, fontSize: 12,
                transition: 'border-color .12s',
                flex: inline ? '0 0 auto' : '1 1 auto',
              }}>
              <span style={{
                width: inline ? 28 : 36, height: inline ? 28 : 36, flexShrink: 0,
                background: c.value, borderRadius: '5px 0 0 5px',
              }} />
              <span style={{ padding: '6px 8px 6px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#fabd2f' }}>{c.token}</span>
                <span style={{ color: copied ? '#8ec07c' : '#928374', transition: 'color .15s' }}>
                  {copied ? 'copied!' : c.value}
                </span>
                {c.use && <span style={{ color: '#665c54', marginLeft: 4 }}>{c.use}</span>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function isLight(hex: string): boolean {
  const h = hex.replace('#', '');
  if (h.length !== 6 && h.length !== 3) return false;
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return r * 0.299 + g * 0.587 + b * 0.114 > 160;
}
