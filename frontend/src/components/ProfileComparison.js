import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    CircularProgress,
    Alert,
    IconButton,
    Tooltip,
    useTheme,
    alpha
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// Icons
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE = isLocal ? '' : (process.env.REACT_APP_API_BASE || 'https://cursa.onrender.com');

// Переводы путей правил
const RULE_TRANSLATIONS = {
    'rules.font.name': 'Шрифт: гарнитура',
    'rules.font.size': 'Шрифт: размер',
    'rules.font.color': 'Шрифт: цвет',
    'rules.margins.left': 'Поле: левое',
    'rules.margins.right': 'Поле: правое',
    'rules.margins.top': 'Поле: верхнее',
    'rules.margins.bottom': 'Поле: нижнее',
    'rules.line_spacing': 'Межстрочный интервал',
    'rules.first_line_indent': 'Отступ первой строки',
    'rules.paragraph_alignment': 'Выравнивание текста',
    'rules.headings.h1.font_size': 'Заголовок 1: размер',
    'rules.headings.h1.alignment': 'Заголовок 1: выравнивание',
    'rules.headings.h1.bold': 'Заголовок 1: жирный',
    'rules.headings.h1.all_caps': 'Заголовок 1: прописные',
    'rules.headings.h1.space_before': 'Заголовок 1: отступ до',
    'rules.headings.h1.space_after': 'Заголовок 1: отступ после',
    'rules.headings.h2.font_size': 'Заголовок 2: размер',
    'rules.headings.h2.alignment': 'Заголовок 2: выравнивание',
    'rules.headings.h2.first_line_indent': 'Заголовок 2: отступ',
    'rules.headings.h3.font_size': 'Заголовок 3: размер',
    'rules.tables.font_size': 'Таблицы: размер шрифта',
    'rules.tables.line_spacing': 'Таблицы: интервал',
    'rules.captions.font_size': 'Подписи: размер шрифта',
    'rules.captions.alignment': 'Подписи: выравнивание',
    'rules.captions.separator': 'Подписи: разделитель',
    'rules.lists.font_size': 'Списки: размер шрифта',
    'rules.lists.left_indent': 'Списки: отступ слева',
    'rules.footnotes.font_size': 'Сноски: размер шрифта',
    'rules.footnotes.line_spacing': 'Сноски: интервал'
};

const formatValue = (value) => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'boolean') return value ? 'Да' : 'Нет';
    if (Array.isArray(value)) return value.join(', ') || '—';
    return String(value);
};

export default function ProfileComparison({ profiles, onClose }) {
    const theme = useTheme();
    const [profile1Id, setProfile1Id] = useState('');
    const [profile2Id, setProfile2Id] = useState('');
    const [comparison, setComparison] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (profile1Id && profile2Id && profile1Id !== profile2Id) {
            fetchComparison();
        } else {
            setComparison(null);
        }
    }, [profile1Id, profile2Id]);

    const fetchComparison = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${API_BASE}/api/profiles/compare`, {
                params: { profile1: profile1Id, profile2: profile2Id }
            });
            setComparison(res.data);
        } catch (err) {
            console.error('Error comparing profiles:', err);
            setError(err.response?.data?.error || 'Ошибка сравнения профилей');
        } finally {
            setLoading(false);
        }
    };

    const handleSwap = () => {
        const temp = profile1Id;
        setProfile1Id(profile2Id);
        setProfile2Id(temp);
    };

    return (
        <Paper
            elevation={0}
            sx={{
                height: '100%',
                borderRadius: 3,
                bgcolor: alpha(theme.palette.background.paper, 0.6),
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}
        >
            {/* Header */}
            <Box sx={{
                p: 3,
                borderBottom: `1px solid ${theme.palette.divider}`,
                bgcolor: alpha(theme.palette.primary.main, 0.05)
            }}>
                <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <CompareArrowsIcon color="primary" />
                    Сравнение профилей
                </Typography>

                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={5}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Профиль 1</InputLabel>
                            <Select
                                value={profile1Id}
                                label="Профиль 1"
                                onChange={(e) => setProfile1Id(e.target.value)}
                            >
                                <MenuItem value="">Выберите...</MenuItem>
                                {profiles.map(p => (
                                    <MenuItem key={p.id} value={p.id} disabled={p.id === profile2Id}>
                                        {p.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={2} sx={{ textAlign: 'center' }}>
                        <Tooltip title="Поменять местами">
                            <IconButton 
                                onClick={handleSwap}
                                disabled={!profile1Id || !profile2Id}
                                sx={{
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                                }}
                            >
                                <SwapHorizIcon />
                            </IconButton>
                        </Tooltip>
                    </Grid>
                    <Grid item xs={5}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Профиль 2</InputLabel>
                            <Select
                                value={profile2Id}
                                label="Профиль 2"
                                onChange={(e) => setProfile2Id(e.target.value)}
                            >
                                <MenuItem value="">Выберите...</MenuItem>
                                {profiles.map(p => (
                                    <MenuItem key={p.id} value={p.id} disabled={p.id === profile1Id}>
                                        {p.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </Box>

            {/* Content */}
            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                )}

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : !profile1Id || !profile2Id ? (
                    <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        py: 8,
                        color: 'text.secondary'
                    }}>
                        <CompareArrowsIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
                        <Typography>Выберите два профиля для сравнения</Typography>
                    </Box>
                ) : profile1Id === profile2Id ? (
                    <Alert severity="warning">Выберите разные профили для сравнения</Alert>
                ) : comparison && (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`${profile1Id}-${profile2Id}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                        >
                            {/* Summary */}
                            <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
                                <Chip
                                    icon={comparison.total_differences === 0 ? <CheckCircleIcon /> : <RemoveCircleIcon />}
                                    label={comparison.total_differences === 0 
                                        ? 'Профили идентичны' 
                                        : `${comparison.total_differences} различий`
                                    }
                                    color={comparison.total_differences === 0 ? 'success' : 'warning'}
                                    variant="outlined"
                                />
                            </Box>

                            {comparison.total_differences > 0 && (
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 700 }}>Параметр</TableCell>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.info.main, 0.05) }}>
                                                    {comparison.profile1.name}
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.warning.main, 0.05) }}>
                                                    {comparison.profile2.name}
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {comparison.differences.map((diff, idx) => (
                                                <TableRow 
                                                    key={idx}
                                                    sx={{ 
                                                        '&:nth-of-type(odd)': { 
                                                            bgcolor: alpha(theme.palette.background.default, 0.5) 
                                                        }
                                                    }}
                                                >
                                                    <TableCell sx={{ fontWeight: 500 }}>
                                                        {RULE_TRANSLATIONS[diff.path] || diff.path}
                                                    </TableCell>
                                                    <TableCell sx={{ 
                                                        bgcolor: alpha(theme.palette.info.main, 0.05),
                                                        fontFamily: 'monospace'
                                                    }}>
                                                        {formatValue(diff.profile1_value)}
                                                    </TableCell>
                                                    <TableCell sx={{ 
                                                        bgcolor: alpha(theme.palette.warning.main, 0.05),
                                                        fontFamily: 'monospace'
                                                    }}>
                                                        {formatValue(diff.profile2_value)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </motion.div>
                    </AnimatePresence>
                )}
            </Box>
        </Paper>
    );
}
