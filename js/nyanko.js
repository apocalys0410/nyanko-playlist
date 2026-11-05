// Nyanko-sensei: falling cats, seasonal / holiday / rain particles, click-to-pick,
// rare golden cat, and the 圖鑑 (collection of the cats you've clicked).
const sakura = document.getElementById('sakura');
const params = new URLSearchParams(location.search);
// Nyanko-sensei images (the user's own artwork — always use these, never substitutes)
const catImgs = [
  "img/nyanko/01.webp",
  "img/nyanko/02.webp",
  "img/nyanko/03.webp",
  "img/nyanko/04.webp",
  "img/nyanko/05.webp",
  "img/nyanko/06.webp",
  "img/nyanko/07.webp",
  "img/nyanko/08.webp",
  "img/nyanko/09.webp",
  "img/nyanko/10.webp",
];
const ls = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
};

// ---------- Season & holiday ----------
// Preview with ?season=spring|summer|autumn|winter or ?holiday=christmas|newyear|lunar|midautumn|halloween|qixi
function currentSeason() {
  const forced = params.get('season');
  if (['spring', 'summer', 'autumn', 'winter'].includes(forced)) return forced;
  const m = new Date().getMonth() + 1;
  return m >= 3 && m <= 5 ? 'spring' : m >= 6 && m <= 8 ? 'summer' : m >= 9 && m <= 11 ? 'autumn' : 'winter';
}
// Lunar festivals move every year: Gregorian dates of 春節 (正月初一), 七夕 and 中秋, 2026–2030.
// Extend this table when it runs out.
const LUNAR = {
  lunar:     { 2026: '02-17', 2027: '02-06', 2028: '01-26', 2029: '02-13', 2030: '02-03' },
  qixi:      { 2026: '08-19', 2027: '08-08', 2028: '08-26', 2029: '08-16', 2030: '08-05' },
  midautumn: { 2026: '09-25', 2027: '09-15', 2028: '10-03', 2029: '09-22', 2030: '09-12' },
};
const LUNAR_WINDOW = { lunar: [-1, 5], qixi: [-1, 0], midautumn: [-2, 1] };   // days before / after
function currentHoliday() {
  const forced = params.get('holiday');
  if (forced in HOLIDAY_PARTICLES) return forced;
  const d = new Date(); d.setHours(12, 0, 0, 0);
  const y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate();
  for (const [k, years] of Object.entries(LUNAR)) {
    if (!years[y]) continue;
    const at = new Date(`${y}-${years[y]}T12:00:00`);
    const diff = Math.round((d - at) / 864e5);
    if (diff >= LUNAR_WINDOW[k][0] && diff <= LUNAR_WINDOW[k][1]) return k;
  }
  if ((m === 12 && day >= 31) || (m === 1 && day <= 2)) return 'newyear';
  if (m === 12 && day >= 20 && day <= 26) return 'christmas';
  if (m === 10 && day >= 25) return 'halloween';
  return null;
}
const HOLIDAY_PARTICLES = {
  christmas: ['❄️', '🎄', '🎁', '❄️'],
  newyear: ['🎆', '✨', '🎉'],
  lunar: ['🧧', '🧨', '🏮'],
  midautumn: ['🌕', '🥮', '🐇'],
  halloween: ['🎃', '🦇', '👻'],
  qixi: ['⭐', '✨', '🌟'],
};
const SEASON = currentSeason();
const HOLIDAY = currentHoliday();
document.documentElement.dataset.season = SEASON;
if (HOLIDAY) document.documentElement.dataset.holiday = HOLIDAY;
const SEASON_PARTICLES = { spring: ['🌸', '🌺', '🌼'], autumn: ['🍁', '🍂', '🍁'], winter: ['❄️', '❅', '❆'] };

if (!HOLIDAY && SEASON === 'summer') {
  for (let i = 0; i < 16; i++) {
    const f = document.createElement('div');
    f.className = 'firefly';
    f.style.left = Math.random() * 100 + 'vw';
    f.style.top = 20 + Math.random() * 75 + 'vh';
    f.style.setProperty('--dx', (Math.random() * 80 - 40) + 'px');
    f.style.setProperty('--dy', -(20 + Math.random() * 60) + 'px');
    f.style.animationDuration = (6 + Math.random() * 6) + 's, ' + (1.5 + Math.random() * 2) + 's';
    f.style.animationDelay = -(Math.random() * 10) + 's, ' + -(Math.random() * 3) + 's';
    sakura.appendChild(f);
  }
} else {
  const glyphs = HOLIDAY ? HOLIDAY_PARTICLES[HOLIDAY] : SEASON_PARTICLES[SEASON];
  const snowy = HOLIDAY ? HOLIDAY === 'christmas' : SEASON === 'winter';
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    p.className = 'petal' + (snowy ? ' snow' : '');
    p.textContent = glyphs[i % glyphs.length];
    p.style.left = Math.random() * 100 + 'vw';
    p.style.fontSize = (14 + Math.random() * 12) + 'px';
    p.style.animationDuration = (6 + Math.random() * 10) + 's';
    p.style.animationDelay = (Math.random() * 12) + 's';
    p.style.opacity = 0.4 + Math.random() * 0.4;
    sakura.appendChild(p);
  }
}

