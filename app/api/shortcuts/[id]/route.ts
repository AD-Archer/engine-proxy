import { NextResponse } from "next/server";

import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { toEngineDTO } from "@/lib/serializers";
import { engineUpdateSchema } from "@/lib/validation";

const notFoundResponse = NextResponse.json(
  { error: { message: "Shortcut not found" } },
  { status: 404 }
);

const ensureFallbackDefault = async () => {
  const hasDefault = await prisma.searchEngine.findFirst({
    where: { isDefault: true },
  });
  if (hasDefault) {
    return;
  }

  const fallback = await prisma.searchEngine.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (fallback) {
    await prisma.searchEngine.update({
      where: { id: fallback.id },
      data: { isDefault: true },
    });
  }
};

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const engineId = Number(id);
  if (Number.isNaN(engineId)) {
    return NextResponse.json(
      { error: { message: "Invalid shortcut id" } },
      { status: 400 }
    );
  }

  const payload = await request.json().catch(() => null);
  const parsed = engineUpdateSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Check for duplicate shortcut if shortcut is being updated
  if (data.shortcut !== undefined) {
    const existing = await prisma.searchEngine.findFirst({
      where: { shortcut: data.shortcut, id: { not: engineId } },
    });
    if (existing) {
      return NextResponse.json(
        { error: { message: `Shortcut "${data.shortcut}" already exists` } },
        { status: 409 }
      );
    }
  }

  if (data.isDefault) {
    await prisma.searchEngine.updateMany({ data: { isDefault: false } });
  }

  try {
    const updated = await prisma.searchEngine.update({
      where: { id: engineId },
      data,
    });

    await ensureFallbackDefault();

    return NextResponse.json({ data: toEngineDTO(updated) });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return notFoundResponse;
      }
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: { message: "Shortcut already exists" } },
          { status: 409 }
        );
      }
    }

    console.error("Failed to update shortcut", error);
    return NextResponse.json(
      { error: { message: "Unable to update shortcut" } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const engineId = Number(id);
  if (Number.isNaN(engineId)) {
    return NextResponse.json(
      { error: { message: "Invalid shortcut id" } },
      { status: 400 }
    );
  }

  try {
    await prisma.searchEngine.delete({ where: { id: engineId } });
    await ensureFallbackDefault();
    return NextResponse.json({ data: { id: engineId } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return notFoundResponse;
    }

    console.error("Failed to delete shortcut", error);
    return NextResponse.json(
      { error: { message: "Unable to delete shortcut" } },
      { status: 500 }
    );
  }
}
