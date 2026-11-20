/* Геоастро — карточки, тесты, подбор и билеты. Без зависимостей. */
(() => {
'use strict';
const D = window.DATA;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const main = $('#main');
const TK = Object.fromEntries(D.tickets.map(t => [t.n, t]));
const blockOf = n => TK[n].block;
const BLOCK_SHORT = ['Общие', 'Инструменты', 'Время', 'Теория', 'Способы', 'Азимут/Солнце', 'Редукции'];
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

/* ---------- storage ---------- */
const KEY = 'ga.v1';
const blank = () => ({ cards: {}, star: {}, quiz: {}, tickets: {}, match: { best: null }, tests: [], days: {} });
let S;
try { S = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { S = blank(); }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
const today = () => new Date().toISOString().slice(0, 10);
const touchDay = () => { S.days[today()] = (S.days[today()] || 0) + 1; };

/* ---------- spaced repetition (Leitner) ---------- */
const INTERVALS = [0, 10 * 60e3, 864e5, 3 * 864e5, 7 * 864e5, 16 * 864e5];
const cs = id => S.cards[id] || { box: 0, due: 0, ok: 0, bad: 0, seen: 0 };
function gradeCard(id, g) { // g: 0 не знаю, 1 сомневаюсь, 2 знаю
  const c = cs(id);
  c.seen++;
  if (g === 0) { c.box = 0; c.bad++; }
  else if (g === 1) { c.box = Math.max(1, c.box); }
  else { c.box = Math.min(5, c.box + 1); c.ok++; }
  c.due = Date.now() + INTERVALS[c.box];
  S.cards[id] = c; touchDay(); save();
}
const isLearned = id => cs(id).box >= 3;
const isDue = id => { const c = S.cards[id]; return c && c.seen && c.due <= Date.now(); };
const isNew = id => !S.cards[id] || !S.cards[id].seen;

/* ---------- helpers ---------- */
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const strip = s => String(s).replace(/<[^>]+>/g, '');
const plural = (n, a, b, c) => { const m = n % 10, h = n % 100; return n + ' ' + (m === 1 && h !== 11 ? a : m >= 2 && m <= 4 && (h < 10 || h >= 20) ? b : c); };
const icon = {
  cards: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="14" height="14" rx="2"/><path d="M7 3h12a2 2 0 0 1 2 2v12"/></svg>',
  learn: '<svg viewBox="0 0 24 24"><path d="M12 3l9 5-9 5-9-5z"/><path d="M7 10.5V16c3 2 7 2 10 0v-5.5"/></svg>',
  test: '<svg viewBox="0 0 24 24"><path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
  match: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M14 17.5h7M17.5 14v7"/></svg>',
  tickets: '<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h8M8 17h5"/></svg>',
  notes: '<svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/></svg>',
  fig: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18"/></svg>',
  star: '<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"/></svg>',
  shuffle: '<svg viewBox="0 0 24 24"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>',
  swap: '<svg viewBox="0 0 24 24"><path d="M7 16V4M3 8l4-4 4 4M17 8v12M21 16l-4 4-4-4"/></svg>',
  left: '<svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>',
  right: '<svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>',
  dice: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1"/><circle cx="15.5" cy="15.5" r="1"/><circle cx="12" cy="12" r="1"/></svg>',
  settings: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
};
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('show'), 1800); }
let cleanup = null; // per-view teardown (timers, key handlers)
function setView(html, nav) {
  if (cleanup) { cleanup(); cleanup = null; }
  main.innerHTML = html;
  $$('[data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === nav));
  window.scrollTo(0, 0);
}
function onKeys(fn) { const h = e => { if (e.target.closest('input,select,textarea') || e.metaKey || e.ctrlKey || e.altKey) return; fn(e); }; document.addEventListener('keydown', h); return () => document.removeEventListener('keydown', h); }

/* block filter chips (shared) */
let blockSel = new Set(D.blocks.map((_, i) => i));
function blockChips() {
  return `<div class="chips" role="group" aria-label="Фильтр по блокам">${D.blocks.map((b, i) =>
    `<button class="chip" data-block="${i}" aria-pressed="${blockSel.has(i)}" title="${esc(b.title)}">${ROMAN[i]} · ${BLOCK_SHORT[i]}</button>`).join('')}
    <button class="chip" data-block="all">Все</button></div>`;
}
function bindChips(rerender) {
  $$('[data-block]').forEach(b => b.onclick = () => {
    const v = b.dataset.block;
    if (v === 'all') blockSel = new Set(D.blocks.map((_, i) => i));
    else { const i = +v; if (blockSel.has(i) && blockSel.size > 1) blockSel.delete(i); else blockSel.add(i); }
    rerender();
  });
}
const cardsInSel = () => D.cards.filter(c => blockSel.has(blockOf(c.t)));

/* ---------- HOME ---------- */
function viewHome() {
  const total = D.cards.length, learned = D.cards.filter(c => isLearned(c.id)).length;
  const due = D.cards.filter(c => isDue(c.id)).length, fresh = D.cards.filter(c => isNew(c.id)).length;
  const tk = D.tickets.filter(t => S.tickets[t.n] === 2).length;
  const qAll = Object.values(S.quiz).reduce((a, q) => [a[0] + q.ok, a[1] + q.ok + q.bad], [0, 0]);
  const acc = qAll[1] ? Math.round(100 * qAll[0] / qAll[1]) : null;
  const streak = (() => { let n = 0; const d = new Date(); for (;;) { const k = d.toISOString().slice(0, 10); if (S.days[k]) { n++; d.setDate(d.getDate() - 1); } else break; } return n; })();
  const nextAction = due ? `<a class="btn" href="#/cards?due">Повторить ${plural(due, 'карточку', 'карточки', 'карточек')}</a>`
    : fresh ? `<a class="btn" href="#/learn">Учить новые (${fresh})</a>` : `<a class="btn" href="#/test">Пройти тест</a>`;
  const modes = [
    ['cards', 'Карточки', 'Переворачивай и оценивай себя — алгоритм сам решит, когда показать карточку снова.'],
    ['learn', 'Заучивание', 'Раунды с выбором ответа: карточка уходит, только когда ответишь верно дважды подряд.'],
    ['test', 'Тест', `${D.quiz.length} вопросов с объяснениями, плюс вопросы по схемам и карточкам.`],
    ['match', 'Подбор', 'Соедини термин и определение на время. Побей свой рекорд.'],
    ['tickets', 'Билеты', 'Имитация экзамена: случайный билет, таймер подготовки, проверка по «Коротко».'],
    ['notes', 'Конспект', 'Вся методичка: теория, формулы и 26 схем по каждому вопросу.'],
  ];
  setView(`
  <h1 class="page">Геодезическая астрономия</h1>
  <p class="lead">39 экзаменационных вопросов в одном месте: ${D.cards.length} карточек, ${D.quiz.length} тестовых вопросов, ${D.figs.length} схем и полный конспект. Прогресс сохраняется в этом браузере.</p>
  <div class="hero">
    <div class="card primary">
      <div class="muted small">Сегодня</div>
      <div class="row" style="margin:10px 0 16px;gap:28px">
        <div class="stat"><span class="big-num">${due}</span><span class="muted small">к повторению</span></div>
        <div class="stat"><span class="big-num">${fresh}</span><span class="muted small">новых</span></div>
        <div class="stat"><span class="big-num">${streak}</span><span class="muted small">${streak === 1 ? 'день подряд' : 'дней подряд'}</span></div>
      </div>
      ${nextAction}
    </div>
    <div class="card">
      <div class="grid g2" style="gap:16px">
        <div class="stat"><span class="muted small">Выучено карточек</span><b>${learned}/${total}</b><div class="bar ok"><i style="width:${100 * learned / total}%"></i></div></div>
        <div class="stat"><span class="muted small">Билетов «знаю»</span><b>${tk}/39</b><div class="bar ok"><i style="width:${100 * tk / 39}%"></i></div></div>
        <div class="stat"><span class="muted small">Точность в тестах</span><b>${acc === null ? '—' : acc + '%'}</b></div>
        <div class="stat"><span class="muted small">Рекорд подбора</span><b>${S.match.best ? (S.match.best / 1000).toFixed(1) + ' с' : '—'}</b></div>
      </div>
    </div>
  </div>
  <div class="grid g3">${modes.map(([k, t, d]) => `<a class="card mode" href="#/${k}"><span class="ic">${icon[k]}</span><h3>${t}</h3><p>${d}</p></a>`).join('')}</div>
  <h2 class="section-title">Прогресс по блокам</h2>
  <div class="card">${D.blocks.map((b, i) => {
    const cc = D.cards.filter(c => blockOf(c.t) === i), l = cc.filter(c => isLearned(c.id)).length;
    const pct = Math.round(100 * l / cc.length);
    return `<div class="block-row"><div><b>${ROMAN[i]}.</b> ${esc(b.title.replace(/^[IVX]+\.\s*/, ''))}<div class="muted small">вопросы ${b.tickets[0]}–${b.tickets[b.tickets.length - 1]} · ${cc.length} карточек</div></div><div class="bar ok"><i style="width:${pct}%"></i></div><div class="small muted" style="text-align:right">${pct}%</div></div>`;
  }).join('')}</div>
  <h2 class="section-title">Самые трудные карточки</h2>
  ${(() => { const hard = D.cards.filter(c => cs(c.id).bad > 0).sort((a, b) => (cs(b.id).bad - cs(b.id).ok) - (cs(a.id).bad - cs(a.id).ok)).slice(0, 6);
    return hard.length ? `<div class="grid g2">${hard.map(c => `<div class="card"><div class="row"><span class="tag bad">ошибок: ${cs(c.id).bad}</span><span class="tag">вопрос ${c.t}</span></div><p style="margin:10px 0 4px;font-weight:600">${c.f}</p><p class="muted small" style="margin:0">${c.b}</p></div>`).join('')}</div>`
      : `<div class="card empty">Пока пусто — здесь появятся карточки, в которых вы ошибались.</div>`; })()}
  `, 'home');
}

/* ---------- FLASHCARDS ---------- */
let fcOpts = { reverse: false, starred: false };
function viewCards(q, fixed) {
  const onlyDue = q.has('due') || !!fixed;
  let deck = cardsInSel();
  if (fcOpts.starred) deck = deck.filter(c => S.star[c.id]);
  if (q.has('due')) deck = D.cards.filter(c => isDue(c.id));
  if (fixed) deck = fixed.slice();
  const heading = fixed ? 'Карточки · вопрос ' + fixed[0].t : 'Повторение';
  // order: due first, then new, then by box
  deck = shuffle(deck).sort((a, b) => (isDue(b.id) - isDue(a.id)) || (cs(a.id).box - cs(b.id).box));
  let i = 0, flipped = false, known = 0, unknown = 0;
  const render = () => {
    if (!deck.length) return setView(`<h1 class="page">Карточки</h1>${onlyDue ? '' : blockChips()}<div class="card empty" style="margin-top:16px">Нет карточек для этого фильтра. ${onlyDue ? '<a href="#/cards">Открыть все карточки</a>' : ''}</div>`, 'cards'), onlyDue || bindChips(() => viewCards(q));
    if (i >= deck.length) return finish();
    const c = deck[i], st = cs(c.id);
    const front = fcOpts.reverse ? c.b : c.f, back = fcOpts.reverse ? c.f : c.b;
    const boxTag = isNew(c.id) ? '<span class="tag pri">новая</span>' : `<span class="tag ${st.box >= 3 ? 'ok' : st.box ? 'warn' : 'bad'}">уровень ${st.box}/5</span>`;
    setView(`
      <div class="row"><h1 class="page" style="margin:0">${onlyDue ? heading : 'Карточки'}</h1><span class="spacer"></span>
        <button class="btn ghost sm" id="rev" aria-pressed="${fcOpts.reverse}">${icon.swap} ${fcOpts.reverse ? 'Ответ → вопрос' : 'Вопрос → ответ'}</button>
        <button class="chip" id="onlyStar" aria-pressed="${fcOpts.starred}">${icon.star.replace('<svg', '<svg width="16" height="16"')} Избранные</button></div>
      ${onlyDue ? `<p class="lead" style="margin-top:6px">${fixed ? 'Только карточки этого вопроса. <a href="#/cards">Все карточки</a>' : 'Карточки, срок повторения которых наступил.'}</p>` : `<div style="margin:14px 0">${blockChips()}</div>`}
      <div class="progress-line"><span>${i + 1} / ${deck.length}</span><div class="bar"><i style="width:${100 * i / deck.length}%"></i></div><span class="tag ok">${known}</span><span class="tag bad">${unknown}</span></div>
      <div class="fc-wrap"><button class="fc ${flipped ? 'flipped' : ''}" id="fc" aria-label="Карточка, нажмите чтобы перевернуть">
        <div class="fc-face"><div class="corner"><span>Вопрос ${c.t} · ${esc(BLOCK_SHORT[blockOf(c.t)])}</span>${boxTag}</div><div class="txt">${front}</div><div class="hint">нажмите или <kbd>Пробел</kbd>, чтобы перевернуть</div></div>
        <div class="fc-face fc-back"><div class="corner"><span>Ответ</span><a href="#/notes/${c.t}" onclick="event.stopPropagation()">к конспекту →</a></div><div class="txt">${back}</div></div>
      </button></div>
      <div class="row" style="justify-content:space-between;margin-bottom:12px">
        <button class="icon-btn" id="prev" aria-label="Предыдущая">${icon.left}</button>
        <button class="star" id="star" aria-pressed="${!!S.star[c.id]}" aria-label="В избранное">${icon.star}</button>
        <button class="icon-btn" id="next" aria-label="Следующая (без оценки)">${icon.right}</button>
      </div>
      <div class="grade" ${flipped ? '' : 'style="opacity:.5"'}>
        <button class="btn bad" data-g="0">Не знаю<small>снова через минуту</small></button>
        <button class="btn warn" data-g="1">Сомневаюсь<small>скоро повторим</small></button>
        <button class="btn ok" data-g="2">Знаю<small>${['', '10 мин', '1 день', '3 дня', '7 дней', '16 дней'][Math.min(5, st.box + 1)]}</small></button>
      </div>
      <div class="kbd-help"><span><kbd>Пробел</kbd> перевернуть</span><span><kbd>1</kbd><kbd>2</kbd><kbd>3</kbd> оценка</span><span><kbd>←</kbd><kbd>→</kbd> листать</span><span><kbd>S</kbd> избранное</span></div>
    `, 'cards');
    $('#fc').onclick = () => { flipped = !flipped; $('#fc').classList.toggle('flipped', flipped); $('.grade').style.opacity = flipped ? 1 : .5; };
    $('#prev').onclick = () => { if (i > 0) { i--; flipped = false; render(); } };
    $('#next').onclick = () => { i++; flipped = false; render(); };
    $('#star').onclick = () => { S.star[c.id] = !S.star[c.id]; if (!S.star[c.id]) delete S.star[c.id]; save(); $('#star').setAttribute('aria-pressed', !!S.star[c.id]); };
    $('#rev').onclick = () => { fcOpts.reverse = !fcOpts.reverse; flipped = false; render(); };
    $('#onlyStar').onclick = () => { fcOpts.starred = !fcOpts.starred; viewCards(q, fixed); };
    $$('[data-g]').forEach(b => b.onclick = () => grade(+b.dataset.g));
    if (!onlyDue) bindChips(() => viewCards(q));
    cleanup = onKeys(e => {
      if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); $('#fc').click(); }
      else if (e.key === 'ArrowRight') $('#next').click();
      else if (e.key === 'ArrowLeft') $('#prev').click();
      else if (['1', '2', '3'].includes(e.key)) grade(+e.key - 1);
      else if (e.key.toLowerCase() === 's' || e.key.toLowerCase() === 'ы') $('#star').click();
    });
  };
  const grade = g => {
    if (!flipped) { $('#fc').click(); return; }
    gradeCard(deck[i].id, g);
    if (g === 2) known++; else unknown++;
    if (g === 0) deck.splice(Math.min(deck.length, i + 4), 0, deck[i]); // вернётся через 3 карточки
    i++; flipped = false; render();
  };
  const finish = () => {
    setView(`<div class="card" style="text-align:center;padding:40px 20px">
      <h1 class="page">Колода пройдена</h1>
      <p class="lead" style="margin:8px auto 20px">Знаю: <b>${known}</b> · Повторить: <b>${unknown}</b>. Карточки с ошибками вернутся в следующей сессии раньше остальных.</p>
      <div class="row" style="justify-content:center"><button class="btn" id="again">Ещё раз</button><a class="btn ghost" href="#/learn">Заучивание</a><a class="btn ghost" href="#/test">Тест</a></div></div>`, 'cards');
    $('#again').onclick = () => viewCards(q, fixed);
  };
  render();
}

