/**
 * Spike Picante — Streamer.bot Import Generator
 *
 * Format confirmed from real SB 1.0.4 export:
 *   header : 53 42 41 45 ("SBAE")
 *   bytes 4+: gzip-compressed JSON
 *   JSON structure: { meta, data, version:23, exportedFrom, minimumVersion }
 *
 * Usage: node generate-imports.js
 * Output: streamerbot/generated/*.nft  (one file per spec group)
 */

'use strict';
const fs   = require('fs');
const path = require('path');
const zlib = require('zlib');
const { randomUUID } = require('crypto');

const DEFAULT_QUEUE_ID = '00000000-0000-0000-0000-000000000000';
const NET_DIR = 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\';
const REFERENCES = [
  NET_DIR + 'mscorlib.dll',
  NET_DIR + 'System.dll',
  NET_DIR + 'System.Core.dll',
  NET_DIR + 'Microsoft.CSharp.dll',
];

function makeId() { return randomUUID(); }
function b64(str) { return Buffer.from(str, 'utf8').toString('base64'); }

function makeCSharpSubAction(source, index) {
  return {
    name:                 null,
    description:          null,
    references:           REFERENCES,
    byteCode:             b64(source),
    precompile:           false,
    delayStart:           false,
    saveResultToVariable: false,
    saveToVariable:       null,
    id:                   makeId(),
    weight:               0,
    type:                 99999,
    parentId:             null,
    enabled:              true,
    index:                index || 0,
  };
}

function buildCSharpSource(specAction) {
  const base       = specAction.csharp || '';
  const subActions = specAction.sub_actions || [];

  if (subActions.length === 0) return base;

  const statements = [];
  subActions.forEach(function(sa) {
    if (sa.type === 'OBS Set Scene') {
      statements.push({ kind: 'obs', line: '        CPH.ObsSetScene("' + sa.scene + '", 0);' });
    } else if (sa.type === 'Run Action') {
      statements.push({ kind: 'run', line: '        CPH.RunAction("' + sa.action + '", false);' });
    } else if (sa.type === 'Core Execute C# Code' && sa.ref === 'csharp') {
      statements.push({ kind: 'main' });
    } else if (sa.type === 'Core Execute C# Code' && sa.inline) {
      statements.push({ kind: 'inline', code: sa.inline });
    }
  });

  const hasMain = statements.some(function(s) { return s.kind === 'main'; });

  if (!hasMain) {
    const bodyLines = [];
    statements.forEach(function(s) {
      if (s.kind === 'obs' || s.kind === 'run') bodyLines.push(s.line);
      if (s.kind === 'inline') bodyLines.push('        ' + s.code);
    });
    if (bodyLines.length === 0) return base;
    return [
      'public class CPHInline {',
      '    public bool Execute() {',
    ].concat(bodyLines).concat([
      '        return true;',
      '    }',
      '}',
    ]).join('\n');
  }

  const preLines = [], postLines = [];
  let mainIdx = -1;
  statements.forEach(function(s, i) {
    if (s.kind === 'main') { mainIdx = i; return; }
    if (mainIdx === -1) preLines.push(s.line || ('        ' + s.code));
    else                postLines.push(s.line || ('        ' + s.code));
  });

  let src = base;
  if (preLines.length > 0 && src.includes('public bool Execute()')) {
    src = src.replace('public bool Execute() {', 'public bool Execute() {\n' + preLines.join('\n'));
  }
  if (postLines.length > 0 && src.includes('return true;')) {
    src = src.replace('return true;', postLines.join('\n') + '\n        return true;');
  }
  return src;
}

function buildAction(specAction) {
  const source = buildCSharpSource(specAction);
  const subActionsOut = source ? [makeCSharpSubAction(source, 0)] : [];

  return {
    id:                 makeId(),
    queue:              DEFAULT_QUEUE_ID,
    enabled:            true,
    excludeFromHistory: false,
    excludeFromPending: false,
    name:               specAction.name,
    group:              specAction.group || '',
    alwaysRun:          false,
    randomAction:       false,
    concurrent:         false,
    triggers:           [],
    subActions:         subActionsOut,
    collapsedGroups:    [],
  };
}

function encodeImport(importObj, cb) {
  const json = JSON.stringify(importObj, null, 2);
  zlib.gzip(Buffer.from(json, 'utf8'), function(err, compressed) {
    if (err) return cb(err);
    const header  = Buffer.from([0x53, 0x42, 0x41, 0x45]); // "SBAE"
    cb(null, Buffer.concat([header, compressed]).toString('base64'));
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────

const specDir = __dirname;
const outDir  = path.join(specDir, 'generated');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

const specFiles = [
  'import-picantes.json',
  'import-trivia.json',
  'import-alerts.json',
  'import-commands.json',
  'import-show-flow.json',
];

const blockingQueues = new Set();
let pending = specFiles.length;

specFiles.forEach(function(file) {
  const spec      = JSON.parse(fs.readFileSync(path.join(specDir, file), 'utf8'));
  const groupName = spec._meta.grupo_sb || file.replace('import-', '').replace('.json', '');
  const actions   = spec.actions.map(buildAction);

  spec.actions.forEach(function(a) {
    if (a.queue && a.queue !== 'Default' && a.queue_blocking) blockingQueues.add(a.queue);
  });

  const importObj = {
    meta: {
      name:           'Spike Picante — ' + groupName,
      author:         'Spike Picante',
      version:        '1.0.0',
      description:    '',
      autoRunAction:  null,
      minimumVersion: null,
    },
    data: {
      actions:          actions,
      queues:           [],
      commands:         [],
      websocketServers: [],
      websocketClients: [],
      timers:           [],
    },
    version:        23,
    exportedFrom:   '1.0.4',
    minimumVersion: '1.0.0-alpha.1',
  };

  const outFile = path.join(outDir, file.replace('.json', '.nft'));

  encodeImport(importObj, function(err, nftString) {
    if (err) { console.error('Error:', err.message); pending--; return; }

    fs.writeFileSync(outFile, nftString, 'utf8');
    console.log('✓ ' + path.basename(outFile) + ' (' + nftString.length + ' chars)');

    if (--pending === 0) {
      console.log('\nAll .nft files written to: ' + outDir);
      if (blockingQueues.size > 0) {
        console.log('\n⚠  Crear en SB → Action Queues:');
        blockingQueues.forEach(function(q) { console.log('   • ' + q + ' (Blocking: ON)'); });
      }
      console.log('\nPasos: Import cada .nft → agregar triggers → crear alerts-queue');
    }
  });
});
