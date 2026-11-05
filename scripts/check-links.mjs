#!/usr/bin/env node
// Checks every Spotify ID in js/data.js through Spotify's public oEmbed endpoint
// (no API key needed). A 404 means the playlist / album / artist is gone; a playlist
// whose title no longer matches its "n" field is reported as a warning, since
// Spotify sometimes renames or repurposes editorial playlists.
//
//   node scripts/check-links.mjs          # everything
//   node scripts/check-links.mjs --quiet  # only problems
// Exits with 1 when any link is broken.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const src = readFileSync(fileURLToPath(new URL('../js/data.js', import.meta.url)), 'utf8');
const ctx = {};
vm.runInNewContext(src + '\nthis.PLAYLISTS = PLAYLISTS; this.ARTISTS = ARTISTS;', ctx);
const quiet = process.argv.includes('--quiet');

const items = [
  ...ctx.PLAYLISTS.map(p => ({ type: p.t || 'playlist', id: p.id, name: p.n })),
  ...ctx.ARTISTS.map(a => ({ type: 'artist', id: a.id, name: a.n })),
];
const dups = items.map(x => x.id).filter((id, i, all) => all.indexOf(id) !== i);

const norm = s => s.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
async function check({ type, id, name }) {
  const url = `https://open.spotify.com/oembed?url=https://open.spotify.com/${type}/${id}`;
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (res.status === 404) return { status: 'broken', note: '404 — 已下架或 ID 錯誤' };
      if (res.status === 429 && attempt < 3) { await new Promise(r => setTimeout(r, 2000 * (attempt + 1))); continue; }
      if (!res.ok) return { status: 'error', note: `HTTP ${res.status}` };
      const { title = '' } = await res.json();
      // Only playlists get repurposed; artists and albums are shown under local names on purpose
      const a = norm(title), b = norm(name);
      return type !== 'playlist' || a.includes(b) || b.includes(a) ? { status: 'ok' } : { status: 'renamed', note: `Spotify 上現在叫「${title}」` };
    } catch (e) {
      if (attempt < 2) continue;
      return { status: 'error', note: e.message };
    }
  }
}

// A few requests at a time to stay polite to Spotify
const results = new Array(items.length);
let next = 0;
await Promise.all(Array.from({ length: 6 }, async () => {
  while (next < items.length) { const i = next++; results[i] = await check(items[i]); }
}));

const icon = { ok: '✓', renamed: '~', broken: '✗', error: '?' };
const count = { ok: 0, renamed: 0, broken: 0, error: 0 };
items.forEach((it, i) => {
  const r = results[i];
  count[r.status]++;
  if (quiet && r.status === 'ok') return;
  console.log(`${icon[r.status]} ${it.type.padEnd(8)} ${it.id}  ${it.name}${r.note ? '  — ' + r.note : ''}`);
});
if (dups.length) console.log(`\n重複的 ID：${[...new Set(dups)].join(', ')}`);
console.log(`\n共 ${items.length} 筆：正常 ${count.ok} · 改名 ${count.renamed} · 失效 ${count.broken} · 無法檢查 ${count.error}`);
process.exit(count.broken || dups.length ? 1 : 0);
