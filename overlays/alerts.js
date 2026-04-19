/* Alerts overlay — Spike Picante
 * Cola serializada de alertas. Las alertas NO se solapan: cada una espera
 * a que la anterior termine antes de mostrarse.
 *
 * Tiers:
 *   subtle   → follow, cheer <100          → toast 2s
 *   medium   → sub T1, cheer 100-499       → card 5s
 *   big      → sub T2/T3, cheer 500-999    → card 8s + confetti
 *   takeover → gift bomb, cheer 1000+, raid→ fullscreen 10s + confetti heavy
 */

var queue   = [];
var playing = false;

/* ── Configuración por tipo de evento ──────────────────────────────── */
var CONFIG = {
  'alert.follow': {
    tier: 'subtle',
    icon: '❤️',
    buildMsg: function (p) { return { user: p.user, meta: '¡Nuevo follow!', msg: '' }; },
  },
  'alert.cheer': {
    tier: function (p) {
      var b = p.bits || 0;
      return b >= 1000 ? 'takeover' : b >= 500 ? 'big' : b >= 100 ? 'medium' : 'subtle';
    },
    icon: function (p) {
      var b = p.bits || 0;
      return b >= 1000 ? '💎' : b >= 500 ? '⭐' : b >= 100 ? '✨' : '🌟';
    },
    buildMsg: function (p) {
      return { user: p.user, meta: p.bits + ' bits', msg: p.message || '' };
    },
  },
  'alert.sub': {
    tier: function (p) {
      return p.tier === 'T3' ? 'takeover' : p.tier === 'T2' ? 'big' : 'medium';
    },
    icon: function (p) {
      return p.tier === 'T3' ? '👑' : p.tier === 'T2' ? '🎖️' : '🎉';
    },
    buildMsg: function (p) {
      var label = p.months > 1 ? p.months + ' meses — ' + (p.tier || 'T1') : p.tier || 'T1';
      return { user: p.user, meta: 'Sub ' + label, msg: p.message || '' };
    },
  },
  'alert.gift_bomb': {
    tier: 'takeover',
    icon: '💣',
    buildMsg: function (p) {
      return { user: p.user, meta: p.count + ' subs gifteados (' + (p.tier || 'T1') + ')', msg: '' };
    },
  },
  'alert.raid': {
    tier: function (p) {
      var v = p.viewers || 0;
      return v >= 50 ? 'takeover' : v >= 10 ? 'big' : 'medium';
    },
    icon: '🚀',
    buildMsg: function (p) {
      return { user: p.user, meta: 'Raid con ' + (p.viewers || 0) + ' viewers', msg: '' };
    },
  },
};

/* ── Duración según tier ────────────────────────────────────────────── */
var DURATION = { subtle: 2000, medium: 5000, big: 8000, takeover: 10000 };

/* ── Cola ───────────────────────────────────────────────────────────── */
function enqueue(event, payload) {
  queue.push({ event: event, payload: payload });
  if (!playing) processNext();
}

function processNext() {
  if (!queue.length) { playing = false; return; }
  playing = true;
  var item = queue.shift();
  showAlert(item.event, item.payload);
}

/* ── Mostrar alerta ─────────────────────────────────────────────────── */
function showAlert(event, payload) {
  var conf = CONFIG[event];
  if (!conf) { processNext(); return; }

  var tier    = typeof conf.tier === 'function' ? conf.tier(payload) : conf.tier;
  var icon    = typeof conf.icon === 'function' ? conf.icon(payload) : conf.icon;
  var content = conf.buildMsg(payload);

  var card = document.createElement('div');
  card.className = 'alert-card tier-' + tier;

  card.innerHTML =
    '<div class="alert-icon">' + icon + '</div>' +
    '<div class="alert-body">' +
      '<div class="alert-user">' + escapeHtml(content.user || '') + '</div>' +
      (content.meta ? '<div class="alert-meta">' + escapeHtml(content.meta) + '</div>' : '') +
      (content.msg  ? '<div class="alert-msg">'  + escapeHtml(content.msg)  + '</div>' : '') +
    '</div>';

  var container = document.getElementById('alerts-container');

  if (tier === 'takeover') {
    document.body.appendChild(card);
  } else {
    container.appendChild(card);
  }

  var duration = DURATION[tier] || 3000;

  if (window.gsap) {
    var fromY = tier === 'takeover' ? 0 : -60;
    gsap.fromTo(card,
      { y: fromY, opacity: 0, scale: tier === 'takeover' ? 1.04 : 1 },
      { y: 0, opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(1.6)',
        onComplete: function () {
          fireConfettiForTier(tier);
          setTimeout(function () { dismissCard(card, tier, processNext); }, duration);
        }
      }
    );
  } else {
    fireConfettiForTier(tier);
    setTimeout(function () { dismissCard(card, tier, processNext); }, duration);
  }
}

function dismissCard(card, tier, cb) {
  if (window.gsap) {
    gsap.to(card, {
      y: tier === 'takeover' ? 0 : -40,
      opacity: 0,
      scale: tier === 'takeover' ? 1.03 : 0.96,
      duration: 0.35,
      onComplete: function () { card.remove(); cb(); }
    });
  } else {
    card.remove();
    cb();
  }
}

/* ── Confetti ───────────────────────────────────────────────────────── */
function fireConfettiForTier(tier) {
  if (typeof confetti === 'undefined') return;
  if (tier === 'takeover') {
    var count = 0;
    var iv = setInterval(function () {
      confetti({ particleCount: 90, spread: 130, origin: { y: 0.5, x: Math.random() },
        colors: ['#FF4655','#00E5FF','#FFCF40','#ECE8E1'] });
      if (++count >= 6) clearInterval(iv);
    }, 300);
  } else if (tier === 'big') {
    confetti({ particleCount: 150, spread: 100, origin: { y: 0.4 },
      colors: ['#FFCF40','#FF4655','#00E5FF'] });
  }
}

function escapeHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ── Indicador de conexión ─────────────────────────────────────────── */
var _wsDot = (function () {
  var d = document.createElement('div');
  d.style.cssText = 'position:fixed;bottom:8px;right:8px;width:6px;height:6px;border-radius:50%;background:#f55;opacity:0;transition:opacity 0.4s;z-index:9999;pointer-events:none;';
  document.body.appendChild(d);
  return { ok: function () { d.style.opacity = '0'; }, fail: function () { d.style.opacity = '0.75'; } };
})();

/* ── Cliente SB ─────────────────────────────────────────────────────── */
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

  var alertEvents = ['alert.follow','alert.cheer','alert.sub','alert.gift_bomb','alert.raid'];
  if (alertEvents.indexOf(data.event) !== -1) {
    enqueue(data.event, data.payload || {});
  }
});
