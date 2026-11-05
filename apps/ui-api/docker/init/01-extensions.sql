-- Runs once, the first time this layer's volume is created.
--
-- Enables the spatial extensions and nothing else. No tables and no seed data,
-- because the schema is a deliverable rather than a scaffold decision.

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Useful for fuzzy matching on place names later. Cheap to enable now and
-- annoying to remember once migrations exist.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- A marker row so `db:verify` can prove init actually ran rather than only
-- proving the server accepts connections.
CREATE TABLE IF NOT EXISTS scaffold_init (
  id           integer PRIMARY KEY DEFAULT 1,
  initialized  timestamptz NOT NULL DEFAULT now(),
  note         text NOT NULL,
  CONSTRAINT scaffold_init_single_row CHECK (id = 1)
);

INSERT INTO scaffold_init (note)
VALUES ('Scaffold init ran on sagas_read. Extensions enabled. No application tables, those are yours.')
ON CONFLICT (id) DO NOTHING;
