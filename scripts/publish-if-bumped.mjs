#!/usr/bin/env node
// Publishes the package if its current version is not on the registry yet,
// so that landing a version bump on main is all a release takes.
//
// Usage: node scripts/publish-if-bumped.mjs [--dry-run]

import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dryRun = process.argv.includes('--dry-run');
const { name, version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

function publishedVersions() {
  try {
    const out = execFileSync('npm', ['view', name, 'versions', '--json'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const versions = JSON.parse(out);
    return new Set(Array.isArray(versions) ? versions : [versions]);
  } catch (error) {
    const stderr = String(error.stderr ?? '');
    // A package nobody has published yet is a first release, not a failure.
    if (stderr.includes('E404')) return new Set();
    throw new Error(`npm view ${name} failed: ${stderr.trim() || error.message}`);
  }
}

function summarize(lines) {
  console.log(lines.join('\n'));
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n`);
  }
}

if (publishedVersions().has(version)) {
  summarize(['### npm publish', '', `\`${name}@${version}\` is already published.`]);
  process.exit(0);
}

const args = ['publish', '--access', 'public'];
if (dryRun) args.push('--dry-run');
console.log(`\n$ npm ${args.join(' ')}`);
execFileSync('npm', args, { cwd: root, stdio: 'inherit' });

summarize([
  `### npm publish${dryRun ? ' (dry run)' : ''}`,
  '',
  `- \`${name}@${version}\``,
]);
