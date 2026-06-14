import React, { useState } from 'react';

const mono = 'ui-monospace, SFMono-Regular, "Intel One Mono", monospace';

interface Joint {
  x: number;
  y: number;
  label: string;
}

interface Bone {
  from: number;
  to: number;
  side: 'l' | 'r' | 'c';
}

const joints: Joint[] = [
  { x: 50, y: 30, label: 'pelvis' },
  { x: 50, y: 22, label: 'spine' },
  { x: 50, y: 15, label: 'head' },
  { x: 38, y: 24, label: 'shL' },
  { x: 28, y: 35, label: 'elL' },
  { x: 22, y: 48, label: 'wrL' },
  { x: 62, y: 24, label: 'shR' },
  { x: 72, y: 35, label: 'elR' },
  { x: 78, y: 48, label: 'wrR' },
  { x: 44, y: 50, label: 'hpL' },
  { x: 40, y: 68, label: 'knL' },
  { x: 38, y: 86, label: 'anL' },
  { x: 56, y: 50, label: 'hpR' },
  { x: 60, y: 68, label: 'knR' },
  { x: 62, y: 86, label: 'anR' },
];

const bones: Bone[] = [
  { from: 0, to: 1, side: 'c' },
  { from: 1, to: 2, side: 'c' },
  { from: 1, to: 3, side: 'l' },
  { from: 3, to: 4, side: 'l' },
  { from: 4, to: 5, side: 'l' },
  { from: 1, to: 6, side: 'r' },
  { from: 6, to: 7, side: 'r' },
  { from: 7, to: 8, side: 'r' },
  { from: 0, to: 9, side: 'l' },
  { from: 9, to: 10, side: 'l' },
  { from: 10, to: 11, side: 'l' },
  { from: 0, to: 12, side: 'r' },
  { from: 12, to: 13, side: 'r' },
  { from: 13, to: 14, side: 'r' },
];

const sideColor: Record<string, string> = { l: '#7ab8ff', r: '#f2a77a', c: '#8ec07c' };
const sideLabel: Record<string, string> = { l: 'left · blue', r: 'right · orange', c: 'center · green' };

const timelineLanes = [
  { name: 'spine', side: 'c', markers: [0.04, 0.5, 0.95] },
  { name: 'head', side: 'c', markers: [0.06, 0.48, 0.96] },
  { name: 'uArmL', side: 'l', markers: [0.08, 0.28, 0.72, 0.92] },
  { name: 'lArmL', side: 'l', markers: [0.1, 0.3, 0.74] },
  { name: 'uArmR', side: 'r', markers: [0.06, 0.5, 0.86] },
  { name: 'lArmR', side: 'r', markers: [0.08, 0.52, 0.88] },
  { name: 'uLegL', side: 'l', markers: [0.04, 0.4, 0.78] },
  { name: 'lLegL', side: 'l', markers: [0.04, 0.42, 0.8] },
  { name: 'uLegR', side: 'r', markers: [0.04, 0.36, 0.82] },
  { name: 'lLegR', side: 'r', markers: [0.04, 0.38, 0.84] },
];

export default function BoneLayout() {
  const [time, setTime] = useState(0.5);
  const duration = 1.62;

  return (
    <div style={{ margin: '16px 0', display: 'grid', gap: 16 }}>
      {/* ── Armature ── */}
      <div style={{ background: '#151515', border: '1px solid #2a2a2a', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px' }}>
          <span style={{ font: `11px ${mono}`, color: '#f3c46c', letterSpacing: '.1em', textTransform: 'uppercase' }}>Bone Armature</span>
          <span style={{ font: `11px ${mono}`, color: '#928374' }}>MATCHES skeleton · 15 joints · 14 bones</span>
        </div>
        <div style={{
          position: 'relative', width: '100%', aspectRatio: '4 / 3', overflow: 'hidden',
          background: 'radial-gradient(circle at 50% 45%, #0c141a 0%, #050608 100%)',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(rgba(80,130,170,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(80,130,170,0.08) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }} />
          {bones.map(({ from, to, side }, i) => {
            const a = joints[from], b = joints[to];
            const dx = b.x - a.x, dy = b.y - a.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const ang = Math.atan2(dy, dx) * 180 / Math.PI;
            return (
              <div key={i} style={{
                position: 'absolute', left: `${a.x}%`, top: `${a.y}%`,
                width: `${len}%`, height: 2,
                background: sideColor[side],
                transformOrigin: 'left center',
                transform: `rotate(${ang}deg)`,
                boxShadow: `0 0 6px ${sideColor[side]}80`,
              }} />
            );
          })}
          {joints.map(({ x, y, label }, i) => (
            <div key={i} style={{
              position: 'absolute', left: `${x}%`, top: `${y}%`,
              width: 6, height: 6, borderRadius: '50%',
              background: '#fabd2f',
              transform: 'translate(-50%, -50%)',
              boxShadow: '0 0 6px rgba(250,189,47,.6)',
            }} title={label} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', padding: '10px 12px' }}>
          {['l', 'r', 'c'].map(s => (
            <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 5, font: `10px ${mono}`, color: '#9f9f9f' }}>
              <span style={{ width: 16, height: 3, background: sideColor[s], borderRadius: 1 }} />
              {sideLabel[s]}
            </span>
          ))}
        </div>
      </div>

      {/* ── Timeline Lanes ── */}
      <div style={{ background: '#151515', border: '1px solid #2a2a2a', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px' }}>
          <span style={{ font: `11px ${mono}`, color: '#f3c46c', letterSpacing: '.1em', textTransform: 'uppercase' }}>Timeline Lanes</span>
          <span style={{ font: `11px ${mono}`, color: '#928374' }}>per-bone keyframe markers</span>
        </div>
        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute', left: 132, top: 0, bottom: 0, width: 2,
            background: '#f3c46c', zIndex: 2, pointerEvents: 'none',
            boxShadow: '0 0 6px #f3c46c80',
            transform: `translateX(${(time / duration) * 100}%)`,
          }} />
          {timelineLanes.map((lane) => {
            const c = sideColor[lane.side];
            return (
              <div key={lane.name} style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #2a2a2a' }}>
                <div style={{
                  width: 130, flexShrink: 0, padding: '8px 10px',
                  font: `11px ${mono}`, color: c,
                }}>{lane.name}</div>
                <div style={{ flex: 1, height: 28, position: 'relative' }}>
                  {lane.markers.map((t, mi) => (
                    <div key={mi} style={{
                      position: 'absolute', top: '50%', left: `${t * 100}%`,
                      width: 10, height: 10,
                      background: c, borderRadius: 1,
                      transform: 'translate(-50%, -50%) rotate(45deg)',
                      cursor: 'pointer', transition: 'box-shadow .12s',
                    }} title={`${lane.name} @ ${(t * duration).toFixed(2)}s`} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ padding: '8px 12px', display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ font: `10px ${mono}`, color: '#928374' }}>time</span>
          <input type="range" min={0} max={duration} step={0.01} value={time}
            onChange={(e) => setTime(Number(e.target.value))}
            style={{
              flex: 1, height: 4, appearance: 'none', background: '#2a2a2a',
              borderRadius: 2, cursor: 'pointer', outline: 'none',
            }} />
          <span style={{ font: `11px ${mono}`, color: '#f3c46c', minWidth: 50, textAlign: 'right' }}>{time.toFixed(2)}s</span>
        </div>
      </div>
    </div>
  );
}
