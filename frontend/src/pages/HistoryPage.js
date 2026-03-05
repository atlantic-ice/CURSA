import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import DeleteIcon from "@mui/icons-material/Delete";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import DownloadIcon from "@mui/icons-material/Download";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import NoteAddOutlinedIcon from "@mui/icons-material/NoteAddOutlined";
import SearchIcon from "@mui/icons-material/Search";
import SortIcon from "@mui/icons-material/Sort";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  InputBase,
  Tooltip,
  Typography,
} from "@mui/material";
import { motion } from "framer-motion";
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckHistoryContext } from "../App";
import usePageStyles from "../hooks/usePageStyles";

const isLocal =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
const API_BASE = isLocal
  ? "http://localhost:5000"
  : process.env.REACT_APP_API_BASE || "https://cursa.onrender.com";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

export default function HistoryPage() {
  const navigate = useNavigate();
  const { isDark, textPrimary, textMuted, borderColor, borderColorSubtle, rowHover, inputBg } =
    usePageStyles();
  const { history, removeFromHistory, clearHistory } = useContext(CheckHistoryContext);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortDirection, setSortDirection] = useState("desc");
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [page, setPage] = useState(0);
  const rowsPerPage = 20;

  const filteredHistory = history
    .filter(
      (item) =>
        (item.fileName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.profileId || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.reportData?.check_results?.profile?.name || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        new Date(item.timestamp || item.id).toLocaleString("ru-RU").includes(searchQuery),
    )
    .sort((a, b) => {
      const ta = a.timestamp || a.id || 0;
      const tb = b.timestamp || b.id || 0;
      return sortDirection === "asc" ? ta - tb : tb - ta;
    });

  const paged = filteredHistory.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const totalPages = Math.ceil(filteredHistory.length / rowsPerPage);

  const downloadDocument = (filePath, originalName) => {
    if (!filePath) return;
    const safeName = originalName
      ? originalName.endsWith(".docx")
        ? originalName
        : originalName + ".docx"
      : `corrected_${Date.now()}.docx`;
    if (filePath.indexOf("/") === -1 && filePath.indexOf("\\") === -1) {
      window.location.href = `${API_BASE}/corrections/${encodeURIComponent(filePath)}`;
    } else {
      window.location.href = `${API_BASE}/api/document/download-corrected?path=${encodeURIComponent(filePath)}&filename=${encodeURIComponent(safeName)}`;
    }
  };

  const pluralRecords = (n) => {
    if (n % 10 === 1 && n !== 11) return "запись";
    if (n % 10 >= 2 && n % 10 <= 4 && (n < 10 || n > 20)) return "записи";
    return "записей";
  };

  const toggleSelect = (id, e) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paged.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paged.map((i) => i.id)));
    }
  };

  const bulkDelete = () => {
    selectedIds.forEach((id) => removeFromHistory(id));
    setSelectedIds(new Set());
    setBulkDeleteOpen(false);
  };

  const exportCSV = () => {
    const headers = ["Файл", "Дата", "Профиль", "Замечания", "Балл", "Исправлен"];
    const rows = filteredHistory.map((item) => {
      const score = item.score ?? item.reportData?.check_results?.score ?? item.reportData?.score;
      const issuesCount =
        item.reportData?.check_results?.total_issues_count ?? item.totalIssues ?? 0;
      const corrected =
        item.correctedFilePath || item.reportData?.corrected_file_path ? "Да" : "Нет";
      const profileLabel =
        item.reportData?.check_results?.profile?.name || item.profileId || "default_gost";
      const dateStr = new Date(item.timestamp || item.id).toLocaleString("ru-RU");
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
    const a = document.createElement("a");
    a.href = url;
    a.download = "history.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        py: 4,
        px: { xs: 3, md: 4 },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          mb: 4,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
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
            История проверок
          </Typography>
          <Typography sx={{ color: textMuted, fontSize: "0.875rem" }}>
            {history.length === 0
              ? "Нет записей"
              : `${history.length} ${pluralRecords(history.length)}`}
          </Typography>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <Button
            onClick={() => navigate("/")}
            startIcon={<NoteAddOutlinedIcon />}
            variant="contained"
            sx={{
              borderRadius: 1,
              fontWeight: 600,
              fontSize: "0.8rem",
              textTransform: "none",
              letterSpacing: "0.03em",
              px: 2.5,
              boxShadow: "none",
            }}
          >
            Новая проверка
          </Button>
        </motion.div>
      </Box>

      {/* Toolbar */}
      <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1.5,
            py: 0.75,
            borderRadius: 1,
            bgcolor: inputBg,
            border: "1px solid",
            borderColor,
            flex: "1 1 240px",
            maxWidth: 360,
          }}
        >
          <SearchIcon sx={{ fontSize: 16, color: textMuted }} />
          <InputBase
            placeholder="Поиск по названию или дате"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            sx={{
              flex: 1,
              fontSize: "0.875rem",
              color: textPrimary,
              "& input::placeholder": { color: textMuted },
            }}
          />
          {searchQuery && (
            <IconButton size="small" onClick={() => setSearchQuery("")} sx={{ p: 0.25 }}>
              <HighlightOffIcon sx={{ fontSize: 15, color: textMuted }} />
            </IconButton>
          )}
        </Box>
        <Button
          size="small"
          startIcon={<SortIcon sx={{ fontSize: 15 }} />}
          onClick={() => setSortDirection((d) => (d === "desc" ? "asc" : "desc"))}
          sx={{
            borderRadius: 1,
            color: textMuted,
            border: "1px solid",
            borderColor,
            fontSize: "0.8rem",
            textTransform: "none",
            px: 1.5,
            py: 0.875,
            "&:hover": { color: textPrimary },
          }}
        >
          {sortDirection === "desc" ? "Сначала новые" : "Сначала старые"}
        </Button>
        <Box sx={{ flex: 1 }} />
        {selectedIds.size > 0 && (
          <Tooltip title={`Удалить выбранные (${selectedIds.size})`}>
            <Button
              size="small"
              startIcon={<DeleteIcon sx={{ fontSize: 15 }} />}
              onClick={() => setBulkDeleteOpen(true)}
              sx={{
                borderRadius: 1,
                color: "#e34234",
                border: "1px solid rgba(227,66,52,0.25)",
                fontSize: "0.8rem",
                textTransform: "none",
                px: 1.5,
                "&:hover": { bgcolor: "rgba(227,66,52,0.06)" },
              }}
            >
              Удалить ({selectedIds.size})
            </Button>
          </Tooltip>
        )}
        <Tooltip title="Экспортировать в CSV">
          <span>
            <Button
              size="small"
              startIcon={<DownloadIcon sx={{ fontSize: 15 }} />}
              onClick={exportCSV}
              disabled={filteredHistory.length === 0}
              sx={{
                borderRadius: 1,
                color: textMuted,
                border: "1px solid",
                borderColor,
                fontSize: "0.8rem",
                textTransform: "none",
                px: 1.5,
                "&:hover": { color: textPrimary },
              }}
            >
              CSV
            </Button>
          </span>
        </Tooltip>
        <Tooltip title="Очистить всю историю">
          <span>
            <Button
              size="small"
              startIcon={<DeleteSweepIcon sx={{ fontSize: 15 }} />}
              onClick={() => setClearDialogOpen(true)}
              disabled={history.length === 0}
              sx={{
                borderRadius: 1,
                color: "#e34234",
                border: "1px solid rgba(227,66,52,0.25)",
                fontSize: "0.8rem",
                textTransform: "none",
                px: 1.5,
                "&:hover": { bgcolor: "rgba(227,66,52,0.06)" },
              }}
            >
              Очистить
            </Button>
          </span>
        </Tooltip>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflowY: "auto", pr: 0.5 }} className="custom-scrollbar">
        {history.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: 300,
              gap: 2,
            }}
          >
            <InsertDriveFileOutlinedIcon sx={{ fontSize: 48, color: textMuted, opacity: 0.4 }} />
            <Typography sx={{ color: textMuted, fontSize: "0.9rem" }}>История пуста</Typography>
            <Button
              onClick={() => navigate("/")}
              variant="outlined"
              size="small"
              sx={{ borderRadius: 1, textTransform: "none", borderColor, color: textMuted }}
            >
              Загрузить первый документ
            </Button>
          </Box>
        ) : filteredHistory.length === 0 ? (
          <Box
            sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}
          >
            <Typography sx={{ color: textMuted, fontSize: "0.875rem" }}>
              Ничего не найдено
            </Typography>
          </Box>
        ) : (
          <>
            {/* Table header */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "36px minmax(0,1fr) 140px 120px 85px 60px 100px 130px",
                gap: 1,
                px: 2,
                py: 1,
                borderBottom: "1px solid",
                borderColor,
              }}
            >
              <Checkbox
                size="small"
                checked={paged.length > 0 && selectedIds.size === paged.length}
                indeterminate={selectedIds.size > 0 && selectedIds.size < paged.length}
                onChange={toggleSelectAll}
                sx={{
                  p: 0,
                  color: textMuted,
                  "&.Mui-checked": { color: "primary.main" },
                  "&.MuiCheckbox-indeterminate": { color: "primary.main" },
                }}
              />
              {["Файл", "Дата", "Профиль", "Проблем", "Балл", "Исправлен", ""].map((h) => (
                <Typography
                  key={h}
                  sx={{
                    fontSize: "0.7rem",
                    letterSpacing: "0.08em",
                    color: textMuted,
                    textTransform: "uppercase",
                    fontWeight: 600,
                  }}
                >
                  {h}
                </Typography>
              ))}
            </Box>

            <motion.div variants={containerVariants} initial="hidden" animate="show">
              {paged.map((item) => {
                const issuesCount =
                  item.reportData?.check_results?.total_issues_count ?? item.totalIssues ?? 0;
                const correctedPath =
                  item.correctedFilePath || item.reportData?.corrected_file_path;
                const score = item.score ?? item.reportData?.score;
                const scoreColor =
                  score == null
                    ? textMuted
                    : score >= 4
                      ? "#34d399"
                      : score >= 3
                        ? "#fbbf24"
                        : "#f87171";
                const dateStr = new Date(item.timestamp || item.id).toLocaleString("ru-RU", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <motion.div key={item.id} variants={rowVariants}>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "36px minmax(0,1fr) 140px 120px 85px 60px 100px 130px",
                        gap: 1,
                        px: 2,
                        py: 1.5,
                        borderBottom: "1px solid",
                        borderColor: borderColorSubtle,
                        cursor: "pointer",
                        transition: "background 0.15s",
                        "&:hover": { bgcolor: rowHover },
                        alignItems: "center",
                        bgcolor: selectedIds.has(item.id)
                          ? isDark
                            ? "rgba(99,102,241,0.06)"
                            : "rgba(99,102,241,0.04)"
                          : undefined,
                      }}
                      onClick={() =>
                        navigate("/report", {
                          state: {
                            reportData: item.reportData,
                            fileName: item.fileName,
                            profileId: item.profileId,
                            profileName: item.reportData?.check_results?.profile?.name,
                          },
                        })
                      }
                    >
                      <Checkbox
                        size="small"
                        checked={selectedIds.has(item.id)}
                        onChange={(e) => toggleSelect(item.id, e)}
                        onClick={(e) => e.stopPropagation()}
                        sx={{ p: 0, color: textMuted, "&.Mui-checked": { color: "primary.main" } }}
                      />
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
                        <InsertDriveFileOutlinedIcon
                          sx={{ fontSize: 16, color: textMuted, flexShrink: 0 }}
                        />
                        <Typography
                          sx={{
                            fontSize: "0.875rem",
                            fontWeight: 500,
                            color: textPrimary,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.fileName || "Без названия"}
                        </Typography>
                      </Box>

                      <Typography sx={{ fontSize: "0.775rem", color: textMuted }}>
                        {dateStr}
                      </Typography>

                      <Typography
                        sx={{
                          fontSize: "0.74rem",
                          color: textMuted,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.reportData?.check_results?.profile?.name || item.profileId || "—"}
                      </Typography>

                      <Box
                        sx={{
                          display: "inline-flex",
                          px: 1.25,
                          py: 0.25,
                          borderRadius: 0.5,
                          border: "1px solid",
                          borderColor:
                            issuesCount > 0 ? "rgba(251,191,36,0.25)" : "rgba(52,211,153,0.25)",
                          bgcolor:
                            issuesCount > 0 ? "rgba(251,191,36,0.07)" : "rgba(52,211,153,0.07)",
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: issuesCount > 0 ? "#fbbf24" : "#34d399",
                          }}
                        >
                          {issuesCount}
                        </Typography>
                      </Box>

                      {/* Score */}
                      <Typography
                        sx={{
                          fontSize: "0.78rem",
                          fontWeight: score != null ? 600 : 400,
                          color: scoreColor,
                        }}
                      >
                        {score != null
                          ? typeof score === "number"
                            ? score.toFixed(1)
                            : score
                          : "—"}
                      </Typography>

                      <Box>
                        {correctedPath ? (
                          <Box
                            sx={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 0.5,
                              px: 1.25,
                              py: 0.25,
                              borderRadius: 0.5,
                              border: "1px solid rgba(52,211,153,0.25)",
                              bgcolor: "rgba(52,211,153,0.07)",
                            }}
                          >
                            <CheckCircleOutlineIcon sx={{ fontSize: 12, color: "#34d399" }} />
                            <Typography
                              sx={{ fontSize: "0.75rem", fontWeight: 600, color: "#34d399" }}
                            >
                              Да
                            </Typography>
                          </Box>
                        ) : (
                          <Typography sx={{ fontSize: "0.75rem", color: textMuted }}>—</Typography>
                        )}
                      </Box>

                      <Box
                        sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          size="small"
                          onClick={() =>
                            navigate("/report", {
                              state: { reportData: item.reportData, fileName: item.fileName },
                            })
                          }
                          sx={{
                            borderRadius: 0.5,
                            fontSize: "0.75rem",
                            textTransform: "none",
                            color: textMuted,
                            py: 0.25,
                            px: 1,
                            "&:hover": { color: textPrimary },
                          }}
                        >
                          Открыть
                        </Button>
                        {correctedPath && (
                          <Tooltip title="Скачать исправленный документ">
                            <IconButton
                              size="small"
                              onClick={() => downloadDocument(correctedPath, item.fileName)}
                              sx={{ color: "#34d399", p: 0.5 }}
                            >
                              <DownloadIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Удалить из истории">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setDeleteItemId(item.id);
                              setDeleteDialogOpen(true);
                            }}
                            sx={{ color: textMuted, p: 0.5, "&:hover": { color: "#e34234" } }}
                          >
                            <DeleteIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </motion.div>
                );
              })}
            </motion.div>

            {totalPages > 1 && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 1,
                  mt: 3,
                  pb: 2,
                }}
              >
                <Button
                  size="small"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                  sx={{
                    borderRadius: 1,
                    textTransform: "none",
                    border: "1px solid",
                    borderColor,
                    color: textMuted,
                    minWidth: 36,
                  }}
                >
                  ←
                </Button>
                <Typography sx={{ px: 2, fontSize: "0.8rem", color: textMuted }}>
                  {page + 1} / {totalPages}
                </Typography>
                <Button
                  size="small"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  sx={{
                    borderRadius: 1,
                    textTransform: "none",
                    border: "1px solid",
                    borderColor,
                    color: textMuted,
                    minWidth: 36,
                  }}
                >
                  →
                </Button>
              </Box>
            )}
          </>
        )}
      </Box>

      <Dialog open={clearDialogOpen} onClose={() => setClearDialogOpen(false)}>
        <DialogTitle>Очистить историю?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Все записи будут удалены. Это действие нельзя отменить.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearDialogOpen(false)}>Отмена</Button>
          <Button
            onClick={() => {
              clearHistory();
              setClearDialogOpen(false);
            }}
            color="error"
            variant="contained"
          >
            Очистить
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Удалить запись?</DialogTitle>
        <DialogContent>
          <DialogContentText>Запись будет удалена из истории проверок.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Отмена</Button>
          <Button
            onClick={() => {
              if (deleteItemId) removeFromHistory(deleteItemId);
              setDeleteItemId(null);
              setDeleteDialogOpen(false);
            }}
            color="error"
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={bulkDeleteOpen} onClose={() => setBulkDeleteOpen(false)}>
        <DialogTitle>Удалить выбранные записи?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Будет удалено {selectedIds.size}{" "}
            {selectedIds.size === 1
              ? "запись"
              : selectedIds.size >= 2 && selectedIds.size <= 4
                ? "записи"
                : "записей"}
            . Это действие нельзя отменить.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDeleteOpen(false)}>Отмена</Button>
          <Button onClick={bulkDelete} color="error" variant="contained">
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
