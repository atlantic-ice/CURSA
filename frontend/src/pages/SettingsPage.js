import BrightnessMediumOutlinedIcon from "@mui/icons-material/BrightnessMediumOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import KeyboardOutlinedIcon from "@mui/icons-material/KeyboardOutlined";
import NightlightRoundOutlinedIcon from "@mui/icons-material/NightlightRoundOutlined";
import StorageOutlinedIcon from "@mui/icons-material/StorageOutlined";
import WbSunnyOutlinedIcon from "@mui/icons-material/WbSunnyOutlined";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Snackbar,
  Switch,
  Typography,
} from "@mui/material";
import { motion } from "framer-motion";
import { useContext, useState } from "react";
import { AuthContext, CheckHistoryContext, ColorModeContext, UIActionsContext } from "../App";
import usePageStyles from "../hooks/usePageStyles";

const sectionVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

const SHORTCUTS = [
  { keys: ["N"], description: "Загрузить новый документ" },
  { keys: ["G", "D"], description: "Перейти в Панель (Dashboard)" },
  { keys: ["G", "H"], description: "Перейти в Историю" },
  { keys: ["G", "R"], description: "Перейти в Отчёты" },
  { keys: ["G", "A"], description: "Открыть Аккаунт" },
  { keys: ["G", "S"], description: "Открыть Настройки" },
  { keys: ["?"], description: "Показать справку по сочетаниям" },
  { keys: ["Esc"], description: "Закрыть диалог / сбросить поиск" },
];

const ShortcutKey = ({ label, isDark, borderColor }) => (
  <Box
    sx={{
      px: 1,
      py: 0.2,
      borderRadius: "5px",
      bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
      border: "1px solid",
      borderColor,
      fontFamily: "monospace",
      fontSize: "0.72rem",
      fontWeight: 700,
      color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)",
      lineHeight: 1.6,
      userSelect: "none",
    }}
  >
    {label}
  </Box>
);

