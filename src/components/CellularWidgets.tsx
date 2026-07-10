import React, { useState } from 'react';

/*
 * Interactive widgets for the /school/cellular field reference.
 * Ported from the standalone Tufte-CSS artifact's vanilla-JS widgets into
 * React, restyled onto the RAGBAZ gruvbox-dark palette used across the docs.
 * Content strings carry inline <span class="ok|bad|warn"> markup and are
 * static/trusted, so they are injected via dangerouslySetInnerHTML.
 */

const mono = 'ui-monospace, SFMono-Regular, "Intel One Mono", monospace';
const C = {
  card: '#282828', page: '#1d2021', border: '#3c3836',
  fg: '#d5c4a1', muted: '#928374', accent: '#fe8019',
  ok: '#b8bb26', bad: '#fb4934', warn: '#fabd2f', blue: '#83a598',
};

// One-time style block for the ok/bad/warn spans + control chrome.
const STYLE_ID = 'cellular-widget-style';
const CSS = `
.cw-rich .ok{color:${C.ok};font-weight:700}
.cw-rich .bad{color:${C.bad};font-weight:700}
.cw-rich .warn{color:${C.warn};font-weight:700}
.cw-rich code{color:${C.accent};background:${C.page};border:1px solid ${C.border};border-radius:3px;padding:.05em .3em;font-family:${mono}}
.cw-rich ul{margin:.4rem 0 0;padding-left:1.2rem}
.cw-rich li{margin:.25rem 0}
.cw-btn{font-family:${mono};font-size:12px;background:${C.page};color:${C.fg};border:1px solid ${C.border};border-radius:6px;padding:6px 12px;cursor:pointer;transition:border-color .12s,color .12s}
.cw-btn:hover{border-color:${C.accent};color:${C.accent}}
.cw-btn.on{background:${C.accent};color:${C.page};border-color:${C.accent};font-weight:700}
.cw-sel{font-family:${mono};font-size:13px;background:${C.page};color:${C.fg};border:1px solid ${C.border};border-radius:6px;padding:6px 8px}
.cw-chk{font-family:${mono};font-size:13px;color:${C.fg};cursor:pointer;user-select:none;display:inline-flex;align-items:center;gap:6px}
`;

function useWidgetStyle() {
  if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
    const el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = CSS;
    document.head.appendChild(el);
  }
}

