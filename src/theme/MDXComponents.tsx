import React, { useState, useRef, useEffect, type ReactNode } from 'react';
import MDXComponents from '@theme-original/MDXComponents';
import ComposeSystemView from '@site/src/components/ComposeSystemView';
import ColorPalette from '@site/src/components/ColorPalette';
import PointCloudSphere from '@site/src/components/PointCloudSphere';
import BoneLayout from '@site/src/components/BoneLayout';

const mono = 'ui-monospace, SFMono-Regular, "Intel One Mono", monospace';
const ACCENT: Record<string, string> = {
  aqua: '#8ec07c', green: '#b8bb26', blue: '#83a598', purple: '#d3869b',
  yellow: '#fabd2f', red: '#fb4934', orange: '#fe8019', gray: '#928374',
};
const ADMON: Record<string, string> = { note: '#928374', tip: '#b8bb26', info: '#83a598', warning: '#fabd2f', danger: '#fb4934' };
const ADMON_ICON: Record<string, string> = {
  note: 'i', tip: '\u2713', info: '\u24D8', warning: '\u26A0', danger: '\u2716',
};

const btnFocus = {
  outline: 'none',
  transition: 'box-shadow .15s, color .15s, border-color .15s',
};
const Hero = ({ marque, tagline, title, subtitle, lede, axes = [] }: any) => (
  <header style={{ borderTop: '3px solid #fe8019', padding: '20px 0 14px', margin: '0 0 24px' }}>
    {marque && <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: '.28em', color: '#fe8019' }}>{marque}</div>}
    {tagline && <div style={{ fontFamily: mono, fontSize: 12, color: '#928374' }}>{tagline}</div>}
    <h1 style={{ margin: '8px 0 4px' }}>{title}</h1>
    {subtitle && <div style={{ color: '#928374', fontFamily: mono, fontSize: 13 }}>{subtitle}</div>}
    {lede && <p style={{ fontSize: 18, color: '#d5c4a1' }}>{lede}</p>}
    {axes.length > 0 && <div style={{ fontFamily: mono, fontSize: 11, color: '#928374', letterSpacing: '.1em' }}>{axes.join(' \u00B7 ')}</div>}
  </header>
);