export default function SettingsPage() {
  const { isDark, textPrimary, textMuted, borderColor, surface, contentPaddingX } = usePageStyles();
  const colorMode = useContext(ColorModeContext);
  const { openShortcuts } = useContext(UIActionsContext);
  const { history, clearHistory } = useContext(CheckHistoryContext);
  const { user } = useContext(AuthContext);

  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: "" });
  const showSnack = (msg) => setSnack({ open: true, message: msg });

  const exportHistory = () => {
    if (history.length === 0) return;
    const rows = [
      ["Файл", "Дата", "Проблем", "Балл", "Исправлен"],
      ...history.map((h) => {
        const issues = h.reportData?.check_results?.total_issues_count ?? h.totalIssues ?? 0;
        const score = h.score ?? h.reportData?.score ?? "";
        const corrected = h.correctedFilePath || h.reportData?.corrected_file_path ? "Да" : "Нет";
        const date = new Date(h.timestamp || h.id).toLocaleString("ru-RU");
        return [
          `"${(h.fileName || "").replace(/"/g, '""')}"`,
          `"${date}"`,
          issues,
          score,
          corrected,
        ];
      }),
    ];
    const csv = "\ufeff" + rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cursa_history_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showSnack("История экспортирована в CSV");
  };

  const handleClearHistory = () => {
    clearHistory();
    setClearDialogOpen(false);
    showSnack("История очищена");
  };

  const SettingRow = ({ label, description, action }) => (
    <Box
      sx={{
        px: 2,
        py: 1.75,
        borderRadius: "10px",
        bgcolor: surface,
        border: "1px solid",
        borderColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: "0.85rem", color: textPrimary, fontWeight: 500 }}>
          {label}
        </Typography>
        {description && (
          <Typography sx={{ fontSize: "0.72rem", color: textMuted, mt: 0.2 }}>
            {description}
          </Typography>
        )}
      </Box>
      {action}
    </Box>
  );

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Box sx={{ flex: 1, overflowY: "auto" }} className="custom-scrollbar">
        <Box sx={{ maxWidth: 560, mx: "auto", px: contentPaddingX, py: 4 }}>
          {/* Page header */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                letterSpacing: "-0.025em",
                fontFamily: "'Wix Madefor Display', sans-serif",
                color: textPrimary,
                mb: 0.5,
              }}
            >
              Настройки
            </Typography>
            <Typography sx={{ color: textMuted, fontSize: "0.875rem", mb: 4 }}>
              Оформление, данные и клавиатурные сокращения
            </Typography>
          </motion.div>

          {/* ── Appearance ── */}
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.35, delay: 0 }}
          >
            <Box sx={{ py: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                <BrightnessMediumOutlinedIcon sx={{ fontSize: 15, color: textMuted }} />
                <Typography sx={{ fontWeight: 600, fontSize: "0.85rem", color: textPrimary }}>
                  Оформление
                </Typography>
              </Box>
              <SettingRow
                label="Тёмная тема"
                description={isDark ? "Включена — тёмный фон" : "Отключена — светлый фон"}
                action={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <WbSunnyOutlinedIcon sx={{ fontSize: 14, color: textMuted }} />
                    <Switch
                      checked={isDark}
                      onChange={colorMode.toggleColorMode}
                      size="small"
                      sx={{ mx: 0.5 }}
                    />
                    <NightlightRoundOutlinedIcon sx={{ fontSize: 14, color: textMuted }} />
                  </Box>
                }
              />
            </Box>
          </motion.div>

          <Divider sx={{ borderColor }} />

          {/* ── Data ── */}
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.35, delay: 0.05 }}
          >
            <Box sx={{ py: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                <StorageOutlinedIcon sx={{ fontSize: 15, color: textMuted }} />
                <Typography sx={{ fontWeight: 600, fontSize: "0.85rem", color: textPrimary }}>
                  Данные
                </Typography>
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <SettingRow
                  label="Экспортировать историю"
                  description={
                    history.length > 0
                      ? `${history.length} записей · формат CSV`
                      : "История проверок пуста"
                  }
                  action={
                    <Button
                      size="small"
                      disabled={history.length === 0}
                      startIcon={<FileDownloadOutlinedIcon sx={{ fontSize: 13 }} />}
                      onClick={exportHistory}
                      sx={{
                        textTransform: "none",
                        fontSize: "0.775rem",
                        color: textMuted,
                        border: "1px solid",
                        borderColor,
                        borderRadius: "8px",
                        flexShrink: 0,
                        "&:hover": { color: textPrimary },
                      }}
                    >
                      CSV
                    </Button>
                  }
                />
                <Box
                  sx={{
                    px: 2,
                    py: 1.75,
                    borderRadius: "10px",
                    bgcolor: surface,
                    border: "1px solid",
                    borderColor: "rgba(239,68,68,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: "0.85rem", color: "#ef4444", fontWeight: 500 }}>
                      Очистить историю
                    </Typography>
                    <Typography sx={{ fontSize: "0.72rem", color: textMuted, mt: 0.2 }}>
                      {history.length > 0
                        ? `Удалить ${history.length} записей безвозвратно`
                        : "История уже пуста"}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    disabled={history.length === 0}
                    startIcon={<DeleteOutlinedIcon sx={{ fontSize: 13 }} />}
                    onClick={() => setClearDialogOpen(true)}
                    sx={{
                      textTransform: "none",
                      fontSize: "0.775rem",
                      color: "#ef4444",
                      border: "1px solid",
                      borderColor: "rgba(239,68,68,0.25)",
                      borderRadius: "8px",
                      flexShrink: 0,
                      "&:hover": { bgcolor: "rgba(239,68,68,0.06)" },
                    }}
                  >
                    Очистить
                  </Button>
                </Box>
              </Box>
            </Box>
          </motion.div>

          <Divider sx={{ borderColor }} />

          {/* ── Keyboard Shortcuts ── */}
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.35, delay: 0.1 }}
          >
            <Box sx={{ py: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                <KeyboardOutlinedIcon sx={{ fontSize: 15, color: textMuted }} />
                <Typography sx={{ fontWeight: 600, fontSize: "0.85rem", color: textPrimary }}>
                  Клавиатурные сокращения
                </Typography>
                <Box sx={{ flex: 1 }} />
                <Button
                  size="small"
                  onClick={openShortcuts}
                  sx={{
                    color: textMuted,
                    textTransform: "none",
                    fontSize: "0.75rem",
                    minWidth: 0,
                    px: 1,
                    "&:hover": { color: textPrimary },
                  }}
                >
                  Открыть справку (?)
                </Button>
              </Box>
              <Box
                sx={{
                  borderRadius: "10px",
                  border: "1px solid",
                  borderColor,
                  overflow: "hidden",
                }}
              >
                {SHORTCUTS.map((s, i) => (
                  <Box
                    key={i}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      px: 2,
                      py: 1.25,
                      borderBottom: i < SHORTCUTS.length - 1 ? "1px solid" : "none",
                      borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                    }}
                  >
                    <Typography sx={{ fontSize: "0.82rem", color: textPrimary }}>
                      {s.description}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
                      {s.keys.map((k, ki) => (
                        <Box key={ki} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <ShortcutKey label={k} isDark={isDark} borderColor={borderColor} />
                          {ki < s.keys.length - 1 && (
                            <Typography sx={{ fontSize: "0.65rem", color: textMuted }}>
                              →
                            </Typography>
                          )}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </motion.div>

          <Divider sx={{ borderColor }} />

          {/* ── About ── */}
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.35, delay: 0.15 }}
          >
            <Box sx={{ py: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                <InfoOutlinedIcon sx={{ fontSize: 15, color: textMuted }} />
                <Typography sx={{ fontWeight: 600, fontSize: "0.85rem", color: textPrimary }}>
                  О приложении
                </Typography>
              </Box>
              <Box
                sx={{
                  px: 2,
                  py: 2.25,
                  borderRadius: "10px",
                  bgcolor: surface,
                  border: "1px solid",
                  borderColor,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1.5 }}>
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: "10px",
                      bgcolor: "primary.main",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "background.default",
                      fontWeight: 800,
                      fontSize: "0.9rem",
                      fontFamily: "'Wix Madefor Display', sans-serif",
                      flexShrink: 0,
                    }}
                  >
                    C
                  </Box>
                  <Box>
                    <Typography
                      sx={{ fontSize: "0.9rem", fontWeight: 700, color: textPrimary, mb: 0.15 }}
                    >
                      CURSA
                    </Typography>
                    <Typography sx={{ fontSize: "0.72rem", color: textMuted }}>
                      Версия 2.0 · Нормоконтроль документов
                    </Typography>
                  </Box>
                </Box>
                <Typography sx={{ fontSize: "0.78rem", color: textMuted, lineHeight: 1.65 }}>
                  Автоматическая проверка курсовых и дипломных работ на соответствие требованиям
                  университетских профилей. Поддерживает форматирование, нумерацию, шрифты, отступы
                  и структуру документов.
                </Typography>
              </Box>
              {user && (
                <Box
                  sx={{
                    mt: 1,
                    px: 2,
                    py: 1.5,
                    borderRadius: "10px",
                    bgcolor: surface,
                    border: "1px solid",
                    borderColor,
                  }}
                >
                  <Typography sx={{ fontSize: "0.75rem", color: textMuted }}>
                    Выполнено проверок за всё время:{" "}
                    <Box component="span" sx={{ color: textPrimary, fontWeight: 600 }}>
                      {history.length}
                    </Box>
                  </Typography>
                </Box>
              )}
            </Box>
          </motion.div>
        </Box>
      </Box>

      {/* Confirm clear dialog */}
      <Dialog
        open={clearDialogOpen}
        onClose={() => setClearDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: isDark ? "#1a1a1a" : "#fff",
            borderRadius: "14px",
            border: "1px solid",
            borderColor,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1rem", color: textPrimary, pb: 1 }}>
          Очистить всю историю?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: textMuted, fontSize: "0.875rem" }}>
            Это удалит{" "}
            <Box component="span" sx={{ color: textPrimary }}>
              {history.length} записей
            </Box>{" "}
            из истории проверок локально. Действие нельзя отменить.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => setClearDialogOpen(false)}
            sx={{ textTransform: "none", color: textMuted, borderRadius: 1 }}
          >
            Отмена
          </Button>
          <Button
            onClick={handleClearHistory}
            sx={{
              textTransform: "none",
              color: "#ef4444",
              fontWeight: 600,
              borderRadius: 1,
              "&:hover": { bgcolor: "rgba(239,68,68,0.08)" },
            }}
          >
            Очистить
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={2500}
        onClose={() => setSnack((p) => ({ ...p, open: false }))}
        message={snack.message}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
}
