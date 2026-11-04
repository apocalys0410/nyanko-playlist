// Nyanko-sensei falling animation + seasonal petals
// Sakura petals
const sakura = document.getElementById('sakura');
// Nyanko-sensei images
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

// Flower petals: 18 flowers
const petals = ['🌸', '🌺', '🌼'];
for (let i = 0; i < 18; i++) {
  const p = document.createElement('div');
  p.className = 'petal';
  p.textContent = petals[i % petals.length];
  p.style.left = Math.random() * 100 + 'vw';
  p.style.fontSize = (14 + Math.random() * 12) + 'px';
  p.style.animationDuration = (6 + Math.random() * 10) + 's';
  p.style.animationDelay = (Math.random() * 12) + 's';
  p.style.opacity = 0.4 + Math.random() * 0.4;
  sakura.appendChild(p);
}

// Nyanko-sensei: max 2 on screen at once, dynamically spawned
// shuffle helper
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
  p.className = 'petal';
  p.style.animationFillMode = 'none';
  const img = document.createElement('img');
  img.src = catQueue.shift();
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
  sakura.appendChild(p);
  setTimeout(() => {
    p.remove();
    activeCats--;
    // Immediately try to spawn next so screen always has 2
    setTimeout(spawnCat, 500 + Math.random() * 1000);
  }, dur * 1000);
}

// Always keep 3 cats on screen — staggered start
setTimeout(spawnCat, 500);
setTimeout(spawnCat, 4000 + Math.random() * 2000);
setTimeout(spawnCat, 8000 + Math.random() * 2000);
