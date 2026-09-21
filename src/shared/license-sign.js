'use strict';
/** License signing (seller side / tests). Node only — never ship the private key inside the app. */
const crypto = require('node:crypto');
const { PREFIX, bytesToB64u, addMonths } = require('./license-format');

/**
 * Builds a licence payload. Sales default: a yearly subscription (never lifetime by accident).
 *  - plan 'monthly' | 'yearly': expiry computed from the issue date unless `expires` is given
 *  - plan 'custom' (or an explicit `expires` without plan): subscription until that date
 *  - type 'lifetime': internal never-expiring licence for ASFAN staff only
 */
function buildPayload({ name, email, type, plan, expires = null, machine = null, notes, modules, role, seats, issued }) {
  if (!name) throw new Error('name required');
  const issuedOn = issued || new Date().toISOString().slice(0, 10);
  if (plan && !['monthly', 'yearly', 'custom'].includes(plan)) throw new Error('plan must be monthly|yearly|custom');
  if (!type) type = 'subscription';
  if (type !== 'subscription' && type !== 'lifetime') throw new Error('type must be subscription|lifetime');
  if (type === 'subscription' && !plan) plan = expires ? 'custom' : 'yearly';
  if (type === 'subscription' && plan !== 'custom' && !expires) expires = addMonths(issuedOn, plan === 'monthly' ? 1 : 12);
  if (type === 'subscription' && !/^\d{4}-\d{2}-\d{2}$/.test(String(expires || ''))) throw new Error('expires (YYYY-MM-DD) required for subscription');
  return {
    v: 1, id: crypto.randomUUID(), name: String(name).trim(), email: email ? String(email).trim() : undefined, type,
    plan: type === 'subscription' && plan !== 'custom' ? plan : undefined,
    issued: issuedOn, expires: type === 'subscription' ? expires : null,
    machine: machine ? String(machine).trim().toUpperCase() : null, notes: notes || undefined,
    modules: Array.isArray(modules) && modules.length ? modules : undefined, role: role === 'supervisor' ? 'supervisor' : undefined,
    seats: Number.isFinite(Number(seats)) && Number(seats) > 0 ? Number(seats) : undefined,
  };
}

function signPayload(payload, privateJwk) {
  const key = crypto.createPrivateKey({ key: privateJwk, format: 'jwk' });
  const data = Buffer.from(JSON.stringify(payload));
  const sig = crypto.sign('sha256', data, { key, dsaEncoding: 'ieee-p1363' });
  return `${PREFIX}${bytesToB64u(data)}.${bytesToB64u(sig)}`;
}

function generateKeyPairJwk() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
  return { publicJwk: publicKey.export({ format: 'jwk' }), privateJwk: privateKey.export({ format: 'jwk' }) };
}

module.exports = { buildPayload, signPayload, generateKeyPairJwk };
