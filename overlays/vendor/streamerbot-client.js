/**
 * StreamerbotClient — cliente WebSocket mínimo compatible con Streamer.bot 1.0.x
 *
 * Protocolo implementado:
 *   1. Servidor envía Hello con salt+challenge
 *   2. Cliente responde Authenticate con SHA-256 si hay password
 *   3. Cliente envía Subscribe para los eventos deseados
 *   4. Eventos llegan como { event: { source, type }, data: <string|object> }
 *   5. DoAction envía { request: "DoAction", action: { name }, args }
 *
 * API pública:
 *   new StreamerbotClient({ host, port, password, autoSubscribe, onConnect, onDisconnect })
 *   client.on(eventKey, handler)   — eventKey: "General.Custom", "Twitch.ChatMessage", etc.
 *   client.off(eventKey, handler)
 *   client.doAction(action, args)  — action: { name } o { id }
 *   client.connect()
 *   client.disconnect()
 */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.StreamerbotClient = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  const DEFAULT_OPTS = {
    host: '127.0.0.1',
    port: 8080,
    password: null,
    autoSubscribe: {
      General: ['Custom'],
      Twitch: ['ChatMessage', 'Cheer', 'Sub', 'ReSub', 'GiftSub', 'GiftBomb', 'Raid', 'Follow', 'PollCompleted'],
    },
    reconnect: true,
    reconnectDelay: 2000,
    reconnectMaxDelay: 30000,
    onConnect: null,
    onDisconnect: null,
  };

  function StreamerbotClient(opts) {
    this._opts = Object.assign({}, DEFAULT_OPTS, opts || {});
    this._ws = null;
    this._listeners = {};
    this._requestId = 0;
    this._reconnectDelay = this._opts.reconnectDelay;
    this._reconnectTimer = null;
    this._intentionalClose = false;
    this.connect();
  }

  StreamerbotClient.prototype.on = function (event, fn) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(fn);
    return this;
  };

  StreamerbotClient.prototype.off = function (event, fn) {
    if (!this._listeners[event]) return this;
    this._listeners[event] = this._listeners[event].filter(function (h) { return h !== fn; });
    return this;
  };

  StreamerbotClient.prototype._emit = function (event, payload) {
    var handlers = this._listeners[event];
    if (!handlers || !handlers.length) return;
    for (var i = 0; i < handlers.length; i++) {
      try { handlers[i](payload); } catch (e) { console.error('[SB] handler error on ' + event, e); }
    }
  };

  StreamerbotClient.prototype._nextId = function () {
    return String(++this._requestId);
  };

  StreamerbotClient.prototype._send = function (obj) {
    if (this._ws && this._ws.readyState === 1 /* OPEN */) {
      this._ws.send(JSON.stringify(obj));
    }
  };

  StreamerbotClient.prototype.connect = function () {
    var self = this;
    var url = 'ws://' + self._opts.host + ':' + self._opts.port + '/';
    self._intentionalClose = false;

    try {
      self._ws = new WebSocket(url);
    } catch (e) {
      console.error('[SB] WebSocket creation failed:', e);
      self._scheduleReconnect();
      return;
    }

    self._ws.onopen = function () {
      console.log('[SB] Conexión abierta');
      self._reconnectDelay = self._opts.reconnectDelay;
    };

    self._ws.onmessage = function (evt) {
      var msg;
      try { msg = JSON.parse(evt.data); } catch (e) { return; }
      self._handleMessage(msg);
    };

    self._ws.onerror = function (e) {
      console.warn('[SB] WebSocket error', e);
    };

    self._ws.onclose = function () {
      console.warn('[SB] Conexión cerrada');
      if (self._opts.onDisconnect) self._opts.onDisconnect();
      self._emit('disconnect', {});
      if (!self._intentionalClose && self._opts.reconnect) {
        self._scheduleReconnect();
      }
    };
  };

  StreamerbotClient.prototype._scheduleReconnect = function () {
    var self = this;
    clearTimeout(self._reconnectTimer);
    var delay = self._reconnectDelay;
    console.log('[SB] Reconectando en ' + delay + 'ms...');
    self._reconnectTimer = setTimeout(function () {
      self._reconnectDelay = Math.min(self._reconnectDelay * 2, self._opts.reconnectMaxDelay);
      self.connect();
    }, delay);
  };

  StreamerbotClient.prototype.disconnect = function () {
    this._intentionalClose = true;
    clearTimeout(this._reconnectTimer);
    if (this._ws) this._ws.close();
  };

  StreamerbotClient.prototype._handleMessage = function (msg) {
    var self = this;

    // Handshake inicial: servidor envía Hello
    if (msg.request === 'Hello' || (msg.info && msg.authentication)) {
      if (self._opts.password && msg.authentication && msg.authentication.salt) {
        self._authenticate(msg.authentication.salt, msg.authentication.challenge);
      } else {
        self._subscribe();
      }
      return;
    }

    // Respuesta a Authenticate
    if (msg.status === 'ok' && msg.id === 'auth') {
      self._subscribe();
      return;
    }

    // Respuesta de Subscribe exitosa — consideramos conectado
    if (msg.status === 'ok' && msg.id === 'subscribe') {
      if (self._opts.onConnect) self._opts.onConnect();
      self._emit('connect', {});
      return;
    }

    // Evento entrante
    if (msg.event && msg.event.source && msg.event.type) {
      var key = msg.event.source + '.' + msg.event.type;
      var rawData = msg.data;
      var parsed = rawData;

      // WebsocketBroadcastJson envía data como string JSON — parsear automáticamente
      if (typeof rawData === 'string' && rawData.length > 0) {
        try { parsed = JSON.parse(rawData); } catch (e) { parsed = rawData; }
      }

      self._emit(key, { data: parsed, event: msg.event });
      self._emit('*', { event: key, data: parsed });
      return;
    }
  };

  StreamerbotClient.prototype._authenticate = function (salt, challenge) {
    var self = this;

    // auth = Base64( SHA256( Base64(SHA256(password + salt)) + challenge ) )
    var enc = new TextEncoder();

    function sha256(buffer) {
      return crypto.subtle.digest('SHA-256', buffer);
    }

    function bufToBase64(buf) {
      var bytes = new Uint8Array(buf);
      var binary = '';
      for (var i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
      return btoa(binary);
    }

    function base64ToUint8(b64) {
      var binary = atob(b64);
      var bytes = new Uint8Array(binary.length);
      for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return bytes;
    }

    var passBytes = enc.encode(self._opts.password || '');
    var saltBytes = base64ToUint8(salt);
    var step1 = new Uint8Array(passBytes.length + saltBytes.length);
    step1.set(passBytes, 0);
    step1.set(saltBytes, passBytes.length);

    sha256(step1).then(function (hash1) {
      var b64secret = bufToBase64(hash1);
      var secretBytes = enc.encode(b64secret);
      var chalBytes = base64ToUint8(challenge);
      var step2 = new Uint8Array(secretBytes.length + chalBytes.length);
      step2.set(secretBytes, 0);
      step2.set(chalBytes, secretBytes.length);
      return sha256(step2);
    }).then(function (hash2) {
      var authString = bufToBase64(hash2);
      self._send({ request: 'Authenticate', id: 'auth', authentication: authString });
    }).catch(function (e) {
      console.error('[SB] Error en autenticación SHA-256:', e);
      // Intentar conectar sin auth como fallback
      self._subscribe();
    });
  };

  StreamerbotClient.prototype._subscribe = function () {
    var events = this._opts.autoSubscribe;
    if (!events || Object.keys(events).length === 0) return;
    this._send({ request: 'Subscribe', id: 'subscribe', events: events });
  };

  /**
   * Ejecutar una acción de Streamer.bot por nombre o ID.
   * @param {object} action - { name: "Trivia.NextQuestion" } o { id: "guid" }
   * @param {object} args   - argumentos extra (opcionales)
   */
  StreamerbotClient.prototype.doAction = function (action, args) {
    this._send({
      request: 'DoAction',
      id: this._nextId(),
      action: action,
      args: args || {},
    });
  };

  return StreamerbotClient;
}));
