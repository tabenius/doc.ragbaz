import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import styles from './index.module.css';

export default function Home(): ReactNode {
  return (
    <Layout title="RAGBAZ" description="software atelier">
      <main className={styles.page}>
        <div className="container">
          <section className={styles.statement}>

            <p className={styles.wordmark}>ragbaz · رگباز</p>

            <div className={styles.para}>
              <span className={styles.label}>logos</span>
              <p className={styles.body}>
                RAGBAZ is a software atelier building tooling for people who think
                in systems: mail routing and policy enforcement (mailguard),
                documentation platforms, conversational infrastructure, headless
                content pipelines, AI-assisted education, and typesetting
                utilities — each product a precise instrument rather than a
                platform play. The name is a transliteration of{' '}
                <span className={styles.farsi}>رگباز</span>, a Farsi compound
                readable as "vein-player" or "one who works the channels" — apt
                for infrastructure that routes, filters, and delivers. Every
                product shares the same design vocabulary: a gruvbox-warm palette
                with orange ember headings and cyan-blue accents, monospaced
                type, border-led surfaces with no gradients and no blur, and a
                lowercase terse voice that refuses ornament.
              </p>
            </div>

            <div className={styles.para}>
              <span className={styles.label}>ethos</span>
              <p className={styles.body}>
                RAGBAZ builds for operators, not consumers. The aesthetic
                discipline is not decoration — it is a statement of values:
                clarity over charm, legibility over delight, substance over
                surface. Tools should read like a well-maintained configuration
                file: intentional, self-evident, and free of ceremony. The
                design system enforces this structurally; glassmorphism,
                rounded-full pills, and glow shadows are not style choices you
                can opt back into — they are outside the vocabulary. Complexity
                is earned, not assumed. Each product starts from the smallest
                surface that tells the truth about the problem.
              </p>
            </div>

            <div className={styles.para}>
              <span className={styles.label}>pathos</span>
              <p className={styles.body}>
                The emotional register of RAGBAZ is warm precision — the feeling
                of a terminal that has been configured exactly right, of a
                codebase where nothing is accidental. The amber glow of{' '}
                <code>#f3c46c</code> against dark stone is not chosen
                arbitrarily; it is the color of a desk lamp at 2 a.m., of work
                that matters to the person doing it. RAGBAZ products are built
                for the kind of user who reads release notes, who notices when a
                border radius changes by 2 px, who would rather have a tool that
                does one thing honestly than a platform that promises everything.
                The brand asks nothing of the user except attention — and in
                return offers something increasingly rare: software that respects
                how you think.
              </p>
            </div>

            <div className={styles.coda}>
              <Link className={styles.atlasLink} to="/docs/intro">
                open atlas →
              </Link>
            </div>

          </section>
        </div>

        <div className="ragbaz-section ragbaz-section-alt">
          <div className="container">
            <div className="ragbaz-section-header">
              <h2>Coverage</h2>
              <p>Six documentation namespaces. Each node below opens its own overview.</p>
            </div>
            <div className="ragbaz-grid ragbaz-grid-tight">
              <Link className="ragbaz-card-link" to="/docs/products/overview">
                <div className="rb-card rb-card--ar-auto rb-card--warm">
                  <div className="rb-card__body-wrap">
                    <p className="rb-card__title">Products</p>
                    <p className="rb-card__body">Shipped and actively maintained tooling — mailguard, articulate, and more.</p>
                  </div>
                </div>
              </Link>
              <Link className="ragbaz-card-link" to="/docs/experiments/overview">
                <div className="rb-card rb-card--ar-auto rb-card--ghost">
                  <div className="rb-card__body-wrap">
                    <p className="rb-card__title">Experiments</p>
                    <p className="rb-card__body">In-progress probes and prototypes not yet promoted to product.</p>
                  </div>
                </div>
              </Link>
              <Link className="ragbaz-card-link" to="/docs/infra/overview">
                <div className="rb-card rb-card--ar-auto rb-card--ghost">
                  <div className="rb-card__body-wrap">
                    <p className="rb-card__title">Infrastructure</p>
                    <p className="rb-card__body">Deployment topology, DNS, CI/CD, and operational runbooks.</p>
                  </div>
                </div>
              </Link>
              <Link className="ragbaz-card-link" to="/docs/private/overview">
                <div className="rb-card rb-card--ar-auto rb-card--ghost">
                  <div className="rb-card__body-wrap">
                    <p className="rb-card__title">Private</p>
                    <p className="rb-card__body">Internal notes, credentials scaffolding, and decision logs.</p>
                  </div>
                </div>
              </Link>
              <Link className="ragbaz-card-link" to="/docs/archive/overview">
                <div className="rb-card rb-card--ar-auto rb-card--ghost">
                  <div className="rb-card__body-wrap">
                    <p className="rb-card__title">Archive</p>
                    <p className="rb-card__body">Retired projects and historical references kept for continuity.</p>
                  </div>
                </div>
              </Link>
              <Link className="ragbaz-card-link" to="/docs/vendor/overview">
                <div className="rb-card rb-card--ar-auto rb-card--ghost">
                  <div className="rb-card__body-wrap">
                    <p className="rb-card__title">Vendor</p>
                    <p className="rb-card__body">Third-party integrations, API contracts, and dependency notes.</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        <div className="ragbaz-section">
          <div className="container">
            <div className="ragbaz-section-header">
              <h2>Flagship paths</h2>
              <p>Deep-dives worth starting from.</p>
            </div>
            <div className="ragbaz-grid">
              <Link className="ragbaz-card-link" to="/docs/products/matches">
                <div className="rb-card rb-card--ar-auto rb-card--warm">
                  <div className="rb-card__body-wrap">
                    <p className="rb-card__title">MATCHES</p>
                    <p className="rb-card__body">Autonomous cinematic battle simulation — the flagship RAGBAZ product.</p>
                  </div>
                </div>
              </Link>
              <Link className="ragbaz-card-link" to="/docs/products/ragbaz-frog">
                <div className="rb-card rb-card--ar-auto rb-card--cool">
                  <div className="rb-card__body-wrap">
                    <p className="rb-card__title">Frog</p>
                    <p className="rb-card__body">Workspace coordination CLI — tasks, locks, repos, MCP integration.</p>
                  </div>
                </div>
              </Link>
              <Link className="ragbaz-card-link" to="/docs/products/ragbaz-design-system">
                <div className="rb-card rb-card--ar-auto rb-card--ghost">
                  <div className="rb-card__body-wrap">
                    <p className="rb-card__title">Design System</p>
                    <p className="rb-card__body">Brand vocabulary, tokens, components governing all RAGBAZ surfaces.</p>
                  </div>
                </div>
              </Link>
              <Link className="ragbaz-card-link" to="/docs/products/articulate/universe">
                <div className="rb-card rb-card--ar-auto rb-card--cool">
                  <div className="rb-card__body-wrap">
                    <p className="rb-card__title">Articulate Universe</p>
                    <p className="rb-card__body">Headless WP commerce — storefront, plugin, and content pipeline.</p>
                  </div>
                </div>
              </Link>
              <Link className="ragbaz-card-link" to="/docs/products/articulate/gatekeeper">
                <div className="rb-card rb-card--ar-auto rb-card--cool">
                  <div className="rb-card__body-wrap">
                    <p className="rb-card__title">Gatekeeper</p>
                    <p className="rb-card__body">Hardened Rust ingress and runtime layer for WordPress deployments.</p>
                  </div>
                </div>
              </Link>
              <Link className="ragbaz-card-link" to="/docs/products/detcordon">
                <div className="rb-card rb-card--ar-auto rb-card--ghost">
                  <div className="rb-card__body-wrap">
                    <p className="rb-card__title">DetCordon</p>
                    <p className="rb-card__body">Containment-first malware observation sandbox in Rust.</p>
                  </div>
                </div>
              </Link>
              <Link className="ragbaz-card-link" to="/docs/products/typeset">
                <div className="rb-card rb-card--ar-auto rb-card--ghost">
                  <div className="rb-card__body-wrap">
                    <p className="rb-card__title">Typesetr</p>
                    <p className="rb-card__body">Docx-to-PDF typesetting pipeline with bleed, crop marks, and front matter.</p>
                  </div>
                </div>
              </Link>
              <Link className="ragbaz-card-link" to="/docs/products/shipwrecks-se">
                <div className="rb-card rb-card--ar-auto rb-card--ghost">
                  <div className="rb-card__body-wrap">
                    <p className="rb-card__title">Shipwrecks.se</p>
                    <p className="rb-card__body">Historical maritime data platform — Swedish wreck registry and search.</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>

      </main>
    </Layout>
  );
}
