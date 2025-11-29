import React, { useState, useRef } from 'react';
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
    Divider,
    FormControlLabel,
    Checkbox,
    CircularProgress,
    useTheme,
    alpha
} from '@mui/material';
import axios from 'axios';

// Icons
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE = isLocal ? '' : (process.env.REACT_APP_API_BASE || 'https://cursa.onrender.com');

export default function ProfileImportExport({ selectedProfile, onImportSuccess, onClose }) {
    const theme = useTheme();
    const fileInputRef = useRef(null);
    
    const [resolveInheritance, setResolveInheritance] = useState(false);
    const [importing, setImporting] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const [error, setError] = useState(null);

    const handleExport = async () => {
        if (!selectedProfile) return;
        
        setExporting(true);
        setError(null);
        
        try {
            const response = await axios.get(
                `${API_BASE}/api/profiles/${selectedProfile.id}/export?resolve=${resolveInheritance}`,
                { responseType: 'blob' }
            );
            
            // Создаем ссылку для скачивания
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `profile_${selectedProfile.id}.json`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error exporting profile:', err);
            setError('Ошибка экспорта профиля');
        } finally {
            setExporting(false);
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelect = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        setImporting(true);
        setError(null);
        setImportResult(null);
        
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const response = await axios.post(`${API_BASE}/api/profiles/import`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            setImportResult({
                success: true,
                ...response.data
            });
            
            if (onImportSuccess) {
                onImportSuccess(response.data);
            }
        } catch (err) {
            console.error('Error importing profile:', err);
            setError(err.response?.data?.error || 'Ошибка импорта профиля');
            setImportResult({
                success: false,
                error: err.response?.data?.error || 'Ошибка импорта'
            });
        } finally {
            setImporting(false);
            event.target.value = ''; // Сброс input для повторного выбора того же файла
        }
    };

    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: alpha(theme.palette.background.paper, 0.6),
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
            }}
        >
            <Typography variant="h6" fontWeight={700} gutterBottom>
                Импорт / Экспорт профилей
            </Typography>
            
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}
            
            {importResult && (
                <Alert 
                    severity={importResult.success ? 'success' : 'error'} 
                    sx={{ mb: 2 }}
                    onClose={() => setImportResult(null)}
                    icon={importResult.success ? <CheckCircleIcon /> : <ErrorIcon />}
                >
                    {importResult.success 
                        ? `Профиль "${importResult.name}" успешно импортирован${importResult.warning ? `. ${importResult.warning}` : ''}`
                        : importResult.error
                    }
                </Alert>
            )}

            <Divider sx={{ my: 2 }} />

            {/* Export Section */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Экспорт профиля
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Скачайте выбранный профиль в формате JSON для резервного копирования или переноса.
                </Typography>
                
                {selectedProfile ? (
                    <Box sx={{ 
                        p: 2, 
                        bgcolor: alpha(theme.palette.primary.main, 0.05), 
                        borderRadius: 2,
                        mb: 2
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <InsertDriveFileIcon color="primary" />
                            <Typography fontWeight={600}>{selectedProfile.name}</Typography>
                        </Box>
                        
                        {selectedProfile.extends && (
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={resolveInheritance}
                                        onChange={(e) => setResolveInheritance(e.target.checked)}
                                        size="small"
                                    />
                                }
                                label={
                                    <Typography variant="body2">
                                        Раскрыть наследование (включить все параметры родительских профилей)
                                    </Typography>
                                }
                            />
                        )}
                    </Box>
                ) : (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        Выберите профиль для экспорта
                    </Alert>
                )}
                
                <Button
                    variant="contained"
                    startIcon={exporting ? <CircularProgress size={18} color="inherit" /> : <DownloadIcon />}
                    onClick={handleExport}
                    disabled={!selectedProfile || exporting}
                >
                    {exporting ? 'Экспорт...' : 'Скачать профиль'}
                </Button>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Import Section */}
            <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Импорт профиля
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Загрузите ранее экспортированный профиль в формате JSON.
                </Typography>
                
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept=".json"
                    style={{ display: 'none' }}
                />
                
                <Button
                    variant="outlined"
                    startIcon={importing ? <CircularProgress size={18} /> : <UploadFileIcon />}
                    onClick={handleImportClick}
                    disabled={importing}
                >
                    {importing ? 'Импорт...' : 'Выбрать файл'}
                </Button>
                
                <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                    Поддерживаются файлы в формате JSON
                </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Tips */}
            <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Подсказки:
                </Typography>
                <List dense>
                    <ListItem sx={{ py: 0 }}>
                        <ListItemText 
                            primary="• Экспортированные профили можно редактировать в любом текстовом редакторе"
                            primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                        />
                    </ListItem>
                    <ListItem sx={{ py: 0 }}>
                        <ListItemText 
                            primary="• При импорте создаётся новый профиль, существующие не перезаписываются"
                            primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                        />
                    </ListItem>
                    <ListItem sx={{ py: 0 }}>
                        <ListItemText 
                            primary="• Системные профили (ГОСТ) нельзя изменить, но можно скопировать"
                            primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                        />
                    </ListItem>
                </List>
            </Box>
        </Paper>
    );
}
