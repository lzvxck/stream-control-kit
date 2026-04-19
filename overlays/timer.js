var CIRCUMFERENCE = 2 * Math.PI * 54; // 339.292

var totalSeconds = 30;
var remainingSeconds = 30;
var timerInterval = null;

function setTime(seconds) {
  totalSeconds = seconds;
  remainingSeconds = seconds;
  updateDisplay();
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(function () {
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
  var arc   = document.getElementById('timer-arc');
  var count = document.getElementById('timer-count');
  var wrap  = document.getElementById('timer-wrap');

  count.textContent = remainingSeconds;

  var progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;
  arc.style.strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  wrap.className = '';
  if (remainingSeconds <= 0)       wrap.className = 'done';
  else if (remainingSeconds <= 10) wrap.className = 'urgent';
  else if (remainingSeconds <= 15) wrap.className = 'warning';
}

/* ── Indicador de conexión ─────────────────────────────────────────── */
var _wsDot = (function () {
  var d = document.createElement('div');
  d.style.cssText = 'position:fixed;bottom:8px;right:8px;width:6px;height:6px;border-radius:50%;background:#f55;opacity:0;transition:opacity 0.4s;z-index:9999;pointer-events:none;';
  document.body.appendChild(d);
  return { ok: function () { d.style.opacity = '0'; }, fail: function () { d.style.opacity = '0.75'; } };
})();

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
