import React, {useMemo, useState} from 'react';

type ServiceDef = Record<string, unknown>;

type ComposeSystemViewProps = {
  compose: {
    name?: string;
    services?: Record<string, ServiceDef>;
    volumes?: Record<string, unknown>;
    networks?: Record<string, unknown>;
  };
  title?: string;
  fileName?: string;
  stackName?: string;
};

const mono = '"Intel One Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
const sans = '"Noto Sans", -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

const C = {
  bg0: '#0a0908',
  bg2: '#121212',
  bg3: '#151515',
  bg4: '#181818',
  bgElev: '#1d1812',
  border2: '#2a2a2a',
  borderWarm: '#3a2a18',
  fg1: '#f6d7a7',
  fg2: '#d8c29d',
  fg4: '#9f9f9f',
  fg5: '#737373',
  fgOnWarm: '#1a1208',
  orange1: '#f3c46c',
  orange2: '#f2a77a',
  orange3: '#ff9900',
  orange4: '#d97742',
  blue1: '#7ab8ff',
  blue2: '#4fb3c7',
  green1: '#b8bb26',
  green2: '#98971a',
  red1: '#fb4934',
  yellow1: '#fabd2f',
  purple1: '#d3869b',
  aqua1: '#8ec07c',
};

const NET_COLORS = [C.orange1, C.blue1, C.aqua1, C.purple1, C.yellow1, C.green1, C.red1];

function pickNetColor(index: number): string {
  return NET_COLORS[index % NET_COLORS.length];
}

function serviceIcon(name: string): string {
  return name.charAt(0).toUpperCase();
}

function stringVal(v: unknown): string {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object') return JSON.stringify(v);
  return '';
}

function listVal(v: unknown): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map((e) => (typeof e === 'string' ? e : String(e)));
  if (typeof v === 'object') return Object.keys(v as Record<string, unknown>);
  return [String(v)];
}

function envPairs(v: unknown): Array<[string, string]> {
  if (!v) return [];
  if (Array.isArray(v)) return v.map((e) => {
    const s = String(e);
    const i = s.indexOf('=');
    return i < 0 ? [s, ''] : [s.slice(0, i), s.slice(i + 1)];
  });
  if (typeof v === 'object') return Object.entries(v as Record<string, string>);
  return [];
}

function isSecret(key: string): boolean {
  return /secret|token|password|key|credential/i.test(key);
}

function portDisplay(v: unknown): string[] {
  const raw = listVal(v);
  return raw.map((p) => {
    const parts = p.split(':');
    if (parts.length === 3) return `${parts[1]}:${parts[2]}`;
    return p;
  });
}

function accentForService(name: string, index: number): string {
  const map: Record<string, string> = {
    wordpress: C.blue1,
    gateway: C.orange1,
    storefront: C.green1,
    haproxy: C.purple1,
    litestream: C.aqua1,
    db: C.red1,
    mail: C.yellow1,
    redis: C.purple1,
    vault: C.red1,
    minio: C.blue1,
  };
  return map[name] || NET_COLORS[index % NET_COLORS.length];
}

