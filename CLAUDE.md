# CLAUDE.md — Spike Picante

## Stack técnico (restricciones estrictas)

- **Streamer.bot 1.0.x** — orquestador único. Toda la lógica vive acá.
- **OBS Studio 31** con OBS WebSocket v5 (puerto 4455, password en OBS Tools → WebSocket Server Settings)
- **Overlays**: HTML + CSS + JS vanilla. CDN permitido solo para GSAP 3.12.x (`cdn.jsdelivr.net`) y canvas-confetti (`cdnjs.cloudflare.com`). Sin frameworks.
- **@streamerbot/client** vendoreado en `overlays/vendor/streamerbot-client.js`
- **C# en Streamer.bot**: `using System`, `using System.Collections.Generic`, `using System.Linq`, `using Newtonsoft.Json`. Siempre `CPH.TryGetArg()` para leer args. Nunca aritmética inline en "Set Global Variable".
- **Ruta base**: `C:\streams\spike-picante\` — ajustar si es diferente en la PC destino.

## Estructura de carpetas

```
spike-picante/
├── CLAUDE.md
├── README.md
├── testing-guide.md
├── streamerbot/
│   ├── import-picantes.json        ← spec: sistema de puntos
│   ├── import-trivia.json          ← spec: trivia
│   ├── import-alerts.json          ← spec: alertas tiered
│   ├── import-commands.json        ← spec: comandos de chat
│   ├── import-show-flow.json       ← spec: control de escenas
│   └── sb-setup-guide.md          ← guía manual de creación en SB
├── overlays/
│   ├── scoreboard.html/css/js
│   ├── trivia.html/css/js
│   ├── alerts.html/css/js
│   ├── wheel.html/js
│   └── vendor/
│       └── streamerbot-client.js
├── control/
│   └── index.html
└── data/
    └── questions.json
```

## Convenciones de naming en Streamer.bot

Grupos y nombres con punto como separador de namespace:

```
📁 Show Flow     → Show.Start, Show.Stop, Show.SwitchScene.*
📁 Trivia        → Trivia.Start, Trivia.NextQuestion, Trivia.LockAnswer,
                   Trivia.RevealAnswer, Trivia.Lifeline.*, Trivia.WalkAway, Trivia.GameOver
📁 Picantes      → Picantes.Award, Picantes.Deduct, Picantes.QuickAward,
                   Picantes.ShowCurrent, Picantes.ShowTop, Picantes.ShowRanking,
                   Picantes.BroadcastLeaderboard, Picantes.MonthlyReset
📁 Interactivity → Cmd.Vote, Cmd.Pick, Cmd.Agent, Cmd.Roast,
                   Vote.Open, Vote.Close, Wheel.Spin
📁 Alerts        → Alert.Follow, Alert.Cheer.Small/Medium/Big/Takeover,
                   Alert.Sub.T1/T2/T3, Alert.GiftBomb, Alert.Raid,
                   Mood.Picante, Mood.Chill, Mood.RedAlert
📁 Infra         → Infra.Discord.PostGoLive, Show.SetActivePlayer
```

## Contrato de eventos WebSocket (overlay ↔ SB)

| event | payload |
|---|---|
| `picantes.leaderboard_update` | `{players:[{name,points,position}], totalPlayers}` |
| `picantes.quick_change` | `{player,delta,total,label}` |
| `trivia.game_start` | `{playerName,prizeLadder}` |
| `trivia.show_question` | `{id,question,options{A,B,C,D},difficulty,qNum}` |
| `trivia.lock_answer` | `{letter}` |
| `trivia.reveal_answer` | `{correct,chosen,isCorrect}` |
| `trivia.lifeline.fifty_fifty` | `{remove:[letter,letter]}` |
| `trivia.lifeline.audience` | `{distribution:{A,B,C,D}}` |
| `trivia.game_over` | `{winnings,reason}` |
| `alert.cheer` | `{user,bits,message,tier}` |
| `alert.sub` | `{user,tier,months,message}` |
| `alert.follow` | `{user}` |
| `alert.raid` | `{user,viewers,tier}` |
| `alert.gift_bomb` | `{user,count,tier}` |
| `mood.change` | `{mood:"picante"\|"chill"\|"alert"}` |
| `wheel.spin` | `{options:[],winners:[]}` |

## Sobre los archivos import-*.json

Los archivos `streamerbot/import-*.json` son **specs de referencia**, no imports binarios.
El formato real de SB es `base64(gzip(json))` con schema interno no documentado.
Ver `streamerbot/sb-setup-guide.md` para instrucciones de creación manual paso a paso.

## Cómo agregar preguntas al banco

Editar `data/questions.json`. Esquema de cada pregunta:
```json
{
  "id": <número único>,
  "difficulty": <1-15>,
  "category": "agents|maps|VCT|VCT_LATAM|pros|economy|mechanics|lore|community",
  "question": "Texto de la pregunta",
  "options": {"A":"...","B":"...","C":"...","D":"..."},
  "correct": "A|B|C|D",
  "explanation": "Texto explicativo (opcional)"
}
```
Dificultades: 1–5 fácil, 6–10 medio, 11–15 difícil.

## Hotkeys de picantes (F13–F18)

| Tecla | Acción SB | amount arg |
|-------|-----------|------------|
| F13 | Picantes.QuickAward | +1 |
| F14 | Picantes.QuickAward | -1 |
| F15 | Picantes.QuickAward | +5 |
| F16 | Picantes.QuickAward | +10 |
| F17 | Picantes.QuickAward | 0 (reset) |
| F18 | Picantes.BroadcastLeaderboard | — |

## Variables globales clave en SB

| Variable | Persistida | Descripción |
|---|---|---|
| `picantes_<login>` | sí | Puntos de cada jugador |
| `picantes_month` | sí | Mes actual `YYYY-MM` |
| `picantes_monthlyLeader_<YYYY-MM>` | sí | Top 3 del mes archivado |
| `trivia_active` | no | bool: trivia en curso |
| `trivia_used` | no | List\<int\> de IDs usados |
| `trivia_currentQuestion` | no | JSON de la pregunta activa |
| `trivia_currentCorrect` | no | Letra correcta activa |
| `trivia_qNum` | no | Número de pregunta actual |
| `trivia_winnings` | no | Picantes acumulados en trivia |
| `trivia_activePlayer` | no | Login del invitado activo |
| `vote_open` | no | bool: votación abierta |
| `vote_options` | no | Opciones separadas por \| |
| `vote_tally` | no | Dict\<string,int\> de votos |
| `show_previousScene` | no | Escena anterior a takeover |
