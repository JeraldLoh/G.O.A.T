import { getChapters } from "@/lib/chapters";

export async function GET(_request: Request, ctx: RouteContext<"/api/banks/[id]/chapters">) {
  const { id } = await ctx.params;
  const chapters = await getChapters(id);
  if (!chapters) return Response.json({ error: "Bank not found" }, { status: 404 });
  return Response.json(chapters);
}
