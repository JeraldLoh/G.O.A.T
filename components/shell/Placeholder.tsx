export function Placeholder({ title, owner }: { title: string; owner: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-1 p-6 text-center">
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="text-sm text-muted-foreground">Coming soon ({owner})</p>
    </div>
  );
}
