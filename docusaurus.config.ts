import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import ragbazPrismTheme from './src/theme/ragbazPrismTheme';
import {existsSync} from 'node:fs';
import path from 'node:path';

function firstExistingPath(candidates: string[]) {
  return candidates
    .map((candidate) => path.resolve(process.cwd(), candidate))
    .find((candidate) => existsSync(candidate));
}

const bazweaveFontMdxEntry = firstExistingPath([
  '../experiments/bazweave-font/mdx/index.jsx',
  '../../experiments/bazweave-font/mdx/index.jsx',
]);

const bazweaveThemeMdxEntry = firstExistingPath([
  '../experiments/bazweave-theme/mdx/index.jsx',
  '../../experiments/bazweave-theme/mdx/index.jsx',
]);

const ragbazDesignSystemDir = firstExistingPath([
  '../ragbaz-design-system',
  '../../ragbaz-design-system',
]);

const config: Config = {
  title: 'RAGBAZ Atlas',
  tagline:
    'Documentation for the products, experiments, infrastructure, private research projects, archives, and vendored code under /data/src',
  favicon: 'img/favicon.svg',
  staticDirectories: ['static', '../ragbaz-design-system/assets'],
  future: {
    v4: true,
  },
  url: 'https://doc.ragbaz.cc',
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
  plugins: [
    function bazweaveMdxAlias() {
      return {
        name: 'bazweave-mdx-alias',
        configureWebpack() {
          return {
            resolve: {
              alias: {
                '@font-chooser/mdx':
                  bazweaveFontMdxEntry ||
                  path.resolve(process.cwd(), '../experiments/bazweave-font/mdx/index.jsx'),
                '@ragbaz/bazweave-font/mdx':
                  bazweaveFontMdxEntry ||
                  path.resolve(process.cwd(), '../experiments/bazweave-font/mdx/index.jsx'),
                '@ragbaz/bazweave-theme/mdx':
                  bazweaveThemeMdxEntry ||
                  path.resolve(process.cwd(), '../experiments/bazweave-theme/mdx/index.jsx'),
                '@ragbaz-design-system':
                  ragbazDesignSystemDir ||
                  path.resolve(process.cwd(), '../ragbaz-design-system'),
              },
            },
          };
        },
      };
    },
  ],
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
      theme: ragbazPrismTheme,
      darkTheme: ragbazPrismTheme,
      additionalLanguages: ['yaml', 'docker', 'bash'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
