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
  Badge
} from '@mui/material';
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
import axios from 'axios';
import { CheckHistoryContext } from '../App';
import StructureAnalysisCard from '../components/StructureAnalysisCard';

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

// Компонент статистики документа
const DocumentStatistics = ({ totalIssues, highSeverityCount, mediumSeverityCount, lowSeverityCount, totalAutoFixableCount, documentGrade }) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={7}>
        <Box sx={{ 
          mb: 2, 
          p: 2, 
          borderRadius: 2, 
          bgcolor: 'background.paper', 
          boxShadow: 'inset 0 0 0 1px rgba(0, 0, 0, 0.05)' 
        }}>
          <Typography variant="body1" sx={{ mb: 1 }}>
            Обнаружено проблем: <strong>{totalIssues}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Автоматически исправляемых: <strong>{totalAutoFixableCount}</strong> ({Math.round(totalAutoFixableCount / totalIssues * 100) || 0}%)
          </Typography>
          
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
            <Box sx={{ 
              flex: 1, 
              height: 8, 
              borderRadius: 4, 
              bgcolor: 'grey.100', 
              position: 'relative',
              overflow: 'hidden',
              mr: 2
            }}>
              {highSeverityCount > 0 && (
                <Box sx={{ 
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '100%',
                  width: `${(highSeverityCount / totalIssues) * 100}%`,
                  bgcolor: 'error.main',
                  borderRadius: 'inherit'
                }} />
              )}
              {mediumSeverityCount > 0 && (
                <Box sx={{ 
                  position: 'absolute',
                  left: `${(highSeverityCount / totalIssues) * 100}%`,
                  top: 0,
                  height: '100%',
                  width: `${(mediumSeverityCount / totalIssues) * 100}%`,
                  bgcolor: 'warning.main',
                  borderRadius: 'inherit'
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
                  borderRadius: 'inherit'
                }} />
              )}
            </Box>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
          <Chip 
            icon={<ErrorOutlineIcon />} 
            label={`Критических: ${highSeverityCount}`} 
            color="error" 
            variant={highSeverityCount > 0 ? "filled" : "outlined"}
            sx={{ fontWeight: 500 }}
            title="Критические ошибки требуют обязательного исправления"
          />
          <Chip 
            icon={<WarningAmberIcon />} 
            label={`Средних: ${mediumSeverityCount}`} 
            color="warning"
            variant={mediumSeverityCount > 0 ? "filled" : "outlined"}
            sx={{ fontWeight: 500 }}
            title="Средние ошибки рекомендуется исправить"
          />
          <Chip 
            icon={<InfoIcon />} 
            label={`Незначительных: ${lowSeverityCount}`} 
            color="info"
            variant={lowSeverityCount > 0 ? "filled" : "outlined"}
            sx={{ fontWeight: 500 }}
            title="Незначительные ошибки можно оставить на ваше усмотрение"
          />
        </Box>
      </Grid>
      
      <Grid item xs={12} md={5}>
        <Box 
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            p: 2,
            backgroundColor: theme => `${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'}`,
            borderRadius: 3
          }}
        >
          <Box 
            sx={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: `${documentGrade.color}.lighter`,
              border: 3,
              borderColor: `${documentGrade.color}.main`,
              position: 'relative',
              boxShadow: `0 8px 24px ${documentGrade.color}.main`
            }}
          >
            <Typography 
              variant="h2" 
              component="div"
              sx={{ fontWeight: 700, color: `${documentGrade.color}.dark` }}
            >
              {documentGrade.score}
            </Typography>
          </Box>
          <Box sx={{ ml: 3 }}>
            <Typography variant="h6" fontWeight={600}>
              Общая оценка
            </Typography>
            <Typography 
              variant="h5" 
              color={`${documentGrade.color}.main`}
              fontWeight={700}
            >
              {documentGrade.label}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {totalIssues === 0 
                ? 'Документ полностью соответствует требованиям!' 
                : `Обнаружено ${totalIssues} ${totalIssues === 1 ? 'несоответствие' : totalIssues > 1 && totalIssues < 5 ? 'несоответствия' : 'несоответствий'}`}
            </Typography>
          </Box>
        </Box>
      </Grid>
    </Grid>
  );
};

const ReportPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
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
  
  // Контекст для истории проверок
  const { addToHistory } = useContext(CheckHistoryContext);

  // Мемоизируем входные данные
  const memoizedReportData = useMemo(() => reportData || {}, [reportData]);
  const memoizedFileName = useMemo(() => fileName || '', [fileName]);

  // Мемоизируем issues и статистику
  const issues = useMemo(() => 
    memoizedReportData.check_results?.issues || [], 
    [memoizedReportData]
  );
  const totalIssues = useMemo(() => 
    memoizedReportData.check_results?.total_issues_count || 0, 
    [memoizedReportData]
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
    memoizedReportData.check_results?.statistics || {}, 
    [memoizedReportData]
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

  // Улучшенный компонент карточки категории
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
        alignItems: 'stretch',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        borderRadius: 3,
        borderTop: '4px solid',
        borderColor: `${severity}.main`,
        p: 2,
        mb: 2,
        '&:hover': {
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)'
        }
      }}>
        <CardContent sx={{ flexGrow: 1, p: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: `${severity}.lighter`,
                color: `${severity}.main`,
                mr: 2
              }}
            >
              {icon}
            </Box>
            <Typography variant="h6" component="div" fontWeight={700} sx={{ color: `${severity}.dark` }}>
              {getCategoryName(category)}
            </Typography>
          </Box>

          <Box sx={{ mb: 2, px: 0.5 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 0.5, display: 'flex', justifyContent: 'space-between' }}>
              <span>{count} {pluralizeProblem(count)}</span>
              {autoFixableCount > 0 && (
                <Chip 
                  size="small" 
                  icon={<AutoFixHighIcon fontSize="small" />} 
                  label={`${autoFixableCount} авто`} 
                  color="success" 
                  sx={{ height: 22, '& .MuiChip-label': { px: 1 } }}
                  title="Автоматически исправляемых проблем"
                />
              )}
            </Typography>
            <Box sx={{ 
              height: 6, 
              borderRadius: 3, 
              bgcolor: 'grey.100', 
              position: 'relative',
              overflow: 'hidden'
            }}>
              {highSeverity > 0 && (
                <Box sx={{ 
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '100%',
                  width: `${(highSeverity / count) * 100}%`,
                  bgcolor: 'error.main',
                  borderRadius: 'inherit'
                }} />
              )}
              {mediumSeverity > 0 && (
                <Box sx={{ 
                  position: 'absolute',
                  left: `${(highSeverity / count) * 100}%`,
                  top: 0,
                  height: '100%',
                  width: `${(mediumSeverity / count) * 100}%`,
                  bgcolor: 'warning.main',
                  borderRadius: 'inherit'
                }} />
              )}
              {lowSeverity > 0 && (
                <Box sx={{ 
                  position: 'absolute',
                  left: `${((highSeverity + mediumSeverity) / count) * 100}%`,
                  top: 0,
                  height: '100%',
                  width: `${(lowSeverity / count) * 100}%`,
                  bgcolor: 'info.main',
                  borderRadius: 'inherit'
                }} />
              )}
            </Box>
          </Box>
          <Stack direction="row" spacing={1} sx={{ mb: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
            {highSeverity > 0 && (
              <Chip 
                label={`${highSeverity} крит.`} 
                size="small" 
                color="error" 
                variant="outlined"
                icon={<ErrorOutlineIcon fontSize="small" />}
                sx={{ height: 22, '& .MuiChip-label': { px: 1 } }}
                title="Критические ошибки"
              />
            )}
            {mediumSeverity > 0 && (
              <Chip 
                label={`${mediumSeverity} сред.`} 
                size="small" 
                color="warning" 
                variant="outlined" 
                icon={<WarningAmberIcon fontSize="small" />}
                sx={{ height: 22, '& .MuiChip-label': { px: 1 } }}
                title="Средние ошибки"
              />
            )}
            {lowSeverity > 0 && (
              <Chip 
                label={`${lowSeverity} низ.`} 
                size="small" 
                color="info" 
                variant="outlined"
                icon={<InfoIcon fontSize="small" />}
                sx={{ height: 22, '& .MuiChip-label': { px: 1 } }}
                title="Незначительные ошибки"
              />
            )}
          </Stack>
        </CardContent>
      </Card>
    );
  };

  // В компоненте ReportPage добавим функцию загрузки отчета
  const handleGenerateReport = async () => {
    if (reportLoading) return;
    
    setReportLoading(true);
    setReportError(null);
    
    try {
      const response = await axios.post('/api/document/generate-report', {
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
    const downloadUrl = `/api/document/download-report?path=${encodeURIComponent(reportPath)}&filename=${encodeURIComponent(reportName || 'report.docx')}`;
    
    // Открываем URL для скачивания
    window.open(downloadUrl, '_blank');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Секция заголовка и общей информации */}
      <Paper 
        elevation={0}
        sx={{ 
          p: { xs: 2, md: 4 },
          mb: 4,
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          background: theme => `linear-gradient(to bottom, ${theme.palette.background.paper}, ${theme.palette.background.default})`,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography
            variant="h4"
            component="h1"
            align="center"
            gutterBottom
            sx={{
              fontWeight: 800,
              mb: 1,
              background: theme => theme.palette.mode === 'dark'
                ? 'linear-gradient(90deg, #60a5fa 0%, #a78bfa 100%)'
                : 'linear-gradient(90deg, #2563eb 0%, #4f46e5 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textFillColor: 'transparent',
              textShadow: theme => theme.palette.mode === 'dark'
                ? '0 2px 16px #6366f1cc'
                : '0 2px 8px #2563eb33',
            }}
          >
            Отчет о проверке документа
          </Typography>
          
          <Typography variant="subtitle1" align="center" sx={{ mb: 3, color: 'text.secondary', fontWeight: 500 }}>
            {memoizedFileName}
          </Typography>
          
          {/* Используем компонент статистики */}
          <DocumentStatistics 
            totalIssues={totalIssues}
            highSeverityCount={highSeverityCount}
            mediumSeverityCount={mediumSeverityCount}
            lowSeverityCount={lowSeverityCount}
            totalAutoFixableCount={totalAutoFixableCount}
            documentGrade={documentGrade}
          />
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<AutoFixHighIcon />}
              onClick={handleCorrection}
              disabled={loading || correctionSuccess || totalIssues === 0}
              sx={{ 
                mr: 2,
                py: 1.2,
                px: 3,
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
              }}
            >
              {loading ? 'Исправление...' : 'Исправить все возможные ошибки'}
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/check')}
              disabled={loading}
              sx={{ borderRadius: 2 }}
            >
              Проверить другой документ
            </Button>
          </Box>
        </Box>
      </Paper>
      
      {/* Сообщения об исправлении */}
      {correctionSuccess && (
        <div>
          <Alert 
            severity="success" 
            sx={{ 
              mb: 3, 
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(0, 200, 83, 0.15)'
            }}
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={() => downloadDocument(correctedFilePath, memoizedFileName)}
                startIcon={<DownloadIcon />}
                sx={{ borderRadius: 2 }}
              >
                Скачать еще раз
              </Button>
            }
          >
            <AlertTitle>Документ успешно исправлен</AlertTitle>
            Автоматически исправлены все возможные ошибки. Скачивание документа началось автоматически.
          </Alert>
        </div>
      )}
      
      {correctionError && (
        <Alert severity="error" sx={{ 
          mb: 3, 
          borderRadius: 2,
          boxShadow: '0 4px 12px rgba(244, 67, 54, 0.15)'
        }}>
          <AlertTitle>Ошибка при исправлении</AlertTitle>
          {correctionError}
        </Alert>
      )}
      
      {/* Если документ идеален */}
      {totalIssues === 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            mb: 4,
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'success.light',
            bgcolor: 'success.lighter',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0, 200, 83, 0.15)'
          }}
        >
          <CheckCircleOutlineIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom fontWeight={600}>
            Отличная работа!
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Ваш документ полностью соответствует требованиям нормоконтроля.
          </Typography>
        </Paper>
      )}
      
      {/* Список найденных проблем с табами */}
      {totalIssues > 0 && (
        <Paper 
          elevation={0}
          sx={{ 
            borderRadius: 4,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            mb: 4,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
          }}
        >
          <Box sx={{ 
            px: 3, 
            py: 2, 
            bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}>
            <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>
              Обнаруженные проблемы
            </Typography>
            
            {/* Добавление табов */}
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              sx={{ 
                mb: -1.5,
                '& .MuiTabs-indicator': {
                  height: 3,
                  borderRadius: '3px 3px 0 0'
                }
              }}
            >
              <Tab 
                icon={<CategoryIcon sx={{ mr: 1 }} />} 
                label="Категории" 
                iconPosition="start"
                sx={{ 
                  fontWeight: 600,
                  textTransform: 'none',
                  minHeight: 48
                }} 
              />
              <Tab 
                icon={<FormatListNumberedIcon sx={{ mr: 1 }} />} 
                label="Все проблемы" 
                iconPosition="start"
                sx={{ 
                  fontWeight: 600,
                  textTransform: 'none',
                  minHeight: 48
                }} 
              />
            </Tabs>
          </Box>
          
          {/* Контент для таба "Категории" */}
          {tabValue === 0 && (
            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                {Object.entries(groupedIssues).map(([category, categoryIssues], idx) => (
                  <Grid item xs={12} sm={6} md={4} key={category}>
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
            <List disablePadding sx={{ maxHeight: 600, overflow: 'auto' }}>
              {Object.entries(groupedIssues).map(([category, categoryIssues], categoryIndex) => {
                // Группируем внутри категории
                const grouped = groupIssues(categoryIssues);
                // Определяем максимальную серьёзность в категории
                const maxSeverity = grouped.some(i => i.severity === 'high')
                  ? 'error'
                  : grouped.some(i => i.severity === 'medium')
                  ? 'warning'
                  : 'info';
                const severityLabel = maxSeverity === 'error' ? 'Критические' : maxSeverity === 'warning' ? 'Средние' : 'Незначительные';
                const severityColor = maxSeverity;
                return (
                  <Accordion defaultExpanded={categoryIndex === 0} sx={{
                    borderLeft: '6px solid',
                    borderLeftColor: maxSeverity === 'error' ? 'error.main' : maxSeverity === 'warning' ? 'warning.main' : 'info.main',
                    boxShadow: 'none',
                    mb: 0.5,
                    borderRadius: 0,
                    '&:before': {
                      display: 'none'
                    },
                    '&:not(:last-child)': {
                      borderBottom: '1px solid',
                      borderColor: 'divider'
                    }
                  }} key={category}>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{
                        bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
                        '&:hover': { bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' },
                        minHeight: 64,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: `${maxSeverity}.lighter`,
                            color: `${maxSeverity}.dark`,
                            mr: 2
                          }}
                        >
                          {getCategoryIcon(category)}
                        </Box>
                        <Typography sx={{ fontWeight: 700, fontSize: 18 }}>
                          {getCategoryName(category)} <span style={{fontWeight:400, opacity: 0.7}}>({grouped.length})</span>
                        </Typography>
                        <Chip
                          label={severityLabel}
                          color={severityColor}
                          size="small"
                          sx={{ ml: 2, fontWeight: 600, fontSize: 14, letterSpacing: 0.5 }}
                        />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 0 }}>
                      <List disablePadding>
                        {grouped.map((issue, index) => (
                          <ListItem
                            key={`${category}-${index}`}
                            divider={index < grouped.length - 1}
                            sx={{
                              py: 2.2,
                              px: 3,
                              alignItems: 'flex-start',
                              '&:hover': { bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.01)' },
                            }}
                          >
                            <ListItemIcon sx={{ mt: 0.5 }}>
                              {getSeverityIcon(issue.severity)}
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5, flexWrap: 'wrap' }}>
                                  <Typography component="span" variant="body1" fontWeight={600} sx={{ mr: 1 }}>
                                    {issue.description} {issue.count > 1 && (
                                      <Chip 
                                        label={`${issue.count}`} 
                                        size="small" 
                                        color="default" 
                                        variant="filled"
                                        sx={{ height: 20, fontWeight: 700, ml: 0.5, fontSize: 12 }}
                                      />
                                    )}
                                  </Typography>
                                  <Chip
                                    label={getSeverityText(issue.severity)}
                                    color={getSeverityColor(issue.severity)}
                                    size="small"
                                    sx={{ fontWeight: 600, fontSize: 14, mr: 1, height: 24 }}
                                  />
                                  {issue.auto_fixable && (
                                    <Chip
                                      label="Исправляемая"
                                      size="small"
                                      color="success"
                                      icon={<AutoFixHighIcon fontSize="small" />}
                                      sx={{ height: 24, fontSize: 14 }}
                                      title="Эта проблема может быть исправлена автоматически"
                                    />
                                  )}
                                </Box>
                              }
                              secondary={
                                <Typography variant="body2" color="text.secondary" component="span">
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
        </Paper>
      )}
      
      {/* Структурный анализ документа */}
      {memoizedReportData.check_results && (
        <Box sx={{ mt: 4 }}>
          <StructureAnalysisCard documentData={memoizedReportData} />
        </Box>
      )}

      {/* Добавим в UI после кнопок с исправлениями */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2,
        justifyContent: 'flex-end',
        mt: 3
      }}>
        <Button
          variant="outlined"
          startIcon={<DescriptionIcon />}
          onClick={handleGenerateReport}
          disabled={reportLoading || totalIssues === 0}
          sx={{ borderRadius: 2 }}
        >
          {reportLoading ? 'Генерация...' : 'Сгенерировать DOCX отчет'}
        </Button>
        
        {reportSuccess && (
          <Button
            variant="contained"
            color="secondary"
            startIcon={<FileDownloadIcon />}
            onClick={() => downloadReport(reportFilePath, `отчет_${memoizedFileName}`)}
            sx={{ 
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(156, 39, 176, 0.2)'
            }}
          >
            Скачать отчет
          </Button>
        )}
      </Box>

      {reportError && (
        <Alert severity="error" sx={{ 
          mt: 2, 
          borderRadius: 2,
          boxShadow: '0 4px 12px rgba(244, 67, 54, 0.15)'
        }}>
          <AlertTitle>Ошибка при генерации отчета</AlertTitle>
          {reportError}
        </Alert>
      )}
    </Container>
  );
};

export default ReportPage; 

// Упрощенные стили для повышения производительности
<style jsx global>{`
  .MuiAccordion-root {
    transition: box-shadow 0.2s;
  }
`}</style> 