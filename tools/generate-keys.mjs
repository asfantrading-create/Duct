#!/usr/bin/env node
/**
 * Generates a fresh ECDSA P-256 key pair for license signing.
 *  - tools/keys/private.jwk.json  -> KEEP SECRET (seller only, git-ignored)
 *  - src/shared/public-key.json   -> embedded in the app (verifies licenses)
 *  - tools/license-generator.html -> EMBEDDED_PUB constant is patched
 * Usage: node tools/generate-keys.mjs [--force]
 */
import { webcrypto } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const privPath = join(root, 'tools', 'keys', 'private.jwk.json');
const pubPath = join(root, 'src', 'shared', 'public-key.json');
const genPath = join(root, 'tools', 'license-generator.html');
const tplPath = join(root, 'tools', 'license-generator.template.html');
const force = process.argv.includes('--force');

if (existsSync(privPath) && !force) {
  console.error(`Refusing to overwrite existing private key at ${privPath}. Use --force to regenerate (all previously issued licenses will stop validating!).`);
  process.exit(1);
}

const pair = await webcrypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
const priv = await webcrypto.subtle.exportKey('jwk', pair.privateKey);
const pub = await webcrypto.subtle.exportKey('jwk', pair.publicKey);
const pubClean = { kty: pub.kty, crv: pub.crv, x: pub.x, y: pub.y };
const privClean = { kty: priv.kty, crv: priv.crv, x: priv.x, y: priv.y, d: priv.d };

mkdirSync(dirname(privPath), { recursive: true });
writeFileSync(privPath, JSON.stringify(privClean, null, 2) + '\n');
writeFileSync(pubPath, JSON.stringify(pubClean, null, 2) + '\n');

if (existsSync(genPath)) {
  const html = readFileSync(genPath, 'utf8');
  const patched = html.replace(/const EMBEDDED_PUB = \{[^\n]*\};/, `const EMBEDDED_PUB = ${JSON.stringify(pubClean)};`);
  writeFileSync(genPath, patched);
}
if (existsSync(tplPath)) {
  // template keeps the __PUB__ placeholder; scripts/build-generator.mjs re-embeds the key and logo
  const { execFileSync } = await import('node:child_process');
  try { execFileSync(process.execPath, [join(root, 'scripts', 'build-generator.mjs')], { stdio: 'inherit' }); } catch (_) {}
}
console.log('Private key written to', privPath);
console.log('Public key written to', pubPath);
console.log('Public JWK:', JSON.stringify(pubClean));
