# Setup OBS

## 1. Configurar WebSocket Server

1. **Tools → WebSocket Server Settings**
2. Enable WebSocket Server: ON
3. Puerto: `4455`
4. Enable Authentication: ON → setear contraseña → anotarla (se usa en Streamer.bot)

---

## 2. Agregar Browser Sources

Crear una **Browser Source** para cada overlay en las escenas correspondientes.

| Source | Path local | Tamaño | Escenas |
|--------|------------|--------|---------|
| Scoreboard | `C:\streams\spike-picante\overlays\scoreboard.html` | 400×600 | Todas |
| Trivia | `C:\streams\spike-picante\overlays\trivia.html` | 1920×1080 | Show - Trivia Board |
| Alerts | `C:\streams\spike-picante\overlays\alerts.html` | 1920×1080 | Todas |
| Wheel | `C:\streams\spike-picante\overlays\wheel.html` | 600×600 | Cuando se necesite |
| Timer | `C:\streams\spike-picante\overlays\timer.html` | 200×200 | Cuando se necesite |

En OBS, al crear la Browser Source elegir **Local file** y navegar hasta el archivo. No es necesario el HTTP Server de SB para los overlays — solo necesitan el WebSocket Server (puerto 8080) para recibir eventos.

**Configuración para cada Browser Source:**
- FPS: 30 (60 solo para Alerts si querés confetti más suave)
- **Shutdown source when not visible: OFF** — crítico para Timer y Trivia, si está ON pierden estado al ocultar
- Refresh browser when scene becomes active: OFF
- Custom CSS: dejar vacío (los overlays ya tienen `background: transparent`)

**Configuración global:**
- OBS Settings → Advanced → Sources → **Enable Browser Source Hardware Acceleration**: ON

---

## 3. Organización de escenas sugerida

```
Show - Host Solo      → Scoreboard + Alerts
Show - Trivia Board   → Scoreboard + Trivia + Alerts + Timer
Show - Hot Take       → Scoreboard + Alerts
Show - BRB            → (sin overlays activos)
```

Usar **Downstream Keyer** (plugin) para poner Scoreboard y Alerts en todas las escenas sin duplicar sources.

---

## 4. Filtros de Mood (opcional)

Si querés cambios de color con los botones Picante/Chill/RedAlert:

1. Sobre la fuente de video principal, agregar filtros **LUT**
2. Nombrarlos exactamente: `LUT_Picante`, `LUT_Chill`
3. Las acciones `Mood.Picante` y `Mood.Chill` activan/desactivan estos filtros por nombre

---

## 5. Plugins recomendados

Todos gratuitos:

| Plugin | Autor | Dónde conseguirlo |
|--------|-------|-------------------|
| Move | exeldro | obs-download.com o GitHub |
| Source Clone | exeldro | GitHub |
| Advanced Scene Switcher | WarmUpTill | OBS foro oficial |
| Composite Blur | FiniteSingularity | GitHub |
| 3D Effect | exeldro | GitHub |
| Downstream Keyer | — | OBS foro oficial |

No usar **StreamFX** — modelo Patreon pago desde 2023.
