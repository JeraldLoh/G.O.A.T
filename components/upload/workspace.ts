import type { Level, License } from "@/lib/schemas";
import { LevelSchema, LicenseSchema } from "@/lib/schemas";
import { z } from "zod";

export type UploadDraft = { id: string; title: string; text: string; level: Level; tags: string[]; license: License; attribution: string; sourceUrl: string; sourceFileId?: string; fileName?: string; updatedAt?: string };
export type Submission = UploadDraft & { status: "Approved" | "Pending approval" | "Rejected"; submittedAt: string; views?: number };
export type UploadWorkspace = { drafts: UploadDraft[]; submissions: Submission[] };
export const EMPTY_WORKSPACE: UploadWorkspace = { drafts: [], submissions: [] };
const DraftSchema = z.object({ id: z.string(), title: z.string(), text: z.string(), level: LevelSchema, tags: z.array(z.string()), license: LicenseSchema, attribution: z.string(), sourceUrl: z.string().optional().default(""), sourceFileId: z.string().optional(), fileName: z.string().optional(), updatedAt: z.string().optional() });
const WorkspaceSchema = z.object({ drafts: z.array(DraftSchema), submissions: z.array(DraftSchema.extend({ status: z.enum(["Approved", "Pending approval", "Rejected"]), submittedAt: z.string(), views: z.number().int().nonnegative().optional() })) });
export function readWorkspace(): UploadWorkspace {
  try {
    const value = WorkspaceSchema.safeParse(JSON.parse(localStorage.getItem("kb:upload-workspace") ?? "null"));
    return value.success ? value.data : EMPTY_WORKSPACE;
  } catch { return EMPTY_WORKSPACE; }
}
export function formatUploadDate(value?: string): string {
  if (!value || Number.isNaN(Date.parse(value))) return "Not recorded";
  return new Intl.DateTimeFormat("en-SG", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Singapore" }).format(new Date(value));
}
export function saveWorkspace(value: UploadWorkspace) {
  localStorage.setItem("kb:upload-workspace", JSON.stringify(value));
  window.dispatchEvent(new Event("kb:upload-workspace"));
}

export function deleteUpload(id: string) {
  const current = readWorkspace();
  const item = current.drafts.find((draft) => draft.id === id) ?? current.submissions.find((submission) => submission.id === id);
  saveWorkspace({
    drafts: current.drafts.filter((draft) => draft.id !== id),
    submissions: current.submissions.filter((submission) => submission.id !== id),
  });
  if (item?.sourceFileId) {
    void import("@/components/upload/sourceFiles").then(({ deleteSourceFile }) => deleteSourceFile(item.sourceFileId!).catch(() => {}));
  }
}
