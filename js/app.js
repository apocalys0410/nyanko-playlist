// Filters, batches, favourites, hide, inline preview, open-in-app
const FILTERS = [
  { key: 'u', label: '用途', opts: [['', '全部'], ['study', '📚 讀書'], ['cafe', '☕ 咖啡時間'], ['sleep', '🌙 睡覺'], ['spa', '🧖 Spa 冥想'], ['upbeat', '☀️ 輕快'], ['cozy', '🧸 Cozy / Chill']] },
  { key: 'v', label: '人聲', opts: [['', '都可以'], ['inst', '無人聲'], ['vocal', '有人聲']] },
  { key: 'i', label: '類型', opts: [['', '不限'], ['piano', '🎹 純鋼琴'], ['orch', '🎻 交響 / 配樂'], ['jazz', '🎷 爵士'], ['guitar', '🎸 吉他 / Bossa'], ['blues', '🎺 藍調'], ['lofi', '🎧 Lo-fi']] },
  { key: 'l', label: '語言', opts: [['', '不限'], ['zh', '華語'], ['jp', '日文'], ['kr', '韓文'], ['en', '英文'], ['es', '西語']] },
];
const LABEL = { inst: '無人聲', vocal: '有人聲', mix: '人聲＋純音樂', piano: '鋼琴', guitar: '吉他', jazz: '爵士', lofi: 'Lo-fi', orch: '交響', blues: '藍調' };
const USE_LABEL = Object.fromEntries(FILTERS[0].opts.slice(1).map(([k, t]) => [k, t.replace(/^\S+\s/, '')]));

