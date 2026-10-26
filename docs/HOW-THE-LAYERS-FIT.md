# How the three layers fit together

One photograph, followed from the moment somebody hands it over to the moment
somebody reads about it. Each step says which layer does the work and what it
produces. The place and the people are invented.

The three layers:

- **The content layer** takes records in: what people hand over, their files,
  the transcripts and translations of them, and the contributor's choices for
  each one. It has a plain screen for handing things over.
- **The intelligence layer** owns claims: the graph they form, and the scoring
  that works out weight, independence and what needs attention. Later it adds a
  plain screen for writing claims, and composes the sections and passages a page
  shows.
- **The experience layer** builds the map and the reading experience: what a
  reader sees, and what they are pointed at next. Later it replaces the plain
  screens where polish matters.

Each layer is a small system that runs on its own. None of them calls another
directly this semester. They share the contract in `packages/contracts` and the
fixture data in `packages/fixtures`, and each one builds against those.

---

## 1. Somebody hands over a photograph

**Content layer.**

A contributor, using a guest profile, finds a corner shop on the map and uploads
a photograph of its front, with a note: "My grandmother's shop, I think. I don't
know when this was taken."

That produces a **record** at the **site**. An image record needs a note, so the
note is required here. Audio and video records do not require one.

The contributor can also say what they want from it. This is a proposal, not yet
in the contract: short **question prompts** on the record, such as "Does anyone
know the year?" and "Who is standing in the doorway?".

Nothing has been claimed yet. A record with no claim is complete as it is.

Events: `record_submitted`, then `media_processed` once the file has been
checked and resized.

## 2. Somebody else reads it and makes a claim

**Intelligence layer**, which takes claims in and models them.

A second contributor recognises the shop and writes: "That's the shop on the
corner of Fourth and Main, around 1950. The man in the doorway is the owner,
Mr. Ferris."

That is a **claim**. The photograph is its **source record**, and together they
start a **conversation** about that photograph. (Conversation is a working
idea that may be dropped. The source record is what groups these claims.) The claim is made of
**details**:

| Detail | Kind | Value |
|---|---|---|
| "corner of Fourth and Main" | place | Fourth and Main |
| "around 1950" | date | c. 1950 |
| "Mr. Ferris" | person | Ferris |

The person who handed over the photograph and the person who read a claim out of
it are different people. That is normal, and it is part of what makes
contributing easy: someone can hand over a photograph without asserting anything
about it.

Event: `claim_submitted`.

## 3. A third person disputes one detail

**Intelligence layer.**

A third contributor writes: "It can't be 1950. The awning in the photo went up in
1956, and I have the city directory page showing the change." They attach a scan
of the directory page.

That is a **dispute**. It targets one detail, the date, so the place and the
owner's name stay undisputed. A dispute is a claim of its own, so it can carry
evidence like any other claim. It carries reasoning, which a
dispute always has to. The directory scan is an **evidence record**, attached to
the dispute to back it up.

Event: `claim_disputed`. A dispute is a claim of its own, with a dispute edge
pointing from it to the detail it disagrees with, so it can hold an evidence
record. The fixture doesn't attach the scan that way yet. There, the scan is
submitted as a record at the site and the dispute's reasoning cites it.

## 4. A fourth person adds to another detail

**Intelligence layer**, for the claim. The audio clip itself is a record, which
the content layer takes in.

A fourth contributor records a short audio clip: "Mr. Ferris was my uncle. He ran
that shop until the sixties."

That is an **extension**. It adds to the "Mr. Ferris" detail without contradicting
anything. An extension names the detail it adds to, and leaves that empty when
it's about the whole claim. The new information lives in the extension's own record, the audio
clip, which is its evidence. The conversation's source record is still the
photograph.

Event: `claim_extended`.

## 5. Readers leave passovers

The **experience layer** renders the buttons. The **intelligence layer** decides what they mean.

Several people read the conversation. Two leave `sounds_right` on the original
claim. One leaves `dont_know`. These are **passovers**. They create no edge, and
they are not votes. They change how far the claim travels. They say nothing about
whether it is true.

Event: `passover_recorded`.

## 6. The intelligence layer reads the graph

**Intelligence layer.**

The intelligence layer's main focus is claims. From the graph it can see:

- The date detail has two readings, one with an evidence record behind it.
- The owner detail has an extension from a different contributor.
- The two `sounds_right` passovers are agreement. Agreement is never
  independent evidence.
- If the audio clip's claim cited a window of a longer recording, the part of
  its score that comes from the claim itself would wait until that window had a
  transcript.
- The photograph is the source record of the conversation, so both claims in it
  rely on it. The audio clip is evidence for one claim. A record's only score is
  its citation count, how many claims rely on it.
- If question prompts are adopted, one of them, "Who is standing in the
  doorway?", has an answer, and the other, the year, is in dispute.

From that it works out a **score** for each claim and each detail, made of
named parts, which decides the order on the page, and what needs attention,
which decides what gets suggested. Neither is ever shown to a person as a
number.

How independence is worked out, and the exact weighting, is the intelligence
layer's design work and is open.

## 7. Somebody reads the page

**Experience layer.**

A reader finds the shop on the map and opens it. They see the photograph, the
claim about it, and, at the words "around 1950", both readings of the date side
by side, each with its reasoning and who gave it. There is no winner and no
count. Mr. Ferris links to the relative's audio clip. Every claim leads back to
its author and its records.

The page is divided into sections. Each section has a heading and a passage
built from its claims, and selecting a phrase in the passage opens the claims
behind it. How headings and passages are produced is still open, and the
sections in the fixtures are invented. `apps/web/PAGE-MODEL.md` walks through
them.

The suggestion interface might also show this conversation to a reader who has
contributed about the same neighbourhood before, because the year is still in
dispute. Which signals drive suggestions is open.

---

## Where this example lives in the fixtures

This walkthrough is the `corner-shop` site in `packages/fixtures`, across the
four states `t0` to `t3`. `packages/fixtures/test/corner-shop.test.ts` checks
that the data keeps the shape described here. At `t3` a second, unrelated
conversation (a photograph of the shop's sign) names the same owner, which is
what two separate branches asserting the same detail looks like.

One step above can't be shown in the data yet: the question prompts, which are
an open design question ("Is every ask in the system one kind of object?").
The top of `fixtures/corner-shop/events.ts` lists what each state shows.
