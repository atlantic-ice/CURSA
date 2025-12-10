import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
    Box,
    Paper,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Tooltip,
    useTheme,
    alpha,
    Collapse,
    LinearProgress,
    Alert,
    Tabs,
    Tab,
    Badge,
    Stack
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';
import FormatSizeIcon from '@mui/icons-material/FormatSize';
import CropFreeIcon from '@mui/icons-material/CropFree';
import TitleIcon from '@mui/icons-material/Title';
import TableChartIcon from '@mui/icons-material/TableChart';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SettingsIcon from '@mui/icons-material/Settings';
import axios from 'axios';

const CATEGORIES = [
    { id: 'font', label: 'Шрифт', icon: <FormatSizeIcon fontSize="small" /> },
    { id: 'margins', label: 'Поля', icon: <CropFreeIcon fontSize="small" /> },
    { id: 'paragraph', label: 'Абзац', icon: <SettingsIcon fontSize="small" /> },
    { id: 'headings', label: 'Заголовки', icon: <TitleIcon fontSize="small" /> },
    { id: 'tables', label: 'Таблицы', icon: <TableChartIcon fontSize="small" /> },
    { id: 'bibliography', label: 'Библиография', icon: <MenuBookIcon fontSize="small" /> }
];

const FIELD_LABELS = {
    'font.name': 'Гарнитура',
    'font.size': 'Размер шрифта',
    'font.color': 'Цвет',
    'margins.left': 'Левое поле',
    'margins.right': 'Правое поле',
    'margins.top': 'Верхнее поле',
    'margins.bottom': 'Нижнее поле',
    'line_spacing': 'Межстрочный интервал',
    'first_line_indent': 'Абзацный отступ',
    'paragraph_alignment': 'Выравнивание',
    'headings.h1.font_size': 'H1 - Размер',
    'headings.h1.bold': 'H1 - Жирный',
    'headings.h1.alignment': 'H1 - Выравнивание',
    'headings.h1.all_caps': 'H1 - Прописные',
    'headings.h2.font_size': 'H2 - Размер',
    'headings.h2.bold': 'H2 - Жирный',
    'headings.h2.alignment': 'H2 - Выравнивание',
    'headings.h3.font_size': 'H3 - Размер',
    'headings.h3.bold': 'H3 - Жирный',
    'tables.font_size': 'Шрифт таблиц',
    'tables.line_spacing': 'Интервал таблиц',
    'tables.borders': 'Границы',
    'captions.font_size': 'Шрифт подписей',
    'captions.separator': 'Разделитель',
    'bibliography.style': 'Стиль',
    'bibliography.min_sources': 'Мин. источников',
    'bibliography.max_age_years': 'Макс. возраст',
    'bibliography.require_foreign': 'Иностранные',
    'bibliography.foreign_min_percent': 'Мин. % иностр.'
};

const getFieldCategory = (path) => {
    if (path.startsWith('font')) return 'font';
    if (path.startsWith('margins')) return 'margins';
    if (path.includes('line_spacing') || path.includes('indent') || path.includes('alignment')) return 'paragraph';
    if (path.startsWith('headings')) return 'headings';
    if (path.startsWith('tables') || path.startsWith('captions')) return 'tables';
    if (path.startsWith('bibliography')) return 'bibliography';
    return 'other';
};

const formatValue = (value) => {
    if (value === undefined || value === null) return '—';
    if (typeof value === 'boolean') return value ? 'Да' : 'Нет';
    if (typeof value === 'number') return value.toString();
    if (value === 'JUSTIFY') return 'По ширине';
    if (value === 'LEFT') return 'Слева';
    if (value === 'CENTER') return 'По центру';
    return String(value);
};

const flattenObject = (obj, prefix = '') => {
    const result = {};
    for (const [key, value] of Object.entries(obj || {})) {
        const path = prefix ? `${prefix}.${key}` : key;
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            Object.assign(result, flattenObject(value, path));
        } else {
            result[path] = value;
        }
    }
    return result;
};

