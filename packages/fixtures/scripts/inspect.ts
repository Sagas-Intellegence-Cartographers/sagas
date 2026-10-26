/**
 * What is a claim's score made of?
 *
 *   pnpm inspect                          every claim at t3, one line each
 *   pnpm inspect cl-cs-shop               one claim, with its terms
 *   pnpm inspect --state t1               a different snapshot
 *   pnpm inspect --state t1 cl-cs-shop
 *   pnpm inspect --site hays-1114         a different site (directory name)
 *
 * The fixtures' scores come from an invented stand-in (`src/stand-in-score.ts`)
 * in the shape the intelligence layer's scorer returns. The numbers mean
 * nothing. This prints the terms so you can see the shape a real score has.
 */

import { FLAGSHIP, loadSiteState } from '../acceptance';
import type { ClaimState, GraphState } from '@sagas/contracts';

const argv = process.argv.slice(2);
const stateFlag = argv.indexOf('--state');
const stateId = stateFlag === -1 ? 't3' : (argv[stateFlag + 1] ?? 't3');
const siteFlag = argv.indexOf('--site');
const siteKey = siteFlag === -1 ? FLAGSHIP : (argv[siteFlag + 1] ?? FLAGSHIP);
const flagValues = new Set([stateFlag, siteFlag].filter((i) => i !== -1).map((i) => i + 1));
const claimId = argv.find((a, i) => !a.startsWith('--') && !flagValues.has(i));

const state: GraphState = loadSiteState(siteKey, stateId);

function one(c: ClaimState) {
  console.log('\n' + '='.repeat(72));
  console.log(`${c.claim.id}   ${state.stateId}`);
  console.log('='.repeat(72));
  console.log(`  ${c.contributor.displayName}${c.contributor.fictional ? '  (invented)' : ''}`);
  const text = c.claim.awaitingTranslation ? c.claim.sourceLanguageText : c.claim.text;
  console.log(`  "${(text ?? '').slice(0, 120)}${(text ?? '').length > 120 ? '...' : ''}"`);

  console.log(`\n  SCORE ${c.score.score.toFixed(2)}   (stand-in; confidence ${c.confidence})`);
  for (const t of c.score.terms) {
    console.log(`    ${t.family.padEnd(10)} ${t.name.padEnd(22)} ${t.value.toFixed(2)}`);
  }
  console.log('\n  DETAILS');
  for (const d of c.score.details) {
    const status = c.detailStatuses.find((s) => s.detail.id === d.detailId);
    console.log(`    ${(status?.detail.kind ?? '').padEnd(10)} ${(status?.detail.value ?? d.detailId).padEnd(28)} ${d.score.toFixed(2)}`);
  }

  const contested = c.detailStatuses.filter((e) => e.disputes.length > 0);
  if (contested.length) {
    console.log('\n  WHERE PEOPLE DISAGREE');
    for (const e of contested) {
      const readings = e.competingValues
        .map((v) => `"${v.value}" (${v.count} contributor${v.count === 1 ? '' : 's'})`)
        .join('  vs  ');
      console.log(`    ${e.detail.kind}: ${readings}`);
    }
  }
}

if (claimId) {
  const c = state.claims.find((x) => x.claim.id === claimId);
  if (!c) {
    console.error(`No claim "${claimId}" in ${stateId}. Available:`);
    for (const x of state.claims) console.error(`  ${x.claim.id}`);
    process.exit(1);
  }
  one(c);
} else {
  console.log(`\n${state.stateId}  ${state.label}\n`);
  console.log('  score  independent  disputes  confidence          claim');
  for (const c of state.claims) {
    const disputes = c.detailStatuses.reduce((n, e) => n + e.disputes.length, 0);
    console.log(
      `  ${c.score.score.toFixed(2).padStart(5)}` +
      `  ${String(c.independentRecordCount).padStart(11)}` +
      `  ${String(disputes).padStart(8)}` +
      `  ${c.confidence.padEnd(18)}  ${c.claim.id}`,
    );
  }
  console.log('\n  pnpm inspect <claim-id> for one of them in full.\n');
}
