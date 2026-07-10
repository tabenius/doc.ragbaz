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

const bazweaveKitWidgetsEntry = firstExistingPath([
  '../experiments/glither/packages/bazweave-kit/src/widgets/index.tsx',
  '../../experiments/glither/packages/bazweave-kit/src/widgets/index.tsx',
]);

const config: Config = {
  title: 'RAGBAZ Atlas',
  tagline:
    'Documentation for the products and experiments under /data/src',
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
                '@ragbaz/bazweave-kit/widgets':
                  bazweaveKitWidgetsEntry ||
                  path.resolve(process.cwd(), '../experiments/glither/packages/bazweave-kit/src/widgets/index.tsx'),
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
          // Restricted or non-public trees are not published on the docs
          // surface — no routes, no sidebar entries, no links.
          exclude: ['private/**', 'infra/**', 'archive/**', 'vendor/**'],
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
        src: 'img/logo-mark.svg',
      },
      items: [
        {href: 'https://ragbaz.cc', label: 'RAGBAZ', position: 'left'},
        {
          type: 'docSidebar',
          sidebarId: 'atlasSidebar',
          position: 'left',
          label: 'Projects',
        },
        {to: '/docs/products/overview', label: 'Products', position: 'right'},
        {
          type: 'dropdown',
          label: 'Drafts',
          position: 'right',
          items: [
            {to: '/drafts/font-chooser', label: 'Font Chooser'},
            {to: '/drafts/theme-editor', label: 'Theme Editor'},
            {to: '/drafts/docker-compose-view', label: 'Compose View'},
            {to: '/drafts/spec-audio-sink', label: 'Audio Sink Bleep'},
            {to: '/drafts/spec-phoneme-app', label: 'Phoneme Tauri App'},
            {to: '/drafts/spec-wp-graphql', label: 'WP GraphQL Bleep'},
          ],
        },
        {
          type: 'dropdown',
          label: 'UI',
          position: 'right',
          items: [
            {to: '/docs/components/bazweave-kit/description', label: 'Bazweave Kit'},
            {to: '/docs/components/bazweave-kit/widgets', label: 'Widgets Demo'},
          ],
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {label: 'ragbaz.cc', href: 'https://ragbaz.cc'},
            {label: 'Overview', to: '/docs/intro'},
            {label: 'Products', to: '/docs/products/overview'},
          ],
        },
        {
          title: 'Atlas',
          items: [
            {label: 'Experiments', to: '/docs/experiments/overview'},
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
