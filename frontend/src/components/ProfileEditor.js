import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Grid,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Switch,
    FormControlLabel,
    Divider,
    Chip,
    Stack,
    Alert,
    Card,
    CardActionArea,
    useTheme,
    alpha,
    Stepper,
    Step,
    StepLabel,
    Slider,
    InputAdornment,
    Tooltip,
    IconButton,
    Collapse,
    LinearProgress
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SchoolIcon from '@mui/icons-material/School';
import ScienceIcon from '@mui/icons-material/Science';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ArticleIcon from '@mui/icons-material/Article';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FormatSizeIcon from '@mui/icons-material/FormatSize';
import CropFreeIcon from '@mui/icons-material/CropFree';
import TitleIcon from '@mui/icons-material/Title';
import TableChartIcon from '@mui/icons-material/TableChart';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SettingsIcon from '@mui/icons-material/Settings';

// Шаблоны профилей
const TEMPLATES = [
    {
        id: 'minimal',
        name: 'Минимальный',
        description: 'Базовые правила оформления',
        icon: <AutoAwesomeIcon />,
        color: 'info',
        rules: {
            font: { name: 'Times New Roman', size: 14.0, color: '000000' },
            margins: { left: 3.0, right: 1.5, top: 2.0, bottom: 2.0 },
            line_spacing: 1.5,
            first_line_indent: 1.25,
            paragraph_alignment: 'JUSTIFY',
            headings: {
                h1: { font_size: 14.0, bold: true, alignment: 'CENTER', all_caps: true, space_before: 0, space_after: 12, line_spacing: 1.5, keep_with_next: true },
                h2: { font_size: 14.0, bold: true, alignment: 'LEFT', first_line_indent: 1.25, space_before: 12, space_after: 12, line_spacing: 1.5, keep_with_next: true },
                h3: { font_size: 14.0, bold: true, alignment: 'LEFT', first_line_indent: 1.25, space_before: 12, space_after: 0, line_spacing: 1.5, keep_with_next: true }
            },
            tables: { font_size: 12.0, alignment: 'LEFT', line_spacing: 1.0, space_before: 0, space_after: 0, first_line_indent: 0, borders: true },
            captions: { font_size: 12.0, alignment: 'CENTER', space_before: 6, space_after: 12, first_line_indent: 0, line_spacing: 1.0, separator: ' – ' },
            lists: { font_size: 14.0, line_spacing: 1.5, alignment: 'JUSTIFY', first_line_indent: 0, left_indent: 1.25 },
            footnotes: { font_size: 10.0, line_spacing: 1.0, alignment: 'JUSTIFY' },
            required_sections: [],
            bibliography: { style: 'gost', font_size: 14.0, line_spacing: 1.5, hanging_indent: 1.25, sort_order: 'alphabetical', numbering: true, min_sources: 10, max_age_years: 10, require_foreign: false, foreign_min_percent: 0 }
        }
    },
    {
        id: 'coursework',
        name: 'Курсовая работа',
        description: 'Стандартные требования для курсовых',
        icon: <AssignmentIcon />,
        color: 'primary',
        rules: {
            font: { name: 'Times New Roman', size: 14.0, color: '000000' },
            margins: { left: 3.0, right: 1.0, top: 2.0, bottom: 2.0 },
            line_spacing: 1.5,
            first_line_indent: 1.25,
            paragraph_alignment: 'JUSTIFY',
            headings: {
                h1: { font_size: 14.0, bold: true, alignment: 'CENTER', all_caps: true, space_before: 0, space_after: 12, line_spacing: 1.5, keep_with_next: true },
                h2: { font_size: 14.0, bold: true, alignment: 'LEFT', first_line_indent: 1.25, space_before: 12, space_after: 12, line_spacing: 1.5, keep_with_next: true },
                h3: { font_size: 14.0, bold: true, alignment: 'LEFT', first_line_indent: 1.25, space_before: 12, space_after: 0, line_spacing: 1.5, keep_with_next: true }
            },
            tables: { font_size: 12.0, alignment: 'LEFT', line_spacing: 1.0, space_before: 0, space_after: 0, first_line_indent: 0, borders: true },
            captions: { font_size: 12.0, alignment: 'CENTER', space_before: 6, space_after: 12, first_line_indent: 0, line_spacing: 1.0, separator: ' – ' },
            lists: { font_size: 14.0, line_spacing: 1.5, alignment: 'JUSTIFY', first_line_indent: 0, left_indent: 1.25 },
            footnotes: { font_size: 10.0, line_spacing: 1.0, alignment: 'JUSTIFY' },
            required_sections: ['введение', 'заключение', 'список литературы'],
            bibliography: { style: 'gost', font_size: 14.0, line_spacing: 1.5, hanging_indent: 1.25, sort_order: 'alphabetical', numbering: true, min_sources: 15, max_age_years: 5, require_foreign: false, foreign_min_percent: 0 }
        }
    },
    {
        id: 'thesis',
        name: 'ВКР / Диплом',
        description: 'Расширенные требования для ВКР',
        icon: <SchoolIcon />,
        color: 'success',
        rules: {
            font: { name: 'Times New Roman', size: 14.0, color: '000000' },
            margins: { left: 3.0, right: 1.0, top: 2.0, bottom: 2.0 },
            line_spacing: 1.5,
            first_line_indent: 1.25,
            paragraph_alignment: 'JUSTIFY',
            headings: {
                h1: { font_size: 14.0, bold: true, alignment: 'CENTER', all_caps: true, space_before: 0, space_after: 12, line_spacing: 1.5, keep_with_next: true },
                h2: { font_size: 14.0, bold: true, alignment: 'LEFT', first_line_indent: 1.25, space_before: 12, space_after: 12, line_spacing: 1.5, keep_with_next: true },
                h3: { font_size: 14.0, bold: true, alignment: 'LEFT', first_line_indent: 1.25, space_before: 12, space_after: 0, line_spacing: 1.5, keep_with_next: true }
            },
            tables: { font_size: 12.0, alignment: 'LEFT', line_spacing: 1.0, space_before: 0, space_after: 0, first_line_indent: 0, borders: true },
            captions: { font_size: 12.0, alignment: 'CENTER', space_before: 6, space_after: 12, first_line_indent: 0, line_spacing: 1.0, separator: ' – ' },
            lists: { font_size: 14.0, line_spacing: 1.5, alignment: 'JUSTIFY', first_line_indent: 0, left_indent: 1.25 },
            footnotes: { font_size: 10.0, line_spacing: 1.0, alignment: 'JUSTIFY' },
            required_sections: ['введение', 'заключение', 'список литературы', 'приложение', 'содержание'],
            bibliography: { style: 'gost', font_size: 14.0, line_spacing: 1.5, hanging_indent: 1.25, sort_order: 'alphabetical', numbering: true, min_sources: 25, max_age_years: 5, require_foreign: true, foreign_min_percent: 10 }
        }
    },
    {
        id: 'article',
        name: 'Научная статья',
        description: 'Для публикаций в журналах',
        icon: <ScienceIcon />,
        color: 'warning',
        rules: {
            font: { name: 'Times New Roman', size: 12.0, color: '000000' },
            margins: { left: 2.5, right: 2.5, top: 2.5, bottom: 2.5 },
            line_spacing: 1.0,
            first_line_indent: 1.0,
            paragraph_alignment: 'JUSTIFY',
            headings: {
                h1: { font_size: 14.0, bold: true, alignment: 'CENTER', all_caps: false, space_before: 0, space_after: 12, line_spacing: 1.0, keep_with_next: true },
                h2: { font_size: 12.0, bold: true, alignment: 'LEFT', first_line_indent: 0, space_before: 12, space_after: 6, line_spacing: 1.0, keep_with_next: true },
                h3: { font_size: 12.0, bold: true, alignment: 'LEFT', first_line_indent: 0, space_before: 6, space_after: 0, line_spacing: 1.0, keep_with_next: true }
            },
            tables: { font_size: 10.0, alignment: 'LEFT', line_spacing: 1.0, space_before: 0, space_after: 0, first_line_indent: 0, borders: true },
            captions: { font_size: 10.0, alignment: 'CENTER', space_before: 6, space_after: 6, first_line_indent: 0, line_spacing: 1.0, separator: '. ' },
            lists: { font_size: 12.0, line_spacing: 1.0, alignment: 'JUSTIFY', first_line_indent: 0, left_indent: 0.5 },
            footnotes: { font_size: 9.0, line_spacing: 1.0, alignment: 'JUSTIFY' },
            required_sections: ['аннотация', 'ключевые слова', 'введение', 'заключение', 'список литературы'],
            bibliography: { style: 'gost', font_size: 12.0, line_spacing: 1.0, hanging_indent: 0, sort_order: 'citation_order', numbering: true, min_sources: 10, max_age_years: 5, require_foreign: true, foreign_min_percent: 20 }
        }
    }
];

