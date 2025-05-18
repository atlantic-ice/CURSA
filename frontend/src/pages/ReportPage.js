import React, { useState, useContext, useEffect } from 'react';
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
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Card,
  CardContent,
  Stack,
  LinearProgress,
  Fade,
  Tooltip,
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
import CheckIcon from '@mui/icons-material/Check';
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
import axios from 'axios';
import { CheckHistoryContext } from '../App';
import StructureAnalysisCard from '../components/StructureAnalysisCard';

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
  
  // Контекст для истории проверок
  const { addToHistory } = useContext(CheckHistoryContext);

  // Перенаправление, если нет данных
  useEffect(() => {
    if (!reportData) {
      navigate('/check');
    }
  }, [reportData, navigate]);

  // Сохраняем результат в истории при первичной загрузке страницы
  useEffect(() => {
    if (reportData && fileName) {
      addToHistory({
        id: Date.now().toString(),
        fileName,
        reportData,
        timestamp: Date.now(),
        correctedFilePath: correctedFilePath || reportData.corrected_file_path || null
      });
    }
  }, [reportData, fileName, addToHistory, correctedFilePath]);

  // Прокрутка вверх при загрузке страницы
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!reportData) {
    return null;
  }

  const issues = reportData.check_results?.issues || [];
  const totalIssues = reportData.check_results?.total_issues_count || 0;

  // Группировка проблем по типу и серьезности
  const groupedIssues = issues.reduce((groups, issue) => {
    const category = issue.type.split('_')[0];
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(issue);
    return groups;
  }, {});

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
      default: return category;
    }
  };

  // Обработка исправления ошибок
  const handleCorrection = async () => {
    setLoading(true);
    setCorrectionError('');
    setCorrectionSuccess(false);

    try {
      const response = await axios.post('http://localhost:5000/api/document/correct', {
        file_path: reportData.temp_path,
        errors: issues.filter(issue => issue.auto_fixable),
        original_filename: fileName
      });

      if (response.data.success) {
        setCorrectedFilePath(response.data.corrected_file_path);
        setCorrectionSuccess(true);
        
        // Обновить запись в истории, добавив путь исправленного файла
        addToHistory({
          id: Date.now().toString(),
          fileName,
          reportData: {
            ...reportData,
            corrected_file_path: response.data.corrected_file_path
          },
          timestamp: Date.now(),
          correctedFilePath: response.data.corrected_file_path
        });
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

  // Подготовка данных для отображения сводки
  const autoFixableCount = issues.filter(issue => issue.auto_fixable).length;
  const manualFixCount = totalIssues - autoFixableCount;
  const autoFixPercentage = totalIssues > 0 ? Math.round((autoFixableCount / totalIssues) * 100) : 0;

  // Подготовка статистики по серьезности
  const severityCounts = {
    high: issues.filter(issue => issue.severity === 'high').length,
    medium: issues.filter(issue => issue.severity === 'medium').length,
    low: issues.filter(issue => issue.severity === 'low').length,
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

  // Функция для определения общей оценки документа 
  const getDocumentGrade = (totalIssues, highSeverityCount) => {
    if (totalIssues === 0) return { label: 'Отлично', color: 'success', score: 'A+' };
    if (highSeverityCount === 0 && totalIssues < 5) return { label: 'Хорошо', color: 'success', score: 'A' };
    if (highSeverityCount === 0 && totalIssues < 10) return { label: 'Очень хорошо', color: 'success', score: 'B+' };
    if (highSeverityCount < 3 && totalIssues < 15) return { label: 'Удовлетворительно', color: 'warning', score: 'B' };
    if (highSeverityCount < 5 && totalIssues < 20) return { label: 'Требует доработки', color: 'warning', score: 'C' };
    return { label: 'Требуется значительная доработка', color: 'error', score: 'D' };
  };

  // Добавим компонент карточки категории проблем
  const CategoryCard = ({ category, issues, count, icon }) => {
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
    
    return (
      <Card sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'all 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 20px rgba(0,0,0,0.1)'
        }
      }}>
        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
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
            <Typography variant="h6" component="div" fontWeight={600}>
              {getCategoryName(category)}
            </Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {count} {count === 1 ? 'проблема' : count > 1 && count < 5 ? 'проблемы' : 'проблем'}
          </Typography>
          
          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
            {highSeverity > 0 && (
              <Chip 
                label={`${highSeverity} крит.`} 
                size="small" 
                color="error" 
                variant="outlined"
                icon={<ErrorOutlineIcon />}
              />
            )}
            {mediumSeverity > 0 && (
              <Chip 
                label={`${mediumSeverity} сред.`} 
                size="small" 
                color="warning" 
                variant="outlined" 
                icon={<WarningAmberIcon />}
              />
            )}
            {lowSeverity > 0 && (
              <Chip 
                label={`${lowSeverity} низ.`} 
                size="small" 
                color="info" 
                variant="outlined"
                icon={<InfoIcon />}
              />
            )}
          </Stack>
        </CardContent>
      </Card>
    );
  };

  // Получаем данные для общей статистики
  const statistics = reportData.check_results?.statistics || {};
  const highSeverityCount = statistics.severity?.high || 0;
  const mediumSeverityCount = statistics.severity?.medium || 0;
  const lowSeverityCount = statistics.severity?.low || 0;
  const totalAutoFixableCount = statistics.auto_fixable_count || 0;

  // Определяем общую оценку документа
  const documentGrade = getDocumentGrade(totalIssues, highSeverityCount);

  // В компоненте ReportPage добавим функцию загрузки отчета
  const handleGenerateReport = async () => {
    if (reportLoading) return;
    
    setReportLoading(true);
    setReportError(null);
    
    try {
      const response = await axios.post('/api/document/generate-report', {
        check_results: reportData.check_results,
        filename: fileName
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
          p: 4,
          mb: 4,
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight={700}>
            Отчет о проверке документа
          </Typography>
          
          <Typography variant="h6" sx={{ mb: 3, color: 'text.secondary' }}>
            {fileName}
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1">
                  Обнаружено проблем: <strong>{totalIssues}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Автоматически исправляемых: <strong>{totalAutoFixableCount}</strong> ({Math.round(totalAutoFixableCount / totalIssues * 100) || 0}%)
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                <Chip 
                  icon={<ErrorOutlineIcon />} 
                  label={`Критических: ${highSeverityCount}`} 
                  color="error" 
                  variant={highSeverityCount > 0 ? "filled" : "outlined"}
                  sx={{ fontWeight: 500 }}
                />
                <Chip 
                  icon={<WarningAmberIcon />} 
                  label={`Средних: ${mediumSeverityCount}`} 
                  color="warning"
                  variant={mediumSeverityCount > 0 ? "filled" : "outlined"}
                  sx={{ fontWeight: 500 }}
                />
                <Chip 
                  icon={<InfoIcon />} 
                  label={`Незначительных: ${lowSeverityCount}`} 
                  color="info"
                  variant={lowSeverityCount > 0 ? "filled" : "outlined"}
                  sx={{ fontWeight: 500 }}
                />
              </Box>
              
              <Button
                variant="contained"
                size="large"
                startIcon={<AutoFixHighIcon />}
                onClick={handleCorrection}
                disabled={loading || correctionSuccess || totalIssues === 0}
                sx={{ mr: 2 }}
              >
                {loading ? 'Исправление...' : 'Исправить все возможные ошибки'}
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/check')}
                disabled={loading}
              >
                Проверить другой документ
              </Button>
            </Grid>
            
            <Grid item xs={12} md={5}>
              <Box 
                sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  p: 2
                }}
              >
                <Box 
                  sx={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: `${documentGrade.color}.lighter`,
                    border: 3,
                    borderColor: `${documentGrade.color}.main`,
                    position: 'relative'
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
        </Box>
      </Paper>
      
      {/* Секция с категориями проблем */}
      {totalIssues > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom fontWeight={600}>
            Категории проблем
          </Typography>
          
          <Grid container spacing={3}>
            {Object.entries(groupedIssues).map(([category, categoryIssues]) => (
              <Grid item xs={12} sm={6} md={4} key={category}>
                <CategoryCard 
                  category={category} 
                  issues={issues}
                  count={categoryIssues.length}
                  icon={getCategoryIcon(category)}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
      
      {/* Сообщения об исправлении */}
      {correctionSuccess && (
        <Fade in={true}>
          <Alert 
            severity="success" 
            sx={{ mb: 3 }}
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={() => downloadDocument(correctedFilePath, fileName)}
                startIcon={<DownloadIcon />}
              >
                Скачать
              </Button>
            }
          >
            <AlertTitle>Документ успешно исправлен</AlertTitle>
            Автоматически исправлены все возможные ошибки. Скачайте исправленную версию документа.
          </Alert>
        </Fade>
      )}
      
      {correctionError && (
        <Alert severity="error" sx={{ mb: 3 }}>
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
            borderColor: 'success.main',
            bgcolor: 'success.lighter',
            textAlign: 'center'
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
      
      {/* Список найденных проблем */}
      {totalIssues > 0 && (
        <Paper 
          elevation={0}
          sx={{ 
            borderRadius: 4,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box sx={{ px: 3, py: 2, bgcolor: 'background.subtle' }}>
            <Typography variant="h5" fontWeight={600}>
              Обнаруженные проблемы
            </Typography>
          </Box>
          
          <Divider />
          
          <List disablePadding>
            {Object.entries(groupedIssues).map(([category, categoryIssues]) => {
              // Определяем максимальную серьёзность в категории
              const maxSeverity = categoryIssues.some(i => i.severity === 'high')
                ? 'error'
                : categoryIssues.some(i => i.severity === 'medium')
                ? 'warning'
                : 'info';
              const severityLabel = maxSeverity === 'error' ? 'Критические' : maxSeverity === 'warning' ? 'Средние' : 'Незначительные';
              const severityColor = maxSeverity;
              return (
                <React.Fragment key={category}>
                  <Accordion defaultExpanded TransitionProps={{ unmountOnExit: true }} sx={{
                    borderLeft: '6px solid',
                    borderLeftColor: maxSeverity === 'error' ? 'error.main' : maxSeverity === 'warning' ? 'warning.main' : 'info.main',
                    boxShadow: '0 2px 12px #0001',
                    mb: 1.5,
                    borderRadius: 2,
                    overflow: 'hidden',
                    '&:hover': { boxShadow: '0 4px 24px #1976d211' },
                  }}>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{
                        bgcolor: 'background.subtle',
                        '&:hover': { bgcolor: 'background.subtleHover' },
                        transition: 'background 0.3s',
                        minHeight: 64,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                        {getCategoryIcon(category)}
                        <Typography sx={{ ml: 2, fontWeight: 700, fontSize: 20 }}>
                          {getCategoryName(category)} <span style={{fontWeight:400}}>({categoryIssues.length})</span>
                        </Typography>
                        <Chip
                          label={severityLabel}
                          color={severityColor}
                          size="small"
                          sx={{ ml: 2, fontWeight: 600, fontSize: 16, letterSpacing: 0.5 }}
                        />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 0 }}>
                      <List disablePadding>
                        {categoryIssues.map((issue, index) => (
                          <Fade in timeout={400 + index * 80} key={`${category}-${index}`}>
                            <ListItem
                              divider={index < categoryIssues.length - 1}
                              sx={{
                                py: 2.2,
                                px: 3,
                                alignItems: 'flex-start',
                                '&:hover': { bgcolor: 'background.subtle' },
                                transition: 'background 0.2s',
                              }}
                            >
                              <ListItemIcon sx={{ mt: 0.5 }}>
                                {getSeverityIcon(issue.severity)}
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5, flexWrap: 'wrap' }}>
                                    <Typography component="span" variant="body1" fontWeight={600} sx={{ mr: 1 }}>
                                      {issue.description}
                                    </Typography>
                                    <Chip
                                      label={getSeverityText(issue.severity)}
                                      color={getSeverityColor(issue.severity)}
                                      size="small"
                                      sx={{ fontWeight: 600, fontSize: 14, mr: 1 }}
                                    />
                                    {issue.auto_fixable && (
                                      <Chip
                                        label="Исправляемая"
                                        size="small"
                                        color="success"
                                        icon={<AutoFixHighIcon />}
                                        sx={{ height: 24 }}
                                      />
                                    )}
                                  </Box>
                                }
                                secondary={
                                  <Typography variant="body2" color="text.secondary" component="span">
                                    Расположение: {issue.location}
                                  </Typography>
                                }
                              />
                            </ListItem>
                          </Fade>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                </React.Fragment>
              );
            })}
          </List>
        </Paper>
      )}
      
      {/* Структурный анализ документа */}
      {reportData.check_results && (
        <Box sx={{ mt: 4 }}>
          <StructureAnalysisCard documentData={reportData} />
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
        >
          {reportLoading ? 'Генерация...' : 'Сгенерировать DOCX отчет'}
        </Button>
        
        {reportSuccess && (
          <Button
            variant="contained"
            color="secondary"
            startIcon={<FileDownloadIcon />}
            onClick={() => downloadReport(reportFilePath, `отчет_${fileName}`)}
          >
            Скачать отчет
          </Button>
        )}
      </Box>

      {reportError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          <AlertTitle>Ошибка при генерации отчета</AlertTitle>
          {reportError}
        </Alert>
      )}
    </Container>
  );
};

export default ReportPage; 

// Добавить кастомные стили для WOW-эффекта
<style jsx global>{`
  .MuiAccordion-root {
    transition: box-shadow 0.3s, border-color 0.3s;
  }
`}</style> 