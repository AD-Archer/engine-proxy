export type ParsedSearchInput = {
  shortcut?: string;
  query: string;
};

export const parseSearchInput = (input: string): ParsedSearchInput => {
  const trimmed = input.trim();
  if (!trimmed) {
    return { query: "" };
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