const STEPS = [
    { label: 'Шаблон', icon: <AutoAwesomeIcon /> },
    { label: 'Основные', icon: <SettingsIcon /> },
    { label: 'Шрифт', icon: <FormatSizeIcon /> },
    { label: 'Поля', icon: <CropFreeIcon /> },
    { label: 'Заголовки', icon: <TitleIcon /> },
    { label: 'Элементы', icon: <TableChartIcon /> },
    { label: 'Библиография', icon: <MenuBookIcon /> },
    { label: 'Структура', icon: <ArticleIcon /> }
];

// Превью документа
const DocumentPreview = ({ rules }) => {
    const theme = useTheme();
    if (!rules) return null;

    const cmToPx = (cm) => cm * 25;
    const pageWidth = 180;
    const pageHeight = pageWidth * 1.414;

    const margins = {
        left: cmToPx(rules.margins?.left || 3) / 6,
        right: cmToPx(rules.margins?.right || 1.5) / 6,
        top: cmToPx(rules.margins?.top || 2) / 6,
        bottom: cmToPx(rules.margins?.bottom || 2) / 6
    };

    return (
        <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Предпросмотр
            </Typography>
            <Box
                sx={{
                    width: pageWidth,
                    height: pageHeight,
                    mx: 'auto',
                    bgcolor: '#fff',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                    borderRadius: 0.5,
                    overflow: 'hidden',
                    position: 'relative'
                }}
            >
                <Box sx={{ position: 'absolute', left: margins.left, right: margins.right, top: margins.top, bottom: margins.bottom, border: `1px dashed ${alpha(theme.palette.primary.main, 0.3)}` }} />
                <Box sx={{ position: 'absolute', left: margins.left + 4, right: margins.right + 4, top: margins.top + 4, fontSize: 6, fontFamily: rules.font?.name || 'serif' }}>
                    <Typography sx={{ fontSize: 6, fontWeight: 700, textAlign: 'center', textTransform: rules.headings?.h1?.all_caps ? 'uppercase' : 'none', mb: 0.5, color: '#000' }}>
                        ЗАГОЛОВОК
                    </Typography>
                    <Box sx={{ height: 2.5, bgcolor: '#ddd', mb: 0.3 }} />
                    <Box sx={{ height: 2.5, bgcolor: '#ddd', mb: 0.3 }} />
                    <Box sx={{ height: 2.5, bgcolor: '#ddd', width: '70%' }} />
                </Box>
            </Box>
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
                <Chip label={`${rules.font?.name?.split(' ')[0]}, ${rules.font?.size}пт`} size="small" variant="outlined" sx={{ fontSize: '0.6rem', height: 18 }} />
                <Chip label={`${rules.line_spacing}x`} size="small" variant="outlined" sx={{ fontSize: '0.6rem', height: 18 }} />
            </Box>
        </Box>
    );
};

