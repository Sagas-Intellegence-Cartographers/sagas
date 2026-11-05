# Working together

How the semester runs: when we meet, how pull requests get reviewed, and what
happens when the contract changes.

Read it once at the start.

### When we meet

**Check-in, 30 minutes.** Weekly for the first month while scope is still being
worked out, then every other week once you know what you're building. Your
programme's exact day is set with your team.

**Office hours, 30 minutes, every week, right before the check-in.**
It runs if there's an agenda and is canceled if there isn't. It exists so
that "we're stuck" has somewhere to go that isn't an email at eleven at night.

**A short note before each check-in.** There is a template in
[`CHECK-IN-TEMPLATE.md`](./CHECK-IN-TEMPLATE.md), including a different version
for the first one, when nothing is built yet.

It covers what you built, what you're unsure about, and what you assumed. It also
doubles as the office-hours agenda: if the note has open questions in it we use
the slot, and if it doesn't we skip it.

**We care most about the assumptions in that note.** Writing down "we assumed X" is normal, and it's how we find out a document was unclear before you've built two weeks on top of it. An assumption you write down can turn into a contract change.

**Where distance allows, we meet in person once**, around week three or four, while your team's design is still being settled and a conversation in a room can still change it.

### Pull requests

**Pull requests opened by the stated cutoff get reviewed before that check-in.** Later ones
roll to the next cycle. That's not a penalty. It's so you can predict when feedback arrives instead of
pushing something rushed at 5:55pm.

**Open one pull request per feature, and open it early as a draft.** We would rather see it at 20% and say "not that direction" than read 800 lines and ask you to start again. If a pull request takes more than about fifteen minutes to read, it is probably two.


### When the contract changes

`@sagas/contracts` and `@sagas/fixtures` are sponsor-owned, and they *will*
change during the semester. A change here is how something one team finds, or something learned from somebody in the community, reaches everyone else. Four rules make that safe:

1. **Changes land on Sundays.** The contract cannot move mid-week, and the
   upstream watch reports a change on the Monday morning after it lands. This
   limits when we can publish a change. It does not mean a change comes every
   week, and we expect three to five across a semester.
2. **Nothing lands cold.** A significant change is raised at a check-in *before*
   it is built, then published the following Sunday. You will hear "we might
   change X" before you see X change.
3. **Your fork is pinned to a tag.** A change is *available* to you, never
   imposed. Pulling forward is a decision made together at a check-in, not
   something that happens to you mid-sprint.

   **You hear about changes every week and adopt them when you choose.** Don't pull every Monday, because that puts you back on a moving target. Instead, `.github/workflows/upstream-contract-watch.yml`
   runs each Monday morning, compares your pinned contract version against
   upstream, and opens an issue with the changelog if they differ. Nothing in
   your fork changes; you just find out. **Enable Actions on your fork once
   after forking.** GitHub disables them by default, so open the Actions tab and
   click through the confirmation.
4. **Every change carries a version bump, a CHANGELOG entry, and its reason.**
   The reason matters more than the diff. For example, "dialect can't be recovered from text after the fact, so it has to be captured at contribution time" tells you something the diff never will.

   There is **one** changelog for all three layers, and entries name layers rather than universities, so a change that starts on one layer is visible to the other two. A team can keep a changelog of its own app inside that app's folder, as the experience layer does in `apps/web/CHANGELOG.md`.

**Freeze windows.** The contract does not move after your team's design lock
(around week three, when your team settles what it is building) except to fix something genuinely broken, and it does not
move at all in the last three weeks of a semester. Anything learned during a
freeze goes into the notes and lands the following term. If the contract
changes outside these rules, that is a mistake on our side. Say so.

### What to do when you are blocked or disagree

**If you're blocked, work around it and tell us. Don't wait.** The layers are set up so that no team has to wait on another. [`docs/GIT.md`](./GIT.md) explains how work moves between the three forks and how to keep going when you need something from another team.

**Disagree with the design.** These scopes describe where the work looked like it
should go from where we were standing in August. Many of the problems here are open, and you may see something we have not. If a scope looks wrong, say so.

