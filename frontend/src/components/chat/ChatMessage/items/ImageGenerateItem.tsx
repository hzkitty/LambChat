import { memo, useMemo } from "react";
import { clsx } from "clsx";
import { Sparkles, ImageIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CollapsiblePill } from "../../../common";
import { extractText } from "./toolUtils";
import { extractGeneratedImageResults } from "./toolImageResults";
import { openPersistentToolPanel } from "./persistentToolPanelState";
import { ToolArgsBlock } from "./ToolArgsBlock";
import { ToolInlineDetails } from "./ToolInlineDetails";
import { ToolHoverCopyButton } from "./ToolHoverCopyButton";
import { ToolDurationFooter } from "./ToolDurationFooter";

const ImageGenerateItem = memo(function ImageGenerateItem({
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

  const prompt = (args.prompt as string) || "";
  const size = (args.size as string) || "";
  const quality = (args.quality as string) || "";
  const outputFormat = (args.output_format as string) || "";

  const images = useMemo(() => {
    let parsed: unknown = result;
    if (typeof result === "string") {
      try {
        parsed = JSON.parse(result);
      } catch {
        return [];
      }
    }
    return extractGeneratedImageResults(parsed);
  }, [result]);

  const fallbackText = useMemo(() => {
    if (images.length > 0) return "";
    const text = extractText(result);
    if (!text) return "";
    try {
      const obj = JSON.parse(text);
      if (obj.revised_prompt) return obj.revised_prompt as string;
      if (obj.error) return obj.error as string;
    } catch {
      // not JSON
    }
    return text;
  }, [result, images.length]);

  const canExpand = !!prompt || images.length > 0 || !!fallbackText;
  const status = isPending
    ? "loading"
    : cancelled
      ? "cancelled"
      : success
        ? "success"
        : "error";

  const detailContent = canExpand && (
    <div className="p-4 sm:p-5 space-y-3">
      {prompt && (
        <ToolArgsBlock size="detail" wrap>
          <Sparkles
            size={14}
            className="shrink-0 text-rose-500 dark:text-rose-400"
          />
          <span className="truncate text-rose-600 dark:text-rose-300">
            {prompt}
          </span>
          <ToolHoverCopyButton text={prompt} position="args" />
        </ToolArgsBlock>
      )}

      <div className="flex flex-wrap gap-1.5">
        {size && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50/70 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 text-xs font-mono">
            <ImageIcon size={10} className="opacity-50" />
            {size}
          </span>
        )}
        {quality && (
          <span className="px-2 py-0.5 rounded-md bg-theme-bg-subtle border border-theme-border text-theme-text-tertiary text-xs">
            {quality}
          </span>
        )}
        {outputFormat && (
          <span className="px-2 py-0.5 rounded-md bg-theme-bg-subtle border border-theme-border text-theme-text-tertiary text-xs font-mono uppercase">
            {outputFormat}
          </span>
        )}
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-2.5">
          {images.map((img, i) => (
            <div
              key={i}
              className={clsx(
                "group/img relative rounded-xl overflow-hidden",
                "border border-theme-border",
                "hover:border-rose-200 dark:hover:border-rose-800/50 hover:shadow-md",
                "transition-all duration-200",
              )}
            >
              <img
                src={img.url}
                alt={img.name}
                className="w-full aspect-square object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity">
                <div className="absolute bottom-2 left-2 right-2">
                  <span className="text-white/90 text-[11px] font-medium truncate block drop-shadow-sm">
                    {img.name}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {fallbackText && (
        <pre className="group/result relative text-xs text-theme-text-tertiary whitespace-pre-wrap break-words p-3 rounded-lg bg-theme-bg border border-theme-border">
          {fallbackText}
          <ToolHoverCopyButton
            text={fallbackText}
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
        icon={<Sparkles size={12} className="shrink-0 opacity-50" />}
        label={`${t("chat.message.toolImageGenerate")} ${
          prompt.length > 40 ? prompt.slice(0, 37) + "…" : prompt
        }`}
        variant="tool"
        expandable={canExpand}
        onPanelOpen={() => {
          if (!canExpand) return;
          openPersistentToolPanel({
            title: t("chat.message.toolImageGenerate"),
            icon: <Sparkles size={16} />,
            status,
            subtitle:
              prompt.length > 80
                ? prompt.slice(0, 77) + "…"
                : prompt || undefined,
            children: detailContent,
            footer: durationFooter,
          });
        }}
      >
        {canExpand && (
          <ToolInlineDetails>
            <ToolArgsBlock size="compact" wrap>
              <Sparkles
                size={12}
                className="shrink-0 text-rose-500 dark:text-rose-400"
              />
              <span className="truncate text-rose-600 dark:text-rose-300">
                {prompt.length > 120 ? prompt.slice(0, 117) + "…" : prompt}
              </span>
              <ToolHoverCopyButton text={prompt} position="argsCompact" />
            </ToolArgsBlock>

            <div className="flex flex-wrap gap-1">
              {images.length > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-rose-50/70 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 text-[10px]">
                  {t("chat.message.toolImageCount", { count: images.length })}
                </span>
              )}
              {size && (
                <span className="px-1.5 py-0.5 rounded bg-theme-bg-subtle border border-theme-border text-theme-text-tertiary text-[10px] font-mono">
                  {size}
                </span>
              )}
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-2 gap-1.5">
                {images.slice(0, 4).map((img, i) => (
                  <div
                    key={i}
                    className="relative rounded-lg overflow-hidden border border-theme-border hover:border-rose-200 dark:hover:border-rose-800/50 transition-colors"
                  >
                    <img
                      src={img.url}
                      alt={img.name}
                      className="w-full aspect-square object-cover"
                      loading="lazy"
                    />
                  </div>
                ))}
                {images.length > 4 && (
                  <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/50 text-white text-[9px]">
                    +{images.length - 4}
                  </div>
                )}
              </div>
            )}

            {fallbackText && (
              <pre className="group/result relative text-xs text-theme-text-tertiary whitespace-pre-wrap break-words overflow-y-auto min-w-0">
                {fallbackText.length > 300
                  ? fallbackText.slice(0, 297) + "…"
                  : fallbackText}
                <ToolHoverCopyButton
                  text={fallbackText}
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

export { ImageGenerateItem };
