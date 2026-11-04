// Nyanko-sensei falling animation, seasonal particles, and "click the cat to pick a playlist"
const sakura = document.getElementById('sakura');
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

// ---------- Seasonal particles ----------
// spring: petals · summer: fireflies · autumn: maple leaves · winter: snow
// Preview another season with ?season=spring|summer|autumn|winter
function currentSeason() {
  const forced = new URLSearchParams(location.search).get('season');
  if (['spring', 'summer', 'autumn', 'winter'].includes(forced)) return forced;
  const m = new Date().getMonth() + 1;
  return m >= 3 && m <= 5 ? 'spring' : m >= 6 && m <= 8 ? 'summer' : m >= 9 && m <= 11 ? 'autumn' : 'winter';
}
const SEASON = currentSeason();
document.documentElement.dataset.season = SEASON;
const SEASON_PARTICLES = { spring: ['🌸', '🌺', '🌼'], autumn: ['🍁', '🍂', '🍁'], winter: ['❄️', '❅', '❆'] };

if (SEASON === 'summer') {
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
  const glyphs = SEASON_PARTICLES[SEASON];
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    p.className = 'petal' + (SEASON === 'winter' ? ' snow' : '');
    p.textContent = glyphs[i % glyphs.length];
    p.style.left = Math.random() * 100 + 'vw';
    p.style.fontSize = (14 + Math.random() * 12) + 'px';
    p.style.animationDuration = (6 + Math.random() * 10) + 's';
    p.style.animationDelay = (Math.random() * 12) + 's';
    p.style.opacity = 0.4 + Math.random() * 0.4;
    sakura.appendChild(p);
  }
}

// ---------- Nyanko-sensei ----------
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

function spawnCat() {
  if (activeCats >= MAX_CATS) {
    setTimeout(spawnCat, 2000);
    return;
  }
  if (catQueue.length === 0) catQueue = shuffle(catImgs);
  activeCats++;
  const p = document.createElement('div');
  p.className = 'petal cat';
  p.style.animationFillMode = 'none';
  const img = document.createElement('img');
  img.src = catQueue.shift();
  img.alt = '貓咪老師';
  img.draggable = false;
  const size = 75 + Math.random() * 40;
  img.style.width = size + 'px';
  img.style.height = 'auto';
  img.style.display = 'block';
  p.appendChild(img);
  // 分散到三個水平區域，避免重疊
  const zones = [[5, 28], [35, 58], [65, 88]];
  const zone = zones[Math.floor(Math.random() * zones.length)];
  p.style.left = (zone[0] + Math.random() * (zone[1] - zone[0])) + 'vw';
  const dur = 14 + Math.random() * 8;
  p.style.animationDuration = dur + 's';
  p.style.animationDelay = '0s';
  p.style.opacity = 0.9;
  p.addEventListener('click', () => catClicked(p));
  sakura.appendChild(p);
  // Remove after one full fall. Uses the animation's own clock, so a cat that
  // was paused to talk finishes its fall instead of vanishing mid-screen.
  p.addEventListener('animationiteration', () => {
    p.remove();
    activeCats--;
    setTimeout(spawnCat, 500 + Math.random() * 1000);
  }, { once: true });
}

setTimeout(spawnCat, 500);
setTimeout(spawnCat, 4000 + Math.random() * 2000);
setTimeout(spawnCat, 8000 + Math.random() * 2000);

// ---------- Nyanko-sensei's lines (中文 / 日本語), used by the bubble, greeting and pomodoro ----------
const VOICE_LINES = {
  zh: {
    pick: [
      '哼，本大爺心情好，就推薦你這個吧！',
      '聽這個！聽完記得買饅頭孝敬本大爺。',
      '本大爺的品味可是一流的，聽就對了。',
      '配一杯酒剛剛好～這個！',
      '別吵，本大爺在睡午覺……就這個吧。',
    ],
    empty: '什麼都沒有？你的篩選也太挑了吧！',
    greet: {
      upbeat: '早安！本大爺幫你挑了輕快的，打起精神來！',
      cafe: '下午了，來杯咖啡配饅頭吧。',
      cozy: '晚上了，窩著聽點舒服的吧。',
      sleep: '這麼晚還不睡？本大爺先睡了，你也快睡。',
    },
    auto: label => `（幫你選好「${label}」了）`,
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
    empty: 'なんだ、何もないぞ？選り好みしすぎだ！',
    greet: {
      upbeat: 'おはよう！元気の出るやつを選んでやったぞ！',
      cafe: '午後か。コーヒーと饅頭でひと休みだな。',
      cozy: '夜だな。ゆったりしたのでも聴いてくつろげ。',
      sleep: 'まだ起きてるのか？ワシは先に寝るぞ。お前も早く寝ろ。',
    },
    auto: label => `（「${label}」を選んでおいたぞ）`,
    focusEnd: { line: 'お疲れ！五分休憩だ。ついでにワシに酒を注げ。', btn: '休憩する', later: 'あとで' },
    breakEnd: { line: 'もう十分休んだだろう？勉強に戻れ、ワシが見張ってるぞ。', btn: '集中する', later: 'あとで' },
  },
};
let voice = (() => { try { return JSON.parse(localStorage.getItem('nyanko-voice')) === 'ja' ? 'ja' : 'zh'; } catch (e) { return 'zh'; } })();
const V = () => VOICE_LINES[voice];

// ---------- Click a cat: it stops, talks, and picks a playlist ----------
let bubbleTimer = null;
function catClicked(cat) {
  if (cat.classList.contains('talking')) return;
  document.querySelectorAll('.cat.talking').forEach(c => c.classList.remove('talking'));
  cat.classList.add('talking');
  const pick = typeof catPickPlaylist === 'function' ? catPickPlaylist() : null;
  const line = pick ? V().pick[Math.floor(Math.random() * V().pick.length)] : V().empty;
  showBubble(cat, line, pick ? pick.n : '');
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => { cat.classList.remove('talking'); hideBubble(); }, 4500);
}
function showBubble(cat, line, name) {
  let b = document.getElementById('cat-bubble');
  if (!b) { b = document.createElement('div'); b.id = 'cat-bubble'; b.className = 'cat-bubble'; b.setAttribute('role', 'status'); document.body.appendChild(b); }
  b.innerHTML = '';
  b.append(line);
  if (name) { const s = document.createElement('strong'); s.textContent = '「' + name + '」'; b.append(s); }
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