/* ---------- LEARN (раунды) ---------- */
function makeCardMCQ(c, reverse) {
  const pool = D.cards.filter(x => x.id !== c.id);
  const same = shuffle(pool.filter(x => blockOf(x.t) === blockOf(c.t)));
  const others = shuffle(pool);
  const pick = [];
  const field = reverse ? 'f' : 'b';
  for (const x of same.concat(others)) { if (pick.length === 3) break; if (!pick.some(p => strip(p[field]) === strip(x[field])) && strip(x[field]) !== strip(c[field])) pick.push(x); }
  const opts = shuffle([c, ...pick]);
  return { q: reverse ? c.b : c.f, o: opts.map(o => o[field]), a: opts.indexOf(c), card: c, reverse };
}
function viewLearn() {
  let pool = cardsInSel().sort((a, b) => (cs(a.id).box - cs(b.id).box) || (cs(b.id).bad - cs(a.id).bad));
  const ROUND = 8;
  let active = pool.slice(0, ROUND).map(c => ({ c, streak: 0 }));
  let rest = pool.slice(ROUND), done = 0, queue = [];
  const fill = () => { queue = shuffle(active.filter(x => x.streak < 2)); };
  fill();
  const step = () => {
    if (!queue.length) {
      active = active.filter(x => x.streak < 2);
      while (active.length < ROUND && rest.length) active.push({ c: rest.shift(), streak: 0 });
      if (!active.length) return setView(`<div class="card" style="text-align:center;padding:40px"><h1 class="page">Всё выучено!</h1><p class="lead" style="margin:8px auto 20px">Все карточки выбранных блоков пройдены дважды подряд без ошибок.</p><a class="btn" href="#/test">Проверить себя тестом</a></div>`, 'learn');
      fill();
    }
    const item = queue.shift();
    const m = makeCardMCQ(item.c, item.streak === 1 && Math.random() < .5);
    const totalN = pool.length;
    setView(`
      <div class="row"><h1 class="page" style="margin:0">Заучивание</h1></div>
      <div style="margin:14px 0">${blockChips()}</div>
      <div class="progress-line"><span>Освоено ${done} из ${totalN}</span><div class="bar ok"><i style="width:${100 * done / totalN}%"></i></div></div>
      <div class="card q-card" style="margin-top:14px">
        <div class="row"><span class="tag">Вопрос ${item.c.t}</span><span class="tag ${item.streak ? 'ok' : 'pri'}">${item.streak ? 'ещё раз для закрепления' : 'новая для раунда'}</span><span class="spacer"></span><span class="muted small">${m.reverse ? 'Выберите термин' : 'Выберите ответ'}</span></div>
        <div class="q-title">${m.q}</div>
        <div class="opts">${m.o.map((o, k) => `<button class="opt" data-k="${k}"><span class="k">${k + 1}</span><span>${o}</span></button>`).join('')}</div>
        <div id="fb"></div>
      </div>
      <div class="row" style="justify-content:center;margin-top:12px"><button class="btn ghost sm" id="dunno">Не знаю — показать</button></div>`, 'learn');
    bindChips(() => viewLearn());
    let answered = false;
    const answer = k => {
      if (answered) return; answered = true;
      const ok = k === m.a;
      $$('.opt').forEach((b, j) => { b.disabled = true; if (j === m.a) b.classList.add('right'); else if (j === k) b.classList.add('wrong'); });
      if (ok) { item.streak++; if (item.streak >= 2) { done++; gradeCard(item.c.id, 2); } }
      else { item.streak = 0; gradeCard(item.c.id, 0); queue.splice(Math.min(2, queue.length), 0, item); }
      $('#fb').innerHTML = `<div class="explain ${ok ? 'ok' : 'bad'} reveal"><b>${ok ? 'Верно!' : 'Правильный ответ:'}</b> ${ok ? '' : m.o[m.a]}<div class="row" style="margin-top:10px"><button class="btn sm" id="go">Дальше <kbd style="background:none;color:inherit;border-color:currentColor">Enter</kbd></button></div></div>`;
      $('#go').onclick = step; $('#go').focus();
    };
    $$('.opt').forEach(b => b.onclick = () => answer(+b.dataset.k));
    $('#dunno').onclick = () => answer(-1);
    cleanup = onKeys(e => { if (/^[1-4]$/.test(e.key)) answer(+e.key - 1); else if (e.key === 'Enter' && answered) step(); });
  };
  step();
}

