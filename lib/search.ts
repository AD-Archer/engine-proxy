export type ParsedSearchInput = {
  shortcut?: string;
  directUrl?: string;
  usedSiteShortcut?: boolean;
  query: string;
};

type ParseSearchInputOptions = {
  siteShortcut?: string;
  autoAppendComForSiteShortcut?: boolean;
};

const URL_WITH_PROTOCOL_REGEX = /^[a-z][a-z\d+\-.]*:\/\//i;
const IPV4_SEGMENT = "(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)";
const IPV4_REGEX = new RegExp(`^${IPV4_SEGMENT}(?:\\.${IPV4_SEGMENT}){3}$`);
const BRACKETED_IPV6_REGEX = /^\[[0-9a-f:]+\]$/i;
const SINGLE_LABEL_HOST_REGEX = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/i;
const HOSTNAME_REGEX =
  /^(?=.{1,253}$)(?:(?!-)[a-z0-9-]{1,63}(?<!-)\.)+(?:[a-z]{2,63}|xn--[a-z0-9-]{2,59})$/i;

const parseUrl = (value: string) => {
  try {
    return new URL(value);
  } catch {
    return null;
  }
};

const isLikelyHost = (hostname: string, hasExplicitPort = false) => {
  if (!hostname) {
    return false;
  }

  const normalized = hostname.toLowerCase();
  return (
    normalized === "localhost" ||
    IPV4_REGEX.test(normalized) ||
    BRACKETED_IPV6_REGEX.test(normalized) ||
    (hasExplicitPort && SINGLE_LABEL_HOST_REGEX.test(normalized)) ||
    HOSTNAME_REGEX.test(normalized)
  );
};

type ToDirectUrlOptions = {
  appendComToSingleLabelHost?: boolean;
  trimTrailingDot?: boolean;
};

const normalizeParsedUrl = (
  directUrl: URL,
  options: ToDirectUrlOptions
): URL | null => {
  const trimTrailingDot = options.trimTrailingDot ?? true;
  if (trimTrailingDot) {
    const withoutTrailingDots = directUrl.hostname.replace(/\.+$/g, "");
    if (!withoutTrailingDots) {
      return null;
    }
    directUrl.hostname = withoutTrailingDots;
  }

  const shouldAppendCom =
    options.appendComToSingleLabelHost === true &&
    SINGLE_LABEL_HOST_REGEX.test(directUrl.hostname) &&
    directUrl.hostname.toLowerCase() !== "localhost" &&
    directUrl.port === "";

  if (shouldAppendCom) {
    directUrl.hostname = `${directUrl.hostname}.com`;
  }

  if (!isLikelyHost(directUrl.hostname, directUrl.port !== "")) {
    return null;
  }

  return directUrl;
};

export const toDirectUrl = (
  input: string,
  options: ToDirectUrlOptions = {}
): string | null => {
  const trimmed = input.trim();
  if (!trimmed || /\s/.test(trimmed)) {
    return null;
  }
  const trimTrailingDot = options.trimTrailingDot ?? true;
  const normalizedInput =
    trimTrailingDot && !URL_WITH_PROTOCOL_REGEX.test(trimmed)
      ? trimmed.replace(/\.+$/g, "")
      : trimmed;
  if (!normalizedInput) {
    return null;
  }

  if (URL_WITH_PROTOCOL_REGEX.test(normalizedInput)) {
    const directUrl = parseUrl(normalizedInput);
    if (!directUrl) {
      return null;
    }

    if (directUrl.protocol !== "http:" && directUrl.protocol !== "https:") {
      return null;
    }

    const normalized = normalizeParsedUrl(directUrl, options);
    return normalized?.toString() ?? null;
  }

  const directUrl = parseUrl(`https://${normalizedInput}`);
  if (!directUrl) {
    return null;
  }

  const normalized = normalizeParsedUrl(directUrl, options);
  return normalized?.toString() ?? null;
};

const extractSiteShortcutQuery = (input: string, siteShortcut?: string) => {
  if (!siteShortcut) {
    return null;
  }

  const normalizedShortcut = siteShortcut.trim();
  if (!normalizedShortcut) {
    return null;
  }

  const normalizedInput = input.toLowerCase();
  const normalizedMatch = normalizedShortcut.toLowerCase();

  if (!normalizedInput.startsWith(normalizedMatch)) {
    return null;
  }

  const remainderRaw = input.slice(normalizedShortcut.length);
  const hasWordBoundaryRequirement = /[a-z0-9]$/i.test(normalizedShortcut);
  const nextChar = remainderRaw.slice(0, 1);

  if (
    hasWordBoundaryRequirement &&
    nextChar.length > 0 &&
    !/\s/.test(nextChar)
  ) {
    return null;
  }

  return remainderRaw.trim();
};

export const parseSearchInput = (
  input: string,
  options: ParseSearchInputOptions = {}
): ParsedSearchInput => {
  const trimmed = input.trim();
  if (!trimmed) {
    return { query: "" };
  }

  const siteShortcutQuery = extractSiteShortcutQuery(
    trimmed,
    options.siteShortcut
  );
  if (siteShortcutQuery !== null) {
    const autoAppendComForSiteShortcut =
      options.autoAppendComForSiteShortcut ?? true;

    return {
      query: siteShortcutQuery,
      directUrl:
        toDirectUrl(siteShortcutQuery, {
          appendComToSingleLabelHost: autoAppendComForSiteShortcut,
        }) ?? undefined,
      usedSiteShortcut: true,
    };
  }

  const directUrl = toDirectUrl(trimmed);
  if (directUrl) {
    return { query: trimmed, directUrl };
  }

  const words = trimmed.split(/\s+/);
  if (words.length === 0) {
    return { query: "" };
  }

  const firstWord = words[0];
  if (firstWord.startsWith("@")) {
    // @shortcut means use default engine, query is shortcut + rest
    const potentialShortcut = firstWord.slice(1);
    const rest = words.slice(1).join(" ");
    const query = potentialShortcut + (rest ? " " + rest : "");
    return { query };
  } else {
    // First word is potential shortcut, rest is query
    const rest = words.slice(1).join(" ");
    return { shortcut: firstWord.toLowerCase(), query: rest };
  }
};

export const buildSearchUrl = (template: string, query: string) => {
  return template.replace("{query}", encodeURIComponent(query));
};
