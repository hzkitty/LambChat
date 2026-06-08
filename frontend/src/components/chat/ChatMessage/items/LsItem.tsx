import { memo, useMemo } from "react";
import { clsx } from "clsx";
import { FolderOpen, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CollapsiblePill } from "../../../common";
import { extractPaths } from "./toolUtils";
import { openPersistentToolPanel } from "./persistentToolPanelState";
import { ToolArgsBlock } from "./ToolArgsBlock";
import { ToolHoverCopyButton } from "./ToolHoverCopyButton";
import { ToolInlineDetails } from "./ToolInlineDetails";
import { ToolDurationFooter } from "./ToolDurationFooter";

const LsItem = memo(function LsItem({
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
  const dirPath = (args.path as string) || "/";

  const entries = useMemo(() => {
    return extractPaths(result);
  }, [result]);

  const canExpand = entries.length > 0;
  const displayLabel =
    dirPath === "/" ? "/" : dirPath.split("/").filter(Boolean).pop() || dirPath;
  const status = isPending
    ? "loading"
    : cancelled
      ? "cancelled"
      : success
        ? "success"
        : "error";

  const detailContent = canExpand && (
    <div className="p-4 sm:p-5 space-y-3">
      <ToolArgsBlock size="detail">
        <FolderOpen size={14} className="shrink-0 opacity-60" />
        <span className="truncate">{dirPath}</span>
        <span className="shrink-0 text-stone-400 dark:text-stone-500">
          {entries.length} items
        </span>
        <ToolHoverCopyButton text={dirPath} position="args" />
      </ToolArgsBlock>
      <div className="relative group rounded-lg border border-stone-200/60 dark:border-stone-700/50 bg-stone-50 dark:bg-stone-900 overflow-auto max-h-[60dvh]">
        <ToolHoverCopyButton
          text={entries.join("\n")}
          size={14}
          position="panelRaised"
          copyButtonClassName="!bg-white/80 dark:!bg-stone-800/80 !rounded-md !border !border-stone-200 dark:!border-stone-700"
        />
        {entries.map((entry, i) => {
          const isDir = entry.endsWith("/") || entry.endsWith("\\");
          const name = isDir
            ? entry.slice(0, -1).split("/").filter(Boolean).pop() ||
              entry.slice(0, -1)
            : entry.split("/").filter(Boolean).pop() || entry;
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
                <FolderOpen
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
    </div>
  );

  return (
    <>
      <CollapsiblePill
        status={status}
        icon={<FolderOpen size={12} className="shrink-0 opacity-50" />}
        label={`${t("chat.message.toolLs")} ${dirPath}`}
        variant="tool"
        formatLabel={false}
        expandable={canExpand}
        onPanelOpen={() => {
          if (!canExpand) return;
          openPersistentToolPanel({
            title: `${t("chat.message.toolLs")} ${displayLabel}`,
            icon: <FolderOpen size={16} />,
            status,
            subtitle: dirPath,
            children: detailContent,
            footer: durationFooter,
          });
        }}
      >
        {canExpand && (
          <ToolInlineDetails>
            <ToolArgsBlock size="compact">
              <FolderOpen size={12} className="shrink-0 opacity-60" />
              <span className="truncate">{dirPath}</span>
              <span className="shrink-0 text-stone-400 dark:text-stone-500">
                {t("chat.message.toolItemCount", { count: entries.length })}
              </span>
              <ToolHoverCopyButton text={dirPath} position="argsCompact" />
            </ToolArgsBlock>
            <div className="relative group max-h-48 overflow-y-auto rounded-md border border-stone-200/60 dark:border-stone-700/50 bg-stone-50 dark:bg-stone-900">
              <ToolHoverCopyButton
                text={entries.join("\n")}
                position="panelCompactRaised"
                copyButtonClassName="!bg-white/80 dark:!bg-stone-800/80 !rounded-md !border !border-stone-200 dark:!border-stone-700"
              />
              {entries.map((entry, i) => {
                const isDir = entry.endsWith("/") || entry.endsWith("\\");
                const name = isDir
                  ? entry.slice(0, -1).split("/").filter(Boolean).pop() ||
                    entry.slice(0, -1)
                  : entry.split("/").filter(Boolean).pop() || entry;
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
                      <FolderOpen
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
          </ToolInlineDetails>
        )}
      </CollapsiblePill>
    </>
  );
});

export { LsItem };
