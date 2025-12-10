import React, { useState, useCallback, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  AlertTitle,
  useTheme,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { motion } from 'framer-motion';
import { CheckHistoryContext } from '../App';
import api from '../utils/api';

const DropZone = ({ children, sx: sxOverride, multiple = false }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [batchResults, setBatchResults] = useState(null);
  const fileInputRef = useRef(null);
  const { addToHistory } = useContext(CheckHistoryContext);

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Б';
    const k = 1024;
    const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      if (multiple) {
        setFiles(acceptedFiles);
        setError('');
        handleBatchUpload(acceptedFiles);
      } else {
        const selectedFile = acceptedFiles[0];
        setFiles([selectedFile]);
        setError('');
        handleUpload(selectedFile);
      }
    }
  }, [multiple]);

  const onDropRejected = useCallback((fileRejections) => {
    const rejection = fileRejections && fileRejections[0];
    if (rejection) {
      if (rejection.errors.some((e) => e.code === 'file-invalid-type')) {
        setError('Загрузите файл DOCX (документ Word)');
      } else if (rejection.errors.some((e) => e.code === 'file-too-large')) {
        setError('Файл слишком большой. Максимальный размер — 20 МБ');
      } else {
        setError('Не удалось загрузить файл. Проверьте формат и размер.');
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: multiple ? 10 : 1,
    maxSize: 20971520, // 20 MB
    onDrop,
    onDropRejected,
    multiple: multiple
  });

  const handleUpload = async (fileToUpload) => {
    if (!fileToUpload) {
      setError('Выберите файл');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await api.uploadDocument(fileToUpload);

      const checkData = {
        id: new Date().toISOString(),
        fileName: fileToUpload.name,
        timestamp: new Date().toISOString(),
        reportData: data,
      };

      try {
        addToHistory && addToHistory(checkData);
      } catch (e) {
        // ignore
      }

      navigate('/report', {
        state: {
          reportData: data,
          fileName: fileToUpload.name,
        },
      });
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(err.response?.data?.error || 'Произошла ошибка при загрузке файла. Повторите попытку.');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchUpload = async (filesToUpload) => {
    if (!filesToUpload || filesToUpload.length === 0) {
      setError('Выберите файлы');
      return;
    }

    setLoading(true);
    setError('');
    setBatchResults(null);

    try {
      const data = await api.uploadBatch(filesToUpload);
      setBatchResults(data.results);
      
      // Add successful uploads to history
      if (addToHistory && data.results) {
        data.results.forEach(res => {
            if (res.success) {
                addToHistory({
                    id: new Date().toISOString() + Math.random(),
                    fileName: res.filename,
                    timestamp: new Date().toISOString(),
                    reportData: res
                });
            }
        });
      }

    } catch (err) {
      console.error('Error uploading batch:', err);
      setError(err.response?.data?.error || 'Произошла ошибка при пакетной загрузке.');
    } finally {
      setLoading(false);
    }
  };

  const dropzoneStyles = {
    base: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      borderRadius: 28,
      position: 'relative',
      color: theme.palette.text.secondary,
      outline: 'none',
      transition: 'transform 220ms cubic-bezier(.2,.9,.2,1), border-color 180ms linear',
      cursor: 'pointer',
      minHeight: 300,
      textAlign: 'center',
      border: 'none',
      '&:hover': {
        transform: 'scale(1.02)',
      },
      '&:focus-visible': {
        outline: 'none'
      },
      '@media (prefers-reduced-motion: reduce)': {
        transition: 'none',
        transform: 'none',
      },
    },
    active: {
      borderColor: 'primary.main'
    },
    reject: {
      borderColor: 'error.main'
    },
  };

  if (batchResults) {
      return (
          <Box>
              <Typography variant="h6" gutterBottom>Результаты пакетной обработки</Typography>
              <List>
                  {batchResults.map((res, index) => (
                      <ListItem key={index}>
                          <ListItemIcon>
                              {res.success ? <CheckCircleIcon color="success" /> : <ErrorIcon color="error" />}
                          </ListItemIcon>
                          <ListItemText 
                            primary={res.filename} 
                            secondary={res.success ? `Ошибок: ${res.check_results?.total_issues_count || 0}` : res.error} 
                          />
                          {res.success && (
                              <Button 
                                variant="outlined" 
                                size="small" 
                                onClick={() => navigate('/report', { state: { reportData: res, fileName: res.filename } })}
                              >
                                  Отчет
                              </Button>
                          )}
                      </ListItem>
                  ))}
              </List>
              <Button variant="contained" onClick={() => { setBatchResults(null); setFiles([]); }}>Загрузить еще</Button>
          </Box>
      );
  }

  if (children) {
    return (
      <Box>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Paper elevation={0} sx={{ borderRadius: 4, overflow: 'hidden', mb: 3, backgroundColor: 'transparent', ...(sxOverride || {}) }}>
            <Box
              {...getRootProps()}
              sx={{
                ...dropzoneStyles.base,
                ...(isDragActive ? dropzoneStyles.active : {}),
                ...(isDragReject ? dropzoneStyles.reject : {}),
                backgroundColor: 'transparent',
                width: '100%',
                height: '100%',
                position: 'relative',
              }}
            >
              <input {...getInputProps()} ref={fileInputRef} style={{ display: 'none' }} />
              {typeof children === 'function'
                ? children({ isDragActive, isDragReject, file: files[0], fileSize: formatFileSize(files[0]?.size), error, openFile: () => fileInputRef.current && fileInputRef.current.click() })
                : children}
            </Box>
          </Paper>

          {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                <AlertTitle>Ошибка</AlertTitle>
              {error}
            </Alert>
          )}
           {loading && <CircularProgress />}
        </motion.div>
      </Box>
    );
  }

  return (
    <Box>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Paper elevation={0} sx={{ borderRadius: 4, overflow: 'hidden', mb: 3, backgroundColor: 'transparent' }}>
          <Box {...getRootProps()} sx={{ ...dropzoneStyles.base, ...(isDragActive ? dropzoneStyles.active : {}), ...(isDragReject ? dropzoneStyles.reject : {}) }}>
            <input {...getInputProps()} ref={fileInputRef} style={{ display: 'none' }} />
            <CloudUploadIcon
              sx={{
                fontSize: 60,
                color: isDragReject ? 'error.main' : isDragActive ? 'primary.main' : 'text.secondary',
                mb: 2,
                opacity: 0.8,
              }}
            />

            {isDragActive ? (
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                {multiple ? 'Перетащите файлы сюда…' : 'Перетащите файл сюда…'}
              </Typography>
            ) : isDragReject ? (
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'error.main' }}>
                Поддерживаются только файлы DOCX
              </Typography>
            ) : (
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                   {multiple ? 'Перетащите файлы сюда' : 'Перетащите файл сюда'}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  или нажмите, чтобы выбрать
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<FileUploadIcon />}
                  size="large"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (fileInputRef.current) fileInputRef.current.click();
                  }}
                >
                  {multiple ? 'Выбрать файлы' : 'Выбрать файл'}
                </Button>
              </Box>
            )}
             {loading && <CircularProgress sx={{ mt: 2 }} />}
          </Box>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <AlertTitle>Ошибка</AlertTitle>
            {error}
          </Alert>
        )}
      </motion.div>
    </Box>
  );
};

DropZone.propTypes = {
  children: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
  sx: PropTypes.object,
  multiple: PropTypes.bool,
};

DropZone.defaultProps = {
  children: null,
  sx: {},
  multiple: false,
};

export default DropZone;
