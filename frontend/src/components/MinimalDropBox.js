import React, { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFileOutlined';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function MinimalDropBox() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [fileName, setFileName] = useState('');
  const inputRef = useRef(null);

  const onDrop = useCallback(async (acceptedFiles) => {
    setError('');
    setSuccess(false);
    if (!acceptedFiles?.length) return;
    const file = acceptedFiles[0];
    setFileName(file.name);
    const form = new FormData();
    form.append('file', file);
    setLoading(true);
    try {
      // thanks to CRA proxy, relative URL will be proxied to backend:5000 in dev
      const response = await axios.post('/api/document/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess(true);
      toast.success(`Файл "${file.name}" успешно загружен!`);
      // redirect to report page after 500ms
      setTimeout(() => {
        navigate('/report', { 
          state: { 
            reportData: response.data, 
            fileName: file.name 
          } 
        });
      }, 500);
    } catch (e) {
      const errMsg = e?.response?.data?.error || 'Не удалось загрузить файл. Попробуйте ещё раз.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const onDropRejected = useCallback(() => {
    setError('Поддерживается только .docx до 20 МБ');
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    accept: { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
    onDrop,
    onDropRejected,
  });

  const RADIUS = '12px';

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS }}>
      <Box
        {...getRootProps()}
        sx={{
          width: '100%',
          maxWidth: 920,
          minHeight: 360,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          borderRadius: RADIUS,
          border: '2px dashed',
          borderColor: isDragReject ? 'error.main' : isDragActive ? 'primary.main' : 'rgba(255,255,255,0.12)',
          background: 'rgba(255,255,255,0.02)',
          transition: 'all 160ms ease',
          cursor: 'pointer',
          p: 4,
          boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.04)',
          overflow: 'hidden',
          '&:hover': { borderColor: isDragReject ? 'error.main' : 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.03)' },
        }}
      >
        <input {...getInputProps()} ref={inputRef} style={{ display: 'none' }} />

        <UploadFileIcon sx={{ fontSize: 64, color: isDragReject ? 'error.main' : isDragActive ? 'primary.main' : 'rgba(255,255,255,0.6)', mb: 1.5 }} />

        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.75 }}>
          {isDragReject ? 'Только .docx' : 'Перетащите .docx сюда'}
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.68)', mb: 1 }}>
          или нажмите, чтобы выбрать · до 20 МБ
        </Typography>

        {loading && (
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={18} />
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Загрузка…</Typography>
          </Box>
        )}
        {success && !loading && (
          <Typography variant="body2" sx={{ color: 'success.main', mt: 2 }}>Файл загружен</Typography>
        )}
        {error && !loading && (
          <Typography variant="body2" sx={{ color: 'error.main', mt: 2 }}>{error}</Typography>
        )}
      </Box>
    </Box>
  );
}
