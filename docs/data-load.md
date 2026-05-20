# Data load (constants + real-data fts-functions)

The seed under `apps/api/db/seeds/` rebuilds the `fts_function*`
tables from the canonical real-data dump in
`apps/api/db/seeds/fts-functions/data.ts` (33 functions, ~870 detail rows).
It is **destructive**: every existing `fts_functions`, `fts_function_details`,
`fts_function_to_dtis`, `fts_function_tree` and `type` row is wiped before
the new data is inserted. Users are inserted only when the `users` table is
empty.

## Local (dev) — already automated

```bash
pnpm --filter=@registry/api exec prisma migrate deploy
pnpm --filter=@registry/api exec prisma db seed
```

The seed prints one line per fts_function and detail it inserts. Expect
~33 "Created FtsFunction" lines and ~870 "Created FtsFunctionDetail" lines,
followed by tree-link creation and a final `seedFtsFunctions completed
successfully!` banner.

After it finishes, the registry table should show 33 rows. If it shows
something else, the seed errored and rolled the transaction back — re-run
with verbose logs (`DEBUG=prisma:* pnpm exec prisma db seed`) to triage.

## Prod — manual one-shot, **destructive**

The deploy pipeline does not run the seed. To load the same canonical data
on a new prod environment:

1. SSH into the API container's host (or run `kubectl exec` into the pod).
2. From the deployed `apps/api` working directory, apply the schema:
   ```bash
   pnpm exec prisma migrate deploy
   ```
3. Confirm the target DB is the one you mean to wipe (the seed deletes
   without prompting):
   ```bash
   echo "$DATABASE_URL"
   ```
4. Run the seed:
   ```bash
   pnpm exec prisma db seed
   ```

**Do not run the seed against an environment that already has hand-curated
data.** Wrap it in a backup if the data load is anything other than a fresh
prod bring-up, e.g.:

```bash
mysqldump --single-transaction --routines --triggers \
    -h "$DATABASE_HOST" -u "$DATABASE_USER" -p"$DATABASE_PASSWORD" \
    "$DATABASE_NAME" > backup-$(date +%F-%H%M%S).sql
```

## Schema drift between catalogue and data

The Type catalogue in `apps/api/db/seeds/constants/index.ts` is a curated
subset; `data.ts` may carry function names not in that catalogue. The seed
auto-creates `FTS_FUNCTION_NAME`-category Type rows on demand
(`findOrCreateFunctionNameType` in `seeds/fts-functions/index.ts`) with
codes prefixed `FTS_FUNCTION_AUTO_`. Operators can rename these via the
admin UI without re-running the seed.

Tree links that reference a row id outside the current function's row map
are dropped with a warning rather than aborting the seed — the schema only
allows tree edges within a single function.
