"""
Patch import-show-flow.nft:
  - Modify Show.Stop to broadcast show.summary
  - Add/update Show.TrackPlayer action (fetches Valorant rank via Henrik API)
  - Add Show.RankHide action (broadcasts player.rank_hide)
"""
import base64, gzip, json, uuid, os

NFT = os.path.join(os.path.dirname(__file__), '..', 'streamerbot', 'generated', 'import-show-flow.nft')

with open(NFT, 'rb') as f:
    raw = f.read()
decoded = base64.b64decode(raw)
header = decoded[:4]
data = gzip.decompress(decoded[4:])
obj = json.loads(data)
acts = obj['data']['actions']

# ── Show.Stop ─────────────────────────────────────────────────────────────
STOP_CS = r"""using System;
using Newtonsoft.Json;

public class CPHInline {
    public bool Execute() {
        if (CPH.GetGlobalVar<bool>("trivia_active", false))
            CPH.SetGlobalVar("trivia_active", false, false);

        CPH.SetGlobalVar("vote_open", false, false);
        CPH.SetGlobalVar("trivia_activePlayer", "", false);

        CPH.RunAction("Picantes.BroadcastLeaderboard", false);

        var summary = new {
            @event = "show.summary",
            payload = new { guest = CPH.GetGlobalVar<string>("show_activePlayer", false) }
        };
        CPH.WebsocketBroadcastJson(JsonConvert.SerializeObject(summary));

        CPH.SendMessage("👋 ¡Hasta la próxima! Vean el VOD en Twitch 🌶️");
        CPH.ObsSetScene("Outro", 0);
        return true;
    }
}"""

# ── Show.TrackPlayer ──────────────────────────────────────────────────────
# Solo hace broadcast del riotId. El overlay (rank-tracker.js) llama a la API
# directamente desde el browser, evitando problemas con CPH.WebRequest.
TRACK_CS = r"""using Newtonsoft.Json;

public class CPHInline {
    public bool Execute() {
        string riotId = "";
        if (!CPH.TryGetArg("riotId", out riotId) || string.IsNullOrWhiteSpace(riotId))
            return false;

        CPH.SetGlobalVar("show_riotId", riotId, false);

        var payload = new {
            @event = "player.rank_fetch",
            payload = new { riotId = riotId }
        };
        CPH.WebsocketBroadcastJson(JsonConvert.SerializeObject(payload));
        CPH.LogInfo("[TrackPlayer] broadcast rank_fetch for " + riotId);
        return true;
    }
}"""

# ── Show.RankHide ─────────────────────────────────────────────────────────
RANK_HIDE_CS = r"""using Newtonsoft.Json;

public class CPHInline {
    public bool Execute() {
        var payload = new { @event = "player.rank_hide" };
        CPH.WebsocketBroadcastJson(JsonConvert.SerializeObject(payload));
        return true;
    }
}"""

# ── Show.RankBroadcast — recibe args del panel y los re-emite al overlay ──
RANK_BROADCAST_CS = r"""using System;
using System.Linq;
using Newtonsoft.Json;

public class CPHInline {
    public bool Execute() {
        string player = "", tier = "", rrStr = "", winRateStr = "", matchesStr = "", kdaStr = "", hsStr = "";
        CPH.TryGetArg("player",        out player);
        CPH.TryGetArg("tier",          out tier);
        CPH.TryGetArg("rr",            out rrStr);
        CPH.TryGetArg("winRate",       out winRateStr);
        CPH.TryGetArg("recentMatches", out matchesStr);
        CPH.TryGetArg("kda",           out kdaStr);
        CPH.TryGetArg("hsPercent",     out hsStr);

        int rr = 0; int.TryParse(rrStr, out rr);

        int? winRate = null;
        int wr; if (int.TryParse(winRateStr, out wr)) winRate = wr;

        var matches = string.IsNullOrEmpty(matchesStr)
            ? new string[0]
            : matchesStr.Split(',').Where(s => s == "W" || s == "L").ToArray();

        string kda = string.IsNullOrEmpty(kdaStr) ? null : kdaStr;

        int? hsPercent = null;
        int hs; if (int.TryParse(hsStr, out hs)) hsPercent = hs;

        var payload = new {
            @event = "player.rank",
            payload = new {
                player        = player,
                tier          = tier,
                rr            = rr,
                winRate       = winRate,
                recentMatches = matches,
                kda           = kda,
                hsPercent     = hsPercent,
            }
        };
        CPH.WebsocketBroadcastJson(JsonConvert.SerializeObject(payload));
        return true;
    }
}"""

