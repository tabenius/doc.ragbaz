import React, {useMemo, useState} from 'react';

type ComposeMap = Record<string, unknown>;

type DockerComposeViewProps = {
  compose: {
    name?: string;
    services?: Record<string, ComposeMap>;
    volumes?: Record<string, unknown>;
    networks?: Record<string, unknown>;
  };
  title?: string;
  defaultVerbosity?: 'compact' | 'full';
};

const mono =
  '"Intel One Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
const sans =
  '"Noto Sans", Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

export default function DockerComposeView({
  compose,
  title = 'Docker Compose',
  defaultVerbosity = 'compact',
}: DockerComposeViewProps) {
  const [verbosity, setVerbosity] = useState(defaultVerbosity);
  const services = useMemo(
    () => Object.entries(compose?.services || {}),
    [compose],
  );
  const namedVolumes = Object.keys(compose?.volumes || {});
  const networks = Object.keys(compose?.networks || {});

  return (
    <section style={styles.shell}>
      <header style={styles.header}>
        <div>
          <p style={styles.eyebrow}>compose view</p>
          <h2 style={styles.title}>{title}</h2>
          <p style={styles.meta}>
            {services.length} services / {namedVolumes.length} named volumes /{' '}
            {networks.length} networks
          </p>
        </div>
        <div style={styles.segmented} role="tablist" aria-label="Verbosity">
          {(['compact', 'full'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setVerbosity(mode)}
              style={{
                ...styles.segment,
                ...(verbosity === mode ? styles.segmentActive : null),
              }}
            >
              {mode}
            </button>
          ))}
        </div>
      </header>

      <div style={styles.grid}>
        {services.map(([name, service]) => (
          <ServiceCard
            key={name}
            name={name}
            service={service}
            verbosity={verbosity}
          />
        ))}
      </div>

      <footer style={styles.footer}>
        <Foldout title="Named Volumes" items={namedVolumes} defaultOpen={verbosity === 'full'} />
        <Foldout title="Networks" items={networks} defaultOpen={verbosity === 'full'} />
      </footer>
    </section>
  );
}

function ServiceCard({
  name,
  service,
  verbosity,
}: {
  name: string;
  service: ComposeMap;
  verbosity: 'compact' | 'full';
}) {
  const image = stringValue(service.image) || stringValue(service.build) || 'local build';
  const ports = normalizeList(service.ports);
  const volumes = normalizeList(service.volumes);
  const environment = normalizeEnvironment(service.environment);
  const dependsOn = normalizeList(service.depends_on);
  const networks = normalizeList(service.networks);

  return (
    <article style={styles.card}>
      <header style={styles.cardHeader}>
        <div>
          <h3 style={styles.serviceName}>{name}</h3>
          <p style={styles.image}>{image}</p>
        </div>
        <span style={styles.badge}>{ports.length} ports</span>
      </header>

      <div style={styles.pills}>
        {ports.slice(0, verbosity === 'full' ? ports.length : 3).map((port) => (
          <span key={port} style={styles.portPill}>
            {port}
          </span>
        ))}
        {ports.length === 0 ? <span style={styles.mutedPill}>internal</span> : null}
      </div>

      <Foldout title="Ports" items={ports} defaultOpen={verbosity === 'full'} />
      <Foldout title="Volumes" items={volumes} defaultOpen={verbosity === 'full'} />
      <Foldout
        title="Environment"
        items={environment.map(([key, value]) => `${key}=${redactValue(key, value)}`)}
        defaultOpen={verbosity === 'full'}
      />
      <Foldout title="Depends On" items={dependsOn} defaultOpen={verbosity === 'full'} />
      <Foldout title="Networks" items={networks} defaultOpen={verbosity === 'full'} />
    </article>
  );
}

function Foldout({
  title,
  items,
  defaultOpen = false,
}: {
  title: string;
  items: string[];
  defaultOpen?: boolean;
}) {
  if (!items.length) return null;
  return (
    <details style={styles.details} open={defaultOpen}>
      <summary style={styles.summary}>
        <span>{title}</span>
        <span style={styles.count}>{items.length}</span>
      </summary>
      <ul style={styles.list}>
        {items.map((item) => (
          <li key={item} style={styles.listItem}>
            {item}
          </li>
        ))}
      </ul>
    </details>
  );
}

