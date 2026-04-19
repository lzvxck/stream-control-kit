# Testing Guide — Spike Picante

Verificación manual componente por componente. Ejecutar en este orden.

---

## Prerrequisitos

- Streamer.bot corriendo con todas las acciones importadas
- OBS abierto y conectado a SB (ícono verde en Stream Apps → OBS)
- WebSocket Server activo en SB (puerto 8080)
- HTTP Server activo en SB (puerto 7474)
- Archivos del proyecto en `C:\streams\spike-picante\`

---

## 1. HTTP Server

1. Abrir Chrome → `http://127.0.0.1:7474/overlays/scoreboard.html`

**Esperado:** La página carga sin errores 404 en consola (F12).

**Si falla:** Verificar Path Mappings en SB → HTTP Server.

---

## 2. WebSocket

1. Abrir `http://127.0.0.1:7474/overlays/scoreboard.html`
2. F12 → Console → esperar 2-3 segundos

**Esperado:** Sin errores `WebSocket connection failed`. El dot del panel de control se pone verde.

**Si falla:** Verificar WS Server en SB, verificar que el puerto 8080 no está bloqueado.

---

## 3. Scoreboard

**3a. Broadcast del leaderboard**
1. SB → `Picantes.BroadcastLeaderboard` → click derecho → **Test Action**

Esperado: scoreboard muestra jugadores existentes o estado vacío.

**3b. Sumar puntos**
1. SB → `Picantes.Award` → Test → args: `user = testplayer`, `amount = 100`

Esperado: scoreboard muestra `testplayer` con `100 🌶` en posición #1, badge Iron.

**3c. Quick change**
1. SB → `Picantes.QuickAward` → Test → args: `amount = 5`, `targetPlayer = testplayer`

Esperado: feedback flotante `+5` en blanco aparece centrado y desaparece en ~1.5s. Scoreboard se actualiza.

**3d. Hotkeys F13–F18**
1. SB → `Show.SetActivePlayer` → Test → `player = testplayer`
2. Presionar F13

Esperado: mismo efecto que 3c con `+1`.

---

## 4. Panel de control

1. Abrir `http://127.0.0.1:7474/control/index.html`
2. Esperar dot verde arriba
3. Ingresar nombre en "Jugador activo" → **Setear**
4. Click `+1`

Esperado:
- Dot verde con "Conectado a Streamer.bot ✓"
- Log de eventos muestra la acción ejecutada
- Scoreboard se actualiza
- Display de pts del panel se actualiza

---

## 5. Timer

1. Abrir `http://127.0.0.1:7474/overlays/timer.html`
2. En el panel → Timer → click `+30` → click `▶ Start`

Esperado: el overlay muestra el número bajando. A 15s el anillo se atenúa. A 10s se pone rojo. Al llegar a 0 queda en rojo dimmed.

3. Click `⏸ Stop` → número se detiene
4. Click `↺ Reset` → vuelve al valor seteado

**Importante:** En OBS, la browser source del timer debe tener **Shutdown source when not visible: OFF**. Si está ON, el timer se reinicia cada vez que se oculta.

---

## 6. Trivia

**6a. Iniciar**
1. Abrir `http://127.0.0.1:7474/overlays/trivia.html`
2. Panel → setear jugador → `🎮 Start Game`

Esperado:
- Overlay trivia aparece con nombre del jugador y escalera de 15 rungs

**6b. Siguiente pregunta**
1. Panel → `▶ Next Question`

Esperado:
- Overlay: pregunta y 4 opciones aparecen
- Panel: mini preview con la pregunta y opciones, correcta en verde
- Q1 resaltado en la escalera lateral

Si no aparece pregunta: verificar que `data/questions.json` existe y es JSON válido.

**6c. Lock respuesta**
1. Panel → `Lock A`

Esperado:
- Overlay trivia: opción A se resalta en blanco
- Panel mini preview: opción A en blanco (si es correcta, verde brillante + blanco)


