import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { postInputSchema } from "@/lib/validation";
import { normalizeTags } from "@/lib/tags";

export async function GET() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: { tags: true },
  });
  return NextResponse.json({ posts });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = postInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { tags, ...data } = parsed.data;
  const post = await prisma.post.create({
    data: { ...data, tags: { connectOrCreate: normalizeTags(tags) } },
    include: { tags: true },
  });
  return NextResponse.json({ post }, { status: 201 });
}
