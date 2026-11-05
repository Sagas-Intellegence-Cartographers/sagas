# Git, for this repo specifically

This is not a git tutorial. It covers the parts a tutorial cannot tell you,
because they are about this project's shape: three universities, three forks,
one shared contract, and no shared branch between any of them.

Two things here will catch you out if you have only ever used git on a repository
you own. Your fork does not update itself, and the only route to another team is
through upstream.

---

## How upstream and your fork relate

There is one upstream repository, `Civum/sagas`. Each team forks it into its own
GitHub organization. All of your work happens in your fork, and your fork is
what gets graded.

```
Civum/sagas                     upstream, sponsor-owned
   └── YourOrg/sagas            your fork, where you work
          └── your laptop       your clone
```

**Your fork does not update itself.** Upstream can change and nothing happens to
your fork until you decide it should, so nothing shifts under you mid-sprint.

**Upstream changes are available, never imposed.** The contract moves on Sundays,
it is announced at a check-in before it lands, and pulling it
forward is a decision you make together at a check-in. See "When the contract
changes" in the root README for the rules; this file is how to carry them out.

---

## How work reaches the other two schools

You cannot see their repositories and they cannot see yours. There is no shared
branch, no shared database, and no way to pull a change directly from another
team. Every path between the three schools runs through upstream:

```
YourOrg/sagas  ──PR──▶  Civum/sagas  ──Sunday──▶  TheirOrg/sagas
                                                  (when they choose to pull)
```

Four things follow from that.

**A change another layer needs is a pull request.** If the
content layer works out that dialect has to be captured at contribution time,
telling the experience team at a check-in does not change their code. The
contract change does.

**It takes weeks.** Open a pull request, we review it, it lands on a
Sunday, and the other teams pull it when they decide to at a check-in. Two to
three weeks from idea to it being in somebody else's build is normal, and it is
the cost of nobody's work moving under them mid-sprint. If you know in week four that you will need something in week nine,
raise it in week four.

**Nobody is ever blocked waiting for it.** That is what the fixtures are for.
Every team builds against the same sponsor-maintained data, so the experience
layer can render disputes that the intelligence layer has not implemented and
the content layer can build submission for a graph nobody is scoring yet. If you
find yourself waiting on another school, something has gone wrong with the
design and we want to hear about it.

**Disagreeing with another layer's model is expected.** Bring it to a check-in,
and if it changes the contract, the changelog records why.

## Reviewing your work versus contributing upstream

This trips people up because both involve pull requests.

**Review of your work happens in your own repository.** You open a pull request
inside your fork, teammate to teammate, and the sponsor reads and comments on it
there. Nothing merges into `Civum/sagas`, and the automated checks run on your
own code.

That is what a check-in is reviewing, and it is what you are graded on.

**A contribution upstream is separate and rare.** It is something small with a
reason behind it, such as a contract change, a fixture gap you closed, or a
correction to these docs. Expect a handful across a semester.

If you find yourself cherry-picking commits into a pull request against upstream
so that somebody can look at your week's work, stop. That is the first kind of
review going through the second kind of channel, and it will give you merge
conflicts, an upstream branch nobody wants to merge, and a review that arrives
late.

### The sponsor needs to be able to see your repository

Forks of a public repository are public, so if you forked normally, reading and
commenting works with no setup at all.

If your team created a private repository instead of forking, nobody outside it
can review anything. Add the sponsor as a collaborator in week one, before it is
the reason a check-in is useless.

Either way, add them to your organization if you want them to see the automated check logs when a
build fails, or for an approval on a pull request to count toward branch
protection. Neither is required to read your code and leave comments; both are
worth ten minutes.

## Who owns which files

| Path | Change it in your fork? | How to change it for everyone |
|---|---|---|
| Your layer's apps and packages | Freely. They're yours. | Nothing to do. |
| Another layer's app | **No.** You will never need to. | Raise it at a check-in. |
| `packages/contracts` | **No.** | Pull request upstream, raised at a check-in first. |
| `packages/fixtures` | **No.** | Pull request upstream. Closing a known gap is welcome. |
| `docs/`, `README.md`, `SETUP.md` | Corrections, yes | Pull request upstream. A setup problem you hit is likely to hit everyone. |
| `tooling/`, root `package.json`, `docker-compose.yml` | Yes, but it costs you | Pull request upstream, or carry the conflict on every pull. |

