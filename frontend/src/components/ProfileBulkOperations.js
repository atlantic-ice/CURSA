import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Checkbox,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    ListItemIcon,
    Divider,
    Chip,
    CircularProgress,
    Alert,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    useTheme,
    alpha,
    Collapse,
    IconButton
} from '@mui/material';
import axios from 'axios';
import { motion } from 'framer-motion';

// Icons
import SelectAllIcon from '@mui/icons-material/SelectAll';
import DeselectIcon from '@mui/icons-material/Deselect';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import VerifiedIcon from '@mui/icons-material/Verified';
import SchoolIcon from '@mui/icons-material/School';

const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE = isLocal ? '' : (process.env.REACT_APP_API_BASE || 'https://cursa.onrender.com');

export default function ProfileBulkOperations({ profiles, onClose, onComplete }) {
    const theme = useTheme();
    const [selectedIds, setSelectedIds] = useState([]);
    const [operation, setOperation] = useState('validate');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [showUpdateDialog, setShowUpdateDialog] = useState(false);
    
    // Изменения для массового обновления
    const [updateChanges, setUpdateChanges] = useState({
        field: 'rules.line_spacing',
        value: '1.5'
    });

    const handleSelectAll = () => {
        if (selectedIds.length === profiles.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(profiles.map(p => p.id));
        }
    };

    const handleToggle = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleSelectCategory = (category) => {
        const categoryProfiles = profiles.filter(p => p.category === category);
        const categoryIds = categoryProfiles.map(p => p.id);
        
        // Если все профили категории уже выбраны - снимаем выбор
        if (categoryIds.every(id => selectedIds.includes(id))) {
            setSelectedIds(selectedIds.filter(id => !categoryIds.includes(id)));
        } else {
            // Иначе добавляем все профили категории
            setSelectedIds([...new Set([...selectedIds, ...categoryIds])]);
        }
    };

    const handleValidate = async () => {
        if (selectedIds.length === 0) return;
        
        setLoading(true);
        setResults(null);
        
        try {
            const res = await axios.post(`${API_BASE}/api/profiles/bulk/validate`, {
                profile_ids: selectedIds
            });
            setResults({
                type: 'validate',
                data: res.data
            });
        } catch (err) {
            console.error('Error validating:', err);
            setResults({
                type: 'error',
                message: err.response?.data?.error || 'Ошибка валидации'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (selectedIds.length === 0) return;
        
        // Парсим путь к полю и значение
        const parts = updateChanges.field.split('.');
        let changes = {};
        let current = changes;
        
        for (let i = 0; i < parts.length - 1; i++) {
            current[parts[i]] = {};
            current = current[parts[i]];
        }
        
        // Преобразуем значение в нужный тип
        let value = updateChanges.value;
        if (!isNaN(parseFloat(value)) && isFinite(value)) {
            value = parseFloat(value);
        } else if (value.toLowerCase() === 'true') {
            value = true;
        } else if (value.toLowerCase() === 'false') {
            value = false;
        }
        
        current[parts[parts.length - 1]] = value;
        
        setLoading(true);
        setResults(null);
        setShowUpdateDialog(false);
        
        try {
            const res = await axios.post(`${API_BASE}/api/profiles/bulk/update`, {
                profile_ids: selectedIds,
                changes: changes
            });
            setResults({
                type: 'update',
                data: res.data
            });
            if (onComplete) {
                onComplete();
            }
        } catch (err) {
            console.error('Error updating:', err);
            setResults({
                type: 'error',
                message: err.response?.data?.error || 'Ошибка обновления'
            });
        } finally {
            setLoading(false);
        }
    };

    const runOperation = () => {
        if (operation === 'validate') {
            handleValidate();
        } else if (operation === 'update') {
            setShowUpdateDialog(true);
        }
    };

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'gost': return <VerifiedIcon fontSize="small" color="success" />;
            case 'university': return <SchoolIcon fontSize="small" color="info" />;
            default: return null;
        }
    };

    return (
        <Paper
            elevation={0}
            sx={{
                height: '100%',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: alpha(theme.palette.background.paper, 0.4),
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
            }}
        >
            {/* Header */}
            <Box sx={{ 
                p: 2, 
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <Typography variant="h6" fontWeight={700}>
                    Массовые операции
                </Typography>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </Box>

            {/* Controls */}
            <Box sx={{ p: 2, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                    <Button
                        size="small"
                        startIcon={selectedIds.length === profiles.length ? <DeselectIcon /> : <SelectAllIcon />}
                        onClick={handleSelectAll}
                        variant="outlined"
                    >
                        {selectedIds.length === profiles.length ? 'Снять выбор' : 'Выбрать все'}
                    </Button>
                    <Chip 
                        label="ГОСТ" 
                        size="small" 
                        onClick={() => handleSelectCategory('gost')}
                        color={profiles.filter(p => p.category === 'gost').every(p => selectedIds.includes(p.id)) ? 'success' : 'default'}
                        variant="outlined"
                    />
                    <Chip 
                        label="Университеты" 
                        size="small" 
                        onClick={() => handleSelectCategory('university')}
                        color={profiles.filter(p => p.category === 'university').every(p => selectedIds.includes(p.id)) ? 'info' : 'default'}
                        variant="outlined"
                    />
                </Box>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Операция</InputLabel>
                        <Select
                            value={operation}
                            label="Операция"
                            onChange={(e) => setOperation(e.target.value)}
                        >
                            <MenuItem value="validate">Валидация</MenuItem>
                            <MenuItem value="update">Массовое обновление</MenuItem>
                        </Select>
                    </FormControl>
                    <Button
                        variant="contained"
                        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
                        onClick={runOperation}
                        disabled={loading || selectedIds.length === 0}
                    >
                        Выполнить ({selectedIds.length})
                    </Button>
                </Box>
            </Box>

            {/* Profile List */}
            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 1 }}>
                <List dense>
                    {profiles.map((profile) => (
                        <ListItem
                            key={profile.id}
                            disablePadding
                            sx={{ mb: 0.5 }}
                        >
                            <ListItemButton
                                onClick={() => handleToggle(profile.id)}
                                selected={selectedIds.includes(profile.id)}
                                sx={{
                                    borderRadius: 1,
                                    '&.Mui-selected': {
                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                        '&:hover': {
                                            bgcolor: alpha(theme.palette.primary.main, 0.15)
                                        }
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 36 }}>
                                    <Checkbox
                                        edge="start"
                                        checked={selectedIds.includes(profile.id)}
                                        tabIndex={-1}
                                        disableRipple
                                        size="small"
                                    />
                                </ListItemIcon>
                                <ListItemIcon sx={{ minWidth: 28 }}>
                                    {getCategoryIcon(profile.category)}
                                </ListItemIcon>
                                <ListItemText
                                    primary={profile.name}
                                    secondary={profile.id}
                                    primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                                    secondaryTypographyProps={{ variant: 'caption' }}
                                />
                                {profile.is_system && (
                                    <Chip label="Системный" size="small" sx={{ fontSize: '0.65rem' }} />
                                )}
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </Box>

            {/* Results */}
            {results && (
                <Box sx={{ 
                    p: 2, 
                    borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    maxHeight: 300,
                    overflow: 'auto'
                }}>
                    {results.type === 'error' ? (
                        <Alert severity="error">{results.message}</Alert>
                    ) : results.type === 'validate' ? (
                        <Box>
                            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                <Chip
                                    icon={<CheckCircleIcon />}
                                    label={`${results.data.valid_count} валидных`}
                                    color="success"
                                    size="small"
                                />
                                <Chip
                                    icon={<ErrorIcon />}
                                    label={`${results.data.invalid_count} с ошибками`}
                                    color="error"
                                    size="small"
                                />
                                <Chip
                                    label={`Средний балл: ${Math.round(results.data.average_score)}%`}
                                    size="small"
                                />
                            </Box>
                            <List dense disablePadding>
                                {results.data.results.map((r) => (
                                    <ListItem 
                                        key={r.id} 
                                        sx={{ 
                                            py: 0.5, 
                                            px: 1, 
                                            borderRadius: 1,
                                            bgcolor: r.valid 
                                                ? alpha(theme.palette.success.main, 0.05)
                                                : alpha(theme.palette.error.main, 0.05),
                                            mb: 0.5
                                        }}
                                    >
                                        <ListItemIcon sx={{ minWidth: 28 }}>
                                            {r.valid ? (
                                                <CheckCircleIcon fontSize="small" color="success" />
                                            ) : (
                                                <ErrorIcon fontSize="small" color="error" />
                                            )}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={r.name || r.id}
                                            secondary={`Балл: ${r.score}% | Ошибок: ${r.issues_count} | Предупреждений: ${r.warnings_count}`}
                                            primaryTypographyProps={{ variant: 'body2' }}
                                            secondaryTypographyProps={{ variant: 'caption' }}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    ) : results.type === 'update' ? (
                        <Box>
                            <Alert 
                                severity={results.data.success ? 'success' : 'warning'}
                                sx={{ mb: 1 }}
                            >
                                Обновлено: {results.data.success_count} из {results.data.total}
                            </Alert>
                            {results.data.failed_count > 0 && (
                                <List dense disablePadding>
                                    {results.data.results.filter(r => !r.success).map((r) => (
                                        <ListItem key={r.id} sx={{ py: 0.25 }}>
                                            <ListItemIcon sx={{ minWidth: 28 }}>
                                                <ErrorIcon fontSize="small" color="error" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={r.id}
                                                secondary={r.error}
                                                primaryTypographyProps={{ variant: 'body2' }}
                                                secondaryTypographyProps={{ variant: 'caption', color: 'error' }}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </Box>
                    ) : null}
                </Box>
            )}

            {/* Update Dialog */}
            <Dialog
                open={showUpdateDialog}
                onClose={() => setShowUpdateDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Массовое обновление профилей</DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        Будет обновлено {selectedIds.length} профилей. Системные профили будут пропущены.
                    </Alert>
                    <TextField
                        fullWidth
                        label="Поле для изменения"
                        value={updateChanges.field}
                        onChange={(e) => setUpdateChanges({ ...updateChanges, field: e.target.value })}
                        helperText="Например: rules.line_spacing, rules.font.size, rules.margins.left"
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Новое значение"
                        value={updateChanges.value}
                        onChange={(e) => setUpdateChanges({ ...updateChanges, value: e.target.value })}
                        helperText="Число, строка или true/false"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowUpdateDialog(false)}>Отмена</Button>
                    <Button variant="contained" onClick={handleUpdate} startIcon={<EditIcon />}>
                        Применить изменения
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
}
