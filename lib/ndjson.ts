import type { BankStreamEvent } from "@/lib/schemas";

export type Emit = (event: BankStreamEvent) => void;

/** Streams events from `run` as NDJSON. A thrown error becomes an error event. */
export function ndjsonResponse(run: (emit: Emit) => Promise<void>): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let open = true;
      const emit: Emit = (event) => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          open = false; // The client went away; let the run finish and save.
        }
      };
      try {
        await run(emit);
      } catch (error) {
        console.error(error);
        emit({ type: "error", message: error instanceof Error ? error.message : "Generation failed." });
      }
      if (open) controller.close();
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}
