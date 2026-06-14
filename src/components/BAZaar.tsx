import { useState } from 'react';

const provenanceColors: Record<string, string> = {
  bazaar: '#f3c46c',
  articulate: '#7ab8ff',
  zone: '#a9b665',
  app: '#ea6962',
  archive: '#d8a657',
  research: '#c68a47',
};

const formatColors: Record<string, string> = {
  binary: '#ea6962',
  notebook: '#7ab8ff',
  doc: '#a9b665',
  source: '#d8a657',
  wasm: '#c68a47',
};

export function BAZListingTaxonomy() {
  const [provenance, setProvenance] = useState('bazaar');
  const [format, setFormat] = useState('notebook');
  return (
    <div style={{ background: '#1d1c1b', border: '1px solid #4a4744', borderRadius: 4, padding: 20, margin: '24px 0' }}>
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', marginBottom: 16 }}>
        <fieldset style={{ border: '1px solid #3a3735', borderRadius: 4, padding: 12 }}>
          <legend style={{ color: '#9e9487', fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1 }}>Provenance</legend>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Object.keys(provenanceColors).map(p => (
              <button key={p} onClick={() => setProvenance(p)}
                style={{
                  background: provenance === p ? '#353332' : 'transparent',
                  color: provenance === p ? provenanceColors[p] : '#c7bfb3',
                  border: `1.5px solid ${provenance === p ? provenanceColors[p] : '#4a4744'}`,
                  borderRadius: 4, padding: '4px 12px', cursor: 'pointer',
                  fontFamily: 'monospace', fontSize: 12, textTransform: 'capitalize',
                }}
              >{p}</button>
            ))}
          </div>
        </fieldset>
        <fieldset style={{ border: '1px solid #3a3735', borderRadius: 4, padding: 12 }}>
          <legend style={{ color: '#9e9487', fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1 }}>Format</legend>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Object.keys(formatColors).map(f => (
              <button key={f} onClick={() => setFormat(f)}
                style={{
                  background: format === f ? '#353332' : 'transparent',
                  color: format === f ? formatColors[f] : '#c7bfb3',
                  border: `1.5px solid ${format === f ? formatColors[f] : '#4a4744'}`,
                  borderRadius: 4, padding: '4px 12px', cursor: 'pointer',
                  fontFamily: 'monospace', fontSize: 12, textTransform: 'capitalize',
                }}
              >{f}</button>
            ))}
          </div>
        </fieldset>
      </div>
      <div style={{ background: '#242221', border: '1px solid #3a3735', borderRadius: 4, padding: 16 }}>
        <div style={{ color: '#9e9487', fontSize: 11, fontFamily: 'monospace', marginBottom: 8 }}>SLUG</div>
        <div style={{ color: '#f0ece4', fontFamily: 'monospace', fontSize: 14 }}>
          {provenance}/{format}/{provenance}-{format}-demo-01
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <span style={{ background: provenanceColors[provenance] + '22', border: `1px solid ${provenanceColors[provenance]}`, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontFamily: 'monospace', color: provenanceColors[provenance] }}>{provenance}</span>
          <span style={{ background: formatColors[format] + '22', border: `1px solid ${formatColors[format]}`, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontFamily: 'monospace', color: formatColors[format] }}>{format}</span>
        </div>
      </div>
    </div>
  );
}

