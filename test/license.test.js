'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { webcrypto } = require('node:crypto');
const { generateKeyPairJwk, buildPayload, signPayload } = require('../src/shared/license-sign');
const { parseKey, evaluatePayload, planOf, addMonths, PREFIX } = require('../src/shared/license-format');
const lic = require('../src/main/license');

const { publicJwk, privateJwk } = generateKeyPairJwk();
const MACHINE = 'ABCD-1234-EF56-7890';

test('lifetime key signs and validates', () => {
  const key = signPayload(buildPayload({ name: 'جامعة الاختبار', type: 'lifetime', role: 'supervisor', seats: 30 }), privateJwk);
  assert.ok(key.startsWith(PREFIX));
  const r = lic.validateKey(key, { publicJwk, machineId: MACHINE });
  assert.equal(r.ok, true); assert.equal(r.status, 'valid'); assert.equal(r.payload.role, 'supervisor'); assert.equal(r.payload.seats, 30); assert.equal(r.daysLeft, null);
});

test('tampered payload is rejected', () => {
  const key = signPayload(buildPayload({ name: 'Customer', type: 'lifetime' }), privateJwk);
  const body = key.slice(PREFIX.length); const dot = body.indexOf('.');
  const payloadB64 = body.slice(0, dot);
  // change a character in the payload part
  const flipped = payloadB64.slice(0, 10) + (payloadB64[10] === 'A' ? 'B' : 'A') + payloadB64.slice(11);
  const r = lic.validateKey(PREFIX + flipped + body.slice(dot), { publicJwk, machineId: MACHINE });
  assert.equal(r.ok, false); assert.ok(['bad_signature', 'malformed'].includes(r.status));
});

test('wrong public key rejects signature', () => {
  const other = generateKeyPairJwk().publicJwk;
  const key = signPayload(buildPayload({ name: 'Customer', type: 'lifetime' }), privateJwk);
  const r = lic.validateKey(key, { publicJwk: other, machineId: MACHINE });
  assert.equal(r.status, 'bad_signature');
});

test('subscription expiry and days left', () => {
  const key = signPayload(buildPayload({ name: 'Sub', type: 'subscription', expires: '2026-12-31' }), privateJwk);
  const valid = lic.validateKey(key, { publicJwk, machineId: MACHINE, now: new Date('2026-12-01T10:00:00Z') });
  assert.equal(valid.ok, true); assert.equal(valid.daysLeft, 31);
  const expired = lic.validateKey(key, { publicJwk, machineId: MACHINE, now: new Date('2027-01-01T00:00:00Z') });
  assert.equal(expired.ok, false); assert.equal(expired.status, 'expired');
});

test('machine binding', () => {
  const key = signPayload(buildPayload({ name: 'Bound', type: 'lifetime', machine: MACHINE.toLowerCase() }), privateJwk);
  assert.equal(lic.validateKey(key, { publicJwk, machineId: MACHINE }).ok, true);
  assert.equal(lic.validateKey(key, { publicJwk, machineId: 'FFFF-0000-FFFF-0000' }).status, 'machine_mismatch');
});

test('malformed keys never throw', () => {
  for (const bad of ['', 'hello', 'ADDT1-', 'ADDT1-abc', 'REDT1-abc.def', 'ADDT1-!!!.###', null, undefined, 42]) {
    const r = lic.validateKey(bad, { publicJwk });
    assert.equal(r.ok, false); assert.equal(r.status, 'malformed');
  }
});

test('modules & evaluatePayload helpers', () => {
  const p = buildPayload({ name: 'X', type: 'lifetime', modules: ['DESIGN_LAB', 'ASSESSMENT'] });
  assert.deepEqual(p.modules, ['DESIGN_LAB', 'ASSESSMENT']);
  const parsed = parseKey(signPayload(p, privateJwk));
  assert.equal(parsed.payload.name, 'X');
  assert.equal(evaluatePayload(parsed.payload, { now: new Date() }).status, 'valid');
});

test('signature format is WebCrypto compatible (browser generator/verifier)', async () => {
  const key = signPayload(buildPayload({ name: 'Web', type: 'lifetime' }), privateJwk);
  const parsed = parseKey(key);
  const pub = await webcrypto.subtle.importKey('jwk', { kty: publicJwk.kty, crv: publicJwk.crv, x: publicJwk.x, y: publicJwk.y }, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
  const ok = await webcrypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, pub, parsed.signatureBytes, parsed.payloadBytes);
  assert.equal(ok, true);
});

test('embedded public key matches the seller private key when present', { skip: !fs.existsSync(path.join(__dirname, '..', 'tools', 'keys', 'private.jwk.json')) }, () => {
  const priv = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'tools', 'keys', 'private.jwk.json'), 'utf8'));
  const key = signPayload(buildPayload({ name: 'Embedded', type: 'lifetime' }), priv);
  assert.equal(lic.validateKey(key, { machineId: MACHINE }).ok, true);
});

test('machine id format', () => {
  assert.match(lic.getMachineId(), /^[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/);
});

test('subscription plans: monthly/yearly compute expiry, legacy keys classified by duration, default sale is yearly', () => {
  const m = buildPayload({ name: 'M', plan: 'monthly', issued: '2026-01-31' });
  assert.equal(m.type, 'subscription'); assert.equal(m.plan, 'monthly'); assert.equal(m.expires, '2026-02-28');
  const y = buildPayload({ name: 'Y', plan: 'yearly', issued: '2026-03-10' });
  assert.equal(y.expires, '2027-03-10'); assert.equal(planOf(y), 'yearly');
  const d = buildPayload({ name: 'Default' }); assert.equal(d.type, 'subscription'); assert.equal(d.plan, 'yearly'); assert.match(d.expires, /^\d{4}-\d{2}-\d{2}$/);
  const c = buildPayload({ name: 'C', expires: '2026-06-30', issued: '2026-01-01' }); assert.equal(c.plan, undefined); assert.equal(planOf(c), 'custom');
  assert.equal(planOf({ type: 'subscription', issued: '2026-01-01', expires: '2026-12-31' }), 'yearly');
  assert.equal(planOf({ type: 'subscription', issued: '2026-01-01', expires: '2026-01-31' }), 'monthly');
  assert.equal(planOf({ type: 'lifetime' }), 'internal');
  assert.equal(addMonths('2024-01-31', 1), '2024-02-29');
  assert.throws(() => buildPayload({ name: 'X', plan: 'weekly' }));
  // signed monthly key validates and reports days left
  const key = signPayload(buildPayload({ name: 'Sub', plan: 'monthly', issued: '2026-01-01' }), privateJwk);
  const { payload } = parseKey(key); assert.equal(payload.expires, '2026-02-01');
  assert.equal(evaluatePayload(payload, { now: new Date('2026-01-20T12:00:00Z') }).daysLeft, 13);
});
