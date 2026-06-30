import React, { useRef, useEffect, useCallback, useState } from 'react';

const mono = 'ui-monospace, SFMono-Regular, "Intel One Mono", monospace';

function rotate(v: [number, number, number], yaw: number, pitch: number): [number, number, number] {
  const [x, y, z] = v;
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  const x1 = cy * x + sy * z;
  const y1 = y;
  const z1 = -sy * x + cy * z;
  return [x1, cp * y1 - sp * z1, sp * y1 + cp * z1];
}

function project(v: [number, number, number], W: number, H: number): [number, number, number] {
  const [x, y, z] = v;
  const dist = 3.0, f = 1.6;
  const k = f / (z + dist);
  return [W / 2 + x * k * (W / 2), H / 2 - y * k * (H / 2), z];
}

const N = 720;
function buildCloud(): [number, number, number][] {
  const cloud: [number, number, number][] = [];
  for (let i = 0; i < N; i++) {
    const phi = Math.acos(1 - 2 * (i + 0.5) / N);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    cloud.push([Math.sin(phi) * Math.cos(theta), Math.sin(phi) * Math.sin(theta), Math.cos(phi)]);
  }
  return cloud;
}

const cloud = buildCloud();

interface Vector3 {
  v: [number, number, number];
  color: string;
  label: string;
}

interface PointCloudSphereProps {
  width?: number;
  height?: number;
  mode?: 'interactive' | 'view';
  yawSpeed?: number;
  pitchSpeed?: number;
  initialYaw?: number;
  initialPitch?: number;
}

