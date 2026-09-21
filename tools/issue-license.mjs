#!/usr/bin/env node
/**
 * Command-line license issuer (alternative to tools/license-generator.html).
 * Sales licences are subscriptions: --plan yearly (default) or --plan monthly, or a custom --expires date.
 * --staff issues an internal never-expiring licence for ASFAN employees only (legacy alias: --type lifetime).
 * Examples:
 *   node tools/issue-license.mjs --name "جامعة العلوم التطبيقية" --plan yearly --supervisor --seats 40
 *   node tools/issue-license.mjs --name "Duct Factory LLC" --plan monthly --modules DESIGN_LAB,FACTORY_TWIN
 *   node tools/issue-license.mjs --name "Ahmad Ali" --expires 2027-06-30 --machine 1A2B-3C4D-5E6F-7A8B --email a@b.com
 *   node tools/issue-license.mjs --name "ASFAN – Ahmad (staff)" --staff --supervisor
 * Options: --key <path to private.jwk.json> (default tools/keys/private.jwk.json), --out <file.lic>
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { buildPayload, signPayload } = require(join(root, 'src', 'shared', 'license-sign.js'));
const { MODULE_IDS } = require(join(root, 'src', 'shared', 'modules.js'));

const args = {}; const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) { const a = argv[i]; if (a.startsWith('--')) { const k = a.slice(2); const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true; args[k] = v; } }
if (!args.name) { console.error('Usage: node tools/issue-license.mjs --name "Customer" [--plan monthly|yearly] [--expires YYYY-MM-DD] [--staff] [--machine ID] [--modules A,B] [--supervisor] [--seats N] [--email x] [--notes x] [--key private.jwk.json] [--out file.lic]\n  Sales: --plan yearly (default) | --plan monthly | custom --expires date.  Internal staff licence without expiry: --staff (never for customers).'); process.exit(1); }
if (args.plan && !['monthly', 'yearly'].includes(args.plan)) { console.error('--plan must be monthly or yearly (use --expires YYYY-MM-DD for a custom date)'); process.exit(1); }
const staff = args.staff === true || args.type === 'lifetime';
const privateJwk = JSON.parse(readFileSync(args.key || join(root, 'tools', 'keys', 'private.jwk.json'), 'utf8'));
const modules = args.modules ? String(args.modules).split(',').map((s) => s.trim().toUpperCase()).filter(Boolean) : undefined;
if (modules) for (const m of modules) if (!MODULE_IDS.includes(m)) { console.error('Unknown module', m, 'valid:', MODULE_IDS.join(',')); process.exit(1); }
const payload = buildPayload({ name: args.name, email: args.email, type: staff ? 'lifetime' : 'subscription', plan: staff ? undefined : (args.plan || (args.expires ? 'custom' : 'yearly')), expires: args.expires || null, machine: args.machine || null, notes: args.notes, modules, role: args.supervisor ? 'supervisor' : undefined, seats: args.seats });
const key = signPayload(payload, privateJwk);
console.log(key);
console.error(JSON.stringify(payload, null, 2));
const out = args.out || join(process.cwd(), `${String(args.name).replace(/[^\w.-]+/g, '_')}.lic`);
writeFileSync(out, key + '\n');
console.error('written', out);
