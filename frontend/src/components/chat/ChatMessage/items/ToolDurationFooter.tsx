import { Clock } from "lucide-react";
import { formatToolDuration, getToolDurationSeconds } from "./toolDuration";

export function ToolDurationFooter({
  startedAt,
  completedAt,
}: {
  startedAt?: string;
  completedAt?: string;
}) {
  const seconds = getToolDurationSeconds(startedAt, completedAt);
  if (seconds === null) return undefined;

  return (
    <div className="flex items-center gap-1.5 px-4 py-2 text-xs text-stone-400 dark:text-stone-500 border-t border-stone-100 dark:border-stone-800">
      <Clock size={11} className="shrink-0" />
      <span className="tabular-nums">{formatToolDuration(seconds)}</span>
    </div>
  );
}