/* ---------- TEST ---------- */
let testCfg = { n: 20, kinds: { quiz: true, fig: true, cards: true } };
function buildTest() {
  const items = [];
  if (testCfg.kinds.quiz) D.quiz.filter(q => blockSel.has(blockOf(q.t))).forEach(q => {
    const order = shuffle(q.o.map((_, i) => i));
    items.push({ kind: 'quiz', id: q.id, t: q.t, q: q.q, o: order.map(i => q.o[i]), a: order.indexOf(q.a), e: q.e });
  });
  if (testCfg.kinds.fig) D.figs.filter(f => blockSel.has(blockOf(f.t))).forEach((f, i) => {
    const wrong = shuffle(D.tickets.filter(t => t.n !== f.t && !D.figs.some(x => x.t === t.n && x.svg === f.svg))).slice(0, 3);
    const opts = shuffle([TK[f.t], ...wrong]);
    items.push({ kind: 'fig', id: 'f' + i, t: f.t, q: 'К какому вопросу относится эта схема?', svg: f.svg, o: opts.map(t => `${t.n}. ${esc(t.title)}`), a: opts.indexOf(TK[f.t]), e: f.cap });
  });
  if (testCfg.kinds.cards) shuffle(cardsInSel()).slice(0, 25).forEach(c => {
    const m = makeCardMCQ(c, false);
    items.push({ kind: 'card', id: c.id, t: c.t, q: m.q, o: m.o, a: m.a, e: '' });
  });
  return shuffle(items).slice(0, testCfg.n === 'all' ? items.length : testCfg.n);
}
function viewTestSetup() {
  setView(`
    <h1 class="page">Тест</h1>
    <p class="lead">Вопросы с выбором ответа и мгновенным объяснением. После теста — разбор ошибок и кнопка «повторить ошибки».</p>
    <div class="card grid" style="gap:20px">
      <div><div class="muted small" style="margin-bottom:8px;font-weight:600">Блоки</div>${blockChips()}</div>
      <div><div class="muted small" style="margin-bottom:8px;font-weight:600">Типы вопросов</div><div class="chips">
        <button class="chip" data-kind="quiz" aria-pressed="${testCfg.kinds.quiz}">Теория (${D.quiz.length})</button>
        <button class="chip" data-kind="fig" aria-pressed="${testCfg.kinds.fig}">По схемам (${D.figs.length})</button>
        <button class="chip" data-kind="cards" aria-pressed="${testCfg.kinds.cards}">По карточкам</button></div></div>
      <div><div class="muted small" style="margin-bottom:8px;font-weight:600">Количество</div><div class="chips">
        ${[10, 20, 40, 'all'].map(n => `<button class="chip" data-n="${n}" aria-pressed="${testCfg.n == n}">${n === 'all' ? 'Все' : n}</button>`).join('')}</div></div>
      <div class="row"><button class="btn" id="start">${icon.test} Начать тест</button>
      ${S.tests.length ? `<span class="muted small">Последний результат: ${S.tests[S.tests.length - 1].score}/${S.tests[S.tests.length - 1].total}</span>` : ''}</div>
    </div>`, 'test');
  bindChips(viewTestSetup);
  $$('[data-kind]').forEach(b => b.onclick = () => { const k = b.dataset.kind; testCfg.kinds[k] = !testCfg.kinds[k]; if (!Object.values(testCfg.kinds).some(Boolean)) testCfg.kinds[k] = true; viewTestSetup(); });
  $$('[data-n]').forEach(b => b.onclick = () => { testCfg.n = b.dataset.n === 'all' ? 'all' : +b.dataset.n; viewTestSetup(); });
  $('#start').onclick = () => runTest(buildTest());
}
function runTest(items) {
  if (!items.length) return toast('Нет вопросов для выбранных фильтров');
  let i = 0; const res = [];
  const t0 = Date.now();
  const step = () => {
    if (i >= items.length) return testResult(items, res, Date.now() - t0);
    const it = items[i];
    setView(`
      <div class="progress-line"><span>${i + 1} / ${items.length}</span><div class="bar"><i style="width:${100 * i / items.length}%"></i></div><span class="tag ok">${res.filter(Boolean).length}</span><span class="tag bad">${res.filter(r => r === false).length}</span><button class="btn ghost sm" id="quit">Завершить</button></div>
      <div class="card q-card" style="margin-top:14px">
        <div class="row"><span class="tag">Вопрос ${it.t}</span><span class="tag pri">${{ quiz: 'теория', fig: 'схема', card: 'карточка' }[it.kind]}</span></div>
        <div class="q-title">${it.q}</div>
        ${it.svg ? `<div class="fig-q" style="margin-bottom:16px">${it.svg}</div>` : ''}
        <div class="opts">${it.o.map((o, k) => `<button class="opt" data-k="${k}"><span class="k">${k + 1}</span><span>${o}</span></button>`).join('')}</div>
        <div id="fb"></div>
      </div>
      <div class="kbd-help"><span><kbd>1</kbd>–<kbd>4</kbd> выбор</span><span><kbd>Enter</kbd> дальше</span></div>`, 'test');
    let answered = false;
    const answer = k => {
      if (answered) return; answered = true;
      const ok = k === it.a; res[i] = ok; it.picked = k;
      $$('.opt').forEach((b, j) => { b.disabled = true; if (j === it.a) b.classList.add('right'); else if (j === k) b.classList.add('wrong'); });
      if (it.kind === 'quiz') { const q = S.quiz[it.id] || { ok: 0, bad: 0 }; ok ? q.ok++ : q.bad++; S.quiz[it.id] = q; }
      if (it.kind === 'card') gradeCard(it.id, ok ? 2 : 0);
      touchDay(); save();
      $('#fb').innerHTML = `<div class="explain ${ok ? 'ok' : 'bad'} reveal"><b>${ok ? 'Верно.' : 'Неверно.'}</b> ${it.e || (ok ? '' : 'Правильный ответ выделен зелёным.')}
        <div class="row" style="margin-top:10px"><button class="btn sm" id="go">${i + 1 < items.length ? 'Следующий' : 'Результат'}</button><a class="btn ghost sm" href="#/notes/${it.t}" target="_blank" rel="noopener">Открыть вопрос ${it.t} в конспекте</a></div></div>`;
      $('#go').onclick = () => { i++; step(); }; $('#go').focus();
    };
    $$('.opt').forEach(b => b.onclick = () => answer(+b.dataset.k));
    $('#quit').onclick = () => testResult(items.slice(0, i), res.slice(0, i), Date.now() - t0);
    cleanup = onKeys(e => { if (/^[1-4]$/.test(e.key)) answer(+e.key - 1); else if (e.key === 'Enter' && answered) { i++; step(); } });
  };
  step();
}
function testResult(items, res, ms) {
  const ok = res.filter(Boolean).length, n = items.length, pct = n ? Math.round(100 * ok / n) : 0;
  if (n) { S.tests.push({ date: today(), score: ok, total: n }); S.tests = S.tests.slice(-30); save(); }
  const wrong = items.filter((_, k) => res[k] === false);
  const byT = {}; wrong.forEach(w => byT[w.t] = (byT[w.t] || 0) + 1);
  const C = 2 * Math.PI * 62;
  const col = pct >= 85 ? 'var(--ok)' : pct >= 60 ? 'var(--warn)' : 'var(--bad)';
  setView(`
    <div class="card" style="text-align:center;padding:28px 20px">
      <svg class="result-ring" viewBox="0 0 150 150" aria-label="Результат ${pct}%"><circle cx="75" cy="75" r="62" stroke="var(--surface-2)"/><circle cx="75" cy="75" r="62" stroke="${col}" stroke-dasharray="${C * pct / 100} ${C}" transform="rotate(-90 75 75)" style="transition:stroke-dasharray 1s"/><text x="75" y="84" text-anchor="middle" font-size="30" font-weight="700" fill="currentColor" stroke="none">${pct}%</text></svg>
      <h1 class="page" style="margin-top:10px">${ok} из ${n}</h1>
      <p class="lead" style="margin:4px auto 18px">${pct >= 85 ? 'Отлично — материал уверенно держится.' : pct >= 60 ? 'Хорошо, но есть пробелы — разберите ошибки ниже.' : 'Стоит вернуться к конспекту по вопросам с ошибками.'} Время: ${Math.round(ms / 1000)} с.</p>
      <div class="row" style="justify-content:center">${wrong.length ? '<button class="btn" id="redo">Повторить ошибки</button>' : ''}<button class="btn ghost" id="newt">Новый тест</button></div>
    </div>
    ${Object.keys(byT).length ? `<h2 class="section-title">Что подтянуть</h2><div class="chips">${Object.entries(byT).sort((a, b) => b[1] - a[1]).map(([t, c]) => `<a class="chip" href="#/notes/${t}">Вопрос ${t} · ${c}</a>`).join('')}</div>` : ''}
    ${wrong.length ? `<h2 class="section-title">Разбор ошибок</h2><div class="grid">${wrong.map(w => `<div class="card"><div class="row"><span class="tag">Вопрос ${w.t}</span></div><p style="font-weight:600;margin:10px 0">${w.q}</p>${w.svg ? `<div class="fig-q" style="max-width:420px">${w.svg}</div>` : ''}<p style="margin:8px 0 0"><span class="tag bad">ваш ответ</span> ${w.picked >= 0 ? w.o[w.picked] : '—'}</p><p style="margin:6px 0 0"><span class="tag ok">верно</span> ${w.o[w.a]}</p>${w.e ? `<p class="muted small" style="margin:8px 0 0">${w.e}</p>` : ''}</div>`).join('')}</div>` : ''}`, 'test');
  $('#newt').onclick = viewTestSetup;
  if ($('#redo')) $('#redo').onclick = () => runTest(shuffle(wrong.map(w => Object.assign({}, w, { picked: undefined }))));
}

