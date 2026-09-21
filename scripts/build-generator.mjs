#!/usr/bin/env node
// Builds tools/license-generator.html from the template: embeds the ASFAN logo and the current public key.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tpl = readFileSync(join(root, 'tools', 'license-generator.template.html'), 'utf8');
const logo = 'data:image/png;base64,' + readFileSync(join(root, 'assets', 'logo.png')).toString('base64');
const pub = JSON.parse(readFileSync(join(root, 'src', 'shared', 'public-key.json'), 'utf8'));
const out = tpl.replace('__LOGO__', logo).replace('__PUB__', JSON.stringify(pub));
writeFileSync(join(root, 'tools', 'license-generator.html'), out);
console.log('tools/license-generator.html built');
