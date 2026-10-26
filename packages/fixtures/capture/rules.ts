/**
 * Guidelines for the content layer's API, written as tests.
 *
 *   import { runCaptureRules } from '@sagas/fixtures/capture/rules';
 *   runCaptureRules('capture-api', 'http://localhost:3001');
 *
 * These run against your API while it's running, over HTTP. They say what has
 * to come in and go out, and nothing about how you build it inside. The ones
 * that run check the record endpoints. The placeholders (`it.todo`) are where
 * your layer is heading next: uploads, storage, media. Each carries its
 * context in the comment above it, including the libraries this project
 * expects, as a hint. A different library is fine if you can say why.
 *
 * Each guideline, or the block it sits in, says what prompted it. If you think a guideline is wrong, open a
 * pull request against this file with your reasoning.
 */
import { describe, expect, it } from "vitest";

import { newSourceRecord, sourceRecord } from "@sagas/contracts";

/** A written record as it arrives: no id, because your database makes one. */
const arriving = () => ({
  siteId: "site-001",
  contributorId: "guest-abc",
  text: "My great-grandmother cooked in the boarding house kitchen.",
  language: "en",
  submission: "submitted",
  media: [],
  // What the contributor chose for this record, and the terms it was made
  // under (contract 2.4.0). Private unless they say otherwise.
  choices: {
    rightToShare: true,
    studentAccess: false,
    public: "later",
    location: "remove",
    mentionsPeople: "not_sure",
  },
  termsVersion: "provisional-0.1",
  createdAt: new Date().toISOString(),
});