/* ---------- MATCH ---------- */
function viewMatch() {
  const eligible = cardsInSel().filter(c => strip(c.b).length <= 70 && strip(c.f).length <= 60);
  const pairs = shuffle(eligible).slice(0, 6);
  if (pairs.length < 3) return setView(`<h1 class="page">Подбор</h1>${blockChips()}<div class="card empty">Мало коротких карточек в выбранных блоках.</div>`, 'match'), bindChips(viewMatch);
  const tiles = shuffle(pairs.flatMap(c => [{ id: c.id, side: 'f', html: c.f }, { id: c.id, side: 'b', html: c.b }]));
  setView(`
    <div class="row"><h1 class="page" style="margin:0">Подбор</h1><span class="spacer"></span><span class="timer" id="tm" aria-live="off">0.0</span></div>
    <p class="lead" style="margin-top:6px">Нажмите на термин, потом на его определение. Ошибка — +1 секунда. Рекорд: <b>${S.match.best ? (S.match.best / 1000).toFixed(1) + ' с' : '—'}</b></p>
    <div style="margin:0 0 14px">${blockChips()}</div>
    <div class="match-grid">${tiles.map((t, k) => `<button class="tile ${t.side === 'f' ? 'term' : ''}" data-k="${k}">${t.html}</button>`).join('')}</div>`, 'match');
  bindChips(viewMatch);
  const t0 = performance.now(); let penalty = 0, sel = null, left = pairs.length;
  const iv = setInterval(() => { const el = $('#tm'); if (el) el.textContent = ((performance.now() - t0 + penalty) / 1000).toFixed(1); }, 100);
  cleanup = () => clearInterval(iv);
  $$('.tile').forEach(b => b.onclick = () => {
    const k = +b.dataset.k, t = tiles[k];
    if (sel === null) { sel = k; b.classList.add('sel'); return; }
    if (sel === k) { b.classList.remove('sel'); sel = null; return; }
    const s = tiles[sel], sb = $(`.tile[data-k="${sel}"]`);
    if (s.id === t.id && s.side !== t.side) {
      [b, sb].forEach(x => { x.classList.remove('sel'); x.classList.add('done'); x.disabled = true; });
      left--;
      if (!left) {
        clearInterval(iv); const ms = performance.now() - t0 + penalty;
        const rec = !S.match.best || ms < S.match.best; if (rec) S.match.best = Math.round(ms); touchDay(); save();
        setTimeout(() => { setView(`<div class="card" style="text-align:center;padding:40px 20px"><div class="timer" style="font-size:48px">${(ms / 1000).toFixed(1)} с</div><h1 class="page" style="margin-top:10px">${rec ? 'Новый рекорд!' : 'Готово'}</h1><p class="lead" style="margin:6px auto 20px">Рекорд: ${(S.match.best / 1000).toFixed(1)} с</p><button class="btn" id="again">Ещё раз</button></div>`, 'match'); $('#again').onclick = viewMatch; }, 350);
      }
    } else {
      penalty += 1000;
      [b, sb].forEach(x => { x.classList.remove('sel'); x.classList.add('bad'); setTimeout(() => x.classList.remove('bad'), 400); });
    }
    sel = null;
  });
}

