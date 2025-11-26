import { prisma } from "@/lib/prisma";
import { normalizeShortcut } from "@/lib/shortcuts";
import { toEngineDTO } from "@/lib/serializers";
import type { SearchEngineDTO } from "@/types/search-engine";

export const fetchEngines = async (): Promise<SearchEngineDTO[]> => {
  const engines = await prisma.searchEngine.findMany({
    orderBy: [{ isDefault: "desc" }, { displayName: "asc" }],
  });

  const dirty = engines.filter(
    (engine) => engine.shortcut !== normalizeShortcut(engine.shortcut)
  );

  if (dirty.length > 0) {
    await Promise.all(
      dirty.map((engine) =>
        prisma.searchEngine.update({
          where: { id: engine.id },
          data: { shortcut: normalizeShortcut(engine.shortcut) },
        })
      )
    );

    dirty.forEach((engine) => {
      engine.shortcut = normalizeShortcut(engine.shortcut);
    });
  }

  return engines.map(toEngineDTO);
};