async function post(base: string, body: unknown): Promise<Response> {
  return fetch(`${base}/records`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function runCaptureRules(name: string, base: string): void {
  describe(`capture rules: ${name}`, () => {
    describe("records in and out", () => {
      // Prompted by: contract 2.2.0. A record arrives without an id, and the
      // database makes one.
      it("accepts a written record without an id, and sends back a stored record with one", async () => {
        const body = arriving();
        expect(
          newSourceRecord.safeParse(body).success,
          "the test record itself is wrong",
        ).toBe(true);
        const res = await post(base, body);
        expect(res.status).toBe(201);
        const stored: unknown = await res.json();
        const parsed = sourceRecord.safeParse(stored);
        expect(
          parsed.success,
          `what came back isn't a record: ${JSON.stringify(parsed.error?.flatten())}`,
        ).toBe(true);
        expect(parsed.data?.id, "the stored record has no id").toBeTruthy();
      });

      it("gives the same record back by its id", async () => {
        const created = (await (await post(base, arriving())).json()) as {
          id: string;
        };
        const res = await fetch(`${base}/records/${created.id}`);
        expect(res.status).toBe(200);
        const fetched = (await res.json()) as { id: string; text?: string };
        expect(fetched.id).toBe(created.id);
        expect(fetched.text).toBe(arriving().text);
      });

      it("answers 404 for a record that does not exist", async () => {
        const res = await fetch(`${base}/records/999999999`);
        expect(res.status).toBe(404);
      });

      it("refuses a record with neither text nor files, with a 400", async () => {
        const res = await post(base, { ...arriving(), text: undefined });
        expect(res.status).toBe(400);
      });

      // Prompted by: "one record is one artifact" (contract 2.2.0). A photo and
      // a recording are two records.
      it("refuses files of different kinds in one record, with a 400", async () => {
        const file = (kind: string, id: string) => ({
          id,
          recordId: "pending",
          kind,
          storageKey: `records/pending/${id}/file`,
          contentType: "application/octet-stream",
          byteSize: 1,
          processing: "uploaded",
          derivatives: [],
          createdAt: new Date().toISOString(),
        });
        const res = await post(base, {
          ...arriving(),
          text: undefined,
          note: "A photo and a recording.",
          media: [file("image", "m1"), file("audio", "m2")],
        });
        expect(res.status).toBe(400);
      });
    });

    describe("choices and links", () => {
      // Prompted by: contract 2.4.0. Every record keeps what its contributor
      // chose for it (who may see it, whether it's public, what happens to a
      // photo's location) and the terms version it was made under.
      it("refuses a record without the contributor's choices, with a 400", async () => {
        const { choices: _choices, ...body } = arriving();
        const res = await post(base, body);
        expect(res.status).toBe(400);
      });

      it("refuses a record without the terms version, with a 400", async () => {
        const { termsVersion: _terms, ...body } = arriving();
        const res = await post(base, body);
        expect(res.status).toBe(400);
      });

      it("keeps a record's choices exactly as they were given", async () => {
        const body = arriving();
        const stored = (await (await post(base, body)).json()) as {
          choices?: unknown;
          termsVersion?: string;
        };
        expect(stored.choices).toEqual(body.choices);
        expect(stored.termsVersion).toBe(body.termsVersion);
      });

      // Prompted by: "How does a link become evidence?" in
      // docs/DESIGN-QUESTIONS.md. A web page is a record of its own.
      it("accepts a web page as a record with no files", async () => {
        const res = await post(base, {
          ...arriving(),
          text: undefined,
          note: "A newspaper notice about the place.",
          link: { url: "https://example.org/notice" },
        });
        expect(res.status).toBe(201);
      });
    });

    describe("uploads", () => {
      // Prompted by: "How an upload works" in apps/capture-api/README.md. The
      // browser uploads straight to storage, and your server never handles
      // the bytes. Your API makes a presigned PUT URL that expires in minutes.
      // Expected library: the AWS SDK for JavaScript v3 (`@aws-sdk/client-s3`
      // and `@aws-sdk/s3-request-presigner`), pointed at MinIO with
      // S3_FORCE_PATH_STYLE, so the same code works on a real bucket later.
      it.todo(
        "hands out a presigned upload URL for a new file, and never takes the bytes itself",
      );

      // Prompted by: "Where things go" in the README. Keys look like
      // records/<recordId>/<mediaId>/<original filename>. A key never contains
      // anything a person typed outside the filename slot, and never changes.
      it.todo("stores each file under records/<recordId>/<mediaId>/");

      // Prompted by: the README, step 4. When the browser says it finished,
      // check the object is really there and is the size you were told, mark
      // it uploaded, and queue a job. `HeadObjectCommand` gives you the size.
      it.todo(
        "confirms an upload is really in storage, at the expected size, before marking it uploaded",
      );

      // Prompted by: the README, "Never store a URL". Make a fresh presigned
      // GET when somebody asks, and let it expire.
      it.todo(
        "serves a file through a fresh presigned link, never a stored URL",
      );

      // Prompted by: the README, multipart upload. Big recordings arrive in
      // parts and storage stitches them into one file. Build the single-shot
      // version first.
      it.todo("takes a large file in parts and ends up with one stored file");
    });

    describe("what a file says about itself", () => {
      // Prompted by: `mediaRef.contentType` in the contract: "as found by
      // inspecting the file, not as the browser claimed". Expected library:
      // `file-type`, which reads the first bytes of a file.
      it.todo(
        "works out a file type from its bytes, not from what the browser said",
      );

      // Prompted by: `mediaRef.checksum`. The same file handed over twice
      // should be recognised as the same file. sha256 of the original bytes,
      // in hex (Node's `crypto.createHash`).
      it.todo("records a sha256 checksum for every file");

      // Prompted by: `mediaRef.capturedAt`, `width` and `height`, and the
      // record's `capturedLocation`. Photos carry when and where they were
      // taken in their metadata. Expected library: `exifr`. Open question:
      // the contributor chooses whether location is kept, shown only as a
      // distance from the place, or removed. Where that choice is applied
      // isn't decided yet.
      it.todo("reads when and where a photo was taken from its metadata");

      // Prompted by: the README, "Jobs", and `ffprobe`, which the start guide
      // asks you to install. A worker probes audio and video for their
      // duration in the background, not during the request. The README
      // expects the job queue to live in Postgres (`graphile-worker` or
      // `pg-boss`).
      it.todo("fills in the duration of a recording from a background job");

      // Open: as far as this project knows, iPhones save photos as HEIC by
      // default. Whether to accept HEIC as it is, convert it, or ask for JPEG
      // is yours to propose.
      it.todo("handles photos in the format iPhones save by default");
    });

    describe("collections", () => {
      // Prompted by: "What does a collection carry?" in
      // docs/DESIGN-QUESTIONS.md. Decided: records one profile hands over
      // together stay together as a collection, attributed to the profile
      // and never to a named person. In contract 2.4.0. Open: what a
      // collection carries beyond that (who gathered the records, why they
      // were kept), and whether a record can join one later.
      it.todo(
        "keeps the records one profile hands over together as one collection",
      );

      // Prompted by: "How does someone reach a contributor without knowing who they are?"
      // in docs/DESIGN-QUESTIONS.md. Profiles are anonymous
      // first; identity is exchanged off the platform. Open: how a request
      // reaches the contributor, and how it's kept from being misused.
      it.todo(
        "passes a request to reach a contributor without revealing who they are",
      );
    });

    describe("open questions", () => {
      // Prompted by: "How does a record get a location?"
      // in docs/DESIGN-QUESTIONS.md.
      // Open: precision stored or worked out, and where the contributor's location choice is applied.
      it.todo("records how a location was arrived at, not only the coordinates");

      // Prompted by: "A profile has no way to say whether anyone can prove it is theirs"
      // in docs/DESIGN-QUESTIONS.md.
      // Open: verified profiles aren't built this semester.
      it.todo("keeps a guest profile's history when the browser key is lost and found");

      // Prompted by: "Can someone take their record back?"
      // in docs/DESIGN-QUESTIONS.md.
      // Decided: taking a record back is a privacy setting; deletion is on request. Open: what happens to claims built on it.
      it.todo("takes a record out of public view when its contributor changes their choice");

      // Prompted by: "What happens to a supporting record that stops holding up?"
      // in docs/DESIGN-QUESTIONS.md.
      // Open: a lock with two separate tracks, quality and the terms.
      it.todo("keeps a locked record visible and marked, with no new references to it");

      // Prompted by: "How are machine-made drafts treated?"
      // in docs/DESIGN-QUESTIONS.md.
      // Open: a system profile naming the model and version.
      it.todo("credits a machine transcript to a system profile with its model and version");
    });
  });
}
