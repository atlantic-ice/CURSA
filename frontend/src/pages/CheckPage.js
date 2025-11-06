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
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SpellcheckIcon from '@mui/icons-material/Spellcheck';
import DataObjectIcon from '@mui/icons-material/DataObject';
import { CheckHistoryContext } from '../App';
import axios from 'axios';
import { motion } from 'framer-motion';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import FilePresentIcon from '@mui/icons-material/FilePresent';

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
      padding: '40px 20px',
      borderRadius: 12,
      position: 'relative',
      background: theme => theme.palette.mode === 'dark'
        ? 'rgba(15, 23, 42, 0.5)'
        : 'rgba(248, 250, 252, 0.7)',
      color: theme => theme.palette.text.secondary,
      outline: 'none',
      transition: 'all 0.25s ease',
      cursor: 'pointer',
      minHeight: 260,
      textAlign: 'center',
      boxShadow: 'none',
      border: 'none',
      borderColor: 'transparent',
      '&:hover': {
        borderColor: 'transparent',
        backgroundColor: theme => theme.palette.mode === 'dark'
          ? 'rgba(15, 23, 42, 0.6)'
          : 'rgba(248, 250, 252, 0.8)',
      }
    },
    active: {
      borderColor: 'transparent',
      backgroundColor: theme => theme.palette.mode === 'dark'
        ? 'rgba(15, 23, 42, 0.7)'
        : 'rgba(239, 246, 255, 0.7)',
      boxShadow: 'none',
    },
    reject: {
      borderColor: 'transparent',
      backgroundColor: theme => theme.palette.mode === 'dark'
        ? 'rgba(30, 41, 59, 0.7)'
        : 'rgba(254, 242, 242, 0.7)',
      boxShadow: 'none',
    },
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 6 }}>
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
          }}
        >
          Проверка курсовой работы
        </Typography>
        
        <Typography 
          variant="body1" 
          align="center" 
          color="text.secondary"
          sx={{ 
            maxWidth: 700, 
            mx: 'auto', 
            mb: 5,
            fontSize: '1.1rem',
          }}
        >
          Загрузите документ в формате DOCX для проверки на соответствие требованиям оформления. 
          Система проанализирует структуру, форматирование и стиль документа.
        </Typography>

        <Stepper 
          activeStep={activeStep} 
          alternativeLabel 
          sx={{ 
            mb: 5,
            '& .MuiStepLabel-root .Mui-completed': {
              color: 'primary.main',
            },
            '& .MuiStepLabel-root .Mui-active': {
              color: 'primary.main',
            },
            '& .MuiStepLabel-label.Mui-active.MuiStepLabel-alternativeLabel': {
              color: 'primary.main',
              fontWeight: 700,
            },
          }}
        >
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ maxWidth: 800, mx: 'auto' }}>
          {activeStep === 0 && (
            <Fade in={activeStep === 0} timeout={500}>
              <Box>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Paper 
                    elevation={0}
                    sx={{ 
                      borderRadius: 4,
                      overflow: 'hidden',
                      mb: 3,
                      backgroundColor: 'transparent'
                    }}
                  >
                    <Box
                      {...getRootProps()}
                      sx={{
                        ...dropzoneStyles.base,
                        ...(isDragActive ? dropzoneStyles.active : {}),
                        ...(isDragReject ? dropzoneStyles.reject : {}),
                        position: 'relative',
                        transition: 'box-shadow 0.3s, border-color 0.3s, background 0.3s',
                        borderRadius: 4,
                        borderImage: undefined,
                        boxShadow: 'none',
                      }}
                    >
                      <input {...getInputProps()} ref={fileInputRef} style={{ display: 'none' }} />
                      <CloudUploadIcon 
                        sx={{ 
                          fontSize: 60, 
                          color: isDragReject 
                            ? 'error.main' 
                            : (isDragActive ? 'primary.main' : 'text.secondary'),
                          mb: 2,
                          opacity: 0.8,
                          zIndex: 1
                        }} 
                      />
                      {isDragActive ? (
                        <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main', zIndex: 1 }}>
                          Отпустите файл здесь...
                        </Typography>
                      ) : isDragReject ? (
                        <Typography variant="h6" sx={{ fontWeight: 600, color: 'error.main', zIndex: 1 }}>
                          Только файлы формата DOCX
                        </Typography>
                      ) : (
                        <Box sx={{ zIndex: 1, position: 'relative', width: '100%' }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                            Перетащите файл сюда или нажмите для выбора
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Поддерживается формат DOCX (Microsoft Word)
                          </Typography>
                          <Button 
                            variant="contained"
                            startIcon={<FileUploadIcon />}
                            size="large"
                            onClick={e => {
                              e.stopPropagation();
                              if (fileInputRef.current) fileInputRef.current.click();
                            }}
                            sx={{ 
                              borderRadius: 28,
                              px: 4,
                              py: 1.5,
                              fontWeight: 700,
                              fontSize: 18,
                              background: 'linear-gradient(90deg, #2563eb 0%, #a78bfa 100%)',
                              color: '#fff',
                              boxShadow: '0 6px 20px #2563eb22',
                              mb: 2,
                              '&:hover': {
                                background: 'linear-gradient(90deg, #1e40af 0%, #7c3aed 100%)',
                                boxShadow: '0 8px 24px #2563eb33',
                              }
                            }}
                          >
                            Выбрать файл
                          </Button>
                          {/* Подсказки и примеры */}
                          <Box sx={{ mt: 2, mb: 1 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            Максимальный размер файла: 10 МБ
                          </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                              Пример: <span style={{ fontWeight: 600 }}>Курсовая_Иванов.docx</span>
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              <span style={{ color: '#2563eb', fontWeight: 600 }}>Совет:</span> Файл должен быть в формате DOCX, созданном в Microsoft Word или совместимых редакторах.
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Paper>

                  {error && (
                    <Alert 
                      severity="error" 
                      sx={{ 
                        mb: 3,
                        borderRadius: 1,
                        boxShadow: theme => theme.palette.mode === 'dark'
                          ? '0 4px 16px rgba(239, 68, 68, 0.2)'
                          : '0 4px 16px rgba(239, 68, 68, 0.1)',
                      }}
                    >
                      <AlertTitle>Ошибка</AlertTitle>
                      {error}
                    </Alert>
                  )}

                  <Box sx={{ textAlign: 'center', mt: 4 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Недавние проверки
                    </Typography>
                    
                    <Grid container spacing={2} justifyContent="center">
                      {history.slice(0, 3).map((item, index) => (
                        <Grid item xs={12} sm={4} key={index}>
                          <Card 
                            variant="outlined"
                            sx={{ 
                              borderRadius: 1,
                              transition: 'all 0.2s',
                              cursor: 'pointer',
                              '&:hover': {
                                borderColor: 'primary.main',
                                transform: 'translateY(-2px)',
                                boxShadow: theme => theme.palette.mode === 'dark'
                                  ? '0 4px 12px rgba(37, 99, 235, 0.2)'
                                  : '0 4px 12px rgba(37, 99, 235, 0.1)',
                              }
                            }}
                            onClick={() => navigate('/report', { state: { reportData: item.reportData, fileName: item.fileName } })}
                          >
                            <CardContent>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <DescriptionIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                                <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600 }}>
                                  {item.fileName || 'Документ без имени'}
                                </Typography>
                              </Box>
                              <Typography variant="caption" color="text.secondary">
                                Проверено: {new Date(item.timestamp).toLocaleDateString()}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                      {history.length === 0 && (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          Нет недавних проверок
                        </Typography>
                      )}
                    </Grid>
                    
                    {history.length > 3 && (
                      <Button 
                        variant="text" 
                        size="small"
                        onClick={() => navigate('/history')}
                        endIcon={<ArrowForwardIcon />}
                        sx={{ mt: 2 }}
                      >
                        Смотреть всю историю
                      </Button>
                    )}
                  </Box>
                </motion.div>
              </Box>
            </Fade>
          )}

          {activeStep === 1 && (
            <Fade in={activeStep === 1} timeout={500}>
              <Box>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 4, 
                      borderRadius: 2,
                      background: theme => theme.palette.mode === 'dark'
                        ? 'linear-gradient(145deg, rgba(15, 23, 42, 0.7) 0%, rgba(30, 41, 59, 0.7) 100%)'
                        : 'linear-gradient(145deg, rgba(248, 250, 252, 0.7) 0%, rgba(241, 245, 249, 0.7) 100%)',
                      backdropFilter: 'none',
                      WebkitBackdropFilter: 'none',
                      boxShadow: theme => theme.palette.mode === 'dark'
                        ? 'none'
                        : 'none',
                    }}
                  >
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                      <Typography variant="h5" component="h2" sx={{ fontWeight: 700, mb: 1 }}>
                        Файл готов к проверке
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Нажмите кнопку "Проверить" для анализа документа
                      </Typography>
                    </Box>

                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        p: 3,
                        mb: 3,
                        borderRadius: 1,
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <InsertDriveFileIcon 
                        sx={{ 
                          fontSize: 48, 
                          color: 'primary.main',
                          mr: 2 
                        }} 
                      />
                      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }} noWrap>
                          {file?.name || 'document.docx'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {fileSize} • DOCX документ
                        </Typography>
                      </Box>
                      <Tooltip title="Удалить файл">
                        <IconButton onClick={handleReset} color="inherit" size="small">
                          <DeleteOutlineIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                      <Button 
                        variant="outlined" 
                        onClick={handleReset}
                        sx={{ 
                          px: 3,
                          borderRadius: 1,
                          fontWeight: 600,
                        }}
                      >
                        Отмена
                      </Button>
                      <Button 
                        variant="contained" 
                        onClick={handleUpload}
                        startIcon={<CheckCircleOutlineIcon />}
                        sx={{ 
                          px: 4,
                          py: 1.2,
                          borderRadius: 1,
                          fontWeight: 600,
                          background: theme => theme.palette.mode === 'dark'
                            ? 'linear-gradient(90deg, #2563eb 0%, #6366f1 100%)'
                            : undefined,
                          boxShadow: theme => theme.palette.mode === 'dark'
                            ? '0 4px 16px rgba(37, 99, 235, 0.3)'
                            : undefined,
                        }}
                      >
                        Проверить
                      </Button>
                    </Box>
                  </Paper>

                  {error && (
                    <Alert 
                      severity="error" 
                      sx={{ 
                        mt: 3,
                        borderRadius: 1,
                        boxShadow: theme => theme.palette.mode === 'dark'
                          ? '0 4px 16px rgba(239, 68, 68, 0.2)'
                          : '0 4px 16px rgba(239, 68, 68, 0.1)',
                      }}
                    >
                      <AlertTitle>Ошибка</AlertTitle>
                      {error}
                    </Alert>
                  )}
                </motion.div>
              </Box>
            </Fade>
          )}

          {activeStep === 2 && (
            <Fade in={activeStep === 2} timeout={500}>
              <Box sx={{ textAlign: 'center' }}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 5, 
                      borderRadius: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: theme => theme.palette.mode === 'dark'
                        ? 'linear-gradient(145deg, rgba(15, 23, 42, 0.7) 0%, rgba(30, 41, 59, 0.7) 100%)'
                        : 'linear-gradient(145deg, rgba(248, 250, 252, 0.7) 0%, rgba(241, 245, 249, 0.7) 100%)',
                      backdropFilter: 'none',
                      WebkitBackdropFilter: 'none',
                      boxShadow: 'none',
                    }}
                  >
                    <Box sx={{ mb: 3 }}>
                      <motion.div
                        animate={{ 
                          rotate: 360
                        }}
                        transition={{ 
                          repeat: Infinity,
                          duration: 2,
                          ease: "linear" 
                        }}
                      >
                        <CircularProgress size={64} thickness={4} />
                      </motion.div>
                    </Box>
                    <Typography variant="h5" component="h2" sx={{ fontWeight: 700, mb: 2 }}>
                      Анализ документа
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500 }}>
                      Пожалуйста, подождите. Система проверяет форматирование, структуру и стиль вашего документа. 
                      Это может занять до 30 секунд.
                    </Typography>
                  </Paper>

                  <Backdrop
                    sx={{ 
                      color: '#fff', 
                      zIndex: (theme) => theme.zIndex.drawer + 1,
                      backdropFilter: 'none',
                    }}
                    open={loading}
                  >
                    <CircularProgress color="inherit" />
                  </Backdrop>
                </motion.div>
              </Box>
            </Fade>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default CheckPage; 