function normalizeList(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (typeof entry === 'string') return entry;
        if (entry && typeof entry === 'object') return JSON.stringify(entry);
        return String(entry);
      })
      .filter(Boolean);
  }
  if (typeof value === 'object') return Object.keys(value as ComposeMap);
  return [String(value)];
}

function normalizeEnvironment(value: unknown): Array<[string, string]> {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((entry) => {
      const [key, ...rest] = String(entry).split('=');
      return [key, rest.join('=') || ''];
    });
  }
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      String(item ?? ''),
    ]);
  }
  return [];
}

function stringValue(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') return JSON.stringify(value);
  return null;
}

function redactValue(key: string, value: string): string {
  if (/secret|token|password|key|credential/i.test(key)) return '<redacted>';
  return value || '<empty>';
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    background: '#0a0908',
    border: '1px solid rgba(243, 196, 108, .32)',
    borderRadius: 8,
    color: '#d8c29d',
    display: 'grid',
    gap: 14,
    margin: '24px 0',
    padding: 14,
  },
  header: {
    alignItems: 'start',
    display: 'flex',
    gap: 12,
    justifyContent: 'space-between',
  },
  eyebrow: {
    color: '#f3c46c',
    fontFamily: mono,
    fontSize: 11,
    letterSpacing: '.12em',
    margin: 0,
    textTransform: 'uppercase',
  },
  title: {
    color: '#f6d7a7',
    fontFamily: sans,
    fontSize: 28,
    lineHeight: 1.05,
    margin: '6px 0 0',
  },
  meta: {
    color: '#bda985',
    fontFamily: mono,
    fontSize: 12,
    margin: '8px 0 0',
  },
  segmented: {
    border: '1px solid rgba(243, 196, 108, .28)',
    borderRadius: 8,
    display: 'inline-flex',
    overflow: 'hidden',
  },
  segment: {
    background: '#11100e',
    border: 0,
    color: '#d8c29d',
    cursor: 'pointer',
    fontFamily: mono,
    fontSize: 12,
    padding: '8px 10px',
  },
  segmentActive: {
    background: '#f3c46c',
    color: '#1a1208',
    fontWeight: 800,
  },
  grid: {
    display: 'grid',
    gap: 12,
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  },
  card: {
    background: '#12100d',
    border: '1px solid rgba(255,255,255,.1)',
    borderRadius: 8,
    display: 'grid',
    gap: 10,
    padding: 12,
  },
  cardHeader: {
    alignItems: 'start',
    display: 'flex',
    gap: 10,
    justifyContent: 'space-between',
  },
  serviceName: {
    color: '#f6d7a7',
    fontFamily: sans,
    fontSize: 22,
    lineHeight: 1.1,
    margin: 0,
  },
  image: {
    color: '#bda985',
    fontFamily: mono,
    fontSize: 11,
    margin: '6px 0 0',
    overflowWrap: 'anywhere',
  },
  badge: {
    background: 'rgba(122, 184, 255, .14)',
    border: '1px solid rgba(122, 184, 255, .28)',
    borderRadius: 999,
    color: '#7ab8ff',
    fontFamily: mono,
    fontSize: 11,
    padding: '4px 7px',
    whiteSpace: 'nowrap',
  },
  pills: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  portPill: {
    background: 'rgba(243,196,108,.14)',
    border: '1px solid rgba(243,196,108,.26)',
    borderRadius: 999,
    color: '#f3c46c',
    fontFamily: mono,
    fontSize: 11,
    padding: '4px 7px',
  },
  mutedPill: {
    color: '#8e8068',
    fontFamily: mono,
    fontSize: 11,
  },
  details: {
    borderTop: '1px solid rgba(255,255,255,.08)',
    paddingTop: 8,
  },
  summary: {
    alignItems: 'center',
    color: '#f3c46c',
    cursor: 'pointer',
    display: 'flex',
    fontFamily: mono,
    fontSize: 12,
    justifyContent: 'space-between',
  },
  count: {
    color: '#7ab8ff',
  },
  list: {
    display: 'grid',
    gap: 4,
    listStyle: 'none',
    margin: '8px 0 0',
    padding: 0,
  },
  listItem: {
    background: '#080706',
    border: '1px solid rgba(255,255,255,.08)',
    borderRadius: 6,
    color: '#d8c29d',
    fontFamily: mono,
    fontSize: 11,
    overflowWrap: 'anywhere',
    padding: '6px 7px',
  },
  footer: {
    display: 'grid',
    gap: 8,
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  },
};
