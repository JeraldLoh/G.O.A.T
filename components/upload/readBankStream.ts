import { BankStreamEventSchema, type BankStreamEvent } from "@/lib/schemas";

/**
 * Reads the NDJSON body of POST /api/banks one event at a time.
 * Lines that fail the contract are skipped (logged) rather than ending the stream.
 */
export async function* readBankStream(response: Response): AsyncGenerator<BankStreamEvent> {
  if (!response.body) throw new Error("Empty response");
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";

  const parse = (line: string): BankStreamEvent | null => {
    if (!line.trim()) return null;
    try {
      const parsed = BankStreamEventSchema.safeParse(JSON.parse(line));
      if (parsed.success) return parsed.data;
      console.warn("Skipping event that doesn't match the contract", parsed.error.issues);
    } catch {
      console.warn("Skipping a line that isn't JSON", line);
    }
    return null;
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += value;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? ""; // last piece may be an incomplete line
    for (const line of lines) {
      const event = parse(line);
      if (event) yield event;
    }
  }
  const last = parse(buffer);
  if (last) yield last;
}

/** Best-effort message from a non-2xx response ({ error } JSON or plain text). */
export async function errorMessage(response: Response): Promise<string> {
  if (response.status === 501) return "Card generation isn't available on this server yet.";
  if (response.status === 429) return "Today's generation limit has been reached. Try again tomorrow.";
  try {
    const body = (await response.json()) as { error?: unknown };
    if (typeof body.error === "string") return body.error;
  } catch {
    // fall through
  }
  return `Upload failed (${response.status}).`;
}
