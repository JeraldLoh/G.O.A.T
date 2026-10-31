import { ZodError } from "zod";
import { getVideoFeed } from "@/lib/chapters";
import { parseBankFilter } from "@/lib/schemas";

export async function GET(request: Request) {
  try {
    const filter = parseBankFilter(new URL(request.url).searchParams);
    return Response.json(await getVideoFeed(filter));
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid filter" }, { status: 400 });
    }
    throw error;
  }
}