/* ---------- TICKETS ---------- */
const TLABEL = ['не знаю', 'частично', 'знаю'];
function viewTickets() {
  const cnt = [0, 1, 2].map(g => D.tickets.filter(t => S.tickets[t.n] === g).length);
  setView(`
    <div class="row"><h1 class="page" style="margin:0">Билеты</h1><span class="spacer"></span><button class="btn" id="rnd">${icon.dice} Случайный билет</button></div>
    <p class="lead" style="margin-top:6px">Отмечайте, какие вопросы вы готовы рассказать. Режим «случайный билет» имитирует экзамен: таймер на подготовку, затем проверка по краткому ответу.</p>
    <div class="card" style="margin-bottom:16px"><div class="stack-bar" aria-label="Статус билетов"><i style="width:${cnt[2] / .39}%;background:var(--ok)"></i><i style="width:${cnt[1] / .39}%;background:var(--warn)"></i><i style="width:${cnt[0] / .39}%;background:var(--bad)"></i></div>
      <div class="row small muted" style="margin-top:10px;gap:18px"><span><span class="tag ok">знаю</span> ${cnt[2]}</span><span><span class="tag warn">частично</span> ${cnt[1]}</span><span><span class="tag bad">не знаю</span> ${cnt[0]}</span><span>не отмечено: ${39 - cnt[0] - cnt[1] - cnt[2]}</span></div>
      <div class="chips" style="margin-top:12px"><button class="chip" id="rndWeak">Случайный из «не знаю / частично / не отмечено»</button></div></div>
    ${D.blocks.map((b, bi) => `<h2 class="section-title">${esc(b.title)}</h2><div class="t-list">${b.tickets.map(n => { const g = S.tickets[n];
      return `<a class="t-item" href="#/ticket/${n}"><span class="t-num ${g !== undefined ? 'k' + g : ''}">${n}</span><span class="t-title">${esc(TK[n].title)}</span>${g !== undefined ? `<span class="tag ${['bad', 'warn', 'ok'][g]}">${TLABEL[g]}</span>` : ''}</a>`; }).join('')}</div>`).join('')}`, 'tickets');
  $('#rnd').onclick = () => exam(D.tickets[Math.random() * 39 | 0].n);
  $('#rndWeak').onclick = () => { const w = D.tickets.filter(t => S.tickets[t.n] !== 2); if (!w.length) return toast('Все билеты отмечены как «знаю»'); exam(w[Math.random() * w.length | 0].n); };
}
function exam(n) {
  const t = TK[n]; let sec = 180;
  setView(`
    <a href="#/tickets" class="muted small">← ко всем билетам</a>
    <div class="card" style="margin-top:10px;text-align:center;padding:28px 20px">
      <span class="tag pri">Билет · вопрос ${n}</span>
      <h1 class="page" style="margin:14px auto 6px;max-width:30ch">${esc(t.title)}</h1>
      <p class="lead" style="margin:0 auto 18px">Подготовьтесь: продумайте ответ, нарисуйте схему на листке. Потом проверьте себя.</p>
      <div class="exam-timer" id="et">3:00</div>
      <div class="row" style="justify-content:center;margin-top:18px"><button class="btn" id="show">Показать ответ</button><button class="btn ghost" id="other">${icon.dice} Другой</button></div>
    </div><div id="ans"></div>`, 'tickets');
  const iv = setInterval(() => { sec--; const el = $('#et'); if (!el) return; el.textContent = sec >= 0 ? `${sec / 60 | 0}:${String(sec % 60).padStart(2, '0')}` : 'время!'; if (sec < 0) { el.style.color = 'var(--bad)'; clearInterval(iv); } }, 1000);
  cleanup = () => clearInterval(iv);
  $('#other').onclick = () => exam(D.tickets[Math.random() * 39 | 0].n);
  $('#show').onclick = () => { clearInterval(iv); $('#show').disabled = true; $('#ans').innerHTML = ticketAnswer(n); bindGrade(n); };
}
function ticketAnswer(n) {
  const t = TK[n];
  return `<div class="reveal" style="margin-top:16px">
    <div class="box-short"><b>Коротко.</b> ${t.short}</div>
    <div class="box-key"><b>Запомни.</b> ${t.key}</div>
    <div class="card" style="margin-top:14px"><div class="muted small" style="font-weight:600;margin-bottom:10px">Как вы ответили бы?</div>
      <div class="grade"><button class="btn bad" data-tg="0">Не знаю</button><button class="btn warn" data-tg="1">Частично</button><button class="btn ok" data-tg="2">Знаю</button></div>
      <div class="row" style="margin-top:12px"><a class="btn ghost sm" href="#/notes/${n}">Полный конспект вопроса ${n} →</a><a class="btn ghost sm" href="#/cards?t=${n}">Карточки вопроса</a></div></div></div>`;
}
function bindGrade(n) {
  $$('[data-tg]').forEach(b => {
    b.setAttribute('aria-pressed', S.tickets[n] === +b.dataset.tg);
    b.onclick = () => { S.tickets[n] = +b.dataset.tg; touchDay(); save(); toast(`Билет ${n}: ${TLABEL[S.tickets[n]]}`); $$('[data-tg]').forEach(x => x.style.outline = x === b ? '3px solid var(--text)' : ''); };
    if (S.tickets[n] === +b.dataset.tg) b.style.outline = '3px solid var(--text)';
  });
}
function viewTicket(n) {
  const t = TK[n]; if (!t) return viewTickets();
  setView(`
    <a href="#/tickets" class="muted small">← ко всем билетам</a>
    <div class="row" style="margin-top:10px"><span class="tag pri">Вопрос ${n} · ${esc(D.blocks[t.block].title)}</span></div>
    <h1 class="page" style="margin:10px 0 0">${esc(t.title)}</h1>
    ${ticketAnswer(n)}
    <div class="row" style="justify-content:space-between;margin-top:16px">${n > 1 ? `<a class="btn ghost" href="#/ticket/${n - 1}">${icon.left} ${n - 1}</a>` : '<span></span>'}${n < 39 ? `<a class="btn ghost" href="#/ticket/${n + 1}">${n + 1} ${icon.right}</a>` : ''}</div>`, 'tickets');
  bindGrade(n);
  cleanup = onKeys(e => { if (e.key === 'ArrowRight' && n < 39) location.hash = '#/ticket/' + (n + 1); if (e.key === 'ArrowLeft' && n > 1) location.hash = '#/ticket/' + (n - 1); });
}

