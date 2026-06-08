import type { ReactNode } from "react";

export function ToolInlineDetails({ children }: { children: ReactNode }) {
  return (
    <div className="mt-2 ml-4 pl-3 border-l-2 border-theme-border max-h-80 overflow-y-auto overflow-x-hidden min-w-0">
      {children}
    </div>
  );
}
