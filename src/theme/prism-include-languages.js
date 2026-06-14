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
  // glither.world meta-dialect
  PrismObject.languages['glither-world'] = PrismObject.languages.glither;
  PrismObject.languages['glither.world'] = PrismObject.languages.glither;

  // ── WIT — WebAssembly Interface Types ──────────────────────
  PrismObject.languages.wit = {
    comment: [
      {pattern: /\/\/.*/, greedy: true},
      {pattern: /\/\*[\s\S]*?\*\//, greedy: true},
    ],
    string: {pattern: /"(?:[^"\\\n]|\\.)*"/, greedy: true},
    keyword: /\b(?:package|interface|world|use|import|export|record|variant|enum|flags|resource|static|method|constructor|type|func|define|default|as|from)\b/,
    builtin: /\b(?:string|u8|u16|u32|u64|s8|s16|s32|s64|float32|float64|bool|list|option|result|tuple|future|stream)\b/,
    'class-name': /\b(?:[A-Z]\w*)\b/,
    namespace: /(?:[a-z][a-z0-9]*)(?::[a-z][a-z0-9]*)*(?:\/[a-z][a-z0-9]*)*/,
    number: /\b\d+(?:\.\d+)?\b/,
    operator: /[=:]/,
    punctuation: /[{}()<>\[\];,.]/,
  };

  // ── Gleam — the auditable oracle language ────────────────────
  PrismObject.languages.gleam = {
    comment: {pattern: /\/\/.*/, greedy: true},
    annotation: {pattern: /@\w+(?:\([^)]*\))?/, alias: 'keyword'},
    string: {pattern: /"(?:[^"\\\n]|\\.)*"/, greedy: true},
    keyword: /\b(?:pub|fn|case|let|assert|expect|type|if|use|as|opaque|todo|panic|const|import|opaque)\b/,
    type: /\b[A-Z]\w*\b/,
    operator: /->|<>|\|>|>=|<=|==|!=|\.\.|::|=>/,
    number: /\b(?:0x[0-9a-fA-F_]+|\d[\d_]*)\b/,
    punctuation: /[{}()\[\],:;.]/,
  };

  // ── Roux — Glither shared grammar engine (PEG / pest format) ──
  PrismObject.languages.roux = {
    comment: [
      {pattern: /\/\/\/.*/, greedy: true, alias: 'doc-comment'},
      {pattern: /\/\/.*/, greedy: true},
    ],
    string: [
      {pattern: /\^?"(?:\\.|[^"\\])*"/, greedy: true},
      {pattern: /`(?:[^`\\]|\\.)*`/, greedy: true},
    ],
    keyword: /\b(?:ruleset|pragma|dialect|fold|first-match|accumulate|enrich|group|rule|comprehension|collection|predicate|neg|operand|match_op|value|regex|rung|disposition|wrap|mv|terminal|graded|dest|verb_app|args|arm|trigger|event_ref|duration|ident|string|number|literate|SOI|EOI|NEWLINE|ANY|ASCII_DIGIT|ASCII_ALPHANUMERIC)\b/,
    'class-name': /\b(?:[A-Z]\w*)\b/,
    number: /\b\d+\b/,
    operator: /=>|->|>=|<=|==|!=|~|\||=|!|\^|&|@|\?|\+|\*/,
    punctuation: /[{}()\[\];,._]/,
  };

  delete globalThis.Prism;
}
