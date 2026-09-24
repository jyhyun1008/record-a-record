import type { Prisma } from "@/app/generated/prisma/client";

export type PostWithTags = Prisma.PostGetPayload<{ include: { tags: true } }>;
