'use strict';
/**
 * License key format (compatible with the ASFAN license generator):
 *   ADDT1-<base64url(JSON payload)>.<base64url(ECDSA P-256 / SHA-256 signature, IEEE P1363 r||s)>
 * Payload: { v:1, id, name, email?, type:'lifetime'|'subscription', issued:'YYYY-MM-DD',
 *            expires:'YYYY-MM-DD'|null, machine:'XXXX-XXXX-XXXX-XXXX'|null, notes?,
 *            modules?: string[], role?: 'supervisor', seats?: number }
 * This file is dependency-free so it can run in Node (main process) and in the browser (tests/generator).
 */
const PREFIX = 'ADDT1-';

function b64uToBytes(s) {
  const p = s.replace(/-/g, '+').replace(/_/g, '/');
  const padded = p + '='.repeat((4 - (p.length % 4)) % 4);
  if (typeof Buffer !== 'undefined') return new Uint8Array(Buffer.from(padded, 'base64'));
  const bin = atob(padded);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

function bytesToB64u(bytes) {
  let b64;
  if (typeof Buffer !== 'undefined') b64 = Buffer.from(bytes).toString('base64');
  else b64 = btoa(String.fromCharCode(...new Uint8Array(bytes)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Splits a raw key string into { payloadBytes, signatureBytes, payload }. Throws on malformed input. */
function parseKey(raw) {
  const clean = String(raw || '').replace(/\s+/g, '');
  if (!clean.startsWith(PREFIX)) throw new Error('BAD_PREFIX');
  const body = clean.slice(PREFIX.length);
  const dot = body.indexOf('.');
  if (dot <= 0 || dot === body.length - 1) throw new Error('BAD_FORMAT');
  const payloadBytes = b64uToBytes(body.slice(0, dot));
  const signatureBytes = b64uToBytes(body.slice(dot + 1));
  let payload;
  try {
    payload = JSON.parse(new TextDecoder().decode(payloadBytes));
  } catch (e) {
    throw new Error('BAD_PAYLOAD');
  }
  if (!payload || payload.v !== 1 || !payload.name || !payload.type) throw new Error('BAD_PAYLOAD');
  return { payloadBytes, signatureBytes, payload, clean };
}

/** Evaluates time/machine constraints. Returns { status: 'valid'|'expired'|'not_yet_valid'|'machine_mismatch', daysLeft } */
function evaluatePayload(payload, { now = new Date(), machineId = null } = {}) {
  const today = now.toISOString().slice(0, 10);
  if (payload.type === 'subscription') {
    if (!payload.expires) return { status: 'expired', daysLeft: 0 };
    if (today > payload.expires) return { status: 'expired', daysLeft: 0 };
  }
  if (payload.issued && today < payload.issued) return { status: 'not_yet_valid', daysLeft: null };
  if (payload.machine && machineId && payload.machine.toUpperCase() !== String(machineId).toUpperCase()) {
    return { status: 'machine_mismatch', daysLeft: null };
  }
  let daysLeft = null;
  if (payload.type === 'subscription') {
    const ms = new Date(payload.expires + 'T23:59:59Z').getTime() - now.getTime();
    daysLeft = Math.max(0, Math.ceil(ms / 86400000));
  }
  return { status: 'valid', daysLeft };
}

module.exports = { PREFIX, parseKey, evaluatePayload, b64uToBytes, bytesToB64u };
