import React from 'react';
import MDXComponents from '@theme-original/MDXComponents';

/* Lightweight, dependency-free shims for the bazweave-kit components used in the
   imported DESCRIPTION.mdx files. Keeps the Atlas self-contained (no cross-repo
   package install); swap for `@ragbaz/bazweave-kit/adapters/docusaurus` once the
   kit is published/linked. */
const mono = 'ui-monospace, SFMono-Regular, "Intel One Mono", monospace';
const ACCENT: Record<string, string> = {
  aqua: '#8ec07c', green: '#b8bb26', blue: '#83a598', purple: '#d3869b',
  yellow: '#fabd2f', red: '#fb4934', orange: '#fe8019', gray: '#928374',
};
const ADMON: Record<string, string> = { note: '#928374', tip: '#b8bb26', info: '#83a598', warning: '#fabd2f', danger: '#fb4934' };

const Hero = ({ marque, tagline, title, subtitle, lede, axes = [] }: any) => (
  <header style={{ borderTop: '3px solid #fe8019', padding: '20px 0 14px', margin: '0 0 24px' }}>
    {marque && <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: '.28em', color: '#fe8019' }}>{marque}</div>}
    {tagline && <div style={{ fontFamily: mono, fontSize: 12, color: '#928374' }}>{tagline}</div>}
    <h1 style={{ margin: '8px 0 4px' }}>{title}</h1>
    {subtitle && <div style={{ color: '#928374', fontFamily: mono, fontSize: 13 }}>{subtitle}</div>}
    {lede && <p style={{ fontSize: 18, color: '#d5c4a1' }}>{lede}</p>}
    {axes.length > 0 && <div style={{ fontFamily: mono, fontSize: 11, color: '#928374', letterSpacing: '.1em' }}>{axes.join(' · ')}</div>}
  </header>
);
const Lead = ({ children, size }: any) => (
  <p style={{ fontSize: size === 2 ? 17 : 20, lineHeight: 1.5, color: '#d5c4a1' }}>{children}</p>
);
const Plate = ({ section, title, sub, num, children }: any) => (
  <section style={{ margin: '28px 0', borderLeft: '1px solid #3c3836', paddingLeft: 18 }}>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
      {section && <span style={{ fontFamily: mono, fontWeight: 700, background: '#fe8019', color: '#1d2021', padding: '1px 8px', borderRadius: 4 }}>{section}</span>}
      <h2 style={{ margin: 0 }}>{title}</h2>
      {num && <span style={{ marginLeft: 'auto', fontFamily: mono, color: '#665c54' }}>{num}</span>}
    </div>
    {sub && <div style={{ color: '#928374', fontFamily: mono, fontSize: 13, marginBottom: 8 }}>{sub}</div>}
    {children}
  </section>
);
const Callout = ({ title, accent = 'green', children }: any) => (
  <div style={{ borderLeft: `3px solid ${ACCENT[accent] ?? accent}`, background: '#282828', padding: '12px 16px', borderRadius: 6, margin: '16px 0' }}>
    {title && <div style={{ fontFamily: mono, fontWeight: 700, fontSize: 12, letterSpacing: '.1em', color: ACCENT[accent] ?? accent }}>{title}</div>}
    <div>{children}</div>
  </div>
);
const Admonition = ({ type = 'note', title, children }: any) => (
  <div style={{ borderLeft: `3px solid ${ADMON[type] ?? '#928374'}`, background: '#282828', padding: '12px 16px', borderRadius: 6, margin: '16px 0' }}>
    {title && <div style={{ fontFamily: mono, fontWeight: 700, fontSize: 11, letterSpacing: '.18em', color: ADMON[type] ?? '#928374' }}>{title}</div>}
    <div style={{ color: '#d5c4a1' }}>{children}</div>
  </div>
);
const Badge = ({ color = 'aqua', children }: any) => (
  <span style={{ fontFamily: mono, fontSize: 11, fontWeight: 700, background: ACCENT[color] ?? color, color: '#1d2021', padding: '2px 8px', borderRadius: 4 }}>{children}</span>
);
const KeyVal = ({ rows = [] }: any) => (
  <div style={{ margin: '12px 0' }}>
    {rows.map(([k, v]: any, i: number) => (
      <div key={i} style={{ display: 'flex', gap: 16, padding: '7px 0', borderBottom: '1px solid #3c3836', fontSize: 14 }}>
        <span style={{ fontFamily: mono, fontSize: 12, color: '#fabd2f', minWidth: 150, flexShrink: 0 }}>{k}</span>
        <span style={{ color: '#d5c4a1' }}>{v}</span>
      </div>
    ))}
  </div>
);

export default { ...MDXComponents, Hero, Lead, Plate, Callout, Admonition, Badge, KeyVal };
