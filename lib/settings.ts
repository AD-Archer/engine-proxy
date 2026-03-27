import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const APP_SETTINGS_ID = 1;
export const DEFAULT_SITE_SHORTCUT = "site:";

export const normalizeSiteShortcut = (value: string) =>
  value.trim().toLowerCase();

const isMissingTableError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === "P2021";

export const fetchSiteShortcut = async (): Promise<string> => {
  try {
    const settings = await prisma.appSetting.upsert({
      where: { id: APP_SETTINGS_ID },
      update: {},
      create: {
        id: APP_SETTINGS_ID,
        siteShortcut: DEFAULT_SITE_SHORTCUT,
      },
      select: { siteShortcut: true },
    });

    return normalizeSiteShortcut(settings.siteShortcut);
  } catch (error) {
    if (isMissingTableError(error)) {
      return DEFAULT_SITE_SHORTCUT;
    }

    throw error;
  }
};

export const updateSiteShortcut = async (siteShortcut: string) => {
  const normalized = normalizeSiteShortcut(siteShortcut);

  try {
    const settings = await prisma.appSetting.upsert({
      where: { id: APP_SETTINGS_ID },
      update: { siteShortcut: normalized },
      create: {
        id: APP_SETTINGS_ID,
        siteShortcut: normalized,
      },
      select: { siteShortcut: true },
    });

    return normalizeSiteShortcut(settings.siteShortcut);
  } catch (error) {
    if (isMissingTableError(error)) {
      throw new Error(
        "App settings table is missing. Run `pnpm db:push` to apply the latest schema."
      );
    }

    throw error;
  }
};
