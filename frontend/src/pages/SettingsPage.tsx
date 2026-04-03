import { motion } from "framer-motion";
import { Download, Info, Keyboard, MoonStar, SunMedium, Trash2 } from "lucide-react";
import { FC, ReactNode, useContext, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

import { AuthContext, CheckHistoryContext, ColorModeContext, UIActionsContext } from "../App";
import AppPageLayout from "../components/layout/AppPageLayout";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Separator } from "../components/ui/separator";
import { cn } from "../lib/utils";
import type { HistoryItem, User } from "../types";

interface SettingsPageProps {
  className?: string;
}

interface SettingsHistoryContextType {
  history: HistoryItem[];
  clearHistory: () => void;
}

interface AuthContextType {
  user: User | null;
}

interface Shortcut {
  keys: string[];
  description: string;
}

interface SettingRowProps {
  label: string;
  description: string;
  action: ReactNode;
  danger?: boolean;
}

const SHORTCUTS: Shortcut[] = [
  { keys: ["N"], description: "Загрузить новый документ" },
  { keys: ["G", "D"], description: "Перейти в панель" },
  { keys: ["G", "H"], description: "Открыть историю" },
  { keys: ["G", "R"], description: "Перейти к отчётам" },
  { keys: ["G", "A"], description: "Открыть аккаунт" },
  { keys: ["G", "S"], description: "Открыть настройки" },
  { keys: ["Ctrl", "K"], description: "Командная палитра" },
  { keys: ["?"], description: "Справка по горячим клавишам" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

const getTimestampValue = (item: HistoryItem): number => {
  const raw = item.timestamp ?? item.id ?? 0;
  if (typeof raw === "number") {
    return raw;
  }

  const parsed = Date.parse(String(raw));
  if (!Number.isNaN(parsed)) {
    return parsed;
  }

  const numeric = Number(raw);
  return Number.isNaN(numeric) ? 0 : numeric;
};

const getIssuesCount = (item: HistoryItem): number => {
  return (
    item.totalIssues ??
    item.issues_count ??
    item.reportData?.check_results?.total_issues_count ??
    item.validation_result?.summary?.total_issues ??
    0
  );
};

const SettingRow: FC<SettingRowProps> = ({ label, description, action, danger = false }) => {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl border px-4 py-4 md:flex-row md:items-center md:justify-between",
        danger ? "border-red-500/20 bg-red-500/5" : "border-border/70 bg-background/60",
      )}
    >
      <div className="space-y-1">
        <p className={cn("text-sm font-semibold", danger ? "text-red-500" : "text-foreground")}>
          {label}
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
};

