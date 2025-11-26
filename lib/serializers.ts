import type { SearchEngine } from "@/app/generated/prisma/client";
import { normalizeShortcut } from "@/lib/shortcuts";
import type { SearchEngineDTO } from "@/types/search-engine";

export const toEngineDTO = (engine: SearchEngine): SearchEngineDTO => ({
  id: engine.id,
  shortcut: normalizeShortcut(engine.shortcut),
  displayName: engine.displayName,
  description: engine.description,
  urlTemplate: engine.urlTemplate,
  isDefault: engine.isDefault,
});
