# Setup Alertas

## Cómo funcionan

Cada evento de Twitch dispara una acción de SB → la acción emite un evento WebSocket → el overlay `alerts.html` muestra la tarjeta correspondiente.

Las alertas se ejecutan en orden (queue bloqueante `alerts-queue`) — nunca se pisan entre sí.

---

## Tiers de alerta

| Tier | Cuándo | Duración | Estilo |
|------|--------|----------|--------|
| `tier-subtle` | Follow, Cheer pequeño | ~2s | Toast pequeño, borde blanco sutil |
| `tier-medium` | Sub T1, Cheer medio | ~5s | Tarjeta mediana, borde blanco |
| `tier-big` | Sub T2/T3, Cheer grande, Gift Bomb pequeño | ~8s | Tarjeta grande, borde blanco brillante |
| `tier-takeover` | Cheer 1000+, Raid, Gift Bomb masivo | ~10s | Fullscreen con confetti |

---

## Triggers a configurar en SB

Para cada acción del grupo **Alerts**, agregar el trigger correspondiente:

### Alert.Follow
- Trigger: **Twitch → Follow**
- Sin args adicionales (el arg `user` lo pasa SB automáticamente)

### Alert.Cheer.Small
- Trigger: **Twitch → Cheer**
- Condición: bits entre `1` y `99`

### Alert.Cheer.Medium
- Trigger: **Twitch → Cheer**
- Condición: bits entre `100` y `499`

### Alert.Cheer.Big
- Trigger: **Twitch → Cheer**
- Condición: bits entre `500` y `999`

### Alert.Cheer.Takeover
- Trigger: **Twitch → Cheer**
- Condición: bits `>= 1000`

### Alert.Sub.T1 / T2 / T3
- Trigger: **Twitch → Subscribe**
- Condición: tier `1000` / `2000` / `3000` respectivamente
- También cubre resubs (el mismo trigger incluye resubs)

### Alert.GiftBomb
- Trigger: **Twitch → Community Gift Sub** (cuando alguien regala múltiples subs)
- Sin condición de cantidad — la lógica de tier está dentro del C#

### Alert.Raid
- Trigger: **Twitch → Raid**
- Sin condición — el tier se determina por cantidad de viewers en el C#

---

## Cómo agregar un trigger

1. Click derecho sobre la acción → **Edit**
2. Sección **Triggers** → `+`
3. Seleccionar el tipo (Twitch → el evento)
4. Si necesita condición de bits/tier: en la configuración del trigger, setear el rango

---

## Verificar que la queue bloqueante está asignada

Antes de probar alertas, confirmar que cada acción del grupo Alerts tiene `alerts-queue` en el campo Queue:

1. Click derecho sobre la acción → **Edit**
2. Campo **Queue** → debe decir `alerts-queue`
3. Si dice `Default` → cambiarlo

Sin queue bloqueante, varias alertas simultáneas se superponen en el overlay.

---

## Test manual de cada alert

En SB, click derecho sobre la acción → **Test Action** y completar los args:

| Acción | Args de test |
|--------|-------------|
| Alert.Follow | `user = testuser` |
| Alert.Cheer.Small | `user = testuser`, `bits = 50`, `message = hola` |
| Alert.Sub.T1 | `user = testuser`, `months = 1`, `tier = T1` |
| Alert.GiftBomb | `user = gifter`, `count = 5`, `tier = T1` |
| Alert.Raid | `user = raider`, `viewers = 50` |
