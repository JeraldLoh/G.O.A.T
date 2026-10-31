import { FlagRequestSchema } from "@/lib/schemas";
import { addFlag } from "@/lib/store";

export async function POST(request: Request) {
  const parsed = FlagRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid flag request" }, { status: 400 });
  }
  const flags = await addFlag(parsed.data);
  if (flags === null) return Response.json({ error: "Card not found" }, { status: 404 });
  return Response.json({ ok: true, flags });
}