export default function ProfileEditor({ initialData, onSave, onCancel }) {
    const theme = useTheme();
    const [activeStep, setActiveStep] = useState(initialData ? 1 : 0);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [formData, setFormData] = useState(initialData ? JSON.parse(JSON.stringify(initialData)) : null);
    const [newSection, setNewSection] = useState('');
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [showPreview, setShowPreview] = useState(true);

    const isEditing = !!initialData;

    const updateField = (path, value) => {
        setFormData(prev => {
            const newData = JSON.parse(JSON.stringify(prev));
            let current = newData;
            const keys = path.split('.');
            const lastKey = keys.pop();

            for (const key of keys) {
                if (!current[key]) current[key] = {};
                current = current[key];
            }

            current[lastKey] = value;
            return newData;
        });
    };

    const handleSelectTemplate = (template) => {
        setSelectedTemplate(template.id);
        setFormData({
            name: '',
            description: '',
            category: 'custom',
            version: '1.0',
            rules: JSON.parse(JSON.stringify(template.rules))
        });
        setActiveStep(1);
    };

    const handleSave = async () => {
        if (!formData?.name) {
            setError('Название профиля обязательно');
            setActiveStep(1);
            return;
        }
        setSaving(true);
        try {
            await onSave(formData);
        } catch (err) {
            setError(err.message || 'Ошибка сохранения');
        } finally {
            setSaving(false);
        }
    };

    const handleAddSection = () => {
        if (newSection && !formData.rules.required_sections.includes(newSection.toLowerCase())) {
            setFormData(prev => ({
                ...prev,
                rules: {
                    ...prev.rules,
                    required_sections: [...prev.rules.required_sections, newSection.toLowerCase()]
                }
            }));
            setNewSection('');
        }
    };

    const handleRemoveSection = (section) => {
        setFormData(prev => ({
            ...prev,
            rules: {
                ...prev.rules,
                required_sections: prev.rules.required_sections.filter(s => s !== section)
            }
        }));
    };

    const canProceed = () => {
        if (activeStep === 0 && !isEditing) return selectedTemplate !== null;
        if (activeStep === 1) return formData?.name?.length > 0;
        return true;
    };

    const renderStepContent = () => {
        switch (activeStep) {
            case 0:
                return (
                    <Box>
                        <Typography variant="h6" fontWeight={700} gutterBottom>Выберите шаблон</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Начните с готового шаблона и настройте под свои требования
                        </Typography>
                        <Grid container spacing={2}>
                            {TEMPLATES.map((template, idx) => (
                                <Grid item xs={12} sm={6} key={template.id}>
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                                        <Card
                                            elevation={0}
                                            sx={{
                                                border: `2px solid ${selectedTemplate === template.id ? theme.palette[template.color].main : alpha(theme.palette.divider, 0.1)}`,
                                                borderRadius: 3,
                                                transition: 'all 0.2s',
                                                bgcolor: selectedTemplate === template.id ? alpha(theme.palette[template.color].main, 0.05) : 'transparent',
                                                '&:hover': { borderColor: theme.palette[template.color].main, transform: 'translateY(-2px)', boxShadow: `0 8px 24px ${alpha(theme.palette[template.color].main, 0.15)}` }
                                            }}
                                        >
                                            <CardActionArea onClick={() => handleSelectTemplate(template)} sx={{ p: 2 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette[template.color].main, 0.1), color: theme.palette[template.color].main }}>
                                                        {template.icon}
                                                    </Box>
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography variant="subtitle1" fontWeight={700}>{template.name}</Typography>
                                                        <Typography variant="body2" color="text.secondary">{template.description}</Typography>
                                                    </Box>
                                                    {selectedTemplate === template.id && <CheckCircleIcon color={template.color} />}
                                                </Box>
                                            </CardActionArea>
                                        </Card>
                                    </motion.div>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                );

            case 1:
                return (
                    <Box>
                        <Typography variant="h6" fontWeight={700} gutterBottom>Основная информация</Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <TextField fullWidth label="Название профиля" value={formData?.name || ''} onChange={(e) => updateField('name', e.target.value)} required error={error && !formData?.name} helperText={error && !formData?.name ? 'Обязательное поле' : 'Например: "Требования МГТУ"'} />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField fullWidth label="Описание" value={formData?.description || ''} onChange={(e) => updateField('description', e.target.value)} multiline rows={2} />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Категория</InputLabel>
                                    <Select value={formData?.category || 'custom'} label="Категория" onChange={(e) => updateField('category', e.target.value)}>
                                        <MenuItem value="custom">Пользовательский</MenuItem>
                                        <MenuItem value="university">Требования ВУЗа</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField fullWidth label="Версия" value={formData?.version || '1.0'} onChange={(e) => updateField('version', e.target.value)} />
                            </Grid>
                            {formData?.category === 'university' && (
                                <Grid item xs={12}>
                                    <TextField fullWidth label="Название ВУЗа" value={formData?.university?.short_name || ''} onChange={(e) => updateField('university.short_name', e.target.value)} placeholder="МГТУ, МГУ..." />
                                </Grid>
                            )}
                        </Grid>
                    </Box>
                );

            case 2:
                return (
                    <Box>
                        <Typography variant="h6" fontWeight={700} gutterBottom>Шрифт и текст</Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Гарнитура</InputLabel>
                                    <Select value={formData?.rules?.font?.name || 'Times New Roman'} label="Гарнитура" onChange={(e) => updateField('rules.font.name', e.target.value)}>
                                        <MenuItem value="Times New Roman">Times New Roman</MenuItem>
                                        <MenuItem value="Arial">Arial</MenuItem>
                                        <MenuItem value="Calibri">Calibri</MenuItem>
                                        <MenuItem value="PT Serif">PT Serif</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <TextField fullWidth type="number" label="Размер" value={formData?.rules?.font?.size || 14} onChange={(e) => updateField('rules.font.size', parseFloat(e.target.value))} InputProps={{ endAdornment: <InputAdornment position="end">пт</InputAdornment> }} inputProps={{ min: 8, max: 20, step: 0.5 }} />
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <TextField fullWidth label="Цвет" value={formData?.rules?.font?.color || '000000'} onChange={(e) => updateField('rules.font.color', e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><Box sx={{ width: 20, height: 20, bgcolor: `#${formData?.rules?.font?.color || '000000'}`, borderRadius: 0.5, border: '1px solid #ccc' }} /></InputAdornment> }} />
                            </Grid>
                            <Grid item xs={12}><Divider /></Grid>
                            <Grid item xs={12} md={4}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>Межстрочный: {formData?.rules?.line_spacing || 1.5}</Typography>
                                <Slider value={formData?.rules?.line_spacing || 1.5} onChange={(e, v) => updateField('rules.line_spacing', v)} min={1} max={2.5} step={0.1} marks={[{ value: 1, label: '1' }, { value: 1.5, label: '1.5' }, { value: 2, label: '2' }]} />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>Абзацный отступ: {formData?.rules?.first_line_indent || 1.25} см</Typography>
                                <Slider value={formData?.rules?.first_line_indent || 1.25} onChange={(e, v) => updateField('rules.first_line_indent', v)} min={0} max={2.5} step={0.05} marks={[{ value: 0, label: '0' }, { value: 1.25, label: '1.25' }]} />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <FormControl fullWidth>
                                    <InputLabel>Выравнивание</InputLabel>
                                    <Select value={formData?.rules?.paragraph_alignment || 'JUSTIFY'} label="Выравнивание" onChange={(e) => updateField('rules.paragraph_alignment', e.target.value)}>
                                        <MenuItem value="LEFT">По левому краю</MenuItem>
                                        <MenuItem value="CENTER">По центру</MenuItem>
                                        <MenuItem value="JUSTIFY">По ширине</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </Box>
                );

            case 3:
                return (
                    <Box>
                        <Typography variant="h6" fontWeight={700} gutterBottom>Поля страницы</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>По ГОСТ: левое 3 см, правое 1-1.5 см, верхнее и нижнее 2 см</Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={6} md={3}><TextField fullWidth type="number" label="Левое" value={formData?.rules?.margins?.left || 3} onChange={(e) => updateField('rules.margins.left', parseFloat(e.target.value))} InputProps={{ endAdornment: <InputAdornment position="end">см</InputAdornment> }} inputProps={{ min: 1, max: 5, step: 0.1 }} /></Grid>
                            <Grid item xs={6} md={3}><TextField fullWidth type="number" label="Правое" value={formData?.rules?.margins?.right || 1.5} onChange={(e) => updateField('rules.margins.right', parseFloat(e.target.value))} InputProps={{ endAdornment: <InputAdornment position="end">см</InputAdornment> }} inputProps={{ min: 0.5, max: 5, step: 0.1 }} /></Grid>
                            <Grid item xs={6} md={3}><TextField fullWidth type="number" label="Верхнее" value={formData?.rules?.margins?.top || 2} onChange={(e) => updateField('rules.margins.top', parseFloat(e.target.value))} InputProps={{ endAdornment: <InputAdornment position="end">см</InputAdornment> }} inputProps={{ min: 1, max: 5, step: 0.1 }} /></Grid>
                            <Grid item xs={6} md={3}><TextField fullWidth type="number" label="Нижнее" value={formData?.rules?.margins?.bottom || 2} onChange={(e) => updateField('rules.margins.bottom', parseFloat(e.target.value))} InputProps={{ endAdornment: <InputAdornment position="end">см</InputAdornment> }} inputProps={{ min: 1, max: 5, step: 0.1 }} /></Grid>
                        </Grid>
                        <Alert severity="info" sx={{ mt: 3 }}>💡 Левое поле минимум 2.5 см для подшивки</Alert>
                    </Box>
                );

            case 4:
                return (
                    <Box>
                        <Typography variant="h6" fontWeight={700} gutterBottom>Заголовки</Typography>
                        {['h1', 'h2', 'h3'].map((h, idx) => (
                            <Paper key={h} elevation={0} sx={{ p: 2, mb: 2, bgcolor: alpha(theme.palette.background.default, 0.5), borderRadius: 2 }}>
                                <Typography variant="subtitle2" fontWeight={700} color="primary" gutterBottom>Заголовок {idx + 1}</Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={4} md={2}><TextField fullWidth size="small" type="number" label="Размер" value={formData?.rules?.headings?.[h]?.font_size || 14} onChange={(e) => updateField(`rules.headings.${h}.font_size`, parseFloat(e.target.value))} InputProps={{ endAdornment: <InputAdornment position="end">пт</InputAdornment> }} /></Grid>
                                    <Grid item xs={8} md={3}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Выравнивание</InputLabel>
                                            <Select value={formData?.rules?.headings?.[h]?.alignment || 'LEFT'} label="Выравнивание" onChange={(e) => updateField(`rules.headings.${h}.alignment`, e.target.value)}>
                                                <MenuItem value="LEFT">Слева</MenuItem>
                                                <MenuItem value="CENTER">По центру</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={6} md={2}><TextField fullWidth size="small" type="number" label="До" value={formData?.rules?.headings?.[h]?.space_before || 0} onChange={(e) => updateField(`rules.headings.${h}.space_before`, parseFloat(e.target.value))} InputProps={{ endAdornment: <InputAdornment position="end">пт</InputAdornment> }} /></Grid>
                                    <Grid item xs={6} md={2}><TextField fullWidth size="small" type="number" label="После" value={formData?.rules?.headings?.[h]?.space_after || 12} onChange={(e) => updateField(`rules.headings.${h}.space_after`, parseFloat(e.target.value))} InputProps={{ endAdornment: <InputAdornment position="end">пт</InputAdornment> }} /></Grid>
                                    <Grid item xs={12} md={3}>
                                        <Stack direction="row" spacing={1} flexWrap="wrap">
                                            <FormControlLabel control={<Switch size="small" checked={formData?.rules?.headings?.[h]?.bold || false} onChange={(e) => updateField(`rules.headings.${h}.bold`, e.target.checked)} />} label="Жирный" />
                                            {h === 'h1' && <FormControlLabel control={<Switch size="small" checked={formData?.rules?.headings?.[h]?.all_caps || false} onChange={(e) => updateField(`rules.headings.${h}.all_caps`, e.target.checked)} />} label="ПРОПИСНЫЕ" />}
                                        </Stack>
                                    </Grid>
                                </Grid>
                            </Paper>
                        ))}
                    </Box>
                );

            case 5:
                return (
                    <Box>
                        <Typography variant="h6" fontWeight={700} gutterBottom>Элементы документа</Typography>
                        <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: alpha(theme.palette.background.default, 0.5), borderRadius: 2 }}>
                            <Typography variant="subtitle2" fontWeight={700} color="primary" gutterBottom>Таблицы</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={6} md={3}><TextField fullWidth size="small" type="number" label="Шрифт" value={formData?.rules?.tables?.font_size || 12} onChange={(e) => updateField('rules.tables.font_size', parseFloat(e.target.value))} InputProps={{ endAdornment: <InputAdornment position="end">пт</InputAdornment> }} /></Grid>
                                <Grid item xs={6} md={3}><TextField fullWidth size="small" type="number" label="Интервал" value={formData?.rules?.tables?.line_spacing || 1} onChange={(e) => updateField('rules.tables.line_spacing', parseFloat(e.target.value))} inputProps={{ step: 0.1 }} /></Grid>
                            </Grid>
                        </Paper>
                        <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: alpha(theme.palette.background.default, 0.5), borderRadius: 2 }}>
                            <Typography variant="subtitle2" fontWeight={700} color="primary" gutterBottom>Подписи</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={6} md={3}><TextField fullWidth size="small" type="number" label="Шрифт" value={formData?.rules?.captions?.font_size || 12} onChange={(e) => updateField('rules.captions.font_size', parseFloat(e.target.value))} InputProps={{ endAdornment: <InputAdornment position="end">пт</InputAdornment> }} /></Grid>
                                <Grid item xs={6} md={3}><TextField fullWidth size="small" label="Разделитель" value={formData?.rules?.captions?.separator || ' – '} onChange={(e) => updateField('rules.captions.separator', e.target.value)} /></Grid>
                            </Grid>
                        </Paper>
                        <Paper elevation={0} sx={{ p: 2, bgcolor: alpha(theme.palette.background.default, 0.5), borderRadius: 2 }}>
                            <Typography variant="subtitle2" fontWeight={700} color="primary" gutterBottom>Сноски</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={6} md={3}><TextField fullWidth size="small" type="number" label="Шрифт" value={formData?.rules?.footnotes?.font_size || 10} onChange={(e) => updateField('rules.footnotes.font_size', parseFloat(e.target.value))} InputProps={{ endAdornment: <InputAdornment position="end">пт</InputAdornment> }} /></Grid>
                            </Grid>
                        </Paper>
                    </Box>
                );

            case 6:
                return (
                    <Box>
                        <Typography variant="h6" fontWeight={700} gutterBottom>Библиография</Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={4}>
                                <FormControl fullWidth>
                                    <InputLabel>Стиль</InputLabel>
                                    <Select value={formData?.rules?.bibliography?.style || 'gost'} label="Стиль" onChange={(e) => updateField('rules.bibliography.style', e.target.value)}>
                                        <MenuItem value="gost">ГОСТ Р 7.0.5-2008</MenuItem>
                                        <MenuItem value="gost_2018">ГОСТ Р 7.0.100-2018</MenuItem>
                                        <MenuItem value="apa">APA</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={6} md={4}><TextField fullWidth type="number" label="Мин. источников" value={formData?.rules?.bibliography?.min_sources || 15} onChange={(e) => updateField('rules.bibliography.min_sources', parseInt(e.target.value))} /></Grid>
                            <Grid item xs={6} md={4}><TextField fullWidth type="number" label="Макс. возраст" value={formData?.rules?.bibliography?.max_age_years || 5} onChange={(e) => updateField('rules.bibliography.max_age_years', parseInt(e.target.value))} InputProps={{ endAdornment: <InputAdornment position="end">лет</InputAdornment> }} /></Grid>
                            <Grid item xs={12}><FormControlLabel control={<Switch checked={formData?.rules?.bibliography?.require_foreign || false} onChange={(e) => updateField('rules.bibliography.require_foreign', e.target.checked)} />} label="Требовать иностранные источники" /></Grid>
                            {formData?.rules?.bibliography?.require_foreign && (
                                <Grid item xs={12} md={4}><TextField fullWidth type="number" label="Минимум иностранных" value={formData?.rules?.bibliography?.foreign_min_percent || 10} onChange={(e) => updateField('rules.bibliography.foreign_min_percent', parseInt(e.target.value))} InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} /></Grid>
                            )}
                        </Grid>
                    </Box>
                );

            case 7:
                return (
                    <Box>
                        <Typography variant="h6" fontWeight={700} gutterBottom>Структура документа</Typography>
                        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                            <TextField fullWidth size="small" label="Название раздела" value={newSection} onChange={(e) => setNewSection(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddSection()} placeholder="Введение" />
                            <Button variant="contained" onClick={handleAddSection} startIcon={<AddIcon />}>Добавить</Button>
                        </Box>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                            {(formData?.rules?.required_sections || []).map((section, idx) => (
                                <Chip key={idx} label={section} onDelete={() => handleRemoveSection(section)} color="primary" variant="outlined" sx={{ textTransform: 'capitalize' }} />
                            ))}
                            {(!formData?.rules?.required_sections || formData.rules.required_sections.length === 0) && (
                                <Typography variant="body2" color="text.secondary" fontStyle="italic">Нет обязательных разделов</Typography>
                            )}
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Быстрое добавление:</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {['введение', 'заключение', 'список литературы', 'приложение', 'содержание', 'аннотация'].map(s => (
                                <Chip key={s} label={s} size="small" variant="outlined" onClick={() => { if (!formData?.rules?.required_sections?.includes(s)) { setFormData(prev => ({ ...prev, rules: { ...prev.rules, required_sections: [...(prev.rules.required_sections || []), s] } })); } }} disabled={formData?.rules?.required_sections?.includes(s)} sx={{ textTransform: 'capitalize', cursor: 'pointer' }} />
                            ))}
                        </Box>
                    </Box>
                );

            default:
                return null;
        }
    };

    return (
        <Paper elevation={0} sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3, bgcolor: alpha(theme.palette.background.paper, 0.6), border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, overflow: 'hidden' }}>
            {/* Header */}
            <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h6" fontWeight={700}>{isEditing ? 'Редактирование' : 'Создание профиля'}</Typography>
                    {formData?.name && <Chip label={formData.name} size="small" color="primary" variant="outlined" />}
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title={showPreview ? 'Скрыть превью' : 'Показать превью'}><IconButton onClick={() => setShowPreview(!showPreview)} size="small"><VisibilityIcon /></IconButton></Tooltip>
                    <Button variant="outlined" color="inherit" onClick={onCancel} startIcon={<CloseIcon />}>Отмена</Button>
                    <Button variant="contained" onClick={handleSave} startIcon={saving ? null : <SaveIcon />} disabled={saving || !formData?.name}>{saving ? 'Сохранение...' : 'Сохранить'}</Button>
                </Box>
            </Box>

            {saving && <LinearProgress />}
            {error && <Alert severity="error" onClose={() => setError(null)} sx={{ m: 2, mb: 0 }}>{error}</Alert>}

            <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
                {/* Steps */}
                <Box sx={{ width: 200, flexShrink: 0, borderRight: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.background.default, 0.3), p: 2, overflowY: 'auto' }}>
                    <Stepper orientation="vertical" activeStep={activeStep} nonLinear>
                        {STEPS.map((step, index) => (
                            <Step key={step.label} completed={index < activeStep}>
                                <StepLabel onClick={() => (formData || isEditing) && setActiveStep(index)} sx={{ cursor: (formData || isEditing) ? 'pointer' : 'default' }}
                                    StepIconComponent={() => (
                                        <Box sx={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: activeStep === index ? 'primary.main' : index < activeStep ? 'success.main' : alpha(theme.palette.action.disabled, 0.2), color: activeStep === index || index < activeStep ? '#fff' : 'text.disabled', fontSize: '0.8rem' }}>
                                            {index < activeStep ? <CheckCircleIcon fontSize="small" /> : step.icon}
                                        </Box>
                                    )}>
                                    <Typography variant="body2" fontWeight={activeStep === index ? 700 : 400}>{step.label}</Typography>
                                </StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                </Box>

                {/* Main */}
                <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                    <Box sx={{ flex: 1, p: 3, overflowY: 'auto' }}>
                        <AnimatePresence mode="wait">
                            <motion.div key={activeStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                                {renderStepContent()}
                            </motion.div>
                        </AnimatePresence>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                            <Button variant="outlined" startIcon={<NavigateBeforeIcon />} onClick={() => setActiveStep(prev => prev - 1)} disabled={activeStep === 0}>Назад</Button>
                            {activeStep < STEPS.length - 1 ? (
                                <Button variant="contained" endIcon={<NavigateNextIcon />} onClick={() => setActiveStep(prev => prev + 1)} disabled={!canProceed()}>Далее</Button>
                            ) : (
                                <Button variant="contained" color="success" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving || !formData?.name}>{saving ? 'Сохранение...' : 'Сохранить'}</Button>
                            )}
                        </Box>
                    </Box>

                    <Collapse in={showPreview} orientation="horizontal">
                        <Box sx={{ width: 220, borderLeft: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.background.default, 0.3), p: 2, overflowY: 'auto' }}>
                            <DocumentPreview rules={formData?.rules} />
                        </Box>
                    </Collapse>
                </Box>
            </Box>
        </Paper>
    );
}

ProfileEditor.propTypes = {
    initialData: PropTypes.object,
    onSave: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
};
