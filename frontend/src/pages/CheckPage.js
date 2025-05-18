import React, { useState, useCallback, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Container, 
  CircularProgress,
  Alert,
  AlertTitle,
  Fade,
  Step,
  StepLabel,
  Stepper,
  useTheme,
  Backdrop,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  Grid,
  Divider,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import DescriptionIcon from '@mui/icons-material/Description';
import TextFormatIcon from '@mui/icons-material/TextFormat';
import BorderStyleIcon from '@mui/icons-material/BorderStyle';
import FormatLineSpacingIcon from '@mui/icons-material/FormatLineSpacing';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import DownloadIcon from '@mui/icons-material/Download';
import SettingsIcon from '@mui/icons-material/Settings';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { CheckHistoryContext } from '../App';
import axios from 'axios';
import { motion } from 'framer-motion';

const CheckPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [fileSize, setFileSize] = useState(0);
  const fileInputRef = useRef(null);
  const { history } = useContext(CheckHistoryContext);
  
  // Форматирование размера файла
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Байт';
    const k = 1024;
    const sizes = ['Байт', 'КБ', 'МБ', 'ГБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Настройка dropzone
  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      setFileSize(formatFileSize(selectedFile.size));
      setError('');
      setActiveStep(1); // Переход на следующий шаг
    }
  }, []);

  const onDropRejected = useCallback((fileRejections) => {
    const rejection = fileRejections[0];
    if (rejection) {
      if (rejection.errors.some(e => e.code === 'file-invalid-type')) {
        setError('Пожалуйста, загрузите файл в формате DOCX (Word Document)');
      } else if (rejection.errors.some(e => e.code === 'file-too-large')) {
        setError('Файл слишком большой. Максимальный размер - 10 МБ');
      } else {
        setError('Невозможно загрузить файл. Проверьте формат и размер файла.');
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    maxSize: 10485760, // 10 MB
    onDrop,
    onDropRejected
  });

  // Шаги в процессе загрузки
  const steps = [
    'Выбор файла', 
    'Проверка документа', 
    'Анализ результатов'
  ];

  // Функция для загрузки файла на сервер
  const handleUpload = async () => {
    if (!file) {
      setError('Пожалуйста, выберите файл');
      return;
    }

    setLoading(true);
    setError('');
    setActiveStep(2);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:5000/api/document/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // После успешной загрузки, переходим на страницу отчета с данными
      navigate('/report', { 
        state: { 
          reportData: response.data,
          fileName: file.name
        } 
      });
    } catch (error) {
      console.error('Ошибка при загрузке файла:', error);
      setError(
        error.response?.data?.error || 
        'Произошла ошибка при загрузке файла. Пожалуйста, попробуйте еще раз.'
      );
      setActiveStep(1);
    } finally {
      setLoading(false);
    }
  };

  // Сброс загрузки и возврат к выбору файла
  const handleReset = () => {
    setFile(null);
    setFileSize(0);
    setError('');
    setActiveStep(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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

  const dropzoneStyles = {
    base: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '64px 24px',
      borderWidth: 3,
      borderRadius: 24,
      borderStyle: 'dashed',
      background: theme => theme.palette.mode === 'dark'
        ? 'linear-gradient(120deg, #23272f 0%, #1a1d23 100%)'
        : 'linear-gradient(120deg, #f8fafc 0%, #e3eafc 100%)',
      color: theme => theme.palette.text.secondary,
      outline: 'none',
      transition: 'all .35s cubic-bezier(.4,2,.3,1)',
      cursor: 'pointer',
      minHeight: 320,
      textAlign: 'center',
      boxShadow: theme => theme.palette.mode === 'dark'
        ? '0 6px 32px rgba(37,99,235,0.13)'
        : '0 6px 32px rgba(37,99,235,0.07)',
      position: 'relative',
    },
    active: {
      borderColor: theme => theme.palette.primary.main,
      background: theme => theme.palette.mode === 'dark'
        ? 'linear-gradient(120deg, #26334d 0%, #1e293b 100%)'
        : 'linear-gradient(120deg, #e3f2fd 0%, #bbdefb 100%)',
      boxShadow: theme => theme.palette.mode === 'dark'
        ? '0 0 0 6px #2563eb44, 0 8px 32px #2563eb55'
        : '0 0 0 6px #2563eb22, 0 8px 32px #2563eb33',
    },
    reject: {
      borderColor: theme => theme.palette.error.main,
      background: theme => theme.palette.mode === 'dark'
        ? 'linear-gradient(120deg, #3a2323 0%, #2d1a1a 100%)'
        : 'linear-gradient(120deg, #ffebee 0%, #ffcdd2 100%)',
      boxShadow: theme => theme.palette.mode === 'dark'
        ? '0 0 0 6px #ff174455, 0 8px 32px #ff174466'
        : '0 0 0 6px #ff174422, 0 8px 32px #ff174433',
    },
    disabled: {
      opacity: 0.6,
      pointerEvents: 'none'
    }
  };

  return (
    <>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress color="inherit" sx={{ mb: 2 }} />
          <Typography variant="h6" component="div" color="white">
            Анализируем документ...
          </Typography>
          <Typography variant="body2" color="white" sx={{ mt: 1, opacity: 0.8 }}>
            Это может занять несколько секунд в зависимости от размера документа
          </Typography>
        </Box>
      </Backdrop>
      
      {/* WOW-шапка */}
      <Box sx={{
        position: 'relative',
        overflow: 'hidden',
        bgcolor: theme.palette.mode === 'dark'
          ? 'linear-gradient(120deg, #23272f 0%, #1a1d23 100%)'
          : 'linear-gradient(120deg, #f8fafc 0%, #e3eafc 100%)',
        pt: { xs: 7, md: 10 },
        pb: { xs: 5, md: 7 },
        mb: 4,
        borderRadius: { xs: 0, md: 6 },
      }}>
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <CloudUploadIcon sx={{ fontSize: { xs: 36, md: 48 }, color: 'primary.main', filter: 'drop-shadow(0 2px 16px #2563eb33)' }} />
              <Typography
                variant="h3"
                component="h1"
                sx={{
                  fontWeight: 900,
                  letterSpacing: 1.5,
                  fontSize: { xs: 28, md: 40 },
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(90deg,#6366f1,#2563eb 60%,#6366f1)'
                    : 'linear-gradient(90deg,#2563eb,#60a5fa 60%,#6366f1)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: theme.palette.mode === 'dark'
                    ? '0 2px 16px #6366f1cc'
                    : '0 2px 8px #2563eb33',
                }}
              >
                Проверка курсовой работы
              </Typography>
            </Box>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{
                maxWidth: 700,
                mx: 'auto',
                mb: 1,
                fontWeight: 500,
                fontSize: { xs: 16, md: 20 },
                opacity: 0.92,
              }}
            >
              Загрузите файл DOCX для проверки на соответствие требованиям нормоконтроля и получите подробный отчёт с возможностью автоматического исправления ошибок
            </Typography>
          </motion.div>
        </Container>
      </Box>
      
      <Container maxWidth="lg">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Box sx={{ 
            mt: 4, 
            mb: 4, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            width: '100%'
          }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              width: '100%',
              mb: 2
            }}>
              <Typography 
                variant="h4" 
                component="h1" 
                gutterBottom
                sx={{ fontWeight: 700, mb: 0 }}
              >
                Проверка курсовой работы
              </Typography>
              
              <Tooltip title="Администрирование">
                <IconButton 
                  color="primary" 
                  onClick={() => navigate('/admin')}
                  sx={{ ml: 'auto' }}
                >
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
            </Box>
            
            <Typography 
              variant="subtitle1" 
              color="text.secondary" 
              align="center" 
              sx={{ maxWidth: 700, mb: 5 }}
            >
              Загрузите файл DOCX для проверки на соответствие требованиям нормоконтроля 
              и получите подробный отчет с возможностью автоматического исправления ошибок
            </Typography>
            
            {/* Progress Steps */}
            <Box sx={{ width: '100%', mb: 5 }}>
              <Stepper activeStep={activeStep} alternativeLabel sx={{ width: '100%' }}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>
          </Box>

          {error && (
            <Fade in={!!error}>
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3, 
                  boxShadow: '0 2px 10px rgba(244, 67, 54, 0.1)', 
                  borderRadius: 2,
                  width: '100%'
                }}
              >
                <AlertTitle>Ошибка</AlertTitle>
                {error}
              </Alert>
            </Fade>
          )}

          <Grid container spacing={4} sx={{ width: '100%' }}>
            <Grid item xs={12} md={8} sx={{ width: '100%' }}>
              <Paper 
                elevation={0}
                sx={{
                  p: 4,
                  borderRadius: 3,
                  width: '100%',
                  backgroundColor: isDragReject 
                    ? theme.palette.mode === 'light' 
                      ? 'rgba(244, 67, 54, 0.03)' 
                      : 'rgba(244, 67, 54, 0.13)'
                    : theme.palette.background.paper,
                  border: isDragReject 
                    ? `2px dashed ${theme.palette.error.main}`
                    : isDragActive 
                      ? `2px dashed ${theme.palette.primary.main}`
                      : file 
                        ? `2px solid ${theme.palette.success.main}`
                        : `2px dashed ${theme.palette.divider}`,
                  transition: 'all 0.3s ease',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 2px 10px rgba(0,0,0,0.18)'
                    : '0 2px 10px rgba(0,0,0,0.05)'
                }}
              >
                {activeStep === 0 ? (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 4,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 4,
                      mb: 4
                    }}
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                      whileHover={{ scale: 1.015, boxShadow: '0 0 0 4px #2563eb33, 0 8px 32px #2563eb22' }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Box
                        {...getRootProps()}
                        sx={{
                          ...dropzoneStyles.base,
                          ...(isDragActive ? dropzoneStyles.active : {}),
                          ...(isDragReject ? dropzoneStyles.reject : {}),
                          ...(loading ? dropzoneStyles.disabled : {}),
                          position: 'relative',
                          overflow: 'hidden',
                          '&:hover .chooseFileBtn': { opacity: 1, transform: 'translateY(0)' },
                        }}
                      >
                        <input {...getInputProps()} ref={fileInputRef} />
                        {/* Анимированный фон при перетаскивании */}
                        {isDragActive && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              background: 'linear-gradient(120deg, #e3f2fd 0%, #bbdefb 100%)',
                              zIndex: 0,
                              animation: 'pulseGlow 2s infinite',
                            }}
                          />
                        )}
                        <Box sx={{ position: 'relative', zIndex: 1 }}>
                          <CloudUploadIcon
                            sx={{
                              fontSize: isDragActive ? 110 : 90,
                              mb: 2,
                              color: isDragActive ? 'primary.main' : isDragReject ? 'error.main' : 'text.secondary',
                              animation: isDragActive ? 'bounce 1s infinite' : 'none',
                              transition: 'all 0.3s cubic-bezier(.4,2,.3,1)',
                              filter: isDragActive ? 'drop-shadow(0 0 16px #2563eb66)' : 'none',
                            }}
                          />
                          <Typography variant="h5" component="h3" gutterBottom fontWeight={700} sx={{ letterSpacing: 0.5 }}>
                            {isDragActive
                              ? 'Отпустите файл для загрузки'
                              : isDragReject
                              ? 'Этот формат файла не поддерживается'
                              : 'Перетащите сюда свою курсовую работу'}
                          </Typography>
                          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto', fontSize: 18, opacity: 0.85 }}>
                            Только DOCX • до 10 МБ
                          </Typography>
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: { xs: 'column', sm: 'row' },
                              gap: 2,
                              justifyContent: 'center',
                              alignItems: 'center',
                              mt: 2,
                            }}
                          >
                            <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }}>
                              <Button
                                variant="contained"
                                className="chooseFileBtn"
                                sx={{
                                  px: 5,
                                  py: 1.5,
                                  fontWeight: 600,
                                  fontSize: 18,
                                  borderRadius: 3,
                                  boxShadow: theme => theme.palette.mode === 'dark'
                                    ? '0 2px 8px #2563eb44'
                                    : '0 2px 8px #2563eb22',
                                  background: theme => theme.palette.mode === 'dark'
                                    ? 'linear-gradient(90deg, #1e293b 0%, #2563eb 100%)'
                                    : undefined,
                                  color: theme => theme.palette.mode === 'dark'
                                    ? theme.palette.primary.contrastText
                                    : undefined,
                                  transform: 'translateY(12px)',
                                  transition: 'all 0.3s',
                                }}
                                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                                disabled={loading}
                              >
                                Выбрать файл
                              </Button>
                            </motion.div>
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  bgcolor: theme => theme.palette.mode === 'dark'
                                    ? 'rgba(33,150,243,0.13)'
                                    : 'rgba(33,150,243,0.07)',
                                  px: 2.5,
                                  py: 1,
                                  borderRadius: 2,
                                  fontSize: 16,
                                  color: 'primary.main',
                                  fontWeight: 500,
                                  boxShadow: theme => theme.palette.mode === 'dark'
                                    ? '0 1px 4px #2563eb22'
                                    : '0 1px 4px #2563eb11',
                                }}
                              >
                                <InsertDriveFileIcon sx={{ mr: 1, color: 'primary.main' }} />
                                DOCX
                                <Divider orientation="vertical" flexItem sx={{ mx: 2, borderColor: 'primary.light' }} />
                                <Typography component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>
                                  до 10 МБ
                                </Typography>
                              </Box>
                            </motion.div>
                          </Box>
                        </Box>
                      </Box>
                    </motion.div>
                    {/* Инструкция по проверке документа */}
                    {!file && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.25 }}
                      >
                        <Box sx={{ mt: 4 }}>
                          <Typography variant="h6" gutterBottom>
                            Что будет проверено?
                          </Typography>
                          <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12} sm={6} md={4}>
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                                <TextFormatIcon sx={{ mr: 1, color: 'primary.main' }} />
                                <Typography variant="body2">Шрифты и форматирование</Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                                <BorderStyleIcon sx={{ mr: 1, color: 'primary.main' }} />
                                <Typography variant="body2">Поля и отступы</Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                                <FormatLineSpacingIcon sx={{ mr: 1, color: 'primary.main' }} />
                                <Typography variant="body2">Межстрочный интервал</Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                                <MenuBookIcon sx={{ mr: 1, color: 'primary.main' }} />
                                <Typography variant="body2">Список литературы</Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                                <SettingsIcon sx={{ mr: 1, color: 'primary.main' }} />
                                <Typography variant="body2">Структура документа</Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                                <WarningAmberIcon sx={{ mr: 1, color: 'primary.main' }} />
                                <Typography variant="body2">И многое другое</Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        </Box>
                      </motion.div>
                    )}
                  </Paper>
                ) : (
                  <Box sx={{ px: 2 }}>
                    {/* Чек-лист проверки с анимацией */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.18 }}
                    >
                      <Box sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        padding: '16px 20px',
                        borderRadius: 2,
                        backgroundColor: theme.palette.mode === 'light'
                          ? 'rgba(76, 175, 80, 0.08)'
                          : 'rgba(76, 175, 80, 0.2)',
                        border: '1px solid',
                        borderColor: 'success.light',
                        mb: 3
                      }}>
                        <InsertDriveFileIcon sx={{ color: 'success.main', mr: 2, fontSize: 40 }} />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, wordBreak: 'break-all' }}>
                            {file?.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {fileSize} • DOCX документ
                          </Typography>
                        </Box>
                        <Tooltip title="Удалить файл">
                          <IconButton onClick={handleReset} size="small" sx={{ ml: 1 }}>
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </motion.div>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                      <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }} style={{ display: 'inline-block' }}>
                        <Button
                          variant="outlined"
                          startIcon={<DeleteOutlineIcon />}
                          onClick={handleReset}
                          sx={{ mr: 2 }}
                        >
                          Выбрать другой файл
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }} style={{ display: 'inline-block' }}>
                        <Button
                          variant="contained"
                          startIcon={<FileUploadIcon />}
                          onClick={handleUpload}
                          disabled={loading}
                          size="large"
                        >
                          Начать проверку
                        </Button>
                      </motion.div>
                    </Box>
                    <Divider sx={{ my: 4 }} />
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.22 }}
                    >
                      <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                        Что будет проверять система:
                      </Typography>
                      <Grid container spacing={2} sx={{ mt: 2 }}>
                        <Grid item xs={12} sm={6}>
                          <List dense>
                            <ListItem>
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                <TextFormatIcon color="primary" fontSize="small" />
                              </ListItemIcon>
                              <ListItemText 
                                primary="Шрифт и форматирование текста"
                              />
                            </ListItem>
                            <ListItem>
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                <BorderStyleIcon color="primary" fontSize="small" />
                              </ListItemIcon>
                              <ListItemText 
                                primary="Поля и отступы документа"
                              />
                            </ListItem>
                            <ListItem>
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                <FormatLineSpacingIcon color="primary" fontSize="small" />
                              </ListItemIcon>
                              <ListItemText 
                                primary="Межстрочные интервалы"
                              />
                            </ListItem>
                          </List>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <List dense>
                            <ListItem>
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                <DescriptionIcon color="primary" fontSize="small" />
                              </ListItemIcon>
                              <ListItemText 
                                primary="Оформление заголовков и разделов"
                              />
                            </ListItem>
                            <ListItem>
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                <DescriptionIcon color="primary" fontSize="small" />
                              </ListItemIcon>
                              <ListItemText 
                                primary="Нумерацию страниц и разделов"
                              />
                            </ListItem>
                            <ListItem>
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                <DescriptionIcon color="primary" fontSize="small" />
                              </ListItemIcon>
                              <ListItemText 
                                primary="Оформление таблиц и рисунков"
                              />
                            </ListItem>
                          </List>
                        </Grid>
                      </Grid>
                    </motion.div>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* WOW-анимированная боковая панель */}
            <Grid item xs={12} md={4}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.18 }}
              >
                <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%', width: '100%' }}>
                  <CardContent sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, width: '100%' }}>
                      <HelpOutlineIcon sx={{ mr: 1 }} color="action" />
                      <Typography variant="h6" component="h3" sx={{ fontWeight: 600, flexGrow: 1 }}>
                        Полезная информация
                      </Typography>
                    </Box>
                    <Typography variant="body2" paragraph color="text.secondary">
                      Система проверит ваш документ на соответствие следующим требованиям:
                    </Typography>
                    <List dense sx={{ width: '100%' }}>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <CheckCircleOutlineIcon color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Times New Roman, 14 пт"
                          secondary="Основной шрифт документа"
                          sx={{ width: '100%' }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <CheckCircleOutlineIcon color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Интервал 1.5 строки"
                          secondary="Для всего основного текста"
                          sx={{ width: '100%' }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <CheckCircleOutlineIcon color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Поля: 3-1.5-2-2 см"
                          secondary="Левое-правое-верхнее-нижнее"
                          sx={{ width: '100%' }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <CheckCircleOutlineIcon color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Отступ 1.25 см"
                          secondary="Для первой строки абзаца"
                          sx={{ width: '100%' }}
                        />
                      </ListItem>
                    </List>

                    <Divider sx={{ my: 2, width: '100%' }} />
                    
                    <Box sx={{ mb: 2, width: '100%' }}>
                      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                        <WarningAmberIcon fontSize="small" color="warning" sx={{ mr: 1 }} />
                        Обратите внимание
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Проверьте, что ваш документ не защищен паролем и не содержит макросов, иначе система не сможет его обработать.
                      </Typography>
                    </Box>

                    <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                      <Button 
                        variant="outlined" 
                        fullWidth 
                        href="/guidelines" 
                        sx={{ mt: 2, width: '100%' }}
                      >
                        Подробнее о требованиях
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          </Grid>

          {/* История последних проверок */}
          {history && history.length > 0 && (
            <Box sx={{ mt: 5, width: '100%' }}>
              <Typography 
                variant="h6" 
                component="h3" 
                gutterBottom 
                sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  fontWeight: 600,
                  mb: 3,
                  width: '100%'
                }}
              >
                <DescriptionIcon sx={{ mr: 1 }} fontSize="small" />
                Последние проверки
              </Typography>
              <Grid container spacing={2} sx={{ width: '100%' }}>
                {history.slice(0, 3).map((item, idx) => (
                  <Grid item xs={12} sm={6} md={4} key={item.id} sx={{ width: '100%' }}>
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.15 + idx * 0.13 }}
                      whileHover={{ scale: 1.025, boxShadow: '0 0 0 4px #2563eb33, 0 8px 32px #2563eb22', borderColor: '#2563eb' }}
                      style={{ height: '100%' }}
                    >
                      <Card 
                        elevation={0}
                        sx={{
                          border: '2px solid',
                          borderColor: 'divider',
                          borderRadius: 3,
                          width: '100%',
                          transition: 'box-shadow 0.25s, border-color 0.25s',
                          '&:hover': {
                            borderColor: 'primary.main',
                            boxShadow: '0 0 0 4px #2563eb33, 0 8px 32px #2563eb22',
                          }
                        }}
                      >
                        <CardContent sx={{ pb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                            <InsertDriveFileIcon 
                              sx={{ 
                                color: 'primary.main',
                                mr: 1.5,
                                mt: 0.5
                              }} 
                            />
                            <Box>
                              <Typography 
                                variant="subtitle2" 
                                sx={{ 
                                  fontWeight: 600,
                                  mb: 0.5,
                                  wordBreak: 'break-all'
                                }}
                              >
                                {item.fileName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                {new Date(item.timestamp).toLocaleString('ru-RU')}
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {item.reportData.check_results && (
                                  <Chip
                                    size="small"
                                    label={`${item.reportData.check_results.total_issues_count || 0} проблем`}
                                    color={item.reportData.check_results.total_issues_count > 0 ? "warning" : "success"}
                                    variant="outlined"
                                  />
                                )}
                                {(item.correctedFilePath || item.reportData.corrected_file_path) && (
                                  <Chip
                                    size="small"
                                    icon={<CheckCircleOutlineIcon />}
                                    label="Исправлен"
                                    color="success"
                                    variant="outlined"
                                  />
                                )}
                              </Box>
                            </Box>
                          </Box>
                        </CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1, gap: 1 }}>
                          {(item.correctedFilePath || item.reportData.corrected_file_path) && (
                            <motion.div whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.07 }}>
                              <Button 
                                size="small"
                                startIcon={<DownloadIcon />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  downloadDocument(
                                    item.correctedFilePath || item.reportData.corrected_file_path, 
                                    item.fileName
                                  );
                                }}
                                color="success"
                              >
                                Скачать
                              </Button>
                            </motion.div>
                          )}
                          <motion.div whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.07 }}>
                            <Button 
                              size="small"
                              onClick={() => navigate('/report', { 
                                state: { 
                                  reportData: item.reportData,
                                  fileName: item.fileName
                                }
                              })}
                            >
                              Открыть отчет
                            </Button>
                          </motion.div>
                        </Box>
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
              {history.length > 3 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Button 
                    variant="text" 
                    onClick={() => navigate('/history')}
                  >
                    Показать все проверки ({history.length})
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </motion.div>
      </Container>
      {/* Кастомные keyframes для анимаций */}
      <style jsx global>{`
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 0 0 #2563eb33; }
          70% { box-shadow: 0 0 32px 16px #2563eb22; }
          100% { box-shadow: 0 0 0 0 #2563eb33; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
      `}</style>
    </>
  );
};

export default CheckPage; 