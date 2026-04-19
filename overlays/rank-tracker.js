/* Rank Tracker overlay — Spike Picante
 * El fetch lo hace el panel de control (corre en browser real).
 * Este overlay solo renderiza los datos que recibe via WS.
 *
 * Escucha: player.rank      → renderiza card con rank data
 *          player.rank_hide → oculta la card
 */

const TIER_ICONS = {
  Iron: '🔩', Bronze: '🥉', Silver: '🥈', Gold: '🥇',
  Platinum: '💎', Diamond: '💠', Ascendant: '🌿',
  Immortal: '🔥', Radiant: '✨',
};

function renderRank(p) {
  const card     = document.getElementById('rank-card');
  const tierBase = (p.tier || '').replace(/\s+\d+$/, '');

  card.setAttribute('data-tier', tierBase);
  document.getElementById('rank-icon').textContent   = TIER_ICONS[tierBase] || '🎮';
  document.getElementById('rank-name').textContent   = (p.tier || 'Unranked').toUpperCase();
  document.getElementById('rank-rr').textContent     = p.rr !== undefined ? `${p.rr} RR` : '';
  document.getElementById('rank-player').textContent = p.player || '';

  document.getElementById('stat-winrate').textContent =
    p.winRate !== undefined ? `${p.winRate}%` : '—';
  document.getElementById('stat-kda').textContent =
    p.kda !== undefined ? p.kda : '—';
  document.getElementById('stat-hs').textContent =
    p.hsPercent !== undefined ? `${p.hsPercent}%` : '—';

  const matchRow = document.getElementById('match-row');
  matchRow.innerHTML = '';
  (p.recentMatches || []).slice(0, 8).forEach(r => {
    const pip = document.createElement('div');
    pip.className = `match-pip ${r === 'W' ? 'win' : r === 'L' ? 'loss' : 'draw'}`;
    matchRow.appendChild(pip);
  });

  card.classList.remove('hidden');
}

function hideCard() {
  document.getElementById('rank-card').classList.add('hidden');
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

/* ── Cliente SB ─────────────────────────────────────────────────────── */
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
    case 'player.rank':
      if (data.payload) renderRank(data.payload);
      break;
    case 'player.rank_hide':
      hideCard();
      break;
  }
});
