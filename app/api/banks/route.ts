import { ZodError } from "zod";
import { parseBankFilter } from "@/lib/schemas";
import { listBanks } from "@/lib/store";

export async function GET(request: Request) {
  try {
    const filter = parseBankFilter(new URL(request.url).searchParams);
    return Response.json(await listBanks(filter));
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid filter" }, { status: 400 });
    }
    throw error;
  }
}

// Stub (Lane A): create a bank and stream NDJSON events.
export async function POST() {
  return Response.json({ error: "Not implemented" }, { status: 501 });
}
