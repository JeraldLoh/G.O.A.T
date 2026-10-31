"use client";

import { useState } from "react";
import Link from "next/link";
import { FilePenLine, ChevronRight } from "lucide-react";
import { readWorkspace, EMPTY_WORKSPACE } from "@/components/upload/workspace";
import { useBrowserValue } from "@/components/discovery/storage";
import { SUBJECT_META } from "@/components/discovery/subjects";
import { getInterests, setInterests } from "@/lib/local";
import { SUBJECTS, type Subject } from "@/lib/schemas";
import { version } from "@/package.json";

function readProfile(): { name: string; bio: string } {
  try { return JSON.parse(localStorage.getItem("kb:profile") ?? "null") ?? { name: "", bio: "" }; } catch { return { name: "", bio: "" }; }
}
export default function ProfilePage() {
  const profile = useBrowserValue(readProfile, ["kb:profile"]);
  const interests = useBrowserValue(getInterests, ["kb:interests"]);
  const [message, setMessage] = useState("");
  const workspace = useBrowserValue(readWorkspace, ["kb:upload-workspace"]) ?? EMPTY_WORKSPACE;
  function toggle(subject: Subject) {
    const current = interests ?? [];
    const next = current.includes(subject) ? current.filter((s) => s !== subject) : [...current, subject];
    if (!next.length) return setMessage("Keep at least one topic selected.");
    try { setInterests(next); setMessage("Preferences saved."); } catch { setMessage("Could not save preferences on this device."); }
  }
  return <div className="h-full overflow-y-auto p-5"><h1 className="text-2xl font-semibold">Profile</h1><p className="mt-1 text-sm text-muted-foreground">Make room for what interests you.</p>
    <Link href="/profile/contributions" className="mt-5 flex min-h-20 items-center gap-3 rounded-2xl border-2 border-primary bg-cream p-4"><FilePenLine className="size-6 shrink-0 text-olive-deep" aria-hidden /><span className="min-w-0 flex-1"><span className="block font-semibold">My Contributions</span><span className="mt-1 block text-xs text-muted-foreground">{workspace.submissions.length} uploads · {workspace.drafts.length} drafts · View & edit</span></span><ChevronRight className="size-5" aria-hidden /></Link>
    <section className="mt-5 rounded-2xl border p-4"><h2 className="font-semibold">A little about you</h2>
      {profile && <form key={profile.name + profile.bio} onSubmit={(event) => { event.preventDefault(); const fields = new FormData(event.currentTarget); try { localStorage.setItem("kb:profile", JSON.stringify({ name: fields.get("name"), bio: fields.get("bio") })); window.dispatchEvent(new Event("kb:profile")); setMessage("Profile saved on this device."); } catch { setMessage("Could not save your profile."); } }}>
        <label className="mt-3 block text-sm">Display name<input name="name" maxLength={60} defaultValue={profile.name} className="mt-1 min-h-11 w-full rounded-xl border bg-background px-3" placeholder="What should we call you?" /></label>
        <label className="mt-3 block text-sm">About you<textarea name="bio" maxLength={240} defaultValue={profile.bio} rows={2} className="mt-1 w-full rounded-xl border bg-background p-3" placeholder="What are you curious about?" /></label>
        <button className="mt-3 min-h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">Save profile</button>
      </form>}
    </section>
    <section className="mt-6"><h2 className="font-semibold">Your interests</h2><p className="mt-1 text-xs text-muted-foreground">Choose the topics you see in Explore.</p><div className="mt-3 grid grid-cols-2 gap-2">{SUBJECTS.map((subject) => { const { label, icon: Icon } = SUBJECT_META[subject]; const selected = interests?.includes(subject); return <button key={subject} aria-pressed={!!selected} onClick={() => toggle(subject)} className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 text-sm ${selected ? "border-olive-deep bg-cream font-semibold" : "bg-background"}`}><Icon className="size-4" aria-hidden />{label}{selected && <span className="ml-auto">✓</span>}</button>; })}</div></section>
    <p role="status" className="mt-4 text-sm text-olive-deep">{message}</p><footer className="mt-5 border-t pt-4 text-xs leading-relaxed text-muted-foreground">G.O.A.T · Version {version}<br />Profile, drafts and progress are stored on this device.<br />No account needed · Open source under MIT.</footer>
  </div>;
}
