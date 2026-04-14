import { NextResponse } from "next/server";

import { fetchAppSettings, updateAppSettings } from "@/lib/settings";
import { siteShortcutPayloadSchema } from "@/lib/validation";

export async function GET() {
  try {
    const settings = await fetchAppSettings();
    return NextResponse.json({ data: settings });
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
    const settings = await updateAppSettings(parsed.data);
    return NextResponse.json({ data: settings });
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