/* ---------- NOTES ---------- */
function viewNotes(sub) {
  const toc = `<nav class="toc card" aria-label="Оглавление" style="padding:10px"><div class="toc-list">
    <a href="#/notes/notation" class="${sub === 'notation' ? 'active' : ''}">Обозначения</a>
    ${D.blocks.map(b => `<div class="blk">${esc(b.title)}</div>${b.tickets.map(n => `<a href="#/notes/${n}" class="${String(n) === sub ? 'active' : ''}">${n}. ${esc(TK[n].title)}</a>`).join('')}`).join('')}
    <a href="#/notes/cheat" class="${sub === 'cheat' ? 'active' : ''}">Шпаргалка чисел</a></div>
    <label class="field" style="padding:10px"><span class="sr-only">Перейти к вопросу</span><select id="jump" aria-label="Перейти к вопросу"><option value="">Перейти к вопросу…</option><option value="notation">Обозначения</option>${D.tickets.map(t => `<option value="${t.n}" ${String(t.n) === sub ? 'selected' : ''}>${t.n}. ${esc(t.title)}</option>`).join('')}<option value="cheat">Шпаргалка</option></select></label></nav>`;
  let content;
  const n = +sub;
  if (sub === 'notation') content = `<h1 class="page">Обозначения</h1><div class="note-body">${D.extras.notation}</div>`;
  else if (sub === 'cheat') content = `<h1 class="page">Шпаргалка чисел и формул</h1><div class="note-body">${D.extras.cheat}</div>`;
  else if (TK[n]) content = `<span class="tag pri">Вопрос ${n}</span><h1 class="page" style="margin-top:10px">${esc(TK[n].title)}</h1>
    <div class="row" style="margin-bottom:6px"><a class="btn ghost sm" href="#/ticket/${n}">Проверить себя</a><a class="btn ghost sm" href="#/cards?t=${n}">Карточки (${D.cards.filter(c => c.t === n).length})</a></div>
    <div class="note-body">${TK[n].body}</div>
    <div class="row" style="justify-content:space-between;margin-top:20px">${n > 1 ? `<a class="btn ghost" href="#/notes/${n - 1}">${icon.left} Вопрос ${n - 1}</a>` : '<span></span>'}${n < 39 ? `<a class="btn ghost" href="#/notes/${n + 1}">Вопрос ${n + 1} ${icon.right}</a>` : ''}</div>`;
  else content = `<h1 class="page">Конспект</h1><p class="lead">Полный текст методички: у каждого вопроса — «Коротко», теория, схемы, формулы и «Запомни». Источник — Уралов С. С. «Курс геодезической астрономии».</p>
    <div class="grid g2">${D.blocks.map(b => `<div class="card"><h3 style="margin:0 0 8px">${esc(b.title)}</h3>${b.tickets.map(t => `<div><a href="#/notes/${t}">${t}. ${esc(TK[t].title)}</a></div>`).join('')}</div>`).join('')}</div>
    <div class="row" style="margin-top:16px"><a class="btn ghost" href="#/notes/notation">Обозначения</a><a class="btn ghost" href="#/notes/cheat">Шпаргалка чисел</a></div>`;
  setView(`<div class="notes-layout">${toc}<article>${content}</article></div>`, 'notes');
  $('#jump').onchange = e => { if (e.target.value) location.hash = '#/notes/' + e.target.value; };
  const act = $('.toc-list a.active'), lst = $('.toc-list'); if (act && lst.offsetParent) lst.scrollTop = act.offsetTop - lst.offsetTop - lst.clientHeight / 2;
  if (TK[n]) cleanup = onKeys(e => { if (e.key === 'ArrowRight' && n < 39) location.hash = '#/notes/' + (n + 1); if (e.key === 'ArrowLeft' && n > 1) location.hash = '#/notes/' + (n - 1); });
}

