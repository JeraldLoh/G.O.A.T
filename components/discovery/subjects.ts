import {
  Briefcase,
  Cpu,
  FlaskConical,
  HeartPulse,
  Landmark,
  Languages,
  Shapes,
  Sigma,
  type LucideIcon,
} from "lucide-react";
import type { Level, Subject } from "@/lib/schemas";

export const SUBJECT_META: Record<Subject, { label: string; icon: LucideIcon }> = {
  science: { label: "Science", icon: FlaskConical },
  technology: { label: "Technology", icon: Cpu },
  business: { label: "Business", icon: Briefcase },
  humanities: { label: "Humanities", icon: Landmark },
  math: { label: "Math", icon: Sigma },
  language: { label: "Language", icon: Languages },
  health: { label: "Health", icon: HeartPulse },
  other: { label: "Other", icon: Shapes },
};

export const LEVEL_LABEL: Record<Level, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};