// ---------- Rain mode (toggled from app.js) ----------
function setRainParticles(on) {
  sakura.classList.toggle('raining', on);
  sakura.querySelectorAll('.raindrop').forEach(d => d.remove());
  if (!on) return;
  for (let i = 0; i < 70; i++) {
    const d = document.createElement('div');
    d.className = 'raindrop';
    d.style.left = Math.random() * 105 + 'vw';
    d.style.height = (12 + Math.random() * 16) + 'px';
    d.style.animationDuration = (0.55 + Math.random() * 0.5) + 's';
    d.style.animationDelay = -(Math.random() * 2) + 's';
    d.style.opacity = 0.25 + Math.random() * 0.35;
    sakura.appendChild(d);
  }
}

// ---------- Nyanko-sensei's lines (中文 / 日本語) ----------
const VOICE_LINES = {
  zh: {
    pick: [
      '哼，本大爺心情好，就推薦你這個吧！',
      '聽這個！聽完記得買饅頭孝敬本大爺。',
      '本大爺的品味可是一流的，聽就對了。',
      '配一杯酒剛剛好～這個！',
      '別吵，本大爺在睡午覺……就這個吧。',
    ],
    rare: '哼哼，被你發現本大爺閃閃發光的樣子了！特別賞你這個。',
    empty: '什麼都沒有？你的篩選也太挑了吧！',
    greet: {
      upbeat: '早安！本大爺幫你挑了輕快的，打起精神來！',
      cafe: '下午了，來杯咖啡配饅頭吧。',
      cozy: '晚上了，窩著聽點舒服的吧。',
      sleep: '這麼晚還不睡？本大爺先睡了，你也快睡。',
    },
    holiday: {
      christmas: '聖誕快樂！本大爺的禮物是饅頭，記住了。',
      newyear: '新年快樂！今年也要供奉本大爺好吃的。',
      lunar: '過年啦！紅包拿來，本大爺要買酒。',
      midautumn: '中秋節！月餅都是本大爺的，誰都別搶。',
      halloween: '萬聖節？本大爺才不怕妖怪，本大爺就是……咳，沒事。',
      qixi: '七夕啊……本大爺只想跟酒約會。',
    },
    rain: '下雨了……本大爺最討厭淋濕，窩著聽歌吧。',
    auto: label => `（幫你選好「${label}」了）`,
    relaxed: list => `照你的篩選找不到，放寬了：${list}`,
    newDex: (n, total) => `★ 收集到新的貓咪老師！（${n}/${total}）`,
    dexTitle: '貓咪老師圖鑑',
    dexRare: '閃亮版',
    dexClose: '關閉',
    dexHint: '點飄下來的貓咪老師就能收集',
    focusEnd: { line: '辛苦了！休息五分鐘，順便給本大爺倒杯酒。', btn: '開始休息', later: '等一下' },
    breakEnd: { line: '休息夠了吧？快回去讀書，本大爺盯著你。', btn: '開始專注', later: '等一下' },
  },
  ja: {
    pick: [
      'ふん、今日は機嫌がいいから、これを教えてやろう！',
      'これを聴け！聴き終わったら饅頭を買ってくるのだぞ。',
      'ワシの趣味は一流だからな。黙って聴け。',
      '一杯やりながらこれだな～',
      'うるさい、ワシは昼寝中だ……これでいいだろう。',
    ],
    rare: 'ふふん、光り輝くワシを見つけたな！特別にこれをやろう。',
    empty: 'なんだ、何もないぞ？選り好みしすぎだ！',
    greet: {
      upbeat: 'おはよう！元気の出るやつを選んでやったぞ！',
      cafe: '午後か。コーヒーと饅頭でひと休みだな。',
      cozy: '夜だな。ゆったりしたのでも聴いてくつろげ。',
      sleep: 'まだ起きてるのか？ワシは先に寝るぞ。お前も早く寝ろ。',
    },
    holiday: {
      christmas: 'メリークリスマス！ワシへのプレゼントは饅頭だぞ。',
      newyear: 'あけましておめでとう！今年もワシにうまいものを供えるのだぞ。',
      lunar: '春節だ！お年玉をよこせ、ワシは酒を買うのだ。',
      midautumn: '中秋節だ！月餅は全部ワシのものだ、誰にも渡さんぞ。',
      halloween: 'ハロウィン？ワシは妖怪なんぞ怖くないぞ。ワシこそが……ゴホン、なんでもない。',
      qixi: '七夕か……ワシは酒とデートだな。',
    },
    rain: '雨か……濡れるのは嫌いだ。こもって音楽でも聴くか。',
    auto: label => `（「${label}」を選んでおいたぞ）`,
    relaxed: list => `条件に合うのがないから、${list}を外したぞ`,
    newDex: (n, total) => `★ 新しいニャンコ先生を見つけた！（${n}/${total}）`,
    dexTitle: 'ニャンコ先生図鑑',
    dexRare: 'キラキラ版',
    dexClose: '閉じる',
    dexHint: '降ってくるニャンコ先生をクリックして集めよう',
    focusEnd: { line: 'お疲れ！五分休憩だ。ついでにワシに酒を注げ。', btn: '休憩する', later: 'あとで' },
    breakEnd: { line: 'もう十分休んだだろう？勉強に戻れ、ワシが見張ってるぞ。', btn: '集中する', later: 'あとで' },
  },
};
let voice = ls.get('nyanko-voice', 'zh') === 'ja' ? 'ja' : 'zh';
const V = () => VOICE_LINES[voice];

