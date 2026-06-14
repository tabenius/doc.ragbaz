const ragbazPrismTheme = {
  plain: {
    color: '#d8c29d',
    backgroundColor: '#0a0908',
    fontFamily:
      '"Intel One Mono", "JetBrains Mono", ui-monospace, Menlo, Consolas, monospace',
    fontSize: '13.5px',
    lineHeight: '1.55',
    textRendering: 'optimizeLegibility',
  },
  styles: [
    {
      types: ['comment', 'prolog', 'doctype', 'cdata'],
      style: {
        color: '#737373',
        fontStyle: 'italic',
      },
    },
    {
      types: ['comment'].filter(Boolean),
      language: 'glither',
      style: {
        fontStyle: 'normal',
      },
    },
    {
      types: ['doc-comment'],
      style: {
        color: '#9f9f9f',
      },
    },
    {
      types: ['namespace'],
      style: {
        color: '#f3c46c',
      },
    },
    {
      types: ['string', 'attr-value'],
      style: {
        color: '#b8bb26',
      },
    },
    {
      types: ['punctuation', 'operator'],
      style: {
        color: '#8ec07c',
      },
    },
    {
      types: [
        'keyword',
        'selector',
        'builtin',
        'pragma',
      ],
      style: {
        color: '#7ab8ff',
      },
    },
    {
      types: ['keyword'],
      language: 'glither',
      style: {
        color: '#7ab8ff',
        fontWeight: '600',
      },
    },
    {
      types: ['box', 'builtin'],
      language: 'glither',
      style: {
        color: '#f2a77a',
        fontWeight: '600',
      },
    },
    {
      types: ['ladder', 'class-name'],
      language: 'glither',
      style: {
        color: '#fabd2f',
      },
    },
    {
      types: ['class-name', 'function', 'maybe-class-name'],
      style: {
        color: '#f3c46c',
      },
    },
    {
      types: ['boolean', 'constant', 'symbol', 'regex'],
      style: {
        color: '#f2a77a',
      },
    },
    {
      types: ['number', 'unit'],
      style: {
        color: '#ff9900',
      },
    },
    {
      types: ['atrule', 'tag', 'attr-name', 'property'],
      style: {
        color: '#7ab8ff',
      },
    },
    {
      types: ['variable', 'parameter'],
      style: {
        color: '#f6d7a7',
      },
    },
    {
      types: ['entity', 'url'],
      style: {
        color: '#8ec07c',
      },
    },
    {
      types: ['important'],
      style: {
        color: '#fb4934',
        fontWeight: 'bold',
      },
    },
    {
      types: ['bold'],
      style: {
        fontWeight: 'bold',
      },
    },
    {
      types: ['italic'],
      style: {
        fontStyle: 'italic',
      },
    },
    {
      types: ['inserted'],
      style: {
        color: '#b8bb26',
      },
    },
    {
      types: ['deleted'],
      style: {
        color: '#fb4934',
      },
    },
    {
      types: ['changed'],
      style: {
        color: '#fabd2f',
      },
    },
  ],
};

export default ragbazPrismTheme;
