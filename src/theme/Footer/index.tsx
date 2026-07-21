import React from 'react';

const footerLinks = [
  {href: '/pricing', label: 'pricing'},
  {href: '/school', label: 'school'},
  {href: '/doc/', label: 'docs'},
  {href: 'https://face.ragbaz.cc', label: 'face demo'},
  {href: '/glither-wasm', label: 'glither wasm'},
  {href: '/ai-governance', label: 'ai governance'},
  {href: '/konsonans-ai-governance', label: 'konsonans ai governance'},
  {href: '/completion', label: 'completion'},
  {href: '/glossary', label: 'glossary'},
  {href: '/stats', label: 'stats'},
  {href: '/assets/ragbaz-prospectus.pdf?v=20260614aa', label: 'prospectus · pdf'},
];

function isExternal(href: string) {
  return href.startsWith('http://') || href.startsWith('https://');
}

export default function Footer(): React.JSX.Element {
  return (
    <>
      <footer className="ragbaz-site-footer">
        <div className="ragbaz-site-footer-wrap">
          <a className="ragbaz-site-wordmark" href="/" aria-label="RAGBAZ home">
            <img src="/doc/img/logo-mark.svg" alt="" />
            <span>RAGBAZ</span>
          </a>
          <div className="ragbaz-site-footer-links">
            {footerLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                rel={isExternal(link.href) ? 'noopener noreferrer' : undefined}
              >
                {link.label}
              </a>
            ))}
          </div>
          <span className="ragbaz-site-footer-meta">studio · oslo + stockholm · warm-solarized-dark</span>
        </div>
      </footer>
      <div className="ragbaz-site-last-updated">
        <time dateTime="2026-07-21">2026-07-21</time>
      </div>
    </>
  );
}
