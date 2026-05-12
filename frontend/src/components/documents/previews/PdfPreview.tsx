import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { LoadingSpinner } from "../../common/LoadingSpinner";

interface PdfPreviewProps {
  url: string;
}

const PdfPreview = memo(function PdfPreview({ url }: PdfPreviewProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const pdfViewerUrl = `${url}#zoom=page-width&view=FitH`;

  if (loadFailed) {
    return (
      <div className="flex h-full min-h-[400px] w-full flex-col items-center justify-center gap-4 bg-stone-100 px-6 text-center dark:bg-stone-950">
        <div>
          <p className="text-sm font-medium text-stone-700 dark:text-stone-200">
            {t("documents.pdfPreviewUnavailable", "PDF 预览不可用")}
          </p>
          <p className="mt-1 max-w-sm text-xs text-stone-500 dark:text-stone-400">
            {t(
              "documents.pdfPreviewUnavailableHint",
              "当前浏览器无法在页面内打开这个 PDF，可以在新窗口中查看。",
            )}
          </p>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-700 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-300"
        >
          {t("documents.openInNewTab", "在新窗口打开")}
        </a>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden bg-stone-200 dark:bg-stone-950">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-stone-100/80 backdrop-blur-sm dark:bg-stone-950/80">
          <LoadingSpinner
            className="text-stone-400 dark:text-stone-500"
            size="lg"
          />
        </div>
      )}
      <iframe
        src={pdfViewerUrl}
        title={t("documents.pdfPreviewTitle", "PDF 预览")}
        className="block h-full min-h-0 w-full border-0 bg-white dark:bg-stone-900"
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setLoadFailed(true);
        }}
      />
    </div>
  );
});

export default PdfPreview;
