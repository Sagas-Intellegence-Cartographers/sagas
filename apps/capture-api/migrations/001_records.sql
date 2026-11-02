-- The first table, and the only one the scaffold ships.
--
-- It covers a record that is written text with no files attached, which is
-- enough for the first endpoint. Everything else is yours: media and flags, for
-- a start. Add them as numbered files alongside this one.
--
-- The columns come from `sourceRecord` in packages/contracts/src/model.ts.
-- When the contract and this table disagree, the contract is right.

create table if not exists records (
  id              text primary key,
  site_id         text not null,
  contributor_id  text not null,

  -- What somebody says about what they handed over.
  note            text,

  -- The record itself, when the record is writing. Quoted because `text` is
  -- also a type name in Postgres, and the quotes stop that being confusing.
  "text"          text,

  language        text,
  captured_at     timestamptz,
  submission      text not null,
  created_at      timestamptz not null
);

-- Most reads will be "everything at this place". Worth an index from the start
-- because it costs nothing now and is invisible to add later.
create index if not exists records_site_id_idx on records (site_id);