# ── Show.RankTest — broadcasts hardcoded mock data to test the overlay ────
RANK_TEST_CS = r"""using Newtonsoft.Json;

public class CPHInline {
    public bool Execute() {
        var payload = new {
            @event = "player.rank",
            payload = new {
                player        = "TestPlayer#LTM",
                tier          = "Diamond 2",
                rr            = 67,
                winRate       = 54,
                kda           = "1.43",
                hsPercent     = 22,
                recentMatches = new[] { "W","W","L","W","L","W","W","L" },
            }
        };
        CPH.WebsocketBroadcastJson(JsonConvert.SerializeObject(payload));
        CPH.LogInfo("[RankTest] mock payload broadcast OK");
        return true;
    }
}"""

def make_action(name, group, cs_code):
    return {
        "id": str(uuid.uuid4()),
        "queue": "00000000-0000-0000-0000-000000000000",
        "enabled": True,
        "excludeFromHistory": False,
        "excludeFromPending": False,
        "name": name,
        "group": group,
        "alwaysRun": False,
        "randomAction": False,
        "concurrent": False,
        "triggers": [],
        "subActions": [{
            "name": None,
            "description": None,
            "references": [
                r"C:\Windows\Microsoft.NET\Framework64\v4.0.30319\mscorlib.dll",
                r"C:\Windows\Microsoft.NET\Framework64\v4.0.30319\System.dll",
                r"C:\Windows\Microsoft.NET\Framework64\v4.0.30319\System.Core.dll",
                r"C:\Windows\Microsoft.NET\Framework64\v4.0.30319\Microsoft.CSharp.dll",
            ],
            "byteCode": base64.b64encode(cs_code.encode('utf-8')).decode('ascii'),
            "precompile": False,
            "delayStart": False,
            "saveResultToVariable": False,
            "saveToVariable": None,
            "id": str(uuid.uuid4()),
            "weight": 0,
            "type": 99999,
            "parentId": None,
            "enabled": True,
            "index": 0,
        }],
        "collapsedGroups": [],
    }

# Patch Show.Stop
stop = next(a for a in acts if a['name'] == 'Show.Stop')
stop['subActions'][0]['byteCode'] = base64.b64encode(STOP_CS.encode('utf-8')).decode('ascii')

# Update or add Show.TrackPlayer
track = next((a for a in acts if a['name'] == 'Show.TrackPlayer'), None)
if track:
    track['subActions'][0]['byteCode'] = base64.b64encode(TRACK_CS.encode('utf-8')).decode('ascii')
else:
    acts.append(make_action('Show.TrackPlayer', 'Show Flow', TRACK_CS))

# Update or add Show.RankHide
hide = next((a for a in acts if a['name'] == 'Show.RankHide'), None)
if hide:
    hide['subActions'][0]['byteCode'] = base64.b64encode(RANK_HIDE_CS.encode('utf-8')).decode('ascii')
else:
    acts.append(make_action('Show.RankHide', 'Show Flow', RANK_HIDE_CS))

# Update or add Show.RankTest
ranktest = next((a for a in acts if a['name'] == 'Show.RankTest'), None)
if ranktest:
    ranktest['subActions'][0]['byteCode'] = base64.b64encode(RANK_TEST_CS.encode('utf-8')).decode('ascii')
else:
    acts.append(make_action('Show.RankTest', 'Show Flow', RANK_TEST_CS))

# Update or add Show.RankBroadcast
rankbc = next((a for a in acts if a['name'] == 'Show.RankBroadcast'), None)
if rankbc:
    rankbc['subActions'][0]['byteCode'] = base64.b64encode(RANK_BROADCAST_CS.encode('utf-8')).decode('ascii')
else:
    acts.append(make_action('Show.RankBroadcast', 'Show Flow', RANK_BROADCAST_CS))

# Write
new_json = json.dumps(obj, ensure_ascii=False).encode('utf-8')
compressed = gzip.compress(new_json)
out = base64.b64encode(header + compressed)
with open(NFT, 'wb') as f:
    f.write(out)

print("Done. Actions:")
for a in obj['data']['actions']:
    print(" ", a['name'])