const Lead = ({ children, size }: any) => (
  <div style={{ fontSize: size === 2 ? 17 : 20, lineHeight: 1.5, color: '#d5c4a1' }}>{children}</div>
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

const Callout = ({ title, accent = 'green', children }: any) => {
  const c = ACCENT[accent] ?? accent;
  return (
    <div style={{ borderLeft: `3px solid ${c}`, background: '#282828', padding: '12px 16px', borderRadius: 6, margin: '16px 0' }}>
      {title && <div style={{ fontFamily: mono, fontWeight: 700, fontSize: 12, letterSpacing: '.1em', color: c }}>{title}</div>}
      <div>{children}</div>
    </div>
  );
};

const Admonition = ({ type = 'note', title, children }: any) => {
  const c = ADMON[type] ?? '#928374';
  const icon = ADMON_ICON[type] ?? 'i';
  return (
    <div style={{ borderLeft: `3px solid ${c}`, background: '#282828', padding: '12px 16px', borderRadius: 6, margin: '16px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: title ? 8 : 0 }}>
        <span style={{
          fontFamily: mono, fontWeight: 700, fontSize: 13, color: c,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 20, height: 20, borderRadius: 4, border: `1px solid ${c}`,
        }}>{icon}</span>
        {title && <span style={{ fontFamily: mono, fontWeight: 700, fontSize: 11, letterSpacing: '.18em', color: c }}>{title}</span>}
      </div>
      <div style={{ color: '#d5c4a1' }}>{children}</div>
    </div>
  );
};

const Badge = ({ color = 'aqua', children }: any) => {
  const bg = ACCENT[color] ?? color;
  return (
    <span style={{
      fontFamily: mono, fontSize: 11, fontWeight: 700, background: bg, color: '#1d2021',
      padding: '2px 8px', borderRadius: 4, display: 'inline-block',
      transition: 'transform .12s, box-shadow .12s',
      cursor: 'default',
    }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,.35)'; }}
       onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
      {children}
    </span>
  );
};

const KeyVal = ({ rows = [] }: any) => (
  <div style={{ margin: '12px 0', borderRadius: 6, overflow: 'hidden' }}>
    {rows.map(([k, v]: any, i: number) => (
      <div key={i} style={{
        display: 'flex', gap: 16, padding: '8px 12px', fontSize: 14,
        background: i % 2 === 0 ? '#282828' : '#1d2021',
      }}>
        <span style={{ fontFamily: mono, fontSize: 12, color: '#fabd2f', minWidth: 150, flexShrink: 0 }}>{k}</span>
        <span style={{ color: '#d5c4a1' }}>{v}</span>
      </div>
    ))}
  </div>
);

type TabItemProps = {
  value: string;
  label?: ReactNode;
  children?: ReactNode;
};

const TabItem = ({ children }: TabItemProps) => <>{children}</>;

const Tabs = ({ children, defaultValue }: {children: ReactNode; defaultValue?: string}) => {
  const items = React.Children.toArray(children).filter(
    (child): child is React.ReactElement<TabItemProps> =>
      React.isValidElement<TabItemProps>(child),
  );
  const [active, setActive] = useState(defaultValue ?? items[0]?.props.value);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const P = '#f3c46c';
  useEffect(() => {
    const idx = items.findIndex((item) => item.props.value === active);
    const el = tabRefs.current[idx];
    if (el && indicatorRef.current) {
      indicatorRef.current.style.width = `${el.offsetWidth}px`;
      indicatorRef.current.style.transform = `translateX(${el.offsetLeft}px)`;
    }
  }, [active, items]);
  return (
    <div style={{ margin: '16px 0' }}>
      <div style={{ position: 'relative', display: 'flex', gap: 0, flexWrap: 'wrap' }}>
        {items.map((it, i) => {
          const on = it.props.value === active;
          return (
            <button key={it.props.value} ref={(el) => { tabRefs.current[i] = el; }}
              onClick={() => setActive(it.props.value)}
              onMouseEnter={(e) => { if (!on) e.currentTarget.style.color = '#ebdbb2'; }}
              onMouseLeave={(e) => { if (!on) e.currentTarget.style.color = '#928374'; }}
              style={{
                fontFamily: mono, fontSize: 12, padding: '8px 14px', cursor: 'pointer',
                background: 'transparent', border: 'none',
                color: on ? '#ebdbb2' : '#928374', marginBottom: -1,
                ...btnFocus,
              }}>{it.props.label ?? it.props.value}</button>
          );
        })}
        <div ref={indicatorRef} style={{
          height: 2, background: P, borderRadius: 1,
          position: 'absolute', bottom: 0, left: 0,
          transition: 'width .2s, transform .2s',
        }} />
      </div>
      <div style={{ borderTop: '1px solid #3c3836', paddingTop: 14 }}>
        {items.find((item) => item.props.value === active)}
      </div>
    </div>
  );
};

const Steps = ({ children }: any) => {
  const items = React.Children.toArray(children);
  return (
    <div style={{ margin: '16px 0', display: 'flex', flexDirection: 'column', gap: 0 }}>
      {items.map((c: any, i: number) => (
        <div key={i} style={{
          display: 'flex', gap: 14, alignItems: 'flex-start', padding: '12px 0',
          borderBottom: i < items.length - 1 ? '1px solid #3c3836' : 'none',
        }}>
          <span style={{
            fontFamily: mono, fontWeight: 700, color: '#1d2021', background: '#8ec07c',
            width: 28, height: 28, minWidth: 28, display: 'inline-flex', alignItems: 'center',
            justifyContent: 'center', borderRadius: 6, fontSize: 14,
            transition: 'transform .12s',
          }}>{i + 1}</span>
          <div style={{ fontSize: 15, color: '#d5c4a1', lineHeight: 1.6, paddingTop: 3 }}>{c}</div>
        </div>
      ))}
    </div>
  );
};

const Reveal = ({ label = 'reveal', hiddenLabel = 'hide', children }: any) => {
  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [maxH, setMaxH] = useState<number | undefined>(undefined);
  useEffect(() => {
    if (open && contentRef.current) {
      setMaxH(contentRef.current.scrollHeight);
    } else {
      const to = setTimeout(() => setMaxH(undefined), 200);
      return () => clearTimeout(to);
    }
  }, [open]);
  return (
    <div style={{ margin: '12px 0' }}>
      <button onClick={() => setOpen(!open)}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#32302f'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = '#282828'; }}
        style={{
          fontFamily: mono, fontSize: 12, color: '#d3869b', background: '#282828',
          border: '1px solid #d3869b', padding: '7px 14px 7px 12px', borderRadius: 6,
          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
          ...btnFocus,
          transition: 'background .12s, box-shadow .12s',
        }}>
        <span style={{
          display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
          background: '#d3869b', transition: 'transform .2s',
          transform: open ? 'rotate(45deg)' : '',
        }} />
        {open ? hiddenLabel : label}
      </button>
      <div ref={contentRef} style={{
        overflow: 'hidden', transition: 'max-height .2s, opacity .2s, margin-top .2s',
        maxHeight: open ? `${maxH}px` : '0',
        opacity: open ? 1 : 0,
        marginTop: open ? 12 : 0,
      }}>
        {children}
      </div>
    </div>
  );
};

const SpecTable = ({ rows }: any) => (
  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, margin: '12px 0' }}>
    <tbody>
      {rows.map(([token, value, note]: any, i: number) => (
        <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : '#282828' }}>
          <td style={{ color: '#fabd2f', fontFamily: mono, fontSize: 12, width: '30%', padding: '9px 8px', borderBottom: '1px solid #3c3836', verticalAlign: 'top' }}>{token}</td>
          <td style={{ fontFamily: mono, fontSize: 12, padding: '9px 8px', borderBottom: '1px solid #3c3836', verticalAlign: 'top' }}>{value}</td>
          <td style={{ color: '#928374', padding: '9px 8px', borderBottom: '1px solid #3c3836', verticalAlign: 'top', fontSize: 13 }}>{note}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

export default { ...MDXComponents, Hero, Lead, Plate, Callout, Admonition, Badge, KeyVal, ComposeSystemView, Tabs, TabItem, Steps, Reveal, SpecTable, ColorPalette, PointCloudSphere, BoneLayout };
