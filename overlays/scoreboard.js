/* Scoreboard — Spike Picante
 * Escucha: picantes.leaderboard_update → reordena con GSAP Flip
 *          picantes.quick_change       → muestra feedback flotante
 */

const GSAP_URL = 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js';
const FLIP_URL = 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/Flip.min.js';

function getTier(pts) {
  if (pts >= 5000) return { label: 'Radiant',  cls: 'tier-radiant'  };
  if (pts >= 2500) return { label: 'Platinum', cls: 'tier-platinum' };
  if (pts >= 1000) return { label: 'Gold',     cls: 'tier-gold'     };
  if (pts >= 500)  return { label: 'Silver',   cls: 'tier-silver'   };
  if (pts >= 100)  return { label: 'Bronze',   cls: 'tier-bronze'   };
  return                   { label: 'Iron',    cls: 'tier-iron'     };
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s  = document.createElement('script');
    s.src    = src;
    s.onload  = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

let quickTimer = null;

function showQuickChange(payload) {
  const el = document.getElementById('quick-change');
  clearTimeout(quickTimer);

  const { delta, label } = payload;
  el.textContent = label || (delta > 0 ? `+${delta}` : String(delta));
  el.className   = delta > 0 ? 'plus' : (delta < 0 ? 'minus' : 'reset');

  if (window.gsap) {
    gsap.fromTo(el, { scale: 1.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.25, ease: 'back.out(2)' });
    quickTimer = setTimeout(() => {
      gsap.to(el, {
        opacity: 0, scale: 0.8, duration: 0.3,
        onComplete: () => { el.className = 'hidden'; },
      });
    }, 1400);
  } else {
    el.classList.remove('hidden');
    quickTimer = setTimeout(() => { el.className = 'hidden'; }, 1600);
  }
}

function countUp(el, from, to, duration) {
  if (el._countIv) cancelAnimationFrame(el._countIv);
  let start = null;
  function step(ts) {
    if (!start) start = ts;
    const progress = Math.min((ts - start) / duration, 1);
    const eased    = 1 - (1 - progress) * (1 - progress);
    el.textContent = Math.round(from + (to - from) * eased).toLocaleString('es-ES');
    if (progress < 1) {
      el._countIv = requestAnimationFrame(step);
    } else {
      el.textContent = to.toLocaleString('es-ES');
      el._countIv    = null;
    }
  }
  el._countIv = requestAnimationFrame(step);
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderLeaderboard(players) {
  const list = document.getElementById('leaderboard');

  const flipState = window.Flip ? Flip.getState(list.querySelectorAll('.sb-row')) : null;

  players.forEach(p => {
    const id    = `sb-${p.name.replace(/[^a-z0-9]/gi, '_')}`;
    let li      = document.getElementById(id);
    const isNew = !li;

    if (isNew) {
      li           = document.createElement('li');
      li.id        = id;
      li.className = 'sb-row';
    }

    const tier        = getTier(p.points);
    const existingPts = li.querySelector('.sb-pts');
    const fromPts     = existingPts ? parseInt(existingPts.textContent.replace(/\D/g, ''), 10) || 0 : 0;

    li.setAttribute('data-pos', p.position);
    li.innerHTML =
      `<span class="sb-pos">#${p.position}</span>` +
      `<span class="sb-badge ${tier.cls}" title="${tier.label}"></span>` +
      `<span class="sb-name">${escapeHtml(p.name)}</span>` +
      `<span class="sb-pts">${p.points.toLocaleString('es-ES')}</span>`;

    list.appendChild(li);

    if (!isNew && fromPts !== p.points) {
      countUp(li.querySelector('.sb-pts'), fromPts, p.points, 700);
    }
  });

  const currentIds = players.map(p => `sb-${p.name.replace(/[^a-z0-9]/gi, '_')}`);
  list.querySelectorAll('.sb-row').forEach(row => {
    if (!currentIds.includes(row.id)) row.remove();
  });

  if (flipState && window.Flip) {
    Flip.from(flipState, { duration: 0.6, ease: 'power2.inOut', absolute: true });
  }
}

/* ── Indicador de conexión ──────────────────────────────────────────── */
const _wsDot = (() => {
  const d = document.createElement('div');
  d.style.cssText = 'position:fixed;bottom:8px;right:8px;width:6px;height:6px;border-radius:50%;background:#f55;opacity:0;transition:opacity 0.4s;z-index:9999;pointer-events:none;';
  document.body.appendChild(d);
  return {
    ok:   () => { d.style.opacity = '0'; },
    fail: () => { d.style.opacity = '0.75'; },
  };
})();

function initClient() {
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
      case 'picantes.leaderboard_update':
        if (data.payload && Array.isArray(data.payload.players)) {
          renderLeaderboard(data.payload.players);
        }
        break;
      case 'picantes.quick_change':
        if (data.payload) showQuickChange(data.payload);
        break;
    }
  });
}

async function init() {
  try {
    await loadScript(GSAP_URL);
    await loadScript(FLIP_URL);
    if (window.gsap && window.Flip) gsap.registerPlugin(Flip);
  } catch (_) {
    // Sin GSAP — funciona sin animación
  }
  initClient();
}

init();
