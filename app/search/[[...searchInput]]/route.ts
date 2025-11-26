import { NextResponse, type NextRequest } from "next/server";

import { fetchEngines } from "@/lib/engines";
import { buildSearchUrl, parseSearchInput } from "@/lib/search";

const redirectHome = (request: NextRequest) => {
  const home = new URL("/", request.url);
  return NextResponse.redirect(home);
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ searchInput?: string[] }> }
) {
  const queryParam = request.nextUrl.searchParams.get("q");
  const params = await context.params;
  const pathSegments = params.searchInput ?? [];
  const pathInput = pathSegments
    .map((segment) => decodeURIComponent(segment))
    .join("/");
  const rawInput = (queryParam ?? pathInput).trim();

  if (!rawInput) {
    return redirectHome(request);
  }

  const engines = await fetchEngines();
  if (engines.length === 0) {
    return redirectHome(request);
  }

  const parsed = parseSearchInput(rawInput);
  let sanitizedQuery = parsed.query.trim();

  if (!sanitizedQuery && !parsed.shortcut) {
    return redirectHome(request);
  }

  let targetEngine =
    engines.find((engine) => engine.isDefault) ?? engines[0] ?? null;

  if (parsed.shortcut) {
    const match = engines.find((engine) => engine.shortcut === parsed.shortcut);
    if (match) {
      targetEngine = match;
    } else {
      // Not found, search full query on default
      sanitizedQuery = (
        parsed.shortcut + (parsed.query ? " " + parsed.query : "")
      ).trim();
    }
  }

  if (!targetEngine || !sanitizedQuery) {
    return redirectHome(request);
  }

  const targetUrl = buildSearchUrl(targetEngine.urlTemplate, sanitizedQuery);
  return NextResponse.redirect(targetUrl);
}
