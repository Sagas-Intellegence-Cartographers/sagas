# Migrations

This folder holds numbered SQL files, applied in filename order by `scripts/migrate.ts`.

`001_records.sql` ships with the scaffold. Every change after it goes in a new
numbered file, because the runner remembers each file by name and never runs
it twice. The columns come from `sourceRecord` in
`packages/contracts/src/model.ts`.

```
001_records.sql
002_media.sql
...
```

The runner applies each file once, inside a transaction, and records what it
applied in a `_migrations` table. Running it twice is safe. Running it on a
fresh database gives you the same schema as everyone else, which is the whole
point of a migration.

```bash
pnpm migrate
```
