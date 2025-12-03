import { NextResponse } from "next/server";

import { Prisma } from "@/app/generated/prisma/client";

import { fetchEngines } from "@/lib/engines";
import { prisma } from "@/lib/prisma";
import { toEngineDTO } from "@/lib/serializers";
import { enginePayloadSchema } from "@/lib/validation";

export async function GET() {
  const engines = await fetchEngines();
  return NextResponse.json({ data: engines });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);

  const parsed = enginePayloadSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Check for duplicate shortcut
  const existing = await prisma.searchEngine.findUnique({
    where: { shortcut: data.shortcut },
  });
  if (existing) {
    return NextResponse.json(
      { error: { message: `Shortcut "${data.shortcut}" already exists` } },
      { status: 409 }
    );
  }

  if (data.isDefault) {
    await prisma.searchEngine.updateMany({ data: { isDefault: false } });
  }

  try {
    const created = await prisma.searchEngine.create({ data });
    return NextResponse.json({ data: toEngineDTO(created) }, { status: 201 });
  } catch (error) {
    console.error("Failed to create engine", error);
    return NextResponse.json(
      { error: { message: "Unable to save shortcut" } },
      { status: 500 }
    );
  }
}
