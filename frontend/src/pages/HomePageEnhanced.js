import React from 'react';
import { Box, Typography, Button, Paper, Stack, Grid, Card, CardContent, alpha } from '@mui/material';
import { motion } from 'framer-motion';
import {
    CloudUploadOutlined,
    CheckCircleOutline,
    SpeedOutlined,
    SecurityOutlined,
    TrendingUpOutlined,
    AutoAwesomeOutlined
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Animated components
const MotionBox = motion(Box);
const MotionPaper = motion(Paper);
const MotionCard = motion(Card);

const HomePage = () => {
    const navigate = useNavigate();

    const features = [
        {
            icon: <SpeedOutlined sx={{ fontSize: 40 }} />,
            title: 'Быстрая проверка',
            description: 'Мгновенный анализ документа за секунды'
        },
        {
            icon: <CheckCircleOutline sx={{ fontSize: 40 }} />,
            title: 'Точность',
            description: 'Проверка по стандартам ГОСТ и университета'
        },
        {
            icon: <SecurityOutlined sx={{ fontSize: 40 }} />,
            title: 'Безопасность',
            description: 'Ваши документы остаются конфиденциальными'
        },
        {
            icon: <AutoAwesomeOutlined sx={{ fontSize: 40 }} />,
            title: 'Автоисправление',
            description: 'Автоматическое исправление найденных ошибок'
        }
    ];

    const stats = [
        { value: '10,000+', label: 'Проверенных документов' },
        { value: '99.8%', label: 'Точность проверки' },
        { value: '<5s', label: 'Среднее время проверки' },
        { value: '24/7', label: 'Доступность сервиса' }
    ];

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: (theme) => `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
                overflow: 'auto'
            }}
        >
            {/* Hero Section */}
            <Box
                sx={{
                    pt: { xs: 8, md: 12 },
                    pb: { xs: 6, md: 10 },
                    px: { xs: 2, md: 4 }
                }}
            >
                <MotionBox
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    sx={{ maxWidth: 1200, mx: 'auto', textAlign: 'center' }}
                >
                    <Typography
                        variant="h2"
                        sx={{
                            fontWeight: 800,
                            fontSize: { xs: '2.5rem', md: '3.5rem' },
                            mb: 2,
                            background: (theme) => `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            color: 'transparent'
                        }}
                    >
                        Нормоконтроль документов нового уровня
                    </Typography>

                    <Typography
                        variant="h6"
                        sx={{
                            color: 'text.secondary',
                            mb: 4,
                            maxWidth: 700,
                            mx: 'auto',
                            fontSize: { xs: '1rem', md: '1.25rem' }
                        }}
                    >
                        Проверяйте курсовые и дипломные работы на соответствие стандартам ГОСТ за считанные секунды
                    </Typography>

                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={2}
                        justifyContent="center"
                        sx={{ mb: 6 }}
                    >
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<CloudUploadOutlined />}
                            onClick={() => navigate('/upload')}
                            sx={{
                                px: 4,
                                py: 1.5,
                                borderRadius: 2,
                                fontSize: '1.1rem',
                                textTransform: 'none',
                                boxShadow: (theme) => `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
                                '&:hover': {
                                    boxShadow: (theme) => `0 12px 32px ${alpha(theme.palette.primary.main, 0.4)}`,
                                    transform: 'translateY(-2px)',
                                    transition: 'all 0.3s ease'
                                }
                            }}
                        >
                            Начать проверку
                        </Button>

                        <Button
                            variant="outlined"
                            size="large"
                            onClick={() => navigate('/examples')}
                            sx={{
                                px: 4,
                                py: 1.5,
                                borderRadius: 2,
                                fontSize: '1.1rem',
                                textTransform: 'none'
                            }}
                        >
                            Примеры проверок
                        </Button>
                    </Stack>

                    {/* Stats */}
                    <Grid container spacing={3} sx={{ mt: 2 }}>
                        {stats.map((stat, index) => (
                            <Grid item xs={6} md={3} key={index}>
                                <MotionBox
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.2 + index * 0.1, duration: 0.4 }}
                                >
                                    <Typography
                                        variant="h4"
                                        sx={{
                                            fontWeight: 700,
                                            color: 'primary.main',
                                            mb: 0.5
                                        }}
                                    >
                                        {stat.value}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {stat.label}
                                    </Typography>
                                </MotionBox>
                            </Grid>
                        ))}
                    </Grid>
                </MotionBox>
            </Box>

            {/* Features Section */}
            <Box sx={{ py: { xs: 6, md: 10 }, px: { xs: 2, md: 4 }, bgcolor: 'background.paper' }}>
                <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
                    <MotionBox
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        sx={{ textAlign: 'center', mb: 6 }}
                    >
                        <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
                            Почему выбирают CURSA?
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
                            Современный подход к проверке документов с использованием AI и автоматизации
                        </Typography>
                    </MotionBox>

                    <Grid container spacing={3}>
                        {features.map((feature, index) => (
                            <Grid item xs={12} sm={6} md={3} key={index}>
                                <MotionCard
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1, duration: 0.5 }}
                                    whileHover={{
                                        y: -8,
                                        boxShadow: (theme) => `0 12px 24px ${alpha(theme.palette.primary.main, 0.15)}`
                                    }}
                                    sx={{
                                        height: '100%',
                                        borderRadius: 2,
                                        transition: 'all 0.3s ease',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <CardContent sx={{ p: 3 }}>
                                        <Box
                                            sx={{
                                                width: 64,
                                                height: 64,
                                                borderRadius: 2,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                                                color: 'primary.main',
                                                mb: 2
                                            }}
                                        >
                                            {feature.icon}
                                        </Box>
                                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                                            {feature.title}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {feature.description}
                                        </Typography>
                                    </CardContent>
                                </MotionCard>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            </Box>

            {/* CTA Section */}
            <Box
                sx={{
                    py: { xs: 6, md: 10 },
                    px: { xs: 2, md: 4 },
                    background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
                }}
            >
                <MotionBox
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    sx={{
                        maxWidth: 800,
                        mx: 'auto',
                        textAlign: 'center',
                        color: 'white'
                    }}
                >
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
                        Готовы начать?
                    </Typography>
                    <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
                        Загрузите свой документ прямо сейчас и получите детальный отчет о соответствии стандартам
                    </Typography>
                    <Button
                        variant="contained"
                        size="large"
                        onClick={() => navigate('/upload')}
                        sx={{
                            bgcolor: 'white',
                            color: 'primary.main',
                            px: 6,
                            py: 2,
                            fontSize: '1.1rem',
                            textTransform: 'none',
                            borderRadius: 2,
                            '&:hover': {
                                bgcolor: alpha('#fff', 0.9),
                                transform: 'translateY(-2px)',
                                boxShadow: '0 12px 24px rgba(0,0,0,0.2)'
                            }
                        }}
                    >
                        Загрузить документ
                    </Button>
                </MotionBox>
            </Box>
        </Box >
    );
};

export default HomePage;
