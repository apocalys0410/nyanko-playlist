// Study pomodoro: 25 min focus / 5 min break. Shown while the "讀書" filter is on
// (or while a timer is running). Survives reloads via localStorage. When a phase
// ends, one of the Nyanko-sensei images (catImgs from nyanko.js) pops up.
(() => {
  const FOCUS = 25 * 60e3, BREAK = 5 * 60e3;
  const KEY = 'nyanko-pomo';
  const el = document.getElementById('pomo');
  const baseTitle = document.title;
  // { mode: 'focus'|'break', endAt: ms|null, left: ms }
  let t = Object.assign({ mode: 'focus', endAt: null, left: FOCUS }, store.get(KEY, {}));
  let tick = null;

  const fmt = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
  const remaining = () => t.endAt ? t.endAt - Date.now() : t.left;
  const save = () => store.set(KEY, t);

  function render() {
    const running = !!t.endAt;
    el.hidden = !(state.u === 'study' || running);
    el.classList.toggle('break', t.mode === 'break');
    el.innerHTML =
      `<span class="pomo-mode">${t.mode === 'focus' ? '🍅 專注' : '☕ 休息'}</span>` +
      `<span class="pomo-time">${fmt(remaining())}</span>` +
      `<button type="button" class="tab${running ? ' active' : ''}" data-pomo="toggle">${running ? '暫停' : '開始'}</button>` +
      `<button type="button" class="linkish" data-pomo="reset">重設</button>`;
    document.title = running ? `${t.mode === 'focus' ? '🍅' : '☕'} ${fmt(remaining())} · ${baseTitle}` : baseTitle;
  }
  function start() { t.endAt = Date.now() + t.left; save(); run(); }
  function pause() { t.left = Math.max(0, t.endAt - Date.now()); t.endAt = null; save(); stop(); render(); }
  function reset() { t = { mode: 'focus', endAt: null, left: FOCUS }; save(); stop(); render(); }
  function stop() { clearInterval(tick); tick = null; }
  function run() {
    stop();
    tick = setInterval(() => { if (remaining() <= 0) finish(); else updateTime(); }, 250);
    render();
  }
  function updateTime() {
    const time = el.querySelector('.pomo-time');
    if (time) time.textContent = fmt(remaining());
    document.title = `${t.mode === 'focus' ? '🍅' : '☕'} ${fmt(remaining())} · ${baseTitle}`;
  }
  function finish() {
    stop();
    const wasFocus = t.mode === 'focus';
    t = { mode: wasFocus ? 'break' : 'focus', endAt: null, left: wasFocus ? BREAK : FOCUS };
    save(); render();
    popCat(wasFocus ? V().focusEnd : V().breakEnd);
  }

  // Nyanko-sensei pop-up (uses the same images as the falling cats)
  function popCat({ line, btn, later }) {
    let pop = document.getElementById('pomo-pop');
    if (!pop) {
      pop = document.createElement('div');
      pop.id = 'pomo-pop'; pop.className = 'pomo-pop'; pop.setAttribute('role', 'alertdialog');
      document.body.appendChild(pop);
      pop.addEventListener('click', e => {
        const b = e.target.closest('[data-pop]');
        if (!b) return;
        closeDialog(pop);
        if (b.dataset.pop === 'go') start();
      });
    }
    pop.innerHTML = `<div class="pomo-card"><img src="${catImgs[Math.floor(Math.random() * catImgs.length)]}" alt="貓咪老師">` +
      `<p></p><div class="pomo-actions"><button type="button" class="shuffle" data-pop="go">${btn}</button>` +
      `<button type="button" class="linkish" data-pop="later">${later}</button></div></div>`;
    pop.querySelector('p').textContent = line;
    openDialog(pop, '[data-pop="go"]');
  }

  el.addEventListener('click', e => {
    const b = e.target.closest('[data-pomo]');
    if (!b) return;
    if (b.dataset.pomo === 'reset') reset();
    else if (t.endAt) pause(); else start();
  });
  // Show/hide with the 讀書 filter, wherever 用途 changes (app.js handlers run first since they were bound earlier)
  document.getElementById('filters').addEventListener('click', render);
  document.getElementById('reset').addEventListener('click', render);
  document.getElementById('rain-btn').addEventListener('click', render);   // rain mode switches 用途 to Cozy

  if (t.endAt && remaining() <= 0) finish();   // a phase ended while the page was closed
  else if (t.endAt) run();
  else render();
})();
