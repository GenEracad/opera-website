/**
 * Re-derive every project's URL slug from its current name, keeping old URLs
 * working through the project_redirects table. Dry run by default. The admin's
 * "Atualizar endereços" button does the same (plus team ids).
 *
 * Usage: npx dotenv -e .env.local -- npx tsx scripts/sync-project-slugs.ts [--apply]
 */
import { syncProjectSlugs } from "../src/lib/content-store";

const apply = process.argv.includes("--apply");

async function main() {
  const changes = await syncProjectSlugs(apply);
  if (changes.length === 0) {
    console.log("All project slugs already match their names.");
    return;
  }
  for (const c of changes) console.log(`${c.oldId}  →  ${c.newId}   (${c.name})`);
  console.log(
    apply
      ? `\nRenamed ${changes.length} projects. Old URLs now redirect to the new ones.`
      : `\n${changes.length} projects would change. Dry run — re-run with --apply to rename them.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
