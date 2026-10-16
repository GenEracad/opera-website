/**
 * Re-derive every project's URL slug from its current name, keeping old URLs
 * working through the project_redirects table. Dry run by default.
 *
 * Usage: npx dotenv -e .env.local -- npx tsx scripts/sync-project-slugs.ts [--apply]
 */
import { neon } from "@neondatabase/serverless";

import { slugify } from "../src/lib/content-store";

const sql = neon(process.env.DATABASE_URL!);
const apply = process.argv.includes("--apply");

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS project_redirects (
      old_id text PRIMARY KEY,
      new_id text NOT NULL
    )
  `;

  const projects = (await sql`SELECT id, name FROM projects ORDER BY sort_order ASC, name ASC`) as {
    id: string;
    name: string;
  }[];

  // Assign slugs in display order, so earlier projects win the plain name.
  const taken = new Set<string>();
  const changes: { oldId: string; newId: string; name: string }[] = [];
  for (const project of projects) {
    const base = slugify(project.name) || "projeto";
    let newId = base;
    for (let i = 2; taken.has(newId); i++) newId = `${base}-${i}`;
    taken.add(newId);
    if (newId !== project.id) changes.push({ oldId: project.id, newId, name: project.name });
  }

  if (changes.length === 0) {
    console.log("All project slugs already match their names.");
    return;
  }
  for (const c of changes) console.log(`${c.oldId}  →  ${c.newId}   (${c.name})`);
  console.log(`\n${changes.length} of ${projects.length} projects would change.`);
  if (!apply) {
    console.log("Dry run — re-run with --apply to rename them.");
    return;
  }

  // Two phases through temporary ids, so swaps (a→b while b→c) can't collide.
  // Redirects pointing at an old id are re-pointed the same way. A redirect is
  // only recorded when the old slug isn't taken by another project's new slug.
  const tmp = (id: string) => `__renaming__${id}`;
  const newIds = new Set(changes.map((c) => c.newId));
  await sql.transaction([
    ...changes.map((c) => sql`UPDATE projects SET id = ${tmp(c.oldId)} WHERE id = ${c.oldId}`),
    ...changes.map((c) => sql`UPDATE project_redirects SET new_id = ${tmp(c.oldId)} WHERE new_id = ${c.oldId}`),
    ...changes.map((c) => sql`UPDATE projects SET id = ${c.newId} WHERE id = ${tmp(c.oldId)}`),
    ...changes.map((c) => sql`UPDATE project_redirects SET new_id = ${c.newId} WHERE new_id = ${tmp(c.oldId)}`),
    ...changes.map((c) => sql`DELETE FROM project_redirects WHERE old_id = ${c.newId}`),
    ...changes
      .filter((c) => !newIds.has(c.oldId))
      .map(
        (c) => sql`
          INSERT INTO project_redirects (old_id, new_id) VALUES (${c.oldId}, ${c.newId})
          ON CONFLICT (old_id) DO UPDATE SET new_id = EXCLUDED.new_id
        `,
      ),
  ]);
  console.log("Renamed. Old URLs now redirect to the new ones.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
