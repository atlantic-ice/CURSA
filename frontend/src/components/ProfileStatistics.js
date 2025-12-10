import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    IconButton,
    useTheme,
    alpha,
    LinearProgress,
    Chip,
    Stack,
    Tooltip,
    ToggleButton,
    ToggleButtonGroup
} from '@mui/material';
import { motion } from 'framer-motion';
import BarChartIcon from '@mui/icons-material/BarChart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import DescriptionIcon from '@mui/icons-material/Description';
import CloseIcon from '@mui/icons-material/Close';
import TimelineIcon from '@mui/icons-material/Timeline';
import DonutLargeIcon from '@mui/icons-material/DonutLarge';
import SchoolIcon from '@mui/icons-material/School';
import AssignmentIcon from '@mui/icons-material/Assignment';

const StatCard = ({ title, value, subtitle, icon, color, trend, onClick }) => {
    const theme = useTheme();
    return (
        <motion.div whileHover={{ scale: 1.02, y: -2 }} transition={{ duration: 0.2 }}>
            <Card
                elevation={0}
                onClick={onClick}
                sx={{
                    border: `1px solid ${alpha(theme.palette[color]?.main || theme.palette.primary.main, 0.2)}`,
                    borderRadius: 3,
                    cursor: onClick ? 'pointer' : 'default',
                    height: '100%',
                    bgcolor: alpha(theme.palette[color]?.main || theme.palette.primary.main, 0.02),
                    transition: 'all 0.2s',
                    '&:hover': onClick ? { borderColor: theme.palette[color]?.main || theme.palette.primary.main, boxShadow: `0 4px 20px ${alpha(theme.palette[color]?.main || theme.palette.primary.main, 0.15)}` } : {}
                }}
            >
                <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha(theme.palette[color]?.main || theme.palette.primary.main, 0.1), color: theme.palette[color]?.main || theme.palette.primary.main }}>
                            {icon}
                        </Box>
                        {trend !== undefined && (
                            <Chip
                                size="small"
                                icon={trend >= 0 ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />}
                                label={`${trend >= 0 ? '+' : ''}${trend}%`}
                                color={trend >= 0 ? 'success' : 'error'}
                                variant="outlined"
                                sx={{ height: 22 }}
                            />
                        )}
                    </Box>
                    <Typography variant="h3" fontWeight={800} color={color ? `${color}.main` : 'text.primary'}>{value}</Typography>
                    <Typography variant="subtitle2" fontWeight={600} color="text.primary" sx={{ mt: 0.5 }}>{title}</Typography>
                    {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
                </CardContent>
            </Card>
        </motion.div>
    );
};

const BarChart = ({ data, color, maxValue }) => {
    const theme = useTheme();
    return (
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, height: 60 }}>
            {data.map((item, idx) => (
                <Tooltip key={idx} title={`${item.label}: ${item.value}`}>
                    <Box
                        sx={{
                            flex: 1,
                            height: `${(item.value / maxValue) * 100}%`,
                            minHeight: 4,
                            bgcolor: alpha(theme.palette[color]?.main || theme.palette.primary.main, 0.2 + (item.value / maxValue) * 0.6),
                            borderRadius: '4px 4px 0 0',
                            transition: 'height 0.3s ease',
                            cursor: 'pointer',
                            '&:hover': { bgcolor: theme.palette[color]?.main || theme.palette.primary.main }
                        }}
                    />
                </Tooltip>
            ))}
        </Box>
    );
};

