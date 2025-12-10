import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import {
    Box,
    Paper,
    Typography,
    Button,
    Alert,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    useTheme,
    alpha,
    LinearProgress,
    Divider,
    Chip,
    Stack,
    Tabs,
    Tab,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Checkbox,
    FormControlLabel,
    Tooltip
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DescriptionIcon from '@mui/icons-material/Description';
import axios from 'axios';

const VALID_FIELDS = ['name', 'description', 'category', 'version', 'rules', 'university'];

const validateProfileData = (data) => {
    const errors = [];
    const warnings = [];

    if (!data.name || typeof data.name !== 'string') {
        errors.push('Отсутствует или некорректное название профиля');
    }
    if (!data.rules || typeof data.rules !== 'object') {
        errors.push('Отсутствуют правила оформления');
    } else {
        if (!data.rules.font) warnings.push('Не заданы настройки шрифта');
        if (!data.rules.margins) warnings.push('Не заданы поля страницы');
        if (!data.rules.headings) warnings.push('Не заданы настройки заголовков');
    }

    return { valid: errors.length === 0, errors, warnings };
};

export default function ProfileImportExport({ profiles, onImport, onClose, onRefresh }) {
    const theme = useTheme();
    const fileInputRef = useRef(null);
    const [activeTab, setActiveTab] = useState(0);
    const [importing, setImporting] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [pendingFiles, setPendingFiles] = useState([]);
    const [exportDialogOpen, setExportDialogOpen] = useState(false);
    const [selectedProfiles, setSelectedProfiles] = useState([]);
    const [exportFormat, setExportFormat] = useState('json');
    const [dragOver, setDragOver] = useState(false);

    const handleFileSelect = async (event) => {
        const files = Array.from(event.target.files || []);
        processFiles(files);
    };

    const handleDrop = (event) => {
        event.preventDefault();
        setDragOver(false);
        const files = Array.from(event.dataTransfer.files);
        processFiles(files);
    };

    const processFiles = async (files) => {
        const jsonFiles = files.filter(f => f.name.endsWith('.json'));
        if (jsonFiles.length === 0) {
            setError('Пожалуйста, выберите JSON файлы');
            return;
        }

        const processed = [];
        for (const file of jsonFiles) {
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                const validation = validateProfileData(data);
                processed.push({
                    file,
                    name: file.name,
                    data,
                    validation,
                    selected: validation.valid
                });
            } catch (err) {
                processed.push({
                    file,
                    name: file.name,
                    data: null,
                    validation: { valid: false, errors: ['Некорректный JSON формат'], warnings: [] },
                    selected: false
                });
            }
        }
        setPendingFiles(processed);
    };

    const handleImport = async () => {
        const toImport = pendingFiles.filter(f => f.selected && f.validation.valid);
        if (toImport.length === 0) {
            setError('Нет валидных файлов для импорта');
            return;
        }

        setImporting(true);
        setError(null);
        setSuccess(null);

        let successCount = 0;
        let failCount = 0;

        for (const item of toImport) {
            try {
                await axios.post('/api/profiles', item.data);
                successCount++;
            } catch (err) {
                failCount++;
            }
        }

        setImporting(false);
        if (successCount > 0) {
            setSuccess(`Успешно импортировано: ${successCount} профиль(ей)`);
            onRefresh && onRefresh();
            setPendingFiles([]);
        }
        if (failCount > 0) {
            setError(`Ошибка импорта: ${failCount} профиль(ей)`);
        }
    };

    const handleExport = async () => {
        if (selectedProfiles.length === 0) return;

        setExporting(true);
        setError(null);

        try {
            if (selectedProfiles.length === 1) {
                const profile = profiles.find(p => p.id === selectedProfiles[0]);
                const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${profile.name.replace(/\s+/g, '_')}.json`;
                a.click();
                URL.revokeObjectURL(url);
            } else {
                const selectedData = profiles.filter(p => selectedProfiles.includes(p.id));
                const blob = new Blob([JSON.stringify(selectedData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `profiles_export_${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
            }
            setSuccess('Экспорт завершён');
            setExportDialogOpen(false);
        } catch (err) {
            setError('Ошибка экспорта');
        } finally {
            setExporting(false);
        }
    };

    const copyToClipboard = async (profile) => {
        try {
            await navigator.clipboard.writeText(JSON.stringify(profile, null, 2));
            setSuccess(`Профиль "${profile.name}" скопирован в буфер`);
        } catch (err) {
            setError('Ошибка копирования');
        }
    };

    const toggleFileSelection = (index) => {
        setPendingFiles(prev => prev.map((f, i) => i === index ? { ...f, selected: !f.selected } : f));
    };

    const removeFile = (index) => {
        setPendingFiles(prev => prev.filter((_, i) => i !== index));
    };

    const toggleProfileSelection = (id) => {
        setSelectedProfiles(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
    };

    const selectAllProfiles = () => {
        if (selectedProfiles.length === profiles.length) {
            setSelectedProfiles([]);
        } else {
            setSelectedProfiles(profiles.map(p => p.id));
        }
    };

    return (
        <Paper elevation={0} sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3, bgcolor: alpha(theme.palette.background.paper, 0.6), border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, overflow: 'hidden' }}>
            {/* Header */}
            <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.warning.main, 0.03) }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CloudUploadIcon color="warning" />
                        <Typography variant="h6" fontWeight={700}>Импорт / Экспорт</Typography>
                    </Box>
                    <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
                </Box>
            </Box>

            {(importing || exporting) && <LinearProgress />}
            
            <AnimatePresence>
                {error && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <Alert severity="error" onClose={() => setError(null)} sx={{ m: 2, mb: 0 }}>{error}</Alert>
                    </motion.div>
                )}
                {success && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ m: 2, mb: 0 }}>{success}</Alert>
                    </motion.div>
                )}
            </AnimatePresence>

            <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Tab icon={<CloudUploadIcon />} iconPosition="start" label="Импорт" />
                <Tab icon={<CloudDownloadIcon />} iconPosition="start" label="Экспорт" />
            </Tabs>

            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
                {activeTab === 0 && (
                    <Box>
                        {/* Drop Zone */}
                        <Box
                            onDrop={handleDrop}
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onClick={() => fileInputRef.current?.click()}
                            sx={{
                                border: `2px dashed ${dragOver ? theme.palette.primary.main : alpha(theme.palette.divider, 0.3)}`,
                                borderRadius: 3,
                                p: 4,
                                textAlign: 'center',
                                cursor: 'pointer',
                                bgcolor: dragOver ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
                                transition: 'all 0.2s',
                                '&:hover': { borderColor: theme.palette.primary.main, bgcolor: alpha(theme.palette.primary.main, 0.02) }
                            }}
                        >
                            <input ref={fileInputRef} type="file" accept=".json" multiple hidden onChange={handleFileSelect} />
                            <FileUploadIcon sx={{ fontSize: 48, color: dragOver ? 'primary.main' : 'text.secondary', mb: 1 }} />
                            <Typography variant="h6" fontWeight={600} color={dragOver ? 'primary.main' : 'text.secondary'}>
                                {dragOver ? 'Отпустите файлы' : 'Перетащите JSON файлы сюда'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                или нажмите для выбора файлов
                            </Typography>
                        </Box>

                        {/* Pending Files */}
                        {pendingFiles.length > 0 && (
                            <Box sx={{ mt: 3 }}>
                                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                                    Файлы для импорта ({pendingFiles.filter(f => f.selected && f.validation.valid).length} из {pendingFiles.length})
                                </Typography>
                                <List sx={{ bgcolor: alpha(theme.palette.background.default, 0.5), borderRadius: 2 }}>
                                    <AnimatePresence>
                                        {pendingFiles.map((item, idx) => (
                                            <motion.div key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                                                <ListItem sx={{ borderBottom: idx < pendingFiles.length - 1 ? `1px solid ${theme.palette.divider}` : 'none' }}>
                                                    <Checkbox checked={item.selected && item.validation.valid} onChange={() => toggleFileSelection(idx)} disabled={!item.validation.valid} />
                                                    <ListItemIcon>
                                                        {item.validation.valid ? (
                                                            <InsertDriveFileIcon color="primary" />
                                                        ) : (
                                                            <ErrorIcon color="error" />
                                                        )}
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <Typography fontWeight={600}>{item.data?.name || item.name}</Typography>
                                                                {item.validation.valid ? (
                                                                    <Chip label="Валидный" size="small" color="success" variant="outlined" />
                                                                ) : (
                                                                    <Chip label="Ошибка" size="small" color="error" variant="outlined" />
                                                                )}
                                                            </Box>
                                                        }
                                                        secondary={
                                                            <Box>
                                                                {item.validation.errors.map((err, i) => (
                                                                    <Typography key={i} variant="caption" color="error.main" display="block">• {err}</Typography>
                                                                ))}
                                                                {item.validation.warnings.map((warn, i) => (
                                                                    <Typography key={i} variant="caption" color="warning.main" display="block">⚠ {warn}</Typography>
                                                                ))}
                                                            </Box>
                                                        }
                                                    />
                                                    <ListItemSecondaryAction>
                                                        <IconButton onClick={() => removeFile(idx)} size="small"><DeleteIcon /></IconButton>
                                                    </ListItemSecondaryAction>
                                                </ListItem>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </List>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    size="large"
                                    startIcon={<CloudUploadIcon />}
                                    onClick={(e) => { e.stopPropagation(); handleImport(); }}
                                    disabled={importing || pendingFiles.filter(f => f.selected && f.validation.valid).length === 0}
                                    sx={{ mt: 2 }}
                                >
                                    {importing ? 'Импорт...' : `Импортировать (${pendingFiles.filter(f => f.selected && f.validation.valid).length})`}
                                </Button>
                            </Box>
                        )}
                    </Box>
                )}

                {activeTab === 1 && (
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="subtitle2" fontWeight={700}>
                                Выберите профили для экспорта
                            </Typography>
                            <Button size="small" onClick={selectAllProfiles}>
                                {selectedProfiles.length === profiles.length ? 'Снять выбор' : 'Выбрать все'}
                            </Button>
                        </Box>

                        <List sx={{ bgcolor: alpha(theme.palette.background.default, 0.5), borderRadius: 2, mb: 2 }}>
                            {profiles.map((profile, idx) => (
                                <ListItem
                                    key={profile.id}
                                    sx={{ borderBottom: idx < profiles.length - 1 ? `1px solid ${theme.palette.divider}` : 'none', cursor: 'pointer' }}
                                    onClick={() => toggleProfileSelection(profile.id)}
                                >
                                    <Checkbox checked={selectedProfiles.includes(profile.id)} />
                                    <ListItemIcon><DescriptionIcon color="primary" /></ListItemIcon>
                                    <ListItemText
                                        primary={<Typography fontWeight={600}>{profile.name}</Typography>}
                                        secondary={profile.description || 'Без описания'}
                                    />
                                    <ListItemSecondaryAction>
                                        <Tooltip title="Копировать JSON">
                                            <IconButton onClick={(e) => { e.stopPropagation(); copyToClipboard(profile); }} size="small">
                                                <ContentCopyIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>

                        <Stack direction="row" spacing={2}>
                            <Button
                                variant="contained"
                                fullWidth
                                size="large"
                                startIcon={<FileDownloadIcon />}
                                onClick={(e) => { e.stopPropagation(); handleExport(); }}
                                disabled={exporting || selectedProfiles.length === 0}
                            >
                                {exporting ? 'Экспорт...' : `Экспортировать (${selectedProfiles.length})`}
                            </Button>
                        </Stack>
                    </Box>
                )}
            </Box>
        </Paper>
    );
}

ProfileImportExport.propTypes = {
    profiles: PropTypes.array.isRequired,
    onImport: PropTypes.func,
    onClose: PropTypes.func.isRequired,
    onRefresh: PropTypes.func
};