const SettingsPage: FC<SettingsPageProps> = ({ className = "" }) => {
  const colorMode = useContext(ColorModeContext);
  const { openShortcuts } = useContext(UIActionsContext);
  const { history, clearHistory } = useContext(CheckHistoryContext) as SettingsHistoryContextType;
  const { user } = useContext(AuthContext) as AuthContextType;

  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => localStorage.getItem("colorMode") === "dark");

  const toastStyle = useMemo(
    () => ({
      background: "oklch(var(--card))",
      color: "oklch(var(--card-foreground))",
      border: "1px solid oklch(var(--border))",
      borderRadius: "16px",
      boxShadow: "0 20px 60px color-mix(in srgb, black 22%, transparent)",
    }),
    [],
  );

  const exportHistory = (): void => {
    if (history.length === 0) {
      return;
    }

    const rows = [
      ["Файл", "Дата", "Проблем", "Балл", "Исправлен"],
      ...history.map((item) => {
        const issues = getIssuesCount(item);
        const score = item.score ?? item.reportData?.score ?? "";
        const corrected =
          item.correctedFilePath || item.corrected_file_path || item.reportData?.corrected_file_path
            ? "Да"
            : "Нет";
        const date = new Date(getTimestampValue(item)).toLocaleString("ru-RU");

        return [
          `"${(item.fileName || item.document_name || "").replace(/"/g, '""')}"`,
          `"${date}"`,
          String(issues),
          String(score),
          corrected,
        ];
      }),
    ];

    const csv = "\ufeff" + rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `cursa_history_${new Date().toISOString().split("T")[0]}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("История экспортирована", { style: toastStyle });
  };

  const handleToggleTheme = (): void => {
    colorMode.toggleColorMode();
    setIsDark((previous) => !previous);
  };

  const handleClearHistory = (): void => {
    clearHistory();
    setClearDialogOpen(false);
    toast.success("История очищена", { style: toastStyle });
  };

  return (
    <AppPageLayout className={className} title="Настройки" maxWidth="narrow">
      <Toaster position="bottom-center" />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_420px]">
        <motion.section
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ delay: 0.06 }}
        >
          <Card className="rounded-[30px] border-border/70 bg-card/92 shadow-surface">
            <CardHeader className="p-6 pb-4">
              <CardTitle className="text-xl">Системные параметры</CardTitle>
              <CardDescription>
                Персонализация интерфейса и операции с локальной историей.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 p-6 pt-0">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-2xl border border-border/70 bg-background/70 text-muted-foreground">
                    {isDark ? <MoonStar className="size-4" /> : <SunMedium className="size-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Оформление</p>
                    <p className="text-sm text-muted-foreground">
                      Сейчас активна {isDark ? "тёмная" : "светлая"} тема.
                    </p>
                  </div>
                </div>

                <SettingRow
                  label="Тема интерфейса"
                  description={
                    isDark
                      ? "Тёмный режим включён и синхронизирован с новым shell."
                      : "Светлый режим активен для текущего сеанса."
                  }
                  action={
                    <Button variant="outline" className="rounded-xl" onClick={handleToggleTheme}>
                      {isDark ? <SunMedium className="size-4" /> : <MoonStar className="size-4" />}
                      {isDark ? "Светлая тема" : "Тёмная тема"}
                    </Button>
                  }
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">Данные</p>
                  <p className="text-sm text-muted-foreground">
                    Экспорт истории, очистка локальных записей и контроль объёма сохранённых
                    результатов.
                  </p>
                </div>

                <SettingRow
                  label="Экспорт истории"
                  description={
                    history.length > 0
                      ? `${history.length} записей будут выгружены в CSV.`
                      : "История проверок пока пуста."
                  }
                  action={
                    <Button
                      variant="outline"
                      className="rounded-xl"
                      disabled={history.length === 0}
                      onClick={exportHistory}
                    >
                      <Download className="size-4" />
                      Скачать CSV
                    </Button>
                  }
                />

                <SettingRow
                  label="Очистить локальную историю"
                  description={
                    history.length > 0
                      ? `Будут удалены ${history.length} сохранённых записей.`
                      : "Локальная история уже пуста."
                  }
                  danger
                  action={
                    <Button
                      variant="outline"
                      className="rounded-xl border-red-500/25 text-red-500 hover:bg-red-500/10 hover:text-red-500"
                      disabled={history.length === 0}
                      onClick={() => setClearDialogOpen(true)}
                    >
                      <Trash2 className="size-4" />
                      Очистить
                    </Button>
                  }
                />
              </div>
            </CardContent>
          </Card>
        </motion.section>

        <motion.section
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ delay: 0.12 }}
          className="space-y-6"
        >
          <Card className="rounded-[30px] border-border/70 bg-card/92 shadow-surface">
            <CardHeader className="p-6 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-xl">Горячие клавиши</CardTitle>
                  <CardDescription>
                    Основные последовательности для быстрого перемещения по приложению.
                  </CardDescription>
                </div>
                <Button variant="ghost" className="rounded-xl px-3 text-sm" onClick={openShortcuts}>
                  <Keyboard className="size-4" />
                  Открыть
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 p-6 pt-0">
              {SHORTCUTS.map((shortcut) => (
                <div
                  key={`${shortcut.description}-${shortcut.keys.join("-")}`}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-background/60 px-4 py-3"
                >
                  <p className="text-sm text-foreground">{shortcut.description}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {shortcut.keys.map((key) => (
                      <Badge
                        key={key}
                        variant="outline"
                        className="rounded-lg px-2 py-1 font-mono text-[11px] uppercase tracking-[0.18em]"
                      >
                        {key}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-[30px] border-border/70 bg-card/92 shadow-surface">
            <CardHeader className="p-6 pb-4">
              <CardTitle className="text-xl">О приложении</CardTitle>
              <CardDescription>
                Короткая справка по текущей сборке и рабочему состоянию.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-6 pt-0">
              <div className="flex items-center gap-4 rounded-2xl border border-border/70 bg-background/60 p-4">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <Info className="size-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">CURSA 2.0</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Система проверки курсовых и дипломных работ с единым shadcn-shell и локальной
                    историей документов.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Проверок сохранено
                  </p>
                  <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-foreground">
                    {history.length}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Пользователь
                  </p>
                  <p className="mt-2 text-lg font-semibold text-foreground">
                    {user?.name || user?.email || "Гость"}
                  </p>
                </div>
              </div>

              {history.length > 0 && (
                <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Последний отчёт
                  </p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {history[0]?.fileName || history[0]?.document_name || "Без названия"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {new Date(getTimestampValue(history[0])).toLocaleString("ru-RU")} •{" "}
                    {getIssuesCount(history[0])} замечаний
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.section>
      </div>

      <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <DialogContent className="max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle>Очистить локальную историю?</DialogTitle>
            <DialogDescription>
              Будут удалены {history.length} записей из локального хранилища. Это действие нельзя
              отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              className="bg-red-600 text-white hover:bg-red-600/90"
              onClick={handleClearHistory}
            >
              Очистить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppPageLayout>
  );
};

export default SettingsPage;
