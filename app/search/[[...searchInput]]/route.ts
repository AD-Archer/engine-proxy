import { NextResponse, type NextRequest } from "next/server";

import { fetchEngines } from "@/lib/engines";
import { buildSearchUrl, parseSearchInput } from "@/lib/search";

const redirectHome = () => {
  return new NextResponse(null, {
    status: 307,
    headers: {
      Location: "/",
    },
  });
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
    .join("/")
    .replace(/\+/g, " ");

  // When ?q= exists but is blank we only send users home if the path form
  // (/search/<query>) also doesn't contain a query.
  if (request.nextUrl.searchParams.has("q")) {
    const q = queryParam ?? "";
    if (q.trim() === "" && pathInput.trim() === "") {
      return redirectHome();
    }
  }

  const rawInput = (queryParam?.trim() ? queryParam : pathInput).trim();

  if (!rawInput) {
    return redirectHome();
  }

  const engines = await fetchEngines();
  if (engines.length === 0) {
    return redirectHome();
  }

  const parsed = parseSearchInput(rawInput);
  let sanitizedQuery = parsed.query.trim();

  if (!sanitizedQuery && !parsed.shortcut) {
    return redirectHome();
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
    return redirectHome();
  }

  const targetUrl = buildSearchUrl(targetEngine.urlTemplate, sanitizedQuery);
  return NextResponse.redirect(targetUrl);
}
