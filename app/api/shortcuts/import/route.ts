import { NextResponse, type NextRequest } from "next/server";

import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { enginePayloadSchema } from "@/lib/validation";
import { toEngineDTO } from "@/lib/serializers";
import type { SearchEngineDTO } from "@/types/search-engine";

const importPayloadSchema = z.object({
  mode: z.enum(["add", "overwrite", "combine"]).default("add"),
  engines: z.array(enginePayloadSchema),
});

const makeUniqueShortcut = async (shortcut: string) => {
  let candidate = shortcut;
  let i = 2;
  // try appending a number until unique
  while (true) {
    const existing = await prisma.searchEngine.findUnique({ where: { shortcut: candidate } });
    if (!existing) return candidate;
    candidate = `${shortcut}${i}`;
    i += 1;
  }
};

type ImportResult =
  | { action: "created" | "updated"; data: SearchEngineDTO }
  | { action: "skipped"; reason: string; shortcut: string }
  | { action: "created_copy"; data: SearchEngineDTO; originalShortcut: string };


export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);

  const parsed = importPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { mode, engines } = parsed.data;

  try {
    // If overwrite mode and any imported engine isDefault, clear existing defaults first
    if (mode === "overwrite" && engines.some((e) => e.isDefault)) {
      await prisma.searchEngine.updateMany({ data: { isDefault: false } });
    }

    const results: ImportResult[] = [];

    if (mode === "overwrite") {
      // Remove all existing shortcuts and replace with the imported list
      await prisma.searchEngine.deleteMany({});

      // If none of the imported engines requested default, set the first one as default (if any)
      if (!engines.some((e) => e.isDefault) && engines.length > 0) {
        engines[0].isDefault = true;
      }

      for (const engine of engines) {
        const created = await prisma.searchEngine.create({ data: engine });
        results.push({ action: "created", data: toEngineDTO(created) });
      }
    } else {
      for (const engine of engines) {
        const existing = await prisma.searchEngine.findUnique({ where: { shortcut: engine.shortcut } });

        if (mode === "add") {
          if (!existing) {
            // create, but only set isDefault true if there is no other default
            let isDefault = !!engine.isDefault;
            if (isDefault) {
              const hasDefault = await prisma.searchEngine.findFirst({ where: { isDefault: true } });
              if (hasDefault) {
                isDefault = false;
              }
            }
            const created = await prisma.searchEngine.create({ data: { ...engine, isDefault } });
            results.push({ action: "created", data: toEngineDTO(created) });
          } else {
            results.push({ action: "skipped", reason: "already exists", shortcut: engine.shortcut });
          }
          continue;
        }

        // combine
        if (!existing) {
          const created = await prisma.searchEngine.create({ data: engine });
          results.push({ action: "created", data: toEngineDTO(created) });
        } else {
          // create a copy with unique shortcut and modified display name
          const uniqueShortcut = await makeUniqueShortcut(engine.shortcut);
          let newDisplayName = engine.displayName;
          // append number if display name matches
          const similarCount = (await prisma.searchEngine.count({ where: { displayName: newDisplayName } })) ?? 0;
          if (similarCount > 0) {
            newDisplayName = `${newDisplayName} (${similarCount + 1})`;
          }

          const created = await prisma.searchEngine.create({ data: { ...engine, displayName: newDisplayName, shortcut: uniqueShortcut } });
          results.push({ action: "created_copy", data: toEngineDTO(created), originalShortcut: engine.shortcut });
        }
      }
    }

    // If any imported engine requested default in combine mode, set that one as default
    if (mode === "combine" && engines.some((e) => e.isDefault)) {
      // find the first imported engine that was created and set it default
      const created = results.find((r) => r.action === "created" || r.action === "created_copy") as ImportResult | undefined;
      if (created && created.action !== "skipped") {
        const id = created.data?.id;
        if (typeof id === "number") {
          await prisma.searchEngine.updateMany({ data: { isDefault: false } });
          await prisma.searchEngine.update({ where: { id }, data: { isDefault: true } });
        }
      }
    }

    return NextResponse.json({ data: results });
  } catch (err) {
    console.error("Import failed", err);
    return NextResponse.json({ error: { message: "Unable to import engines" } }, { status: 500 });
  }
}
