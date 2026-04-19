# Setup Streamer.bot

## 1. Conectar cuenta Twitch

1. **Platforms → Twitch → Accounts → Add Account**
2. Click **Authorize** → login en el browser
3. Autorizar la app → el ícono Twitch se pone verde
4. Click derecho sobre la cuenta → **Set as Broadcaster**

---

## 2. Activar WebSocket Server

1. **Servers/Clients → WebSocket Server**
2. Enable: ON · Address: `127.0.0.1` · Port: `8080`
3. Sin contraseña para uso local (los overlays conectan sin password por defecto)

---

## 3. Activar HTTP Server

1. **Servers/Clients → HTTP Server**
2. Enable: ON · Address: `127.0.0.1` · Port: `7474`
3. En **Path Mappings** agregar:
   - Virtual: `/overlays` → Local: `C:\streams\spike-picante\overlays`
   - Virtual: `/control` → Local: `C:\streams\spike-picante\control`
4. Verificar: abrir `http://127.0.0.1:7474/overlays/scoreboard.html` en Chrome → debe cargar

---

## 4. Importar acciones

1. **Import** (barra superior o Ctrl+I)
2. Click en el ícono de carpeta → seleccionar cada `.nft` de `streamerbot/generated/`:
   - `import-picantes.nft`
   - `import-trivia.nft`
   - `import-alerts.nft`
   - `import-commands.nft`
   - `import-show-flow.nft`
   - `import-timer.nft`
3. Click **Import** para cada uno
4. Verificar en la pestaña Actions que aparecen los grupos: Picantes, Trivia, Alerts, Interactivity, Show Flow, Infra

---

## 5. Crear queue bloqueante para alertas

1. **Settings → Action Queues → click derecho → Add Queue**
2. Name: `alerts-queue` · activar **Blocking**: ON
3. Asignar esta queue a cada acción del grupo **Alerts**:
   - Click derecho sobre la acción → **Edit** → campo Queue → seleccionar `alerts-queue`
   - Repetir para: Alert.Follow, Alert.Cheer.Small/Medium/Big/Takeover, Alert.Sub.T1/T2/T3, Alert.GiftBomb, Alert.Raid

---

## 6. Configurar hotkeys F13–F18

En Actions → grupo Picantes → `Picantes.QuickAward`:

1. Panel derecho → **Triggers** → `+` → **Core → Hotkey**
2. Presionar F13 en el campo de tecla
3. Click derecho sobre el trigger → **Set Arguments** → agregar `amount = 1`
4. Repetir para cada tecla:

| Tecla | Acción | Arg `amount` |
|-------|--------|-------------|
| F13 | Picantes.QuickAward | `1` |
| F14 | Picantes.QuickAward | `-1` |
| F15 | Picantes.QuickAward | `5` |
| F16 | Picantes.QuickAward | `10` |
| F17 | Picantes.QuickAward | `0` (reset) |
| F18 | Picantes.BroadcastLeaderboard | — |

Si el teclado no tiene F13–F18: usar **Touch Portal** (app gratuita) para mapear teclas virtuales.

---

## 7. Agregar triggers a las acciones

Las acciones importadas no tienen triggers — agregarlos manualmente:

| Acción | Trigger |
|--------|---------|
| Alert.Follow | Twitch → Follow |
| Alert.Cheer.Small | Twitch → Cheer (1–99 bits) |
| Alert.Cheer.Medium | Twitch → Cheer (100–499 bits) |
| Alert.Cheer.Big | Twitch → Cheer (500–999 bits) |
| Alert.Cheer.Takeover | Twitch → Cheer (1000+ bits) |
| Alert.Sub.T1 | Twitch → Subscribe (tier 1) |
| Alert.Sub.T2 | Twitch → Subscribe (tier 2) |
| Alert.Sub.T3 | Twitch → Subscribe (tier 3) |
| Alert.GiftBomb | Twitch → Community Gift Sub |
| Alert.Raid | Twitch → Raid |
| Trivia.Lifeline.AskAudience.PollResult | Twitch → Poll Completed |
| Wheel.Spin | Twitch → Chat Command `!agent` |
| Cmd.Vote | Twitch → Chat Command `!vote` |

Para agregar un trigger: click derecho sobre la acción → **Edit** → sección Triggers → `+`

---

## 8. Conectar OBS

Ver `docs/setup-obs.md` paso 1 (WebSocket en OBS) antes de este paso.

1. **Stream Apps → OBS → Add**
2. Name: `Main OBS` · Version: `v5.x` · Host: `127.0.0.1` · Port: `4455`
3. Password: la misma que configuraste en OBS
4. Activar **Auto-Connect** y **Auto-Reconnect**
5. Click derecho → **Connect** → el ícono debe ponerse verde

---

## 9. Variable opcional: Discord webhook

Si querés usar el botón "Discord Live" del panel:

1. **Globals → Add Global Variable**
2. Name: `discordGoLiveWebhook` · Value: URL del webhook de Discord · Persisted: ON