export default function ProfileComparison({ profiles, onClose }) {
    const theme = useTheme();
    const [profile1Id, setProfile1Id] = useState('');
    const [profile2Id, setProfile2Id] = useState('');
    const [profile1Data, setProfile1Data] = useState(null);
    const [profile2Data, setProfile2Data] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const [showOnlyDiff, setShowOnlyDiff] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState({});

    useEffect(() => {
        if (profiles.length >= 2) {
            setProfile1Id(profiles[0].id);
            setProfile2Id(profiles[1].id);
        }
    }, [profiles]);

    const handleCompare = async () => {
        if (!profile1Id || !profile2Id) return;
        setLoading(true);
        setError(null);
        setProfile1Data(null);
        setProfile2Data(null);
        try {
            // Загружаем полные данные обоих профилей
            const [res1, res2] = await Promise.all([
                axios.get(`/api/profiles/${profile1Id}`),
                axios.get(`/api/profiles/${profile2Id}`)
            ]);
            setProfile1Data(res1.data);
            setProfile2Data(res2.data);
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.error || 'Ошибка сравнения профилей');
        } finally {
            setLoading(false);
        }
    };

    const handleSwap = () => {
        const temp = profile1Id;
        setProfile1Id(profile2Id);
        setProfile2Id(temp);
        // Swap loaded data too
        const tempData = profile1Data;
        setProfile1Data(profile2Data);
        setProfile2Data(tempData);
    };

    const differences = useMemo(() => {
        if (!profile1Data?.rules || !profile2Data?.rules) return [];
        
        const flat1 = flattenObject(profile1Data.rules);
        const flat2 = flattenObject(profile2Data.rules);
        const allKeys = new Set([...Object.keys(flat1), ...Object.keys(flat2)]);
        
        const diffs = [];
        for (const key of allKeys) {
            const val1 = flat1[key];
            const val2 = flat2[key];
            const isDifferent = JSON.stringify(val1) !== JSON.stringify(val2);
            diffs.push({
                path: key,
                label: FIELD_LABELS[key] || key,
                value1: val1,
                value2: val2,
                category: getFieldCategory(key),
                isDifferent
            });
        }
        return diffs.sort((a, b) => a.category.localeCompare(b.category));
    }, [profile1Data, profile2Data]);

    const stats = useMemo(() => {
        const total = differences.length;
        const different = differences.filter(d => d.isDifferent).length;
        const same = total - different;
        return { total, different, same, percent: total > 0 ? Math.round((same / total) * 100) : 100 };
    }, [differences]);

    const filteredDifferences = useMemo(() => {
        let result = differences;
        if (activeTab !== 'all') result = result.filter(d => d.category === activeTab);
        if (showOnlyDiff) result = result.filter(d => d.isDifferent);
        return result;
    }, [differences, activeTab, showOnlyDiff]);

    const categoryStats = useMemo(() => {
        const result = {};
        CATEGORIES.forEach(cat => {
            const catDiffs = differences.filter(d => d.category === cat.id);
            result[cat.id] = { total: catDiffs.length, different: catDiffs.filter(d => d.isDifferent).length };
        });
        return result;
    }, [differences]);

    const toggleCategory = (catId) => {
        setExpandedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
    };

    return (
        <Paper elevation={0} sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3, bgcolor: alpha(theme.palette.background.paper, 0.6), border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, overflow: 'hidden' }}>
            {/* Header */}
            <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.info.main, 0.03) }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CompareArrowsIcon color="info" />
                        <Typography variant="h6" fontWeight={700}>Сравнение профилей</Typography>
                    </Box>
                    <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <FormControl size="small" sx={{ minWidth: 200, flex: 1 }}>
                        <InputLabel>Профиль 1</InputLabel>
                        <Select value={profile1Id} label="Профиль 1" onChange={(e) => { setProfile1Id(e.target.value); setProfile1Data(null); }}>
                            {profiles.map(p => <MenuItem key={p.id} value={p.id} disabled={p.id === profile2Id}>{p.name}</MenuItem>)}
                        </Select>
                    </FormControl>
                    
                    <Tooltip title="Поменять местами">
                        <IconButton onClick={handleSwap} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) } }}>
                            <SwapHorizIcon />
                        </IconButton>
                    </Tooltip>
                    
                    <FormControl size="small" sx={{ minWidth: 200, flex: 1 }}>
                        <InputLabel>Профиль 2</InputLabel>
                        <Select value={profile2Id} label="Профиль 2" onChange={(e) => { setProfile2Id(e.target.value); setProfile2Data(null); }}>
                            {profiles.map(p => <MenuItem key={p.id} value={p.id} disabled={p.id === profile1Id}>{p.name}</MenuItem>)}
                        </Select>
                    </FormControl>
                    
                    <Button variant="contained" onClick={handleCompare} disabled={!profile1Id || !profile2Id || loading} startIcon={<CompareArrowsIcon />}>
                        Сравнить
                    </Button>
                </Box>
            </Box>

            {loading && <LinearProgress />}
            {error && <Alert severity="error" onClose={() => setError(null)} sx={{ m: 2, mb: 0 }}>{error}</Alert>}

            {profile1Data && profile2Data && (
                <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    {/* Stats */}
                    <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                            <Box sx={{ textAlign: 'center', minWidth: 100 }}>
                                <Typography variant="h4" fontWeight={700} color={stats.percent > 80 ? 'success.main' : stats.percent > 50 ? 'warning.main' : 'error.main'}>
                                    {stats.percent}%
                                </Typography>
                                <Typography variant="caption" color="text.secondary">Совпадение</Typography>
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 200 }}>
                                <LinearProgress variant="determinate" value={stats.percent} sx={{ height: 8, borderRadius: 4, bgcolor: alpha(theme.palette.error.main, 0.2), '& .MuiLinearProgress-bar': { bgcolor: stats.percent > 80 ? 'success.main' : stats.percent > 50 ? 'warning.main' : 'error.main' } }} />
                            </Box>
                            <Stack direction="row" spacing={1}>
                                <Chip icon={<CheckCircleIcon />} label={`${stats.same} совпадает`} color="success" variant="outlined" size="small" />
                                <Chip icon={<ErrorIcon />} label={`${stats.different} различий`} color="error" variant="outlined" size="small" />
                            </Stack>
                            <Button size="small" variant={showOnlyDiff ? 'contained' : 'outlined'} onClick={() => setShowOnlyDiff(!showOnlyDiff)}>
                                Только различия
                            </Button>
                        </Stack>
                    </Box>

                    {/* Tabs */}
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto">
                            <Tab value="all" label={<Badge badgeContent={stats.different} color="error" max={99}><Box sx={{ pr: 1.5 }}>Все</Box></Badge>} />
                            {CATEGORIES.map(cat => (
                                <Tab key={cat.id} value={cat.id} icon={cat.icon} iconPosition="start" label={<Badge badgeContent={categoryStats[cat.id]?.different || 0} color="error" max={99}><Box sx={{ pr: 1.5 }}>{cat.label}</Box></Badge>} />
                            ))}
                        </Tabs>
                    </Box>

                    {/* Comparison Table */}
                    <TableContainer sx={{ flexGrow: 1, overflow: 'auto' }}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700, width: 250 }}>Параметр</TableCell>
                                    <TableCell sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>{profile1Data.name}</TableCell>
                                    <TableCell sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.secondary.main, 0.05) }}>{profile2Data.name}</TableCell>
                                    <TableCell sx={{ fontWeight: 700, width: 80, textAlign: 'center' }}>Статус</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <AnimatePresence>
                                    {filteredDifferences.map((diff, idx) => (
                                        <motion.tr key={diff.path} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: idx * 0.02 }} component={TableRow} sx={{ '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.05) }, bgcolor: diff.isDifferent ? alpha(theme.palette.error.main, 0.02) : 'transparent' }}>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={diff.isDifferent ? 600 : 400}>{diff.label}</Typography>
                                                <Typography variant="caption" color="text.secondary">{diff.path}</Typography>
                                            </TableCell>
                                            <TableCell sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02), fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                                {formatValue(diff.value1)}
                                            </TableCell>
                                            <TableCell sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.02), fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                                {formatValue(diff.value2)}
                                            </TableCell>
                                            <TableCell align="center">
                                                {diff.isDifferent ? (
                                                    <Tooltip title="Различие"><ErrorIcon color="error" fontSize="small" /></Tooltip>
                                                ) : (
                                                    <Tooltip title="Совпадает"><CheckCircleIcon color="success" fontSize="small" /></Tooltip>
                                                )}
                                            </TableCell>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                                {filteredDifferences.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                                            <Typography color="text.secondary">
                                                {showOnlyDiff ? 'Различий не найдено' : 'Выберите категорию'}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}

            {!profile1Data && !profile2Data && !loading && (
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
                    <Box sx={{ textAlign: 'center' }}>
                        <CompareArrowsIcon sx={{ fontSize: 64, color: alpha(theme.palette.text.secondary, 0.3), mb: 2 }} />
                        <Typography color="text.secondary">Выберите два профиля для сравнения</Typography>
                    </Box>
                </Box>
            )}
        </Paper>
    );
}

ProfileComparison.propTypes = {
    profiles: PropTypes.array.isRequired,
    onClose: PropTypes.func.isRequired
};
