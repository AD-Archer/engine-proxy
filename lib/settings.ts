import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const APP_SETTINGS_ID = 1;
export const DEFAULT_SITE_SHORTCUT = "site:";
export const DEFAULT_AUTO_APPEND_COM_FOR_SITE_SHORTCUT = true;

export type AppSettingsDTO = {
  siteShortcut: string;
  autoAppendComForSiteShortcut: boolean;
};

export const normalizeSiteShortcut = (value: string) =>
  value.trim().toLowerCase();

export const normalizeAutoAppendComForSiteShortcut = (value: unknown) =>
  typeof value === "boolean"
    ? value
    : DEFAULT_AUTO_APPEND_COM_FOR_SITE_SHORTCUT;

const isSchemaMismatchError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  (error.code === "P2021" || error.code === "P2022");

export const fetchSiteShortcut = async (): Promise<string> => {
  const settings = await fetchAppSettings();
  return settings.siteShortcut;
};

export const fetchAppSettings = async (): Promise<AppSettingsDTO> => {
  try {
    const settings = await prisma.appSetting.upsert({
      where: { id: APP_SETTINGS_ID },
      update: {},
      create: {
        id: APP_SETTINGS_ID,
        siteShortcut: DEFAULT_SITE_SHORTCUT,
        autoAppendComForSiteShortcut:
          DEFAULT_AUTO_APPEND_COM_FOR_SITE_SHORTCUT,
      },
      select: { siteShortcut: true, autoAppendComForSiteShortcut: true },
    });

    return {
      siteShortcut: normalizeSiteShortcut(settings.siteShortcut),
      autoAppendComForSiteShortcut: normalizeAutoAppendComForSiteShortcut(
        settings.autoAppendComForSiteShortcut
      ),
    };
  } catch (error) {
    if (isSchemaMismatchError(error)) {
      return {
        siteShortcut: DEFAULT_SITE_SHORTCUT,
        autoAppendComForSiteShortcut:
          DEFAULT_AUTO_APPEND_COM_FOR_SITE_SHORTCUT,
      };
    }

    throw error;
  }
};

export const updateSiteShortcut = async (siteShortcut: string) => {
  const settings = await updateAppSettings({
    siteShortcut,
  });
  return settings.siteShortcut;
};

export const updateAppSettings = async (input: {
  siteShortcut: string;
  autoAppendComForSiteShortcut?: boolean;
}) => {
  const normalized = normalizeSiteShortcut(input.siteShortcut);
  const normalizedAutoAppendComForSiteShortcut =
    input.autoAppendComForSiteShortcut === undefined
      ? undefined
      : normalizeAutoAppendComForSiteShortcut(
          input.autoAppendComForSiteShortcut
        );

  try {
    const settings = await prisma.appSetting.upsert({
      where: { id: APP_SETTINGS_ID },
      update: {
        siteShortcut: normalized,
        ...(normalizedAutoAppendComForSiteShortcut === undefined
          ? {}
          : {
              autoAppendComForSiteShortcut:
                normalizedAutoAppendComForSiteShortcut,
            }),
      },
      create: {
        id: APP_SETTINGS_ID,
        siteShortcut: normalized,
        autoAppendComForSiteShortcut:
          normalizedAutoAppendComForSiteShortcut ??
          DEFAULT_AUTO_APPEND_COM_FOR_SITE_SHORTCUT,
      },
      select: { siteShortcut: true, autoAppendComForSiteShortcut: true },
    });

    return {
      siteShortcut: normalizeSiteShortcut(settings.siteShortcut),
      autoAppendComForSiteShortcut: normalizeAutoAppendComForSiteShortcut(
        settings.autoAppendComForSiteShortcut
      ),
    };
  } catch (error) {
    if (isSchemaMismatchError(error)) {
      throw new Error(
        "App settings schema is out of date. Run `pnpm db:push` to apply the latest schema."
      );
    }

    throw error;
  }
};
