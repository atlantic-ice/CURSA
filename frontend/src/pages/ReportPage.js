import React, { useState, useContext, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Box,
  Typography,
  Container,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Button,
  Alert,
  AlertTitle,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Card,
  CardContent,
  Stack,
  Fade,
  Tabs,
  Tab,
  Avatar,
  LinearProgress,
  Tooltip,
  Badge,
  CardActions,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  useTheme,
  alpha,
  CircularProgress
} from '@mui/material';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoIcon from '@mui/icons-material/Info';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DownloadIcon from '@mui/icons-material/Download';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import ArticleIcon from '@mui/icons-material/Article';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TextFormatIcon from '@mui/icons-material/TextFormat';
import BorderStyleIcon from '@mui/icons-material/BorderStyle';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatLineSpacingIcon from '@mui/icons-material/FormatLineSpacing';
import ImageIcon from '@mui/icons-material/Image';
import TableChartIcon from '@mui/icons-material/TableChart';
import TitleIcon from '@mui/icons-material/Title';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ListAltIcon from '@mui/icons-material/ListAlt';
import DescriptionIcon from '@mui/icons-material/Description';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CategoryIcon from '@mui/icons-material/Category';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import BuildIcon from '@mui/icons-material/Build';
import InsightsIcon from '@mui/icons-material/Insights';
import TimelineIcon from '@mui/icons-material/Timeline';
import ScienceIcon from '@mui/icons-material/Science';
import StarIcon from '@mui/icons-material/Star';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import DataUsageIcon from '@mui/icons-material/DataUsage';
import VerifiedIcon from '@mui/icons-material/Verified';
import axios from 'axios';

// Функция для определения общей оценки документа
function getDocumentGrade(totalIssues, highSeverityCount, mediumSeverityCount, lowSeverityCount) {
  // 5 — Нет критических и средних, ≤ 3 незначительных
  if (highSeverityCount === 0 && mediumSeverityCount === 0 && lowSeverityCount <= 3) {
    return { label: 'Отлично, несоответствий нет', color: 'success', score: 5 };
  }
  // 4 — Нет критических, ≤ 3 средних, ≤ 10 незначительных
  if (highSeverityCount === 0 && mediumSeverityCount <= 3 && lowSeverityCount <= 10) {
    return { label: 'Хорошо, незначительные недочёты', color: 'success', score: 4 };
  }
  // 3 — Нет критических, ≤ 10 средних
  if (highSeverityCount === 0 && mediumSeverityCount <= 10) {
    return { label: 'Удовлетворительно, есть недочёты', color: 'warning', score: 3 };
  }
  // 2 — ≤ 5 критических
  if (highSeverityCount <= 5) {
    return { label: 'Неудовлетворительно, требуется доработка', color: 'error', score: 2 };
  }
  // 1 — > 5 критических
  return { label: 'Плохо, требуется серьёзная доработка', color: 'error', score: 1 };
}

// Функция для группировки одинаковых несоответствий
function groupIssues(issues) {
  const map = {};
  issues.forEach(issue => {
    const key = issue.type + '|' + issue.description;
    if (!map[key]) {
      map[key] = { ...issue, count: 1, locations: [issue.location] };
    } else {
      map[key].count += 1;
      map[key].locations.push(issue.location);
    }
  });
  return Object.values(map);
}

// Для оптимизации производительности - константа конфигурации
const ENABLE_ANIMATIONS = false; // Отключаем анимации для повышения производительности