// ---------- Falling cats ----------
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

let catQueue = shuffle(catImgs);
let activeCats = 0;
const MAX_CATS = 3;
const RARE_CHANCE = params.get('rare') === '1' ? 1 : 1 / 30;   // ?rare=1 to preview

function spawnCat() {
  if (activeCats >= MAX_CATS) {
    setTimeout(spawnCat, 2000);
    return;
  }
  if (catQueue.length === 0) catQueue = shuffle(catImgs);
  activeCats++;
  const rare = Math.random() < RARE_CHANCE;
  const p = document.createElement('div');
  p.className = 'petal cat' + (rare ? ' rare' : '');
  p.style.animationFillMode = 'none';
  const src = catQueue.shift();
  p.dataset.img = src;
  const img = document.createElement('img');
  img.src = src;
  img.alt = '貓咪老師';
  img.draggable = false;
  const size = rare ? 140 + Math.random() * 30 : 75 + Math.random() * 40;
  img.style.width = size + 'px';
  img.style.height = 'auto';
  img.style.display = 'block';
  p.appendChild(img);
  // 分散到三個水平區域，避免重疊
  const zones = [[5, 28], [35, 58], [65, 88]];
  const zone = zones[Math.floor(Math.random() * zones.length)];
  p.style.left = (zone[0] + Math.random() * (zone[1] - zone[0])) + 'vw';
  const dur = (rare ? 20 : 14) + Math.random() * 8;
  p.style.animationDuration = dur + 's';
  p.style.animationDelay = '0s';
  p.style.opacity = rare ? 1 : 0.9;
  p.addEventListener('click', () => catClicked(p));
  // Reachable from the keyboard too: Tab to a falling cat, Enter / Space to click it
  p.tabIndex = 0;
  p.setAttribute('role', 'button');
  p.setAttribute('aria-label', rare ? '閃亮的貓咪老師（點我推薦歌單）' : '貓咪老師（點我推薦歌單）');
  img.alt = '';
  p.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); catClicked(p); }
  });
  sakura.appendChild(p);
  // Remove after one full fall. Uses the animation's own clock, so a cat that
  // was paused to talk finishes its fall instead of vanishing mid-screen.
  // Only the cat's own fall counts: the golden cat's image runs a looping glow
  // animation whose iteration events bubble up here too.
  p.addEventListener('animationiteration', function done(e) {
    if (e.target !== p) return;
    p.removeEventListener('animationiteration', done);
    p.remove();
    activeCats--;
    setTimeout(spawnCat, 500 + Math.random() * 1000);
  });
}

setTimeout(spawnCat, 500);
setTimeout(spawnCat, 4000 + Math.random() * 2000);
setTimeout(spawnCat, 8000 + Math.random() * 2000);

