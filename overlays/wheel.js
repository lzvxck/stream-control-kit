/* Wheel overlay — Spike Picante
 * Recibe: wheel.spin { options: [string], winners: [string] }
 * Dibuja la ruleta con todos los agentes y anima hasta el ganador.
 */

const COLORS = [
  '#111111','#000000','#111111','#000000',
  '#111111','#000000','#111111','#000000',
  '#111111','#000000','#111111','#000000',
];
const TEXT_COLOR = '#ffffff';

const canvas = document.getElementById('wheel-canvas');
const ctx    = canvas.getContext('2d');
const SIZE   = canvas.width;
const CX     = SIZE / 2;
const CY     = SIZE / 2;
const RADIUS = CX - 10;

let currentAngle = 0;
let animId       = null;

/* ── Dibujar ruleta ─────────────────────────────────────────────────── */
function drawWheel(agents, rotation) {
  ctx.clearRect(0, 0, SIZE, SIZE);

  const n     = agents.length;
  const slice = (2 * Math.PI) / n;

  agents.forEach((agent, i) => {
    const start = rotation + i * slice;
    const end   = start + slice;
    const color = COLORS[i % COLORS.length];

    // Sector
    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.arc(CX, CY, RADIUS, start, end);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Texto
    ctx.save();
    ctx.translate(CX, CY);
    ctx.rotate(start + slice / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = `bold ${Math.max(9, Math.floor(200 / n))}px "Segoe UI", Arial`;
    ctx.fillText(agent, RADIUS - 10, 5);
    ctx.restore();
  });

  // Círculo central
  ctx.beginPath();
  ctx.arc(CX, CY, 22, 0, 2 * Math.PI);
  ctx.fillStyle = '#000000';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Logo central
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px "Segoe UI"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🌶️', CX, CY);
}

/* ── Calcular ángulo objetivo para que el ganador quede bajo el puntero ─ */
function targetAngle(agents, winner) {
  const n     = agents.length;
  const slice = (2 * Math.PI) / n;
  let idx     = agents.indexOf(winner);
  if (idx < 0) idx = 0;
  const sectorCenter = idx * slice + slice / 2;
  return -Math.PI / 2 - sectorCenter;
}

/* ── Easing cubic-bezier(0.17, 0.67, 0.21, 1) aproximado ────────────── */
function easeOut(t) {
  return 1 - Math.pow(1 - t, 3);
}

/* ── Animación del spin ─────────────────────────────────────────────── */
function spinTo(agents, winner, durationMs) {
  if (animId) cancelAnimationFrame(animId);

  let start         = null;
  const fromAngle   = currentAngle % (2 * Math.PI);
  let toAngle       = targetAngle(agents, winner) + 2 * Math.PI * (4 + Math.floor(Math.random() * 3));
  while (toAngle <= fromAngle) toAngle += 2 * Math.PI;

  function step(ts) {
    if (!start) start = ts;
    const elapsed = ts - start;
    const t       = Math.min(elapsed / durationMs, 1);

    currentAngle = fromAngle + (toAngle - fromAngle) * easeOut(t);
    drawWheel(agents, currentAngle);

    if (t < 1) {
      animId = requestAnimationFrame(step);
    } else {
      currentAngle = toAngle;
      drawWheel(agents, currentAngle);
      showWinner(winner);
    }
  }

  animId = requestAnimationFrame(step);
}

/* ── Banner ganador ─────────────────────────────────────────────────── */
function showWinner(winner) {
  const banner = document.getElementById('winner-banner');
  document.getElementById('winner-name').textContent = winner;
  banner.classList.add('visible');
  setTimeout(() => { banner.classList.remove('visible'); }, 5000);
}

/* ── Inicialización con agentes por defecto ─────────────────────────── */
const defaultAgents = [
  'Jett','Phoenix','Raze','Reyna','Yoru','Neon','Iso','Waylay',
  'Sova','Breach','Skye','KAY/O','Fade','Gekko','Tejo',
  'Brimstone','Omen','Viper','Astra','Harbor','Clove',
  'Killjoy','Cypher','Sage','Chamber','Deadlock','Vyse',
];

drawWheel(defaultAgents, currentAngle);

/* ── Cliente SB ─────────────────────────────────────────────────────── */
const client = new StreamerbotClient({
  host:          '127.0.0.1',
  port:          8080,
  password:      null,
  autoSubscribe: { General: ['Custom'] },
});

client.on('General.Custom', msg => {
  const data = msg.data;
  if (!data || data.event !== 'wheel.spin') return;

  const payload  = data.payload || {};
  const agents   = payload.options && payload.options.length ? payload.options : defaultAgents;
  const winners  = payload.winners || [];
  const winner   = winners[0] || agents[0];
  const duration = 4000 + Math.random() * 2000;

  spinTo(agents, winner, duration);
});
