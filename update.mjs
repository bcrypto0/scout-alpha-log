/**
 * Refresh the public log, then commit + push if anything changed.
 *   node update.mjs            # publish events older than 24h
 *   node update.mjs --dry-run  # write nothing, just report
 *
 * WHY THE DELAY: this repo is the proof, not the product. The live feed —
 * flips detected minutes ago — is what a subscriber pays for. Publishing the
 * log in real time would hand that away for free, so only events older than
 * PUBLISH_DELAY_HOURS are ever written here. Same principle as the in-app
 * teaser: the delay IS the paywall, and the history is still fully checkable.
 *
 * Safe to run repeatedly: it is a no-op when the delayed slice hasn't changed.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SOURCE = 'C:\\Users\\b39cr\\Projects\\IT\\data\\team\\listing_events.jsonl';
const TARGET = `${HERE}\\data\\listing_events.jsonl`;
const README = `${HERE}\\README.md`;
const PUBLISH_DELAY_HOURS = 24;
const DRY = process.argv.includes('--dry-run');

const git = (...args) =>
  execFileSync('git', args, { cwd: HERE, encoding: 'utf8' }).trim();

// --- 1. read source, keep only the aged slice -------------------------------
const cutoff = Date.now() / 1000 - PUBLISH_DELAY_HOURS * 3600;
const kept = [];
let skippedFresh = 0;
let malformed = 0;

for (const line of readFileSync(SOURCE, 'utf8').trim().split('\n')) {
  let row;
  try {
    row = JSON.parse(line);
  } catch {
    malformed += 1;
    continue;
  }
  if (typeof row.ts !== 'number') {
    malformed += 1;
    continue;
  }
  if (row.ts > cutoff) {
    skippedFresh += 1; // still inside the paid window
    continue;
  }
  kept.push(line);
}

if (kept.length === 0) {
  console.error('refusing to publish an empty log — source unreadable?');
  process.exit(1);
}

// --- 2. stats for the README -----------------------------------------------
let pre = 0;
let minTs = Infinity;
let maxTs = 0;
const coins = new Set();
const bySource = {};
for (const line of kept) {
  const r = JSON.parse(line);
  bySource[r.source ?? '(unknown)'] = (bySource[r.source ?? '(unknown)'] ?? 0) + 1;
  if (r.coin) coins.add(r.coin);
  minTs = Math.min(minTs, r.ts);
  maxTs = Math.max(maxTs, r.ts);
  if (r.payload?.is_pre_listing_signal === true) pre += 1;
}
const day = (ts) => new Date(ts * 1000).toISOString().slice(0, 10);
const days = Math.max(1, Math.round((maxTs - minTs) / 86_400));

const table = [
  '| | |',
  '|---|---|',
  `| Events logged | **${kept.length.toLocaleString()}** |`,
  `| Of which pre-listing config flips | **${pre.toLocaleString()}** |`,
  `| Distinct tokens seen | **${coins.size.toLocaleString()}** |`,
  `| Period covered | **${day(minTs)} → ${day(maxTs)}** (${days} days) |`,
  `| Average | ~${(kept.length / days).toFixed(0)} events/day |`,
  '| Polling interval | **300 s** (5 minutes), per exchange |',
  `| Published with a delay of | **${PUBLISH_DELAY_HOURS}h** (the live feed is the paid product) |`,
].join('\n');

const rows = Object.entries(bySource)
  .sort((a, b) => b[1] - a[1])
  .map(([k, v]) => `| \`${k}\` | ${v.toLocaleString()} |`)
  .join('\n');
const coverage = ['| Source | Events |', '|---|---|', rows].join('\n');

const block = `<!--STATS-->\n${table}\n\n### Coverage by source\n\n${coverage}\n<!--/STATS-->`;
const readme = readFileSync(README, 'utf8').replace(
  /<!--STATS-->[\s\S]*<!--\/STATS-->/,
  block,
);

console.log(
  `kept ${kept.length} rows (${pre} pre-listing) | held back ${skippedFresh} fresh` +
    (malformed ? ` | skipped ${malformed} malformed` : ''),
);

if (DRY) {
  console.log('dry run — nothing written');
  process.exit(0);
}

writeFileSync(TARGET, `${kept.join('\n')}\n`);
writeFileSync(README, readme);

// --- 3. commit + push only if something actually changed --------------------
if (!git('status', '--porcelain')) {
  console.log('no change — nothing to publish');
  process.exit(0);
}
git('add', '-A');
git('commit', '-m', `Log update: ${kept.length} events through ${day(maxTs)}`);
git('push', 'origin', 'main');
console.log(`published through ${day(maxTs)} and pushed`);
