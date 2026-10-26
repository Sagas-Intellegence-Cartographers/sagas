import { mkdirSync, writeFileSync } from 'node:fs';
import { siteFixtures } from '../fixtures';
import { reduceToStates } from '../src/reduce';
import type { GraphState } from '@sagas/contracts';

mkdirSync('states', { recursive: true });

const built: { key: string; states: GraphState[] }[] = [];

for (const fixture of siteFixtures) {
  const states = reduceToStates(fixture.events, fixture.cuts, fixture.narrative);
  for (const s of states) {
    writeFileSync(`states/${fixture.key}.${s.stateId}.json`, JSON.stringify(s, null, 2));
  }
  writeFileSync(`states/${fixture.key}.all.json`, JSON.stringify(states, null, 2));
  built.push({ key: fixture.key, states });
}

/** One index so a consumer can list what exists without reading a directory. */
writeFileSync(
  'states/index.json',
  JSON.stringify(
    {
      sites: built.map((b) => {
        const first = b.states[0];
        if (!first) throw new Error(`${b.key} produced no states`);
        return {
          key: b.key,
          slug: first.site.slug,
          name: first.site.name,
          stateIds: b.states.map((s) => s.stateId),
        };
      }),
    },
    null,
    2,
  ),
);

/* ------------------------------------------------------------------ */
/* Readable dump, so the fixture can be judged without a renderer.      */
/* ------------------------------------------------------------------ */

const bar = (n: number, max = 20) => '█'.repeat(Math.round((n / max) * 24)).padEnd(24, '·');

function dump(s: GraphState) {
  const i = s.integrity;
  console.log('\n' + '='.repeat(78));
  console.log(`${s.stateId.toUpperCase()}  ${s.label}`);
  console.log(`as of ${s.asOf.slice(0, 10)}   ·   ${s.eventIdsApplied.length} events applied` +
    (s.eventIdsSincePrevious.length !== s.eventIdsApplied.length
      ? ` (+${s.eventIdsSincePrevious.length} since previous)` : ''));
  console.log('='.repeat(78));
  console.log(
    `integrity ${String(i.overall).padStart(3)}/100  ` +
    `claims ${i.totalClaims}  contributors ${i.independentContributors}  ` +
    `corroboration ${(i.corroborationDepth * 100).toFixed(0)}%  ` +
    `disputes ${i.activeDisputes}  dated ${i.datedClaims}  untranslated ${i.awaitingTranslation}`,
  );

  for (const c of s.claims) {
    const label = c.claim.awaitingTranslation ? 'AWAITING TRANSLATION' : c.confidence.toUpperCase();
    console.log(`\n  ${bar(c.weight)} ${c.weight.toFixed(2).padStart(5)}  ${label}`);
    console.log(`  ${c.claim.id}  ·  ${c.contributor.displayName}` +
      (c.contributor.institution ? ` (${c.contributor.institution})` : '') +
      `  ·  ${c.claim.sourceType}`);

    if (c.claim.awaitingTranslation) {
      console.log(`  [${c.claim.sourceLanguage}] ${c.claim.sourceLanguageText}`);
      console.log(`  → kept and readable in the original; outside the claim graph`);
    } else {
      const text = c.claim.text.length > 150 ? c.claim.text.slice(0, 147) + '...' : c.claim.text;
      console.log(`  "${text}"`);
    }

    if (c.passover.sounds_right) {
      console.log(`  "sounds right" from ${c.passover.sounds_right} (${c.independentRecordCount} independent record(s))`);
    }
    if (c.translations.length > 1) {
      console.log(`  ${c.translations.length} coexisting renderings, each attributed`);
    }
    for (const td of c.translationDisputes) {
      console.log(`  ! rendering contested: ${td.reasoning.slice(0, 100)}...`);
    }
    for (const es of c.detailStatuses) {
      if (!es.disputes.length) continue;
      const readings = es.competingValues
        .map((v) => `"${v.value}" (${v.count} contributor${v.count === 1 ? '' : 's'})`)
        .join('  vs  ');
      console.log(`  ⚡ ${es.detail.kind} "${es.detail.excerpt}" contested → ${readings}`);
    }
    const pv = c.passover;
    if (pv.sounds_right + pv.dont_know + pv.dont_care > 0) {
      console.log(`  passover: ${pv.sounds_right} sounds-right, ${pv.dont_know} don't-know, ${pv.dont_care} don't-care`);
    }
  }
}

for (const b of built) {
  console.log('\n\n' + '#'.repeat(78));
  console.log(`# ${b.key}`);
  console.log('#'.repeat(78));
  b.states.forEach(dump);
}

const totalEvents = siteFixtures.reduce((n, f) => n + f.events.length, 0);
const totalStates = built.reduce((n, b) => n + b.states.length, 0);
console.log(
  `\n\nWrote ${totalStates} states across ${built.length} sites ` +
  `from ${totalEvents} authored events.\n`,
);
