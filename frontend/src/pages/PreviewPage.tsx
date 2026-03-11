import { ArrowLeft, FileText } from "lucide-react";
import { FC } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import DocumentViewer from "../components/DocumentViewer";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

/**
 * Interface for PreviewPage component props
 */
interface PreviewPageProps {}

/**
 * PreviewPage Component
 *
 * Displays side-by-side comparison of original and corrected documents
 * with navigation and document viewer functionality.
 *
 * Query Parameters:
 * - original: Path to original document file
 * - corrected: Path to corrected document file
 * - filename: Display name of the document (default: "Document")
 *
 * @returns React component with document preview interface
 */
const PreviewPage: FC<PreviewPageProps> = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Extract query parameters from URL
  const originalPath = searchParams.get("original");
  const correctedPath = searchParams.get("corrected");
  const filename = searchParams.get("filename") || "Document";

  /**
   * Handle back navigation
   */
  const handleBack = (): void => {
    navigate(-1);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <div className="px-4 pb-0 pt-4 md:px-6 md:pt-6">
        <Card className="rounded-[28px] border-border/70 bg-card/92 shadow-surface">
          <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between md:p-5">
            <div className="flex items-start gap-3">
              <Button variant="outline" size="icon" className="rounded-2xl" onClick={handleBack}>
                <ArrowLeft className="size-4" />
              </Button>

              <div className="min-w-0 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                  CURSA / Preview
                </p>
                <h1 className="truncate text-xl font-semibold tracking-[-0.04em] text-foreground">
                  Сравнение документа
                </h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="size-4" />
                  <span className="truncate">{filename}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 overflow-hidden p-4 md:p-6">
        <DocumentViewer
          originalPath={originalPath}
          correctedPath={correctedPath}
          activePhaseTitle="Предпросмотр документа"
        />
      </div>
    </div>
  );
};

export default PreviewPage;