/* ---------- MORE / SETTINGS ---------- */
function viewMore() {
  setView(`<h1 class="page">Ещё</h1>
    <div class="grid g2" style="margin-top:14px">
      <a class="card mode" href="#/learn"><span class="ic">${icon.learn}</span><h3>Заучивание</h3><p>Раунды с выбором ответа</p></a>
      <a class="card mode" href="#/match"><span class="ic">${icon.match}</span><h3>Подбор</h3><p>Игра на время</p></a>
      <a class="card mode" href="#/notes"><span class="ic">${icon.notes}</span><h3>Конспект</h3><p>Теория и схемы</p></a>
      <a class="card mode" href="#/settings"><span class="ic">${icon.settings}</span><h3>Настройки</h3><p>Тема, перенос и сброс прогресса</p></a>
    </div>`, 'more');
}
function viewSettings() {
  const th = document.documentElement.dataset.theme || 'auto';
  setView(`<h1 class="page">Настройки</h1>
    <div class="card grid" style="gap:22px;margin-top:14px">
      <div><div class="muted small" style="font-weight:600;margin-bottom:8px">Тема</div><div class="chips">${[['auto', 'Как в системе'], ['light', 'Светлая'], ['dark', 'Тёмная']].map(([k, l]) => `<button class="chip" data-theme-set="${k}" aria-pressed="${th === k}">${l}</button>`).join('')}</div></div>
      <div><div class="muted small" style="font-weight:600;margin-bottom:8px">Перенос прогресса на другое устройство</div>
        <p class="small muted" style="margin:0 0 10px">Прогресс хранится только в этом браузере. Скачайте файл и загрузите его на другом устройстве.</p>
        <div class="row"><button class="btn ghost" id="exp">Скачать прогресс</button><label class="btn ghost" for="imp" tabindex="0">Загрузить прогресс</label><input type="file" id="imp" accept="application/json" hidden></div></div>
      <div><div class="muted small" style="font-weight:600;margin-bottom:8px">Сброс</div><button class="btn bad" id="reset">Сбросить весь прогресс</button></div>
      <div class="small muted">Горячие клавиши: <kbd>/</kbd> поиск · <kbd>Пробел</kbd> перевернуть карточку · <kbd>1</kbd>–<kbd>4</kbd> выбор ответа · <kbd>←</kbd><kbd>→</kbd> листать</div>
    </div>`, 'more');
  $$('[data-theme-set]').forEach(b => b.onclick = () => { setTheme(b.dataset.themeSet); viewSettings(); });
  $('#exp').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(S)], { type: 'application/json' })); a.download = `geoastro-progress-${today()}.json`; a.click(); };
  $('#imp').onchange = e => { const f = e.target.files[0]; if (!f) return; f.text().then(t => { try { S = Object.assign(blank(), JSON.parse(t)); save(); toast('Прогресс загружен'); } catch (er) { toast('Файл не распознан'); } }); };
  $('#reset').onclick = () => { if (confirm('Сбросить весь прогресс? Это нельзя отменить.')) { S = blank(); save(); toast('Прогресс сброшен'); } };
}
function setTheme(k) {
  if (k === 'auto') { delete document.documentElement.dataset.theme; try { localStorage.removeItem('ga.theme'); } catch (e) {} }
  else { document.documentElement.dataset.theme = k; try { localStorage.setItem('ga.theme', k); } catch (e) {} }
}
$('#themeBtn').onclick = () => {
  const dark = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  setTheme(dark ? 'light' : 'dark');
};

