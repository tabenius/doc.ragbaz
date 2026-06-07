import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'RAGBAZ Atlas',
  tagline:
    'Documentation for the products, experiments, infrastructure, private research projects, archives, and vendored code under /data/src',
  favicon: 'img/favicon.svg',
  staticDirectories: ['static', '../ragbaz-design-system/assets'],
  future: {
    v4: true,
  },
  url: 'https://doc.ragbaz.xyz',
  baseUrl: '/',
  organizationName: 'ragbaz',
  projectName: 'atlas',
  onBrokenLinks: 'throw',
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  markdown: {
    mermaid: true,
  },
  themes: ['@docusaurus/theme-mermaid'],
  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: 'docs',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    image: 'img/social-card.png',
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: 'RAGBAZ ATLAS',
      logo: {
        alt: 'RAGBAZ',
        src: 'logo-ragbaz-icon.png',
      },
      items: [
        {href: 'https://ragbaz.xyz', label: 'RAGBAZ', position: 'left'},
        {
          type: 'docSidebar',
          sidebarId: 'atlasSidebar',
          position: 'left',
          label: 'Projects',
        },
        {to: '/docs/intro', label: 'Overview', position: 'left'},
        {to: '/docs/products/overview', label: 'Products', position: 'right'},
        {to: '/docs/infra/overview', label: 'Infra', position: 'right'},
        {href: 'https://offer.ragbaz.xyz', label: 'Offer', position: 'right'},
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {label: 'ragbaz.xyz', href: 'https://ragbaz.xyz'},
            {label: 'Overview', to: '/docs/intro'},
            {label: 'Products', to: '/docs/products/overview'},
          ],
        },
        {
          title: 'Atlas',
          items: [
            {label: 'Experiments', to: '/docs/experiments/overview'},
            {label: 'Infrastructure', to: '/docs/infra/overview'},
            {label: 'Private', to: '/docs/private/overview'},
          ],
        },
        {
          title: 'More',
          items: [
            {label: 'Archive', to: '/docs/archive/overview'},
            {label: 'Vendor', to: '/docs/vendor/overview'},
          ],
        },
      ],
      copyright: `Snapshot ${new Date().getFullYear()} · /data/src · Built with Docusaurus`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.nightOwl,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
