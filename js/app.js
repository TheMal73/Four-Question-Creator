(function () {
  'use strict';

  const TOPICS = window.GCSE_TOPICS;
  const byId = new Map(TOPICS.map((t) => [t.id, t]));
  const GROUPS = [...new Set(TOPICS.map((t) => t.group))];
  const DEFAULT = { topics: ['addFrac', 'expandDouble', 'percentOf', 'pythagoras'], perQ: 1, titles: true };
  const LETTERS = 'abc';
  const STORE_KEY = 'fqc-config';

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } },
  };

  const state = { ...DEFAULT, resolved: [], sets: [], revealed: [false, false, false, false] };

  const $ = (id) => document.getElementById(id);
  const grid = $('grid');
  const setup = $('setup');
  const form = $('setupForm');

  // ---------- config <-> URL ----------
  function validConfig(c) {
    return c && Array.isArray(c.topics) && c.topics.length === 4 &&
      c.topics.every((id) => id === 'random' || byId.has(id));
  }
  function parseHash() {
    const p = new URLSearchParams(location.hash.slice(1));
    const cfg = {
      topics: (p.get('q') || '').split(','),
      perQ: Math.min(3, Math.max(1, parseInt(p.get('n'), 10) || 1)),
      titles: p.get('h') !== '0',
    };
    return validConfig(cfg) ? cfg : null;
  }
  const hashFor = (c) => `q=${c.topics.join(',')}&n=${c.perQ}${c.titles ? '' : '&h=0'}`;
  function savedConfig() {
    try { const c = JSON.parse(store.get(STORE_KEY)); return validConfig(c) ? c : null; } catch (e) { return null; }
  }

  // ---------- quadrants ----------
  for (let i = 0; i < 4; i++) {
    const s = document.createElement('section');
    s.className = `quad c${i + 1}`;
    s.dataset.i = i;
    s.innerHTML = `
      <div class="qhead">
        <span class="badge">${i + 1}</span>
        <h2 class="qtitle"></h2>
        <div class="qactions">
          <button type="button" class="qbtn new" title="New question" aria-label="New question for quadrant ${i + 1}">↻</button>
          <button type="button" class="qbtn reveal" aria-pressed="false">Answer</button>
        </div>
      </div>
      <div class="qbody"></div>
      <div class="qans" hidden></div>`;
    grid.appendChild(s);
  }

  grid.addEventListener('click', (e) => {
    const s = e.target.closest('.quad');
    if (!s) return;
    const i = Number(s.dataset.i);
    if (e.target.closest('.new')) refresh(i);
    else if (e.target.closest('.reveal')) toggleReveal(i);
  });

  function generateSet(id, count) {
    const t = byId.get(id), out = [];
    for (let tries = 0; out.length < count && tries < 60; tries++) {
      const qa = t.gen();
      if (!out.some((o) => o.q === qa.q)) out.push(qa);
    }
    return out;
  }

  function refresh(i) {
    const sel = state.topics[i];
    let id = sel;
    if (sel === 'random') {
      const used = state.resolved.filter((_, j) => j !== i);
      const pool = TOPICS.filter((t) => !used.includes(t.id));
      id = pool[Math.floor(Math.random() * pool.length)].id;
    }
    state.resolved[i] = id;
    state.sets[i] = generateSet(id, state.perQ);
    state.revealed[i] = false;
    render(i);
  }

  function refreshAll() { for (let i = 0; i < 4; i++) refresh(i); }

  function render(i) {
    const s = grid.children[i];
    const t = byId.get(state.resolved[i]);
    const set = state.sets[i];
    const multi = set.length > 1;
    s.querySelector('.qtitle').textContent = state.titles ? t.name : `Question ${i + 1}`;
    const body = s.querySelector('.qbody');
    body.className = `qbody n${set.length}`;
    body.innerHTML = set.map((qa, j) =>
      `<div class="qitem">${multi ? `<span class="qlabel">(${LETTERS[j]})</span>` : ''}<div class="qcontent">${qa.q}</div></div>`).join('');
    s.querySelector('.qans').innerHTML = set.map((qa, j) =>
      `<div>${multi ? `<b>(${LETTERS[j]})</b> ` : ''}${qa.a}</div>`).join('');
    applyReveal(i);
  }

  function applyReveal(i) {
    const s = grid.children[i];
    const on = state.revealed[i];
    s.querySelector('.qans').hidden = !on;
    const b = s.querySelector('.reveal');
    b.setAttribute('aria-pressed', String(on));
    b.textContent = on ? 'Hide' : 'Answer';
    $('btnAnswers').textContent = state.revealed.every(Boolean) ? 'Hide answers' : 'Show answers';
  }

  function toggleReveal(i) { state.revealed[i] = !state.revealed[i]; applyReveal(i); }
  function toggleAll() {
    const show = !state.revealed.every(Boolean);
    for (let i = 0; i < 4; i++) { state.revealed[i] = show; applyReveal(i); }
  }

  // ---------- setup dialog ----------
  const selects = [0, 1, 2, 3].map((i) => form.elements[`t${i}`]);
  const optionsHTML = `<option value="random">🎲 Random topic</option>` + GROUPS.map((g) =>
    `<optgroup label="${g}">${TOPICS.filter((t) => t.group === g)
      .map((t) => `<option value="${t.id}">${t.name}${t.tier === 'H' ? ' (Higher)' : ''}</option>`).join('')}</optgroup>`).join('');
  selects.forEach((sel) => { sel.innerHTML = optionsHTML; });

  function fillForm(cfg) {
    selects.forEach((sel, i) => { sel.value = cfg.topics[i]; });
    form.elements.perQ.value = String(cfg.perQ);
    form.elements.titles.checked = cfg.titles;
  }
  function readForm() {
    return {
      topics: selects.map((s) => s.value),
      perQ: Number(form.elements.perQ.value),
      titles: form.elements.titles.checked,
    };
  }
  function applyConfig(cfg) {
    state.topics = cfg.topics.slice();
    state.perQ = cfg.perQ;
    state.titles = cfg.titles;
    state.resolved = [];
    store.set(STORE_KEY, JSON.stringify(cfg));
    history.replaceState(null, '', '#' + hashFor(cfg));
    refreshAll();
  }
  function openSetup() {
    fillForm({ topics: state.topics, perQ: state.perQ, titles: state.titles });
    if (!setup.open) setup.showModal();
  }

  form.addEventListener('submit', () => applyConfig(readForm()));
  setup.addEventListener('cancel', (e) => { if (!state.sets.length) e.preventDefault(); });

  $('btnRandomAll').addEventListener('click', () => {
    const ids = TOPICS.map((t) => t.id).sort(() => Math.random() - 0.5);
    selects.forEach((sel, i) => { sel.value = ids[i]; });
  });

  $('btnCopy').addEventListener('click', async (e) => {
    const url = location.href.split('#')[0] + '#' + hashFor(readForm());
    const btn = e.currentTarget, old = btn.textContent;
    try { await navigator.clipboard.writeText(url); btn.textContent = 'Link copied!'; }
    catch (err) { window.prompt('Copy this link:', url); }
    setTimeout(() => { btn.textContent = old; }, 1800);
  });

  // ---------- header controls ----------
  $('btnNew').addEventListener('click', refreshAll);
  $('btnAnswers').addEventListener('click', toggleAll);
  $('btnTopics').addEventListener('click', openSetup);

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
  }
  $('btnFull').addEventListener('click', toggleFullscreen);

  const theme = store.get('fqc-theme');
  if (theme) document.documentElement.dataset.theme = theme;
  $('btnTheme').addEventListener('click', () => {
    const dark = document.documentElement.dataset.theme
      ? document.documentElement.dataset.theme === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    const next = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    store.set('fqc-theme', next);
  });

  // ---------- timer ----------
  const timerBtn = $('timerBtn'), timerLen = $('timerLen');
  let remaining = Number(timerLen.value), ticking = null;
  const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  function drawTimer() {
    timerBtn.textContent = (ticking ? '⏸ ' : '▶ ') + fmtTime(remaining);
    timerBtn.classList.toggle('done', remaining === 0);
    timerBtn.classList.toggle('running', !!ticking);
  }
  function stopTimer() { clearInterval(ticking); ticking = null; }
  function resetTimer() { stopTimer(); remaining = Number(timerLen.value); drawTimer(); }
  timerBtn.addEventListener('click', () => {
    if (ticking) { stopTimer(); drawTimer(); return; }
    if (remaining === 0) remaining = Number(timerLen.value);
    ticking = setInterval(() => {
      remaining = Math.max(0, remaining - 1);
      if (remaining === 0) stopTimer();
      drawTimer();
    }, 1000);
    drawTimer();
  });
  $('timerReset').addEventListener('click', resetTimer);
  timerLen.addEventListener('change', resetTimer);
  drawTimer();

  // ---------- keyboard ----------
  document.addEventListener('keydown', (e) => {
    if (setup.open || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest && e.target.closest('input, select, textarea')) return;
    const k = e.key.toLowerCase();
    if (k === 'a' || k === ' ') { e.preventDefault(); toggleAll(); }
    else if (k === 'n') refreshAll();
    else if (k === 't') { e.preventDefault(); openSetup(); }
    else if (k === 'f') toggleFullscreen();
    else if (['1', '2', '3', '4'].includes(k)) toggleReveal(Number(k) - 1);
  });

  window.addEventListener('hashchange', () => {
    const cfg = parseHash();
    if (cfg) applyConfig(cfg);
  });

  // ---------- start ----------
  const fromHash = parseHash();
  if (fromHash) {
    applyConfig(fromHash);
  } else {
    const cfg = savedConfig() || DEFAULT;
    state.topics = cfg.topics.slice(); state.perQ = cfg.perQ; state.titles = cfg.titles;
    openSetup();
  }
})();
