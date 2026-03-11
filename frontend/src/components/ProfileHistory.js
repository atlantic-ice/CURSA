import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Eye,
  History,
  Loader2,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import PropTypes from "prop-types";
import { useCallback, useEffect, useState } from "react";

import { getApiErrorMessage, profilesApi } from "../api/client";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Separator } from "./ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

export default function ProfileHistory({ profileId, profileName, isSystemProfile, onRestore }) {
  const [loading, setLoading] = useState(false);
  const [versions, setVersions] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(async () => {
    if (!profileId) return;

    setLoading(true);
    setError(null);
    try {
      const res = await profilesApi.listHistory(profileId);
      setVersions(res.versions || []);
    } catch (err) {
      console.error("Error fetching history:", err);
      setError(getApiErrorMessage(err, "Не удалось загрузить историю версий"));
      setVersions([]);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    if (expanded && profileId) {
      void fetchHistory();
    }
  }, [expanded, fetchHistory, profileId]);

  const formatDate = (timestamp) => {
    if (!timestamp) return "Неизвестно";
    const date = new Date(timestamp);
    return date.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handlePreview = async (version) => {
    try {
      setError(null);
      const res = await profilesApi.getHistoryVersion(profileId, version.filename);
      setPreviewData(res);
      setPreviewOpen(true);
    } catch (err) {
      console.error("Error loading version:", err);
      setError(getApiErrorMessage(err, "Не удалось загрузить версию"));
    }
  };

  const handleRestoreClick = (version) => {
    setSelectedVersion(version);
    setRestoreConfirmOpen(true);
  };

  const handleRestoreConfirm = async () => {
    if (!selectedVersion) return;

    setRestoring(true);
    try {
      setError(null);
      await profilesApi.restoreVersion(profileId, selectedVersion.filename);
      setRestoreConfirmOpen(false);
      setSelectedVersion(null);
      if (onRestore) {
        onRestore();
      }
      await fetchHistory();
    } catch (err) {
      console.error("Error restoring:", err);
      setError(getApiErrorMessage(err, "Ошибка при восстановлении версии"));
    } finally {
      setRestoring(false);
    }
  };

  if (!profileId) return null;

  return (
    <TooltipProvider>
      <>
        <Card className="rounded-[1.75rem] border-border/70 bg-card/90 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
          <CardContent className="p-5">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 text-left"
              onClick={() => setExpanded((previous) => !previous)}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent text-muted-foreground">
                  <History className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">История версий</p>
                  <p className="text-xs text-muted-foreground">
                    Снимки изменений и восстановление прошлых состояний.
                  </p>
                </div>
                {versions.length > 0 ? (
                  <Badge variant="secondary" className="rounded-full">
                    {versions.length}
                  </Badge>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                {expanded ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(event) => {
                      event.stopPropagation();
                      fetchHistory();
                    }}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                ) : null}
                {expanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </button>

            {expanded ? (
              <div className="mt-4 space-y-3">
                {error ? (
                  <div className="flex items-start gap-2 rounded-2xl border border-destructive/15 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                ) : null}

                {loading ? (
                  <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Загрузка истории...
                  </div>
                ) : versions.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
                    История версий пуста.
                  </div>
                ) : (
                  <div className="space-y-2">
                    <AnimatePresence>
                      {versions.map((version, index) => (
                        <motion.div
                          key={version.filename}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.04 }}
                          className="rounded-2xl border border-border/60 bg-muted/25 p-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {formatDate(version.timestamp)}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {version.version ? `v${version.version}` : "Снимок профиля"}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handlePreview(version)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Просмотр</TooltipContent>
                              </Tooltip>
                              {!isSystemProfile ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleRestoreClick(version)}
                                    >
                                      <RotateCcw className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Восстановить</TooltipContent>
                                </Tooltip>
                              ) : null}
                            </div>
                          </div>
                          {index < versions.length - 1 ? <Separator className="mt-3" /> : null}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Просмотр версии</DialogTitle>
              <DialogDescription>
                {previewData
                  ? formatDate(previewData._version_timestamp)
                  : "Загрузка снимка профиля."}
              </DialogDescription>
            </DialogHeader>
            {previewData ? (
              <div className="max-h-[400px] overflow-auto rounded-2xl border border-border/70 bg-muted/30 p-4">
                <pre className="whitespace-pre-wrap font-mono text-xs leading-6 text-foreground">
                  {JSON.stringify(previewData, null, 2)}
                </pre>
              </div>
            ) : null}
            <DialogFooter>
              <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                Закрыть
              </Button>
              {!isSystemProfile && previewData ? (
                <Button
                  onClick={() => {
                    setPreviewOpen(false);
                    handleRestoreClick({
                      filename:
                        previewData._version_timestamp
                          ?.replace(/[:-]/g, "")
                          .replace("T", "_")
                          .split(".")[0] + ".json",
                      timestamp: previewData._version_timestamp,
                    });
                  }}
                >
                  <RotateCcw className="h-4 w-4" />
                  Восстановить
                </Button>
              ) : null}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={restoreConfirmOpen} onOpenChange={setRestoreConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Восстановить версию?</DialogTitle>
              <DialogDescription>
                Текущая версия будет сохранена в историю. Восстановить профиль "{profileName}" из
                версии от {selectedVersion ? formatDate(selectedVersion.timestamp) : "..."}?
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-2xl border border-amber-500/15 bg-amber-500/5 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
              После восстановления текущая версия профиля не пропадёт, а будет добавлена в историю
              как новый снимок.
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setRestoreConfirmOpen(false)}
                disabled={restoring}
              >
                Отмена
              </Button>
              <Button onClick={handleRestoreConfirm} disabled={restoring}>
                {restoring ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
                Восстановить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    </TooltipProvider>
  );
}

ProfileHistory.propTypes = {
  profileId: PropTypes.string.isRequired,
  profileName: PropTypes.string,
  isSystemProfile: PropTypes.bool,
  onRestore: PropTypes.func,
};

ProfileHistory.defaultProps = {
  profileName: "",
  isSystemProfile: false,
  onRestore: undefined,
};
