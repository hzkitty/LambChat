import { memo, useMemo } from "react";
import { clsx } from "clsx";
import { FolderSearch, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CollapsiblePill } from "../../../common";
import { extractPaths } from "./toolUtils";
import { openPersistentToolPanel } from "./persistentToolPanelState";
import { ToolArgsBlock } from "./ToolArgsBlock";
import { ToolHoverCopyButton } from "./ToolHoverCopyButton";
import { ToolInlineDetails } from "./ToolInlineDetails";
import { ToolDurationFooter } from "./ToolDurationFooter";

const GlobItem = memo(function GlobItem({
  args,
  result,
  success,
  isPending,
  cancelled,
  startedAt,
  completedAt,
}: {
  args: Record<string, unknown>;
  result?: string | Record<string, unknown>;
  success?: boolean;
  isPending?: boolean;
  cancelled?: boolean;
  startedAt?: string;
  completedAt?: string;
}) {
  const { t } = useTranslation();
  const durationFooter = (
    <ToolDurationFooter startedAt={startedAt} completedAt={completedAt} />
  );
  const pattern = (args.pattern as string) || "";
  const searchPath = (args.path as string) || "";

  const paths = useMemo(() => {
    return extractPaths(result);
  }, [result]);

  const canExpand = !!pattern || paths.length > 0;
  const status = isPending
    ? "loading"
    : cancelled
      ? "cancelled"
      : success
        ? "success"
        : "error";

  const detailContent = canExpand && (
    <div className="p-4 sm:p-5 space-y-3">
      <ToolArgsBlock size="detail" wrap>
        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
          {pattern}
        </span>
        {searchPath && (
          <span className="text-stone-400 dark:text-stone-500">
            in {searchPath}
          </span>
        )}
        <ToolHoverCopyButton text={pattern} position="args" />
      </ToolArgsBlock>
      {paths.length > 0 && (
        <div className="relative group rounded-lg border border-stone-200/60 dark:border-stone-700/50 bg-stone-50 dark:bg-stone-900 overflow-auto max-h-[60dvh]">
          <ToolHoverCopyButton
            text={paths.join("\n")}
            size={14}
            position="panelRaised"
            copyButtonClassName="!bg-white/80 dark:!bg-stone-800/80 !rounded-md !border !border-stone-200 dark:!border-stone-700"
          />
          {paths.map((p, i) => {
            const isDir = p.endsWith("/") || p.endsWith("\\");
            const name = isDir
              ? p.slice(0, -1).split("/").filter(Boolean).pop() ||
                p.slice(0, -1)
              : p.split("/").filter(Boolean).pop() || p;
            return (
              <div
                key={i}
                className={clsx(
                  "flex items-center gap-2.5 px-4 py-2 text-sm font-mono",
                  "border-b border-stone-100 dark:border-stone-800 last:border-b-0",
                  "hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors",
                )}
              >
                {isDir ? (
                  <FolderSearch
                    size={14}
                    className="shrink-0 text-amber-500 dark:text-amber-400"
                  />
                ) : (
                  <FileText
                    size={14}
                    className="shrink-0 text-stone-400 dark:text-stone-500"
                  />
                )}
                <span
                  className={clsx(
                    "truncate",
                    isDir
                      ? "text-stone-700 dark:text-stone-200 font-medium"
                      : "text-stone-600 dark:text-stone-300",
                  )}
                >
                  {name}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <>
      <CollapsiblePill
        status={status}
        icon={<FolderSearch size={12} className="shrink-0 opacity-50" />}
        label={`${t("chat.message.toolGlob")} ${pattern || ""}`}
        variant="tool"
        expandable={canExpand}
        onPanelOpen={() => {
          if (!canExpand) return;
          openPersistentToolPanel({
            title: `${t("chat.message.toolGlob")} ${pattern}`,
            icon: <FolderSearch size={16} />,
            status,
            subtitle: searchPath || undefined,
            children: detailContent,
            footer: durationFooter,
          });
        }}
      >
        {canExpand && (
          <ToolInlineDetails>
            <ToolArgsBlock size="compact" wrap>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                {pattern}
              </span>
              {searchPath && (
                <span className="text-stone-400 dark:text-stone-500">
                  {t("chat.message.toolInPath", { path: searchPath })}
                </span>
              )}
              <ToolHoverCopyButton text={pattern} position="argsCompact" />
            </ToolArgsBlock>
            {paths.length > 0 && (
              <div className="relative group max-h-48 overflow-y-auto rounded-md border border-stone-200/60 dark:border-stone-700/50 bg-stone-50 dark:bg-stone-900">
                <ToolHoverCopyButton
                  text={paths.join("\n")}
                  position="panelCompactRaised"
                  copyButtonClassName="!bg-white/80 dark:!bg-stone-800/80 !rounded-md !border !border-stone-200 dark:!border-stone-700"
                />
                {paths.map((p, i) => {
                  const isDir = p.endsWith("/") || p.endsWith("\\");
                  const name = isDir
                    ? p.slice(0, -1).split("/").filter(Boolean).pop() ||
                      p.slice(0, -1)
                    : p.split("/").filter(Boolean).pop() || p;
                  return (
                    <div
                      key={i}
                      className={clsx(
                        "flex items-center gap-2 px-3 py-1 text-xs font-mono",
                        "border-b border-stone-100 dark:border-stone-800 last:border-b-0",
                        "hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors",
                      )}
                    >
                      {isDir ? (
                        <FolderSearch
                          size={12}
                          className="shrink-0 text-amber-500 dark:text-amber-400"
                        />
                      ) : (
                        <FileText
                          size={12}
                          className="shrink-0 text-stone-400 dark:text-stone-500"
                        />
                      )}
                      <span
                        className={clsx(
                          "truncate",
                          isDir
                            ? "text-stone-700 dark:text-stone-200 font-medium"
                            : "text-stone-600 dark:text-stone-300",
                        )}
                      >
                        {name}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </ToolInlineDetails>
        )}
      </CollapsiblePill>
    </>
  );
});

export { GlobItem };