export function BAZSpecimenViewer({ title, description, language, code }: { title: string; description: string; language: string; code: string }) {
  const [active, setActive] = useState('preview');
  return (
    <div style={{ background: '#1d1c1b', border: '1px solid #4a4744', borderRadius: 4, margin: '24px 0', overflow: 'hidden' }}>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid #4a4744', fontFamily: 'monospace', fontSize: 13, color: '#f3c46c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{title}</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {['preview', 'code', 'output'].map(tab => (
            <button key={tab} onClick={() => setActive(tab)}
              style={{
                background: active === tab ? '#353332' : 'transparent',
                color: active === tab ? '#f3c46c' : '#9e9487',
                border: `1px solid ${active === tab ? '#f3c46c' : 'transparent'}`,
                borderRadius: 2, padding: '2px 8px', cursor: 'pointer',
                fontFamily: 'monospace', fontSize: 10, textTransform: 'uppercase',
              }}
            >{tab}</button>
          ))}
        </div>
      </div>
      {active === 'preview' && (
        <div style={{ padding: 16, color: '#c7bfb3', fontSize: 14 }}>
          <p style={{ color: '#9e9487', fontFamily: 'monospace', fontSize: 12, marginBottom: 12 }}>{description}</p>
          <pre style={{ background: '#181716', border: '1px solid #3a3735', borderRadius: 4, padding: 16, fontFamily: 'monospace', fontSize: 13, color: '#d8c29d', overflow: 'auto' }}><code>{code}</code></pre>
        </div>
      )}
      {active === 'code' && (
        <pre style={{ background: '#181716', padding: 16, fontFamily: 'monospace', fontSize: 13, color: '#d8c29d', overflow: 'auto', margin: 0 }}><code>{code}</code></pre>
      )}
      {active === 'output' && (
        <div style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 80 }}>
          <div style={{ background: '#1e2822', border: '1px solid #a9b665', borderRadius: 4, padding: '12px 24px', color: '#a9b665', fontFamily: 'monospace', fontSize: 13 }}>✓ specimen executed (240 ticks, 0 errors)</div>
        </div>
      )}
    </div>
  );
}