// Компонент статистики документа с современным дизайном
const DocumentStatistics = ({ totalIssues, highSeverityCount, mediumSeverityCount, lowSeverityCount, totalAutoFixableCount, documentGrade }) => {
  const theme = useTheme();
  
  // Данные для диаграммы
  const chartData = [
    { label: 'Критические', value: highSeverityCount, color: 'error', icon: <ErrorOutlineIcon /> },
    { label: 'Средние', value: mediumSeverityCount, color: 'warning', icon: <WarningAmberIcon /> },
    { label: 'Незначительные', value: lowSeverityCount, color: 'info', icon: <InfoIcon /> }
  ].filter(item => item.value > 0);

  return (
    <Box sx={{ mb: 4 }}>
      <Grid container spacing={4}>
        {/* Левая панель - детальная статистика */}
        <Grid item xs={12} lg={8}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 3,
              borderRadius: 3,
              background: theme => `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.03)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
              border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Фоновый декоративный элемент */}
            <Box
              sx={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 150,
                height: 150,
                borderRadius: '50%',
                background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.secondary.main, 0.03)})`,
                zIndex: 0
              }}
            />
            
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                <AssessmentIcon sx={{ mr: 1, color: 'primary.main' }} />
                Детальная статистика
              </Typography>
              
              {/* Основные метрики */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: alpha(theme.palette.background.paper, 0.7), borderRadius: 2 }}>
                    <Typography variant="h4" fontWeight={800} color="text.primary">
                      {totalIssues}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      Всего проблем
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: alpha(theme.palette.success.main, 0.1), borderRadius: 2 }}>
                    <Typography variant="h4" fontWeight={800} color="success.main">
                      {totalAutoFixableCount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      Исправляемых
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: alpha(theme.palette.info.main, 0.1), borderRadius: 2 }}>
                    <Typography variant="h4" fontWeight={800} color="info.main">
                      {totalIssues > 0 ? Math.round(totalAutoFixableCount / totalIssues * 100) : 0}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      Автоисправление
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: alpha(theme.palette.warning.main, 0.1), borderRadius: 2 }}>
                    <Typography variant="h4" fontWeight={800} color="warning.main">
                      {totalIssues - totalAutoFixableCount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      Ручных
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Прогресс-бар распределения ошибок */}
              {totalIssues > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                    Распределение по серьезности
                  </Typography>
                  <Box sx={{ 
                    position: 'relative',
                    height: 12, 
                    borderRadius: 6, 
                    bgcolor: alpha(theme.palette.grey[300], 0.3),
                    overflow: 'hidden',
                    mb: 2
                  }}>
                    {highSeverityCount > 0 && (
                      <Box sx={{ 
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        height: '100%',
                        width: `${(highSeverityCount / totalIssues) * 100}%`,
                        bgcolor: 'error.main',
                        borderRadius: '6px 0 0 6px'
                      }} />
                    )}
                    {mediumSeverityCount > 0 && (
                      <Box sx={{ 
                        position: 'absolute',
                        left: `${(highSeverityCount / totalIssues) * 100}%`,
                        top: 0,
                        height: '100%',
                        width: `${(mediumSeverityCount / totalIssues) * 100}%`,
                        bgcolor: 'warning.main'
                      }} />
                    )}
                    {lowSeverityCount > 0 && (
                      <Box sx={{ 
                        position: 'absolute',
                        left: `${((highSeverityCount + mediumSeverityCount) / totalIssues) * 100}%`,
                        top: 0,
                        height: '100%',
                        width: `${(lowSeverityCount / totalIssues) * 100}%`,
                        bgcolor: 'info.main',
                        borderRadius: '0 6px 6px 0'
                      }} />
                    )}
                  </Box>
                  
                  {/* Легенда */}
                  <Stack direction="row" spacing={2} flexWrap="wrap">
                    {chartData.map((item) => (
                      <Box key={item.label} sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box 
                          sx={{ 
                            width: 12, 
                            height: 12, 
                            borderRadius: '50%', 
                            bgcolor: `${item.color}.main`,
                            mr: 1 
                          }} 
                        />
                        <Typography variant="body2" color="text.secondary">
                          {item.label}: {item.value}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
        
        {/* Правая панель - общая оценка */}
        <Grid item xs={12} lg={4}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 3,
              borderRadius: 3,
              height: '100%',
              background: theme => {
                const baseColor = documentGrade.color === 'success' ? theme.palette.success.main :
                                documentGrade.color === 'warning' ? theme.palette.warning.main :
                                theme.palette.error.main;
                return `linear-gradient(135deg, ${alpha(baseColor, 0.08)} 0%, ${alpha(baseColor, 0.03)} 100%)`;
              },
              border: `2px solid ${alpha(theme.palette[documentGrade.color].main, 0.2)}`,
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center'
            }}
          >
            {/* Фоновые декоративные элементы */}
            <Box
              sx={{
                position: 'absolute',
                top: -30,
                left: -30,
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: `linear-gradient(45deg, ${alpha(theme.palette[documentGrade.color].main, 0.1)}, transparent)`,
                zIndex: 0
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: -20,
                right: -20,
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: `linear-gradient(45deg, transparent, ${alpha(theme.palette[documentGrade.color].main, 0.08)})`,
                zIndex: 0
              }}
            />
            
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              {/* Индикатор оценки */}
              <Box 
                sx={{
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `linear-gradient(135deg, ${theme.palette[documentGrade.color].main}, ${theme.palette[documentGrade.color].dark})`,
                  boxShadow: `0 8px 32px ${alpha(theme.palette[documentGrade.color].main, 0.4)}`,
                  mb: 3,
                  position: 'relative'
                }}
              >
                <Typography 
                  variant="h2" 
                  component="div"
                  sx={{ 
                    fontWeight: 900, 
                    color: 'white',
                    textShadow: '0 2px 8px rgba(0,0,0,0.3)'
                  }}
                >
                  {documentGrade.score}
                </Typography>
                
                {/* Звездочки для высоких оценок */}
                {documentGrade.score >= 4 && (
                  <Box sx={{ position: 'absolute', top: -10, right: -10 }}>
                    <StarIcon sx={{ color: '#FFD700', fontSize: 24 }} />
                  </Box>
                )}
              </Box>
              
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1, color: `${documentGrade.color}.dark` }}>
                Общая оценка
              </Typography>
              
              <Typography 
                variant="h5" 
                fontWeight={600}
                sx={{ 
                  mb: 2,
                  color: `${documentGrade.color}.main`,
                  lineHeight: 1.2
                }}
              >
                {documentGrade.label}
              </Typography>
              
              <Box sx={{ 
                p: 2, 
                bgcolor: alpha(theme.palette.background.paper, 0.7), 
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
              }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {totalIssues === 0 
                    ? 'Документ полностью соответствует требованиям!' 
                    : `Обнаружено ${totalIssues} ${totalIssues === 1 ? 'несоответствие' : totalIssues > 1 && totalIssues < 5 ? 'несоответствия' : 'несоответствий'}`}
                </Typography>
              </Box>
              
              {/* Дополнительные индикаторы */}
              <Stack direction="row" spacing={1} sx={{ mt: 2, justifyContent: 'center' }}>
                {documentGrade.score === 5 && <VerifiedIcon sx={{ color: 'success.main' }} />}
                {documentGrade.score >= 4 && <ThumbUpIcon sx={{ color: 'success.main' }} />}
                {totalAutoFixableCount > 0 && <BuildIcon sx={{ color: 'info.main' }} />}
              </Stack>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

const ReportPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { reportData, fileName } = location.state || {};
  const [loading, setLoading] = useState(false);
  const [correctionSuccess, setCorrectionSuccess] = useState(false);
  const [correctionError, setCorrectionError] = useState('');
  const [correctedFilePath, setCorrectedFilePath] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportError, setReportError] = useState(null);
  const [reportFilePath, setReportFilePath] = useState(null);
  const [tabValue, setTabValue] = useState(0); // Состояние для табов
  const [showInsights, setShowInsights] = useState(false); // Для показа аналитики
  const [autoDownloaded, setAutoDownloaded] = useState(false);
  const [viewMode, setViewMode] = useState('pre'); // 'pre' | 'post'
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiText, setAiText] = useState('');
  const [aiAvailable, setAiAvailable] = useState(false);
  
  
  // Контекст для истории проверок
  // const { addToHistory } = useContext(CheckHistoryContext); // removed - context not available
  const addToHistory = () => {}; // no-op stub

  // Мемоизируем входные данные
  const memoizedReportData = useMemo(() => reportData || {}, [reportData]);
  const memoizedFileName = useMemo(() => fileName || '', [fileName]);

  // Используем ИИ подсказки из backend, если они пришли вместе с отчетом
  useEffect(() => {
    const aiBlock = memoizedReportData?.ai_suggestions || {};
    const backendError = memoizedReportData?.ai_error || '';
    const initial = viewMode === 'post' ? aiBlock?.after : aiBlock?.before;
    if (initial) {
      setAiText(initial);
      setAiAvailable(true);
    } else if (aiBlock?.before || aiBlock?.after) {
      setAiAvailable(true);
    }
    if (backendError) {
      setAiError(backendError);
    }
  }, [memoizedReportData, viewMode]);

  // Мемоизируем issues и статистику
  // Предпочитаем результаты после автокоррекции, если они есть и лучше
  const effectiveResults = useMemo(() => {
    const corrected = memoizedReportData.corrected_check_results;
    const original = memoizedReportData.check_results;

    if (viewMode === 'post' && corrected) return corrected;
    if (viewMode === 'pre') return original || {};
    return original || {};
  }, [memoizedReportData, viewMode]);

  const issues = useMemo(() => 
    effectiveResults?.issues || [], 
    [effectiveResults]
  );
  const totalIssues = useMemo(() => 
    effectiveResults?.total_issues_count || 0, 
    [effectiveResults]
  );

  // Группировка проблем по типу и серьезности
  const groupedIssues = useMemo(() => 
    issues.reduce((groups, issue) => {
      const category = issue.type.split('_')[0];
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(issue);
      return groups;
    }, {}), 
    [issues]
  );

  // Группировка уникальных проблем
  const groupedIssuesList = useMemo(() => 
    groupIssues(issues), 
    [issues]
  );
  const totalGroupedIssues = useMemo(() => 
    groupedIssuesList.length, 
    [groupedIssuesList]
  );

  // Статистика по серьезности
  const statistics = useMemo(() => 
    effectiveResults?.statistics || {}, 
    [effectiveResults]
  );
  const highSeverityCount = useMemo(() => 
    statistics.severity?.high || 0, 
    [statistics]
  );
  const mediumSeverityCount = useMemo(() => 
    statistics.severity?.medium || 0, 
    [statistics]
  );
  const lowSeverityCount = useMemo(() => 
    statistics.severity?.low || 0, 
    [statistics]
  );
  const totalAutoFixableCount = useMemo(() => 
    statistics.auto_fixable_count || 0, 
    [statistics]
  );

  // Перенаправление, если нет данных
  useEffect(() => {
    if (!memoizedReportData) {
      navigate('/check');
    }
  }, [memoizedReportData, navigate]);

  // Устанавливаем режим просмотра по умолчанию: если есть результаты после исправления — показываем их
  useEffect(() => {
    if (memoizedReportData?.corrected_check_results) {
      setViewMode('post');
    } else {
      setViewMode('pre');
    }
  }, [memoizedReportData]);

  // Сохраняем результат в истории при первичной загрузке страницы
  useEffect(() => {
    if (memoizedReportData && memoizedFileName) {
      addToHistory({
        id: Date.now().toString(),
        fileName: memoizedFileName,
        reportData: memoizedReportData,
        timestamp: Date.now(),
        correctedFilePath: correctedFilePath || memoizedReportData.corrected_file_path || null
      });
    }
  }, [memoizedReportData, memoizedFileName, addToHistory, correctedFilePath]);

  // Автоскачивание исправленного документа, если он уже есть после загрузки
  useEffect(() => {
    const serverCorrected = memoizedReportData?.corrected_file_path;
    const success = memoizedReportData?.correction_success;
    if (!autoDownloaded && success && serverCorrected) {
      setAutoDownloaded(true);
      downloadDocument(serverCorrected, memoizedFileName);
    }
  }, [memoizedReportData, memoizedFileName, autoDownloaded]);

  // Прокрутка вверх при загрузке страницы
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Определяем общую оценку документа
  const documentGrade = useMemo(() => 
    getDocumentGrade(totalIssues, highSeverityCount, mediumSeverityCount, lowSeverityCount), 
    [totalIssues, highSeverityCount, mediumSeverityCount, lowSeverityCount]
  );

  // Обработчик изменения таба
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) setViewMode(newMode);
  };

  const handleAISuggestions = async () => {
    setAiLoading(true);
    setAiError('');
    try {
      const response = await axios.post('http://localhost:5000/api/document/ai/suggest', {
        check_results: effectiveResults,
        filename: memoizedFileName
      });
      if (response.data?.success) {
        setAiText(response.data.suggestions || '');
        setAiAvailable(true);
      } else {
        setAiError(response.data?.error || 'Не удалось получить рекомендации ИИ');
      }
    } catch (err) {
      setAiError(err?.response?.data?.error || 'Ошибка запроса к ИИ');
    } finally {
      setAiLoading(false);
    }
  };

  // Если нет данных - возвращаем null
  if (!memoizedReportData) {
    return null;
  }

  // Определяем иконку для категории
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'font':
        return <TextFormatIcon />;
      case 'margins':
        return <BorderStyleIcon />;
      case 'line':
        return <FormatLineSpacingIcon />;
      case 'paragraphs':
        return <FormatListBulletedIcon />;
      case 'heading':
        return <TitleIcon />;
      case 'bibliography':
        return <MenuBookIcon />;
      case 'image':
        return <ImageIcon />;
      case 'table':
        return <TableChartIcon />;
      case 'structure':
      case 'missing':
      case 'section':
        return <ListAltIcon />;
      default:
        return <ArticleIcon />;
    }
  };

  // Определяем иконку в зависимости от серьезности проблемы
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high':
        return <ErrorOutlineIcon color="error" />;
      case 'medium':
        return <WarningAmberIcon color="warning" />;
      case 'low':
        return <InfoIcon color="info" />;
      default:
        return <InfoIcon />;
    }
  };

  // Текст для чипа серьезности
  const getSeverityText = (severity) => {
    switch (severity) {
      case 'high':
        return 'Высокая';
      case 'medium':
        return 'Средняя';
      case 'low':
        return 'Низкая';
      default:
        return 'Не указана';
    }
  };

  // Цвет для чипа серьезности
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  // Получаем локализованное название категории
  const getCategoryName = (category) => {
    switch (category) {
      case 'font': return 'Шрифты';
      case 'margins': return 'Поля документа';
      case 'line': return 'Межстрочный интервал';
      case 'paragraphs': return 'Форматирование параграфов';
      case 'heading': return 'Заголовки';
      case 'bibliography': return 'Список литературы';
      case 'image': return 'Изображения';
      case 'table': return 'Таблицы';
      case 'first': return 'Отступы абзацев';
      case 'structure': return 'Структура документа';
      case 'missing': return 'Отсутствующие элементы';
      case 'section': return 'Разделы документа';
      case 'page': return 'Страницы';
      default: return 'Другое';
    }
  };

  // Функция для склонения слова "проблема"
  function pluralizeProblem(count) {
    if (count % 10 === 1 && count % 100 !== 11) return 'проблема';
    if ([2,3,4].includes(count % 10) && ![12,13,14].includes(count % 100)) return 'проблемы';
    return 'проблем';
  }

  // Обработка исправления ошибок
  const handleCorrection = async () => {
    setLoading(true);
    setCorrectionError('');
    setCorrectionSuccess(false);

    try {
      const response = await axios.post('http://localhost:5000/api/document/correct', {
        file_path: memoizedReportData.temp_path,
        errors: issues.filter(issue => issue.auto_fixable),
        original_filename: memoizedFileName
      });

      if (response.data.success) {
        setCorrectedFilePath(response.data.corrected_file_path);
        setCorrectionSuccess(true);
        
        // Обновить запись в истории, добавив путь исправленного файла
        addToHistory({
          id: Date.now().toString(),
          fileName: memoizedFileName,
          reportData: {
            ...memoizedReportData,
            corrected_file_path: response.data.corrected_file_path
          },
          timestamp: Date.now(),
          correctedFilePath: response.data.corrected_file_path
        });
        
        // Автоматически скачиваем документ после успешного исправления
        downloadDocument(response.data.corrected_file_path, memoizedFileName);
      } else {
        setCorrectionError('Произошла ошибка при исправлении документа');
      }
    } catch (error) {
      console.error('Ошибка при исправлении документа:', error);
      setCorrectionError(
        error.response?.data?.error || 
        'Произошла ошибка при исправлении документа. Пожалуйста, попробуйте еще раз.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Функция для скачивания документа
  const downloadDocument = (filePath, originalName) => {
    if (!filePath) return;
    
    const extension = '.docx';
    const fileName = originalName ? 
      (originalName.endsWith('.docx') ? originalName : originalName + extension) : 
      `corrected_document_${Date.now()}${extension}`;
    
    // Если путь выглядит как имя файла (без слешей), используем прямой доступ
    if (filePath.indexOf('/') === -1 && filePath.indexOf('\\') === -1) {
      window.location.href = `http://localhost:5000/corrections/${encodeURIComponent(filePath)}`;
    } else {
      // Иначе используем стандартный endpoint
      window.location.href = `http://localhost:5000/api/document/download-corrected?path=${encodeURIComponent(filePath)}&filename=${encodeURIComponent(fileName)}`;
    }
  };
  // Улучшенный компонент карточки категории с современным дизайном
  const CategoryCard = ({ category, issues, count, icon, index }) => {
    const highSeverity = issues.filter(issue => 
      issue.type.startsWith(category) && issue.severity === 'high'
    ).length;
    const mediumSeverity = issues.filter(issue => 
      issue.type.startsWith(category) && issue.severity === 'medium'
    ).length;
    const lowSeverity = issues.filter(issue => 
      issue.type.startsWith(category) && issue.severity === 'low'
    ).length;
    const severity = highSeverity > 0 ? 'error' : mediumSeverity > 0 ? 'warning' : 'info';
    const autoFixableCount = issues.filter(issue => 
      issue.type.startsWith(category) && issue.auto_fixable
    ).length;

    return (
      <Card sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        borderRadius: 4,
        border: '1px solid',
        borderColor: alpha(theme.palette[severity].main, 0.2),
        background: `linear-gradient(135deg, ${alpha(theme.palette[severity].main, 0.02)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 12px 40px ${alpha(theme.palette[severity].main, 0.15)}`,
          borderColor: `${severity}.main`
        }
      }}>
        {/* Декоративная полоса сверху */}
        <Box 
          sx={{ 
            height: 4, 
            background: `linear-gradient(90deg, ${theme.palette[severity].main}, ${theme.palette[severity].light})` 
          }} 
        />
        
        <CardContent sx={{ flexGrow: 1, p: 3 }}>
          {/* Заголовок категории */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `linear-gradient(135deg, ${theme.palette[severity].main}, ${theme.palette[severity].dark})`,
                color: 'white',
                mr: 2,
                boxShadow: `0 4px 16px ${alpha(theme.palette[severity].main, 0.3)}`
              }}
            >
              {React.cloneElement(icon, { fontSize: 'large' })}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" component="div" fontWeight={700} sx={{ mb: 0.5 }}>
                {getCategoryName(category)}
              </Typography>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                {count} {pluralizeProblem(count)}
              </Typography>
            </Box>
          </Box>

          {/* Статистика по серьезности */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ 
              height: 8, 
              borderRadius: 4, 
              bgcolor: alpha(theme.palette.grey[300], 0.2), 
              position: 'relative',
              overflow: 'hidden',
              mb: 2
            }}>
              {highSeverity > 0 && (
                <Box sx={{ 
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '100%',
                  width: `${(highSeverity / count) * 100}%`,
                  background: `linear-gradient(90deg, ${theme.palette.error.main}, ${theme.palette.error.light})`,
                  borderRadius: '4px 0 0 4px'
                }} />
              )}
              {mediumSeverity > 0 && (
                <Box sx={{ 
                  position: 'absolute',
                  left: `${(highSeverity / count) * 100}%`,
                  top: 0,
                  height: '100%',
                  width: `${(mediumSeverity / count) * 100}%`,
                  background: `linear-gradient(90deg, ${theme.palette.warning.main}, ${theme.palette.warning.light})`
                }} />
              )}
              {lowSeverity > 0 && (
                <Box sx={{ 
                  position: 'absolute',
                  left: `${((highSeverity + mediumSeverity) / count) * 100}%`,
                  top: 0,
                  height: '100%',
                  width: `${(lowSeverity / count) * 100}%`,
                  background: `linear-gradient(90deg, ${theme.palette.info.main}, ${theme.palette.info.light})`,
                  borderRadius: '0 4px 4px 0'
                }} />
              )}
            </Box>
            
            {/* Чипы с количеством */}
            <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
              {highSeverity > 0 && (
                <Chip 
                  label={`${highSeverity} крит.`} 
                  size="small" 
                  sx={{ 
                    bgcolor: alpha(theme.palette.error.main, 0.1),
                    color: 'error.dark',
                    fontWeight: 600,
                    border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`
                  }}
                />
              )}
              {mediumSeverity > 0 && (
                <Chip 
                  label={`${mediumSeverity} сред.`} 
                  size="small" 
                  sx={{ 
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                    color: 'warning.dark',
                    fontWeight: 600,
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
                  }}
                />
              )}
              {lowSeverity > 0 && (
                <Chip 
                  label={`${lowSeverity} низ.`} 
                  size="small" 
                  sx={{ 
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                    color: 'info.dark',
                    fontWeight: 600,
                    border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                  }}
                />
              )}
            </Stack>
          </Box>
          
          {/* Индикатор автоисправления */}
          {autoFixableCount > 0 && (
            <Box sx={{ 
              p: 2, 
              bgcolor: alpha(theme.palette.success.main, 0.08), 
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
              display: 'flex',
              alignItems: 'center'
            }}>
              <AutoFixHighIcon sx={{ color: 'success.main', mr: 1, fontSize: 20 }} />
              <Typography variant="body2" color="success.dark" fontWeight={600}>
                {autoFixableCount} автоисправимых
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  // Компонент аналитических инсайтов
  const AnalyticsInsights = ({ issues, totalIssues, documentGrade }) => {
    const insights = useMemo(() => {
      const tips = [];
      
      // Анализ по типам ошибок
      if (issues.filter(i => i.type.startsWith('font')).length > 0) {
        tips.push({
          icon: <TextFormatIcon />,
          title: 'Форматирование шрифта',
          description: 'Обратите внимание на единообразие шрифтов в документе',
          severity: 'info'
        });
      }
      
      if (issues.filter(i => i.type.startsWith('margins')).length > 0) {
        tips.push({
          icon: <BorderStyleIcon />,
          title: 'Поля страницы',
          description: 'Проверьте соответствие полей требованиям ГОСТ',
          severity: 'warning'
        });
      }
      
      // Анализ автоисправимости
      const autoFixablePercent = Math.round((totalAutoFixableCount / totalIssues) * 100);
      if (autoFixablePercent > 70) {
        tips.push({
          icon: <BuildIcon />,
          title: 'Высокий потенциал автоисправления',
          description: `${autoFixablePercent}% ошибок можно исправить автоматически`,
          severity: 'success'
        });
      }
      
      // Рекомендации по оценке
      if (documentGrade.score >= 4) {
        tips.push({
          icon: <WorkspacePremiumIcon />,
          title: 'Отличное качество',
          description: 'Документ соответствует высоким стандартам оформления',
          severity: 'success'
        });
      } else if (documentGrade.score === 3) {
        tips.push({
          icon: <TipsAndUpdatesIcon />,
          title: 'Есть потенциал для улучшения',
          description: 'Исправление найденных ошибок повысит качество документа',
          severity: 'warning'
        });
      }
      
      return tips;
    }, [issues, totalIssues, documentGrade]);

    return (
      <Paper 
        elevation={0}
        sx={{ 
          p: 3,
          borderRadius: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.02)} 0%, ${alpha(theme.palette.primary.main, 0.01)} 100%)`,
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          mb: 4
        }}
      >
        <Typography variant="h6" fontWeight={700} sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
          <InsightsIcon sx={{ mr: 1, color: 'info.main' }} />
          Аналитические рекомендации
        </Typography>
        
        <Grid container spacing={2}>
          {insights.map((insight, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card 
                elevation={0}
                sx={{ 
                  p: 2,
                  height: '100%',
                  border: `1px solid ${alpha(theme.palette[insight.severity].main, 0.2)}`,
                  bgcolor: alpha(theme.palette[insight.severity].main, 0.05),
                  borderRadius: 2
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: `${insight.severity}.main`,
                      color: 'white',
                      mr: 2,
                      flexShrink: 0
                    }}
                  >
                    {insight.icon}
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
                      {insight.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {insight.description}
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    );
  };
  const handleGenerateReport = async () => {
    if (reportLoading) return;
    
    setReportLoading(true);
    setReportError(null);
    
    try {
      const response = await axios.post('http://localhost:5000/api/document/generate-report', {
        check_results: memoizedReportData.check_results,
        filename: memoizedFileName
      });
      
      if (response.data && response.data.success) {
        setReportSuccess(true);
        setReportFilePath(response.data.report_file_path);
      } else {
        setReportError('Не удалось сгенерировать отчет');
      }
    } catch (error) {
      console.error('Ошибка при генерации отчета:', error);
      setReportError(error.response?.data?.error || 'Ошибка при генерации отчета');
    } finally {
      setReportLoading(false);
    }
  };

  const downloadReport = (reportPath, reportName) => {
    if (!reportPath) return;
    
    // Формируем URL для скачивания
    const downloadUrl = `http://localhost:5000/api/document/download-report?path=${encodeURIComponent(reportPath)}&filename=${encodeURIComponent(reportName || 'report.docx')}`;
    
    // Открываем URL для скачивания
    window.open(downloadUrl, '_blank');
  };
  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.background.default, 1)} 50%, ${alpha(theme.palette.secondary.main, 0.01)} 100%)`,
      pb: 6
    }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Hero секция с заголовком */}
        <Paper 
          elevation={0}
          sx={{ 
            p: { xs: 3, md: 5 },
            mb: 4,
            borderRadius: 4,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.03)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Декоративные элементы фона */}
          <Box
            sx={{
              position: 'absolute',
              top: -100,
              right: -100,
              width: 300,
              height: 300,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 70%)`,
              zIndex: 0
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: -80,
              left: -80,
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.06)} 0%, transparent 70%)`,
              zIndex: 0
            }}
          />
          
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography
              variant="h3"
              component="h1"
              align="center"
              gutterBottom
              sx={{
                fontWeight: 900,
                mb: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: '0 4px 20px rgba(0,0,0,0.1)',
                fontSize: { xs: '2rem', md: '3rem' }
              }}
            >
              Анализ документа завершен
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2, gap: 1, flexWrap: 'wrap' }}>
              <ArticleIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="h6" align="center" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                {memoizedFileName}
              </Typography>
              {/* Индикатор текущего представления */}
              {memoizedReportData?.corrected_check_results && (
                <Chip 
                  label={viewMode === 'post' ? 'После автокоррекции' : 'До исправления'}
                  color={viewMode === 'post' ? 'success' : 'default'}
                  size="small"
                  icon={<AutoFixHighIcon />}
                  sx={{ ml: 1 }}
                />
              )}
            </Box>
            {/* Переключатель вида отчета (до/после) */}
            {memoizedReportData?.corrected_check_results && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <ToggleButtonGroup
                  color="primary"
                  value={viewMode}
                  exclusive
                  onChange={handleViewModeChange}
                  size="small"
                  sx={{ borderRadius: 2 }}
                >
                  <ToggleButton value="pre">До исправления</ToggleButton>
                  <ToggleButton value="post">После автокоррекции</ToggleButton>
                </ToggleButtonGroup>
              </Box>
            )}
            
            {/* Используем новый компонент статистики */}
            <DocumentStatistics 
              totalIssues={totalIssues}
              highSeverityCount={highSeverityCount}
              mediumSeverityCount={mediumSeverityCount}
              lowSeverityCount={lowSeverityCount}
              totalAutoFixableCount={totalAutoFixableCount}
              documentGrade={documentGrade}
            />
            
            {/* Кнопки действий */}
            <Box sx={{ 
              mt: 4, 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'center',
              gap: 2,
              alignItems: 'center'
            }}>
              <Button
                variant="contained"
                size="large"
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AutoFixHighIcon />}
                onClick={handleCorrection}
                disabled={loading || correctionSuccess || totalIssues === 0}
                sx={{ 
                  py: 1.5,
                  px: 4,
                  borderRadius: 3,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.4)}`
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                {loading ? 'Исправление...' : 'Автоматическое исправление'}
              </Button>
              
              <Button
                variant="outlined"
                size="large"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/check')}
                disabled={loading}
                sx={{ 
                  py: 1.5,
                  px: 4,
                  borderRadius: 3,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                Проверить другой документ
              </Button>
              
              <Button
                variant="text"
                size="large"
                startIcon={aiLoading ? <CircularProgress size={16} /> : <InsightsIcon />}
                onClick={handleAISuggestions}
                disabled={aiLoading}
                sx={{ 
                  py: 1.5,
                  px: 3,
                  borderRadius: 3,
                  fontWeight: 600
                }}
              >
                {aiLoading ? 'ИИ анализ...' : aiAvailable ? 'Обновить ИИ рекомендации' : 'Получить ИИ рекомендации'}
              </Button>

              <Button
                variant="text"
                startIcon={<InsightsIcon />}
                onClick={() => setShowInsights(!showInsights)}
                sx={{ 
                  py: 1.5,
                  px: 3,
                  borderRadius: 3,
                  fontWeight: 600
                }}
              >
                {showInsights ? 'Скрыть' : 'Показать'} аналитику
              </Button>
            </Box>
          </Box>
        </Paper>        
        {/* Аналитические инсайты */}
        {showInsights && (
          <AnalyticsInsights 
            issues={issues}
            totalIssues={totalIssues}
            documentGrade={documentGrade}
          />
        )}

        {/* ИИ рекомендации */}
        {(aiText || aiError || aiAvailable) && (
          <Paper 
            elevation={0}
            sx={{ 
              p: 3,
              mb: 4,
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
              background: alpha(theme.palette.background.paper, 0.8)
            }}
          >
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Рекомендации ИИ
            </Typography>
            {aiError ? (
              <Alert severity="warning">{aiError}</Alert>
            ) : aiText ? (
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {aiText}
              </Typography>
            ) : (
              <Alert severity="info">ИИ готов, нажмите «Получить ИИ рекомендации», чтобы загрузить свежий план.</Alert>
            )}
          </Paper>
        )}
        
        {/* Сообщения об исправлении */}
        {(correctionSuccess || memoizedReportData?.correction_success) && (
          <Alert 
            severity="success" 
            sx={{ 
              mb: 3, 
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
              bgcolor: alpha(theme.palette.success.main, 0.08)
            }}
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={() => downloadDocument(correctedFilePath || memoizedReportData?.corrected_file_path, memoizedFileName)}
                startIcon={<DownloadIcon />}
                sx={{ borderRadius: 2 }}
              >
                Скачать еще раз
              </Button>
            }
          >
            <AlertTitle sx={{ fontWeight: 700 }}>Документ успешно исправлен</AlertTitle>
            Автоматически исправлены все возможные ошибки. Если скачивание не началось, нажмите «Скачать еще раз».
          </Alert>
        )}
        
        {correctionError && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3, 
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
              bgcolor: alpha(theme.palette.error.main, 0.08)
            }}
          >
            <AlertTitle sx={{ fontWeight: 700 }}>Ошибка при исправлении</AlertTitle>
            {correctionError}
          </Alert>
        )}
        
        {/* Если документ идеален */}
        {totalIssues === 0 && (
          <Paper
            elevation={0}
            sx={{
              p: 5,
              mb: 4,
              borderRadius: 4,
              textAlign: 'center',
              background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.light, 0.05)} 100%)`,
              border: `2px solid ${alpha(theme.palette.success.main, 0.2)}`
            }}
          >
            <Box sx={{ mb: 3 }}>
              <CheckCircleOutlineIcon sx={{ fontSize: 100, color: 'success.main', mb: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} sx={{ color: '#FFD700', fontSize: 32 }} />
                ))}
              </Box>
            </Box>
            <Typography variant="h4" gutterBottom fontWeight={700} color="success.dark">
              Превосходно!
            </Typography>
            <Typography variant="h6" sx={{ mb: 3, color: 'text.secondary' }}>
              Ваш документ полностью соответствует требованиям нормоконтроля
            </Typography>
            <Button
              variant="contained"
              color="success"
              size="large"
              startIcon={<VerifiedIcon />}
              sx={{ borderRadius: 3, py: 1.5, px: 4 }}
            >
              Документ готов к сдаче
            </Button>
          </Paper>
        )}
        
        {/* Список найденных проблем с современными табами */}
        {totalIssues > 0 && (
          <Paper 
            elevation={0}
            sx={{ 
              borderRadius: 4,
              overflow: 'hidden',
              border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
              mb: 4,
              background: alpha(theme.palette.background.paper, 0.8)
            }}
          >
            <Box sx={{ 
              p: 3,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.03)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`,
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`
            }}>
              <Typography variant="h5" fontWeight={700} sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                <ScienceIcon sx={{ mr: 1, color: 'primary.main' }} />
                Детализация проблем
              </Typography>
              
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange} 
                sx={{ 
                  '& .MuiTabs-indicator': {
                    height: 4,
                    borderRadius: '2px 2px 0 0',
                    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                  },
                  '& .MuiTab-root': {
                    borderRadius: '12px 12px 0 0',
                    mr: 1,
                    transition: 'all 0.3s',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.04)
                    }
                  }
                }}
              >
                <Tab 
                  icon={<CategoryIcon />} 
                  label="По категориям" 
                  iconPosition="start"
                  sx={{ 
                    fontWeight: 600,
                    textTransform: 'none',
                    minHeight: 56,
                    fontSize: '1rem'
                  }} 
                />
                <Tab 
                  icon={<FormatListNumberedIcon />} 
                  label="Полный список" 
                  iconPosition="start"
                  sx={{ 
                    fontWeight: 600,
                    textTransform: 'none',
                    minHeight: 56,
                    fontSize: '1rem'
                  }} 
                />
              </Tabs>
            </Box>
            
            {/* Контент для таба "Категории" */}
            {tabValue === 0 && (
              <Box sx={{ p: 4 }}>
                <Grid container spacing={3}>
                  {Object.entries(groupedIssues).map(([category, categoryIssues], idx) => (
                    <Grid item xs={12} md={6} lg={4} key={category}>
                      <CategoryCard 
                        category={category} 
                        issues={issues}
                        count={categoryIssues.length}
                        icon={getCategoryIcon(category)}
                        index={idx}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
            
            {/* Контент для таба "Все проблемы" */}
            {tabValue === 1 && (
              <List disablePadding sx={{ maxHeight: 700, overflow: 'auto' }}>
                {Object.entries(groupedIssues).map(([category, categoryIssues], categoryIndex) => {
                  const grouped = groupIssues(categoryIssues);
                  const maxSeverity = grouped.some(i => i.severity === 'high')
                    ? 'error'
                    : grouped.some(i => i.severity === 'medium')
                    ? 'warning'
                    : 'info';
                  const severityLabel = maxSeverity === 'error' ? 'Критические' : maxSeverity === 'warning' ? 'Средние' : 'Незначительные';
                  
                  return (
                    <Accordion 
                      defaultExpanded={categoryIndex === 0} 
                      sx={{
                        borderLeft: `6px solid ${theme.palette[maxSeverity].main}`,
                        boxShadow: 'none',
                        mb: 1,
                        borderRadius: 0,
                        '&:before': { display: 'none' },
                        '&:not(:last-child)': {
                          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`
                        },
                        bgcolor: alpha(theme.palette[maxSeverity].main, 0.02)                      }} 
                      key={category}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{
                          minHeight: 72,
                          '&:hover': { 
                            bgcolor: alpha(theme.palette[maxSeverity].main, 0.06),
                            transform: 'translateY(-1px)',
                            boxShadow: `0 2px 8px ${alpha(theme.palette[maxSeverity].main, 0.15)}`
                          },
                          transition: 'all 0.2s ease-in-out',
                          borderRadius: '8px 8px 0 0'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: 3,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: `linear-gradient(135deg, ${theme.palette[maxSeverity].main}, ${theme.palette[maxSeverity].dark})`,
                              color: 'white',
                              mr: 3,
                              boxShadow: `0 4px 12px ${alpha(theme.palette[maxSeverity].main, 0.3)}`
                            }}
                          >
                            {getCategoryIcon(category)}
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', mb: 0.5 }}>
                              {getCategoryName(category)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {grouped.length} {pluralizeProblem(grouped.length)}
                            </Typography>
                          </Box>
                          <Chip
                            label={severityLabel}
                            color={maxSeverity}
                            sx={{ fontWeight: 600, mr: 2 }}
                          />
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails sx={{ p: 0 }}>
                        <List disablePadding>
                          {grouped.map((issue, index) => (                            <ListItem
                              key={`${category}-${index}`}
                              divider={index < grouped.length - 1}
                              sx={{
                                py: 3,
                                px: 4,
                                alignItems: 'flex-start',
                                '&:hover': { 
                                  bgcolor: alpha(theme.palette.primary.main, 0.03),
                                  transform: 'translateY(-1px)',
                                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`
                                },
                                transition: 'all 0.2s ease-in-out',
                                borderRadius: 1
                              }}
                            >
                              <ListItemIcon sx={{ mt: 0.5 }}>
                                {getSeverityIcon(issue.severity)}
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                                    <Typography component="span" variant="body1" fontWeight={600}>
                                      {issue.description}
                                    </Typography>
                                    {issue.count > 1 && (
                                      <Badge 
                                        badgeContent={issue.count} 
                                        color="primary"
                                        sx={{ ml: 1 }}
                                      />
                                    )}
                                    <Chip
                                      label={getSeverityText(issue.severity)}
                                      color={getSeverityColor(issue.severity)}
                                      size="small"
                                      sx={{ fontWeight: 600 }}
                                    />
                                    {issue.auto_fixable && (
                                      <Chip
                                        label="Автоисправимая"
                                        size="small"
                                        color="success"
                                        icon={<AutoFixHighIcon fontSize="small" />}
                                        sx={{ fontWeight: 600 }}
                                      />
                                    )}
                                  </Box>
                                }
                                secondary={
                                  <Typography variant="body2" color="text.secondary">
                                    {issue.locations && issue.locations.length > 1
                                      ? `Расположение: ${issue.locations.join(', ')}`
                                      : `Расположение: ${issue.location}`}
                                  </Typography>
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
              </List>
            )}
          </Paper>        )}

        {/* Панель действий с отчетами */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            background: alpha(theme.palette.background.paper, 0.6),
            mt: 4
          }}
        >
          <Typography variant="h6" fontWeight={700} sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
            <DescriptionIcon sx={{ mr: 1, color: 'secondary.main' }} />
            Экспорт отчетов
          </Typography>
          
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              startIcon={reportLoading ? <CircularProgress size={16} /> : <DescriptionIcon />}
              onClick={handleGenerateReport}
              disabled={reportLoading || totalIssues === 0}
              sx={{ 
                borderRadius: 3,
                py: 1.2,
                px: 3,
                fontWeight: 600,
                borderWidth: 2,
                '&:hover': { borderWidth: 2 }
              }}
            >
              {reportLoading ? 'Генерация...' : 'Создать DOCX отчет'}
            </Button>
            
            {reportSuccess && (
              <Button
                variant="contained"
                color="secondary"
                startIcon={<FileDownloadIcon />}
                onClick={() => downloadReport(reportFilePath, `отчет_${memoizedFileName}`)}
                sx={{ 
                  borderRadius: 3,
                  py: 1.2,
                  px: 3,
                  fontWeight: 600,
                  background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
                  boxShadow: `0 4px 16px ${alpha(theme.palette.secondary.main, 0.3)}`
                }}
              >
                Скачать отчет
              </Button>
            )}
          </Stack>

          {reportError && (
            <Alert 
              severity="error" 
              sx={{ 
                mt: 2, 
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
                bgcolor: alpha(theme.palette.error.main, 0.08)
              }}
            >
              <AlertTitle sx={{ fontWeight: 700 }}>Ошибка при генерации отчета</AlertTitle>
              {reportError}
            </Alert>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default ReportPage;