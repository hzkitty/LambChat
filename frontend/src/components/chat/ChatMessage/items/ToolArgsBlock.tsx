import type { ReactNode } from "react";

type ToolArgsBlockSize = "detail" | "compact";

const sizeClasses: Record<ToolArgsBlockSize, string> = {
  detail:
    "group/args relative flex items-center gap-2 px-3 py-2 rounded-lg bg-stone-100 dark:bg-stone-800 text-sm text-stone-500 dark:text-stone-400 font-mono",
  compact:
    "group/args relative flex items-center gap-2 mb-2 px-2 py-1.5 rounded-md bg-stone-100 dark:bg-stone-800 text-xs text-stone-500 dark:text-stone-400 font-mono",
};

export function ToolArgsBlock({
  children,
  className = "",
  size,
  wrap = false,
}: {
  children: ReactNode;
  className?: string;
  size: ToolArgsBlockSize;
  wrap?: boolean;
}) {
  return (
    <div
      className={[sizeClasses[size], wrap ? "flex-wrap" : "", className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
