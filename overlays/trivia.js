/* Trivia overlay — Spike Picante
 * Eventos escuchados:
 *   trivia.game_start           → mostrar stage, construir escalera
 *   trivia.show_question        → renderizar pregunta + opciones
 *   trivia.lock_answer          → resaltar opción bloqueada (naranja)
 *   trivia.reveal_answer        → verde/rojo + confetti si correcto
 *   trivia.lifeline.fifty_fifty → atenuar dos opciones
 *   trivia.lifeline.audience    → mostrar barras de distribución
 *   trivia.game_over            → reset visual
 */

const LADDER_LABELS = [
  '100', '200', '300', '500', '1.000',
  '2.000', '4.000', '8.000', '16.000', '32.000',
  '64.000', '125.000', '250.000', '500.000', '1.000.000',
];
const SAFETY_RUNGS = [5, 10];

const state = {
  qNum:        0,
  winnings:    0,
  prizeLadder: LADDER_LABELS,
};

/* ── Escalera ─────────────────────────────────────────────────────────── */
function buildLadder(ladder) {
  const el     = document.getElementById('ladder');
  el.innerHTML = '';
  const labels = ladder || LADDER_LABELS;
  labels.forEach((pts, i) => {
    const n   = i + 1;
    const div = document.createElement('div');
    div.className = `rung${SAFETY_RUNGS.includes(n) ? ' safety' : ''}`;
    div.id        = `rung-${n}`;
    div.innerHTML =
      `<span class="rung-n">Q${n}</span>` +
      `<span class="rung-pts">${typeof pts === 'number' ? pts.toLocaleString('es-ES') : pts} 🌶️</span>`;
    el.appendChild(div);
  });
}

function highlightRung(qNum) {
  document.querySelectorAll('.rung').forEach(r => r.classList.remove('current'));
  const el = document.getElementById(`rung-${qNum}`);
  if (el) el.classList.add('current');
}

function markPassedRung(qNum) {
  const el = document.getElementById(`rung-${qNum}`);
  if (el) { el.classList.remove('current'); el.classList.add('passed'); }
}

/* ── Opciones ─────────────────────────────────────────────────────────── */
function resetOptions() {
  document.querySelectorAll('.opt').forEach(btn => {
    btn.className = 'opt';
    btn.querySelector('.opt-text').textContent = '';
  });
  document.getElementById('audience-bars').classList.add('hidden');
  resetAudienceBars();
}

function renderQuestion(payload) {
  state.qNum = payload.qNum || state.qNum + 1;
  resetOptions();

  const qEl = document.getElementById('question-text');
  scrambleText(qEl, payload.question || '', 400);
  document.getElementById('difficulty-badge').textContent =
    `Pregunta ${state.qNum} · Dificultad ${payload.difficulty || '?'}`;

  ['A', 'B', 'C', 'D'].forEach(l => {
    const btn = document.querySelector(`.opt[data-letter="${l}"]`);
    if (btn && payload.options && payload.options[l] !== undefined) {
      scrambleText(btn.querySelector('.opt-text'), payload.options[l], 350);
    }
  });

  highlightRung(state.qNum);
}

function lockAnswer(letter) {
  document.querySelectorAll('.opt').forEach(btn => btn.classList.remove('locked'));
  const btn = document.querySelector(`.opt[data-letter="${letter}"]`);
  if (btn) btn.classList.add('locked');
}

function revealAnswer(payload) {
  const { correct, chosen, isCorrect } = payload;

  const correctBtn = document.querySelector(`.opt[data-letter="${correct}"]`);
  if (correctBtn) { correctBtn.classList.remove('locked', 'dimmed'); correctBtn.classList.add('correct'); }

  if (chosen && !isCorrect) {
    const wrongBtn = document.querySelector(`.opt[data-letter="${chosen}"]`);
    if (wrongBtn) { wrongBtn.classList.remove('locked'); wrongBtn.classList.add('wrong'); }
  }

  if (isCorrect) {
    markPassedRung(state.qNum);
    fireConfetti();
  }
}

/* ── Lifelines ────────────────────────────────────────────────────────── */
function fiftyFifty(remove) {
  (remove || []).forEach(l => {
    const btn = document.querySelector(`.opt[data-letter="${l}"]`);
    if (btn) btn.classList.add('dimmed');
  });
  markLifelineUsed('life-5050');
}

function showAudienceBars(distribution) {
  const total = Object.values(distribution).reduce((a, b) => a + b, 0) || 1;
  ['A', 'B', 'C', 'D'].forEach(l => {
    const row = document.querySelector(`.abar-row[data-letter="${l}"]`);
    if (!row) return;
    const pct = Math.round(((distribution[l] || 0) / total) * 100);
    row.querySelector('.abar-fill').style.width   = `${pct}%`;
    row.querySelector('.abar-pct').textContent    = `${pct}%`;
  });
  document.getElementById('audience-bars').classList.remove('hidden');
  markLifelineUsed('life-audience');
}