export function BAZDeployFlow() {
  const [step, setStep] = useState(0);
  const steps = [
    'Buyer clicks "Deploy"',
    'BAZaar resolves tenant + listing',
    'Control plane provisions subdomain',
    'Specimens attached as pages',
    'Deployment artifact generated',
    'URL returned to buyer',
  ];
  return (
    <div style={{ background: '#1d1c1b', border: '1px solid #4a4744', borderRadius: 4, margin: '24px 0', overflow: 'hidden' }}>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid #4a4744', fontFamily: 'monospace', fontSize: 13, color: '#7ab8ff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
        Deploy Pipeline
      </div>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {steps.map((s, i) => (
          <div key={i} onClick={() => setStep(i)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
              padding: '6px 12px', borderRadius: 4,
              background: i <= step ? '#242221' : 'transparent',
              border: `1px solid ${i === step ? '#7ab8ff' : i < step ? '#3a3735' : '#2a2a2a'}`,
              opacity: i <= step ? 1 : 0.5,
            }}
          >
            <span style={{
              width: 22, height: 22, borderRadius: '50%',
              background: i < step ? '#7ab8ff' : i === step ? '#f3c46c' : '#3a3735',
              color: i <= step ? '#0a0908' : '#737373',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'monospace', fontSize: 11, fontWeight: 700, flexShrink: 0,
            }}>{i + 1}</span>
            <span style={{ color: i <= step ? '#f0ece4' : '#737373', fontFamily: 'monospace', fontSize: 12 }}>{s}</span>
            {i === step && <span style={{ marginLeft: 'auto', color: '#f3c46c', fontSize: 10, fontFamily: 'monospace' }}>◀ active</span>}
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid #3a3735', padding: '8px 16px' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setStep(Math.max(0, step - 1))} style={{ background: '#353332', border: '1px solid #4a4744', borderRadius: 4, padding: '4px 12px', cursor: 'pointer', color: '#c7bfb3', fontFamily: 'monospace', fontSize: 11 }}>◀ Prev</button>
          <button onClick={() => setStep(Math.min(steps.length - 1, step + 1))} style={{ background: '#353332', border: '1px solid #4a4744', borderRadius: 4, padding: '4px 12px', cursor: 'pointer', color: '#c7bfb3', fontFamily: 'monospace', fontSize: 11 }}>Next ▶</button>
        </div>
      </div>
    </div>
  );
}

export function BAZProductCard({ provenance = 'bazaar', title = 'Specimen', formats = ['notebook'], price = 0, tier = 'free', onDeploy, onFork }: {
  provenance?: string; title?: string; formats?: string[]; price?: number; tier?: string; onDeploy?: () => void; onFork?: () => void;
}) {
  const [tierState, setTierState] = useState(tier);
  const priceColor = tierState === 'free' ? '#a9b665' : tierState === 'paid' ? '#f3c46c' : '#7ab8ff';
  const priceLabel = tierState === 'free' ? 'Free' : tierState === 'paid' ? `$${price}.00` : `$${price}/mo`;

  return (
    <div style={{
      background: '#1d1c1b', border: '1px solid #4a4744', borderRadius: 6,
      padding: 16, fontFamily: 'monospace',
      display: 'flex', flexDirection: 'column', gap: 12, margin: '24px 0',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#f0ece4' }}>{title}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ background: provenanceColors[provenance] + '22', border: `1px solid ${provenanceColors[provenance]}`, borderRadius: 3, padding: '1px 6px', fontSize: 10, color: provenanceColors[provenance] }}>{provenance}</span>
            {formats.map(f => (
              <span key={f} style={{ background: '#242221', border: '1px solid #3a3735', borderRadius: 3, padding: '1px 6px', fontSize: 10, color: '#9e9487' }}>{f}</span>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: priceColor }}>{priceLabel}</div>
      </div>

      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <label style={{ color: '#9e9487', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Tier</label>
        <div style={{ display: 'flex', gap: 4 }}>
          {['free', 'paid', 'subscription'].map(t => (
            <button key={t} onClick={() => setTierState(t)}
              style={{
                background: tierState === t ? '#353332' : 'transparent',
                color: tierState === t ? '#f3c46c' : '#9e9487',
                border: `1px solid ${tierState === t ? '#f3c46c' : '#3a3735'}`,
                borderRadius: 3, padding: '2px 8px', cursor: 'pointer',
                fontFamily: 'monospace', fontSize: 10, textTransform: 'capitalize',
              }}
            >{t}</button>
          ))}
        </div>
      </div>

      <div style={{ height: 80, background: '#181716', border: '1px solid #2a2a2a', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#4a4744', fontSize: 10 }}>
          ▣ specimen preview · {formats[0]} · {provenance}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onDeploy}
          style={{
            flex: 1, background: '#2a1d12', border: '1.5px solid #f3c46c',
            borderRadius: 4, padding: '6px 16px', cursor: 'pointer',
            color: '#f3c46c', fontFamily: 'monospace', fontSize: 11,
            fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1,
          }}
        >Deploy</button>
        <button onClick={onFork}
          style={{
            flex: 1, background: 'transparent', border: '1.5px solid #4a4744',
            borderRadius: 4, padding: '6px 16px', cursor: 'pointer',
            color: '#c7bfb3', fontFamily: 'monospace', fontSize: 11,
            textTransform: 'uppercase', letterSpacing: 1,
          }}
        >Fork</button>
      </div>
    </div>
  );
}

export function BAZCartCheckout() {
  const [step, setStep] = useState('browse');
  const [tier, setTier] = useState('free');
  const items = [
    { title: 'MATCHES Simulation Engine', price: 0, provenance: 'bazaar' },
    { title: 'Mailguard Policy Pack', price: 29, provenance: 'articulate' },
    { title: 'Glither Ruleset Compiler', price: 49, provenance: 'research' },
  ];

  const total = items.reduce((sum, item) => sum + item.price, 0);
  const finalPrice = tier === 'free' ? 0 : tier === 'paid' ? total : Math.round(total * 0.1);

  return (
    <div style={{
      background: '#1d1c1b', border: '1px solid #4a4744', borderRadius: 6,
      margin: '24px 0', overflow: 'hidden', fontFamily: 'monospace',
    }}>
      <div style={{
        display: 'flex', borderBottom: '1px solid #3a3735',
      }}>
        {[
          { id: 'browse', label: 'Browse' },
          { id: 'cart', label: 'Cart' },
          { id: 'checkout', label: 'Checkout' },
          { id: 'done', label: 'Confirmation' },
        ].map(s => (
          <button key={s.id} onClick={() => setStep(s.id)}
            style={{
              flex: 1, padding: '8px 12px', cursor: 'pointer',
              background: step === s.id ? '#242221' : 'transparent',
              border: 'none', borderRight: '1px solid #3a3735',
              color: step === s.id ? '#f3c46c' : '#737373',
              fontFamily: 'monospace', fontSize: 10,
              textTransform: 'uppercase', letterSpacing: 1,
              fontWeight: step === s.id ? 700 : 400,
            }}
          >{s.label}</button>
        ))}
      </div>

      <div style={{ padding: 16, minHeight: 160 }}>
        {step === 'browse' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ color: '#9e9487', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Available Listings</div>
            {items.map(item => (
              <div key={item.title} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '6px 10px', background: '#181716', border: '1px solid #2a2a2a', borderRadius: 4,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: '#f0ece4' }}>{item.title}</span>
                  <span style={{ fontSize: 9, color: '#737373', background: '#242221', borderRadius: 2, padding: '1px 4px' }}>{item.provenance}</span>
                </div>
                <span style={{ fontSize: 11, color: item.price === 0 ? '#a9b665' : '#f3c46c', fontWeight: 600 }}>
                  {item.price === 0 ? 'Free' : `$${item.price}`}
                </span>
              </div>
            ))}
          </div>
        )}

        {step === 'cart' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ color: '#9e9487', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
              Cart ({items.length} items)
            </div>
            {items.map(item => (
              <div key={item.title} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '6px 10px', background: '#181716', border: '1px solid #2a2a2a', borderRadius: 4,
              }}>
                <span style={{ fontSize: 11, color: '#f0ece4' }}>{item.title}</span>
                <span style={{ fontSize: 11, color: item.price === 0 ? '#a9b665' : '#f3c46c' }}>
                  {item.price === 0 ? 'Free' : `$${item.price}.00`}
                </span>
              </div>
            ))}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 10px', borderTop: '1px solid #3a3735', marginTop: 4,
            }}>
              <span style={{ fontSize: 11, color: '#9e9487' }}>Subtotal</span>
              <span style={{ fontSize: 13, color: '#f0ece4', fontWeight: 700 }}>${total}.00</span>
            </div>
          </div>
        )}

        {step === 'checkout' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ color: '#9e9487', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
              Tier & Payment
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['free', 'paid', 'subscription'].map(t => (
                <button key={t} onClick={() => setTier(t)}
                  style={{
                    flex: 1, padding: '10px 8px', cursor: 'pointer',
                    background: tier === t ? '#353332' : 'transparent',
                    border: `1.5px solid ${tier === t ? '#f3c46c' : '#3a3735'}`,
                    borderRadius: 4, textAlign: 'center',
                  }}
                >
                  <div style={{ color: tier === t ? '#f3c46c' : '#9e9487', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{t}</div>
                  <div style={{ color: tier === t ? '#f0ece4' : '#737373', fontSize: 13, fontWeight: 700, marginTop: 4 }}>
                    {t === 'free' ? 'Free' : t === 'paid' ? `$${total}.00` : `$${Math.round(total * 0.1)}/mo`}
                  </div>
                </button>
              ))}
            </div>
            <div style={{
              background: '#122230', border: '1px solid #7ab8ff', borderRadius: 4,
              padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ color: '#7ab8ff', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Stripe Checkout</div>
                <div style={{ color: '#c7bfb3', fontSize: 10, marginTop: 2 }}>secured by articulated control plane</div>
              </div>
              <span style={{ color: '#f0ece4', fontSize: 14, fontWeight: 700 }}>
                {tier === 'free' ? '$0.00' : tier === 'paid' ? `$${total}.00` : `$${finalPrice}.00`}
              </span>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>✓</div>
            <div style={{ color: '#a9b665', fontSize: 13, fontWeight: 600 }}>Order Confirmed</div>
            <div style={{ color: '#737373', fontSize: 11, marginTop: 4 }}>
              3 specimens deploying to your tenant · receipt sent to email
            </div>
            <div style={{
              background: '#181716', border: '1px solid #2a2a2a', borderRadius: 4,
              padding: 10, marginTop: 12, textAlign: 'left',
            }}>
              <div style={{ color: '#9e9487', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Order Summary</div>
              {items.map(item => (
                <div key={item.title} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#c7bfb3', padding: '2px 0' }}>
                  <span>{item.title}</span>
                  <span>{item.price === 0 ? 'Free' : `$${item.price}`}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid #2a2a2a', marginTop: 4, paddingTop: 4, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#f0ece4', fontWeight: 600 }}>
                <span>Total</span>
                <span>{tier === 'free' ? 'Free' : `$${finalPrice}.00`}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ borderTop: '1px solid #3a3735', padding: '8px 16px', display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {['browse', 'cart', 'checkout', 'done'].indexOf(step) > 0 && (
            <button onClick={() => setStep(['browse', 'cart', 'checkout', 'done'][['browse', 'cart', 'checkout', 'done'].indexOf(step) - 1])}
              style={{ background: '#353332', border: '1px solid #4a4744', borderRadius: 4, padding: '4px 12px', cursor: 'pointer', color: '#c7bfb3', fontFamily: 'monospace', fontSize: 11 }}
            >◀ Back</button>
          )}
        </div>
        <div>
          {step === 'browse' && <button onClick={() => setStep('cart')} style={{ background: '#353332', border: '1px solid #4a4744', borderRadius: 4, padding: '4px 12px', cursor: 'pointer', color: '#c7bfb3', fontFamily: 'monospace', fontSize: 11 }}>View Cart ▶</button>}
          {step === 'cart' && <button onClick={() => setStep('checkout')} style={{ background: '#2a1d12', border: '1.5px solid #f3c46c', borderRadius: 4, padding: '4px 12px', cursor: 'pointer', color: '#f3c46c', fontFamily: 'monospace', fontSize: 11, fontWeight: 600 }}>Checkout ▶</button>}
          {step === 'checkout' && <button onClick={() => setStep('done')} style={{ background: '#1e2822', border: '1.5px solid #a9b665', borderRadius: 4, padding: '4px 12px', cursor: 'pointer', color: '#a9b665', fontFamily: 'monospace', fontSize: 11, fontWeight: 600 }}>Pay ${finalPrice} ▶</button>}
        </div>
      </div>
    </div>
  );
}

export function BAZOrderTimeline() {
  const [activeId, setActiveId] = useState(2);
  const events = [
    { id: 1, label: 'Buyer places order', time: 'T+0s', status: 'done', actor: 'tenant' },
    { id: 2, label: 'BAZaar validates payment', time: 'T+2s', status: 'done', actor: 'control-plane' },
    { id: 3, label: 'Specimens compiling', time: 'T+8s', status: 'active', actor: 'builder' },
    { id: 4, label: 'Deploying to tenant', time: 'T+15s', status: 'pending', actor: 'provision' },
    { id: 5, label: 'Health check pass', time: 'T+25s', status: 'pending', actor: 'monitor' },
    { id: 6, label: 'URL returned', time: 'T+30s', status: 'pending', actor: 'gateway' },
  ];

  return (
    <div style={{ background: '#1d1c1b', border: '1px solid #4a4744', borderRadius: 6, padding: 20, margin: '24px 0', fontFamily: 'monospace' }}>
      <div style={{ color: '#9e9487', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Order Timeline</div>
      {events.map((ev, i) => {
        const isActive = ev.id === activeId;
        const isPast = ev.status === 'done' || (ev.status === 'active');
        const statusColor = ev.status === 'done' ? '#a9b665' : ev.status === 'active' ? '#f3c46c' : '#3a3735';
        return (
          <div key={ev.id} onClick={() => setActiveId(ev.id)}
            style={{
              display: 'flex', gap: 12, cursor: 'pointer',
              padding: '6px 0', opacity: ev.status === 'pending' ? 0.5 : 1,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20 }}>
              <div style={{
                width: 12, height: 12, borderRadius: '50%',
                background: ev.status === 'done' ? '#a9b665' : ev.status === 'active' ? '#f3c46c' : '#2a2a2a',
                border: ev.status === 'active' ? '2px solid #f3c46c' : 'none',
                flexShrink: 0,
              }} />
              {i < events.length - 1 && (
                <div style={{
                  width: 1, flex: 1, minHeight: 16,
                  background: statusColor,
                  opacity: ev.status === 'pending' ? 0.3 : 0.6,
                }} />
              )}
            </div>
            <div style={{ flex: 1, paddingBottom: i < events.length - 1 ? 4 : 0 }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{
                  color: isActive ? '#f0ece4' : ev.status === 'done' ? '#c7bfb3' : '#737373',
                  fontSize: 12,
                }}>{ev.label}</span>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ color: '#737373', fontSize: 9 }}>{ev.actor}</span>
                  {isActive && <span style={{ color: '#f3c46c', fontSize: 9 }}>◀</span>}
                </div>
              </div>
              <div style={{ color: '#737373', fontSize: 9, marginTop: 2 }}>{ev.time}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
