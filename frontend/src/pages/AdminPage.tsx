import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ArticleIcon from "@mui/icons-material/Article";
import AssessmentIcon from "@mui/icons-material/Assessment";
import BarChartIcon from "@mui/icons-material/BarChart";
import ComputerIcon from "@mui/icons-material/Computer";
import DateRangeIcon from "@mui/icons-material/DateRange";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import ErrorIcon from "@mui/icons-material/Error";
import InfoIcon from "@mui/icons-material/Info";
import LayersClearIcon from "@mui/icons-material/LayersClear";
import MemoryIcon from "@mui/icons-material/Memory";
import PieChartIcon from "@mui/icons-material/PieChart";
import RefreshIcon from "@mui/icons-material/Refresh";
import RestoreIcon from "@mui/icons-material/Restore";
import SaveIcon from "@mui/icons-material/Save";
import SdStorageIcon from "@mui/icons-material/SdStorage";
import StorageIcon from "@mui/icons-material/Storage";
import TableChartIcon from "@mui/icons-material/TableChart";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import WarningIcon from "@mui/icons-material/Warning";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Skeleton,
  Snackbar,
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import axios, { AxiosError } from "axios";
import { FC, ReactNode, useEffect, useState } from "react";

import NotificationsPanel from "../components/NotificationsPanel";

const isLocal =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
const API_BASE = isLocal
  ? "http://localhost:5000"
  : process.env.REACT_APP_API_BASE || "https://cursa.onrender.com";

/**
 * TabPanelProps interface
 */
interface TabPanelProps {
  children?: ReactNode;
  index: number;
  value: number;
  [key: string]: unknown;
}

/**
 * TabPanel Component - Wrapper for tab content
 *
 * @param children - Content to display
 * @param value - Current tab value
 * @param index - Tab index
 * @param other - Other props
 * @returns Tab content panel
 */
