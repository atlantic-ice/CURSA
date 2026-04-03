import DifferenceIcon from "@mui/icons-material/Difference";
import ViewQuiltIcon from "@mui/icons-material/ViewQuilt";
import { Alert, Box, CircularProgress, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import * as Diff from "diff";
import DOMPurify from "dompurify";
import { useEffect, useMemo, useRef, useState } from "react";

import { getApiErrorMessage, previewsApi } from "../api/client";
import "./DocumentViewer.css";

const getSeverityTone = (severity, theme) => {
  switch (severity) {
    case "critical":
    case "error":
      return theme.palette.error.main;
    case "warning":
      return theme.palette.warning.main;
    case "info":
      return theme.palette.info.main;
    default:
      return theme.palette.text.secondary;
  }
};

const safeAlpha = (color, opacity) => {
  try {
    return alpha(color, opacity);
  } catch (err) {
    const percent = Math.max(0, Math.min(100, Math.round(opacity * 100)));
    return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
  }
};

const DocumentViewer = ({
  originalPath,
  correctedPath,
  highlightedIssues = [],
  activePhaseTitle,
  activePhaseAccent = "#38bdf8",
  isProcessing = false,
}) => {
  const theme = useTheme();
  const [mode, setMode] = useState("split"); // 'split', 'diff'
  const [originalHtml, setOriginalHtml] = useState("");
  const [correctedHtml, setCorrectedHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [diffElements, setDiffElements] = useState(null);

  const leftPaneRef = useRef(null);
  const rightPaneRef = useRef(null);
  const isScrolling = useRef(false);
  const visibleHighlights = useMemo(() => highlightedIssues.slice(0, 4), [highlightedIssues]);
  const phaseAccent = activePhaseAccent || theme.palette.info.main;

  useEffect(() => {
    const fetchPreviews = async () => {
      if (!originalPath && !correctedPath) return;

      setLoading(true);
      setError(null);
      try {
        const requests = [];
        if (originalPath) requests.push(previewsApi.generate(originalPath));
        else requests.push(Promise.resolve({ html: "<p>Нет исходного файла</p>" }));

        if (correctedPath) requests.push(previewsApi.generate(correctedPath));
        else requests.push(Promise.resolve({ html: "<p>Нет исправленного файла</p>" }));

        const [origRes, corrRes] = await Promise.all(requests);
        setOriginalHtml(origRes.html || "<p>Нет исходного файла</p>");
        setCorrectedHtml(corrRes.html || "<p>Нет исправленного файла</p>");
      } catch (err) {
        console.error("Error fetching previews:", getApiErrorMessage(err));
        setError(
          getApiErrorMessage(
            err,
            "Не удалось загрузить предпросмотр документа. Пожалуйста, убедитесь, что файлы существуют.",
          ),
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPreviews();
  }, [originalPath, correctedPath]);

  useEffect(() => {
    if (mode === "diff" && originalHtml && correctedHtml) {
      // Compute diff
      const parser = new DOMParser();
      const docOrig = parser.parseFromString(originalHtml, "text/html");
      const docCorr = parser.parseFromString(correctedHtml, "text/html");

      const textOrig = docOrig.body.textContent || "";
      const textCorr = docCorr.body.textContent || "";

      const diff = Diff.diffWords(textOrig, textCorr);

      const elements = diff.map((part, index) => {
        const className = part.added ? "diff-added" : part.removed ? "diff-removed" : "";
        return (
          <span key={index} className={className}>
            {part.value}
          </span>
        );
      });
      setDiffElements(elements);
    }
  }, [originalHtml, correctedHtml, mode]);

  const handleScroll = (source) => (e) => {
    if (mode !== "split") return;
    if (isScrolling.current) return;

    isScrolling.current = true;
    const target = source === "left" ? rightPaneRef.current : leftPaneRef.current;
    const sourceEl = e.target;

    if (target) {
      // Calculate percentage to handle different heights
      const percentage = sourceEl.scrollTop / (sourceEl.scrollHeight - sourceEl.clientHeight);
      target.scrollTop = percentage * (target.scrollHeight - target.clientHeight);
    }

    setTimeout(() => {
      isScrolling.current = false;
    }, 50);
  };

  const handleModeChange = (event, newMode) => {
    if (newMode !== null) {
      setMode(newMode);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <div className="document-viewer-container">
      {(activePhaseTitle || visibleHighlights.length > 0) && (
        <div className="viewer-stage-summary" data-testid="document-viewer-stage-summary">
          {activePhaseTitle && (
            <div
              className="viewer-phase-pill"
              style={{
                borderColor: safeAlpha(phaseAccent, 0.45),
                background: safeAlpha(phaseAccent, 0.12),
                color: phaseAccent,
              }}
            >
              {isProcessing ? "Сейчас сканируем" : "Фокус проверки"}: {activePhaseTitle}
            </div>
          )}
          {visibleHighlights.length > 0 && (
            <div className="viewer-highlight-count">Фокусных зон: {visibleHighlights.length}</div>
          )}
        </div>
      )}

      <div className="viewer-controls">
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={handleModeChange}
          aria-label="view mode"
          size="small"
        >
          <ToggleButton value="split" aria-label="split view">
            <ViewQuiltIcon sx={{ mr: 1 }} /> Сравнение
          </ToggleButton>
          <ToggleButton value="diff" aria-label="diff view">
            <DifferenceIcon sx={{ mr: 1 }} /> Различия
          </ToggleButton>
        </ToggleButtonGroup>
      </div>

      {visibleHighlights.length > 0 && (
        <div className="viewer-highlight-rail" data-testid="viewer-highlight-rail">
          {visibleHighlights.map((issue) => (
            <div
              key={issue.id}
              className="viewer-highlight-card"
              style={{ borderColor: safeAlpha(getSeverityTone(issue.severity, theme), 0.35) }}
            >
              <div className="viewer-highlight-card-top">
                <span
                  className="viewer-highlight-dot"
                  style={{ backgroundColor: getSeverityTone(issue.severity, theme) }}
                />
                <span className="viewer-highlight-title">{issue.title}</span>
              </div>
              <div className="viewer-highlight-meta">{issue.location}</div>
              <div className="viewer-highlight-status">{issue.status}</div>
            </div>
          ))}
        </div>
      )}

      <div className="viewer-content">
        {mode === "split" ? (
          <>
            <div className="doc-pane" style={{ "--viewer-accent": phaseAccent }}>
              <div className="doc-pane-header">
                <span>Оригинал</span>
                {activePhaseTitle && (
                  <span className="doc-pane-phase">Фаза: {activePhaseTitle}</span>
                )}
              </div>
              <div className="doc-pane-stage">
                <div
                  className={`doc-pane-body${isProcessing ? " doc-pane-body-processing" : ""}`}
                  ref={leftPaneRef}
                  onScroll={handleScroll("left")}
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(originalHtml) }}
                />
                {(activePhaseTitle || isProcessing) && (
                  <div className="doc-pane-overlay">
                    <div className="doc-pane-focus-caption">
                      {isProcessing
                        ? "Идёт проход по документу"
                        : "Показываем активную зону проверки"}
                    </div>
                    <div className={`doc-scanline${isProcessing ? " doc-scanline-active" : ""}`} />
                  </div>
                )}
              </div>
            </div>
            <div className="doc-pane" style={{ "--viewer-accent": phaseAccent }}>
              <div className="doc-pane-header">
                <span>Исправленный</span>
                {activePhaseTitle && (
                  <span className="doc-pane-phase">Фокус: {activePhaseTitle}</span>
                )}
              </div>
              <div className="doc-pane-stage">
                <div
                  className={`doc-pane-body${isProcessing ? " doc-pane-body-processing" : ""}`}
                  ref={rightPaneRef}
                  onScroll={handleScroll("right")}
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(correctedHtml) }}
                />
                {(activePhaseTitle || isProcessing) && (
                  <div className="doc-pane-overlay">
                    <div className="doc-pane-focus-caption doc-pane-focus-caption-success">
                      {isProcessing
                        ? "Подсвечиваем фрагменты, которые сейчас нормализуются"
                        : "Здесь виден уже исправленный результат"}
                    </div>
                    <div className={`doc-scanline${isProcessing ? " doc-scanline-active" : ""}`} />
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="doc-pane" style={{ width: "100%" }}>
            <div className="doc-pane-header">
              <span>Текстовые различия</span>
              <span className="doc-pane-phase doc-pane-phase-diff">
                Зелёный = добавлено, красный = убрано
              </span>
            </div>
            <div className="doc-pane-body diff-view-container">{diffElements}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentViewer;
