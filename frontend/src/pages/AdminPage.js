import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Tab, 
  Tabs, 
  Paper, 
  Card,
  CardContent,
  CardActions,
  CardHeader,
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Alert,
  AlertTitle,
  IconButton,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Snackbar,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListSubheader,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Switch,
  FormControlLabel,
  LinearProgress,
  Radio,
  RadioGroup,
  MenuItem,
  Select,
  FormControl,
  FormLabel,
  InputLabel,
  Menu,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Stack,
  Skeleton,
  ListItemSecondaryAction,
  Slider
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import LayersClearIcon from '@mui/icons-material/LayersClear';
import StorageIcon from '@mui/icons-material/Storage';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import BackupIcon from '@mui/icons-material/Backup';
import ArticleIcon from '@mui/icons-material/Article';
import SaveIcon from '@mui/icons-material/Save';
import RestoreIcon from '@mui/icons-material/Restore';
import MemoryIcon from '@mui/icons-material/Memory';
import SdStorageIcon from '@mui/icons-material/SdStorage';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ComputerIcon from '@mui/icons-material/Computer';
import AssessmentIcon from '@mui/icons-material/Assessment';
import BarChartIcon from '@mui/icons-material/BarChart';
import PieChartIcon from '@mui/icons-material/PieChart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import DateRangeIcon from '@mui/icons-material/DateRange';
import TodayIcon from '@mui/icons-material/Today';
import TableChartIcon from '@mui/icons-material/TableChart';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import SettingsIcon from '@mui/icons-material/Settings';
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt';
import EmailIcon from '@mui/icons-material/Email';
import DnsIcon from '@mui/icons-material/Dns';
import NotificationsIcon from '@mui/icons-material/Notifications';
import axios from 'axios';
import NotificationsPanel from '../components/NotificationsPanel';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const AdminPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [files, setFiles] = useState([]);
  const [logs, setLogs] = useState([]);
  const [logBackups, setLogBackups] = useState([]);
  const [systemInfo, setSystemInfo] = useState(null);
  const [loading, setLoading] = useState({
    files: false,
    logs: false,
    logBackups: false,
    deleteFile: false,
    backupLogs: false,
    cleanup: false,
    systemInfo: false,
    restoreLogs: false,
    deleteLogBackup: false
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [cleanupDialogOpen, setCleanupDialogOpen] = useState(false);
  const [cleanupDays, setCleanupDays] = useState(30);
  const [alertInfo, setAlertInfo] = useState({ open: false, message: '', severity: 'info' });
  const [logsLines, setLogsLines] = useState(100);
  const [clearLogsAfterBackup, setClearLogsAfterBackup] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [backupToRestore, setBackupToRestore] = useState(null);
  const [restoreOptions, setRestoreOptions] = useState({
    mode: 'append',
    backup_current: true
  });
  const [deleteBackupDialogOpen, setDeleteBackupDialogOpen] = useState(false);
  const [backupToDelete, setBackupToDelete] = useState(null);
  const [statisticsPeriod, setStatisticsPeriod] = useState(30);
  const [statistics, setStatistics] = useState(null);
  const [statisticsLoading, setStatisticsLoading] = useState(false);
  const [alertsConfig, setAlertsConfig] = useState(null);
  const [alertsConfigLoading, setAlertsConfigLoading] = useState(false);
  const [alertsConfigUpdating, setAlertsConfigUpdating] = useState(false);
  
  // Загрузка списка файлов
  const fetchFiles = async () => {
    setLoading({ ...loading, files: true });
    try {
      const response = await axios.get('http://localhost:5000/api/document/list-corrections');
      setFiles(response.data.files || []);
    } catch (error) {
      console.error('Ошибка при получении списка файлов:', error);
      showAlert('Ошибка при получении списка файлов', 'error');
    } finally {
      setLoading({ ...loading, files: false });
    }
  };
  
  // Загрузка логов
  const fetchLogs = async () => {
    setLoading({ ...loading, logs: true });
    try {
      const response = await axios.get(`http://localhost:5000/api/document/admin/logs?lines=${logsLines}`);
      setLogs(response.data.logs || []);
    } catch (error) {
      console.error('Ошибка при получении логов:', error);
      showAlert('Ошибка при получении логов', 'error');
    } finally {
      setLoading({ ...loading, logs: false });
    }
  };
  
  // Загрузка резервных копий логов
  const fetchLogBackups = async () => {
    setLoading({ ...loading, logBackups: true });
    try {
      const response = await axios.get('http://localhost:5000/api/document/admin/backup/logs');
      setLogBackups(response.data.backups || []);
    } catch (error) {
      console.error('Ошибка при получении резервных копий логов:', error);
      showAlert('Ошибка при получении резервных копий логов', 'error');
    } finally {
      setLoading({ ...loading, logBackups: false });
    }
  };
  
  // Загрузка системной информации
  const fetchSystemInfo = async () => {
    setLoading({ ...loading, systemInfo: true });
    try {
      const response = await axios.get('http://localhost:5000/api/document/admin/system-info');
      if (response.data.success) {
        setSystemInfo(response.data);
      } else {
        showAlert('Ошибка при получении системной информации', 'error');
      }
    } catch (error) {
      console.error('Ошибка при получении системной информации:', error);
      showAlert('Ошибка при получении системной информации', 'error');
    } finally {
      setLoading({ ...loading, systemInfo: false });
    }
  };
  
  // Удаление файла
  const deleteFile = async (filename) => {
    setLoading({ ...loading, deleteFile: true });
    try {
      const response = await axios.delete(`http://localhost:5000/api/document/admin/files/${filename}`);
      if (response.data.success) {
        showAlert(`Файл ${filename} успешно удален`, 'success');
        fetchFiles(); // Обновляем список файлов
      } else {
        showAlert('Ошибка при удалении файла', 'error');
      }
    } catch (error) {
      console.error('Ошибка при удалении файла:', error);
      showAlert(`Ошибка при удалении файла: ${error.response?.data?.error || error.message}`, 'error');
    } finally {
      setLoading({ ...loading, deleteFile: false });
      setDeleteDialogOpen(false);
    }
  };
  
  // Очистка старых файлов
  const cleanupFiles = async () => {
    setLoading({ ...loading, cleanup: true });
    try {
      const response = await axios.post('http://localhost:5000/api/document/admin/cleanup', {
        days: cleanupDays
      });
      
      if (response.data.success) {
        const { deleted_count, kept_count } = response.data;
        showAlert(`Очистка завершена. Удалено: ${deleted_count}, Сохранено: ${kept_count}`, 'success');
        fetchFiles(); // Обновляем список файлов
      } else {
        showAlert('Ошибка при очистке файлов', 'error');
      }
    } catch (error) {
      console.error('Ошибка при очистке файлов:', error);
      showAlert(`Ошибка при очистке файлов: ${error.response?.data?.error || error.message}`, 'error');
    } finally {
      setLoading({ ...loading, cleanup: false });
      setCleanupDialogOpen(false);
    }
  };
  
  // Создание резервной копии логов
  const backupLogs = async () => {
    setLoading({ ...loading, backupLogs: true });
    try {
      const response = await axios.post('http://localhost:5000/api/document/admin/backup/logs', {
        clear_after_backup: clearLogsAfterBackup
      });
      
      if (response.data.success) {
        showAlert('Резервная копия логов успешно создана', 'success');
        fetchLogBackups(); // Обновляем список резервных копий
        if (clearLogsAfterBackup) {
          fetchLogs(); // Обновляем логи, если они были очищены
        }
      } else {
        showAlert('Ошибка при создании резервной копии логов', 'error');
      }
    } catch (error) {
      console.error('Ошибка при создании резервной копии логов:', error);
      showAlert(`Ошибка при создании резервной копии логов: ${error.response?.data?.error || error.message}`, 'error');
    } finally {
      setLoading({ ...loading, backupLogs: false });
    }
  };
  
  // Восстановление логов из резервной копии
  const restoreLogs = async () => {
    setLoading({ ...loading, restoreLogs: true });
    try {
      const response = await axios.post(`http://localhost:5000/api/document/admin/backup/logs/restore/${backupToRestore}`, restoreOptions);
      
      if (response.data.success) {
        showAlert(`Логи успешно восстановлены из ${backupToRestore}`, 'success');
        fetchLogs(); // Обновляем логи
        fetchLogBackups(); // Обновляем список резервных копий
      } else {
        showAlert('Ошибка при восстановлении логов', 'error');
      }
    } catch (error) {
      console.error('Ошибка при восстановлении логов:', error);
      showAlert(`Ошибка при восстановлении логов: ${error.response?.data?.error || error.message}`, 'error');
    } finally {
      setLoading({ ...loading, restoreLogs: false });
      setRestoreDialogOpen(false);
    }
  };
  
  // Удаление резервной копии логов
  const deleteLogBackup = async () => {
    setLoading({ ...loading, deleteLogBackup: true });
    try {
      const response = await axios.delete(`http://localhost:5000/api/document/admin/backup/logs/${backupToDelete}`);
      
      if (response.data.success) {
        showAlert(`Резервная копия логов ${backupToDelete} успешно удалена`, 'success');
        fetchLogBackups(); // Обновляем список резервных копий
      } else {
        showAlert('Ошибка при удалении резервной копии логов', 'error');
      }
    } catch (error) {
      console.error('Ошибка при удалении резервной копии логов:', error);
      showAlert(`Ошибка при удалении резервной копии: ${error.response?.data?.error || error.message}`, 'error');
    } finally {
      setLoading({ ...loading, deleteLogBackup: false });
      setDeleteBackupDialogOpen(false);
    }
  };
  
  // Загрузка статистики
  const fetchStatistics = async () => {
    setStatisticsLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/document/admin/statistics?days=${statisticsPeriod}`);
      if (response.data.success) {
        setStatistics(response.data.statistics);
      } else {
        showAlert('Ошибка при получении статистики', 'error');
      }
    } catch (error) {
      console.error('Ошибка при получении статистики:', error);
      showAlert(`Ошибка при получении статистики: ${error.response?.data?.error || error.message}`, 'error');
    } finally {
      setStatisticsLoading(false);
    }
  };
  
  // Экспорт системной информации
  const exportSystemInfo = (format = 'txt') => {
    window.location.href = `http://localhost:5000/api/document/admin/system-info/export?format=${format}`;
  };
  
  // Экспорт статистики
  const exportStatistics = (format = 'txt') => {
    window.location.href = `http://localhost:5000/api/document/admin/statistics/export?days=${statisticsPeriod}&format=${format}`;
  };
  
  // Изменение периода статистики
  const handlePeriodChange = (event) => {
    setStatisticsPeriod(parseInt(event.target.value));
  };
  
  // Отображение уведомления
  const showAlert = (message, severity = 'info') => {
    setAlertInfo({ open: true, message, severity });
  };
  
  // Скачивание файла
  const downloadFile = (filename) => {
    window.location.href = `http://localhost:5000/corrections/${encodeURIComponent(filename)}`;
  };
  
  // Скачивание резервной копии логов
  const downloadLogBackup = (filename) => {
    window.location.href = `http://localhost:5000/api/document/admin/backup/logs/download/${encodeURIComponent(filename)}`;
  };
  
  // Обработка смены вкладки
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Форматирование байтов в удобочитаемый формат
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Байт';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Байт', 'КБ', 'МБ', 'ГБ', 'ТБ'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };
  
  // Инициализация при загрузке страницы
  useEffect(() => {
    fetchFiles();
    
    if (tabValue === 1) {
      fetchLogs();
      fetchLogBackups();
    } else if (tabValue === 2) {
      fetchSystemInfo();
    }
  }, [tabValue]);
  
  // Загрузка статистики при изменении периода
  useEffect(() => {
    if (tabValue === 2) {
      fetchStatistics();
    }
  }, [statisticsPeriod, tabValue]);
  
  // Функция для форматирования лога
  const formatLogLine = (logLine) => {
    // Определяем тип лога по содержимому
    let icon = <InfoIcon color="info" />;
    let color = 'info.main';
    
    if (logLine.toLowerCase().includes('error')) {
      icon = <ErrorIcon color="error" />;
      color = 'error.main';
    } else if (logLine.toLowerCase().includes('warning')) {
      icon = <WarningIcon color="warning" />;
      color = 'warning.main';
    }
    
    return { icon, color, text: logLine };
  };
  
  // Закрытие уведомления
  const handleCloseAlert = () => {
    setAlertInfo({ ...alertInfo, open: false });
  };
  
  // Изменение опций восстановления
  const handleRestoreOptionChange = (event) => {
    setRestoreOptions({
      ...restoreOptions,
      [event.target.name]: 
        event.target.type === 'checkbox' 
          ? event.target.checked 
          : event.target.value
    });
  };
  
  // Форматирование размера файла для статистики
  const formatStatSize = (size) => {
    if (size === 0) return '0 байт';
    
    const k = 1024;
    const sizes = ['байт', 'КБ', 'МБ', 'ГБ'];
    const i = Math.floor(Math.log(size) / Math.log(k));
    
    return `${parseFloat((size / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };
  
  // Загрузка конфигурации оповещений
  const fetchAlertsConfig = async () => {
    setAlertsConfigLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/document/admin/alerts/config');
      if (response.data.success) {
        setAlertsConfig(response.data.config);
      } else {
        showAlert('Ошибка при получении настроек оповещений', 'error');
      }
    } catch (error) {
      console.error('Ошибка при получении настроек оповещений:', error);
      showAlert(`Ошибка при получении настроек оповещений: ${error.response?.data?.error || error.message}`, 'error');
    } finally {
      setAlertsConfigLoading(false);
    }
  };
  
  // Обновление конфигурации оповещений
  const updateAlertsConfig = async (newConfig) => {
    setAlertsConfigUpdating(true);
    try {
      const response = await axios.post('http://localhost:5000/api/document/admin/alerts/config', newConfig);
      if (response.data.success) {
        showAlert('Настройки оповещений успешно обновлены', 'success');
        fetchAlertsConfig(); // Обновляем настройки
      } else {
        showAlert('Ошибка при обновлении настроек оповещений', 'error');
      }
    } catch (error) {
      console.error('Ошибка при обновлении настроек оповещений:', error);
      showAlert(`Ошибка при обновлении настроек оповещений: ${error.response?.data?.error || error.message}`, 'error');
    } finally {
      setAlertsConfigUpdating(false);
    }
  };
  
  // Запуск проверки системы на проблемы
  const checkSystem = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/document/admin/alerts/check');
      if (response.data.success) {
        const alertsTriggered = response.data.alerts_triggered;
        if (alertsTriggered.length > 0) {
          showAlert(`Обнаружены проблемы: ${alertsTriggered.length}. Проверьте уведомления.`, 'warning');
        } else {
          showAlert('Проверка системы завершена. Проблем не обнаружено.', 'success');
        }
      } else {
        showAlert('Ошибка при проверке системы', 'error');
      }
    } catch (error) {
      console.error('Ошибка при проверке системы:', error);
      showAlert(`Ошибка при проверке системы: ${error.response?.data?.error || error.message}`, 'error');
    }
  };
  
  // Тестирование системы оповещений
  const testAlerts = async (type = 'web') => {
    try {
      const response = await axios.post('http://localhost:5000/api/document/admin/alerts/test', { type });
      if (response.data.success) {
        showAlert(`Тестовое оповещение типа "${type}" успешно отправлено`, 'success');
      } else {
        showAlert(`Ошибка при отправке тестового оповещения: ${response.data.error}`, 'error');
      }
    } catch (error) {
      console.error('Ошибка при тестировании оповещений:', error);
      showAlert(`Ошибка при тестировании оповещений: ${error.response?.data?.error || error.message}`, 'error');
    }
  };
  
  // Загрузка настроек оповещений при переключении на вкладку
  useEffect(() => {
    if (tabValue === 3) {
      fetchAlertsConfig();
    }
  }, [tabValue]);
  
  // Обработчик изменения настроек оповещений
  const handleAlertConfigChange = (category, setting, value) => {
    if (!alertsConfig) return;
    
    const newConfig = { ...alertsConfig };
    
    // Для вложенных настроек (email, web)
    if (category === 'notifications') {
      const [subCategory, subSetting] = setting.split('.');
      newConfig[category][subCategory][subSetting] = value;
    } else {
      newConfig[category][setting] = value;
    }
    
    setAlertsConfig(newConfig);
  };
  
  // Сохранение настроек оповещений
  const saveAlertsConfig = () => {
    if (!alertsConfig) return;
    
    // Создаем объект только с настройками, без истории уведомлений и других данных
    const configToSave = {
      disk_space: alertsConfig.disk_space,
      error_rate: alertsConfig.error_rate,
      system_load: alertsConfig.system_load,
      memory_usage: alertsConfig.memory_usage,
      notifications: alertsConfig.notifications
    };
    
    updateAlertsConfig(configToSave);
  };
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom
          sx={{ fontWeight: 700, mb: 1 }}
        >
          Панель администратора
        </Typography>
        <NotificationsPanel onNotificationRead={fetchAlertsConfig} />
      </Box>
      
      <Paper sx={{ width: '100%', mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Файлы" />
          <Tab label="Журналы" />
          <Tab label="Обслуживание" />
          <Tab label="Оповещения" />
        </Tabs>
        
        {/* Вкладка управления файлами */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
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
                onClick={() => setCleanupDialogOpen(true)}
                disabled={loading.cleanup || files.length === 0}
              >
                Очистить старые
              </Button>
            </Box>
          </Box>
          
          {loading.files ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
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
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <ArticleIcon sx={{ mr: 1, color: 'primary.main' }} />
                          {file.name}
                        </Box>
                      </TableCell>
                      <TableCell>{file.size_formatted}</TableCell>
                      <TableCell>{file.date}</TableCell>
                      <TableCell align="right">
                        <IconButton 
                          onClick={() => downloadFile(file.name)}
                          color="primary"
                          size="small"
                          sx={{ mr: 1 }}
                        >
                          <DownloadIcon />
                        </IconButton>
                        <IconButton 
                          onClick={() => {
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
              <AlertTitle>Нет файлов</AlertTitle>
              В директории исправлений пока нет файлов
            </Alert>
          )}
        </TabPanel>
        
        {/* Вкладка журналов */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" component="h2">
              Журналы системы
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TextField
                label="Количество строк"
                type="number"
                size="small"
                value={logsLines}
                onChange={(e) => setLogsLines(parseInt(e.target.value) || 100)}
                sx={{ width: 150, mr: 2 }}
              />
              <Button 
                startIcon={<RefreshIcon />} 
                onClick={fetchLogs}
                disabled={loading.logs}
                sx={{ mr: 1 }}
              >
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
          
          {/* Опция очистки при резервном копировании */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={clearLogsAfterBackup}
                  onChange={(e) => setClearLogsAfterBackup(e.target.checked)}
                  color="primary"
                />
              }
              label="Очистить логи после создания резервной копии"
            />
          </Box>
          
          {loading.logs ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : logs.length > 0 ? (
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 0, 
                maxHeight: 400, 
                overflow: 'auto',
                bgcolor: 'background.default',
                mb: 4
              }}
            >
              <List dense>
                {logs.map((logLine, index) => {
                  const { icon, color, text } = formatLogLine(logLine);
                  return (
                    <ListItem key={index} divider>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        {icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography 
                            variant="body2" 
                            component="pre" 
                            sx={{ 
                              fontFamily: 'monospace',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-all'
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
              <AlertTitle>Нет записей</AlertTitle>
              В журнале пока нет записей
            </Alert>
          )}
          
          {/* Секция резервных копий логов */}
          <Typography variant="h6" component="h3" sx={{ mt: 4, mb: 2 }}>
            Резервные копии журналов
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
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
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
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
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <SaveIcon sx={{ mr: 1, color: 'primary.main', fontSize: 16 }} />
                          {backup.name}
                        </Box>
                      </TableCell>
                      <TableCell>{backup.size_formatted}</TableCell>
                      <TableCell>{backup.date}</TableCell>
                      <TableCell align="right">
                        <IconButton 
                          size="small"
                          onClick={() => downloadLogBackup(backup.name)}
                          color="secondary"
                          sx={{ mr: 1 }}
                          title="Скачать"
                        >
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small"
                          onClick={() => {
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
                          onClick={() => {
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
        
        {/* Вкладка обслуживания системы */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" component="h2">
              Инструменты обслуживания
            </Typography>
            <Box>
              <Button 
                startIcon={<RefreshIcon />} 
                onClick={() => {
                  fetchSystemInfo();
                  fetchStatistics();
                }}
                disabled={loading.systemInfo || statisticsLoading}
              >
                Обновить данные
              </Button>
            </Box>
          </Box>
          
          <Grid container spacing={3}>
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
                    onChange={(e) => setCleanupDays(parseInt(e.target.value) || 30)}
                  />
                </CardContent>
                <CardActions>
                  <Button 
                    startIcon={<LayersClearIcon />} 
                    color="warning"
                    onClick={() => setCleanupDialogOpen(true)}
                    disabled={loading.cleanup}
                  >
                    Выполнить очистку
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardHeader
                  title="Отчеты и статистика"
                  subheader="Экспорт данных о работе системы в файл"
                  avatar={<AssessmentIcon />}
                />
                <CardContent>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="subtitle1">Системная информация</Typography>
                      <Box>
                        <Tooltip title="Экспорт в TXT">
                          <IconButton onClick={() => exportSystemInfo('txt')} size="small" sx={{ mr: 1 }}>
                            <ArticleIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Экспорт в CSV">
                          <IconButton onClick={() => exportSystemInfo('csv')} size="small">
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
                          onChange={handlePeriodChange}
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
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle1">Статистика использования</Typography>
                        <Box>
                          <Tooltip title="Экспорт в TXT">
                            <IconButton onClick={() => exportStatistics('txt')} size="small" sx={{ mr: 1 }}>
                              <ArticleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Экспорт в CSV">
                            <IconButton onClick={() => exportStatistics('csv')} size="small">
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
                    ) : systemInfo ? (
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
                                  {formatBytes(systemInfo.system.memory_used)} из {formatBytes(systemInfo.system.memory_total)} 
                                  ({systemInfo.system.memory_percent}%)
                                </Typography>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={systemInfo.system.memory_percent} 
                                  sx={{ mt: 1, height: 4, borderRadius: 2 }}
                                  color={
                                    systemInfo.system.memory_percent > 80 ? "error" :
                                    systemInfo.system.memory_percent > 60 ? "warning" : "success"
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
                            secondary={`${systemInfo.app.corrections_count} файлов (${formatBytes(systemInfo.app.corrections_size)})`} 
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <SaveIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Журналы и резервные копии" 
                            secondary={`Журнал: ${formatBytes(systemInfo.app.log_size)}, Копии: ${systemInfo.app.log_backups_count} (${formatBytes(systemInfo.app.log_backups_size)})`} 
                          />
                        </ListItem>
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Информация о системе недоступна
                      </Typography>
                    )}
                  </CardContent>
                  {systemInfo && (
                    <CardActions sx={{ justifyContent: 'flex-end' }}>
                      <Typography variant="caption" color="text.secondary">
                        Обновлено: {systemInfo.timestamp}
                      </Typography>
                    </CardActions>
                  )}
                </Card>
              </Grid>
            )}
            
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
                                {formatBytes(usage.used)} из {formatBytes(usage.total)} ({usage.percent}%)
                              </Typography>
                              <LinearProgress 
                                variant="determinate" 
                                value={usage.percent} 
                                sx={{ mt: 1, height: 6, borderRadius: 2 }}
                                color={
                                  usage.percent > 90 ? "error" :
                                  usage.percent > 70 ? "warning" : "success"
                                }
                              />
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="caption" color="text.secondary">
                                Свободно: {formatBytes(usage.free)}
                              </Typography>
                              <Chip 
                                label={usage.percent > 90 ? "Критически мало" : 
                                       usage.percent > 70 ? "Заканчивается" : "Достаточно"} 
                                size="small" 
                                color={
                                  usage.percent > 90 ? "error" :
                                  usage.percent > 70 ? "warning" : "success"
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
            
            {/* Статистика по файлам */}
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
                  {/* Общая статистика файлов */}
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
                  
                  {/* Статистика логов */}
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
                  
                  {/* Активность по дням недели */}
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
                                  {Object.entries(statistics.weekday_stats.files_by_weekday).map(([day, count]) => (
                                    <TableRow key={day}>
                                      <TableCell>{day}</TableCell>
                                      <TableCell align="right">{count}</TableCell>
                                    </TableRow>
                                  ))}
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
                                  {Object.entries(statistics.weekday_stats.logs_by_weekday).map(([day, count]) => (
                                    <TableRow key={day}>
                                      <TableCell>{day}</TableCell>
                                      <TableCell align="right">{count}</TableCell>
                                    </TableRow>
                                  ))}
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
        
        {/* Вкладка настроек оповещений */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" component="h2">
              Настройки оповещений
            </Typography>
            <Box>
              <Button 
                startIcon={<RefreshIcon />} 
                onClick={fetchAlertsConfig}
                disabled={alertsConfigLoading}
                sx={{ mr: 1 }}
              >
                Обновить
              </Button>
              <Button 
                startIcon={<SystemUpdateAltIcon />} 
                onClick={checkSystem}
                color="secondary"
              >
                Проверить систему
              </Button>
            </Box>
          </Box>
          
          {alertsConfigLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : alertsConfig ? (
            <Grid container spacing={3}>
              {/* Настройки оповещений о дисковом пространстве */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardHeader
                    title="Дисковое пространство"
                    subheader="Настройки отслеживания свободного места на дисках"
                    avatar={<SdStorageIcon />}
                    action={
                      <Switch
                        checked={alertsConfig.disk_space.enabled}
                        onChange={(e) => handleAlertConfigChange('disk_space', 'enabled', e.target.checked)}
                        inputProps={{ 'aria-label': 'Включить оповещения о дисковом пространстве' }}
                      />
                    }
                  />
                  <CardContent>
                    <Box sx={{ opacity: alertsConfig.disk_space.enabled ? 1 : 0.5 }}>
                      <Typography gutterBottom>
                        Порог предупреждения: {alertsConfig.disk_space.warning_threshold}%
                      </Typography>
                      <Slider
                        value={alertsConfig.disk_space.warning_threshold}
                        onChange={(e, newValue) => handleAlertConfigChange('disk_space', 'warning_threshold', newValue)}
                        disabled={!alertsConfig.disk_space.enabled}
                        valueLabelDisplay="auto"
                        step={5}
                        marks
                        min={50}
                        max={95}
                      />
                      
                      <Typography gutterBottom sx={{ mt: 2 }}>
                        Критический порог: {alertsConfig.disk_space.critical_threshold}%
                      </Typography>
                      <Slider
                        value={alertsConfig.disk_space.critical_threshold}
                        onChange={(e, newValue) => handleAlertConfigChange('disk_space', 'critical_threshold', newValue)}
                        disabled={!alertsConfig.disk_space.enabled}
                        valueLabelDisplay="auto"
                        step={5}
                        marks
                        min={60}
                        max={99}
                      />
                      
                      <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Интервал проверки</InputLabel>
                        <Select
                          value={alertsConfig.disk_space.check_interval}
                          onChange={(e) => handleAlertConfigChange('disk_space', 'check_interval', e.target.value)}
                          label="Интервал проверки"
                          disabled={!alertsConfig.disk_space.enabled}
                        >
                          <MenuItem value={300}>5 минут</MenuItem>
                          <MenuItem value={900}>15 минут</MenuItem>
                          <MenuItem value={1800}>30 минут</MenuItem>
                          <MenuItem value={3600}>1 час</MenuItem>
                          <MenuItem value={7200}>2 часа</MenuItem>
                          <MenuItem value={14400}>4 часа</MenuItem>
                          <MenuItem value={43200}>12 часов</MenuItem>
                          <MenuItem value={86400}>24 часа</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Настройки оповещений о памяти */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardHeader
                    title="Использование памяти"
                    subheader="Настройки отслеживания использования оперативной памяти"
                    avatar={<MemoryIcon />}
                    action={
                      <Switch
                        checked={alertsConfig.memory_usage.enabled}
                        onChange={(e) => handleAlertConfigChange('memory_usage', 'enabled', e.target.checked)}
                        inputProps={{ 'aria-label': 'Включить оповещения о памяти' }}
                      />
                    }
                  />
                  <CardContent>
                    <Box sx={{ opacity: alertsConfig.memory_usage.enabled ? 1 : 0.5 }}>
                      <Typography gutterBottom>
                        Порог предупреждения: {alertsConfig.memory_usage.warning_threshold}%
                      </Typography>
                      <Slider
                        value={alertsConfig.memory_usage.warning_threshold}
                        onChange={(e, newValue) => handleAlertConfigChange('memory_usage', 'warning_threshold', newValue)}
                        disabled={!alertsConfig.memory_usage.enabled}
                        valueLabelDisplay="auto"
                        step={5}
                        marks
                        min={50}
                        max={95}
                      />
                      
                      <Typography gutterBottom sx={{ mt: 2 }}>
                        Критический порог: {alertsConfig.memory_usage.critical_threshold}%
                      </Typography>
                      <Slider
                        value={alertsConfig.memory_usage.critical_threshold}
                        onChange={(e, newValue) => handleAlertConfigChange('memory_usage', 'critical_threshold', newValue)}
                        disabled={!alertsConfig.memory_usage.enabled}
                        valueLabelDisplay="auto"
                        step={5}
                        marks
                        min={60}
                        max={99}
                      />
                      
                      <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Интервал проверки</InputLabel>
                        <Select
                          value={alertsConfig.memory_usage.check_interval}
                          onChange={(e) => handleAlertConfigChange('memory_usage', 'check_interval', e.target.value)}
                          label="Интервал проверки"
                          disabled={!alertsConfig.memory_usage.enabled}
                        >
                          <MenuItem value={300}>5 минут</MenuItem>
                          <MenuItem value={900}>15 минут</MenuItem>
                          <MenuItem value={1800}>30 минут</MenuItem>
                          <MenuItem value={3600}>1 час</MenuItem>
                          <MenuItem value={7200}>2 часа</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Настройки оповещений о нагрузке системы */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardHeader
                    title="Нагрузка системы"
                    subheader="Настройки отслеживания нагрузки на процессор"
                    avatar={<DnsIcon />}
                    action={
                      <Switch
                        checked={alertsConfig.system_load.enabled}
                        onChange={(e) => handleAlertConfigChange('system_load', 'enabled', e.target.checked)}
                        inputProps={{ 'aria-label': 'Включить оповещения о нагрузке системы' }}
                      />
                    }
                  />
                  <CardContent>
                    <Box sx={{ opacity: alertsConfig.system_load.enabled ? 1 : 0.5 }}>
                      <Typography gutterBottom>
                        Порог предупреждения: {alertsConfig.system_load.threshold}%
                      </Typography>
                      <Slider
                        value={alertsConfig.system_load.threshold}
                        onChange={(e, newValue) => handleAlertConfigChange('system_load', 'threshold', newValue)}
                        disabled={!alertsConfig.system_load.enabled}
                        valueLabelDisplay="auto"
                        step={5}
                        marks
                        min={50}
                        max={95}
                      />
                      
                      <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Интервал проверки</InputLabel>
                        <Select
                          value={alertsConfig.system_load.check_interval}
                          onChange={(e) => handleAlertConfigChange('system_load', 'check_interval', e.target.value)}
                          label="Интервал проверки"
                          disabled={!alertsConfig.system_load.enabled}
                        >
                          <MenuItem value={60}>1 минута</MenuItem>
                          <MenuItem value={300}>5 минут</MenuItem>
                          <MenuItem value={900}>15 минут</MenuItem>
                          <MenuItem value={1800}>30 минут</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Настройки оповещений о частоте ошибок */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardHeader
                    title="Частота ошибок"
                    subheader="Настройки отслеживания ошибок в логах"
                    avatar={<ErrorIcon />}
                    action={
                      <Switch
                        checked={alertsConfig.error_rate.enabled}
                        onChange={(e) => handleAlertConfigChange('error_rate', 'enabled', e.target.checked)}
                        inputProps={{ 'aria-label': 'Включить оповещения о частоте ошибок' }}
                      />
                    }
                  />
                  <CardContent>
                    <Box sx={{ opacity: alertsConfig.error_rate.enabled ? 1 : 0.5 }}>
                      <Typography gutterBottom>
                        Порог количества ошибок: {alertsConfig.error_rate.threshold}
                      </Typography>
                      <Slider
                        value={alertsConfig.error_rate.threshold}
                        onChange={(e, newValue) => handleAlertConfigChange('error_rate', 'threshold', newValue)}
                        disabled={!alertsConfig.error_rate.enabled}
                        valueLabelDisplay="auto"
                        step={1}
                        marks
                        min={1}
                        max={50}
                      />
                      
                      <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Период времени</InputLabel>
                        <Select
                          value={alertsConfig.error_rate.window}
                          onChange={(e) => handleAlertConfigChange('error_rate', 'window', e.target.value)}
                          label="Период времени"
                          disabled={!alertsConfig.error_rate.enabled}
                        >
                          <MenuItem value={900}>15 минут</MenuItem>
                          <MenuItem value={1800}>30 минут</MenuItem>
                          <MenuItem value={3600}>1 час</MenuItem>
                          <MenuItem value={7200}>2 часа</MenuItem>
                          <MenuItem value={14400}>4 часа</MenuItem>
                          <MenuItem value={86400}>24 часа</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Настройки уведомлений в веб-интерфейсе */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardHeader
                    title="Уведомления в интерфейсе"
                    subheader="Настройки уведомлений в веб-интерфейсе"
                    avatar={<NotificationsIcon />}
                    action={
                      <Switch
                        checked={alertsConfig.notifications.web.enabled}
                        onChange={(e) => handleAlertConfigChange('notifications', 'web.enabled', e.target.checked)}
                        inputProps={{ 'aria-label': 'Включить уведомления в интерфейсе' }}
                      />
                    }
                  />
                  <CardContent>
                    <Box sx={{ opacity: alertsConfig.notifications.web.enabled ? 1 : 0.5 }}>
                      <Typography gutterBottom>
                        Максимальное количество хранимых уведомлений: {alertsConfig.notifications.web.max_notifications}
                      </Typography>
                      <Slider
                        value={alertsConfig.notifications.web.max_notifications}
                        onChange={(e, newValue) => handleAlertConfigChange('notifications', 'web.max_notifications', newValue)}
                        disabled={!alertsConfig.notifications.web.enabled}
                        valueLabelDisplay="auto"
                        step={10}
                        marks
                        min={10}
                        max={200}
                      />
                      
                      <Button 
                        variant="outlined" 
                        startIcon={<NotificationsIcon />}
                        onClick={() => testAlerts('web')}
                        disabled={!alertsConfig.notifications.web.enabled}
                        sx={{ mt: 2 }}
                        fullWidth
                      >
                        Тестовое уведомление
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Настройки email уведомлений */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardHeader
                    title="Email уведомления"
                    subheader="Настройки отправки уведомлений по электронной почте"
                    avatar={<EmailIcon />}
                    action={
                      <Switch
                        checked={alertsConfig.notifications.email.enabled}
                        onChange={(e) => handleAlertConfigChange('notifications', 'email.enabled', e.target.checked)}
                        inputProps={{ 'aria-label': 'Включить email уведомления' }}
                      />
                    }
                  />
                  <CardContent>
                    <Box sx={{ opacity: alertsConfig.notifications.email.enabled ? 1 : 0.5 }}>
                      <TextField
                        label="SMTP сервер"
                        fullWidth
                        margin="normal"
                        value={alertsConfig.notifications.email.smtp_server}
                        onChange={(e) => handleAlertConfigChange('notifications', 'email.smtp_server', e.target.value)}
                        disabled={!alertsConfig.notifications.email.enabled}
                      />
                      
                      <TextField
                        label="SMTP порт"
                        type="number"
                        fullWidth
                        margin="normal"
                        value={alertsConfig.notifications.email.smtp_port}
                        onChange={(e) => handleAlertConfigChange('notifications', 'email.smtp_port', parseInt(e.target.value) || 587)}
                        disabled={!alertsConfig.notifications.email.enabled}
                      />
                      
                      <TextField
                        label="SMTP пользователь"
                        fullWidth
                        margin="normal"
                        value={alertsConfig.notifications.email.smtp_user}
                        onChange={(e) => handleAlertConfigChange('notifications', 'email.smtp_user', e.target.value)}
                        disabled={!alertsConfig.notifications.email.enabled}
                      />
                      
                      <TextField
                        label="SMTP пароль"
                        type="password"
                        fullWidth
                        margin="normal"
                        value={alertsConfig.notifications.email.smtp_password}
                        onChange={(e) => handleAlertConfigChange('notifications', 'email.smtp_password', e.target.value)}
                        disabled={!alertsConfig.notifications.email.enabled}
                      />
                      
                      <TextField
                        label="Email отправителя"
                        fullWidth
                        margin="normal"
                        value={alertsConfig.notifications.email.sender}
                        onChange={(e) => handleAlertConfigChange('notifications', 'email.sender', e.target.value)}
                        disabled={!alertsConfig.notifications.email.enabled}
                      />
                      
                      <TextField
                        label="Email получателей"
                        fullWidth
                        margin="normal"
                        helperText="Разделите адреса запятыми"
                        value={alertsConfig.notifications.email.recipients.join(', ')}
                        onChange={(e) => {
                          const emails = e.target.value.split(',').map(email => email.trim()).filter(email => email);
                          handleAlertConfigChange('notifications', 'email.recipients', emails);
                        }}
                        disabled={!alertsConfig.notifications.email.enabled}
                      />
                      
                      <Button 
                        variant="outlined" 
                        startIcon={<EmailIcon />}
                        onClick={() => testAlerts('email')}
                        disabled={!alertsConfig.notifications.email.enabled}
                        sx={{ mt: 2 }}
                        fullWidth
                      >
                        Тестовое email уведомление
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Сохранение настроек */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={saveAlertsConfig}
                    disabled={alertsConfigUpdating}
                    startIcon={alertsConfigUpdating ? <CircularProgress size={20} /> : <SaveIcon />}
                  >
                    Сохранить настройки
                  </Button>
                </Box>
              </Grid>
            </Grid>
          ) : (
            <Alert severity="info">
              <AlertTitle>Ошибка загрузки</AlertTitle>
              Не удалось загрузить настройки оповещений
            </Alert>
          )}
        </TabPanel>
      </Paper>
      
      {/* Диалог подтверждения удаления файла */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Подтверждение удаления</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Вы действительно хотите удалить файл "{fileToDelete}"? Это действие нельзя отменить.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Отмена</Button>
          <Button 
            onClick={() => deleteFile(fileToDelete)} 
            color="error"
            disabled={loading.deleteFile}
            startIcon={loading.deleteFile ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Диалог подтверждения очистки файлов */}
      <Dialog
        open={cleanupDialogOpen}
        onClose={() => setCleanupDialogOpen(false)}
      >
        <DialogTitle>Подтверждение очистки</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Вы действительно хотите удалить все файлы старше {cleanupDays} дней? Это действие нельзя отменить.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCleanupDialogOpen(false)}>Отмена</Button>
          <Button 
            onClick={cleanupFiles} 
            color="warning"
            disabled={loading.cleanup}
            startIcon={loading.cleanup ? <CircularProgress size={20} /> : <LayersClearIcon />}
          >
            Выполнить очистку
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Диалог подтверждения восстановления логов */}
      <Dialog
        open={restoreDialogOpen}
        onClose={() => setRestoreDialogOpen(false)}
      >
        <DialogTitle>Восстановление логов</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Вы собираетесь восстановить логи из резервной копии "{backupToRestore}". 
            Выберите настройки восстановления:
          </DialogContentText>
          
          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <FormLabel component="legend">Режим восстановления</FormLabel>
            <RadioGroup
              name="mode"
              value={restoreOptions.mode}
              onChange={handleRestoreOptionChange}
            >
              <FormControlLabel 
                value="append" 
                control={<Radio />} 
                label="Добавить логи из резервной копии к текущим (в конец файла)" 
              />
              <FormControlLabel 
                value="overwrite" 
                control={<Radio />} 
                label="Заменить текущие логи данными из резервной копии" 
              />
            </RadioGroup>
          </FormControl>
          
          <FormControlLabel
            control={
              <Switch
                checked={restoreOptions.backup_current}
                onChange={handleRestoreOptionChange}
                name="backup_current"
                color="primary"
              />
            }
            label="Создать резервную копию текущих логов перед восстановлением"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialogOpen(false)}>Отмена</Button>
          <Button 
            onClick={restoreLogs} 
            color="primary"
            disabled={loading.restoreLogs}
            startIcon={loading.restoreLogs ? <CircularProgress size={20} /> : <RestoreIcon />}
          >
            Восстановить
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Диалог подтверждения удаления резервной копии логов */}
      <Dialog
        open={deleteBackupDialogOpen}
        onClose={() => setDeleteBackupDialogOpen(false)}
      >
        <DialogTitle>Подтверждение удаления</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Вы действительно хотите удалить резервную копию логов "{backupToDelete}"? Это действие нельзя отменить.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteBackupDialogOpen(false)}>Отмена</Button>
          <Button 
            onClick={deleteLogBackup} 
            color="error"
            disabled={loading.deleteLogBackup}
            startIcon={loading.deleteLogBackup ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Уведомление об операциях */}
      <Snackbar
        open={alertInfo.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
      >
        <Alert onClose={handleCloseAlert} severity={alertInfo.severity}>
          {alertInfo.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminPage; 