**6d. Reveal**
1. Panel → `✔ Reveal`

Esperado:
- Correcta → verde
- Incorrecta (si A era mal) → roja
- Resto → dimmed
- Si era correcta: confetti

**6e. 50:50**
1. Nueva pregunta → panel → `50:50`

Esperado: dos opciones se atenúan (opacity baja). Lifeline queda marcada como usada.

**6f. Walk Away**
1. Con trivia activa → `🚶 Walk Away`

Esperado: overlay desaparece, mensaje en chat con picantes ganados.

---

## 7. Alerts

**7a. Follow**
1. Abrir `http://127.0.0.1:7474/overlays/alerts.html`
2. SB → `Alert.Follow` → Test → `user = testuser`

Esperado: toast pequeño arriba a la derecha, desaparece en ~2s.

**7b. Sub T1**
1. SB → `Alert.Sub.T1` → Test → `user = sub1`, `months = 1`, `tier = T1`

Esperado: tarjeta más grande, dura ~5s.

**7c. Gift Bomb (takeover)**
1. SB → `Alert.GiftBomb` → Test → `user = gifter`, `count = 10`, `tier = T1`

Esperado: fullscreen con confetti durante ~10s.

**7d. Cola serializada**
1. Disparar 3 alertas rápidas (Follow, Sub, Follow)

Esperado: aparecen una tras otra, nunca simultáneas.

---

## 8. Ruleta

1. Abrir `http://127.0.0.1:7474/overlays/wheel.html`
2. SB → `Wheel.Spin` → Test → `input0 = 1`

Esperado: ruleta gira 4-6s, frena en el ganador, banner aparece abajo.

Para probar opciones personalizadas: agregar opciones en el panel → Guardar en SB → volver a girar.

---

## 9. Mood

Prerequisito: filtros `LUT_Picante` y `LUT_Chill` creados en OBS.

1. Panel → `🌶️ Picante`

Esperado en OBS: filtro LUT_Picante activo, LUT_Chill inactivo.

---

## 10. Discord webhook

Prerequisito: variable global `discordGoLiveWebhook` configurada en SB.

1. Panel → `📢 Discord Live`

Esperado: mensaje aparece en el canal de Discord configurado.

---

## 11. Checklist pre-stream

- [ ] Dot verde en panel de control
- [ ] WebSocket Server y HTTP Server activos en SB
- [ ] OBS conectado a SB (ícono verde)
- [ ] Jugador activo seteado en el panel
- [ ] `data/questions.json` es JSON válido (pegar en consola del browser: `JSON.parse(await(await fetch('/data/questions.json')).text())`)
- [ ] SFX en `C:\streams\spike-picante\assets\sfx\`
- [ ] Hotkeys F13–F18 registrados en SB
- [ ] Browser sources de Timer y Trivia con "Shutdown when not visible: OFF"


---

## Errores comunes

| Error | Causa | Solución |
|-------|-------|----------|
| Overlay en blanco | HTTP server no activo o path mapping incorrecto | Verificar SB → HTTP Server |
| `WebSocket connection failed` en consola | Puerto 8080 no disponible | Verificar WS Server en SB |
| Trivia no muestra pregunta | `questions.json` no encontrado o ruta incorrecta | Verificar que está en `C:\streams\spike-picante\data\` |
| Timer se reinicia al ocultar/mostrar en OBS | "Shutdown source when not visible" está ON | Desactivar esa opción en la browser source |

| Alertas se superponen | Queue `alerts-queue` no asignada a las acciones | Verificar que todas las acciones Alerts tienen esa queue |
| Hotkeys no responden | SB sin foco o conflicto con otra app | Enfocar SB, revisar conflictos |
| Confetti no aparece | Sin internet (CDN de confetti no carga) | Vendorizar `confetti.browser.min.js` localmente |
