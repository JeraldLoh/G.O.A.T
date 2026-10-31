import { getBank } from "@/lib/store";

export async function GET(_request: Request, ctx: RouteContext<"/api/banks/[id]">) {
  const { id } = await ctx.params;
  const result = await getBank(id);
  if (!result) return Response.json({ error: "Bank not found" }, { status: 404 });
  return Response.json(result);
}
