import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Chip,
    CircularProgress,
    LinearProgress,
    useTheme,
    alpha,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemIcon
} from '@mui/material';
import axios from 'axios';
import { motion } from 'framer-motion';

// Icons
import BarChartIcon from '@mui/icons-material/BarChart';
import VerifiedIcon from '@mui/icons-material/Verified';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import FontDownloadIcon from '@mui/icons-material/FontDownload';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import UpdateIcon from '@mui/icons-material/Update';

const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE = isLocal ? '' : (process.env.REACT_APP_API_BASE || 'https://cursa.onrender.com');

const StatCard = ({ icon, title, value, subtitle, color, delay }) => {
    const theme = useTheme();
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
        >
            <Paper
                elevation={0}
                sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.background.paper, 0.4),
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    height: '100%'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <Box sx={{
                        p: 1,
                        borderRadius: 1.5,
                        bgcolor: alpha(color || theme.palette.primary.main, 0.1),
                        color: color || theme.palette.primary.main,
                        display: 'flex'
                    }}>
                        {icon}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        {title}
                    </Typography>
                </Box>
                <Typography variant="h4" fontWeight={800}>
                    {value}
                </Typography>
                {subtitle && (
                    <Typography variant="caption" color="text.secondary">
                        {subtitle}
                    </Typography>
                )}
            </Paper>
        </motion.div>
    );
};

export default function ProfileStatistics({ onClose }) {
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [validationStats, setValidationStats] = useState(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const [statsRes, validationRes] = await Promise.all([
                axios.get(`${API_BASE}/api/profiles/statistics`),
                axios.post(`${API_BASE}/api/profiles/bulk/validate`, { profile_ids: [] })
            ]);
            setStats(statsRes.data);
            setValidationStats(validationRes.data);
        } catch (err) {
            console.error('Error fetching stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit'
        });
    };

    if (loading) {
        return (
            <Paper
                elevation={0}
                sx={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha(theme.palette.background.paper, 0.4),
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                }}
            >
                <CircularProgress />
            </Paper>
        );
    }

    return (
        <Paper
            elevation={0}
            sx={{
                height: '100%',
                overflow: 'auto',
                bgcolor: alpha(theme.palette.background.paper, 0.4),
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                p: 3
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <BarChartIcon color="primary" />
                <Typography variant="h5" fontWeight={700}>
                    Статистика профилей
                </Typography>
            </Box>

            <Grid container spacing={2}>
                {/* Основные метрики */}
                <Grid item xs={6} md={3}>
                    <StatCard
                        icon={<BarChartIcon />}
                        title="Всего профилей"
                        value={stats?.total || 0}
                        delay={0.1}
                    />
                </Grid>
                <Grid item xs={6} md={3}>
                    <StatCard
                        icon={<VerifiedIcon />}
                        title="ГОСТ"
                        value={stats?.by_category?.gost || 0}
                        color={theme.palette.success.main}
                        delay={0.15}
                    />
                </Grid>
                <Grid item xs={6} md={3}>
                    <StatCard
                        icon={<SchoolIcon />}
                        title="Университеты"
                        value={stats?.by_category?.university || 0}
                        color={theme.palette.info.main}
                        delay={0.2}
                    />
                </Grid>
                <Grid item xs={6} md={3}>
                    <StatCard
                        icon={<PersonIcon />}
                        title="Пользовательские"
                        value={stats?.by_category?.custom || 0}
                        color={theme.palette.warning.main}
                        delay={0.25}
                    />
                </Grid>

                {/* Дополнительные метрики */}
                <Grid item xs={6} md={4}>
                    <StatCard
                        icon={<AccountTreeIcon />}
                        title="С наследованием"
                        value={stats?.with_inheritance || 0}
                        subtitle={`${stats?.total ? Math.round((stats?.with_inheritance / stats?.total) * 100) : 0}% от общего числа`}
                        delay={0.3}
                    />
                </Grid>
                <Grid item xs={6} md={4}>
                    <StatCard
                        icon={<MenuBookIcon />}
                        title="Ср. мин. источников"
                        value={Math.round(stats?.avg_min_sources || 0)}
                        subtitle="в библиографии"
                        delay={0.35}
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <StatCard
                        icon={<VerifiedIcon />}
                        title="Валидных профилей"
                        value={validationStats?.valid_count || 0}
                        subtitle={`из ${validationStats?.total || 0} проверенных`}
                        color={theme.palette.success.main}
                        delay={0.4}
                    />
                </Grid>

                {/* Используемые шрифты */}
                <Grid item xs={12} md={6}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45 }}
                    >
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                borderRadius: 2,
                                bgcolor: alpha(theme.palette.background.paper, 0.4),
                                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                height: '100%'
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <FontDownloadIcon color="action" fontSize="small" />
                                <Typography variant="subtitle2" fontWeight={600}>
                                    Используемые шрифты
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {Object.entries(stats?.fonts_used || {}).map(([font, count]) => (
                                    <Chip
                                        key={font}
                                        label={`${font} (${count})`}
                                        size="small"
                                        sx={{
                                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                                            color: 'primary.main'
                                        }}
                                    />
                                ))}
                            </Box>
                        </Paper>
                    </motion.div>
                </Grid>

                {/* Недавно обновленные */}
                <Grid item xs={12} md={6}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                borderRadius: 2,
                                bgcolor: alpha(theme.palette.background.paper, 0.4),
                                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                height: '100%'
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <UpdateIcon color="action" fontSize="small" />
                                <Typography variant="subtitle2" fontWeight={600}>
                                    Недавно обновленные
                                </Typography>
                            </Box>
                            <List dense disablePadding>
                                {(stats?.recently_updated || []).map((profile, idx) => (
                                    <ListItem key={profile.id} disablePadding sx={{ py: 0.25 }}>
                                        <ListItemText
                                            primary={profile.name}
                                            secondary={formatDate(profile.updated_at)}
                                            primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                                            secondaryTypographyProps={{ variant: 'caption' }}
                                        />
                                    </ListItem>
                                ))}
                                {(!stats?.recently_updated || stats.recently_updated.length === 0) && (
                                    <Typography variant="body2" color="text.secondary">
                                        Нет данных
                                    </Typography>
                                )}
                            </List>
                        </Paper>
                    </motion.div>
                </Grid>

                {/* Качество валидации */}
                <Grid item xs={12}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.55 }}
                    >
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                borderRadius: 2,
                                bgcolor: alpha(theme.palette.background.paper, 0.4),
                                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                            }}
                        >
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                Средняя оценка качества профилей
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ flexGrow: 1 }}>
                                    <LinearProgress
                                        variant="determinate"
                                        value={validationStats?.average_score || 0}
                                        sx={{
                                            height: 8,
                                            borderRadius: 4,
                                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                                            '& .MuiLinearProgress-bar': {
                                                borderRadius: 4,
                                                bgcolor: validationStats?.average_score >= 80 
                                                    ? 'success.main' 
                                                    : validationStats?.average_score >= 50 
                                                        ? 'warning.main' 
                                                        : 'error.main'
                                            }
                                        }}
                                    />
                                </Box>
                                <Typography variant="h6" fontWeight={700}>
                                    {Math.round(validationStats?.average_score || 0)}%
                                </Typography>
                            </Box>
                        </Paper>
                    </motion.div>
                </Grid>
            </Grid>
        </Paper>
    );
}
