/* Wheel overlay — Spike Picante
 * Recibe: wheel.spin { options: [string], winners: [string] }
 * Dibuja la ruleta con todos los agentes y anima hasta el ganador.
 */

var COLORS = [
  '#111111','#000000','#111111','#000000',
  '#111111','#000000','#111111','#000000',
  '#111111','#000000','#111111','#000000',
];
var TEXT_COLOR = '#ffffff';

var canvas   = document.getElementById('wheel-canvas');
var ctx      = canvas.getContext('2d');
var SIZE     = canvas.width;
var CX       = SIZE / 2;
var CY       = SIZE / 2;
var RADIUS   = CX - 10;

var currentAngle = 0;  // ángulo actual de la ruleta en radianes
var animId = null;

/* ── Dibujar ruleta ─────────────────────────────────────────────────── */
function drawWheel(agents, rotation) {
  ctx.clearRect(0, 0, SIZE, SIZE);

  var n     = agents.length;
  var slice = (2 * Math.PI) / n;

  agents.forEach(function (agent, i) {
    var start = rotation + i * slice;
    var end   = start + slice;
    var color = COLORS[i % COLORS.length];

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
    ctx.font = 'bold ' + Math.max(9, Math.floor(200 / n)) + 'px "Segoe UI", Arial';
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
  var n     = agents.length;
  var slice = (2 * Math.PI) / n;
  var idx   = agents.indexOf(winner);
  if (idx < 0) idx = 0;
  // El puntero apunta a la parte superior (−π/2). Queremos que el centro del sector idx esté ahí.
  var sectorCenter = idx * slice + slice / 2;
  // Ángulo de rotación necesario: queremos sectorCenter + rotation = -π/2 (mod 2π)
  return -Math.PI / 2 - sectorCenter;
}

/* ── Easing cubic-bezier(0.17, 0.67, 0.21, 1) aproximado ────────────── */
function easeOut(t) {
  // Aproximación de cubic-bezier(0.17, 0.67, 0.21, 1.0)
  return 1 - Math.pow(1 - t, 3);
}

/* ── Animación del spin ─────────────────────────────────────────────── */
function spinTo(agents, winner, durationMs) {
  if (animId) cancelAnimationFrame(animId);

  var start      = null;
  var fromAngle  = currentAngle % (2 * Math.PI);
  // Dar al menos 4 vueltas completas antes de llegar al ganador
  var toAngle    = targetAngle(agents, winner) + 2 * Math.PI * (4 + Math.floor(Math.random() * 3));
  // Asegurar que giramos en positivo
  while (toAngle <= fromAngle) toAngle += 2 * Math.PI;

  function step(ts) {
    if (!start) start = ts;
    var elapsed = ts - start;
    var t = Math.min(elapsed / durationMs, 1);
    var easedT = easeOut(t);

    currentAngle = fromAngle + (toAngle - fromAngle) * easedT;
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
  var banner = document.getElementById('winner-banner');
  document.getElementById('winner-name').textContent = winner;
  banner.classList.add('visible');
  setTimeout(function () { banner.classList.remove('visible'); }, 5000);
}

/* ── Inicialización con agentes por defecto ─────────────────────────── */
var defaultAgents = [
  'Jett','Phoenix','Raze','Reyna','Yoru','Neon','Iso','Waylay',
  'Sova','Breach','Skye','KAY/O','Fade','Gekko','Tejo',
  'Brimstone','Omen','Viper','Astra','Harbor','Clove',
  'Killjoy','Cypher','Sage','Chamber','Deadlock','Vyse'
];

drawWheel(defaultAgents, currentAngle);

/* ── Cliente SB ─────────────────────────────────────────────────────── */
var client = new StreamerbotClient({
  host: '127.0.0.1',
  port: 8080,
  password: null,
  autoSubscribe: { General: ['Custom'] },
});

client.on('General.Custom', function (msg) {
  var data = msg.data;
  if (!data || data.event !== 'wheel.spin') return;

  var payload = data.payload || {};
  var agents  = payload.options && payload.options.length ? payload.options : defaultAgents;
  var winners = payload.winners || [];
  var winner  = winners[0] || agents[0];

  var duration = 4000 + Math.random() * 2000; // 4-6 segundos
  spinTo(agents, winner, duration);
});
