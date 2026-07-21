import React, {useEffect, useState} from 'react';
import {useLocation} from '@docusaurus/router';

type NavLink = {
  href: string;
  label: string;
  active?: (pathname: string) => boolean;
};

type NavGroup = {
  label: string;
  links: NavLink[];
  active?: (pathname: string) => boolean;
};

const topLinks: NavLink[] = [
  {href: '/', label: 'home', active: (pathname) => pathname === '/' || pathname === ''},
  {href: '/pricing', label: 'pricing'},
];

const navGroups: NavGroup[] = [
  {
    label: 'products',
    links: [
      {href: '/#products', label: 'product lines'},
      {href: '/#p-governance', label: 'ai governance'},
      {href: '/#p-matches', label: 'matches'},
      {href: '/#p-articulate', label: 'articulate'},
      {href: '/#p-mailroute', label: 'mailroute'},
      {href: '/#p-detcordon', label: 'detcordon'},
      {href: '/#p-baz', label: 'baz signals'},
      {href: '/#p-esp32tolk', label: 'esp32tolk'},
      {href: '/#p-shipwrecks', label: 'shipwrecks'},
      {href: '/completion', label: 'completion'},
      {href: '/glossary', label: 'glossary'},
    ],
  },
  {
    label: 'learn',
    active: (pathname) => pathname.startsWith('/doc') && !pathname.startsWith('/doc/products/ai-governance'),
    links: [
      {href: '/school', label: 'school'},
      {href: '/doc/', label: 'docs', active: (pathname) => pathname === '/doc/' || pathname === '/doc'},
      {
        href: '/school/vision/face-mesh-morphing-techniques',
        label: 'face lesson',
        active: (pathname) => pathname.startsWith('/school/vision/face-mesh-morphing-techniques'),
      },
    ],
  },
  {
    label: 'governance',
    active: (pathname) => pathname.startsWith('/doc/products/ai-governance'),
    links: [
      {href: '/ai-governance', label: 'buyer page'},
      {href: '/konsonans-ai-governance', label: 'formal spec'},
      {
        href: '/doc/products/ai-governance',
        label: 'architecture',
        active: (pathname) => pathname === '/doc/products/ai-governance',
      },
      {
        href: '/doc/products/ai-governance-pilot',
        label: 'pilot',
        active: (pathname) => pathname.startsWith('/doc/products/ai-governance-pilot'),
      },
    ],
  },
  {
    label: 'demos',
    links: [
      {href: 'https://face.ragbaz.cc', label: 'face demo'},
      {href: '/glither-wasm', label: 'glither wasm'},
      {href: '/prospects/baz-signal-stack', label: 'baz signals'},
    ],
  },
];

function isExternal(href: string) {
  return href.startsWith('http://') || href.startsWith('https://');
}

function isGroupActive(group: NavGroup, pathname: string) {
  return group.active?.(pathname) || group.links.some((link) => link.active?.(pathname));
}

function ChromeLink({
  link,
  pathname,
  className,
  onClick,
}: {
  link: NavLink;
  pathname: string;
  className?: string;
  onClick?: () => void;
}) {
  const active = link.active?.(pathname);
  return (
    <a
      className={[className, active ? 'active' : ''].filter(Boolean).join(' ')}
      href={link.href}
      onClick={onClick}
      rel={isExternal(link.href) ? 'noopener noreferrer' : undefined}
    >
      {link.label}
    </a>
  );
}

export default function Navbar(): React.JSX.Element {
  const {pathname} = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  return (
    <>
      <header className="navbar ragbaz-site-bar">
        <div className="ragbaz-site-wrap">
          <a className="ragbaz-site-wordmark" href="/" aria-label="RAGBAZ home">
            <img src="/doc/img/logo-mark.svg" alt="" />
            <span>RAGBAZ</span>
          </a>
          <nav className="ragbaz-site-nav" aria-label="RAGBAZ sections">
            <ChromeLink link={topLinks[0]} pathname={pathname} />
            {navGroups.map((group) => (
              <details className="ragbaz-site-nav-group" key={group.label}>
                <summary
                  className={[
                    'ragbaz-site-nav-trigger',
                    isGroupActive(group, pathname) ? 'active' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {group.label}
                </summary>
                <div className="ragbaz-site-nav-menu">
                  {group.links.map((link) => (
                    <ChromeLink key={link.href} link={link} pathname={pathname} />
                  ))}
                </div>
              </details>
            ))}
            <ChromeLink link={topLinks[1]} pathname={pathname} />
          </nav>
          <button
            className="ragbaz-site-menu-button"
            type="button"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls="ragbaz-site-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span aria-hidden="true">☰</span>
          </button>
        </div>
      </header>

      <button
        className={['ragbaz-site-scrim', menuOpen ? 'open' : ''].filter(Boolean).join(' ')}
        type="button"
        aria-label="Close menu"
        tabIndex={menuOpen ? 0 : -1}
        onClick={() => setMenuOpen(false)}
      />

      <aside
        className={['ragbaz-site-drawer', menuOpen ? 'open' : ''].filter(Boolean).join(' ')}
        id="ragbaz-site-menu"
        aria-label="RAGBAZ menu"
      >
        <button
          className="ragbaz-site-close"
          type="button"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        >
          ✕
        </button>
        <div className="ragbaz-site-drawer-head">sections</div>
        {topLinks.map((link) => (
          <ChromeLink
            key={link.href}
            link={link}
            pathname={pathname}
            onClick={() => setMenuOpen(false)}
          />
        ))}
        {navGroups.map((group) => (
          <React.Fragment key={group.label}>
            <div className="ragbaz-site-drawer-head">{group.label}</div>
            {group.links.map((link) => (
              <ChromeLink
                key={link.href}
                className="sub"
                link={link}
                pathname={pathname}
                onClick={() => setMenuOpen(false)}
              />
            ))}
          </React.Fragment>
        ))}
      </aside>
    </>
  );
}
