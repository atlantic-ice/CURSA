import React, { useState, useCallback } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Stack,
    LinearProgress,
    Chip,
    Alert,
    Fade,
    Collapse,
    alpha
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CloudUploadOutlined,
    InsertDriveFileOutlined,
    CheckCircleOutlined,
    ErrorOutline,
    AutoFixHighOutlined
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

const MotionPaper = motion(Paper);
const MotionBox = motion(Box);

const UploadPageEnhanced = () => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [selectedProfile, setSelectedProfile] = useState('default_gost');

    const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
        if (rejectedFiles.length > 0) {
            setError('Поддерживаются только файлы .docx');
            return;
        }

        if (acceptedFiles.length > 0) {
            const uploadedFile = acceptedFiles[0];
            setFile(uploadedFile);
            setError(null);
            setResult(null);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
        },
        maxFiles: 1,
        multiple: false
    });

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setProgress(0);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('profile_name', selectedProfile);

        try {
            const response = await axios.post(
                `${process.env.REACT_APP_API_BASE || 'https://cursa.onrender.com'}/api/document/upload`,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setProgress(percentCompleted);
                    }
                }
            );

            setResult(response.data);
            setProgress(100);
        } catch (err) {
            setError(err.response?.data?.error || 'Произошла ошибка при загрузке файла');
        } finally {
            setUploading(false);
        }
    };

    const handleReset = () => {
        setFile(null);
        setResult(null);
        setError(null);
        setProgress(0);
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: (theme) => `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
                p: { xs: 2, md: 4 }
            }}
        >
            <Box sx={{ maxWidth: 900, mx: 'auto', py: 4 }}>
                {/* Header */}
                <MotionBox
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    sx={{ mb: 4, textAlign: 'center' }}
                >
                    <Typography
                        variant="h4"
                        sx={{
                            fontWeight: 700,
                            mb: 1,
                            background: (theme) => `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            color: 'transparent'
                        }}
                    >
                        Проверка документа
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Загрузите .docx файл для проверки на соответствие стандартам
                    </Typography>
                </MotionBox>

                {/* Upload Area */}
                <MotionPaper
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    elevation={0}
                    sx={{
                        p: 4,
                        borderRadius: 3,
                        mb: 3,
                        border: '2px solid',
                        borderColor: isDragReject ? 'error.main' : isDragActive ? 'primary.main' : 'divider',
                        background: isDragActive ? alpha('#1976d2', 0.05) : 'background.paper',
                        transition: 'all 0.3s ease'
                    }}
                >
                    {!file ? (
                        <Box {...getRootProps()} sx={{ cursor: 'pointer', textAlign: 'center' }}>
                            <input {...getInputProps()} />

                            <motion.div
                                animate={{
                                    y: isDragActive ? -10 : 0,
                                    scale: isDragActive ? 1.05 : 1
                                }}
                                transition={{ duration: 0.2 }}
                            >
                                <Box
                                    sx={{
                                        width: 80,
                                        height: 80,
                                        borderRadius: '50%',
                                        mx: 'auto',
                                        mb: 3,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                                        color: isDragReject ? 'error.main' : 'primary.main'
                                    }}
                                >
                                    <CloudUploadOutlined sx={{ fontSize: 48 }} />
                                </Box>
                            </motion.div>

                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                                {isDragReject
                                    ? 'Неподдерживаемый формат файла'
                                    : isDragActive
                                        ? 'Отпустите для загрузки'
                                        : 'Перетащите файл сюда'}
                            </Typography>

                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                или кликните для выбора файла (.docx, до 20 МБ)
                            </Typography>

                            <Button
                                variant="contained"
                                size="large"
                                sx={{
                                    px: 4,
                                    py: 1.5,
                                    borderRadius: 2,
                                    textTransform: 'none'
                                }}
                            >
                                Выбрать файл
                            </Button>
                        </Box>
                    ) : (
                        <AnimatePresence>
                            <MotionBox
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                                    <Box
                                        sx={{
                                            width: 56,
                                            height: 56,
                                            borderRadius: 2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                                            color: 'primary.main'
                                        }}
                                    >
                                        <InsertDriveFileOutlined sx={{ fontSize: 32 }} />
                                    </Box>

                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                            {file.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {(file.size / 1024 / 1024).toFixed(2)} МБ
                                        </Typography>
                                    </Box>

                                    {!uploading && !result && (
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            onClick={handleReset}
                                            sx={{ textTransform: 'none' }}
                                        >
                                            Удалить
                                        </Button>
                                    )}
                                </Stack>

                                {uploading && (
                                    <Box sx={{ mb: 2 }}>
                                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                Загрузка...
                                            </Typography>
                                            <Typography variant="body2" color="primary">
                                                {progress}%
                                            </Typography>
                                        </Stack>
                                        <LinearProgress variant="determinate" value={progress} sx={{ borderRadius: 1 }} />
                                    </Box>
                                )}

                                {!uploading && !result && (
                                    <Stack direction="row" spacing={2}>
                                        <Button
                                            variant="contained"
                                            fullWidth
                                            size="large"
                                            onClick={handleUpload}
                                            startIcon={<AutoFixHighOutlined />}
                                            sx={{
                                                py: 1.5,
                                                borderRadius: 2,
                                                textTransform: 'none'
                                            }}
                                        >
                                            Начать проверку
                                        </Button>
                                    </Stack>
                                )}
                            </MotionBox>
                        </AnimatePresence>
                    )}
                </MotionPaper>

                {/* Error Message */}
                <Collapse in={!!error}>
                    <Alert
                        severity="error"
                        icon={<ErrorOutline />}
                        sx={{ mb: 3, borderRadius: 2 }}
                        onClose={() => setError(null)}
                    >
                        {error}
                    </Alert>
                </Collapse>

                {/* Success Message */}
                <Collapse in={!!result}>
                    <Fade in={!!result}>
                        <Paper
                            sx={{
                                p: 4,
                                borderRadius: 3,
                                bgcolor: (theme) => alpha(theme.palette.success.main, 0.1),
                                border: '2px solid',
                                borderColor: 'success.main'
                            }}
                        >
                            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                                <CheckCircleOutlined sx={{ fontSize: 48, color: 'success.main' }} />
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                                        Проверка завершена!
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Документ успешно проанализирован
                                    </Typography>
                                </Box>
                            </Stack>

                            {result && (
                                <Box sx={{ mt: 3 }}>
                                    <Stack direction="row" spacing={2} flexWrap="wrap">
                                        <Chip
                                            label={`Найдено ошибок: ${result.errors?.length || 0}`}
                                            color={result.errors?.length > 0 ? 'warning' : 'success'}
                                            sx={{ fontWeight: 600 }}
                                        />
                                        <Chip
                                            label="Отчет готов"
                                            color="primary"
                                            sx={{ fontWeight: 600 }}
                                        />
                                    </Stack>

                                    <Button
                                        variant="contained"
                                        fullWidth
                                        size="large"
                                        sx={{ mt: 3, py: 1.5, borderRadius: 2, textTransform: 'none' }}
                                        onClick={() => window.open(result.report_url, '_blank')}
                                    >
                                        Просмотреть полный отчет
                                    </Button>

                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        sx={{ mt: 2, textTransform: 'none' }}
                                        onClick={handleReset}
                                    >
                                        Проверить другой документ
                                    </Button>
                                </Box>
                            )}
                        </Paper>
                    </Fade>
                </Collapse>
            </Box>
        </Box>
    );
};

export default UploadPageEnhanced;
