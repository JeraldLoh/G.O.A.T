import { ZodError } from "zod";
import { extractText } from "@/lib/extract";
import { ndjsonResponse } from "@/lib/ndjson";
import { countWords, isOverDailyLimit, maxWords, runPipeline } from "@/lib/pipeline";
import { CreateBankRequestSchema, parseBankFilter, type CreateBankRequest } from "@/lib/schemas";
import { listBanks } from "@/lib/store";

const MAX_UPLOAD_BYTES = 1024 * 1024;

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

async function readInput(request: Request): Promise<CreateBankRequest> {
  if (!request.headers.get("content-type")?.includes("multipart/form-data")) {
    return CreateBankRequestSchema.parse(await request.json());
  }

  const form = await request.formData();
  const file = form.get("file");
  const field = (key: string) => {
    const value = form.get(key);
    return typeof value === "string" ? value : "";
  };
  return CreateBankRequestSchema.parse({
    title: field("title"),
    subject: field("subject"),
    level: field("level"),
    tags: field("tags").split(",").map((tag) => tag.trim()).filter(Boolean),
    license: field("license"),
    attribution: field("attribution"),
    sourceUrl: field("sourceUrl") || undefined,
    text: file instanceof File ? await extractText(file) : field("text"),
  });
}

export async function POST(request: Request) {
  if (Number(request.headers.get("content-length")) > MAX_UPLOAD_BYTES) {
    return Response.json({ error: "Keep uploads under 1 MB." }, { status: 413 });
  }
  if (await isOverDailyLimit()) {
    return Response.json({ error: "Today's generation limit has been reached." }, { status: 429 });
  }

  let input: CreateBankRequest;
  try {
    input = await readInput(request);
  } catch (error) {
    const message =
      error instanceof ZodError
        ? "Check the upload fields and try again."
        : error instanceof Error
          ? error.message
          : "Could not read that upload.";
    return Response.json({ error: message }, { status: 400 });
  }

  if (countWords(input.text) > maxWords()) {
    return Response.json(
      { error: `Keep it under ${maxWords().toLocaleString()} words for now.` },
      { status: 413 },
    );
  }

  return ndjsonResponse(async (emit) => {
    await runPipeline(input, emit);
  });
}
