import { memo, useMemo } from "react";
import { clsx } from "clsx";
import { UserRound, Tag } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CollapsiblePill } from "../../../common";
import { extractText } from "./toolUtils";
import { openPersistentToolPanel } from "./persistentToolPanelState";
import { ToolInlineDetails } from "./ToolInlineDetails";
import { ToolHoverCopyButton } from "./ToolHoverCopyButton";
import { ToolDurationFooter } from "./ToolDurationFooter";

const PersonaItem = memo(function PersonaItem({
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

  const personaName = (args.name as string) || "";

  const parsed = useMemo(() => {
    const text = extractText(result);
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }, [result]);

  const displayName = parsed?.name || personaName;
  const description = parsed?.description || "";
  const avatar = parsed?.avatar || (args.avatar as string) || "";
  const tags: string[] = parsed?.tags || (args.tags as string[]) || [];
  const presetId = parsed?.id || (args.preset_id as string) || "";

  const canExpand =
    !!displayName || !!description || tags.length > 0 || !!result;
  const status = isPending
    ? "loading"
    : cancelled
      ? "cancelled"
      : success
        ? "success"
        : "error";

  const detailContent = canExpand && (
    <div className="p-4 sm:p-5 space-y-3">
      {(displayName || avatar) && (
        <div
          className={clsx(
            "flex items-center gap-3 rounded-xl p-3",
            "bg-theme-bg border border-theme-border",
            "hover:border-violet-200 dark:hover:border-violet-800/50 transition-colors",
          )}
        >
          <div
            className={clsx(
              "w-10 h-10 rounded-lg flex items-center justify-center text-xl leading-none shrink-0",
              "bg-violet-100 dark:bg-violet-900/30",
            )}
          >
            {avatar || (
              <UserRound
                size={20}
                className="text-violet-500 dark:text-violet-400"
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm text-theme-text font-semibold truncate">
              {displayName}
            </div>
            {description && (
              <div className="text-xs text-theme-text-tertiary truncate mt-0.5">
                {description}
              </div>
            )}
          </div>
          {presetId && (
            <ToolHoverCopyButton
              text={presetId}
              position="args"
              copyButtonClassName="!bg-theme-bg-card/80 !rounded-md !border !border-theme-border"
            />
          )}
        </div>
      )}

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-100/60 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 text-xs"
            >
              <Tag size={9} className="opacity-50" />
              {tag}
            </span>
          ))}
        </div>
      )}

      {result && !displayName && (
        <pre className="group/result relative text-xs text-theme-text-tertiary whitespace-pre-wrap break-words p-3 rounded-lg bg-theme-bg border border-theme-border">
          {(() => {
            const text = extractText(result);
            return text.length > 600 ? text.slice(0, 597) + "…" : text;
          })()}
          <ToolHoverCopyButton
            text={extractText(result)}
            position="result"
            copyButtonClassName="!bg-theme-bg-card/80 !rounded-md !border !border-theme-border"
          />
        </pre>
      )}
    </div>
  );

  return (
    <>
      <CollapsiblePill
        status={status}
        icon={<UserRound size={12} className="shrink-0 opacity-50" />}
        label={`${t("chat.message.toolPersonaPreset")} ${displayName || ""}`}
        variant="tool"
        expandable={canExpand}
        onPanelOpen={() => {
          if (!canExpand) return;
          openPersistentToolPanel({
            title: t("chat.message.toolPersonaPreset"),
            icon: <UserRound size={16} />,
            status,
            subtitle: displayName || undefined,
            children: detailContent,
            footer: durationFooter,
          });
        }}
      >
        {canExpand && (
          <ToolInlineDetails>
            {(displayName || avatar) && (
              <div
                className={clsx(
                  "flex items-center gap-2 rounded-lg px-2.5 py-2",
                  "bg-theme-bg border border-theme-border",
                  "hover:border-violet-200 dark:hover:border-violet-800/50 transition-colors",
                )}
              >
                <div className="w-6 h-6 rounded-md flex items-center justify-center text-sm leading-none shrink-0 bg-violet-100/60 dark:bg-violet-900/20">
                  {avatar || (
                    <UserRound
                      size={12}
                      className="text-violet-500 dark:text-violet-400"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-theme-text font-medium truncate">
                    {displayName}
                  </div>
                  {description && (
                    <div className="text-[10px] text-theme-text-tertiary truncate">
                      {description}
                    </div>
                  )}
                </div>
              </div>
            )}

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.slice(0, 8).map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-violet-100/60 dark:bg-violet-900/20 text-violet-600 dark:text-violet-300 text-[10px]"
                  >
                    <Tag size={7} className="opacity-50" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {result && !displayName && (
              <pre className="group/result relative text-xs text-theme-text-tertiary whitespace-pre-wrap break-words overflow-y-auto min-w-0">
                {(() => {
                  const text = extractText(result);
                  return text.length > 300 ? text.slice(0, 297) + "…" : text;
                })()}
                <ToolHoverCopyButton
                  text={extractText(result)}
                  position="resultCompact"
                />
              </pre>
            )}
          </ToolInlineDetails>
        )}
      </CollapsiblePill>
    </>
  );
});

export { PersonaItem };