/* ---------- SEARCH ---------- */
const sm = $('#searchModal'), si = $('#searchInput'), sr = $('#searchResults');
const norm = s => strip(s).toLowerCase().replace(/ё/g, 'е');
const IDX = [
  ...D.tickets.map(t => ({ href: `#/notes/${t.n}`, title: `${t.n}. ${t.title}`, sub: strip(t.short), hay: norm(t.title + ' ' + t.short + ' ' + t.key + ' ' + t.body) })),
  ...D.cards.map(c => ({ href: `#/cards?t=${c.t}`, title: strip(c.f), sub: strip(c.b), hay: norm(c.f + ' ' + c.b) })),
];
function openSearch() { sm.hidden = false; si.value = ''; sr.innerHTML = '<div class="empty small">Начните вводить — поиск по билетам, конспекту и карточкам.</div>'; si.focus(); }
function closeSearch() { sm.hidden = true; }
$('#searchBtn').onclick = openSearch; $('#searchClose').onclick = closeSearch;
sm.onclick = e => { if (e.target === sm) closeSearch(); };
si.oninput = () => {
  const q = norm(si.value.trim()); if (q.length < 2) { sr.innerHTML = ''; return; }
  const words = q.split(/\s+/);
  const hits = IDX.filter(x => words.every(w => x.hay.includes(w))).slice(0, 30);
  const hl = s => { let h = esc(s.length > 160 ? s.slice(0, 160) + '…' : s); words.forEach(w => { h = h.replace(new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi'), '<mark>$1</mark>'); }); return h; };
  sr.innerHTML = hits.length ? hits.map(x => `<a href="${x.href}">${hl(x.title)}<span class="sub">${hl(x.sub)}</span></a>`).join('') : '<div class="empty small">Ничего не найдено</div>';
  $$('a', sr).forEach(a => a.onclick = closeSearch);
};
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !sm.hidden) closeSearch();
  else if (e.key === '/' && sm.hidden && !e.target.closest('input,textarea,select')) { e.preventDefault(); openSearch(); }
});

/* ---------- ROUTER ---------- */
function route() {
  const h = location.hash.replace(/^#\/?/, '');
  const [path, qs] = h.split('?');
  const q = new URLSearchParams(qs || '');
  const [a, b] = path.split('/');
  if (q.has('t')) { // карточки конкретного вопроса
    const n = +q.get('t');
    if (a === 'cards' && TK[n]) { cardsOfTicket(n); return; }
  }
  switch (a) {
    case 'cards': return viewCards(q);
    case 'learn': return viewLearn();
    case 'test': return viewTestSetup();
    case 'match': return viewMatch();
    case 'tickets': return viewTickets();
    case 'ticket': return viewTicket(+b);
    case 'notes': return viewNotes(b || '');
    case 'more': return viewMore();
    case 'settings': return viewSettings();
    default: return viewHome();
  }
}
function cardsOfTicket(n) { viewCards(new URLSearchParams(), D.cards.filter(c => c.t === n)); }
window.addEventListener('hashchange', route);
route();
})();
