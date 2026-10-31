import { FlagButton } from "@/components/discovery/FlagButton";
import { RatingButtons } from "@/components/discovery/RatingButtons";
import { SourceSheet } from "@/components/feed/SourceSheet";
import type { FeedEntry } from "@/lib/schemas";

// Minimal renderer so seeds show up in the shell. Lane B replaces it.
export function FeedItem({ entry }: { entry: FeedEntry }) {
  const { bank } = entry;
  return (
    <article className="flex h-full snap-start flex-col justify-center gap-3 p-6">
      <p className="text-xs text-muted-foreground">
        {bank.title} · {bank.license}
      </p>
      {entry.kind === "card" ? (
        <>
          <p className="text-sm font-medium">{entry.card.topic}</p>
          <h2 className="text-2xl font-semibold">{entry.card.title}</h2>
          <p>{entry.card.body}</p>
          <blockquote className="border-l-2 pl-3 text-sm italic">{entry.card.quote}</blockquote>
          <SourceSheet card={entry.card} />
          <FlagButton cardId={entry.card.id} />
        </>
      ) : (
        <>
          <p className="text-sm font-medium">Quiz: {entry.quiz.topic}</p>
          <h2 className="text-xl font-semibold">{entry.quiz.question}</h2>
          <ul className="list-disc pl-5">
            {entry.quiz.options.map((option) => (
              <li key={option}>{option}</li>
            ))}
          </ul>
        </>
      )}
      <RatingButtons bankId={bank.id} />
    </article>
  );
}
