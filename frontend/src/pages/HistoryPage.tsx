import { motion } from "framer-motion";
import { ArrowUpDown, CheckCircle2, Download, FileText, Trash2, TrashIcon } from "lucide-react";
import { FC, useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { CheckHistoryContext } from "../App";
import AppPageLayout from "../components/layout/AppPageLayout";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { SearchField } from "../components/ui/search-field";
import type { CheckHistoryContextType, HistoryItem, LocationState } from "../types";

interface HistoryPageProps {
  className?: string;
}

const isLocal =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

const env =
  typeof globalThis !== "undefined"
    ? (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
    : undefined;

const API_BASE = isLocal
  ? "http://localhost:5000"
  : env?.REACT_APP_API_BASE || "https://cursa.onrender.com";

const rowMotion = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.22 } },
};

const pluralRecords = (n: number): string => {
  if (n % 10 === 1 && n !== 11) return "запись";
  if (n % 10 >= 2 && n % 10 <= 4 && (n < 10 || n > 20)) return "записи";
  return "записей";
};

const getDeletePlural = (count: number): string => {
  if (count === 1) return "запись";
  if (count >= 2 && count <= 4) return "записи";
  return "записей";
};

const HistoryPage: FC<HistoryPageProps> = ({ className = "" }) => {
  const navigate = useNavigate();
  const { history, removeFromHistory, clearHistory } = useContext(
    CheckHistoryContext,
  ) as CheckHistoryContextType;

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [clearDialogOpen, setClearDialogOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);

  const rowsPerPage = 20;

  const filteredHistory = useMemo(
    () =>
      history
        .filter((item: HistoryItem) => {
          const q = searchQuery.toLowerCase();
          return (
            (item.fileName || "").toLowerCase().includes(q) ||
            (item.profileId || "").toLowerCase().includes(q) ||
            (item.reportData?.check_results?.profile?.name || "").toLowerCase().includes(q) ||
            new Date(item.timestamp || (item.id as unknown as number))
              .toLocaleString("ru-RU")
              .includes(searchQuery)
          );
        })
        .sort((a: HistoryItem, b: HistoryItem) => {
          const ta = (a.timestamp || a.id || 0) as number;
          const tb = (b.timestamp || b.id || 0) as number;
          return sortDirection === "asc" ? ta - tb : tb - ta;
        }),
    [history, searchQuery, sortDirection],
  );

  const paged = filteredHistory.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / rowsPerPage));

  const downloadDocument = (filePath: string, originalName?: string): void => {
    if (!filePath) return;

    const safeName =
      originalName && originalName.endsWith(".docx")
        ? originalName
        : `${originalName || "document"}.docx`;

    if (filePath.indexOf("/") === -1 && filePath.indexOf("\\") === -1) {
      window.location.href = `${API_BASE}/corrections/${encodeURIComponent(filePath)}`;
      return;
    }

    window.location.href = `${API_BASE}/api/document/download-corrected?path=${encodeURIComponent(filePath)}&filename=${encodeURIComponent(safeName)}`;
  };

  const toggleSelect = (id: string): void => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAllOnPage = (): void => {
    const pageIds = paged.map((item) => item.id || "").filter(Boolean);
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));

    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pageIds.forEach((id) => next.delete(id));
        return next;
      });
      return;
    }

    setSelectedIds((prev) => {
      const next = new Set(prev);
      pageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const bulkDelete = (): void => {
    selectedIds.forEach((id) => removeFromHistory(id));
    setSelectedIds(new Set());
    setBulkDeleteOpen(false);
  };

  const exportCSV = (): void => {
    const headers = ["Файл", "Дата", "Профиль", "Замечания", "Балл", "Исправлен"];
    const rows = filteredHistory.map((item: HistoryItem) => {
      const score = item.score ?? item.reportData?.check_results?.score ?? item.reportData?.score;
      const issuesCount =
        item.reportData?.check_results?.total_issues_count ?? item.totalIssues ?? 0;
      const corrected =
        item.correctedFilePath || item.reportData?.corrected_file_path ? "Да" : "Нет";
      const profileLabel =
        item.reportData?.check_results?.profile?.name || item.profileId || "default_gost";
      const dateStr = new Date(item.timestamp || (item.id as unknown as number)).toLocaleString(
        "ru-RU",
      );

      return [
        item.fileName || "Без названия",
        dateStr,
        profileLabel,
        issuesCount,
        score ?? "",
        corrected,
      ];
    });

    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "history.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const openReport = (item: HistoryItem): void => {
    navigate("/report", {
      state: {
        reportData: item.reportData,
        fileName: item.fileName,
        profileId: item.profileId,
        profileName: item.reportData?.check_results?.profile?.name,
      } as LocationState,
    });
  };

  const pageIds = paged.map((item) => item.id || "").filter(Boolean);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));

  return (
    <AppPageLayout
      className={className}
      title="История проверок"
      actions={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl"
            onClick={() => setSortDirection((d) => (d === "desc" ? "asc" : "desc"))}
          >
            <ArrowUpDown className="size-4" />
            {sortDirection === "desc" ? "Сначала новые" : "Сначала старые"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl"
            disabled={filteredHistory.length === 0}
            onClick={exportCSV}
          >
            <Download className="size-4" />
            CSV
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="rounded-xl"
            disabled={history.length === 0}
            onClick={() => setClearDialogOpen(true)}
          >
            <TrashIcon className="size-4" />
            Очистить
          </Button>
        </div>
      }
    >
      <Card className="rounded-[30px] border-[#2e2f2f] bg-[#171717] text-[#fafafa] shadow-sm">
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:p-5">
          <p className="text-sm text-[#b6b6b6] md:mr-2">
            {history.length === 0
              ? "Нет записей"
              : `${history.length} ${pluralRecords(history.length)}`}
          </p>
          <SearchField
            value={searchQuery}
            onChange={(value) => {
              setSearchQuery(value);
              setPage(0);
            }}
            onSearch={() => setPage(0)}
            placeholder="Поиск по названию или дате"
            buttonLabel="Поиск"
            className="min-w-0 flex-1"
            inputClassName="h-11 rounded-2xl border-[#2e2f2f] bg-[#171717] text-[#fafafa] placeholder:text-[#7b7b7b]"
            buttonClassName="h-11 rounded-2xl px-4"
          />

          {selectedIds.size > 0 && (
            <Button
              size="sm"
              variant="destructive"
              className="rounded-xl"
              onClick={() => setBulkDeleteOpen(true)}
            >
              <Trash2 className="size-4" />
              Удалить ({selectedIds.size})
            </Button>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-[30px] border-[#2e2f2f] bg-[#171717] text-[#fafafa] shadow-sm">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="text-xl">Записи</CardTitle>
          <CardDescription>
            Список проверок с действиями и загрузкой исправленного документа.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 p-6 pt-0">
          {history.length === 0 ? (
            <div className="rounded-[26px] border border-dashed border-[#2e2f2f] bg-[#171717] px-6 py-16 text-center">
              <FileText className="mx-auto size-10 text-muted-foreground" />
              <p className="mt-4 text-base font-medium text-foreground">История пуста</p>
              <Button variant="outline" className="mt-4 rounded-xl" onClick={() => navigate("/")}>
                Загрузить первый документ
              </Button>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="rounded-[26px] border border-dashed border-[#2e2f2f] bg-[#171717] px-6 py-16 text-center text-sm text-[#b6b6b6]">
              Ничего не найдено.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-[24px_minmax(0,1fr)_160px_96px_120px] items-center gap-3 rounded-2xl border border-[#2e2f2f] bg-[#222222] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#b6b6b6]">
                <Checkbox checked={allPageSelected} onCheckedChange={toggleSelectAllOnPage} />
                <span>Файл</span>
                <span>Дата</span>
                <span>Балл</span>
                <span>Действия</span>
              </div>

              {paged.map((item) => {
                const itemId = item.id || "";
                const selected = selectedIds.has(itemId);
                const correctedPath =
                  item.correctedFilePath || item.reportData?.corrected_file_path;
                const score = item.score ?? item.reportData?.score;
                const issuesCount =
                  item.reportData?.check_results?.total_issues_count ?? item.totalIssues ?? 0;

                return (
                  <motion.div
                    key={itemId || `${item.fileName}-${item.timestamp}`}
                    initial="hidden"
                    animate="show"
                    variants={rowMotion}
                    className="grid grid-cols-[24px_minmax(0,1fr)_160px_96px_120px] items-center gap-3 rounded-2xl border border-[#2e2f2f] bg-[#171717] px-3 py-3 transition-colors hover:bg-[#222222]"
                  >
                    <Checkbox checked={selected} onCheckedChange={() => toggleSelect(itemId)} />

                    <button
                      type="button"
                      onClick={() => openReport(item)}
                      className="min-w-0 text-left"
                    >
                      <p className="truncate text-sm font-semibold text-foreground">
                        {item.fileName || "Без названия"}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#b6b6b6]">
                        <span>{item.profileId || "default_gost"}</span>
                        <span>•</span>
                        <span>{issuesCount} замечаний</span>
                        {correctedPath ? (
                          <Badge className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-600 dark:text-emerald-300">
                            <CheckCircle2 className="mr-1 size-3" />
                            DOCX
                          </Badge>
                        ) : null}
                      </div>
                    </button>

                    <p className="text-xs text-[#b6b6b6]">
                      {new Date(item.timestamp || (item.id as unknown as number)).toLocaleString(
                        "ru-RU",
                      )}
                    </p>

                    <p className="text-sm font-semibold text-foreground">
                      {score == null ? "-" : Number(score).toFixed(1)}
                    </p>

                    <div className="flex items-center gap-1">
                      {correctedPath ? (
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 rounded-lg"
                          onClick={() => downloadDocument(correctedPath, item.fileName)}
                        >
                          <Download className="size-4" />
                        </Button>
                      ) : null}
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 rounded-lg text-destructive"
                        onClick={() => {
                          setDeleteItemId(itemId);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}

              <div className="flex items-center justify-between pt-2 text-sm text-[#b6b6b6]">
                <span>
                  Страница {page + 1} из {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    Назад
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  >
                    Вперед
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Очистить всю историю?</DialogTitle>
            <DialogDescription>
              Это действие удалит все записи без возможности восстановления.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                clearHistory();
                setSelectedIds(new Set());
                setClearDialogOpen(false);
              }}
            >
              Удалить все
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить выбранные записи?</DialogTitle>
            <DialogDescription>
              Будет удалено {selectedIds.size} {getDeletePlural(selectedIds.size)}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteOpen(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={bulkDelete}>
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить запись?</DialogTitle>
            <DialogDescription>
              Запись будет удалена из истории без возможности восстановления.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteItemId) {
                  removeFromHistory(deleteItemId);
                  setSelectedIds((prev) => {
                    const next = new Set(prev);
                    next.delete(deleteItemId);
                    return next;
                  });
                }
                setDeleteDialogOpen(false);
                setDeleteItemId(null);
              }}
            >
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppPageLayout>
  );
};

export default HistoryPage;
