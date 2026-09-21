'use strict';
/**
 * License verification (main process only).
 *  - ECDSA P-256 / SHA-256 signature check against the embedded public key
 *  - expiry / machine binding evaluation
 *  - stable machine identifier (Windows MachineGuid, Linux machine-id, fallback hash)
 */
const crypto = require('node:crypto');
const os = require('node:os');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const PUBLIC_JWK = require('../shared/public-key.json');
const { parseKey, evaluatePayload } = require('../shared/license-format');

let cachedMachineId = null;

function rawMachineSeed() {
  try {
    if (process.platform === 'win32') {
      const out = execFileSync('reg', ['query', 'HKLM\\SOFTWARE\\Microsoft\\Cryptography', '/v', 'MachineGuid'], { encoding: 'utf8', windowsHide: true, timeout: 5000 });
      const m = out.match(/MachineGuid\s+REG_SZ\s+([0-9a-fA-F-]+)/);
      if (m) return 'win:' + m[1].toLowerCase();
    } else if (process.platform === 'linux') {
      for (const p of ['/etc/machine-id', '/var/lib/dbus/machine-id']) {
        if (fs.existsSync(p)) return 'linux:' + fs.readFileSync(p, 'utf8').trim();
      }
    } else if (process.platform === 'darwin') {
      const out = execFileSync('ioreg', ['-rd1', '-c', 'IOPlatformExpertDevice'], { encoding: 'utf8', timeout: 5000 });
      const m = out.match(/IOPlatformUUID" = "([^"]+)"/);
      if (m) return 'mac:' + m[1];
    }
  } catch (_) { /* fall through */ }
  const nets = os.networkInterfaces();
  const macs = Object.values(nets).flat().filter((n) => n && !n.internal && n.mac && n.mac !== '00:00:00:00:00:00').map((n) => n.mac).sort();
  const cpu = (os.cpus()[0] || {}).model || 'cpu';
  return `fallback:${os.hostname()}|${cpu}|${os.totalmem()}|${macs[0] || 'nomac'}`;
}

/** Returns a machine ID formatted XXXX-XXXX-XXXX-XXXX (16 hex chars). */
function getMachineId() {
  if (cachedMachineId) return cachedMachineId;
  const hash = crypto.createHash('sha256').update('asfan-duct-twin|' + rawMachineSeed()).digest('hex').toUpperCase().slice(0, 16);
  cachedMachineId = hash.match(/.{4}/g).join('-');
  return cachedMachineId;
}

function publicKeyObject(jwk = PUBLIC_JWK) {
  return crypto.createPublicKey({ key: jwk, format: 'jwk' });
}

/** Verifies signature only. Returns true/false. `publicJwk` overrides the embedded key (tests). */
function verifySignature(payloadBytes, signatureBytes, publicJwk = PUBLIC_JWK) {
  try {
    return crypto.verify('sha256', Buffer.from(payloadBytes), { key: publicKeyObject(publicJwk), dsaEncoding: 'ieee-p1363' }, Buffer.from(signatureBytes));
  } catch (_) {
    return false;
  }
}

/**
 * Full validation. Never throws.
 * @returns {{ ok:boolean, status:string, payload?:object, daysLeft?:number|null, key?:string }}
 *  status: valid | expired | not_yet_valid | machine_mismatch | bad_signature | malformed
 */
function validateKey(raw, { now = new Date(), publicJwk = PUBLIC_JWK, machineId = getMachineId() } = {}) {
  let parsed;
  try {
    parsed = parseKey(raw);
  } catch (e) {
    return { ok: false, status: 'malformed', error: e.message };
  }
  if (!verifySignature(parsed.payloadBytes, parsed.signatureBytes, publicJwk)) {
    return { ok: false, status: 'bad_signature', payload: parsed.payload };
  }
  const ev = evaluatePayload(parsed.payload, { now, machineId });
  return { ok: ev.status === 'valid', status: ev.status, daysLeft: ev.daysLeft, payload: parsed.payload, key: parsed.clean };
}

module.exports = { getMachineId, validateKey, verifySignature };
