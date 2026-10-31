import { Toaster } from "@/components/discovery/Toaster";
import { SpeechUnlock } from "@/components/shell/SpeechUnlock";
import { TabBar } from "@/components/shell/TabBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto flex h-dvh max-w-[430px] flex-col bg-background pt-[env(safe-area-inset-top)] shadow-sm">
      <main className="min-h-0 flex-1">{children}</main>
      <TabBar />
      <Toaster />
      <SpeechUnlock />
    </div>
  );
}