export default function ComposeSystemView({
  compose,
  title = 'Secure WordPress Stack',
  fileName = 'docker-compose.yml',
  stackName,
}: ComposeSystemViewProps) {
  const entries = useMemo(() => Object.entries(compose?.services || {}), [compose]);
  const namedVolumes = Object.keys(compose?.volumes || {});
  const networks = Object.keys(compose?.networks || {});
  const [selected, setSelected] = useState<string | null>(null);

  const sName = stackName || compose?.name || title;

  return (
    <section style={{
      background: C.bg0, border: `1px solid ${C.borderWarm}`, borderRadius: 8,
      color: C.fg2, margin: '24px 0', overflow: 'hidden',
    }}>
      {/* ── Stack header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        padding: '10px 14px', background: C.bg3, borderBottom: `1px solid ${C.border2}`,
      }}>
        <span style={{
          fontFamily: mono, fontWeight: 700, fontSize: 13, color: C.orange1,
          letterSpacing: '.08em', textTransform: 'uppercase',
        }}>{sName}</span>
        <span style={{ color: C.fg5, fontFamily: mono, fontSize: 11 }}>·</span>
        <span style={{ fontFamily: mono, fontSize: 11, color: C.fg5 }}>
          {fileName}
        </span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{
            fontFamily: mono, fontSize: 10, color: C.fg5, letterSpacing: '.08em',
          }}>
            {entries.length} svc · {namedVolumes.length} vol · {networks.length} net
          </span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: 'rgba(10,30,14,.7)', border: `1px solid ${C.green2}`,
            color: C.green1, fontFamily: mono, fontSize: 10, padding: '2px 8px',
            borderRadius: 999, letterSpacing: '.08em', textTransform: 'uppercase',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%', background: C.green1,
              boxShadow: `0 0 6px ${C.green1}`,
            }} />
            running
          </span>
        </span>
      </div>

      {/* ── Network legend ── */}
      {networks.length > 0 && (
        <div style={{
          display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap',
          padding: '8px 14px', borderBottom: `1px solid ${C.border2}`,
        }}>
          <span style={{
            fontFamily: mono, fontSize: 10, color: C.fg5,
            letterSpacing: '.12em', textTransform: 'uppercase',
          }}>networks</span>
          {networks.map((n, i) => (
            <span key={n} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontFamily: mono, fontSize: 11, color: C.fg2,
            }}>
              <span style={{
                width: 14, height: 4, borderRadius: 2, background: pickNetColor(i),
              }} />
              {n}
            </span>
          ))}
        </div>
      )}

      {/* ── Service cards grid ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: 6, padding: 10,
      }}>
        {entries.map(([name, svc], idx) => {
          const accent = accentForService(name, idx);
          const image = stringVal((svc as Record<string, unknown>).image)
            || stringVal((svc as Record<string, unknown>).build)
            || name;
          const ports = portDisplay((svc as Record<string, unknown>).ports);
          const svcNets = listVal((svc as Record<string, unknown>).networks);
          const isSelected = selected === name;

          return (
            <button
              key={name}
              type="button"
              onClick={() => setSelected(isSelected ? null : name)}
              style={{
                position: 'relative', cursor: 'pointer', textAlign: 'left', display: 'flex',
                flexDirection: 'column', background: C.bg2, border: `2px solid ${isSelected ? accent : C.border2}`,
                borderRadius: 8, overflow: 'hidden', transition: 'border-color 120ms, transform 120ms',
                padding: 0, color: 'inherit', fontFamily: 'inherit', fontSize: 'inherit', lineHeight: 'inherit',
                width: '100%',
              }}
              onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.borderColor = C.borderWarm; }}
              onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.borderColor = C.border2; }}
            >
              {/* Accent header bar */}
              <div style={{
                height: 48, background: `radial-gradient(circle at 60% 30%, ${accent}22, transparent 70%)`,
                backgroundColor: C.bg3, display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
              }}>
                <span style={{
                  width: 24, height: 24, borderRadius: 5, background: accent,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: C.fgOnWarm, fontFamily: mono, fontWeight: 700, fontSize: 12,
                }}>{serviceIcon(name)}</span>
                <span style={{
                  position: 'absolute', left: 6, top: 6, width: 7, height: 7,
                  borderRadius: '50%', background: C.green1,
                  boxShadow: `0 0 4px ${C.green1}`,
                }} />
              </div>

              {/* Body */}
              <div style={{ padding: '6px 8px 8px', flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{
                  fontFamily: mono, fontWeight: 700, fontSize: 11, color: C.fg1,
                  lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{name}</div>
                <div style={{
                  fontFamily: mono, fontSize: 9, color: C.fg5, lineHeight: 1.2,
                  wordBreak: 'break-all',
                }}>{image}</div>

                {ports.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, marginTop: 2 }}>
                    {ports.slice(0, 3).map((p) => (
                      <span key={p} style={{
                        background: C.bg3, color: C.orange2, border: `1px solid ${C.border2}`,
                        fontFamily: mono, fontSize: 9, padding: '1px 4px', borderRadius: 3,
                        lineHeight: 1.2,
                      }}>{p}</span>
                    ))}
                  </div>
                )}

                {svcNets.length > 0 && (
                  <div style={{ marginTop: 'auto', display: 'flex', gap: 2 }}>
                    {svcNets.map((n) => {
                      const ni = networks.indexOf(n);
                      return (
                        <span key={n} style={{
                          height: 3, flex: 1, borderRadius: 2,
                          background: ni >= 0 ? pickNetColor(ni) : C.fg5,
                        }} />
                      );
                    })}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Detail drawer ── */}
      {selected && (() => {
        const svc = compose?.services?.[selected] as ServiceDef | undefined;
        if (!svc) return null;
        const image = stringVal(svc.image) || stringVal(svc.build) || 'local build';
        const ports = portDisplay(svc.ports);
        const volumes = listVal(svc.volumes);
        const env = envPairs(svc.environment);
        const dependsOn = listVal(svc.depends_on);
        const svcNets = listVal(svc.networks);

        return (
          <div style={{
            borderTop: `1px solid ${C.borderWarm}`, background: C.bgElev,
          }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center',
              padding: '10px 14px', borderBottom: `1px solid ${C.border2}`,
              background: 'rgba(243,196,108,.04)',
            }}>
              <div>
                <div style={{ fontFamily: mono, fontWeight: 700, fontSize: 14, color: C.orange1 }}>{selected}</div>
                <div style={{ fontFamily: mono, fontSize: 11, color: C.fg4 }}>
                  <span style={{ color: C.fg5 }}>image</span> {image}
                </div>
              </div>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: 'rgba(10,30,14,.7)', border: `1px solid ${C.green2}`,
                color: C.green1, fontFamily: mono, fontSize: 10, padding: '2px 8px',
                borderRadius: 999, letterSpacing: '.08em', textTransform: 'uppercase',
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%', background: C.green1,
                  boxShadow: `0 0 6px ${C.green1}`,
                }} />
                running
              </span>
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, padding: '12px 14px',
            }}>
              <div>
                {env.length > 0 && (
                  <>
                    <div style={{
                      fontFamily: mono, fontWeight: 700, fontSize: 9, letterSpacing: '.14em',
                      textTransform: 'uppercase', color: C.fg5, marginBottom: 6,
                    }}>env</div>
                    {env.map(([k, v]) => (
                      <div key={k} style={{
                        display: 'grid', gridTemplateColumns: '96px 1fr', gap: 8,
                        padding: '2px 0', borderBottom: `1px solid ${C.border2}`,
                        fontFamily: mono, fontSize: 10,
                      }}>
                        <span style={{ color: C.fg5, letterSpacing: '.04em' }}>{k}</span>
                        <span style={{
                          color: isSecret(k) ? C.fg4 : C.fg2, wordBreak: 'break-all',
                          letterSpacing: isSecret(k) ? '.14em' : 'normal',
                        }}>
                          {isSecret(k) ? '••••••••••••' : v || <span style={{ color: C.fg5 }}>&lt;empty&gt;</span>}
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>
              <div>
                {volumes.length > 0 && (
                  <>
                    <div style={{
                      fontFamily: mono, fontWeight: 700, fontSize: 9, letterSpacing: '.14em',
                      textTransform: 'uppercase', color: C.fg5, marginBottom: 6,
                    }}>volumes</div>
                    {volumes.map((v) => (
                      <div key={v} style={{
                        display: 'grid', gridTemplateColumns: '1fr', gap: 8,
                        padding: '2px 0', borderBottom: `1px solid ${C.border2}`,
                        fontFamily: mono, fontSize: 10, color: C.fg2, wordBreak: 'break-all',
                      }}>{v}</div>
                    ))}
                  </>
                )}
                {dependsOn.length > 0 && (
                  <>
                    <div style={{
                      fontFamily: mono, fontWeight: 700, fontSize: 9, letterSpacing: '.14em',
                      textTransform: 'uppercase', color: C.fg5, marginBottom: 6, marginTop: 8,
                    }}>depends on</div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {dependsOn.map((d) => (
                        <span key={d} style={{
                          fontFamily: mono, fontSize: 10, color: C.blue1,
                          background: C.bg0, border: `1px solid ${C.border2}`,
                          padding: '2px 6px', borderRadius: 4,
                        }}>{d}</span>
                      ))}
                    </div>
                  </>
                )}
                {svcNets.length > 0 && (
                  <>
                    <div style={{
                      fontFamily: mono, fontWeight: 700, fontSize: 9, letterSpacing: '.14em',
                      textTransform: 'uppercase', color: C.fg5, marginBottom: 6, marginTop: 8,
                    }}>networks</div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {svcNets.map((n) => {
                        const ni = networks.indexOf(n);
                        return (
                          <span key={n} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            fontFamily: mono, fontSize: 10, color: C.fg2,
                            background: C.bg0, border: `1px solid ${C.border2}`,
                            padding: '2px 6px', borderRadius: 4,
                          }}>
                            <span style={{
                              width: 8, height: 3, borderRadius: 2,
                              background: ni >= 0 ? pickNetColor(ni) : C.fg5,
                            }} />
                            {n}
                          </span>
                        );
                      })}
                    </div>
                  </>
                )}
                {ports.length > 0 && (
                  <>
                    <div style={{
                      fontFamily: mono, fontWeight: 700, fontSize: 9, letterSpacing: '.14em',
                      textTransform: 'uppercase', color: C.fg5, marginBottom: 6, marginTop: 8,
                    }}>ports</div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {ports.map((p) => (
                        <span key={p} style={{
                          fontFamily: mono, fontSize: 10, color: C.orange2,
                          background: C.bg0, border: `1px solid ${C.border2}`,
                          padding: '2px 6px', borderRadius: 4,
                        }}>{p}</span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Bottom strip: volumes + ports ── */}
      {(namedVolumes.length > 0 || networks.length > 0) && (
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
          padding: 10, borderTop: `1px solid ${C.border2}`,
          background: C.bg3,
        }}>
          <div>
            <div style={{
              fontFamily: mono, fontWeight: 700, fontSize: 9, letterSpacing: '.14em',
              textTransform: 'uppercase', color: C.fg5, marginBottom: 6,
            }}>volumes</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {namedVolumes.length > 0
                ? namedVolumes.map((v) => (
                    <span key={v} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      background: C.bg2, border: `2px solid ${C.border2}`,
                      color: C.fg2, fontFamily: mono, fontSize: 10,
                      padding: '2px 8px', borderRadius: 6,
                    }}>
                      <span style={{
                        width: 10, height: 10, background: C.orange2,
                        WebkitMask: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\'><path d=\'M4 5c0-1.65 3.58-3 8-3s8 1.35 8 3v14c0 1.65-3.58 3-8 3s-8-1.35-8-3V5z\'/><ellipse cx=\'12\' cy=\'5\' rx=\'8\' ry=\'3\' fill=\'none\'/></svg>") center/contain no-repeat',
                        mask: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\'><path d=\'M4 5c0-1.65 3.58-3 8-3s8 1.35 8 3v14c0 1.65-3.58 3-8 3s-8-1.35-8-3Vz\'/></svg>") center/contain no-repeat',
                      }} />
                      {v}
                    </span>
                  ))
                : <span style={{ fontFamily: mono, fontSize: 10, color: C.fg5 }}>—</span>
              }
            </div>
          </div>
          <div>
            <div style={{
              fontFamily: mono, fontWeight: 700, fontSize: 9, letterSpacing: '.14em',
              textTransform: 'uppercase', color: C.fg5, marginBottom: 6,
            }}>exposed ports</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {(() => {
                const allPorts = entries.flatMap(([, svc]) =>
                  portDisplay((svc as Record<string, unknown>).ports)
                );
                const unique = [...new Set(allPorts)];
                return unique.length > 0
                  ? unique.map((p) => (
                      <span key={p} style={{
                        fontFamily: mono, fontSize: 10, color: C.orange1,
                        background: C.bg2, border: `2px solid ${C.border2}`,
                        padding: '2px 8px', borderRadius: 6,
                      }}>
                        <b>{p.split(':').pop()}</b>
                        {p.includes(':') && (
                          <span style={{ color: C.fg5 }}> ← {p.split(':')[0]}</span>
                        )}
                      </span>
                    ))
                  : <span style={{ fontFamily: mono, fontSize: 10, color: C.fg5 }}>internal only</span>;
              })()}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
