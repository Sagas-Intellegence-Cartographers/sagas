# apps/capture-web — the contributing interface

This app is yours, and like `apps/capture-api` it ships empty on purpose.

This is the screen somebody is looking at when they hand over something that
matters to them: recording audio, uploading a photograph, typing up what their
grandmother said, or adding a translation to somebody else's record.

It is separate from `apps/web` on purpose. That app is the reading experience
and belongs to another team. Reading and contributing are different problems,
with different users in different states of mind, and merging them means two
teams editing the same files.

## Why the content layer has its own interface

You can't put an API in front of a person, so this layer needs a screen. It is
meant to be built close to the community it serves, so that you can watch
somebody use it and see where they hesitate, what they don't understand, and
what they decide not to say. None of that is visible from a test suite.

## What goes here, roughly

- Recording audio in the browser, with playback before submitting
- Choosing photographs and documents, and uploading them
- The submission form: what happened, where, who said so, in what language
- Attaching a record to a place on a map
- The terms in `docs/TERMS.md`, shown to a profile before its first
  contribution and again whenever the version changes. The version accepted is
  stored on the profile (`termsAcceptedVersion`) and every record stores the
  version it was made under (`termsVersion`, currently `provisional-0.1`)
- What the contributor chooses for each record: whether the student teams may
  see it, whether it's public now, later or never, what happens to a photo's
  location, and whether it mentions other people (`recordChoices` in the
  contract)
- Handing over several records together as one collection, with a note
- A web page as a record of its own
- Adding a transcript or a translation of part of somebody else's recording,
  one time window at a time
- Reporting something, with the reason attached

Writing claims, disputes and extensions belongs to the intelligence layer, which
will have its own plain screen for it.

## Choosing a framework

There is a placeholder in `src/index.ts` and nothing else. `apps/web` is Next,
but you are not obliged to match it and there are decent arguments for something
lighter. Pick, write down why in this README, and move on. It is not worth a
week.

To turn it into a real app, add your dependencies, add `dev` and `start`
scripts so `pnpm dev` picks it up, add a `test` script so the automated checks
run it, and then run `pnpm install` from the repository root.

## Contributors are guest ids, with no login

There isn't any, and you should not build any.

A contributor is a **guest id**. It is generated on first visit, kept in browser
storage, and sent with every request. No login, no password, no email. Somebody who
clears their browser is a new person from then on. Their earlier contributions
are not deleted. They stay attributed to the old id and become unreachable. That
is an accepted cost of letting people contribute without signing up.

Logins matter eventually and they are not this semester's problem. Whether a
guest can later claim what they contributed, and how anybody proves who they
are, are open questions written up in
[`docs/DESIGN-QUESTIONS.md`](../../docs/DESIGN-QUESTIONS.md).

## Contributing in a language other than English

Somebody contributing in a language other than English must be able to finish
and submit. Their record exists the moment they hand it over, pinned to the place,
attributed to them, and visible on the map, with no English anywhere.

It is easy to build the version that blocks. A record has no language requirement. A *claim* does, and that never
holds up the record. So the interface never tells somebody their contribution
is incomplete because it is not in English. It is complete. Something further
downstream is waiting, and that is not their problem to solve.

See `apps/capture-api/README.md` for how translation gets proposed and confirmed.
