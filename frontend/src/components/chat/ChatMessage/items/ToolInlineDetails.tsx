import type { ReactNode } from "react";

export function ToolInlineDetails({ children }: { children: ReactNode }) {
  return (
    <div className="mt-2 ml-4 pl-3 border-l-2 border-stone-200/60 dark:border-stone-700/50 max-h-80 overflow-y-auto min-w-0">
      {children}
    </div>
  );
}
