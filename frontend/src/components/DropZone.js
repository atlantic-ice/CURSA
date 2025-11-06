import React, { useState, useCallback, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Alert,
  AlertTitle,
  useTheme,
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import { motion } from 'framer-motion';
import axios from 'axios';
import { CheckHistoryContext } from '../App';

const DropZone = ({ children, sx: sxOverride }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileSize, setFileSize] = useState(0);
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
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      setFileSize(formatFileSize(selectedFile.size));
      setError('');
      handleUpload(selectedFile);
    }
  }, []);

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
    maxFiles: 1,
    maxSize: 20971520, // 20 MB
    onDrop,
    onDropRejected,
  });

  const handleUpload = async (uploadedFile) => {
    const fileToUpload = uploadedFile || file;
    if (!fileToUpload) {
      setError('Выберите файл');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', fileToUpload);

    try {
      const response = await axios.post('http://localhost:5000/api/document/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const checkData = {
        id: new Date().toISOString(),
        fileName: fileToUpload.name,
        timestamp: new Date().toISOString(),
        reportData: response.data,
      };

      try {
        addToHistory && addToHistory(checkData);
      } catch (e) {
        // ignore
      }

      navigate('/report', {
        state: {
          reportData: response.data,
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

  const handleReset = () => {
    setFile(null);
    setFileSize(0);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
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
      // keep active state semantic but remove blurred outlines
      borderColor: 'primary.main'
    },
    reject: {
      borderColor: 'error.main'
    },
  };

  // Note: loading state is handled inline (no full-screen analyzing overlay)
  // The previous implementation returned a full loading view here. That behavior
  // was removed so that the page does not switch to an analyzing screen after
  // a file is selected — upload proceeds in background and navigation still
  // happens on success.

  // If a child is provided we render a "bare" drop area and call the child as a render-prop
  // so pages can render custom UI (for example an SVG outline) while still using the drop behaviour.
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
                // keep wrapper transparent so child visuals show through
                backgroundColor: 'transparent',
                width: '100%',
                height: '100%',
                position: 'relative',
              }}
            >
              <input {...getInputProps()} ref={fileInputRef} style={{ display: 'none' }} />
              {typeof children === 'function'
                ? children({ isDragActive, isDragReject, file, fileSize, error, openFile: () => fileInputRef.current && fileInputRef.current.click() })
                : children}
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
  }

  // Default rendering (no children): render the built-in drop UI
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
                Перетащите файл сюда…
              </Typography>
            ) : isDragReject ? (
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'error.main' }}>
                Поддерживаются только файлы DOCX
              </Typography>
            ) : (
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                  Перетащите файл сюда
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
                  Выбрать файл
                </Button>
              </Box>
            )}
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

export default DropZone;
