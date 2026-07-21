import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  atlasSidebar: [
    'intro',
    {
      type: 'category',
      label: 'School',
      items: [
        {
          type: 'category',
          label: 'Cellular',
          items: ['school/cellular/overview'],
        },
      ],
    },
    {
      type: 'category',
      label: 'Products',
      items: [
        'products/overview',
        'products/ai-governance',
        {
          type: 'category',
          label: 'Core',
          items: [
            'products/matches',
            'products/ragbaz-frog',
            'products/ragbaz-design-system',
            'products/typeset',
            {
              type: 'category',
              label: 'Articulate',
              items: [
                'products/articulate/overview',
                'products/articulate/scenario-secure-wp',
                'products/articulate/scenario-headless-commerce',
                'products/articulate/universe',
                'products/articulate/storefront',
                'products/articulate/universe-wp-cf-front-oss',
                'products/articulate/universe-ragbaz-xyz',
                'products/articulate/universe-multitenant-wp-mcp-docker-legacy',
                'products/articulate/universe-wp-proxy',
                'products/articulate/universe-wp-from-backup',
                'products/articulate/gatekeeper',
                'products/articulate/mailstack',
                'products/articulate/registry',
                'products/articulate/wp-ai',
                'products/articulate/wp-sidecar',
                'products/articulate/wp-wasi',
              ],
            },
          ],
        },
        {
          type: 'category',
          label: 'Active',
          items: [
            'products/detcordon',
            'products/detcordon-monetization-surface-design',
            'products/shipwrecks-se',
            'products/mailroute',
            'products/chatwoot',
            'products/discord-bot',
          ],
        },
        'products/bazaar',
        {
          type: 'category',
          label: 'BAZ Signal Stack',
          items: [
            'products/baz-hft',
            'products/baz-luna',
            'products/baz-palantir',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Experiments',
      items: [
        'experiments/overview',
        {
          type: 'category',
          label: 'BAZ Platform',
          items: [
            'experiments/baz-architecture',
            'experiments/baz-hft',
            'experiments/baz-luna',
            'experiments/baz-palantir',
            'experiments/baz-cx',
          ],
        },
        'experiments/glither-wasm-wit-compiler-spec',
        'experiments/glither-mailguard-example',
        'experiments/glither-world-sketch',
        'experiments/dana-no-retrograde-sketch',
        'experiments/glither-governance',
        'experiments/eu-ai-act-compliance-plan',
        'experiments/kagp-integration-plan',
        'experiments/glither-ast-visualization',
        'experiments/comet-trail',
        'experiments/omniland/overview',
        'experiments/omniland/my-editor',
        'experiments/omniland/omniland2',
        'experiments/react-google-font-chooser-ui',
        'experiments/phpvm',
        'experiments/tanstack-start-basic-cloudflare',
        'experiments/tanstack-supabase-start-basic',
        'experiments/aied',
        'experiments/slint',
        'experiments/esp32tolk',
      ],
    },
    {
      type: 'category',
      label: 'Drafts',
      items: [
        {type: 'link', label: 'Font Chooser', href: '/drafts/font-chooser'},
        {type: 'link', label: 'Theme Editor', href: '/drafts/theme-editor'},
        {type: 'link', label: 'Compose View', href: '/drafts/docker-compose-view'},
        {type: 'link', label: 'Audio Sink Bleep', href: '/drafts/spec-audio-sink'},
        {type: 'link', label: 'Phoneme Tauri App', href: '/drafts/spec-phoneme-app'},
        {type: 'link', label: 'WP GraphQL Bleep', href: '/drafts/spec-wp-graphql'},
      ],
    },
  ],
};

export default sidebars;
