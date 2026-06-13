import siteConfig from '@generated/docusaurus.config';

// Swizzled from @docusaurus/theme-classic to register a custom Prism grammar
// for the glither policy DSL (used in the Glither/BAZ.Weave atlas pages).
export default function prismIncludeLanguages(PrismObject) {
  const {
    themeConfig: {prism},
  } = siteConfig;
  const {additionalLanguages} = prism;

  // Prism components work on the Prism instance on the window, while
  // prism-react-renderer uses its own Prism instance. Temporarily mount the
  // instance onto window, import components to enhance it, then remove it.
  globalThis.Prism = PrismObject;

  (additionalLanguages ?? []).forEach((lang) => {
    if (lang === 'php') {
      require('prismjs/components/prism-markup-templating.js');
    }
    require(`prismjs/components/prism-${lang}`);
  });

  // The glither policy DSL (docs/examples/*.glith, the dialect sketches).
  // Surface per docs/syntax-sketch.md: `#pragma`, `///` literate + `//` line
  // comments, comprehension `|`, `=>` disposition, ladders, state boxes.
  PrismObject.languages.glither = {
    comment: [
      {pattern: /\/\/\/.*/, greedy: true, alias: 'doc-comment'},
      {pattern: /\/\/.*/, greedy: true},
    ],
    pragma: {pattern: /#pragma\b.*/, alias: 'keyword'},
    string: {pattern: /"(?:[^"\\\n]|\\.)*"/, greedy: true},
    regex: {pattern: /\/(?:[^/\\\n]|\\.)+\//, greedy: true},
    keyword:
      /\b(?:rule|group|enrich|dialect|fold|first-match|accumulate|not|in|and|or|wrap|to|into|seed|hold|raise|lower|for|when|on|after|route|tag|deliver|drop|convene|council|assent|delegate|escalate|deny|admit|redact|transform|link|compose|isolate|refuse)\b/,
    box: {
      pattern:
        /\b(?:delivered|dropped|quarantine|live|denied|occluded|assented|convened|authorized|rejected|probation|admitted|linked|refused|negotiating)\b/,
      alias: 'builtin',
    },
    ladder: {
      pattern: /\b(?:detail|clearance|authority|guarantee|rate)\b/,
      alias: 'class-name',
    },
    operator: /=>|>=|<=|==|!=|~|\||=|->/,
    number: /\b\d+(?:\.\d+)?[hmsd]?\b/,
    punctuation: /[(),.;]/,
  };
  // Alias used by some pages / source files.
  PrismObject.languages.glith = PrismObject.languages.glither;

  delete globalThis.Prism;
}