export default function PointCloudSphere({
  width = 560,
  height = 560,
  mode = 'interactive',
  yawSpeed = 0.004,
  pitchSpeed = 0,
  initialYaw = -0.6,
  initialPitch = 0.35,
}: PointCloudSphereProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [yaw, setYaw] = useState(initialYaw);
  const [pitch, setPitch] = useState(initialPitch);
  const [vectors, setVectors] = useState<Vector3[]>([
    { v: [0.9, 0.4, 0.2], color: '#fe8019', label: 'v₀' },
    { v: [-0.3, 0.8, -0.5], color: '#8ec07c', label: 'v₁' },
    { v: [0.2, -0.6, 0.9], color: '#d3869b', label: 'v₂' },
  ]);
  const [vecOn, setVecOn] = useState([true, false, false]);
  const yawRef = useRef(yaw);
  const pitchRef = useRef(pitch);
  const vecOnRef = useRef(vecOn);
  const draggingRef = useRef(false);
  const lastTouchRef = useRef(Date.now());

  yawRef.current = yaw;
  pitchRef.current = pitch;
  vecOnRef.current = vecOn;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    ctx.save();
    ctx.globalAlpha = 0.10;
    ctx.fillStyle = '#3a2a18';
    ctx.beginPath();
    ctx.ellipse(W/2, H/2 + H*0.32, W*0.32, H*0.04, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();

    const projected = cloud.map(p => {
      const r = rotate(p, yawRef.current, pitchRef.current);
      const [px, py, pz] = project(r, W, H);
      return { px, py, pz };
    }).sort((a, b) => a.pz - b.pz);

    for (const p of projected) {
      const d = (p.pz + 1.2) / 2.4;
      const size = 1.0 + d * 2.2;
      const alpha = 0.18 + d * 0.62;
      ctx.fillStyle = d > 0.6
        ? `rgba(243,196,108,${alpha})`
        : `rgba(216,194,157,${alpha})`;
      ctx.beginPath();
      ctx.arc(p.px, p.py, size, 0, Math.PI * 2);
      ctx.fill();
    }

    const axes = [
      { v: [1.25, 0, 0] as [number, number, number], color: '#ff9900', lbl: 'X' },
      { v: [0, 1.25, 0] as [number, number, number], color: '#b8bb26', lbl: 'Y' },
      { v: [0, 0, 1.25] as [number, number, number], color: '#7ab8ff', lbl: 'Z' },
    ];
    const negAxes = axes.map(a => ({ ...a, v: a.v.map(c => -c * 0.8) as [number, number, number], lbl: '' }));
    const allAxes = [...axes, ...negAxes].sort((a, b) => rotate(a.v, yawRef.current, pitchRef.current)[2] - rotate(b.v, yawRef.current, pitchRef.current)[2]);

    for (const ax of allAxes) {
      const fr = project(rotate([0,0,0], yawRef.current, pitchRef.current), W, H);
      const toP = project(rotate(ax.v, yawRef.current, pitchRef.current), W, H);
      ctx.beginPath();
      ctx.moveTo(fr[0], fr[1]);
      ctx.lineTo(toP[0], toP[1]);
      ctx.lineWidth = ax.lbl ? 3 : 1.5;
      ctx.strokeStyle = ax.color;
      ctx.globalAlpha = ax.lbl ? 1 : 0.32;
      ctx.setLineDash(ax.lbl ? [] : [4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      if (ax.lbl) {
        ctx.fillStyle = ax.color;
        ctx.beginPath(); ctx.arc(toP[0], toP[1], 3.5, 0, Math.PI*2); ctx.fill();
        ctx.font = `bold 14px ${mono}`;
        ctx.fillText(ax.lbl, toP[0] + 8, toP[1] + 4);
      }
    }

    for (let i = 0; i < vectors.length; i++) {
      if (!vecOnRef.current[i]) continue;
      const vec = vectors[i];
      const fr = project(rotate([0,0,0], yawRef.current, pitchRef.current), W, H);
      const tr = rotate(vec.v, yawRef.current, pitchRef.current);
      const toV = project(tr, W, H);
      ctx.beginPath();
      ctx.moveTo(fr[0], fr[1]);
      ctx.lineTo(toV[0], toV[1]);
      ctx.lineWidth = 3;
      ctx.strokeStyle = vec.color;
      ctx.globalAlpha = 0.95;
      ctx.stroke();
      ctx.globalAlpha = 1;

      const dx = toV[0] - fr[0], dy = toV[1] - fr[1];
      const ang = Math.atan2(dy, dx);
      const headLen = 9;
      ctx.beginPath();
      ctx.moveTo(toV[0], toV[1]);
      ctx.lineTo(toV[0] - headLen * Math.cos(ang - 0.4), toV[1] - headLen * Math.sin(ang - 0.4));
      ctx.lineTo(toV[0] - headLen * Math.cos(ang + 0.4), toV[1] - headLen * Math.sin(ang + 0.4));
      ctx.closePath();
      ctx.fillStyle = vec.color;
      ctx.fill();
      ctx.fillStyle = vec.color;
      ctx.font = `11px ${mono}`;
      ctx.fillText(vec.label, toV[0] + 8, toV[1] - 4);
    }
  }, [vectors]);

  const isView = mode === 'view';

  useEffect(() => {
    let animId: number;
    function tick() {
      if (isView) {
        setYaw(y => y + yawSpeed);
        setPitch(p => p + pitchSpeed);
      } else {
        if (!draggingRef.current && Date.now() - lastTouchRef.current > 1800) {
          setYaw(y => y + 0.004);
        }
      }
      animId = requestAnimationFrame(tick);
    }
    draw();
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [draw, isView, yawSpeed, pitchSpeed]);

  useEffect(() => {
    draw();
  }, [yaw, pitch, draw]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    draggingRef.current = true;
    lastTouchRef.current = Date.now();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    lastTouchRef.current = Date.now();
    setYaw(y => y + e.movementX * 0.01);
    setPitch(p => {
      const next = p + e.movementY * 0.01;
      return Math.max(-Math.PI/2 + 0.05, Math.min(Math.PI/2 - 0.05, next));
    });
  }, []);

  const handlePointerUp = useCallback(() => {
    draggingRef.current = false;
  }, []);

  const toggleVec = useCallback((i: number) => {
    setVecOn(prev => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  }, []);

  const yawDeg = ((yaw * 180 / Math.PI) % 360 + 360) % 360;
  const pitchDeg = pitch * 180 / Math.PI;
  const normPitch = Math.max(-1, Math.min(1, pitch / (Math.PI / 2)));

  const P = '#f3c46c';
  const G = '#928374';

  if (isView) {
    return (
      <div style={{
        margin: '16px 0',
        position: 'relative', userSelect: 'none',
        background: 'radial-gradient(circle at 50% 50%, #1a1308 0%, #0a0807 70%, #050403 100%)',
        border: '1px solid #2a2a2a', borderRadius: 8, overflow: 'hidden',
        aspectRatio: '1 / 1',
      }}>
        <canvas ref={canvasRef} width={width} height={height}
          style={{ display: 'block', width: '100%', height: '100%' }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, margin: '16px 0' }}>
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          position: 'relative', cursor: 'grab', userSelect: 'none',
          background: 'radial-gradient(circle at 50% 50%, #1a1308 0%, #0a0807 70%, #050403 100%)',
          border: '1px solid #2a2a2a', borderRadius: 8, overflow: 'hidden',
          aspectRatio: '1 / 1', flex: '1 0 min(100%, 240px)',
        }}
      >
        <canvas ref={canvasRef} width={width} height={height}
          style={{ display: 'block', width: '100%', height: '100%' }} />
        <div style={{ position: 'absolute', left: 8, top: 6, font: `10px ${mono}`, color: G, letterSpacing: '.08em', textTransform: 'uppercase' }}>
          cloud · {N} pts
        </div>
        <div style={{ position: 'absolute', right: 8, bottom: 6, font: `10px ${mono}`, color: G }}>
          {draggingRef.current ? 'dragging' : 'drag'}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: '0 0 200px', minWidth: 0 }}>
        <div style={{ background: '#151515', border: '1px solid #2a2a2a', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ font: `10px ${mono}`, color: G, letterSpacing: '.1em', textTransform: 'uppercase' }}>readout</div>
          <div style={{ display: 'flex', gap: 18, marginTop: 4 }}>
            <div>
              <div style={{ font: `10px ${mono}`, color: G }}>yaw</div>
              <div style={{ font: `14px ${mono}`, fontWeight: 600, color: P, fontVariantNumeric: 'tabular-nums' }}>{yawDeg.toFixed(1)}°</div>
            </div>
            <div>
              <div style={{ font: `10px ${mono}`, color: G }}>pitch</div>
              <div style={{ font: `14px ${mono}`, fontWeight: 600, color: P, fontVariantNumeric: 'tabular-nums' }}>{pitchDeg.toFixed(1)}°</div>
            </div>
          </div>
        </div>

        <div style={{ background: '#151515', border: '1px solid #2a2a2a', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ font: `10px ${mono}`, color: G, letterSpacing: '.1em', textTransform: 'uppercase' }}>monitors</div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 6 }}>
            <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
              <svg viewBox="0 0 64 64" style={{position:'absolute', inset:0}}>
                <circle cx="32" cy="32" r="30" fill="none" stroke="#2a2a2a" strokeWidth="1" />
                {[0,90,180,270].map(deg => (
                  <line key={deg} x1={32} y1={32 - 30} x2={32} y2={32 - 24}
                    transform={`rotate(${deg}, 32, 32)`} stroke={G} strokeWidth="1.5" />
                ))}
                <line x1={32} y1={32} x2={32 + 24 * Math.sin(yaw)} y2={32 - 24 * Math.cos(yaw)}
                  stroke={P} strokeWidth="2.5" strokeLinecap="round"
                  style={{filter: 'drop-shadow(0 0 3px #f3c46c)'}} />
                <circle cx={32} cy={32} r={3} fill={P} />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ font: `10px ${mono}`, color: G }}>yaw monitor</div>
              <div style={{ font: `10px ${mono}`, color: '#d4c19a', marginTop: 2 }}>tracks heading</div>
            </div>
            <div style={{ position: 'relative', width: 14, height: 64, flexShrink: 0 }}>
              <div style={{ position: 'absolute', inset: 0, background: '#121212', border: '1px solid #2a2a2a', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1, background: '#3a2a18' }} />
                <div style={{
                  position: 'absolute', left: 0, right: 0,
                  background: 'linear-gradient(0deg, #2a8d9e, #7ab8ff)',
                  top: normPitch >= 0 ? `${32 - normPitch * 30}px` : '32px',
                  height: normPitch >= 0 ? `${normPitch * 30}px` : `${-normPitch * 30}px`,
                }} />
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: '#151515', border: '1px solid #2a2a2a', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ font: `10px ${mono}`, color: G, letterSpacing: '.1em', textTransform: 'uppercase' }}>vectors</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
            {vectors.map((vec, i) => (
              <button key={i} onClick={() => toggleVec(i)}
                style={{
                  font: `10px ${mono}`, cursor: 'pointer',
                  background: vecOn[i] ? '#2a1d12' : 'transparent',
                  color: vecOn[i] ? P : G,
                  border: `2px solid ${vecOn[i] ? P : '#3a3a3a'}`,
                  borderRadius: 999, padding: '2px 8px',
                }}>
                {vec.label} {vec.color === '#fe8019' ? 'orange' : vec.color === '#8ec07c' ? 'aqua' : 'purple'}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
            {[
              { color: '#ff9900', label: 'X · orange' },
              { color: '#b8bb26', label: 'Y · green' },
              { color: '#7ab8ff', label: 'Z · blue' },
            ].map(({ color, label }) => (
              <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, font: `10px ${mono}`, color: '#d4c19a' }}>
                <span style={{ width: 12, height: 3, background: color, borderRadius: 1 }} />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
