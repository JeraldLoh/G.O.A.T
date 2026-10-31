import { extractText as extractPdfText, getDocumentProxy } from "unpdf";

/** Text of an uploaded .md, .txt or .pdf, NFKC-normalized like Bank.sourceText. */
export async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".md") || name.endsWith(".txt")) {
    return (await file.text()).normalize("NFKC");
  }
  if (name.endsWith(".pdf")) {
    const pdf = await getDocumentProxy(new Uint8Array(await file.arrayBuffer()));
    const { text } = await extractPdfText(pdf, { mergePages: true });
    return text.normalize("NFKC");
  }
  throw new Error("Upload a .md, .txt or .pdf file.");
}
