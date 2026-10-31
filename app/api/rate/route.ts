import { RateRequestSchema } from "@/lib/schemas";
import { addRating } from "@/lib/store";

export async function POST(request: Request) {
  const parsed = RateRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid rating request" }, { status: 400 });
  }
  const { bankId, deviceId, value } = parsed.data;
  const result = await addRating(bankId, deviceId, value);
  if (result === null) return Response.json({ error: "Bank not found" }, { status: 404 });
  return Response.json({ ok: true, accuracyScore: result.accuracyScore });
}
