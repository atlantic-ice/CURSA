import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
    Box,
    Paper,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Checkbox,
    IconButton,
    useTheme,
    alpha,
    LinearProgress,
    Alert,
    Chip,
    Stack,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloseIcon from '@mui/icons-material/Close';
import VerifiedIcon from '@mui/icons-material/Verified';
import CategoryIcon from '@mui/icons-material/Category';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import DeselectIcon from '@mui/icons-material/Deselect';
import axios from 'axios';

export default function ProfileBulkOperations({ profiles, onRefresh, onClose }) {
    const theme = useTheme();
    const [selected, setSelected] = useState([]);
    const [loading, setLoading] = useState(false);
    const [validating, setValidating] = useState(false);
    const [validationResults, setValidationResults] = useState({});
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
    const [newCategory, setNewCategory] = useState('custom');
    const [filterStatus, setFilterStatus] = useState('all');

    const isAllSelected = selected.length === profiles.length && profiles.length > 0;
    const isIndeterminate = selected.length > 0 && selected.length < profiles.length;

    const handleSelectAll = () => {
        if (isAllSelected) {
            setSelected([]);
        } else {
            setSelected(profiles.map(p => p.id));
        }
    };

    const handleSelect = (id) => {
        setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleValidateAll = async () => {
        setValidating(true);
        setError(null);
        const results = {};

        for (const profileId of selected) {
            try {
                const response = await axios.post(`/api/profiles/${profileId}/validate`);
                results[profileId] = { status: response.data.valid ? 'valid' : (response.data.warnings?.length > 0 ? 'warning' : 'error'), errors: response.data.errors || [], warnings: response.data.warnings || [] };
            } catch (err) {
                results[profileId] = { status: 'error', errors: [err.response?.data?.message || 'Ошибка валидации'], warnings: [] };
            }
        }

        setValidationResults(results);
        setValidating(false);
        setSuccess(`Валидация завершена для ${selected.length} профиле(й)`);
    };

    const handleBulkDelete = async () => {
        setLoading(true);
        setError(null);
        let deleted = 0;

        for (const profileId of selected) {
            try {
                await axios.delete(`/api/profiles/${profileId}`);
                deleted++;
            } catch (err) {
                console.error('Delete error:', err);
            }
        }

        setLoading(false);
        setDeleteDialogOpen(false);
        setSelected([]);
        setSuccess(`Удалено ${deleted} профиль(ей)`);
        onRefresh && onRefresh();
    };

    const handleBulkCategoryChange = async () => {
        setLoading(true);
        setError(null);
        let updated = 0;

        for (const profileId of selected) {
            const profile = profiles.find(p => p.id === profileId);
            if (profile) {
                try {
                    await axios.put(`/api/profiles/${profileId}`, { ...profile, category: newCategory });
                    updated++;
                } catch (err) {
                    console.error('Update error:', err);
                }
            }
        }

        setLoading(false);
        setCategoryDialogOpen(false);
        setSuccess(`Обновлено ${updated} профиль(ей)`);
        onRefresh && onRefresh();
    };

    const handleDuplicate = async () => {
        setLoading(true);
        setError(null);
        let duplicated = 0;

        for (const profileId of selected) {
            const profile = profiles.find(p => p.id === profileId);
            if (profile) {
                try {
                    const newProfile = { ...profile, name: `${profile.name} (копия)`, id: undefined };
                    await axios.post('/api/profiles', newProfile);
                    duplicated++;
                } catch (err) {
                    console.error('Duplicate error:', err);
                }
            }
        }

        setLoading(false);
        setSuccess(`Дублировано ${duplicated} профиль(ей)`);
        onRefresh && onRefresh();
    };

    const filteredProfiles = useMemo(() => {
        if (filterStatus === 'all') return profiles;
        return profiles.filter(p => {
            const result = validationResults[p.id];
            if (!result) return filterStatus === 'unchecked';
            return result.status === filterStatus;
        });
    }, [profiles, filterStatus, validationResults]);

    const stats = useMemo(() => {
        const total = profiles.length;
        let valid = 0, warning = 0, error = 0, unchecked = 0;
        profiles.forEach(p => {
            const r = validationResults[p.id];
            if (!r) unchecked++;
            else if (r.status === 'valid') valid++;
            else if (r.status === 'warning') warning++;
            else error++;
        });
        return { total, valid, warning, error, unchecked };
    }, [profiles, validationResults]);

    const getStatusIcon = (profileId) => {
        const result = validationResults[profileId];
        if (!result) return null;
        if (result.status === 'valid') return <CheckCircleIcon color="success" fontSize="small" />;
        if (result.status === 'warning') return <WarningIcon color="warning" fontSize="small" />;
        return <ErrorIcon color="error" fontSize="small" />;
    };

    return (
        <Paper elevation={0} sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3, bgcolor: alpha(theme.palette.background.paper, 0.6), border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, overflow: 'hidden' }}>
            {/* Header */}
            <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.secondary.main, 0.03) }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PlaylistAddCheckIcon color="secondary" />
                        <Typography variant="h6" fontWeight={700}>Массовые операции</Typography>
                        {selected.length > 0 && <Chip label={`Выбрано: ${selected.length}`} size="small" color="secondary" />}
                    </Box>
                    <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
                </Box>

                {/* Actions */}
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Button size="small" variant="outlined" startIcon={isAllSelected ? <DeselectIcon /> : <SelectAllIcon />} onClick={handleSelectAll}>
                        {isAllSelected ? 'Снять выбор' : 'Выбрать все'}
                    </Button>
                    <Divider orientation="vertical" flexItem />
                    <Button size="small" variant="contained" color="primary" startIcon={<VerifiedIcon />} onClick={handleValidateAll} disabled={selected.length === 0 || validating}>
                        {validating ? 'Проверка...' : 'Проверить'}
                    </Button>
                    <Button size="small" variant="outlined" startIcon={<CategoryIcon />} onClick={() => setCategoryDialogOpen(true)} disabled={selected.length === 0}>
                        Категория
                    </Button>
                    <Button size="small" variant="outlined" startIcon={<ContentCopyIcon />} onClick={handleDuplicate} disabled={selected.length === 0 || loading}>
                        Дублировать
                    </Button>
                    <Button size="small" variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => setDeleteDialogOpen(true)} disabled={selected.length === 0}>
                        Удалить
                    </Button>
                </Stack>
            </Box>

            {(loading || validating) && <LinearProgress color={validating ? 'primary' : 'secondary'} />}
            
            <AnimatePresence>
                {error && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><Alert severity="error" onClose={() => setError(null)} sx={{ m: 2, mb: 0 }}>{error}</Alert></motion.div>}
                {success && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><Alert severity="success" onClose={() => setSuccess(null)} sx={{ m: 2, mb: 0 }}>{success}</Alert></motion.div>}
            </AnimatePresence>

            {/* Stats */}
            {Object.keys(validationResults).length > 0 && (
                <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <Stack direction="row" spacing={1}>
                        <Chip icon={<CheckCircleIcon />} label={`Валидных: ${stats.valid}`} color="success" variant={filterStatus === 'valid' ? 'filled' : 'outlined'} size="small" onClick={() => setFilterStatus(filterStatus === 'valid' ? 'all' : 'valid')} />
                        <Chip icon={<WarningIcon />} label={`Предупр.: ${stats.warning}`} color="warning" variant={filterStatus === 'warning' ? 'filled' : 'outlined'} size="small" onClick={() => setFilterStatus(filterStatus === 'warning' ? 'all' : 'warning')} />
                        <Chip icon={<ErrorIcon />} label={`Ошибок: ${stats.error}`} color="error" variant={filterStatus === 'error' ? 'filled' : 'outlined'} size="small" onClick={() => setFilterStatus(filterStatus === 'error' ? 'all' : 'error')} />
                        <Chip label={`Не проверено: ${stats.unchecked}`} variant={filterStatus === 'unchecked' ? 'filled' : 'outlined'} size="small" onClick={() => setFilterStatus(filterStatus === 'unchecked' ? 'all' : 'unchecked')} />
                    </Stack>
                </Box>
            )}

            {/* Table */}
            <TableContainer sx={{ flexGrow: 1, overflow: 'auto' }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell padding="checkbox">
                                <Checkbox checked={isAllSelected} indeterminate={isIndeterminate} onChange={handleSelectAll} />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Название</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Категория</TableCell>
                            <TableCell sx={{ fontWeight: 700, width: 100, textAlign: 'center' }}>Статус</TableCell>
                            <TableCell sx={{ fontWeight: 700, width: 200 }}>Детали</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <AnimatePresence>
                            {filteredProfiles.map((profile, idx) => {
                                const result = validationResults[profile.id];
                                return (
                                    <motion.tr
                                        key={profile.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ delay: idx * 0.02 }}
                                        component={TableRow}
                                        hover
                                        selected={selected.includes(profile.id)}
                                        sx={{ cursor: 'pointer', '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.05) } }}
                                        onClick={() => handleSelect(profile.id)}
                                    >
                                        <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                                            <Checkbox checked={selected.includes(profile.id)} onChange={() => handleSelect(profile.id)} />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600}>{profile.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">{profile.description || '—'}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={profile.category === 'university' ? 'ВУЗ' : 'Пользов.'}
                                                size="small"
                                                color={profile.category === 'university' ? 'primary' : 'default'}
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            {getStatusIcon(profile.id) || <Typography variant="caption" color="text.disabled">—</Typography>}
                                        </TableCell>
                                        <TableCell>
                                            {result ? (
                                                <Box>
                                                    {result.errors.length > 0 && (
                                                        <Typography variant="caption" color="error.main" display="block" sx={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {result.errors[0]}
                                                        </Typography>
                                                    )}
                                                    {result.warnings.length > 0 && result.errors.length === 0 && (
                                                        <Typography variant="caption" color="warning.main" display="block" sx={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {result.warnings[0]}
                                                        </Typography>
                                                    )}
                                                    {result.status === 'valid' && <Typography variant="caption" color="success.main">Все в порядке</Typography>}
                                                </Box>
                                            ) : (
                                                <Typography variant="caption" color="text.disabled">Не проверено</Typography>
                                            )}
                                        </TableCell>
                                    </motion.tr>
                                );
                            })}
                        </AnimatePresence>
                        {filteredProfiles.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">
                                        {profiles.length === 0 ? 'Нет профилей' : 'Нет профилей с выбранным статусом'}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Подтверждение удаления</DialogTitle>
                <DialogContent>
                    <Typography>Вы уверены, что хотите удалить {selected.length} профиль(ей)?</Typography>
                    <Typography variant="body2" color="error" sx={{ mt: 1 }}>Это действие нельзя отменить.</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Отмена</Button>
                    <Button variant="contained" color="error" onClick={handleBulkDelete} disabled={loading}>
                        {loading ? 'Удаление...' : 'Удалить'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Category Dialog */}
            <Dialog open={categoryDialogOpen} onClose={() => setCategoryDialogOpen(false)}>
                <DialogTitle>Изменить категорию</DialogTitle>
                <DialogContent sx={{ minWidth: 300, pt: 2 }}>
                    <FormControl fullWidth>
                        <InputLabel>Категория</InputLabel>
                        <Select value={newCategory} label="Категория" onChange={(e) => setNewCategory(e.target.value)}>
                            <MenuItem value="custom">Пользовательский</MenuItem>
                            <MenuItem value="university">Требования ВУЗа</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCategoryDialogOpen(false)}>Отмена</Button>
                    <Button variant="contained" onClick={handleBulkCategoryChange} disabled={loading}>
                        {loading ? 'Обновление...' : 'Применить'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
}

ProfileBulkOperations.propTypes = {
    profiles: PropTypes.array.isRequired,
    onRefresh: PropTypes.func,
    onClose: PropTypes.func.isRequired
};
