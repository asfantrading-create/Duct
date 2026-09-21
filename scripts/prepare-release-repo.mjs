#!/usr/bin/env node
/**
 * Pre-publish check for the GitHub releases repository (electron-builder `publish` target).
 * GitHub cannot create a release/tag in an EMPTY repository ("Published releases must have a valid tag"), so this
 * script makes the target repository ready: creates it if missing (public, with README), adds a first commit
 * (README.md) if it is empty, and reports clear errors when the token lacks access.
 * Env: GH_TOKEN (RELEASES_TOKEN or GITHUB_TOKEN), HAS_RELEASES_TOKEN ("true"/"false", informational).
 */
import { readFileSync } from 'node:fs';

const yml = readFileSync(new URL('../electron-builder.yml', import.meta.url), 'utf8');
const pub = yml.split(/\npublish:/)[1] || '';
const owner = (/owner:\s*(\S+)/.exec(pub) || [])[1];
const repo = (/repo:\s*(\S+)/.exec(pub) || [])[1];
const token = process.env.GH_TOKEN;
const hasReleasesToken = process.env.HAS_RELEASES_TOKEN === 'true';
const fail = (msg) => { console.error(`\n::error::${msg}\n`); process.exit(1); };
if (!owner || !repo) fail('publish.owner / publish.repo not found in electron-builder.yml');
if (!token) fail('GH_TOKEN is empty. Add the RELEASES_TOKEN secret (personal access token with repo scope).');

async function api(method, path, body) {
  const r = await fetch(`https://api.github.com${path}`, { method, headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'asfan-duct-release-prep', ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
  let data = null; try { data = await r.json(); } catch (_) { /* no body */ }
  return { status: r.status, data };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const README = `# ASFAN Duct Digital Twin — التوأم الرقمي لمجاري الهواء

هذا المستودع يحوي ملفات تثبيت البرنامج فقط. أحدث نسخة لويندوز:
This repository only hosts the Windows installers. Latest version:

**https://github.com/${owner}/${repo}/releases/latest/download/ASFAN-Duct-Digital-Twin-Setup.exe**

الملفات \`latest.yml\` و\`.blockmap\` يستخدمها التحديث التلقائي داخل البرنامج، لا تحذفها.
\`latest.yml\` and the \`.blockmap\` files are used by the in-app auto-updater; do not delete them.

ASFAN Trading Co. — شركة أصفان · info@asfanco.com · WhatsApp +962 77 614 0404
`;

console.log(`Releases repository: ${owner}/${repo} (token: ${hasReleasesToken ? 'RELEASES_TOKEN' : 'GITHUB_TOKEN fallback'})`);
let r = await api('GET', `/repos/${owner}/${repo}`);
if (r.status === 404) {
  if (!hasReleasesToken) fail(`Repository ${owner}/${repo} is not reachable with the workflow token. Add a RELEASES_TOKEN secret (classic PAT with "repo" scope) so the workflow can create/publish to it.`);
  console.log('Repository not found — creating it as a PUBLIC repository with a README…');
  const u = await api('GET', `/users/${owner}`);
  const createPath = u.data && u.data.type === 'Organization' ? `/orgs/${owner}/repos` : '/user/repos';
  const c = await api('POST', createPath, { name: repo, description: 'ASFAN Duct Digital Twin — Windows installers & auto-update feed', private: false, auto_init: true, has_issues: false, has_projects: false, has_wiki: false });
  if (c.status !== 201) fail(`Could not create ${owner}/${repo}: HTTP ${c.status} ${JSON.stringify(c.data)}`);
  await sleep(3000);
  r = await api('GET', `/repos/${owner}/${repo}`);
} else if (r.status === 401 || r.status === 403) {
  fail(`The token cannot access ${owner}/${repo} (HTTP ${r.status}). Check that RELEASES_TOKEN is valid, not expired, and has the "repo" scope.`);
} else if (r.status !== 200) fail(`Unexpected response for ${owner}/${repo}: HTTP ${r.status} ${JSON.stringify(r.data)}`);

const info = r.data;
if (info.permissions && info.permissions.push === false) fail(`The token has no write access to ${owner}/${repo}. Use a RELEASES_TOKEN that belongs to the repository owner with "repo" scope.`);
if (info.private) console.warn(`::warning::${owner}/${repo} is PRIVATE — customers cannot download or auto-update until it is made public (Settings → Change visibility → Make public).`);
const branch = info.default_branch || 'main';

const commits = await api('GET', `/repos/${owner}/${repo}/commits?per_page=1`);
const empty = commits.status === 409 || (commits.status === 200 && Array.isArray(commits.data) && commits.data.length === 0);
if (empty) {
  console.log(`Repository is empty — adding README.md as the first commit on "${branch}" so releases/tags can be created…`);
  const put = await api('PUT', `/repos/${owner}/${repo}/contents/README.md`, { message: 'Add README (download link)', content: Buffer.from(README, 'utf8').toString('base64'), branch });
  if (put.status !== 201 && put.status !== 200) fail(`Could not create README.md in ${owner}/${repo}: HTTP ${put.status} ${JSON.stringify(put.data)}`);
  await sleep(2000);
  console.log('First commit created.');
} else if (commits.status !== 200) fail(`Could not read commits of ${owner}/${repo}: HTTP ${commits.status} ${JSON.stringify(commits.data)}`);
else console.log(`Repository has commits (latest: ${commits.data[0].sha.slice(0, 7)}).`);
console.log(`OK — ${owner}/${repo} is ready for publishing (${info.private ? 'private' : 'public'}, default branch ${branch}).`);
