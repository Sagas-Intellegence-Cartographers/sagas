# The shared packages

Most of `packages` is used by more than one team, which is why it sits here
instead of inside one team's app. Every team pulls it from upstream (the
sponsor's repository your fork came from), so a change to `contracts` or
`fixtures` reaches all three layers. `read-model` is the one exception,
because only the experience layer uses it.

| Package | What it holds |
|---|---|
| `contracts` | The model: what a site, a record, a claim and a score look like, in `src/model.ts`. Everything else is shaped by it. |
| `fixtures` | The test data everyone uses, and the rules the content and intelligence layers' tests run against. |
| `read-model` | How the experience layer reads its data. See its README. |

## What's in `fixtures`

| What | Where |
|---|---|
| Example places, each an event log | `fixtures/fixtures/`: the corner shop, the freight depot, the lunch counter, the two Hays buildings and the bench. The corner shop is the one the guides walk through, and the comment at the top of each `events.ts` says what it shows. |
| The state of each place, worked out from its log | `fixtures/states/`, rebuilt by `pnpm fixtures:build`. Never edit these by hand. |
| The scoring graph, a builder for test graphs, and the scorer's rules | `fixtures/scoring/`: `graph.ts`, `build.ts` and `rules.ts` |
| The content layer's rules | `fixtures/capture/rules.ts` |
| Short labels for what an interface has to handle, and placeholder tests for the open questions | `fixtures/acceptance/`. The reasoning behind the labels is in `packages/fixtures/README.md`. |

## Experimenting with your own copy

Your fork is yours. To try your own data or a different model, copy what you
need into your app and point your code at the copy. Nothing upstream changes.

A change to the shared model or the shared data is different, because the
other teams are meant to adopt it. Open a pull request upstream for it, or
tell the sponsor, who will put it in a release.