That last row is the one to think about. Nothing stops you changing shared
tooling in your fork, and nothing will break immediately. But every upstream
pull that changes the same file will conflict with yours, and you resolve it
again each time. If a change to
shared tooling is worth making, it is worth sending upstream so it stops being
your problem.

## Once, after you fork

**Add upstream as a remote.** Your clone knows about your fork. It does not know
about ours until you tell it.

```bash
git remote add upstream https://github.com/Civum/sagas.git
git remote -v          # origin = your fork, upstream = ours
```

`origin` is yours and you push to it. `upstream` is ours and you only ever fetch
from it.

**Turn on Actions, then the watch.** GitHub disables workflows on new forks.
Open the Actions tab in your fork and click through the confirmation. Then, since
GitHub's documentation says scheduled workflows on a fork are disabled by
default, pick **Upstream contract watch** in the left sidebar and click **Enable
workflow**. The watch reports by opening an issue, so Issues have to be on for
the fork too (**Settings**, under **Features**). Without all three, the Monday
contract watch never runs and you will not hear when the contract moves.

**Give the sponsor access.** If you forked a public repository, this is already
done and there is nothing to do. If your team made a private repository, add
them now, or they cannot review anything.

**Note which version you are on.**

```bash
cat packages/contracts/src/version.ts
```

That number is your pin. It does not change on its own.

---

## Finding out that upstream moved

You do not have to remember to check. `.github/workflows/upstream-contract-watch.yml`
runs every Monday morning, compares your contract version against ours, and opens
an issue in your fork if they differ, with the changelog in it.

Nothing in your fork changes. You just find out.

If you want to check by hand:

```bash
git fetch upstream --tags
git log --oneline HEAD..upstream/main    # what we have that you don't
```

---

## Pulling upstream forward

**Do this deliberately, at a check-in.** Pulling
every week undoes the point of being pinned, and skipping a version is fine.

When you have decided to:

```bash
git checkout main
git pull origin main                   # make sure your main is current
git fetch upstream --tags
git merge upstream/main                # or the specific tag you agreed on
```

Merge, do not rebase. Rebasing rewrites history that your teammates have already
pulled, and on a shared `main` that is how a team loses an afternoon.

If the sync goes through a pull request on GitHub, merge it with **Create a
merge commit**. A squash copies upstream's changes into one new commit without
recording that you merged upstream, so git keeps comparing against the old
starting point. Each later sync then has more to reconcile, and lines that
either side has edited since conflict. How you merge your own feature branches
is your team's choice.

Then, before you trust it:

```bash
pnpm install                           # dependencies may have moved
pnpm fixtures:build                    # regenerate derived states
pnpm lint && pnpm typecheck && pnpm test
```

If `fixtures:build` produces a diff in `packages/fixtures/states/`, that is
expected after a contract change and the regenerated files should be committed.
The automated checks compare the committed states against what the event log
produces, so a stale state file fails the build.

### If the merge conflicts

Conflicts in `packages/contracts` or `packages/fixtures` mean somebody on your
team edited sponsor-owned files. Take upstream's version. During a merge, git
calls the branch you are merging in "theirs", so the flag is `--theirs`:

```bash
git checkout --theirs packages/contracts packages/fixtures
```

Then work out why the edit happened, because it is usually a real need that
should have been a pull request to us. Bring it to the check-in.

Conflicts anywhere else are ordinary conflicts in your own work.

---

## Sending something back to us

Contributions upstream are welcome and reviewed. A pull request that fixes a
design question, closes a fixture gap, or corrects something we got wrong is
part of the point of the project.

```bash
git checkout -b fix/whatever-it-is     # branch in YOUR fork
# ... work, commit ...
git push origin fix/whatever-it-is
```

Then open the pull request on GitHub with the base set to `Civum/sagas` and the
compare set to your branch.

