import "dotenv/config";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../app/generated/prisma/client";
import { DEFAULT_SEARCH_ENGINES } from "../lib/default-engines";
import { normalizeShortcut } from "../lib/shortcuts";

const databaseUrl = process.env.DATABASE_URL ?? "file:./prisma/data.db";
const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.appSetting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      siteShortcut: "site:",
    },
  });

  const existingCount = await prisma.searchEngine.count();
  if (existingCount > 0) {
    console.log(
      `Skipping seed: found ${existingCount} existing search engine record(s).`
    );
    return;
  }

  for (const engine of DEFAULT_SEARCH_ENGINES) {
    const normalizedShortcut = normalizeShortcut(engine.shortcut);
    await prisma.searchEngine.upsert({
      where: { shortcut: normalizedShortcut },
      update: {
        displayName: engine.displayName,
        description: engine.description,
        urlTemplate: engine.urlTemplate,
        isDefault: Boolean(engine.isDefault),
      },
      create: {
        shortcut: normalizedShortcut,
        displayName: engine.displayName,
        description: engine.description,
        urlTemplate: engine.urlTemplate,
        isDefault: Boolean(engine.isDefault),
      },
    });
  }

  const defaultEngine = await prisma.searchEngine.findFirst({
    where: { isDefault: true },
  });

  if (!defaultEngine && DEFAULT_SEARCH_ENGINES.length > 0) {
    await prisma.searchEngine.update({
      where: {
        shortcut: normalizeShortcut(DEFAULT_SEARCH_ENGINES[0].shortcut),
      },
      data: { isDefault: true },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