const DonutChart = ({ segments, size = 120 }) => {
    const theme = useTheme();
    const total = segments.reduce((sum, s) => sum + s.value, 0);
    let currentAngle = -90;

    return (
        <Box sx={{ position: 'relative', width: size, height: size, mx: 'auto' }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {segments.map((segment, idx) => {
                    const angle = (segment.value / total) * 360;
                    const startAngle = currentAngle;
                    currentAngle += angle;

                    const radius = size / 2 - 10;
                    const cx = size / 2;
                    const cy = size / 2;

                    const startRad = (startAngle * Math.PI) / 180;
                    const endRad = ((startAngle + angle) * Math.PI) / 180;

                    const x1 = cx + radius * Math.cos(startRad);
                    const y1 = cy + radius * Math.sin(startRad);
                    const x2 = cx + radius * Math.cos(endRad);
                    const y2 = cy + radius * Math.sin(endRad);

                    const largeArc = angle > 180 ? 1 : 0;

                    return (
                        <path
                            key={idx}
                            d={`M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                            fill={segment.color}
                            stroke="#fff"
                            strokeWidth={2}
                            style={{ cursor: 'pointer' }}
                        />
                    );
                })}
                <circle cx={size / 2} cy={size / 2} r={size / 4} fill={theme.palette.background.paper} />
            </svg>
            <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <Typography variant="h6" fontWeight={700}>{total}</Typography>
                <Typography variant="caption" color="text.secondary">всего</Typography>
            </Box>
        </Box>
    );
};

export default function ProfileStatistics({ profiles, onClose }) {
    const theme = useTheme();
    const [viewType, setViewType] = useState('overview');

    const stats = useMemo(() => {
        const total = profiles.length;
        const byCategory = {};
        const byMonth = {};
        const validationStats = { valid: 0, warnings: 0, errors: 0 };
        let totalRules = 0;

        profiles.forEach(profile => {
            // By category
            const cat = profile.category || 'custom';
            byCategory[cat] = (byCategory[cat] || 0) + 1;

            // By creation date
            const date = profile.created_at || profile.updated_at;
            if (date) {
                const month = new Date(date).toLocaleString('ru', { month: 'short' });
                byMonth[month] = (byMonth[month] || 0) + 1;
            }

            // Count rules
            if (profile.rules) {
                totalRules += Object.keys(profile.rules).length;
            }

            // Validation status (mock)
            const rand = Math.random();
            if (rand > 0.8) validationStats.errors++;
            else if (rand > 0.5) validationStats.warnings++;
            else validationStats.valid++;
        });

        const avgRules = total > 0 ? Math.round(totalRules / total) : 0;

        return {
            total,
            byCategory,
            byMonth,
            validationStats,
            avgRules,
            recent: profiles.slice(0, 5),
            universitiesCount: profiles.filter(p => p.category === 'university').length,
            customCount: profiles.filter(p => p.category !== 'university').length
        };
    }, [profiles]);

    const categoryData = useMemo(() => {
        return [
            { label: 'ВУЗы', value: stats.universitiesCount, color: theme.palette.primary.main },
            { label: 'Пользов.', value: stats.customCount, color: theme.palette.secondary.main }
        ];
    }, [stats, theme]);

    const monthData = useMemo(() => {
        const months = Object.entries(stats.byMonth).slice(-6);
        return months.map(([label, value]) => ({ label, value }));
    }, [stats]);

    const maxMonthValue = Math.max(...monthData.map(m => m.value), 1);

    return (
        <Paper elevation={0} sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3, bgcolor: alpha(theme.palette.background.paper, 0.6), border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, overflow: 'hidden' }}>
            {/* Header */}
            <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.success.main, 0.03), display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BarChartIcon color="success" />
                    <Typography variant="h6" fontWeight={700}>Статистика профилей</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <ToggleButtonGroup value={viewType} exclusive onChange={(e, v) => v && setViewType(v)} size="small">
                        <ToggleButton value="overview"><TimelineIcon fontSize="small" /></ToggleButton>
                        <ToggleButton value="details"><DonutLargeIcon fontSize="small" /></ToggleButton>
                    </ToggleButtonGroup>
                    <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
                </Box>
            </Box>

            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
                {/* Main Stats */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6} sm={3}>
                        <StatCard title="Всего профилей" value={stats.total} icon={<DescriptionIcon />} color="primary" subtitle="активных" />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <StatCard title="Профили ВУЗов" value={stats.universitiesCount} icon={<SchoolIcon />} color="info" subtitle="университеты" />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <StatCard title="Пользовательские" value={stats.customCount} icon={<AssignmentIcon />} color="secondary" subtitle="созданные" />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <StatCard title="Правил в среднем" value={stats.avgRules} icon={<TrendingUpIcon />} color="success" subtitle="на профиль" />
                    </Grid>
                </Grid>

                <Grid container spacing={3}>
                    {/* Category Distribution */}
                    <Grid item xs={12} md={6}>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.background.default, 0.5), height: '100%' }}>
                            <Typography variant="subtitle2" fontWeight={700} gutterBottom>Распределение по категориям</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mt: 2 }}>
                                <DonutChart segments={categoryData} />
                                <Box sx={{ flex: 1 }}>
                                    {categoryData.map((item, idx) => (
                                        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: item.color }} />
                                            <Typography variant="body2" sx={{ flex: 1 }}>{item.label}</Typography>
                                            <Typography variant="body2" fontWeight={600}>{item.value}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                ({stats.total > 0 ? Math.round((item.value / stats.total) * 100) : 0}%)
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Validation Status */}
                    <Grid item xs={12} md={6}>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.background.default, 0.5), height: '100%' }}>
                            <Typography variant="subtitle2" fontWeight={700} gutterBottom>Статус валидации</Typography>
                            <Stack spacing={2} sx={{ mt: 2 }}>
                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <CheckCircleIcon fontSize="small" color="success" />
                                            <Typography variant="body2">Валидные</Typography>
                                        </Box>
                                        <Typography variant="body2" fontWeight={600}>{stats.validationStats.valid}</Typography>
                                    </Box>
                                    <LinearProgress variant="determinate" value={(stats.validationStats.valid / stats.total) * 100 || 0} color="success" sx={{ height: 8, borderRadius: 4 }} />
                                </Box>
                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <WarningIcon fontSize="small" color="warning" />
                                            <Typography variant="body2">С предупреждениями</Typography>
                                        </Box>
                                        <Typography variant="body2" fontWeight={600}>{stats.validationStats.warnings}</Typography>
                                    </Box>
                                    <LinearProgress variant="determinate" value={(stats.validationStats.warnings / stats.total) * 100 || 0} color="warning" sx={{ height: 8, borderRadius: 4 }} />
                                </Box>
                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <ErrorIcon fontSize="small" color="error" />
                                            <Typography variant="body2">С ошибками</Typography>
                                        </Box>
                                        <Typography variant="body2" fontWeight={600}>{stats.validationStats.errors}</Typography>
                                    </Box>
                                    <LinearProgress variant="determinate" value={(stats.validationStats.errors / stats.total) * 100 || 0} color="error" sx={{ height: 8, borderRadius: 4 }} />
                                </Box>
                            </Stack>
                        </Paper>
                    </Grid>

                    {/* Activity Chart */}
                    <Grid item xs={12}>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
                            <Typography variant="subtitle2" fontWeight={700} gutterBottom>Активность по месяцам</Typography>
                            {monthData.length > 0 ? (
                                <Box sx={{ mt: 2 }}>
                                    <BarChart data={monthData} color="primary" maxValue={maxMonthValue} />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                        {monthData.map((item, idx) => (
                                            <Typography key={idx} variant="caption" color="text.secondary" sx={{ flex: 1, textAlign: 'center' }}>
                                                {item.label}
                                            </Typography>
                                        ))}
                                    </Box>
                                </Box>
                            ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                                    Нет данных об активности
                                </Typography>
                            )}
                        </Paper>
                    </Grid>

                    {/* Recent Profiles */}
                    <Grid item xs={12}>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
                            <Typography variant="subtitle2" fontWeight={700} gutterBottom>Последние профили</Typography>
                            <Stack spacing={1} sx={{ mt: 2 }}>
                                {stats.recent.map((profile, idx) => (
                                    <motion.div key={profile.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.background.paper, 0.5), '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) } }}>
                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: profile.category === 'university' ? 'primary.main' : 'secondary.main' }} />
                                            <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>{profile.name}</Typography>
                                            <Chip label={profile.category === 'university' ? 'ВУЗ' : 'Пользов.'} size="small" variant="outlined" />
                                            {profile.updated_at && (
                                                <Typography variant="caption" color="text.secondary">
                                                    {new Date(profile.updated_at).toLocaleDateString('ru')}
                                                </Typography>
                                            )}
                                        </Box>
                                    </motion.div>
                                ))}
                                {stats.recent.length === 0 && (
                                    <Typography variant="body2" color="text.secondary" textAlign="center">Нет профилей</Typography>
                                )}
                            </Stack>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </Paper>
    );
}

ProfileStatistics.propTypes = {
    profiles: PropTypes.array.isRequired,
    onClose: PropTypes.func.isRequired
};