const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
};
// Time-of-day suggestion: on the first visit in each slot of each day the "use" filter
// is pre-picked for that slot; anything chosen within the slot is respected until it ends.
// Try another hour with ?hour=23
const SLOTS = [
  { from: 5, to: 10, use: 'upbeat' },
  { from: 10, to: 17, use: 'cafe' },
  { from: 17, to: 22, use: 'cozy' },
  { from: 22, to: 29, use: 'sleep' },
];
const NOW = new Date();
const forcedHour = parseInt(new URLSearchParams(location.search).get('hour'), 10);
const HOUR = Number.isInteger(forcedHour) && forcedHour >= 0 && forcedHour < 24 ? forcedHour : NOW.getHours();
const SLOT = SLOTS.find(s => (HOUR < 5 ? HOUR + 24 : HOUR) >= s.from && (HOUR < 5 ? HOUR + 24 : HOUR) < s.to);
// A night slot that started yesterday (00:00–04:59) belongs to yesterday's date
const slotDay = new Date(NOW.getTime() - (HOUR < 5 ? 864e5 : 0)).toDateString();
const SLOT_ID = slotDay + '|' + SLOT.use;
const state = Object.assign({ u: '', v: '', i: '', l: '' }, store.get('nyanko-filters', {}));
const slotAuto = store.get('nyanko-slot', null) !== SLOT_ID;
if (slotAuto) state.u = SLOT.use;
function saveFilters() { store.set('nyanko-filters', state); store.set('nyanko-slot', SLOT_ID); }
if (slotAuto) saveFilters();
function renderGreeting() {
  const label = FILTERS[0].opts.find(o => o[0] === SLOT.use)[1].replace(/^\S+\s/, '');
  document.getElementById('greet').textContent = V().greet[SLOT.use] + (slotAuto ? V().auto(label) : '');
  document.querySelectorAll('#voice [data-voice]').forEach(b => b.classList.toggle('active', b.dataset.voice === voice));
}
renderGreeting();
document.getElementById('voice').addEventListener('click', e => {
  const b = e.target.closest('[data-voice]');
  if (!b) return;
  voice = b.dataset.voice; store.set('nyanko-voice', voice); renderGreeting();
});
let catPick = null;
let artistGroup = store.get('nyanko-artist-group', ARTIST_GROUPS[0].k);
let lastPlayed = store.get('nyanko-last', null);
let hidden = new Set(store.get('nyanko-hidden', []));
// First visit starts with the Expedition 33 soundtrack already favourited
let favs = new Set(store.get('nyanko-favs', ['5epJvt9jHbYI1j6WqCppGc']));
let openKey = null;
const BATCH = 6;
let order = [], page = 0;
function shuffled(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
// Reshuffle the pool whenever filters change; official playlists lead the first batch
function rebuildOrder() {
  const pool = PLAYLISTS.filter(p => matches(p) && !favs.has(p.id));
  order = [...shuffled(pool.filter(p => p.o)), ...shuffled(pool.filter(p => !p.o))].map(p => p.id);
  page = 0;
}

const PLAY_SVG = '<svg viewBox="0 0 12 14" fill="none"><path d="M1 1l10 6-10 6V1z"/></svg>';
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const HEART_SVG = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 13.6S2 10 2 5.9A3.1 3.1 0 0 1 8 4.4a3.1 3.1 0 0 1 6 1.5C14 10 8 13.6 8 13.6z"/></svg>';

function itemHTML(type, id, num, name, sub, extra, ctl) {
  const key = type + ':' + id;
  return `<a class="item${lastPlayed === key ? ' active' : ''}" href="https://open.spotify.com/${type}/${id}" target="_blank" rel="noopener" data-key="${key}">` +
    `<span class="num">${num}</span>` +
    `<div class="info"><div class="name">${esc(name)}${extra || ''}</div><div class="tag">${sub}</div></div>` +
    (ctl ? `<button type="button" class="fav-btn${favs.has(id) ? ' on' : ''}" data-fav="${id}" aria-label="收藏">${HEART_SVG}</button>` +
           (favs.has(id) ? '' : `<button type="button" class="hide-btn" data-hide="${id}" aria-label="不喜歡，換掉這個">✕</button>`) : '') +
    `<button type="button" class="play-btn${openKey === key ? ' open' : ''}" data-preview="${key}" aria-label="試聽">${PLAY_SVG}</button></a>`;
}
// Swap a list's rows without touching an open preview player: moving or re-creating
// an iframe reloads it and stops playback, so the .embed node stays put and the new
// rows are inserted around it.
function renderList(el, html) {
  const keep = el.querySelector(':scope > .embed');
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  const nodes = [...tmp.childNodes];
  const at = keep ? nodes.findIndex(n => n.dataset && n.dataset.key === openKey) : -1;
  if (keep && at === -1) { keep.remove(); openKey = null; nodes.forEach(n => n.classList && n.querySelector('.play-btn.open')?.classList.remove('open')); }
  if (at === -1) { el.replaceChildren(...nodes); return; }
  [...el.childNodes].forEach(n => { if (n !== keep) n.remove(); });
  nodes.forEach((n, i) => i <= at ? el.insertBefore(n, keep) : el.appendChild(n));
}
function embedHTML(type, id) {
  return `<div class="embed"><iframe src="https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0" ` +
    `height="152" frameborder="0" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe></div>`;
}
const pad = n => String(n).padStart(2, '0');

function matches(p) {
  if (state.u && !p.u.includes(state.u)) return false;
  if (state.v === 'inst' && p.v !== 'inst') return false;
  if (state.v === 'vocal' && p.v === 'inst') return false;
  if (state.i && p.i !== state.i) return false;
  if (state.l && p.l !== state.l) return false;
  return true;
}

function renderFilters() {
  document.getElementById('filters').innerHTML = FILTERS.map(f =>
    `<div class="frow"><span class="flabel">${f.label}</span><div class="tabs">` +
    f.opts.map(([k, t]) => `<button type="button" class="tab${state[f.key] === k ? ' active' : ''}" data-f="${f.key}" data-k="${k}">${t}</button>`).join('') +
    `</div></div>`).join('');
}

function renderPlaylists() {
  const byId = Object.fromEntries(PLAYLISTS.map(p => [p.id, p]));
  const visible = order.filter(id => !hidden.has(id));
  const pages = Math.max(1, Math.ceil(visible.length / BATCH));
  if (page >= pages) page = 0;
  const list = visible.slice(page * BATCH, page * BATCH + BATCH).map(id => byId[id]);
  const any = state.u || state.v || state.i || state.l;
  const picked = FILTERS.filter(f => state[f.key])
    .map(f => f.opts.find(o => o[0] === state[f.key])[1].replace(/^\S+\s/, ''));
  document.getElementById('count').innerHTML = visible.length
    ? `<b>${esc(picked.length ? picked.join(' · ') : '全部')}</b> · ${visible.length + PLAYLISTS.filter(p => favs.has(p.id) && matches(p)).length} 個` : '';
  document.getElementById('reset').hidden = !any;
  const sh = document.getElementById('shuffle');
  sh.hidden = pages <= 1;
  sh.innerHTML = `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 2.5v2.6h-2.6"/></svg>換一批<span class="pg">${page + 1}/${pages}</span>`;
  const un = document.getElementById('unhide');
  un.hidden = hidden.size === 0;
  un.textContent = `復原已隱藏 (${hidden.size})`;
  const el = document.getElementById('playlist-list');
  const pickP = catPick && byId[catPick] && matches(byId[catPick]) ? byId[catPick] : null;
  const favList = PLAYLISTS.filter(p => favs.has(p.id) && matches(p) && p !== pickP);
  const batch = list.filter(p => p !== pickP);
  if (!batch.length && !favList.length && !pickP) {
    renderList(el, `<div class="empty">這個組合沒有歌單 🐾<br>` +
      (state.l && state.v === 'inst' ? '純音樂歌單沒有語言之分，試著把「語言」改回不限。' : '試著放寬其中一個條件。') + `</div>`);
    return;
  }
  const row = (p, num) => {
    const chips = [LABEL[p.v], LABEL[p.i], ...p.u.filter(u => u !== state.u).map(u => USE_LABEL[u])].filter(Boolean).join(' · ');
    const sub = esc(p.d) + `<div class="chips">${chips}</div>`;
    return itemHTML(p.t || 'playlist', p.id, num, p.n, sub, p.o ? '<span class="badge">官方</span>' : '', true);
  };
  const groups = (pickP ? 1 : 0) + (favList.length ? 1 : 0);
  renderList(el,
    (pickP ? `<div class="group-label">🐾 貓咪老師推薦</div>` + row(pickP, '🐾') : '') +
    (favList.length ? `<div class="group-label">♥ 收藏</div>` + favList.map(p => row(p, '♥')).join('') : '') +
    (groups && batch.length ? `<div class="group-label">這一批</div>` : '') +
    batch.map((p, idx) => row(p, pad(page * BATCH + idx + 1))).join(''));
}

// Called by nyanko.js when a falling Nyanko-sensei is clicked
function catPickPlaylist() {
  const pool = PLAYLISTS.filter(p => matches(p) && !hidden.has(p.id) && p.id !== catPick);
  if (!pool.length) return null;
  const p = pool[Math.floor(Math.random() * pool.length)];
  catPick = p.id;
  renderPlaylists();
  openPreview((p.t || 'playlist') + ':' + p.id);
  document.querySelector('#playlist-list .group-label').scrollIntoView({ behavior: 'smooth', block: 'start' });
  return p;
}

// Chip rows are built once and only have their active class toggled afterwards,
// so their horizontal scroll position survives a selection.
function syncFilters() {
  document.querySelectorAll('#filters button[data-f]').forEach(b => b.classList.toggle('active', state[b.dataset.f] === b.dataset.k));
}
function renderArtistTabs() {
  document.getElementById('artist-tabs').innerHTML = ARTIST_GROUPS.map(g =>
    `<button type="button" class="tab" data-g="${g.k}">${g.label}</button>`).join('');
}
function renderArtists() {
  document.querySelectorAll('#artist-tabs button[data-g]').forEach(b => b.classList.toggle('active', b.dataset.g === artistGroup));
  renderList(document.getElementById('artist-list'), ARTISTS.filter(a => a.g === artistGroup)
    .map((a, idx) => itemHTML('artist', a.id, pad(idx + 1), a.n, esc(a.d))).join(''));
}

document.getElementById('filters').addEventListener('click', e => {
  const b = e.target.closest('button[data-f]');
  if (!b) return;
  state[b.dataset.f] = b.dataset.k;
  saveFilters(); catPick = null;
  rebuildOrder(); syncFilters(); renderPlaylists();
});
document.getElementById('reset').addEventListener('click', () => {
  Object.assign(state, { u: '', v: '', i: '', l: '' });
  saveFilters(); catPick = null;
  rebuildOrder(); syncFilters(); renderPlaylists();
});
document.getElementById('artist-tabs').addEventListener('click', e => {
  const b = e.target.closest('button[data-g]');
  if (!b) return;
  artistGroup = b.dataset.g;
  store.set('nyanko-artist-group', artistGroup);
  renderArtists();
});
document.getElementById('shuffle').addEventListener('click', () => {
  const visible = order.filter(id => !hidden.has(id)).length;
  page = page + 1 >= Math.ceil(visible / BATCH) ? 0 : page + 1;
  if (page === 0) rebuildOrder();
  renderPlaylists();
  document.getElementById('filters').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
document.getElementById('unhide').addEventListener('click', () => {
  hidden.clear(); store.set('nyanko-hidden', []); renderPlaylists();
});
document.getElementById('playlist-list').addEventListener('click', e => {
  const hb = e.target.closest('.hide-btn'), fb = e.target.closest('.fav-btn');
  if (!hb && !fb) return;
  e.preventDefault(); e.stopPropagation();
  if (hb) { hidden.add(hb.dataset.hide); store.set('nyanko-hidden', [...hidden]); showUndo(hb.dataset.hide); }
  if (fb) {
    const id = fb.dataset.fav;
    if (favs.has(id)) { favs.delete(id); order.unshift(id); }   // un-favourite: drop back into the current batch
    else { favs.add(id); order = order.filter(x => x !== id); hidden.delete(id); store.set('nyanko-hidden', [...hidden]); }
    store.set('nyanko-favs', [...favs]);
  }
  renderPlaylists();
});
// ✕ is easy to hit by accident, so every hide gets a short-lived undo toast
let undoTimer = null;
function showUndo(id) {
  const t = document.getElementById('toast');
  const p = PLAYLISTS.find(x => x.id === id);
  t.innerHTML = `<span>已隱藏「${esc(p ? p.n : '')}」</span><button type="button" class="linkish" data-undo="${id}">復原</button>`;
  t.hidden = false;
  clearTimeout(undoTimer);
  undoTimer = setTimeout(() => { t.hidden = true; }, 5000);
}
document.getElementById('toast').addEventListener('click', e => {
  const b = e.target.closest('[data-undo]');
  if (!b) return;
  hidden.delete(b.dataset.undo); store.set('nyanko-hidden', [...hidden]);
  clearTimeout(undoTimer); document.getElementById('toast').hidden = true;
  renderPlaylists();
});

// ▶ toggles an inline Spotify player under the row instead of leaving the page
document.addEventListener('click', e => {
  const b = e.target.closest('.play-btn[data-preview]');
  if (!b) return;
  e.preventDefault(); e.stopPropagation();
  const key = b.dataset.preview;
  if (openKey === key) closePreview(); else openPreview(key, b.closest('a.item'));
}, true);
function closePreview() {
  document.querySelectorAll('.embed').forEach(x => x.remove());
  document.querySelectorAll('.play-btn.open').forEach(x => x.classList.remove('open'));
  openKey = null;
}
function openPreview(key, row) {
  closePreview();
  row = row || document.querySelector(`#playlist-list a.item[data-key="${key}"]`);
  if (!row) return;
  openKey = key;
  const [type, id] = key.split(':');
  row.querySelector('.play-btn').classList.add('open');
  row.insertAdjacentHTML('afterend', embedHTML(type, id));
}
// Desktop (mouse) can hand the row to the Spotify desktop app via spotify: URIs;
// touch devices keep the https link, which iOS/Android already route to the app.
const isDesktop = matchMedia('(hover: hover) and (pointer: fine)').matches;
let openMode = store.get('nyanko-open-mode', 'app');
function syncOpenPref() {
  document.getElementById('open-pref').hidden = !isDesktop;
  document.querySelectorAll('#open-pref [data-open]').forEach(b => b.classList.toggle('active', b.dataset.open === openMode));
  document.getElementById('open-hint').textContent = !isDesktop
    ? '有裝 Spotify app 會直接跳到 app，沒有則開啟網頁版'
    : openMode === 'app' ? '需要電腦有裝 Spotify 桌面版；沒裝的話請切到「網頁版」' : '在瀏覽器開啟 Spotify 網頁版播放器';
}
document.getElementById('open-pref').addEventListener('click', e => {
  const b = e.target.closest('[data-open]');
  if (!b) return;
  openMode = b.dataset.open; store.set('nyanko-open-mode', openMode); syncOpenPref();
});
syncOpenPref();

// Clicking a row follows its link (opens Spotify); remember it as last played
document.addEventListener('click', e => {
  const a = e.target.closest('a.item');
  if (!a || e.target.closest('button')) return;
  if (isDesktop && openMode === 'app' && !(e.metaKey || e.ctrlKey || e.shiftKey)) {
    e.preventDefault();
    location.href = 'spotify:' + a.dataset.key;
  }
  lastPlayed = a.dataset.key;
  store.set('nyanko-last', lastPlayed);
  document.querySelectorAll('a.item.active').forEach(i => i.classList.remove('active'));
  a.classList.add('active');
});

// Fade the right edge while a row still has chips hidden off-screen
function updateFade(row) { row.classList.toggle('more', row.scrollLeft + row.clientWidth < row.scrollWidth - 4); }
window.addEventListener('resize', () => document.querySelectorAll('.tabs').forEach(updateFade));

// Mousewheel + drag to scroll chip rows. Rows are created once; a single window
// mouseup ends whichever drag is in progress.
let dragRow = null;
window.addEventListener('mouseup', () => { if (dragRow) { dragRow.style.cursor = ''; dragRow = null; } });
function bindScroll() {
  document.querySelectorAll('.tabs').forEach(row => {
    if (row.dataset.bound) return;
    row.dataset.bound = '1';
    updateFade(row);
    row.addEventListener('scroll', () => updateFade(row), { passive: true });
    row.addEventListener('wheel', (e) => {
      if (row.scrollWidth <= row.clientWidth || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
      e.preventDefault(); row.scrollLeft += e.deltaY;
    }, { passive: false });
    let moved = false, startX, startLeft;
    row.addEventListener('mousedown', (e) => { dragRow = row; moved = false; startX = e.pageX; startLeft = row.scrollLeft; });
    row.addEventListener('mousemove', (e) => {
      if (dragRow !== row) return;
      const dx = e.pageX - startX;
      if (Math.abs(dx) > 4) { moved = true; row.style.cursor = 'grabbing'; row.scrollLeft = startLeft - dx; }
    });
    // a drag shouldn't also count as a click on a chip
    row.addEventListener('click', (e) => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
  });
}

rebuildOrder(); renderFilters(); renderArtistTabs(); renderPlaylists(); renderArtists(); bindScroll();
