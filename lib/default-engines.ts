export type DefaultEngine = {
  shortcut: string;
  displayName: string;
  description: string;
  urlTemplate: string;
  isDefault?: boolean;
};

export const DEFAULT_SEARCH_ENGINES: DefaultEngine[] = [
  {
    shortcut: "@duck",
    displayName: "DuckDuckGo",
    description: "Privacy-focused search engine with no tracking.",
    urlTemplate: "https://duckduckgo.com/?q={query}",
    isDefault: true,
  },
  {
    shortcut: "@YT",
    displayName: "youtube.com",
    description: "Youtube.",
    urlTemplate: "https://www.youtube.com/results?search_query={query}",
  },
  {
    shortcut: "@GI",
    displayName: "Google Images",
    description: "Search Google Images.",
    urlTemplate: "https://www.google.com/search?tbm=isch&q={query}",
  },
  {
    shortcut: "@google",
    displayName: "Google",
    description: "Search Google.",
    urlTemplate: "https://www.google.com/search?q={query}",
  },
  {
    shortcut: "@brave",
    displayName: "Brave Search",
    description:
      "Independent, privacy-first engine with custom ranking goggles.",
    urlTemplate: "https://search.brave.com/search?q={query}",
  },
  {
    shortcut: "@kagi",
    displayName: "Kagi",
    description: "Premium ad-free search with strong user controls.",
    urlTemplate: "https://kagi.com/search?q={query}",
  },
  {
    shortcut: "@ecosia",
    displayName: "Ecosia",
    description: "Eco-friendly search engine that plants trees.",
    urlTemplate: "https://www.ecosia.org/search?q={query}",
  },
  {
    shortcut: "@startpage",
    displayName: "Startpage",
    description: "Google-powered results without tracking.",
    urlTemplate: "https://www.startpage.com/do/search?q={query}",
  },
  {
    shortcut: "@perplexity",
    displayName: "Perplexity AI",
    description: "AI-powered answer engine with citations.",
    urlTemplate: "https://www.perplexity.ai/search?q={query}",
  },
  {
    shortcut: "@bing",
    displayName: "Bing",
    description: "Microsoft's search engine with rewards and rich media.",
    urlTemplate: "https://www.bing.com/search?q={query}",
  },
];
