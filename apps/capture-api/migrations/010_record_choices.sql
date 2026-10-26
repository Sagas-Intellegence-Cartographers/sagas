-- Contract 2.4.0: what the contributor chose for each record, the terms
-- version it was made under, a web page as a record, and the collection a
-- record arrived in.
--
-- Numbered 010 so it doesn't collide with the numbered files you add yourself.
-- `add column if not exists` makes it safe to run against a table you've
-- already changed. The columns come from `sourceRecord` in
-- packages/contracts/src/model.ts.

-- rightToShare, studentAccess, public, location, mentionsPeople, as one value.
-- Stored together because they're always read and changed together.
alter table records add column if not exists choices jsonb;
alter table records add column if not exists terms_version text;

-- Set when the record is a web page: { url, title, seenAt }.
alter table records add column if not exists link jsonb;

alter table records add column if not exists collection_id text;
