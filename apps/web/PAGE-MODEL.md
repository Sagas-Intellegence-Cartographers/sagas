# Page model: the corner shop

`page-model.html`, beside this file, is a gray-box wireframe of one site page,
built from the corner shop fixture. Its layout still applies, and its data is out of
date since contract 2.5.0, so read the data from `packages/fixtures/states`. Open it in a browser. Pick a moment from t0
to t3, then select a dotted phrase in the passage to see the claims behind it.

It shows what information appears on a site page and where each part comes from
in the contract. It does not decide how anything looks. Layout, type, color and
motion are the designer's, and the gray boxes are there so nobody mistakes them
for a style.

The place, the people and everything they say are invented. The sections and
passages come from contract 2.1.0.

## The seven regions

The numbers match the pins in the wireframe.

1. **The place.** `site.name`, `site.aka`, `site.address`. How well documented
   the place is, said in words, never as a number. The real signal is
   `integrity`, and the wireframe uses a simple stand-in. A thin page reads as
   early. It never reads as failing.
2. **What people handed over.** `records`. Whether a record is a source or
   evidence comes from the claims that use it (`sourceRecordId`,
   `evidence`). A record with nothing claimed about it is complete.
3. **Section heading.** `sections[].heading`. Invented for now. What a heading
   is derived from is open, and it should not change every time a claim
   arrives.
4. **The passage.** `compositions[].text`, with `spans` marking the phrases that
   lead somewhere. How a passage is written is not decided. The fixture's
   passage at t2 uses wording both date readings fit, which is one way to do it.
5. **The claims behind a phrase.** `spans[].claimIds`, and `detailIds` when the
   phrase is about one detail. Claims are ordered by `weight`, which is never
   shown. Weight is on the claim and on each detail. An
   extension sits under the claim it adds to (`claim.target.claimId`). Your page highlights
   the detail's `excerpt` in the claim's own words, from `start` to `end`.
6. **Two readings of one detail.** `detailStatuses[].competingValues`, in the
   order they arrived, side by side with equal prominence, each with who gave it.
   The reasoning comes from `detailStatuses[].disputes`. No winner and no count.
7. **Leaving a passover.** "Sounds right", "don't know", "don't care". Three
   equal choices with no counts. How to offer them without nudging people toward
   what others chose is an open design question.

## What to look at in each state

- **t0.** A photograph and nothing claimed. There are no sections, so the page
  shows the record on its own and invites somebody who knows the place to add
  to it.
- **t1.** One section. Every phrase in the passage leads to the same claim. Nothing
  has pointed at it yet, so it has no details.
- **t2.** The year is disputed. The passage says "sometime in the 1950s", which
  both readings fit, and selecting it shows both readings side by side.
  "Mr. Ferris" leads to the claim and to the relative's extension under it.
- **t3.** A second section, for the sign, from a different photograph. One of its
  phrases leads to a whole claim with no detail, so both kinds of phrase appear.

## The rules every design keeps

These are limit 1 in `STATEMENT-OF-WORK.md`.
