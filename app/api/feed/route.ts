import { ZodError } from "zod";
import { parseBankFilter } from "@/lib/schemas";
import { getFeed } from "@/lib/store";

export async function GET(request: Request) {
  try {
    const filter = parseBankFilter(new URL(request.url).searchParams);
    return Response.json(await getFeed(filter));
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid filter" }, { status: 400 });
    }
    throw error;
  }
}
