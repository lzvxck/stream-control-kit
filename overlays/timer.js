const CIRCUMFERENCE = 2 * Math.PI * 54; // 339.292

let totalSeconds    = 30;
let remainingSeconds = 30;
let timerInterval   = null;

function setTime(seconds) {
  totalSeconds     = seconds;
  remainingSeconds = seconds;
  updateDisplay();
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (remainingSeconds <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      remainingSeconds = 0;
      updateDisplay();
      return;
    }
    remainingSeconds--;
    updateDisplay();
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function resetTimer() {
  stopTimer();
  remainingSeconds = totalSeconds;
  updateDisplay();
}

function updateDisplay() {
  const arc   = document.getElementById('timer-arc');
  const count = document.getElementById('timer-count');
  const wrap  = document.getElementById('timer-wrap');

  count.textContent = remainingSeconds;

  const progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;
  arc.style.strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  wrap.className = '';
  if (remainingSeconds <= 0)       wrap.className = 'done';
  else if (remainingSeconds <= 10) wrap.className = 'urgent';
  else if (remainingSeconds <= 15) wrap.className = 'warning';
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
    case 'timer.set':
      if (data.payload && data.payload.seconds > 0) setTime(data.payload.seconds);
      break;
    case 'timer.start':
      startTimer();
      break;
    case 'timer.stop':
      stopTimer();
      break;
    case 'timer.reset':
      resetTimer();
      break;
  }
});