// ---------- 圖鑑: every cat image you've clicked, plus the rare one ----------
const dex = new Set(ls.get('nyanko-dex', []));
const DEX_TOTAL = catImgs.length + 1;   // 10 cats + the golden one
function collect(key) {
  if (dex.has(key)) return null;
  dex.add(key); ls.set('nyanko-dex', [...dex]);
  renderDexButton();
  return V().newDex(dex.size, DEX_TOTAL);
}
function renderDexButton() {
  const b = document.getElementById('dex-btn');
  if (b) b.innerHTML = `🐾 ${V().dexTitle} <b>${dex.size}/${DEX_TOTAL}</b>`;
}
function openDex() {
  let m = document.getElementById('dex');
  if (!m) {
    m = document.createElement('div');
    m.id = 'dex'; m.className = 'pomo-pop'; m.setAttribute('role', 'dialog');
    m.addEventListener('click', e => { if (e.target === m || e.target.closest('[data-dex-close]')) closeDialog(m); });
    document.body.appendChild(m);
  }
  const cell = (key, src, label) => dex.has(key)
    ? `<figure class="dex-cell${key === 'rare' ? ' rare' : ''}"><img src="${src}" alt="${label}"><figcaption>${label}</figcaption></figure>`
    : `<figure class="dex-cell locked"><span>?</span><figcaption>${label}</figcaption></figure>`;
  m.innerHTML = `<div class="pomo-card dex-card"><h3>🐾 ${V().dexTitle} · ${dex.size}/${DEX_TOTAL}</h3>` +
    `<div class="dex-grid">${catImgs.map((src, i) => cell(src, src, 'No.' + String(i + 1).padStart(2, '0'))).join('')}` +
    cell('rare', catImgs[0], '★ ' + V().dexRare) + `</div>` +
    `<p class="dex-hint">${V().dexHint}</p><button type="button" class="shuffle" data-dex-close>${V().dexClose}</button></div>`;
  openDialog(m, '[data-dex-close]');
}

// ---------- Pop-up dialogs (圖鑑 here, the pomodoro cat in pomodoro.js) ----------
// Opening moves focus into the dialog; Esc or closing hands it back to where it was.
let dialogReturn = null;
function openDialog(m, focusSel) {
  if (!m.contains(document.activeElement)) dialogReturn = document.activeElement;
  m.setAttribute('aria-modal', 'true');
  m.hidden = false;
  m.querySelector(focusSel)?.focus();
}
function closeDialog(m) {
  m.hidden = true;
  if (dialogReturn && dialogReturn.isConnected) dialogReturn.focus();
  dialogReturn = null;
}
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const open = [...document.querySelectorAll('.pomo-pop')].find(m => !m.hidden);
  if (open) closeDialog(open);
});

// ---------- Click a cat: it stops, talks, and picks a playlist ----------
let bubbleTimer = null;
function catClicked(cat) {
  if (cat.classList.contains('talking')) return;
  document.querySelectorAll('.cat.talking').forEach(c => c.classList.remove('talking'));
  cat.classList.add('talking');
  const rare = cat.classList.contains('rare');
  const pick = typeof catPickPlaylist === 'function' ? catPickPlaylist(rare) : null;
  const line = !pick ? V().empty : rare ? V().rare : V().pick[Math.floor(Math.random() * V().pick.length)];
  const fresh = [collect(cat.dataset.img), rare ? collect('rare') : null].filter(Boolean).pop();
  const note = [pick && pick.relaxed.length ? V().relaxed(pick.relaxed.join('、')) : '', fresh].filter(Boolean).join('\n');
  showBubble(cat, line, pick ? pick.n : '', note);
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => { cat.classList.remove('talking'); hideBubble(); }, fresh ? 5500 : 4500);
}
function showBubble(cat, line, name, note) {
  let b = document.getElementById('cat-bubble');
  if (!b) { b = document.createElement('div'); b.id = 'cat-bubble'; b.className = 'cat-bubble'; b.setAttribute('role', 'status'); document.body.appendChild(b); }
  b.innerHTML = '';
  b.append(line);
  if (name) { const s = document.createElement('strong'); s.textContent = '「' + name + '」'; b.append(s); }
  if (note) { const n = document.createElement('em'); n.textContent = note; b.append(n); }
  const r = cat.getBoundingClientRect();
  const w = Math.min(240, innerWidth - 32);
  b.style.width = w + 'px';
  b.style.left = Math.max(16, Math.min(innerWidth - w - 16, r.left + r.width / 2 - w / 2)) + 'px';
  const below = r.top < 120;
  b.style.top = (below ? r.bottom + 10 : Math.max(10, r.top - 10)) + 'px';
  b.classList.toggle('below', below);
  b.hidden = false;
}
function hideBubble() { const b = document.getElementById('cat-bubble'); if (b) b.hidden = true; }
