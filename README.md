# Spike Picante

Show de streaming sobre Valorant/VCT. Host + invitado del día. Sin backend propio, sin servicios de pago.

**Stack:** OBS Studio 31 · Streamer.bot 1.0.x · overlays HTML/CSS/JS vanilla

---

## Requisitos

- Windows 10/11
- [OBS Studio 31+](https://obsproject.com)
- [Streamer.bot 1.0.x](https://streamer.bot) — descomprimir el `.zip`, no tiene instalador
- .NET Desktop Runtime 6.0+ (SB lo pide al primer arranque si falta)
- Cuenta Twitch con permisos de broadcaster

---

## Setup rápido

1. Copiar el proyecto a `C:\streams\spike-picante\`
2. Configurar Streamer.bot → [`docs/setup-streamerbot.md`](docs/setup-streamerbot.md)
3. Configurar OBS → [`docs/setup-obs.md`](docs/setup-obs.md)
4. Configurar alertas → [`docs/setup-alerts.md`](docs/setup-alerts.md)
5. Verificar todo → [`testing-guide.md`](testing-guide.md)

---

## Overlays disponibles

| Overlay | URL | Tamaño OBS |
|---------|-----|------------|
| Scoreboard | `overlays\scoreboard.html` | 400×600 |
| Trivia | `overlays\trivia.html` | 1920×1080 |
| Alerts | `overlays\alerts.html` | 1920×1080 |
| Wheel | `overlays\wheel.html` | 600×600 |
| Timer | `overlays\timer.html` | 200×200 |
| Rank Tracker | `overlays\rank-tracker.html` | 320×200 |

---

## Panel de control

Abrir en el segundo monitor:
```
http://127.0.0.1:7474/control/index.html
```

Se conecta automáticamente a Streamer.bot. El dot verde arriba confirma conexión.

---

## Archivos de audio (SFX)

Colocar en `C:\streams\spike-picante\assets\sfx\`. Si falta algún archivo SB logea warning pero sigue funcionando.

| Archivo | Acción |
|---------|--------|
| `follow.ogg` | Alert.Follow |
| `cheer_small.ogg` | Alert.Cheer.Small |
| `cheer_medium.ogg` | Alert.Cheer.Medium |
| `cheer_big.ogg` | Alert.Cheer.Big |
| `sub_t1.ogg` | Alert.Sub.T1 |
| `sub_t2.ogg` | Alert.Sub.T2 |
| `sub_t3.ogg` | Alert.Sub.T3 |
| `gift_bomb.ogg` | Alert.GiftBomb |
| `raid.ogg` | Alert.Raid |
| `intro_millonario.ogg` | Trivia.Start |
| `final_answer_sting.ogg` | Trivia.LockAnswer |
| `correct_climb.ogg` | Trivia.RevealAnswer (correcto) |
| `wrong_game_over.ogg` | Trivia.RevealAnswer (incorrecto) |
| `phone_ringing.ogg` | Trivia.Lifeline.PhoneFriend |

---

## Encoder OBS (NVENC)

Recomendado con Blender corriendo en background:

- Encoder: NVENC H.264
- Rate Control: CBR · Bitrate: 6000 Kbps
- Keyframe Interval: 2s · Preset: P5 (Slow)
- B-frames: 2 · Look-ahead: OFF · Psycho Visual Tuning: OFF
- Canvas y output: 1920×1080 · Downscale: Lanczos

---

## Plugins OBS recomendados

| Plugin | Uso |
|--------|-----|
| Move (exeldro) | Animación de transforms y filtros |
| Source Clone (exeldro) | Reusar sources sin duplicar decode |
| Advanced Scene Switcher | Macros condicionales |
| Composite Blur (FiniteSingularity) | Blur backgrounds |
| 3D Effect (exeldro) | Transforms 3D |
| Downstream Keyer | Overlay global sobre todas las escenas |

No usar StreamFX — modelo pago desde 2023.
