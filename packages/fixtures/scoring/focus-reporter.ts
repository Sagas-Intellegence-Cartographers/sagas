/**
 * Prints where the scoring rules are thin, after every run.
 *
 * Nothing here is a list somebody keeps up to date. It counts, per area of
 * the rules, how many run, how many are still placeholders (`it.todo`), and how
 * many failed against your scorer, then labels the area. The labels are a
 * starting point and the thresholds are arbitrary:
 *
 *   weak       fewer than 3 rules that run, or more placeholders than rules
 *   moderate   3 to 6 rules that run, and no more placeholders than rules
 *   solid      7 or more rules that run, and no placeholders
 *
 * Use it in a vitest config:
 *
 *   reporters: ['default', '@sagas/fixtures/scoring/focus-reporter']
 */
import type { Reporter, TestCase, TestModule } from "vitest/node";

interface Area {
  running: number;
  open: number;
  failed: number;
  skipped: number;
}

const RULES_PREFIXES = ["scoring rules: ", "capture rules: "];

/** The area is the block directly under "scoring rules: ...". */
function areaOf(test: TestCase): string | null {
  const names: string[] = [];
  let parent: TestCase["parent"] = test.parent;
  while (parent.type === "suite") {
    names.unshift(parent.name);
    parent = parent.parent;
  }
  const top = names.findIndex((n) => RULES_PREFIXES.some((p) => n.startsWith(p)));
  if (top < 0) return null;
  return names[top + 1] ?? null;
}

function label(a: Area): string {
  if (a.running < 3 || a.open > a.running) return "weak";
  if (a.running >= 7 && a.open === 0) return "solid";
  return "moderate";
}

export default class FocusReporter implements Reporter {
  onTestRunEnd(modules: readonly TestModule[]): void {
    const areas = new Map<string, Area>();
    for (const m of modules) {
      for (const test of m.children.allTests()) {
        const name = areaOf(test);
        if (!name) continue;
        const a = areas.get(name) ?? {
          running: 0,
          open: 0,
          failed: 0,
          skipped: 0,
        };
        const state = test.result().state;
        if (test.options.mode === "todo") a.open += 1;
        else if (state === "skipped") a.skipped += 1;
        else a.running += 1;
        if (state === "failed") a.failed += 1;
        areas.set(name, a);
      }
    }
    if (areas.size === 0) return;

    const rows = [...areas.entries()].sort(([, x], [, y]) => {
      const rank = (a: Area): number =>
        ({ weak: 0, moderate: 1, solid: 2 })[label(a)] ?? 3;
      return rank(x) - rank(y) || y.open - x.open;
    });
    const lines = rows.map(([name, a]) => {
      const parts = [`${a.running} running`, `${a.open} open`];
      if (a.failed) parts.push(`${a.failed} failing`);
      if (a.skipped) parts.push(`${a.skipped} skipped`);
      return `  ${label(a).padEnd(9)} ${name.padEnd(30)} ${parts.join(", ")}`;
    });
    const allSkipped =
      rows.every(([, a]) => a.running === 0) &&
      rows.some(([, a]) => a.skipped > 0);
    console.log(["", "Focus areas, weakest first:", ...lines].join("\n"));
    if (allSkipped) {
      console.log(
        "  Every rule was skipped. The test file says what it is waiting for: a scorer to exist, or a running API.",
      );
    }
    console.log("");
  }
}
