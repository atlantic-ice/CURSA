import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Container, 
  Stack, 
  useTheme, 
  alpha,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Tooltip,
  Fade,
  Chip,
  LinearProgress
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HistoryIcon from '@mui/icons-material/History';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SettingsIcon from '@mui/icons-material/Settings';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import toast, { Toaster } from 'react-hot-toast';

// В дев-среде используем прокси CRA (пустая база), иначе — REACT_APP_API_BASE или прод-URL
const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE = isLocal ? '' : (process.env.REACT_APP_API_BASE || 'https://cursa.onrender.com');

const ACCEPTED_TYPES = {
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};

export default function UploadPage() {
  const [fileName, setFileName] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState('');
  const [recentFiles, setRecentFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const navigate = useNavigate();
  const theme = useTheme();

  // Load profiles and history
  useEffect(() => {
    // Fetch profiles
    axios.get(`${API_BASE}/api/profiles/`)
      .then(res => {
        setProfiles(res.data);
        if (res.data.length > 0) setSelectedProfile(res.data[0].id);
      })
      .catch(err => console.error("Failed to load profiles", err));

    // Load history
    const history = JSON.parse(localStorage.getItem('uploadHistory') || '[]');
    setRecentFiles(history);
  }, []);

  const addToHistory = (file, profileId) => {
    const newEntry = {
      name: file.name,
      date: new Date().toISOString(),
      profile: profileId,
      size: file.size
    };
    const updated = [newEntry, ...recentFiles.filter(f => f.name !== file.name)].slice(0, 5);
    setRecentFiles(updated);
    localStorage.setItem('uploadHistory', JSON.stringify(updated));
  };

  const clearHistory = () => {
    setRecentFiles([]);
    localStorage.removeItem('uploadHistory');
  };

  const handleUpload = useCallback(async (acceptedFiles) => {
    if (!acceptedFiles?.length) return;
    const file = acceptedFiles[0];
    setFileName(file.name);
    setStatus('loading');
    setError('');
    setUploadProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 200);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('profile_id', selectedProfile);

    try {
      const response = await axios.post(`${API_BASE}/api/document/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setStatus('success');
      toast.success(`Файл «${file.name}» успешно проверен`);
      addToHistory(file, selectedProfile);
      
      // Переход на страницу отчета с данными
      setTimeout(() => {
        navigate('/report', { 
          state: { 
            reportData: response.data,
            fileName: file.name 
          } 
        });
      }, 500);
      
    } catch (err) {
      clearInterval(progressInterval);
      const message = err?.response?.data?.error || 'Не удалось загрузить файл. Попробуйте ещё раз.';
      setStatus('error');
      setError(message);
      toast.error(message);
    }
  }, [navigate, selectedProfile, recentFiles]);

  const handleRejected = useCallback(() => {
    setStatus('error');
    const message = 'Поддерживается только .docx до 20 МБ';
    setError(message);
    toast.error(message);
  }, []);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    open,
  } = useDropzone({
    accept: ACCEPTED_TYPES,
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
    onDrop: handleUpload,
    onDropRejected: handleRejected,
    noClick: true,
    noKeyboard: true,
  });

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: 'background.default',
      color: 'text.primary',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      p: 2
    }}>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1e293b', color: '#f8fafc', border: '1px solid rgba(148, 163, 184, 0.1)' },
        }}
      />

      {/* Professional Background Effects */}
      <Box sx={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        {/* Main Gradient Orb */}
        <Box sx={{
          position: 'absolute',
          top: '-20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80%',
          height: '80%',
          background: `radial-gradient(circle at center, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 60%)`,
          filter: 'blur(100px)',
          opacity: 0.8,
        }} />
        
        {/* Secondary Orb */}
        <Box sx={{
          position: 'absolute',
          bottom: '-10%',
          right: '-10%',
          width: '40%',
          height: '40%',
          background: `radial-gradient(circle at center, ${alpha(theme.palette.secondary.main, 0.05)} 0%, transparent 60%)`,
          filter: 'blur(80px)',
          opacity: 0.6,
        }} />

        {/* Grid Pattern */}
        <Box sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `linear-gradient(${alpha(theme.palette.divider, 0.03)} 1px, transparent 1px), linear-gradient(90deg, ${alpha(theme.palette.divider, 0.03)} 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)',
        }} />
      </Box>

      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
        <Stack spacing={6} alignItems="center">
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
              <Typography variant="h1" sx={{ 
                fontSize: { xs: '3rem', md: '5rem' }, 
                fontWeight: 900, 
                letterSpacing: '-0.03em',
                color: 'text.primary',
                lineHeight: 0.9,
                mb: 2,
                textShadow: `0 0 40px ${alpha(theme.palette.primary.main, 0.3)}`
              }}>
                CURSA
              </Typography>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.3 }}>
              <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400, maxWidth: 600, mx: 'auto', lineHeight: 1.6, fontSize: '1.1rem' }}>
                Интеллектуальная система нормоконтроля документов.
                <br />
                Загрузите работу для мгновенного анализа соответствия ГОСТ.
              </Typography>
            </motion.div>
          </Box>

          {/* Main Card */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8, delay: 0.5, type: "spring", stiffness: 50 }}
            style={{ width: '100%' }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 0,
                borderRadius: 3,
                bgcolor: alpha(theme.palette.background.paper, 0.4),
                backdropFilter: 'blur(24px)',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                overflow: 'hidden',
                boxShadow: `0 24px 48px -12px ${alpha('#000', 0.5)}`,
                position: 'relative'
              }}
            >
              {/* Top Bar */}
              <Box sx={{ 
                px: 3,
                py: 2,
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                bgcolor: alpha(theme.palette.background.default, 0.2)
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ p: 0.8, borderRadius: 2, bgcolor: alpha(theme.palette.text.primary, 0.05) }}>
                    <SettingsIcon fontSize="small" color="action" />
                  </Box>
                  <Typography variant="subtitle2" fontWeight={700} color="text.secondary">ПАРАМЕТРЫ</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <FormControl size="small" sx={{ minWidth: 220 }}>
                    <Select
                      value={selectedProfile}
                      onChange={(e) => setSelectedProfile(e.target.value)}
                      displayEmpty
                      variant="standard"
                      disableUnderline
                      sx={{ 
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: 'text.primary',
                        '& .MuiSelect-select': { py: 0.5, textAlign: 'right', pr: '24px !important' },
                        '& .MuiSvgIcon-root': { right: 0 }
                      }}
                    >
                      <MenuItem value="" disabled>Выберите стандарт</MenuItem>
                      {profiles.map(p => (
                        <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                      ))}
                      {profiles.length === 0 && <MenuItem value="default">ГОСТ 7.32-2017 (Базовый)</MenuItem>}
                    </Select>
                  </FormControl>
                  <IconButton 
                    size="small" 
                    onClick={() => navigate('/profiles')}
                    sx={{ 
                      border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                      borderRadius: 2
                    }}
                  >
                    <Tooltip title="Настроить стандарты">
                      <ArrowForwardIcon fontSize="small" />
                    </Tooltip>
                  </IconButton>
                </Box>
              </Box>

              {/* Dropzone Area */}
              <Box
                {...getRootProps()}
                sx={{
                  p: 8,
                  minHeight: 360,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  bgcolor: isDragActive ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                  position: 'relative',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.background.paper, 0.2),
                    '& .upload-icon': {
                      transform: 'scale(1.1) translateY(-5px)',
                      color: theme.palette.primary.main
                    }
                  }
                }}
              >
                <input {...getInputProps()} />
                
                {/* Animated Border for Drag */}
                <AnimatePresence>
                  {isDragActive && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      style={{
                        position: 'absolute',
                        inset: 20,
                        border: `2px dashed ${theme.palette.primary.main}`,
                        borderRadius: 3,
                        pointerEvents: 'none',
                        backgroundColor: alpha(theme.palette.primary.main, 0.02)
                      }}
                    />
                  )}
                </AnimatePresence>

                <Box sx={{ position: 'relative', mb: 5 }}>
                  <Box sx={{
                    position: 'absolute',
                    inset: -30,
                    background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.2)} 0%, transparent 70%)`,
                    filter: 'blur(30px)',
                    borderRadius: '50%',
                    zIndex: 0
                  }} />
                  <CloudUploadIcon 
                    className="upload-icon"
                    sx={{ 
                      fontSize: 80, 
                      color: isDragActive ? theme.palette.primary.main : theme.palette.text.secondary, 
                      position: 'relative', 
                      zIndex: 1,
                      transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                    }} 
                  />
                </Box>

                <Typography variant="h4" fontWeight={800} gutterBottom sx={{ letterSpacing: '-0.02em' }}>
                  {isDragActive ? 'Отпускайте!' : 'Загрузить документ'}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 5, maxWidth: 400, textAlign: 'center', lineHeight: 1.6 }}>
                  Перетащите файл <strong>.docx</strong> в эту область<br/>или нажмите кнопку для выбора
                </Typography>

                {status === 'loading' ? (
                  <Box sx={{ width: '100%', maxWidth: 300 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="caption" fontWeight={600} color="primary">Анализ документа...</Typography>
                      <Typography variant="caption" fontWeight={600} color="text.secondary">{Math.round(uploadProgress)}%</Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={uploadProgress} 
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        '& .MuiLinearProgress-bar': { borderRadius: 4 }
                      }} 
                    />
                  </Box>
                ) : (
                  <Button 
                    variant="contained" 
                    size="large"
                    disabled={status === 'loading'}
                    onClick={(e) => { e.stopPropagation(); open(); }}
                    sx={{ 
                      px: 6, 
                      py: 1.8, 
                      borderRadius: 3,
                      fontSize: '1rem',
                      fontWeight: 700,
                      textTransform: 'none',
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                      boxShadow: `0 8px 20px -4px ${alpha(theme.palette.primary.main, 0.5)}`,
                      '&:hover': {
                        boxShadow: `0 12px 24px -4px ${alpha(theme.palette.primary.main, 0.6)}`,
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Выбрать файл на компьютере
                  </Button>
                )}
              </Box>
            </Paper>
          </motion.div>

          {/* Recent Files */}
          {recentFiles.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ duration: 0.8, delay: 0.8 }}
              style={{ width: '100%', maxWidth: 600 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, px: 1 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HistoryIcon fontSize="inherit" /> Недавние проверки
                </Typography>
                <Button 
                  size="small" 
                  onClick={clearHistory}
                  sx={{ 
                    minWidth: 0,
                    p: 0.5,
                    color: 'text.secondary',
                    opacity: 0.6, 
                    fontSize: '0.75rem',
                    borderRadius: 1,
                    '&:hover': { opacity: 1, bgcolor: alpha(theme.palette.error.main, 0.1), color: 'error.main' } 
                  }}
                >
                  <Tooltip title="Очистить историю">
                    <DeleteOutlineIcon fontSize="small" />
                  </Tooltip>
                </Button>
              </Box>
              
              <Stack spacing={1.5}>
                {recentFiles.map((file, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + (idx * 0.1) }}
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 2.5,
                        bgcolor: alpha(theme.palette.background.paper, 0.3),
                        backdropFilter: 'blur(10px)',
                        border: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        cursor: 'default',
                        position: 'relative',
                        overflow: 'hidden',
                        '&:hover': {
                          bgcolor: alpha(theme.palette.background.paper, 0.5),
                          transform: 'translateY(-2px)',
                          boxShadow: `0 4px 12px -2px ${alpha('#000', 0.2)}`,
                          borderColor: alpha(theme.palette.primary.main, 0.2),
                          '& .file-icon': {
                            transform: 'scale(1.1) rotate(-5deg)',
                            color: theme.palette.primary.main
                          }
                        }
                      }}
                    >
                      <Avatar className="file-icon" sx={{ 
                        bgcolor: alpha(theme.palette.primary.main, 0.08), 
                        color: theme.palette.text.secondary, 
                        mr: 2,
                        width: 40,
                        height: 40,
                        transition: 'all 0.3s ease'
                      }}>
                        <DescriptionIcon fontSize="small" />
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle2" fontWeight={600} sx={{ lineHeight: 1.2, mb: 0.5 }}>{file.name}</Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip 
                            label={new Date(file.date).toLocaleDateString()} 
                            size="small" 
                            sx={{ 
                              height: 20, 
                              fontSize: '0.65rem', 
                              bgcolor: alpha(theme.palette.divider, 0.05),
                              color: 'text.secondary'
                            }} 
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                            {(file.size / 1024).toFixed(1)} KB
                          </Typography>
                        </Stack>
                      </Box>
                      <Tooltip title="Проверено">
                        <Box sx={{ 
                          p: 0.5, 
                          borderRadius: '50%', 
                          bgcolor: alpha(theme.palette.success.main, 0.1),
                          color: theme.palette.success.main,
                          display: 'flex'
                        }}>
                          <CheckCircleIcon fontSize="small" />
                        </Box>
                      </Tooltip>
                    </Paper>
                  </motion.div>
                ))}
              </Stack>
            </motion.div>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