const TabPanel: FC<TabPanelProps> = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`simple-tabpanel-${index}`}
    aria-labelledby={`simple-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

/**
 * File interface
 */
interface File {
  name: string;
  size_formatted: string;
  date: string;
}

/**
 * LogBackup interface
 */
interface LogBackup {
  name: string;
  size_formatted: string;
  date: string;
}

/**
 * DiskUsage interface
 */
interface DiskUsage {
  used: number;
  total: number;
  percent: number;
  free: number;
}

/**
 * DiskUsageMap interface
 */
interface DiskUsageMap {
  [key: string]: DiskUsage;
}

/**
 * SystemInfo interface
 */
interface SystemInfo {
  system: {
    platform: string;
    processor: string;
    cpu_physical: number;
    cpu_count: number;
    memory_used: number;
    memory_total: number;
    memory_percent: number;
    server_uptime: {
      formatted: string;
    };
    disk_usage: DiskUsageMap;
  };
  app: {
    corrections_count: number;
    corrections_size: number;
    log_size: number;
    log_backups_count: number;
    log_backups_size: number;
  };
  timestamp: string;
  success: boolean;
}

/**
 * Statistics interface
 */
interface Statistics {
  period: {
    start_date: string;
    end_date: string;
  };
  files: {
    total_count: number;
    total_size: number;
    avg_size: number;
    file_types: Record<string, { count: number; size: number }>;
  };
  logs: {
    total_entries: number;
    error_count: number;
    warning_count: number;
    info_count: number;
  };
  weekday_stats: {
    files_by_weekday: Record<string, number>;
    logs_by_weekday: Record<string, number>;
  };
}

/**
 * AlertsConfig interface
 */
interface AlertsConfig {
  disk_space: {
    enabled: boolean;
    threshold: number;
  };
  error_rate: {
    enabled: boolean;
    threshold: number;
  };
  system_load: {
    enabled: boolean;
    threshold: number;
  };
  memory_usage: {
    enabled: boolean;
    threshold: number;
  };
  notifications: {
    email: {
      enabled: boolean;
    };
    web: {
      enabled: boolean;
    };
  };
  [key: string]: unknown;
}

/**
 * LoadingState interface
 */
interface LoadingState {
  files: boolean;
  logs: boolean;
  logBackups: boolean;
  deleteFile: boolean;
  backupLogs: boolean;
  cleanup: boolean;
  systemInfo: boolean;
  restoreLogs: boolean;
  deleteLogBackup: boolean;
}

/**
 * AlertInfo interface
 */
interface AlertInfo {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info" | "warning";
}

/**
 * RestoreOptions interface
 */
interface RestoreOptions {
  mode: "append" | "replace";
  backup_current: boolean;
}

/**
 * AdminPageProps interface (no props required)
 */
interface AdminPageProps {}

/**
 * AdminPage Component
 *
 * Administrator panel for system management with:
 * - File management (list, download, delete corrected documents)
 * - Log management (view, backup, restore system logs)
 * - System maintenance (cleanup old files, export statistics)
 * - System monitoring (disk usage, memory, CPU info)
 * - Alerts configuration (disk space, error rate, system load)
 *
 * Tabs:
 * 1. Files: Manage corrected documents
 * 2. Logs: View and backup system logs
 * 3. Maintenance: System info, statistics, cleanup
 * 4. Alerts: Configure system alerts and notifications
 *
 * @returns React component with admin panel interface
 */
const AdminPage: FC<AdminPageProps> = () => {
  // Tab state
  const [tabValue, setTabValue] = useState<number>(0);

  // File management
  const [files, setFiles] = useState<File[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [cleanupDialogOpen, setCleanupDialogOpen] = useState<boolean>(false);
  const [cleanupDays, setCleanupDays] = useState<number>(30);

  // Log management
  const [logs, setLogs] = useState<string[]>([]);
  const [logsLines, setLogsLines] = useState<number>(100);
  const [logBackups, setLogBackups] = useState<LogBackup[]>([]);
  const [clearLogsAfterBackup, setClearLogsAfterBackup] = useState<boolean>(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState<boolean>(false);
  const [backupToRestore, setBackupToRestore] = useState<string | null>(null);
  const [deleteBackupDialogOpen, setDeleteBackupDialogOpen] = useState<boolean>(false);
  const [backupToDelete, setBackupToDelete] = useState<string | null>(null);
  const [restoreOptions, setRestoreOptions] = useState<RestoreOptions>({
    mode: "append",
    backup_current: true,
  });

  // System info and statistics
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [statisticsPeriod, setStatisticsPeriod] = useState<number>(30);

  // Loading states
  const [loading, setLoading] = useState<LoadingState>({
    files: false,
    logs: false,
    logBackups: false,
    deleteFile: false,
    backupLogs: false,
    cleanup: false,
    systemInfo: false,
    restoreLogs: false,
    deleteLogBackup: false,
  });

  const [statisticsLoading, setStatisticsLoading] = useState<boolean>(false);
  const [alertsConfigLoading, setAlertsConfigLoading] = useState<boolean>(false);
  const [alertsConfigUpdating, setAlertsConfigUpdating] = useState<boolean>(false);

  // UI state
  const [snack, setSnack] = useState<AlertInfo>({
    open: false,
    message: "",
    severity: "info",
  });
  const [alertsConfig, setAlertsConfig] = useState<AlertsConfig | null>(null);

  /**
   * Format bytes to readable size
   *
   * @param bytes - Number of bytes
   * @param decimals - Decimal places
   * @returns Formatted size string (e.g., "1.5 МБ")
   */
  const formatBytes = (bytes: number, decimals: number = 2): string => {
    if (bytes === 0) return "0 Байт";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Байт", "КБ", "МБ", "ГБ", "ТБ"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  /**
   * Show snackbar notification
   *
   * @param message - Notification message
   * @param severity - Alert severity level
   */
  const showAlert = (
    message: string,
    severity: "success" | "error" | "info" | "warning" = "info",
  ): void => {
    setSnack({ open: true, message, severity });
  };

  /**
   * Fetch list of corrected files
   */
  const fetchFiles = async (): Promise<void> => {
    setLoading({ ...loading, files: true });
    try {
      const { data } = await axios.get<{ files: File[] }>(
        `${API_BASE}/api/document/list-corrections`,
      );
      setFiles(data.files || []);
    } catch (err) {
      const errorMsg =
        err instanceof AxiosError && err.response?.data?.error
          ? (err.response.data as { error: string }).error
          : err instanceof Error
            ? err.message
            : "Unknown error";
      showAlert(`Ошибка при получении списка файлов: ${errorMsg}`, "error");
    } finally {
      setLoading({ ...loading, files: false });
    }
  };

  /**
   * Download a corrected file
   *
   * @param filename - File name to download
   */
  const downloadFile = (filename: string): void => {
    window.location.href = `${API_BASE}/corrections/${encodeURIComponent(filename)}`;
  };

  /**
   * Delete a corrected file
   *
   * @param filename - File name to delete
   */
  const deleteFile = async (filename: string): Promise<void> => {
    setLoading({ ...loading, deleteFile: true });
    try {
      const { data } = await axios.delete<{ success: boolean }>(
        `${API_BASE}/api/document/admin/files/${filename}`,
      );
      if (data.success) {
        showAlert(`Файл ${filename} успешно удален`, "success");
        await fetchFiles();
      } else {
        showAlert("Ошибка при удалении файла", "error");
      }
    } catch (err) {
      const errorMsg =
        err instanceof AxiosError && err.response?.data?.error
          ? (err.response.data as { error: string }).error
          : err instanceof Error
            ? err.message
            : "Unknown error";
      showAlert(`Ошибка при удалении файла: ${errorMsg}`, "error");
    } finally {
      setLoading({ ...loading, deleteFile: false });
      setDeleteDialogOpen(false);
    }
  };

  /**
   * Cleanup old files
   */
  const cleanupFiles = async (): Promise<void> => {
    setLoading({ ...loading, cleanup: true });
    try {
      const { data } = await axios.post<{
        success: boolean;
        deleted_count: number;
        kept_count: number;
      }>(`${API_BASE}/api/document/admin/cleanup`, { days: cleanupDays });

      if (data.success) {
        showAlert(
          `Очистка завершена. Удалено: ${data.deleted_count}, Сохранено: ${data.kept_count}`,
          "success",
        );
        await fetchFiles();
      } else {
        showAlert("Ошибка при очистке файлов", "error");
      }
    } catch (err) {
      const errorMsg =
        err instanceof AxiosError && err.response?.data?.error
          ? (err.response.data as { error: string }).error
          : err instanceof Error
            ? err.message
            : "Unknown error";
      showAlert(`Ошибка при очистке файлов: ${errorMsg}`, "error");
    } finally {
      setLoading({ ...loading, cleanup: false });
      setCleanupDialogOpen(false);
    }
  };

  /**
   * Fetch system logs
   */
  const fetchLogs = async (): Promise<void> => {
    setLoading({ ...loading, logs: true });
    try {
      const { data } = await axios.get<{ logs: string[] }>(
        `${API_BASE}/api/document/admin/logs?lines=${logsLines}`,
      );
      setLogs(data.logs || []);
    } catch (err) {
      const errorMsg =
        err instanceof AxiosError && err.response?.data?.error
          ? (err.response.data as { error: string }).error
          : err instanceof Error
            ? err.message
            : "Unknown error";
      showAlert(`Ошибка при получении логов: ${errorMsg}`, "error");
    } finally {
      setLoading({ ...loading, logs: false });
    }
  };

  /**
   * Create backup of logs
   */
  const backupLogs = async (): Promise<void> => {
    setLoading({ ...loading, backupLogs: true });
    try {
      const { data } = await axios.post<{ success: boolean }>(
        `${API_BASE}/api/document/admin/backup/logs`,
        { clear_after_backup: clearLogsAfterBackup },
      );

      if (data.success) {
        showAlert("Резервная копия логов успешно создана", "success");
        await fetchLogBackups();
        if (clearLogsAfterBackup) {
          await fetchLogs();
        }
      } else {
        showAlert("Ошибка при создании резервной копии логов", "error");
      }
    } catch (err) {
      const errorMsg =
        err instanceof AxiosError && err.response?.data?.error
          ? (err.response.data as { error: string }).error
          : err instanceof Error
            ? err.message
            : "Unknown error";
      showAlert(`Ошибка при создании резервной копии: ${errorMsg}`, "error");
    } finally {
      setLoading({ ...loading, backupLogs: false });
    }
  };

  /**
   * Fetch log backups
   */
  const fetchLogBackups = async (): Promise<void> => {
    setLoading({ ...loading, logBackups: true });
    try {
      const { data } = await axios.get<{ backups: LogBackup[] }>(
        `${API_BASE}/api/document/admin/backup/logs`,
      );
      setLogBackups(data.backups || []);
    } catch (err) {
      const errorMsg =
        err instanceof AxiosError && err.response?.data?.error
          ? (err.response.data as { error: string }).error
          : err instanceof Error
            ? err.message
            : "Unknown error";
      showAlert(`Ошибка при получении резервных копий: ${errorMsg}`, "error");
    } finally {
      setLoading({ ...loading, logBackups: false });
    }
  };

  /**
   * Restore logs from backup
   */
  const restoreLogs = async (): Promise<void> => {
    if (!backupToRestore) return;
    setLoading({ ...loading, restoreLogs: true });
    try {
      const { data } = await axios.post<{ success: boolean }>(
        `${API_BASE}/api/document/admin/backup/logs/restore/${backupToRestore}`,
        restoreOptions,
      );

      if (data.success) {
        showAlert(`Логи успешно восстановлены из ${backupToRestore}`, "success");
        await fetchLogs();
        await fetchLogBackups();
      } else {
        showAlert("Ошибка при восстановлении логов", "error");
      }
    } catch (err) {
      const errorMsg =
        err instanceof AxiosError && err.response?.data?.error
          ? (err.response.data as { error: string }).error
          : err instanceof Error
            ? err.message
            : "Unknown error";
      showAlert(`Ошибка при восстановлении логов: ${errorMsg}`, "error");
    } finally {
      setLoading({ ...loading, restoreLogs: false });
      setRestoreDialogOpen(false);
    }
  };

  /**
   * Delete log backup
   */
  const deleteLogBackup = async (): Promise<void> => {
    if (!backupToDelete) return;
    setLoading({ ...loading, deleteLogBackup: true });
    try {
      const { data } = await axios.delete<{ success: boolean }>(
        `${API_BASE}/api/document/admin/backup/logs/${backupToDelete}`,
      );

      if (data.success) {
        showAlert(`Резервная копия логов ${backupToDelete} успешно удалена`, "success");
        await fetchLogBackups();
      } else {
        showAlert("Ошибка при удалении резервной копии логов", "error");
      }
    } catch (err) {
      const errorMsg =
        err instanceof AxiosError && err.response?.data?.error
          ? (err.response.data as { error: string }).error
          : err instanceof Error
            ? err.message
            : "Unknown error";
      showAlert(`Ошибка при удалении резервной копии: ${errorMsg}`, "error");
    } finally {
      setLoading({ ...loading, deleteLogBackup: false });
      setDeleteBackupDialogOpen(false);
    }
  };

  /**
   * Download log backup
   *
   * @param filename - Backup file name
   */
  const downloadLogBackup = (filename: string): void => {
    window.location.href = `${API_BASE}/api/document/admin/backup/logs/download/${encodeURIComponent(
      filename,
    )}`;
  };

  /**
   * Fetch system information
   */
  const fetchSystemInfo = async (): Promise<void> => {
    setLoading({ ...loading, systemInfo: true });
    try {
      const { data } = await axios.get<SystemInfo>(`${API_BASE}/api/document/admin/system-info`);
      if (data.success) {
        setSystemInfo(data);
      } else {
        showAlert("Ошибка при получении системной информации", "error");
      }
    } catch (err) {
      const errorMsg =
        err instanceof AxiosError && err.response?.data?.error
          ? (err.response.data as { error: string }).error
          : err instanceof Error
            ? err.message
            : "Unknown error";
      showAlert(`Ошибка при получении системной информации: ${errorMsg}`, "error");
    } finally {
      setLoading({ ...loading, systemInfo: false });
    }
  };

  /**
   * Fetch statistics
   */
  const fetchStatistics = async (): Promise<void> => {
    setStatisticsLoading(true);
    try {
      const { data } = await axios.get<{ success: boolean; statistics: Statistics }>(
        `${API_BASE}/api/document/admin/statistics?days=${statisticsPeriod}`,
      );
      if (data.success) {
        setStatistics(data.statistics);
      } else {
        showAlert("Ошибка при получении статистики", "error");
      }
    } catch (err) {
      const errorMsg =
        err instanceof AxiosError && err.response?.data?.error
          ? (err.response.data as { error: string }).error
          : err instanceof Error
            ? err.message
            : "Unknown error";
      showAlert(`Ошибка при получении статистики: ${errorMsg}`, "error");
    } finally {
      setStatisticsLoading(false);
    }
  };

  /**
   * Fetch alerts configuration
   */
  const fetchAlertsConfig = async (): Promise<void> => {
    setAlertsConfigLoading(true);
    try {
      const { data } = await axios.get<{ success: boolean; config: AlertsConfig }>(
        `${API_BASE}/api/document/admin/alerts/config`,
      );
      if (data.success) {
        setAlertsConfig(data.config);
      } else {
        showAlert("Ошибка при получении настроек оповещений", "error");
      }
    } catch (err) {
      const errorMsg =
        err instanceof AxiosError && err.response?.data?.error
          ? (err.response.data as { error: string }).error
          : err instanceof Error
            ? err.message
            : "Unknown error";
      showAlert(`Ошибка при получении настроек оповещений: ${errorMsg}`, "error");
    } finally {
      setAlertsConfigLoading(false);
    }
  };

  /**
   * Update alerts configuration
   *
   * @param newConfig - New alerts configuration
   */
  const updateAlertsConfig = async (newConfig: AlertsConfig): Promise<void> => {
    setAlertsConfigUpdating(true);
    try {
      const { data } = await axios.post<{ success: boolean }>(
        `${API_BASE}/api/document/admin/alerts/config`,
        newConfig,
      );
      if (data.success) {
        showAlert("Настройки оповещений успешно обновлены", "success");
        await fetchAlertsConfig();
      } else {
        showAlert("Ошибка при обновлении настроек оповещений", "error");
      }
    } catch (err) {
      const errorMsg =
        err instanceof AxiosError && err.response?.data?.error
          ? (err.response.data as { error: string }).error
          : err instanceof Error
            ? err.message
            : "Unknown error";
      showAlert(`Ошибка при обновлении настроек: ${errorMsg}`, "error");
    } finally {
      setAlertsConfigUpdating(false);
    }
  };

  /**
   * Export system info to file
   *
   * @param format - Export format (txt or csv)
   */
  const exportSystemInfo = (format: "txt" | "csv" = "txt"): void => {
    window.location.href = `${API_BASE}/api/document/admin/system-info/export?format=${format}`;
  };

  /**
   * Export statistics to file
   *
   * @param format - Export format (txt or csv)
   */
  const exportStatistics = (format: "txt" | "csv" = "txt"): void => {
    window.location.href = `${API_BASE}/api/document/admin/statistics/export?days=${statisticsPeriod}&format=${format}`;
  };

  /**
   * Format log line with appropriate icon and color
   *
   * @param logLine - Log text
   * @returns Object with icon, color, and text
   */
  const formatLogLine = (logLine: string): { icon: ReactNode; color: string; text: string } => {
    let icon = <InfoIcon color="info" />;
    let color = "info.main";

    if (logLine.toLowerCase().includes("error")) {
      icon = <ErrorIcon color="error" />;
      color = "error.main";
    } else if (logLine.toLowerCase().includes("warning")) {
      icon = <WarningIcon color="warning" />;
      color = "warning.main";
    }

    return { icon, color, text: logLine };
  };

  /**
   * Format size for statistics display
   *
   * @param size - Size in bytes
   * @returns Formatted size string
   */
  const formatStatSize = (size: number): string => {
    if (size === 0) return "0 байт";
    const k = 1024;
    const sizes = ["байт", "КБ", "МБ", "ГБ"];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return `${parseFloat((size / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  // Initialize data on tab change
  useEffect(() => {
    if (tabValue === 0) {
      fetchFiles();
    } else if (tabValue === 1) {
      fetchLogs();
      fetchLogBackups();
    } else if (tabValue === 2) {
      fetchSystemInfo();
      fetchStatistics();
    } else if (tabValue === 3) {
      fetchAlertsConfig();
    }
  }, [tabValue]);

  // Refresh statistics when period changes
  useEffect(() => {
    if (tabValue === 2) {
      fetchStatistics();
    }
  }, [statisticsPeriod]);

  return (
    <Container maxWidth="lg">
      {/* Header */}
      <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700, mb: 1 }}>
          Панель администратора
        </Typography>
        <NotificationsPanel onNotificationRead={fetchAlertsConfig} />
      </Box>

      {/* Tabs */}
      <Paper sx={{ width: "100%", mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue): void => setTabValue(newValue)}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Файлы" />
          <Tab label="Журналы" />
          <Tab label="Обслуживание" />
          <Tab label="Оповещения" />
        </Tabs>

        {/* ──FILE MANAGEMENT TAB── */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="h6" component="h2">
              Исправленные документы
            </Typography>
            <Box>
              <Button
                startIcon={<RefreshIcon />}
                onClick={fetchFiles}
                disabled={loading.files}
                sx={{ mr: 1 }}
              >
                Обновить
              </Button>
              <Button
                startIcon={<LayersClearIcon />}
                color="warning"
                onClick={(): void => setCleanupDialogOpen(true)}
                disabled={loading.cleanup || files.length === 0}
              >
                Очистить старые
              </Button>
            </Box>
          </Box>

          {loading.files ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          ) : files.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Имя файла</TableCell>
                    <TableCell>Размер</TableCell>
                    <TableCell>Дата создания</TableCell>
                    <TableCell align="right">Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {files.map((file) => (
                    <TableRow key={file.name}>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <ArticleIcon sx={{ mr: 1, color: "primary.main" }} />
                          {file.name}
                        </Box>
                      </TableCell>
                      <TableCell>{file.size_formatted}</TableCell>
                      <TableCell>{file.date}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          onClick={(): void => downloadFile(file.name)}
                          color="primary"
                          size="small"
                          sx={{ mr: 1 }}
                        >
                          <DownloadIcon />
                        </IconButton>
                        <IconButton
                          onClick={(): void => {
                            setFileToDelete(file.name);
                            setDeleteDialogOpen(true);
                          }}
                          color="error"
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">
              <AlertTitle>Нет файлов</AlertTitle>В директории исправлений пока нет файлов
            </Alert>
          )}
        </TabPanel>

        {/* ──LOGS MANAGEMENT TAB── */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="h6" component="h2">
              Журналы системы
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <TextField
                label="Количество строк"
                type="number"
                size="small"
                value={logsLines}
                onChange={(e): void => setLogsLines(parseInt(e.target.value) || 100)}
                sx={{ width: 150 }}
              />
              <Button startIcon={<RefreshIcon />} onClick={fetchLogs} disabled={loading.logs}>
                Обновить
              </Button>
              <Button
                startIcon={<SaveIcon />}
                color="primary"
                onClick={backupLogs}
                disabled={loading.backupLogs}
              >
                Резервная копия
              </Button>
            </Box>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={clearLogsAfterBackup}
                  onChange={(e): void => setClearLogsAfterBackup(e.target.checked)}
                  color="primary"
                />
              }
              label="Очистить логи после создания резервной копии"
            />
          </Box>

          {loading.logs ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          ) : logs.length > 0 ? (
            <Paper
              variant="outlined"
              sx={{
                p: 0,
                maxHeight: 400,
                overflow: "auto",
                bgcolor: "background.default",
                mb: 4,
              }}
            >
              <List dense>
                {logs.map((logLine, index) => {
                  const { icon, color, text } = formatLogLine(logLine);
                  return (
                    <ListItem key={index} divider>
                      <ListItemIcon sx={{ minWidth: 36 }}>{icon}</ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography
                            variant="body2"
                            component="pre"
                            sx={{
                              fontFamily: "monospace",
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-all",
                            }}
                          >
                            {text}
                          </Typography>
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            </Paper>
          ) : (
            <Alert severity="info" sx={{ mb: 4 }}>
              <AlertTitle>Нет записей</AlertTitle>В журнале пока нет записей
            </Alert>
          )}

          {/* Log backups section */}
          <Typography variant="h6" component="h3" sx={{ mt: 4, mb: 2 }}>
            Резервные копии журналов
          </Typography>

          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
            <Button
              startIcon={<RefreshIcon />}
              onClick={fetchLogBackups}
              disabled={loading.logBackups}
              size="small"
            >
              Обновить список
            </Button>
          </Box>

          {loading.logBackups ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          ) : logBackups.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Имя файла</TableCell>
                    <TableCell>Размер</TableCell>
                    <TableCell>Дата создания</TableCell>
                    <TableCell align="right">Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logBackups.map((backup) => (
                    <TableRow key={backup.name}>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <SaveIcon sx={{ mr: 1, color: "primary.main", fontSize: 16 }} />
                          {backup.name}
                        </Box>
                      </TableCell>
                      <TableCell>{backup.size_formatted}</TableCell>
                      <TableCell>{backup.date}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(): void => downloadLogBackup(backup.name)}
                          color="secondary"
                          sx={{ mr: 1 }}
                          title="Скачать"
                        >
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(): void => {
                            setBackupToRestore(backup.name);
                            setRestoreDialogOpen(true);
                          }}
                          color="primary"
                          sx={{ mr: 1 }}
                          title="Восстановить"
                        >
                          <RestoreIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(): void => {
                            setBackupToDelete(backup.name);
                            setDeleteBackupDialogOpen(true);
                          }}
                          color="error"
                          title="Удалить"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">
              <AlertTitle>Нет резервных копий</AlertTitle>
              Резервные копии журналов еще не создавались
            </Alert>
          )}
        </TabPanel>

        {/* ──MAINTENANCE TAB── */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="h6" component="h2">
              Инструменты обслуживания
            </Typography>
            <Button
              startIcon={<RefreshIcon />}
              onClick={(): Promise<void> => Promise.all([fetchSystemInfo(), fetchStatistics()])}
              disabled={loading.systemInfo || statisticsLoading}
            >
              Обновить данные
            </Button>
          </Box>

          <Grid container spacing={3}>
            {/* Cleanup card */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardHeader
                  title="Очистка старых файлов"
                  subheader="Удаление исправленных документов, которые не были использованы в течение указанного периода"
                  avatar={<LayersClearIcon />}
                />
                <CardContent>
                  <TextField
                    label="Дней хранения"
                    helperText="Файлы старше указанного количества дней будут удалены"
                    type="number"
                    fullWidth
                    value={cleanupDays}
                    onChange={(e): void => setCleanupDays(parseInt(e.target.value) || 30)}
                  />
                </CardContent>
                <CardActions>
                  <Button
                    startIcon={<LayersClearIcon />}
                    color="warning"
                    onClick={(): void => setCleanupDialogOpen(true)}
                    disabled={loading.cleanup}
                  >
                    Выполнить очистку
                  </Button>
                </CardActions>
              </Card>
            </Grid>

            {/* Export card */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardHeader
                  title="Отчеты и статистика"
                  subheader="Экспорт данных о работе системы в файл"
                  avatar={<AssessmentIcon />}
                />
                <CardContent>
                  <Stack spacing={2}>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="subtitle1">Системная информация</Typography>
                      <Box>
                        <Tooltip title="Экспорт в TXT">
                          <IconButton
                            onClick={(): void => exportSystemInfo("txt")}
                            size="small"
                            sx={{ mr: 1 }}
                          >
                            <ArticleIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Экспорт в CSV">
                          <IconButton onClick={(): void => exportSystemInfo("csv")} size="small">
                            <TableChartIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                    <Divider />
                    <Box>
                      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                        <InputLabel>Период статистики</InputLabel>
                        <Select
                          value={statisticsPeriod}
                          onChange={(e): void => setStatisticsPeriod(parseInt(e.target.value))}
                          label="Период статистики"
                        >
                          <MenuItem value={7}>Последние 7 дней</MenuItem>
                          <MenuItem value={14}>Последние 14 дней</MenuItem>
                          <MenuItem value={30}>Последние 30 дней</MenuItem>
                          <MenuItem value={90}>Последние 3 месяца</MenuItem>
                          <MenuItem value={180}>Последние 6 месяцев</MenuItem>
                          <MenuItem value={365}>Последний год</MenuItem>
                        </Select>
                      </FormControl>
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="subtitle1">Статистика использования</Typography>
                        <Box>
                          <Tooltip title="Экспорт в TXT">
                            <IconButton
                              onClick={(): void => exportStatistics("txt")}
                              size="small"
                              sx={{ mr: 1 }}
                            >
                              <ArticleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Экспорт в CSV">
                            <IconButton onClick={(): void => exportStatistics("csv")} size="small">
                              <TableChartIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* System info card */}
            {systemInfo && (
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardHeader
                    title="Информация о системе"
                    subheader="Текущее состояние сервера и его ресурсов"
                    avatar={<StorageIcon />}
                  />
                  <CardContent>
                    {loading.systemInfo ? (
                      <CircularProgress size={20} sx={{ m: 2 }} />
                    ) : (
                      <List dense>
                        <ListItem>
                          <ListItemIcon>
                            <ComputerIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Платформа"
                            secondary={systemInfo.system.platform}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <MemoryIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Процессор"
                            secondary={`${systemInfo.system.processor} (${systemInfo.system.cpu_physical} ядра, ${systemInfo.system.cpu_count} потоков)`}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <SdStorageIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Память"
                            secondary={
                              <Box>
                                <Typography variant="body2">
                                  {formatBytes(systemInfo.system.memory_used)} из{" "}
                                  {formatBytes(systemInfo.system.memory_total)} (
                                  {systemInfo.system.memory_percent}%)
                                </Typography>
                                <LinearProgress
                                  variant="determinate"
                                  value={systemInfo.system.memory_percent}
                                  sx={{ mt: 1, height: 4, borderRadius: 16 }}
                                  color={
                                    systemInfo.system.memory_percent > 80
                                      ? "error"
                                      : systemInfo.system.memory_percent > 60
                                        ? "warning"
                                        : "success"
                                  }
                                />
                              </Box>
                            }
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <AccessTimeIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Время работы"
                            secondary={systemInfo.system.server_uptime.formatted}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <ArticleIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Файлы исправлений"
                            secondary={`${systemInfo.app.corrections_count} файлов (${formatBytes(
                              systemInfo.app.corrections_size,
                            )})`}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <SaveIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Журналы и резервные копии"
                            secondary={`Журнал: ${formatBytes(
                              systemInfo.app.log_size,
                            )}, Копии: ${systemInfo.app.log_backups_count} (${formatBytes(
                              systemInfo.app.log_backups_size,
                            )})`}
                          />
                        </ListItem>
                      </List>
                    )}
                  </CardContent>
                  {systemInfo && (
                    <CardActions sx={{ justifyContent: "flex-end" }}>
                      <Typography variant="caption" color="text.secondary">
                        Обновлено: {systemInfo.timestamp}
                      </Typography>
                    </CardActions>
                  )}
                </Card>
              </Grid>
            )}

            {/* Disk usage card */}
            {systemInfo && (
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardHeader
                    title="Использование дисков"
                    subheader="Информация о доступном пространстве на дисках сервера"
                    avatar={<SdStorageIcon />}
                  />
                  <CardContent>
                    <Grid container spacing={2}>
                      {Object.entries(systemInfo.system.disk_usage).map(([mountpoint, usage]) => (
                        <Grid item xs={12} md={6} lg={4} key={mountpoint}>
                          <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>
                              {mountpoint}
                            </Typography>
                            <Box sx={{ mb: 1 }}>
                              <Typography variant="body2">
                                {formatBytes(usage.used)} из {formatBytes(usage.total)} (
                                {usage.percent}%)
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={usage.percent}
                                sx={{ mt: 1, height: 6, borderRadius: 16 }}
                                color={
                                  usage.percent > 90
                                    ? "error"
                                    : usage.percent > 70
                                      ? "warning"
                                      : "success"
                                }
                              />
                            </Box>
                            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                              <Typography variant="caption" color="text.secondary">
                                Свободно: {formatBytes(usage.free)}
                              </Typography>
                              <Chip
                                label={
                                  usage.percent > 90
                                    ? "Критически мало"
                                    : usage.percent > 70
                                      ? "Заканчивается"
                                      : "Достаточно"
                                }
                                size="small"
                                color={
                                  usage.percent > 90
                                    ? "error"
                                    : usage.percent > 70
                                      ? "warning"
                                      : "success"
                                }
                                variant="outlined"
                              />
                            </Box>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Statistics section */}
            <Grid item xs={12}>
              <Typography variant="h6" component="h3" sx={{ mb: 2, mt: 2 }}>
                Статистика использования системы
              </Typography>

              {statisticsLoading ? (
                <Box sx={{ mb: 4 }}>
                  <Skeleton variant="rectangular" height={200} />
                </Box>
              ) : statistics ? (
                <Grid container spacing={3}>
                  {/* Files statistics card */}
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardHeader
                        title="Статистика файлов"
                        subheader={`За период: ${statistics.period.start_date} - ${statistics.period.end_date}`}
                        avatar={<BarChartIcon />}
                      />
                      <CardContent>
                        <List dense>
                          <ListItem>
                            <ListItemIcon>
                              <ArticleIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                              primary="Общее количество файлов"
                              secondary={statistics.files.total_count}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemIcon>
                              <SdStorageIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                              primary="Общий размер файлов"
                              secondary={formatStatSize(statistics.files.total_size)}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemIcon>
                              <TrendingUpIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                              primary="Средний размер файла"
                              secondary={formatStatSize(statistics.files.avg_size)}
                            />
                          </ListItem>

                          <Divider sx={{ my: 1 }} />

                          <ListSubheader>Типы файлов:</ListSubheader>
                          {Object.entries(statistics.files.file_types).map(([type, data]) => (
                            <ListItem key={type}>
                              <ListItemText
                                primary={type}
                                secondary={`${data.count} файлов, ${formatStatSize(data.size)}`}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Logs statistics card */}
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardHeader
                        title="Статистика журналов"
                        subheader={`За период: ${statistics.period.start_date} - ${statistics.period.end_date}`}
                        avatar={<PieChartIcon />}
                      />
                      <CardContent>
                        <List dense>
                          <ListItem>
                            <ListItemIcon>
                              <InfoIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                              primary="Всего записей"
                              secondary={statistics.logs.total_entries}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemIcon>
                              <ErrorIcon fontSize="small" color="error" />
                            </ListItemIcon>
                            <ListItemText
                              primary="Ошибки"
                              secondary={statistics.logs.error_count}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemIcon>
                              <WarningIcon fontSize="small" color="warning" />
                            </ListItemIcon>
                            <ListItemText
                              primary="Предупреждения"
                              secondary={statistics.logs.warning_count}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemIcon>
                              <InfoIcon fontSize="small" color="info" />
                            </ListItemIcon>
                            <ListItemText
                              primary="Информационные сообщения"
                              secondary={statistics.logs.info_count}
                            />
                          </ListItem>
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Weekday stats card */}
                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardHeader
                        title="Активность по дням недели"
                        subheader="Распределение использования системы по дням недели"
                        avatar={<DateRangeIcon />}
                      />
                      <CardContent>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle1" gutterBottom>
                              Файлы по дням недели
                            </Typography>
                            <TableContainer>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>День недели</TableCell>
                                    <TableCell align="right">Кол-во файлов</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {Object.entries(statistics.weekday_stats.files_by_weekday).map(
                                    ([day, count]) => (
                                      <TableRow key={day}>
                                        <TableCell>{day}</TableCell>
                                        <TableCell align="right">{count}</TableCell>
                                      </TableRow>
                                    ),
                                  )}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle1" gutterBottom>
                              Логи по дням недели
                            </Typography>
                            <TableContainer>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>День недели</TableCell>
                                    <TableCell align="right">Кол-во записей</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {Object.entries(statistics.weekday_stats.logs_by_weekday).map(
                                    ([day, count]) => (
                                      <TableRow key={day}>
                                        <TableCell>{day}</TableCell>
                                        <TableCell align="right">{count}</TableCell>
                                      </TableRow>
                                    ),
                                  )}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              ) : (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <AlertTitle>Нет данных</AlertTitle>
                  Статистика использования системы пока недоступна
                </Alert>
              )}
            </Grid>
          </Grid>
        </TabPanel>

        {/* ──ALERTS TAB── */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="h6" component="h2">
              Настройки оповещений и мониторинга
            </Typography>
            <Button
              startIcon={<RefreshIcon />}
              onClick={fetchAlertsConfig}
              disabled={alertsConfigLoading}
            >
              Обновить
            </Button>
          </Box>

          {alertsConfigLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          ) : alertsConfig ? (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  К реализации оставшихся функций оповещений требуется дополнительная настройка
                  бэкенда.
                </Typography>
              </Grid>
            </Grid>
          ) : null}
        </TabPanel>
      </Paper>

      {/* ──DIALOGS── */}

      {/* Delete file dialog */}
      <Dialog open={deleteDialogOpen} onClose={(): void => setDeleteDialogOpen(false)}>
        <DialogTitle>Удалить файл?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Вы уверены, что хотите удалить файл <strong>{fileToDelete}</strong>? Это действие нельзя
            отменить.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={(): void => setDeleteDialogOpen(false)}>Отмена</Button>
          <Button
            onClick={(): Promise<void> => deleteFile(fileToDelete || "")}
            color="error"
            disabled={loading.deleteFile}
          >
            {loading.deleteFile ? "Удаление..." : "Удалить"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cleanup dialog */}
      <Dialog open={cleanupDialogOpen} onClose={(): void => setCleanupDialogOpen(false)}>
        <DialogTitle>Очистить старые файлы?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Будут удалены все файлы, которые не использовались более {cleanupDays} дней. Это
            действие нельзя отменить.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={(): void => setCleanupDialogOpen(false)}>Отмена</Button>
          <Button onClick={cleanupFiles} color="warning" disabled={loading.cleanup}>
            {loading.cleanup ? "Очистка..." : "Очистить"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Restore logs dialog */}
      <Dialog open={restoreDialogOpen} onClose={(): void => setRestoreDialogOpen(false)}>
        <DialogTitle>Восстановить логи?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Выберите режим восстановления логов из резервной копии{" "}
            <strong>{backupToRestore}</strong>:
          </DialogContentText>
          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <FormLabel component="legend">Режим восстановления</FormLabel>
            <RadioGroup
              value={restoreOptions.mode}
              onChange={(e): void =>
                setRestoreOptions({
                  ...restoreOptions,
                  mode: e.target.value as "append" | "replace",
                })
              }
            >
              <FormControlLabel
                value="append"
                control={<Radio />}
                label="Добавить к существующим логам"
              />
              <FormControlLabel
                value="replace"
                control={<Radio />}
                label="Заменить существующие логи"
              />
            </RadioGroup>
          </FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={restoreOptions.backup_current}
                onChange={(e): void =>
                  setRestoreOptions({
                    ...restoreOptions,
                    backup_current: e.target.checked,
                  })
                }
              />
            }
            label="Создать резервную копию текущих логов перед восстановлением"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={(): void => setRestoreDialogOpen(false)}>Отмена</Button>
          <Button onClick={restoreLogs} color="primary" disabled={loading.restoreLogs}>
            {loading.restoreLogs ? "Восстановление..." : "Восстановить"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete backup dialog */}
      <Dialog open={deleteBackupDialogOpen} onClose={(): void => setDeleteBackupDialogOpen(false)}>
        <DialogTitle>Удалить резервную копию?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Вы уверены, что хотите удалить резервную копию <strong>{backupToDelete}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={(): void => setDeleteBackupDialogOpen(false)}>Отмена</Button>
          <Button onClick={deleteLogBackup} color="error" disabled={loading.deleteLogBackup}>
            {loading.deleteLogBackup ? "Удаление..." : "Удалить"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={(): void => setSnack({ ...snack, open: false })}
        message={snack.message}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Container>
  );
};

export default AdminPage;
