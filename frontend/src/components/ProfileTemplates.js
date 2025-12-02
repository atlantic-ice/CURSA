import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    CardActions,
    Button,
    Chip,
    CircularProgress,
    useTheme,
    alpha
} from '@mui/material';
import { motion } from 'framer-motion';
import axios from 'axios';

// Icons
import ArticleIcon from '@mui/icons-material/Article';
import SchoolIcon from '@mui/icons-material/School';
import ScienceIcon from '@mui/icons-material/Science';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE = isLocal ? '' : (process.env.REACT_APP_API_BASE || 'https://cursa.onrender.com');

const TEMPLATE_ICONS = {
    minimal: <AutoAwesomeIcon />,
    coursework: <AssignmentIcon />,
    thesis: <SchoolIcon />,
    article: <ScienceIcon />,
    default: <ArticleIcon />
};

const TEMPLATE_COLORS = {
    minimal: 'info',
    coursework: 'primary',
    thesis: 'success',
    article: 'warning'
};

export default function ProfileTemplates({ onSelect, onClose }) {
    const theme = useTheme();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/profiles/templates`);
            setTemplates(res.data);
        } catch (err) {
            console.error('Error fetching templates:', err);
            // Fallback templates
            setTemplates([
                {
                    id: 'minimal',
                    name: 'Минимальный профиль',
                    description: 'Базовый набор правил без дополнительных требований',
                    category: 'custom'
                },
                {
                    id: 'coursework',
                    name: 'Курсовая работа',
                    description: 'Типичные требования для курсовых работ',
                    category: 'custom'
                },
                {
                    id: 'thesis',
                    name: 'Дипломная работа / ВКР',
                    description: 'Расширенные требования для ВКР',
                    category: 'custom'
                },
                {
                    id: 'article',
                    name: 'Научная статья',
                    description: 'Требования для научных публикаций',
                    category: 'custom'
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectTemplate = (template) => {
        if (onSelect) {
            onSelect(template);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

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
            <Box sx={{ mb: 3 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                    Выберите шаблон профиля
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Начните с готового шаблона и настройте под свои требования
                </Typography>
            </Box>

            <Grid container spacing={2}>
                {templates.map((template, idx) => (
                    <Grid item xs={12} sm={6} md={3} key={template.id}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <Card
                                elevation={0}
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                    borderRadius: 2,
                                    transition: 'all 0.2s',
                                    cursor: 'pointer',
                                    '&:hover': {
                                        borderColor: theme.palette.primary.main,
                                        transform: 'translateY(-4px)',
                                        boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`
                                    }
                                }}
                                onClick={() => handleSelectTemplate(template)}
                            >
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Box sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: 1, 
                                        mb: 1.5,
                                        color: `${TEMPLATE_COLORS[template.id] || 'primary'}.main`
                                    }}>
                                        <Box sx={{
                                            p: 1,
                                            borderRadius: 1.5,
                                            bgcolor: alpha(theme.palette[TEMPLATE_COLORS[template.id] || 'primary'].main, 0.1),
                                            display: 'flex'
                                        }}>
                                            {TEMPLATE_ICONS[template.id] || TEMPLATE_ICONS.default}
                                        </Box>
                                    </Box>
                                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                        {template.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {template.description}
                                    </Typography>
                                </CardContent>
                                <CardActions sx={{ p: 2, pt: 0 }}>
                                    <Button 
                                        size="small" 
                                        fullWidth
                                        variant="outlined"
                                        color={TEMPLATE_COLORS[template.id] || 'primary'}
                                    >
                                        Использовать
                                    </Button>
                                </CardActions>
                            </Card>
                        </motion.div>
                    </Grid>
                ))}
            </Grid>

            {/* Quick Tips */}
            <Box sx={{ mt: 3, p: 2, bgcolor: alpha(theme.palette.info.main, 0.05), borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    💡 <strong>Совет:</strong> Выберите шаблон, наиболее близкий к вашим требованиям. 
                    Вы сможете изменить любые параметры после создания профиля.
                </Typography>
            </Box>
        </Paper>
    );
}

ProfileTemplates.propTypes = {
    /** Колбэк создания профиля из шаблона */
    onCreateFromTemplate: PropTypes.func,
};

ProfileTemplates.defaultProps = {
    onCreateFromTemplate: undefined,
};
