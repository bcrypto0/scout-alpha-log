/**
 * Reproduce every number in the README from the raw log.
 *   node verify.mjs
 * No dependencies. Reads only data/listing_events.jsonl.
 */
import { readFileSync } from 'node:fs';

const lines = readFileSync(new URL('./data/listing_events.jsonl', import.meta.url), 'utf8')
  .trim()
  .split('\n');

let total = 0;
let pre = 0;
let malformed = 0;
let minTs = Infinity;
let maxTs = 0;
const coins = new Set();
const bySource = {};
const preBySource = {};

for (const line of lines) {
  let row;
  try {
    row = JSON.parse(line);
  } catch {
    malformed += 1;
    continue;
  }
  total += 1;
  const source = row.source ?? '(unknown)';
  bySource[source] = (bySource[source] ?? 0) + 1;
  if (row.coin) coins.add(row.coin);
  if (typeof row.ts === 'number') {
    minTs = Math.min(minTs, row.ts);
    maxTs = Math.max(maxTs, row.ts);
  }
  if (row.payload?.is_pre_listing_signal === true) {
    pre += 1;
    preBySource[source] = (preBySource[source] ?? 0) + 1;
  }
}

const day = (ts) => new Date(ts * 1000).toISOString().slice(0, 10);
const days = (maxTs - minTs) / 86_400;

console.log('events logged .............', total);
console.log('pre-listing config flips ..', pre);
console.log('distinct tokens ...........', coins.size);
console.log('period ....................', `${day(minTs)} -> ${day(maxTs)} (${days.toFixed(0)} days)`);
console.log('average ...................', `${(total / days).toFixed(1)} events/day`);
if (malformed) console.log('malformed lines ...........', malformed);

console.log('\nby source:');
for (const [k, v] of Object.entries(bySource).sort((a, b) => b[1] - a[1])) {
  const p = preBySource[k] ? ` (${preBySource[k]} pre-listing)` : '';
  console.log(`  ${k.padEnd(22)}${String(v).padStart(5)}${p}`);
}
