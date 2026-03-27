import { NextResponse } from "next/server";

import { fetchSiteShortcut, updateSiteShortcut } from "@/lib/settings";
import { siteShortcutPayloadSchema } from "@/lib/validation";

export async function GET() {
  try {
    const siteShortcut = await fetchSiteShortcut();
    return NextResponse.json({ data: { siteShortcut } });
  } catch (error) {
    console.error("Failed to load app settings", error);
    return NextResponse.json(
      { error: { message: "Unable to load app settings" } },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const payload = await request.json().catch(() => null);

  const parsed = siteShortcutPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const siteShortcut = await updateSiteShortcut(parsed.data.siteShortcut);
    return NextResponse.json({ data: { siteShortcut } });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: { message: error.message } },
        { status: 500 }
      );
    }

    console.error("Failed to update app settings", error);
    return NextResponse.json(
      { error: { message: "Unable to update app settings" } },
      { status: 500 }
    );
  }
}
