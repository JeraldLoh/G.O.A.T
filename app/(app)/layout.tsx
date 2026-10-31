import { TabBar } from "@/components/shell/TabBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex h-dvh max-w-[430px] flex-col bg-background shadow-sm">
      <main className="min-h-0 flex-1">{children}</main>
      <footer className="py-0.5 text-center text-[10px] text-muted-foreground">
        Open source under the{" "}
        <a
          className="underline"
          href="https://github.com/JeraldLoh/G.O.A.T/blob/main/LICENSE"
        >
          MIT License
        </a>
      </footer>
      <TabBar />
    </div>
  );
}
