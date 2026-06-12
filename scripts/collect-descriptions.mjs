#!/usr/bin/env node
// Walk SRC_ROOT for */docs/DESCRIPTION.mdx and emit a per-subsystem section set
// (description + introduction/architecture/quick-start/manual/license/pricing/download)
// under the Atlas docs/components/<slug>/ tree.
//   SRC_ROOT=/data/src SITE=/data/src/doc.ragbaz.cc node scripts/collect-descriptions.mjs [--write]
import { readdir, readFile, mkdir, writeFile, stat } from 'node:fs/promises';
import { join, basename, relative } from 'node:path';
const SRC_ROOT = process.env.SRC_ROOT || '/data/src';
const SITE = process.env.SITE || join(SRC_ROOT, 'doc.ragbaz.cc');
const WRITE = process.argv.includes('--write');
const SKIP = new Set(['node_modules','.git','.docusaurus','build','dist','.cache','.next','target','venv','.venv','__pycache__','.claude']);
const SECTIONS = ['introduction','description','architecture','quick-start','manual','license','pricing','download'];
const cap = (s) => s.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
async function* walk(dir, depth = 0) {
  if (depth > 6) return;
  let ents; try { ents = await readdir(dir, { withFileTypes: true }); } catch { return; }
  for (const e of ents) {
    if (e.isDirectory()) { if (!SKIP.has(e.name)) yield* walk(join(dir, e.name), depth + 1); }
    else if (e.isFile() && e.name === 'DESCRIPTION.mdx' && basename(dir) === 'docs') yield join(dir, e.name);
  }
}
const slugFor = (f) => f.split('/').at(-3);
const found = []; for await (const f of walk(SRC_ROOT)) found.push(f);
console.log(`SRC_ROOT=${SRC_ROOT}\nSITE=${SITE}\nwrite=${WRITE}\nfound ${found.length} DESCRIPTION.mdx:`);
for (const f of found) {
  const slug = slugFor(f), body = await readFile(f, 'utf8'), outDir = join(SITE, 'docs', 'components', slug);
  console.log(`  ${slug.padEnd(26)} ← ${relative(SRC_ROOT, f)}`);
  if (!WRITE) continue;
  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, 'description.mdx'), `---\ntitle: Description\nsidebar_position: 2\n---\n\n${body}\n`);
  for (let i = 0; i < SECTIONS.length; i++) { const sec = SECTIONS[i]; if (sec === 'description') continue;
    const pth = join(outDir, `${sec}.mdx`); try { await stat(pth); continue; } catch {}
    await writeFile(pth, `---\ntitle: ${cap(sec)}\nsidebar_position: ${i+1}\n---\n\n# ${slug} — ${cap(sec)}\n\n_TODO: section content._\n`);
  }
  await writeFile(join(outDir, '_category_.json'), JSON.stringify({ label: slug, link: { type: 'generated-index', title: slug } }, null, 2) + '\n');
}
console.log(WRITE ? 'wrote docs/components/<slug>/{description,…}.mdx' : '(dry run — pass --write)');
