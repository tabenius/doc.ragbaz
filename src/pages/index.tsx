import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Layout from '@theme/Layout';
import styles from './index.module.css';

const namespaces = [
  {
    title: 'Products',
    description: 'Active offers, operator tooling, and product families.',
    to: '/products/overview',
  },
  {
    title: 'Experiments',
    description: 'Compiler, interface, runtime, and architecture embryos.',
    to: '/experiments/overview',
  },
];

const currentPaths = [
  {
    title: 'BAZ.HFT',
    status: 'active embryo',
    description: 'Glither HFT dialect, host boundary, and signed monetary receipts.',
    to: '/experiments/baz-hft',
  },
  {
    title: 'BAZ.Palantir',
    status: 'working service',
    description: 'Authenticated rule orchestration and BAZ.CX enrichment.',
    to: '/experiments/baz-palantir',
  },
  {
    title: 'Glither governance',
    status: 'implemented dialect',
    description: 'Human-review lifecycle and KAGP policy export.',
    to: '/experiments/glither-governance',
  },
  {
    title: 'BAZ.Luna',
    status: 'active embryo',
    description: 'Vite trading frontend — candlestick charts, glither.hft notebook, backlog viewer.',
    to: '/products/baz-luna',
  },
  {
    title: 'DetCordon',
    status: 'active prototype',
    description: 'Containment-first web-malware observation environment.',
    to: '/products/detcordon',
  },
];

export default function Home(): ReactNode {
  const logo = useBaseUrl('/img/logo.svg');

  return (
    <Layout
      title="RAGBAZ Atlas"
      description="Technical documentation for the RAGBAZ workspace">
      <main className={styles.page}>
        <header className={styles.intro}>
          <div className="container">
            <img className={styles.logo} src={logo} alt="RAGBAZ" />
            <p className={styles.eyebrow}>/data/src · documentation index</p>
            <h1>RAGBAZ Atlas</h1>
            <p className={styles.lede}>
              Current architecture, operating boundaries, specifications, and
              project status across the RAGBAZ workspace.
            </p>
            <nav className={styles.actions} aria-label="Primary Atlas paths">
              <Link className={styles.primaryAction} to="/intro">
                Open Atlas
              </Link>
              <Link to="/experiments/baz-hft">BAZ.HFT</Link>
              <Link to="/products/overview">Products</Link>
            </nav>
          </div>
        </header>

        <section className={styles.section} aria-labelledby="current-paths">
          <div className="container">
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.eyebrow}>current paths</p>
                <h2 id="current-paths">Active technical narratives</h2>
              </div>
              <Link to="/experiments/overview">All experiments</Link>
            </div>
            <div className={styles.pathList}>
              {currentPaths.map((path) => (
                <Link className={styles.pathRow} key={path.to} to={path.to}>
                  <span className={styles.pathTitle}>{path.title}</span>
                  <span className={styles.pathDescription}>{path.description}</span>
                  <span className={styles.pathStatus}>{path.status}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="browse-atlas">
          <div className="container">
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.eyebrow}>namespaces</p>
                <h2 id="browse-atlas">Browse the workspace</h2>
              </div>
            </div>
            <div className={styles.namespaceGrid}>
              {namespaces.map((namespace) => (
                <Link key={namespace.to} to={namespace.to}>
                  <strong>{namespace.title}</strong>
                  <span>{namespace.description}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
