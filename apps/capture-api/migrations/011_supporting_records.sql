-- Contract 2.5.0: a supporting record is a record with a parent, so a transcript
-- or a translation goes in this table like any other record.
--
-- Numbered 011 so it doesn't collide with the numbered files you add yourself.
-- `add column if not exists` makes it safe to run against a table you've
-- already changed. The column comes from `sourceRecord` in
-- packages/contracts/src/model.ts.

-- Set on a supporting record: { role, recordId or claimId, window, method }.
-- A link's preview needs no column of its own, because it lives inside `link`.
alter table records add column if not exists parent jsonb;
