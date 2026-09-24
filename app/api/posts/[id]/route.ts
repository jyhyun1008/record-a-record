import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { postInputSchema } from "@/lib/validation";
import { normalizeTags } from "@/lib/tags";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id }, include: { tags: true } });
  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ post });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const parsed = postInputSchema.partial().safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { tags, ...data } = parsed.data;

  try {
    const post = await prisma.post.update({
      where: { id },
      data: {
        ...data,
        ...(tags ? { tags: { set: [], connectOrCreate: normalizeTags(tags) } } : {}),
      },
      include: { tags: true },
    });
    return NextResponse.json({ post });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    await prisma.post.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
