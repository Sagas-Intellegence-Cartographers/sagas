/**
 * Your scorer, checked against the rules.
 *
 *   pnpm --filter @sagas/graph-api test
 *
 * The rules are skipped until you delete the `.skip` below, which is the
 * first thing to do once `similarity` exists. After that, each failure names
 * what it thinks you got wrong, and the focus summary at the end of the run
 * shows which areas are thin. Make them pass, then read your own scorer and
 * work out why it still isn't good enough. That gap is the project.
 */
import { describe } from "vitest";

import { runScoringRules } from "@sagas/fixtures/scoring/rules";

import { scorer } from "./scorer";

// Delete `.skip` once `similarity` exists. It's here so a red build means something is
// broken rather than something is unwritten.
describe.skip("until the scorer exists", () => {
  runScoringRules("graph-api", scorer);
});
