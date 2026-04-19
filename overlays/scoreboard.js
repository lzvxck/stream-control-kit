/* Scoreboard — Spike Picante
 * Escucha: picantes.leaderboard_update → reordena con GSAP Flip
 *          picantes.quick_change       → muestra feedback flotante
 */

// GSAP se carga desde CDN (ver README para vendorizar en producción)
const GSAP_URL  = 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js';
const FLIP_URL  = 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/Flip.min.js';

// Tier según puntos
function getTier(pts) {
  if (pts >= 5000) return { label: 'Radiant',  cls: 'tier-radiant'  };
  if (pts >= 2500) return { label: 'Platinum', cls: 'tier-platinum' };
  if (pts >= 1000) return { label: 'Gold',     cls: 'tier-gold'     };
  if (pts >= 500)  return { label: 'Silver',   cls: 'tier-silver'   };
  if (pts >= 100)  return { label: 'Bronze',   cls: 'tier-bronze'   };
  return                   { label: 'Iron',    cls: 'tier-iron'     };
}

function loadScript(src) {
  return new Promise(function (resolve, reject) {
    var s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

var quickTimer = null;

function showQuickChange(payload) {
  var el = document.getElementById('quick-change');
  clearTimeout(quickTimer);

  var delta = payload.delta;
  var label = payload.label || (delta > 0 ? '+' + delta : String(delta));

  el.textContent = label;
  el.className = delta > 0 ? 'plus' : (delta < 0 ? 'minus' : 'reset');

  // Animar entrada con GSAP si está disponible
  if (window.gsap) {
    gsap.fromTo(el, { scale: 1.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.25, ease: 'back.out(2)' });
    quickTimer = setTimeout(function () {
      gsap.to(el, {
        opacity: 0, scale: 0.8, duration: 0.3, onComplete: function () {
          el.className = 'hidden';
        }
      });
    }, 1400);
  } else {
    el.classList.remove('hidden');
    quickTimer = setTimeout(function () { el.className = 'hidden'; }, 1600);
  }
}

function countUp(el, from, to, duration) {
  if (el._countIv) cancelAnimationFrame(el._countIv);
  var start = null;
  function step(ts) {
    if (!start) start = ts;
    var progress = Math.min((ts - start) / duration, 1);
    // ease out quad
    var eased = 1 - (1 - progress) * (1 - progress);
    var value = Math.round(from + (to - from) * eased);
    el.textContent = value.toLocaleString('es-ES');
    if (progress < 1) {
      el._countIv = requestAnimationFrame(step);
    } else {
      el.textContent = to.toLocaleString('es-ES');
      el._countIv = null;
    }
  }
  el._countIv = requestAnimationFrame(step);
}

function renderLeaderboard(players) {
  var list = document.getElementById('leaderboard');

  // Capturar estado antes de reordenar (GSAP Flip)
  var flipState = window.Flip ? Flip.getState(list.querySelectorAll('.sb-row')) : null;

  // Actualizar / crear filas
  players.forEach(function (p) {
    var id = 'sb-' + p.name.replace(/[^a-z0-9]/gi, '_');
    var li = document.getElementById(id);
    var isNew = !li;

    if (isNew) {
      li = document.createElement('li');
      li.id = id;
      li.className = 'sb-row';
    }

    var tier = getTier(p.points);
    li.setAttribute('data-pos', p.position);

    // Preserve existing pts element so we can read the current displayed value
    var existingPtsEl = li.querySelector('.sb-pts');
    var fromPts = existingPtsEl ? parseInt(existingPtsEl.textContent.replace(/\D/g, ''), 10) || 0 : 0;

    li.innerHTML =
      '<span class="sb-pos">#' + p.position + '</span>' +
      '<span class="sb-badge ' + tier.cls + '" title="' + tier.label + '"></span>' +
      '<span class="sb-name">' + escapeHtml(p.name) + '</span>' +
      '<span class="sb-pts">' + p.points.toLocaleString('es-ES') + '</span>';

    list.appendChild(li);

    // Animate counter only when value changed and row already existed
    if (!isNew && fromPts !== p.points) {
      var ptsEl = li.querySelector('.sb-pts');
      countUp(ptsEl, fromPts, p.points, 700);
    }
  });

  // Eliminar filas de jugadores que ya no están en el top
  var currentIds = players.map(function (p) {
    return 'sb-' + p.name.replace(/[^a-z0-9]/gi, '_');
  });
  var rows = list.querySelectorAll('.sb-row');
  rows.forEach(function (row) {
    if (!currentIds.includes(row.id)) row.remove();
  });

  // Animar reordenamiento
  if (flipState && window.Flip) {
    Flip.from(flipState, {
      duration: 0.6,
      ease: 'power2.inOut',
      absolute: true,
    });
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Inicializar luego de cargar GSAP
loadScript(GSAP_URL).then(function () {
  return loadScript(FLIP_URL);
}).then(function () {
  if (window.gsap && window.Flip) {
    gsap.registerPlugin(Flip);
  }
  initClient();
}).catch(function () {
  // Sin GSAP — funciona sin animación
  initClient();
});

/* ── Indicador de conexión (dot rojo solo cuando desconectado) ──────── */
var _wsDot = (function () {
  var d = document.createElement('div');
  d.style.cssText = 'position:fixed;bottom:8px;right:8px;width:6px;height:6px;border-radius:50%;background:#f55;opacity:0;transition:opacity 0.4s;z-index:9999;pointer-events:none;';
  document.body.appendChild(d);
  return { ok: function () { d.style.opacity = '0'; }, fail: function () { d.style.opacity = '0.75'; } };
})();

function initClient() {
  var client = new StreamerbotClient({
    host: '127.0.0.1',
    port: 8080,
    password: null,
    autoSubscribe: { General: ['Custom'] },
    onConnect: function () { _wsDot.ok(); },
    onDisconnect: function () { _wsDot.fail(); },
  });

  client.on('General.Custom', function (msg) {
    var data = msg.data;
    if (!data || !data.event) return;

    switch (data.event) {
      case 'picantes.leaderboard_update':
        if (data.payload && Array.isArray(data.payload.players)) {
          renderLeaderboard(data.payload.players);
        }
        break;
      case 'picantes.quick_change':
        if (data.payload) {
          showQuickChange(data.payload);
        }
        break;
    }
  });
}