function Panel({ title, tag, children }: { title: string; tag?: string; children: React.ReactNode }) {
  useWidgetStyle();
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.accent}`,
      borderRadius: 6, padding: '14px 16px', margin: '22px 0',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <h4 style={{ margin: 0, fontFamily: mono, fontSize: 14, fontWeight: 700, color: C.fg, letterSpacing: '.02em' }}>{title}</h4>
        {tag && <span style={{ fontFamily: mono, fontSize: 10, background: C.accent, color: C.page, padding: '2px 7px', borderRadius: 4, letterSpacing: '.06em' }}>{tag}</span>}
      </div>
      {children}
    </div>
  );
}

function Controls({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 18px', marginBottom: 12 }}>{children}</div>;
}

function Readout({ html }: { html: string }) {
  return (
    <div className="cw-rich" style={{
      background: C.page, border: `1px solid ${C.border}`, borderRadius: 6,
      padding: '12px 14px', fontSize: 14, lineHeight: 1.55, color: C.fg, minHeight: '2rem',
    }} dangerouslySetInnerHTML={{ __html: html }} />
  );
}

function Check({ label, checked, onChange }: { label: React.ReactNode; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="cw-chk">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

/* ---- 1 · Trust-anchor explorer ---- */
const TRUST: Record<string, string> = {
  euicc: "<span class='bad'>Client-side impersonation.</span> A stolen eUICC private key + GSMA cert lets an attacker authenticate to real SM-DP+ servers as a genuine eUICC and pull operator profiles in cleartext — enabling eSIM cloning. This is the Kigen result.",
  dp: "<span class='bad'>Server-side impersonation.</span> A rogue/stolen SM-DP+ certificate completes mutual auth and can push an attacker-chosen profile to a real eUICC — hijacking the device network identity. Mitigated only by fast certificate revocation.",
  ts48: "<span class='warn'>Foothold.</span> A TS.48 generic test profile ≤ v6.0 ships publicly-known keys, allowing an applet load — step one of the Kigen chain. TS.48 v7.0 restricts this; the risk persists on un-updated IoT eUICCs.",
  lpa: "<span class='warn'>Depends on a valid cert.</span> Without a GSMA-signed cert the eUICC rejects a hostile SM-DP+ at authentication (residual risk = phishing/LPA-parsing bugs). With a stolen cert it becomes the server-side impersonation above.",
};
export function TrustExplorer() {
  const [k, setK] = useState<string | null>(null);
  const opts: [string, string][] = [
    ['euicc', 'eUICC private key stolen'], ['dp', 'SM-DP+ cert stolen'],
    ['ts48', 'TS.48 test profile ≤ v6.0'], ['lpa', 'Hostile SM-DP+ / QR spoof'],
  ];
  return (
    <Panel title="Trust-anchor explorer" tag="what-if">
      <Controls>
        {opts.map(([key, label]) => (
          <button key={key} className={'cw-btn' + (k === key ? ' on' : '')} onClick={() => setK(key)}>{label}</button>
        ))}
      </Controls>
      <Readout html={k ? TRUST[k] : 'Select a compromise to see the consequence.'} />
    </Panel>
  );
}

/* ---- 2 · Lost-SIM leak explorer ---- */
export function LostSimExplorer() {
  const [pin, setPin] = useState(false);
  const [mil, setMil] = useState(true);
  const [g2, setG2] = useState(false);
  const [rep, setRep] = useState(false);
  const out: string[] = [];
  if (pin) {
    out.push("<span class='ok'>Card inert on power-up.</span> After a reboot, stored data and network use are blocked without the PIN. Loss ≈ just the plastic.");
  } else {
    out.push("<span class='bad'>Unlocked card.</span> A reader dumps IMSI, ICCID, last location area and cached session keys; contacts/SMS if any are stored on-card.");
    if (rep) out.push("<span class='ok'>Reported:</span> carrier deactivation/reissue collapses the insert-in-another-phone attack.");
    else out.push("<span class='bad'>Not reported:</span> inserted in another phone the number receives the victim’s calls and <strong>SMS one-time codes</strong> → account takeover; SMS relay + sender-ID spoofing can even mask the theft.");
  }
  out.push(mil
    ? "<span class='ok'>Ki safe:</span> Milenage resists chosen-challenge cloning — the SIM cannot be duplicated."
    : "<span class='bad'>Clonable:</span> COMP128-1 permits Ki recovery via chosen-challenge cryptanalysis (classic SIM cloning).");
  if (g2) out.push("<span class='warn'>2G fallback:</span> A5/1 downgrade enables captured-session decryption.");
  return (
    <Panel title="Lost-SIM leak explorer" tag="interactive">
      <Controls>
        <Check label="SIM PIN enabled" checked={pin} onChange={setPin} />
        <Check label="Modern USIM (Milenage)" checked={mil} onChange={setMil} />
        <Check label="2G fallback enabled" checked={g2} onChange={setG2} />
        <Check label="Reported to carrier" checked={rep} onChange={setRep} />
      </Controls>
      <Readout html={'<ul><li>' + out.join('</li><li>') + '</li></ul>'} />
    </Panel>
  );
}

/* ---- 3 · Sender-verification comparator ---- */
const VER: Record<string, string> = {
  sms: "<span class='bad'>No handset-verifiable origin.</span> TP-OA is a spoofable string; the SMSC address is an unreliable delivery hint; no signature, no origin-network attestation.",
  mms: "<span class='bad'>No better than email.</span> Intra-carrier the MMSC may insert the originator, but across MM4 the <code>From:</code> is an SMTP/MIME header with no DKIM/SPF/DMARC enforced — email-grade spoofable.",
  rcs: "<span class='ok'>Verified sender.</span> RBM brand/agent verification (carrier + Google backend) authenticates a registered business; the handset renders a trust-anchored name, logo and checkmark.",
};
export function SenderVerify() {
  const [ch, setCh] = useState('sms');
  return (
    <Panel title="Sender-verification comparator" tag="interactive">
      <Controls>
        <label className="cw-chk">Channel:&nbsp;
          <select className="cw-sel" value={ch} onChange={(e) => setCh(e.target.value)}>
            <option value="sms">SMS</option>
            <option value="mms">MMS (inter-carrier / MM4)</option>
            <option value="rcs">RCS verified sender (RBM)</option>
          </select>
        </label>
      </Controls>
      <Readout html={VER[ch]} />
    </Panel>
  );
}

/* ---- 4 · VPN-bypass & evidence locator ---- */
export function VpnBypass() {
  const [bind, setBind] = useState(false);
  const [lock, setLock] = useState(true);
  const [off, setOff] = useState(false);
  const out: string[] = [];
  if (bind) {
    out.push("<span class='bad'>Escapes the VPN.</span> The socket is pinned to the MMS PDN (rmnet); " + (lock ? 'even always-on lockdown' : 'the tunnel') + ' does not capture it.');
    out.push('Reaches the carrier MMSC over the dedicated bearer regardless of MMSC off-net status.');
  } else if (lock) {
    out.push("<span class='ok'>Captured by the VPN.</span> Unbound traffic follows the default route into the tunnel.");
    out.push(off ? 'MMSC reachable off-net → the POST completes through the tunnel.'
      : "<span class='warn'>APN-gated MMSC unreachable over the tunnel → the send fails.</span>");
  } else {
    out.push('Unbound traffic uses the current default network (WiFi/cellular).');
  }
  out.push("<span class='warn'>Evidence:</span> the carrier CDR logs the PDN activation and byte counts either way — cross-check against on-device netstats.");
  return (
    <Panel title="VPN-bypass & evidence locator" tag="interactive">
      <Controls>
        <Check label="App binds to MMS network" checked={bind} onChange={setBind} />
        <Check label="Always-on lockdown VPN" checked={lock} onChange={setLock} />
        <Check label="MMSC reachable off-net" checked={off} onChange={setOff} />
      </Controls>
      <Readout html={'<ul><li>' + out.join('</li><li>') + '</li></ul>'} />
    </Panel>
  );
}

/* ---- 5 · Record-access route planner ---- */
const REC_ROUTE: Record<string, Record<string, string>> = {
  sub: {
    bill: "<span class='ok'>Self-service.</span> Your itemised bill and online usage portal already list calls, SMS and per-session data volume. No court needed.",
    pdn: "<span class='warn'>DSAR.</span> A GDPR Art. 15 request compels the operator’s retained personal data, which typically includes PDN/data-session usage — granularity varies by carrier and law.",
    loc: "<span class='warn'>DSAR, coarse only.</span> A DSAR may return billing-grade cell associations, but fine historical cell-site is generally released to the account holder only in summary form.",
    content: "<span class='bad'>Not available.</span> Message/call <em>content</em> and live intercept are never a self-service product — only lawful process can compel them, and not to you.",
  },
  ent: {
    bill: "<span class='ok'>Business portal.</span> For numbers on your account (MDM/EMM fleet, business or family plan) itemised usage is available through the account team.",
    pdn: "<span class='ok'>On-account only.</span> PDN/data records for account-owned lines via the business portal; you cannot reach lines you do not own.",
    loc: "<span class='warn'>Limited.</span> Enterprise access rarely includes fine location; coarse serving-cell may appear in usage exports.",
    content: "<span class='bad'>No.</span> Ownership of the plan does not grant access to a user’s message/call content.",
  },
  le: {
    bill: "<span class='ok'>Subpoena.</span> Subscriber and toll (CDR) records reachable with a subpoena; send a <strong>preservation letter first</strong> to freeze them.",
    pdn: "<span class='warn'>Court order.</span> PGW/SMF PDN-session records — APN, activation times, byte counts, allocated IP — typically require a court order (transactional records).",
    loc: "<span class='warn'>Court order / warrant.</span> Historical cell-site and tower dumps generally need a court order or, per jurisdiction, a warrant; precise/real-time location trends toward a warrant.",
    content: "<span class='bad'>Warrant.</span> Content and real-time lawful intercept (ETSI LI / CALEA) require a warrant. Cross-border, route via MLAT.",
  },
  def: {
    bill: "<span class='ok'>Act as the subscriber.</span> With the subscriber’s written consent you file their DSAR / pull their bill on their behalf — the cleanest evidence path in an authorised investigation.",
    pdn: "<span class='warn'>Consent-scoped DSAR.</span> The subject’s DSAR can surface PDN usage; anything beyond what they can lawfully obtain requires escalation to law enforcement.",
    loc: "<span class='warn'>Limited to subject’s own rights.</span> You inherit only what the subscriber could themselves request; fine location usually needs legal process you cannot invoke.",
    content: "<span class='bad'>Escalate.</span> Content/intercept is outside a consent-based engagement — refer to law enforcement with a warrant.",
  },
};
export function RecordRoutePlanner() {
  const [who, setWho] = useState('sub');
  const [what, setWhat] = useState('bill');
  return (
    <Panel title="Record-access route planner" tag="interactive">
      <Controls>
        <label className="cw-chk">Who is asking:&nbsp;
          <select className="cw-sel" value={who} onChange={(e) => setWho(e.target.value)}>
            <option value="sub">Subscriber (self)</option>
            <option value="ent">Enterprise / plan owner</option>
            <option value="le">Law enforcement</option>
            <option value="def">Defender w/ written consent</option>
          </select>
        </label>
        <label className="cw-chk">Record wanted:&nbsp;
          <select className="cw-sel" value={what} onChange={(e) => setWhat(e.target.value)}>
            <option value="bill">Itemised usage / bill</option>
            <option value="pdn">PDN / data-session (PGW/SMF)</option>
            <option value="loc">Historical cell-site / location</option>
            <option value="content">Message/call content or live intercept</option>
          </select>
        </label>
      </Controls>
      <Readout html={REC_ROUTE[who][what]} />
    </Panel>
  );
}
