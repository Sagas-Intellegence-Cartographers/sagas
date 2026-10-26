/**
 * One endpoint, end to end.
 *
 * This exists because the gap between "I can write a function" and "I can build
 * an app" is mostly not knowing how the pieces connect. So here is the whole
 * path, once, at its narrowest: a request arrives, the contract validates it, a
 * row is written, a response goes back. Everything else you build this semester
 * is this shape, widened.
 *
 *   pnpm --filter @sagas/capture-api migrate
 *   pnpm --filter @sagas/capture-api dev
 *
 * Then, from another terminal:
 *
 *   curl -X POST http://localhost:3001/records \
 *     -H 'content-type: application/json' \
 *     -d '{
 *       "siteId": "site-001",
 *       "contributorId": "guest-abc",
 *       "text": "My great-grandmother cooked in the boarding house kitchen.",
 *       "language": "en",
 *       "submission": "submitted",
 *       "media": [],
 *       "choices": {
 *         "rightToShare": true, "studentAccess": false, "public": "later",
 *         "location": "remove", "mentionsPeople": "not_sure"
 *       },
 *       "termsVersion": "provisional-0.1",
 *       "createdAt": "2026-09-07T12:00:00Z"
 *     }'
 */
import { randomUUID } from 'node:crypto';
import express from 'express';
import { newSourceRecord } from '@sagas/contracts';
import { pool } from './db';

const app = express();

// Without this, req.body is undefined and it is not obvious why.
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

/**
 * Submit a record.
 *
 * Three steps, and they are the three steps in every endpoint you will write.
 *
 * 1. Validate against the contract. `newSourceRecord` is a record as it
 *    arrives, without an id. `safeParse` returns a result rather than
 *    throwing, so the failure path is ordinary code. Never trust a request body.
 * 2. Write it, using $1 $2 $3 placeholders. The values go to Postgres
 *    separately from the query text, so nothing a person typed is ever read as
 *    SQL. Do not build a query by joining strings, ever, even when it looks
 *    harmless. This is the one rule in this file that is not a preference.
 * 3. Return what was stored, with 201 because something was created.
 *
 * The server makes the id, because whoever stores a record decides its id.
 * Here it's a random UUID made in code, which fits the `text` id column in
 * 001_records.sql. Letting the database generate it instead is a fine choice
 * too. The client still sends `createdAt`; whether the server should set that
 * as well is a design question, and it's yours.
 */
app.post('/records', async (req, res) => {
  const parsed = newSourceRecord.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const record = { ...parsed.data, id: randomUUID() };

  const { rows } = await pool.query<Record<string, unknown>>(
    `insert into records
       (id, site_id, contributor_id, note, "text", language, captured_at, submission,
        choices, terms_version, link, collection_id, created_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     returning *`,
    [
      record.id,
      record.siteId,
      record.contributorId,
      record.note ?? null,
      record.text ?? null,
      record.language ?? null,
      record.capturedAt ?? null,
      record.submission,
      record.choices,
      record.termsVersion,
      record.link ?? null,
      record.collectionId ?? null,
      record.createdAt,
    ],
  );

  res.status(201).json(rows[0] ? toRecord(rows[0]) : null);
});

/**
 * A database row back into the contract's shape.
 *
 * Postgres hands back `site_id`, nulls and dates as Date objects. The contract
 * is the agreed shape of a record, so the API answers in it and the row is
 * translated on the way out. `media` is empty because this endpoint
 * only takes written records so far; when files arrive, they get read from
 * their own table here.
 */
function toRecord(row: Record<string, unknown>) {
  const date = (v: unknown) => (v instanceof Date ? v.toISOString() : (v as string | null) ?? undefined);
  return {
    id: row.id as string,
    siteId: row.site_id as string,
    contributorId: row.contributor_id as string,
    note: (row.note as string | null) ?? undefined,
    text: (row.text as string | null) ?? undefined,
    language: (row.language as string | null) ?? undefined,
    capturedAt: date(row.captured_at),
    submission: row.submission as string,
    media: [],
    link: (row.link as Record<string, unknown> | null) ?? undefined,
    collectionId: (row.collection_id as string | null) ?? undefined,
    choices: row.choices as Record<string, unknown>,
    termsVersion: row.terms_version as string,
    createdAt: date(row.created_at),
  };
}

/**
 * Anything a handler throws lands here.
 *
 * Express 5 forwards a rejected promise from an async handler to this
 * automatically. In Express 4 it did not, and a handler that threw would hang
 * the request forever with no error anywhere. That difference is most of why
 * this project is on 5.
 */
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Something failed on the server.' });
});

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => {
  console.log(`capture-api listening on http://localhost:${port}`);
});