**Keep it small and open it early as a draft.** We would rather look at the shape
at twenty percent and say "not that direction" than review eight hundred lines
and ask you to redo it. If a pull request takes more than about fifteen minutes
to read, it is probably two pull requests.

**Say why in the description.** For a change to the model, the reasoning matters
more than the diff. "A translator pointed out that dialect cannot be recovered
from text after the fact, so it has to be captured at contribution time" tells us
something the diff never will.

---

## Working inside your own team

How you run branches is your team's call and part of what you are graded on.
What follows are the things that tend to go wrong when several people share one
repository for a semester.

### Merge main into your branch often

The longer a branch lives, the further it drifts from main, and when it lands
you meet every conflict at once, in code you wrote a fortnight ago and no longer
remember.

```bash
git checkout main && git pull
git checkout your-branch
git merge main            # do this most days, not at the end
```

Merging main into your branch often means you meet conflicts one or two at a
time, while the change is still fresh. It feels like more work and it is much
less.

### Feature folders exist so you stop colliding

Each feature gets its own directory under `src/features/<feature>/`, so two
people editing different features are editing different files and git never has
to guess.

Collisions still happen at the shared edges: `src/components/ui/`, `src/lib/`,
and route files that compose several features. Mention it in your team channel
before you change one of those.

### Three files never to hand-merge

**`pnpm-lock.yaml`.** Never resolve this by picking lines. It is generated, it is
enormous, and a hand-merged lockfile installs something nobody has tested.

```bash
git checkout --ours pnpm-lock.yaml
pnpm install
git add pnpm-lock.yaml
```

**`packages/fixtures/states/*.json`.** Also generated. Regenerate rather than
resolve:

```bash
pnpm fixtures:build
git add packages/fixtures/states
```

The automated checks compare these against what the event log produces, so a
hand-edited state file fails the build even if the conflict markers are gone.

**`.env`.** It should never be in a conflict because it should never be
committed. If it is, that is the thing to fix.

### Review each other before you send anything to us

Open pull requests inside your own fork, team member to team member, so problems
get caught before a sponsor check-in.

The same rule we use applies to you: small and early beats large and finished.

### The pre-commit hook

There is one, in `.githooks/pre-commit`, and `pnpm install` turns it on for you.
It has no dependencies, and you can read it.

It checks a single thing: whether you are committing a *dependency* change
without the lockfile. That combination fails the automated checks at the install
step before any check runs, which is a confusing way for a build to fail.

It compares the dependency maps rather than the whole file, so editing a script
or a description will not trigger it. `git commit --no-verify` skips it if it
ever gets something wrong.

### Two things not to commit

**`.env`.** It's gitignored. If a token does get committed, rotate it rather than
deleting the commit, because it is already in the history and in every clone
anybody has pulled.

**`node_modules` or `.next`.** Also gitignored. If your diff is four thousand
files, stop and look at what you staged.

---

## When it has gone wrong

**"I committed to main and I meant to branch."** Nothing is lost.

```bash
git branch my-work                 # save the commits on a new branch
git reset --hard origin/main       # put main back
git checkout my-work
```

**"I have a merge in progress and I want out."**

```bash
git merge --abort
```

**"I pulled upstream and now nothing builds."** The cause is usually dependencies.

```bash
pnpm install
```

Then `pnpm lint && pnpm typecheck && pnpm test` to find out what actually broke.
If it is the contract, that is a conversation rather than a thing to fix
yourself. Say so at the check-in.

**"I have lost work."** Probably not.

```bash
git reflog
```

Every commit you have made is in there for weeks, including ones on branches you
deleted. Find the hash and `git checkout` it.

---

## What not to do

**Do not force push to a shared branch.** `--force` on `main` will delete
somebody else's work and there is no undo they will find easily.

**Do not edit `packages/contracts` or `packages/fixtures` in your fork.** They
are sponsor-owned, and a local edit turns every future upstream pull into a
conflict. If something in there is wrong, and it will be, open a pull request or
raise it at a check-in. That is a contribution and we want it.
