import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    ListItemIcon,
    IconButton,
    Chip,
    CircularProgress,
    Divider,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    useTheme,
    alpha,
    Collapse,
    Alert
} from '@mui/material';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

// Icons
import HistoryIcon from '@mui/icons-material/History';
import RestoreIcon from '@mui/icons-material/Restore';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RefreshIcon from '@mui/icons-material/Refresh';

const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE = isLocal ? '' : (process.env.REACT_APP_API_BASE || 'https://cursa.onrender.com');

export default function ProfileHistory({ profileId, profileName, isSystemProfile, onRestore }) {
    const theme = useTheme();
    const [loading, setLoading] = useState(false);
    const [versions, setVersions] = useState([]);
    const [expanded, setExpanded] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
    const [selectedVersion, setSelectedVersion] = useState(null);
    const [restoring, setRestoring] = useState(false);

    const fetchHistory = async () => {
        if (!profileId) return;
        
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/api/profiles/${profileId}/history`);
            setVersions(res.data.versions || []);
        } catch (err) {
            console.error('Error fetching history:', err);
            setVersions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (expanded && profileId) {
            fetchHistory();
        }
    }, [profileId, expanded]);

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Неизвестно';
        const date = new Date(timestamp);
        return date.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handlePreview = async (version) => {
        try {
            const res = await axios.get(
                `${API_BASE}/api/profiles/${profileId}/history/${version.filename}`
            );
            setPreviewData(res.data);
            setPreviewOpen(true);
        } catch (err) {
            console.error('Error loading version:', err);
            alert('Не удалось загрузить версию');
        }
    };

    const handleRestoreClick = (version) => {
        setSelectedVersion(version);
        setRestoreConfirmOpen(true);
    };

    const handleRestoreConfirm = async () => {
        if (!selectedVersion) return;
        
        setRestoring(true);
        try {
            await axios.post(
                `${API_BASE}/api/profiles/${profileId}/restore/${selectedVersion.filename}`
            );
            setRestoreConfirmOpen(false);
            setSelectedVersion(null);
            if (onRestore) {
                onRestore();
            }
            fetchHistory();
        } catch (err) {
            console.error('Error restoring:', err);
            alert('Ошибка при восстановлении: ' + (err.response?.data?.error || err.message));
        } finally {
            setRestoring(false);
        }
    };

    if (!profileId) return null;

    return (
        <>
            <Paper
                elevation={0}
                sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.background.paper, 0.4),
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                }}
            >
                <Box 
                    sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        cursor: 'pointer'
                    }}
                    onClick={() => setExpanded(!expanded)}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <HistoryIcon color="action" fontSize="small" />
                        <Typography variant="subtitle2" fontWeight={600}>
                            История версий
                        </Typography>
                        {versions.length > 0 && (
                            <Chip 
                                label={versions.length} 
                                size="small" 
                                sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                        )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {expanded && (
                            <Tooltip title="Обновить">
                                <IconButton 
                                    size="small" 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        fetchHistory();
                                    }}
                                >
                                    <RefreshIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
                        {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </Box>
                </Box>

                <Collapse in={expanded}>
                    <Box sx={{ mt: 2 }}>
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                                <CircularProgress size={24} />
                            </Box>
                        ) : versions.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                                История версий пуста
                            </Typography>
                        ) : (
                            <List dense disablePadding>
                                <AnimatePresence>
                                    {versions.map((version, idx) => (
                                        <motion.div
                                            key={version.filename}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                        >
                                            <ListItem
                                                disablePadding
                                                secondaryAction={
                                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                        <Tooltip title="Просмотр">
                                                            <IconButton 
                                                                size="small"
                                                                onClick={() => handlePreview(version)}
                                                            >
                                                                <VisibilityIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        {!isSystemProfile && (
                                                            <Tooltip title="Восстановить">
                                                                <IconButton 
                                                                    size="small"
                                                                    color="primary"
                                                                    onClick={() => handleRestoreClick(version)}
                                                                >
                                                                    <RestoreIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                    </Box>
                                                }
                                            >
                                                <ListItemButton sx={{ borderRadius: 1, py: 0.5 }}>
                                                    <ListItemIcon sx={{ minWidth: 32 }}>
                                                        <AccessTimeIcon fontSize="small" color="action" />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={formatDate(version.timestamp)}
                                                        secondary={version.version ? `v${version.version}` : null}
                                                        primaryTypographyProps={{ variant: 'body2' }}
                                                        secondaryTypographyProps={{ variant: 'caption' }}
                                                    />
                                                </ListItemButton>
                                            </ListItem>
                                            {idx < versions.length - 1 && (
                                                <Divider sx={{ my: 0.5 }} />
                                            )}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </List>
                        )}
                    </Box>
                </Collapse>
            </Paper>

            {/* Preview Dialog */}
            <Dialog
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Просмотр версии
                    {previewData && (
                        <Typography variant="caption" display="block" color="text.secondary">
                            {formatDate(previewData._version_timestamp)}
                        </Typography>
                    )}
                </DialogTitle>
                <DialogContent dividers>
                    {previewData && (
                        <Box sx={{ 
                            fontFamily: 'monospace', 
                            fontSize: '0.85rem',
                            bgcolor: alpha(theme.palette.background.default, 0.5),
                            p: 2,
                            borderRadius: 1,
                            maxHeight: 400,
                            overflow: 'auto'
                        }}>
                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                                {JSON.stringify(previewData, null, 2)}
                            </pre>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPreviewOpen(false)}>
                        Закрыть
                    </Button>
                    {!isSystemProfile && previewData && (
                        <Button 
                            variant="contained" 
                            startIcon={<RestoreIcon />}
                            onClick={() => {
                                setPreviewOpen(false);
                                handleRestoreClick({ 
                                    filename: previewData._version_timestamp?.replace(/[:-]/g, '').replace('T', '_').split('.')[0] + '.json',
                                    timestamp: previewData._version_timestamp
                                });
                            }}
                        >
                            Восстановить
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            {/* Restore Confirmation Dialog */}
            <Dialog
                open={restoreConfirmOpen}
                onClose={() => setRestoreConfirmOpen(false)}
            >
                <DialogTitle>Восстановить версию?</DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        Текущая версия будет сохранена в историю
                    </Alert>
                    <Typography>
                        Восстановить профиль "{profileName}" из версии от{' '}
                        {selectedVersion && formatDate(selectedVersion.timestamp)}?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={() => setRestoreConfirmOpen(false)}
                        disabled={restoring}
                    >
                        Отмена
                    </Button>
                    <Button 
                        variant="contained" 
                        onClick={handleRestoreConfirm}
                        disabled={restoring}
                        startIcon={restoring ? <CircularProgress size={16} /> : <RestoreIcon />}
                    >
                        Восстановить
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
