const https = require('https');
const zlib = require('zlib');

function fetchJson(url, cb) {
  https.get(url, {headers: {'User-Agent': 'Mozilla/5.0'}}, function(res) {
    let d = '';
    res.on('data', function(c) { d += c; });
    res.on('end', function() { cb(null, d); });
  }).on('error', cb);
}

function tryDecode(raw) {
  const idx = raw.indexOf('TlM0RR');
  if (idx === -1) return null;
  let end = idx;
  while (end < raw.length && raw[end] !== '"' && raw[end] !== '<' && raw[end] !== ' ' && raw[end] !== '\n') end++;
  return raw.substring(idx, end).split('\\n').join('').split('\\r').join('');
}

// Recent topics likely made with SB 1.0.x
const topicIds = [2471, 2743, 3206, 2145, 3000, 2800, 2600, 2500, 2400];

topicIds.forEach(function(id) {
  fetchJson('https://extensions.streamer.bot/t/topic/' + id + '.json', function(err, d) {
    if (err || !d) return;
    const importStr = tryDecode(d);
    if (!importStr || importStr.length < 200) return;
    const buf = Buffer.from(importStr, 'base64');
    if (buf[4] !== 0x1f || buf[5] !== 0x8b) return;
    zlib.gunzip(buf.slice(4), function(err2, result) {
      if (err2) return;
      try {
        const json = JSON.parse(result.toString('utf8'));
        console.log('Topic', id, '— version:', json.version);
        console.log('Full JSON (first 2000 chars):');
        console.log(JSON.stringify(json, null, 2).substring(0, 2000));
        console.log('---');
      } catch(e) {}
    });
  });
});
