# Debugging failures that do not report themselves

Most bugs report themselves. The ones below do not.

---

## Turbo reports passes it did not run

This happened while building this repository. `pnpm lint` reported three passing tasks, but one of them was a cached result from before the change that broke it, so a real error went unreported.

Turbo caches by hashing a task's inputs. When it decides nothing relevant
changed, it replays the previous output, including the previous *success*,
without running anything.

**`FULL TURBO` in the output means nothing ran.** Treat it as a reason to check again.

```bash
pnpm lint                    # may be replaying old results
pnpm lint -- --force         # actually run it
```

When a result surprises you, force a fresh run before you believe it, and especially before you tell somebody else it passed.

### ESLint has its own cache underneath

Turbo is not the only layer. ESLint caches per-file in `.cache/.eslintcache`,
so a file you did not touch is not re-linted even when a change elsewhere
made it newly wrong. Changing a type in `packages/contracts` can make code in
`packages/fixtures` invalid without that file changing at all.

```bash
rm -rf packages/*/.cache apps/*/.cache
pnpm lint
```

This is exactly the bug in the story above.

### A green check that verifies nothing

A task that does not exist is worse than a stale pass. `turbo run lint` on a package with no `lint` script does nothing and exits zero, so Turbo reports success and the automated checks pass without checking anything.

This repository had that problem for a while. No package had a `lint` script, so `pnpm lint` found zero tasks, exited zero, and the automated checks showed a pass that verified nothing. When it was wired up properly it found 28 real errors.

**If you add a folder of tests or a new package, add the script and add it to
the config.** A test file nobody runs is worse than no test file, because it
looks like coverage.

The same thing happened with Vitest: `vitest.config.ts` has an `include` list,
and a new folder full of tests silently never ran until it was
added there.

### When Turbo is behaving strangely

```bash
rm -rf .turbo packages/*/.turbo apps/*/.turbo
```

Then run again. If that fixes it, the cache was the problem and the underlying
code is fine.

---

## Next.js

### Your new environment variable does nothing

Next reads `.env` at startup. Adding a value while the dev server is running
does nothing at all, and the symptom is a feature that is silently switched off.

Restart the dev server every time you change `.env`.

### What the `NEXT_PUBLIC_` prefix does

A variable without that prefix is server-only and is `undefined` in the
browser. One with it is compiled into the client bundle and is visible to
anyone who opens devtools.

That is why the Mapbox token is `NEXT_PUBLIC_MAPBOX_TOKEN`. It has to reach the
browser. It is also why you must never prefix anything you would mind a stranger
reading.

### `params` is a Promise now

In Next 15, route parameters arrive as a Promise. The error is confusing if you
have not seen it.

```ts
// Next 14
export default function Page({ params }: { params: { slug: string } }) {
  const { slug } = params;

// Next 15
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
```

### "You're importing a component that needs useState"

Components are server components by default. They run on the server, they can
read the database directly, and they cannot use hooks, browser APIs, or event
handlers.

Add `'use client'` at the top of a file that needs those. Add it as far down the
tree as you can: everything a client component imports becomes client code too,
so putting it at the top of a page pulls the whole page into the browser bundle.

Mapbox needs `window`, so anything touching it is a client component.

### Hydration mismatch

The server rendered one thing and the browser rendered another. Almost always
one of: `Date.now()` or `new Date()` in render, `Math.random()`, or reading
`window` or `localStorage` during the first render.

### The build is strange in a way that makes no sense

```bash
rm -rf apps/web/.next
pnpm dev:web
```

---

## Workspace

### The automated checks failed at the install step and nothing else ran

The lockfile is out of sync with a package.json.

The automated checks run `pnpm install` with the environment variable `CI=true` set, which makes it behave as `--frozen-lockfile` (it refuses to change the lockfile). If a dependency changed and `pnpm-lock.yaml` did not, the
install fails in about thirteen seconds and every check after it is skipped. The
job goes red without a single test having run.

It looks fine locally, because your `node_modules` is already correct.

```bash
pnpm install
git add pnpm-lock.yaml
```

There is a pre-commit hook that catches this, in `.githooks/pre-commit`. It is
enabled automatically by `pnpm install`. It compares the dependency maps before
and after, so renaming a script or editing a description will not stop you. Only
an actual dependency change without the lockfile will. `git commit --no-verify`
skips it either way.


### An import of a package in this repo will not resolve

Run `pnpm install` from the repo root. Workspace
links are created at the root, and this is the most common failure after adding
a package or pulling a change that added one.

### A workspace package's changes are not showing up

Packages here ship TypeScript source rather than build output, so `apps/web`
lists them in `transpilePackages` in `next.config.mjs`. A new shared package
that is not in that list will fail at runtime in a way that looks like a module
resolution bug.

---

### `connect ECONNREFUSED ::1` when the database is running

On an older Node, `localhost` can resolve to the IPv6 address `::1` first while
the database in Docker answers on IPv4, so the connection is refused even
though the container is up. It happened on Node 18 in this project and went
away on Node 22. Check `node --version`. This project needs Node 22.10 or
later, and switching fixes it. If you can't switch yet, using `127.0.0.1` in
place of `localhost` in your connection string gets you going.

## What all of these have in common

Each of these is a tool reporting on something it was not asked to check: a cached pass, a script that does not exist, a config that excludes the file, or an environment variable read before you set it. None of them fail loudly, because from the tool's point of view nothing went wrong.

When a result surprises you, good or bad, force the tool to do the work again
before you build on it.
