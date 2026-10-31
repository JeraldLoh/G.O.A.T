import { BankLesson } from "@/components/explore/BankLesson";

export default async function LearnPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BankLesson bankId={id} />;
}