function resetAudienceBars() {
  ['A', 'B', 'C', 'D'].forEach(l => {
    const row = document.querySelector(`.abar-row[data-letter="${l}"]`);
    if (!row) return;
    row.querySelector('.abar-fill').style.width = '0%';
    row.querySelector('.abar-pct').textContent  = '0%';
  });
}

function markLifelineUsed(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('used');
}

/* ── Confetti ─────────────────────────────────────────────────────────── */
function fireConfetti() {
  if (typeof confetti === 'undefined') return;
  confetti({ particleCount: 180, spread: 90, origin: { y: 0.55 }, colors: ['#FF4655','#00E5FF','#FFCF40','#ECE8E1'] });
}

function fireHeavyConfetti() {
  if (typeof confetti === 'undefined') return;
  let count = 0;
  const interval = setInterval(() => {
    confetti({ particleCount: 80, spread: 120, origin: { y: 0.5, x: Math.random() }, colors: ['#FF4655','#00E5FF','#FFCF40'] });
    if (++count >= 5) clearInterval(interval);
  }, 250);
}

/* ── Game start / over ────────────────────────────────────────────────── */
function gameStart(payload) {
  const stage = document.getElementById('stage');
  stage.classList.remove('hidden');

  document.getElementById('player-name').textContent    = (payload.playerName || 'Jugador').toUpperCase();
  document.getElementById('winnings-display').textContent = '0 🌶️';
  state.qNum     = 0;
  state.winnings = 0;

  buildLadder(payload.prizeLadder);

  document.querySelectorAll('.lifeline').forEach(l => l.classList.remove('used'));
  resetOptions();
  document.getElementById('question-text').textContent  = '';
  document.getElementById('difficulty-badge').textContent = '';
}

function gameOver(payload) {
  if (payload && payload.winnings > 0) {
    document.getElementById('winnings-display').textContent = `${payload.winnings.toLocaleString('es-ES')} 🌶️`;
    if (payload.winnings >= 1000000) fireHeavyConfetti();
  }
  setTimeout(() => {
    document.getElementById('stage').classList.add('hidden');
  }, 8000);
}

/* ── Text scramble ────────────────────────────────────────────────────── */
const SCRAMBLE_CHARS = 'abcdefghijklmnopqrstuvwxyz';

function scrambleText(el, finalText, duration) {
  if (el._scrambleIv) clearInterval(el._scrambleIv);

  const len        = finalText.length;
  const start      = Date.now();
  const revealPerMs = len / duration;

  el._scrambleIv = setInterval(() => {
    const elapsed  = Date.now() - start;
    const resolved = Math.min(Math.floor(elapsed * revealPerMs), len);

    let out = finalText.slice(0, resolved);
    for (let i = resolved; i < len; i++) {
      const ch = finalText[i];
      out += (ch === ' ' || ch === '¿' || ch === '?' || ch === ',' || ch === '.')
        ? ch
        : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
    }
    el.textContent = out;

    if (resolved >= len) {
      clearInterval(el._scrambleIv);
      el._scrambleIv = null;
      el.textContent = finalText;
    }
  }, 30);
}

/* ── Indicador de conexión ─────────────────────────────────────────── */
const _wsDot = (() => {
  const d = document.createElement('div');
  d.style.cssText = 'position:fixed;bottom:8px;right:8px;width:6px;height:6px;border-radius:50%;background:#f55;opacity:0;transition:opacity 0.4s;z-index:9999;pointer-events:none;';
  document.body.appendChild(d);
  return {
    ok:   () => { d.style.opacity = '0'; },
    fail: () => { d.style.opacity = '0.75'; },
  };
})();

/* ── Cliente SB ───────────────────────────────────────────────────────── */
const client = new StreamerbotClient({
  host:          '127.0.0.1',
  port:          8080,
  password:      null,
  autoSubscribe: { General: ['Custom'] },
  onConnect:    () => { _wsDot.ok(); },
  onDisconnect: () => { _wsDot.fail(); },
});

client.on('General.Custom', msg => {
  const data = msg.data;
  if (!data || !data.event) return;

  switch (data.event) {
    case 'trivia.game_start':
      gameStart(data.payload || {});
      break;
    case 'trivia.show_question':
      renderQuestion(data.payload || {});
      break;
    case 'trivia.lock_answer':
      if (data.payload && data.payload.letter) lockAnswer(data.payload.letter);
      break;
    case 'trivia.reveal_answer':
      revealAnswer(data.payload || {});
      if (data.payload && data.payload.isCorrect && data.payload.winnings !== undefined) {
        state.winnings = data.payload.winnings;
        document.getElementById('winnings-display').textContent =
          `${data.payload.winnings.toLocaleString('es-ES')} 🌶️`;
      }
      break;
    case 'trivia.lifeline.fifty_fifty':
      if (data.payload && data.payload.remove) fiftyFifty(data.payload.remove);
      break;
    case 'trivia.lifeline.audience':
      if (data.payload && data.payload.distribution) showAudienceBars(data.payload.distribution);
      break;
    case 'trivia.lifeline.phone':
      markLifelineUsed('life-phone');
      break;
    case 'trivia.game_over':
      gameOver(data.payload || {});
      break;
  }
});
