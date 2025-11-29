import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Grid,
    Button,
    Tabs,
    Tab,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Switch,
    FormControlLabel,
    Divider,
    IconButton,
    Chip,
    Stack,
    Alert,
    useTheme,
    alpha
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import ProfilePreview from './ProfilePreview';

// Default empty profile structure
const DEFAULT_PROFILE = {
    name: '',
    description: '',
    category: 'custom',
    version: '1.0',
    rules: {
        font: {
            name: 'Times New Roman',
            size: 14.0,
            color: '000000'
        },
        margins: {
            left: 3.0,
            right: 1.5,
            top: 2.0,
            bottom: 2.0
        },
        line_spacing: 1.5,
        first_line_indent: 1.25,
        paragraph_alignment: 'JUSTIFY',
        headings: {
            h1: {
                font_size: 14.0,
                bold: true,
                alignment: 'CENTER',
                all_caps: true,
                space_before: 0,
                space_after: 12,
                line_spacing: 1.5,
                keep_with_next: true
            },
            h2: {
                font_size: 14.0,
                bold: true,
                alignment: 'LEFT',
                first_line_indent: 1.25,
                space_before: 12,
                space_after: 12,
                line_spacing: 1.5,
                keep_with_next: true
            },
            h3: {
                font_size: 14.0,
                bold: true,
                alignment: 'LEFT',
                first_line_indent: 1.25,
                space_before: 12,
                space_after: 0,
                line_spacing: 1.5,
                keep_with_next: true
            }
        },
        tables: {
            font_size: 12.0,
            alignment: 'LEFT',
            line_spacing: 1.0,
            space_before: 0,
            space_after: 0,
            first_line_indent: 0,
            borders: true
        },
        captions: {
            font_size: 12.0,
            alignment: 'CENTER',
            space_before: 6,
            space_after: 12,
            first_line_indent: 0,
            line_spacing: 1.0,
            separator: ' – '
        },
        lists: {
            font_size: 14.0,
            line_spacing: 1.5,
            alignment: 'JUSTIFY',
            first_line_indent: 0,
            left_indent: 1.25
        },
        footnotes: {
            font_size: 10.0,
            line_spacing: 1.0,
            alignment: 'JUSTIFY'
        },
        required_sections: [],
        bibliography: {
            style: 'gost',
            font_size: 14.0,
            line_spacing: 1.5,
            hanging_indent: 1.25,
            sort_order: 'alphabetical',
            numbering: true,
            min_sources: 15,
            max_age_years: 5,
            require_foreign: false,
            foreign_min_percent: 0
        }
    }
};

const TabPanel = ({ children, value, index, ...other }) => (
    <div
        role="tabpanel"
        hidden={value !== index}
        id={`profile-tabpanel-${index}`}
        aria-labelledby={`profile-tab-${index}`}
        {...other}
    >
        {value === index && (
            <Box sx={{ p: 3 }}>
                {children}
            </Box>
        )}
    </div>
);

export default function ProfileEditor({ initialData, onSave, onCancel }) {
    const theme = useTheme();
    const [activeTab, setActiveTab] = useState(0);
    const [formData, setFormData] = useState(initialData ? JSON.parse(JSON.stringify(initialData)) : DEFAULT_PROFILE);
    const [newSection, setNewSection] = useState('');
    const [error, setError] = useState(null);

    // Helper to update nested state
    const updateField = (path, value) => {
        setFormData(prev => {
            const newData = { ...prev };
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

    const handleSave = () => {
        if (!formData.name) {
            setError('Название профиля обязательно');
            return;
        }
        onSave(formData);
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

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
            {/* Header */}
            <Box sx={{
                p: 2,
                borderBottom: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                bgcolor: alpha(theme.palette.primary.main, 0.05)
            }}>
                <Typography variant="h6" fontWeight={700}>
                    {initialData ? 'Редактирование профиля' : 'Создание профиля'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        color="inherit"
                        onClick={onCancel}
                        startIcon={<CloseIcon />}
                    >
                        Отмена
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        startIcon={<SaveIcon />}
                    >
                        Сохранить
                    </Button>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" onClose={() => setError(null)} sx={{ m: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Tabs */}
            <Tabs
                value={activeTab}
                onChange={(e, v) => setActiveTab(v)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}
            >
                <Tab label="Общее" />
                <Tab label="Шрифт и текст" />
                <Tab label="Поля" />
                <Tab label="Заголовки" />
                <Tab label="Таблицы и подписи" />
                <Tab label="Списки и сноски" />
                <Tab label="Библиография" />
                <Tab label="Структура" />
            </Tabs>

            {/* Content */}
            <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex' }}>
                <Grid container sx={{ height: '100%' }}>
                    {/* Left Side: Form */}
                    <Grid item xs={12} md={8} lg={8} sx={{ height: '100%', overflowY: 'auto', borderRight: `1px solid ${theme.palette.divider}` }}>
                        {/* Tab 0: General */}
                        <TabPanel value={activeTab} index={0}>
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Название профиля"
                                        value={formData.name}
                                        onChange={(e) => updateField('name', e.target.value)}
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Описание"
                                        value={formData.description}
                                        onChange={(e) => updateField('description', e.target.value)}
                                        multiline
                                        rows={3}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Категория</InputLabel>
                                        <Select
                                            value={formData.category}
                                            label="Категория"
                                            onChange={(e) => updateField('category', e.target.value)}
                                        >
                                            <MenuItem value="custom">Пользовательский</MenuItem>
                                            <MenuItem value="university">Требования ВУЗа</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Версия"
                                        value={formData.version}
                                        onChange={(e) => updateField('version', e.target.value)}
                                    />
                                </Grid>
                                {formData.category === 'university' && (
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Название ВУЗа (краткое)"
                                            value={formData.university?.short_name || ''}
                                            onChange={(e) => updateField('university.short_name', e.target.value)}
                                            placeholder="Например: МГТУ"
                                        />
                                    </Grid>
                                )}
                            </Grid>
                        </TabPanel>

                        {/* Tab 1: Font & Text */}
                        <TabPanel value={activeTab} index={1}>
                            <Typography variant="subtitle1" gutterBottom fontWeight={600} color="primary">Основной текст</Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Гарнитура шрифта"
                                        value={formData.rules.font.name}
                                        onChange={(e) => updateField('rules.font.name', e.target.value)}
                                    />
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Размер (пт)"
                                        value={formData.rules.font.size}
                                        onChange={(e) => updateField('rules.font.size', parseFloat(e.target.value))}
                                        inputProps={{ step: 0.5 }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <TextField
                                        fullWidth
                                        label="Цвет (HEX)"
                                        value={formData.rules.font.color}
                                        onChange={(e) => updateField('rules.font.color', e.target.value)}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Межстрочный интервал"
                                        value={formData.rules.line_spacing}
                                        onChange={(e) => updateField('rules.line_spacing', parseFloat(e.target.value))}
                                        inputProps={{ step: 0.1 }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Отступ первой строки (см)"
                                        value={formData.rules.first_line_indent}
                                        onChange={(e) => updateField('rules.first_line_indent', parseFloat(e.target.value))}
                                        inputProps={{ step: 0.1 }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <FormControl fullWidth>
                                        <InputLabel>Выравнивание</InputLabel>
                                        <Select
                                            value={formData.rules.paragraph_alignment}
                                            label="Выравнивание"
                                            onChange={(e) => updateField('rules.paragraph_alignment', e.target.value)}
                                        >
                                            <MenuItem value="LEFT">По левому краю</MenuItem>
                                            <MenuItem value="CENTER">По центру</MenuItem>
                                            <MenuItem value="RIGHT">По правому краю</MenuItem>
                                            <MenuItem value="JUSTIFY">По ширине</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>
                        </TabPanel>

                        {/* Tab 2: Margins */}
                        <TabPanel value={activeTab} index={2}>
                            <Typography variant="subtitle1" gutterBottom fontWeight={600} color="primary">Поля страницы (см)</Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Левое"
                                        value={formData.rules.margins.left}
                                        onChange={(e) => updateField('rules.margins.left', parseFloat(e.target.value))}
                                        inputProps={{ step: 0.1 }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Правое"
                                        value={formData.rules.margins.right}
                                        onChange={(e) => updateField('rules.margins.right', parseFloat(e.target.value))}
                                        inputProps={{ step: 0.1 }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Верхнее"
                                        value={formData.rules.margins.top}
                                        onChange={(e) => updateField('rules.margins.top', parseFloat(e.target.value))}
                                        inputProps={{ step: 0.1 }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Нижнее"
                                        value={formData.rules.margins.bottom}
                                        onChange={(e) => updateField('rules.margins.bottom', parseFloat(e.target.value))}
                                        inputProps={{ step: 0.1 }}
                                    />
                                </Grid>
                            </Grid>
                        </TabPanel>

                        {/* Tab 3: Headings */}
                        <TabPanel value={activeTab} index={3}>
                            {['h1', 'h2', 'h3'].map((h, idx) => (
                                <Box key={h} sx={{ mb: 4 }}>
                                    <Typography variant="subtitle1" gutterBottom fontWeight={600} color="primary">
                                        Заголовок уровня {idx + 1} ({h.toUpperCase()})
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={6} md={3}>
                                            <TextField
                                                fullWidth
                                                type="number"
                                                label="Размер (пт)"
                                                value={formData.rules.headings[h].font_size}
                                                onChange={(e) => updateField(`rules.headings.${h}.font_size`, parseFloat(e.target.value))}
                                            />
                                        </Grid>
                                        <Grid item xs={6} md={3}>
                                            <FormControl fullWidth>
                                                <InputLabel>Выравнивание</InputLabel>
                                                <Select
                                                    value={formData.rules.headings[h].alignment}
                                                    label="Выравнивание"
                                                    onChange={(e) => updateField(`rules.headings.${h}.alignment`, e.target.value)}
                                                >
                                                    <MenuItem value="LEFT">Слева</MenuItem>
                                                    <MenuItem value="CENTER">По центру</MenuItem>
                                                    <MenuItem value="RIGHT">Справа</MenuItem>
                                                    <MenuItem value="JUSTIFY">По ширине</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={6} md={3}>
                                            <TextField
                                                fullWidth
                                                type="number"
                                                label="Отступ перед (пт)"
                                                value={formData.rules.headings[h].space_before}
                                                onChange={(e) => updateField(`rules.headings.${h}.space_before`, parseFloat(e.target.value))}
                                            />
                                        </Grid>
                                        <Grid item xs={6} md={3}>
                                            <TextField
                                                fullWidth
                                                type="number"
                                                label="Отступ после (пт)"
                                                value={formData.rules.headings[h].space_after}
                                                onChange={(e) => updateField(`rules.headings.${h}.space_after`, parseFloat(e.target.value))}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Stack direction="row" spacing={2}>
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            checked={formData.rules.headings[h].bold}
                                                            onChange={(e) => updateField(`rules.headings.${h}.bold`, e.target.checked)}
                                                        />
                                                    }
                                                    label="Жирный"
                                                />
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            checked={formData.rules.headings[h].all_caps || false}
                                                            onChange={(e) => updateField(`rules.headings.${h}.all_caps`, e.target.checked)}
                                                        />
                                                    }
                                                    label="Все прописные"
                                                />
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            checked={formData.rules.headings[h].keep_with_next || false}
                                                            onChange={(e) => updateField(`rules.headings.${h}.keep_with_next`, e.target.checked)}
                                                        />
                                                    }
                                                    label="Не отрывать от следующего"
                                                />
                                            </Stack>
                                        </Grid>
                                    </Grid>
                                    <Divider sx={{ my: 2 }} />
                                </Box>
                            ))}
                        </TabPanel>

                        {/* Tab 4: Tables & Captions */}
                        <TabPanel value={activeTab} index={4}>
                            <Typography variant="subtitle1" gutterBottom fontWeight={600} color="primary">Таблицы</Typography>
                            <Grid container spacing={3} sx={{ mb: 4 }}>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Размер шрифта (пт)"
                                        value={formData.rules.tables.font_size}
                                        onChange={(e) => updateField('rules.tables.font_size', parseFloat(e.target.value))}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Межстрочный интервал"
                                        value={formData.rules.tables.line_spacing}
                                        onChange={(e) => updateField('rules.tables.line_spacing', parseFloat(e.target.value))}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={formData.rules.tables.borders}
                                                onChange={(e) => updateField('rules.tables.borders', e.target.checked)}
                                            />
                                        }
                                        label="Отображать границы"
                                    />
                                </Grid>
                            </Grid>

                            <Typography variant="subtitle1" gutterBottom fontWeight={600} color="primary">Подписи (Рисунки/Таблицы)</Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Размер шрифта (пт)"
                                        value={formData.rules.captions.font_size}
                                        onChange={(e) => updateField('rules.captions.font_size', parseFloat(e.target.value))}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        label="Разделитель"
                                        value={formData.rules.captions.separator}
                                        onChange={(e) => updateField('rules.captions.separator', e.target.value)}
                                        helperText="Например: ' – ' или '. '"
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <FormControl fullWidth>
                                        <InputLabel>Выравнивание</InputLabel>
                                        <Select
                                            value={formData.rules.captions.alignment}
                                            label="Выравнивание"
                                            onChange={(e) => updateField('rules.captions.alignment', e.target.value)}
                                        >
                                            <MenuItem value="LEFT">Слева</MenuItem>
                                            <MenuItem value="CENTER">По центру</MenuItem>
                                            <MenuItem value="RIGHT">Справа</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>
                        </TabPanel>

                        {/* Tab 5: Lists & Footnotes */}
                        <TabPanel value={activeTab} index={5}>
                            <Typography variant="subtitle1" gutterBottom fontWeight={600} color="primary">Списки</Typography>
                            <Grid container spacing={3} sx={{ mb: 4 }}>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Размер шрифта (пт)"
                                        value={formData.rules.lists.font_size}
                                        onChange={(e) => updateField('rules.lists.font_size', parseFloat(e.target.value))}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Отступ слева (см)"
                                        value={formData.rules.lists.left_indent}
                                        onChange={(e) => updateField('rules.lists.left_indent', parseFloat(e.target.value))}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Межстрочный интервал"
                                        value={formData.rules.lists.line_spacing}
                                        onChange={(e) => updateField('rules.lists.line_spacing', parseFloat(e.target.value))}
                                    />
                                </Grid>
                            </Grid>

                            <Typography variant="subtitle1" gutterBottom fontWeight={600} color="primary">Сноски</Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Размер шрифта (пт)"
                                        value={formData.rules.footnotes.font_size}
                                        onChange={(e) => updateField('rules.footnotes.font_size', parseFloat(e.target.value))}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Межстрочный интервал"
                                        value={formData.rules.footnotes.line_spacing}
                                        onChange={(e) => updateField('rules.footnotes.line_spacing', parseFloat(e.target.value))}
                                    />
                                </Grid>
                            </Grid>
                        </TabPanel>

                        {/* Tab 6: Bibliography */}
                        <TabPanel value={activeTab} index={6}>
                            <Typography variant="subtitle1" gutterBottom fontWeight={600} color="primary">Список литературы</Typography>
                            <Grid container spacing={3} sx={{ mb: 4 }}>
                                <Grid item xs={12} md={4}>
                                    <FormControl fullWidth>
                                        <InputLabel>Стиль оформления</InputLabel>
                                        <Select
                                            value={formData.rules.bibliography?.style || 'gost'}
                                            label="Стиль оформления"
                                            onChange={(e) => updateField('rules.bibliography.style', e.target.value)}
                                        >
                                            <MenuItem value="gost">ГОСТ Р 7.0.5-2008</MenuItem>
                                            <MenuItem value="gost_2018">ГОСТ Р 7.0.100-2018</MenuItem>
                                            <MenuItem value="apa">APA</MenuItem>
                                            <MenuItem value="mla">MLA</MenuItem>
                                            <MenuItem value="chicago">Chicago</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Размер шрифта (пт)"
                                        value={formData.rules.bibliography?.font_size || 14}
                                        onChange={(e) => updateField('rules.bibliography.font_size', parseFloat(e.target.value))}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Межстрочный интервал"
                                        value={formData.rules.bibliography?.line_spacing || 1.5}
                                        onChange={(e) => updateField('rules.bibliography.line_spacing', parseFloat(e.target.value))}
                                        inputProps={{ step: 0.1 }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Выступ (см)"
                                        value={formData.rules.bibliography?.hanging_indent || 1.25}
                                        onChange={(e) => updateField('rules.bibliography.hanging_indent', parseFloat(e.target.value))}
                                        inputProps={{ step: 0.1 }}
                                        helperText="Отступ второй и последующих строк"
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <FormControl fullWidth>
                                        <InputLabel>Порядок сортировки</InputLabel>
                                        <Select
                                            value={formData.rules.bibliography?.sort_order || 'alphabetical'}
                                            label="Порядок сортировки"
                                            onChange={(e) => updateField('rules.bibliography.sort_order', e.target.value)}
                                        >
                                            <MenuItem value="alphabetical">По алфавиту</MenuItem>
                                            <MenuItem value="citation_order">По порядку цитирования</MenuItem>
                                            <MenuItem value="year">По году издания</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={formData.rules.bibliography?.numbering !== false}
                                                onChange={(e) => updateField('rules.bibliography.numbering', e.target.checked)}
                                            />
                                        }
                                        label="Нумерация источников"
                                    />
                                </Grid>
                            </Grid>

                            <Typography variant="subtitle1" gutterBottom fontWeight={600} color="primary">Требования к источникам</Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Минимум источников"
                                        value={formData.rules.bibliography?.min_sources || 15}
                                        onChange={(e) => updateField('rules.bibliography.min_sources', parseInt(e.target.value))}
                                        helperText="Минимальное количество источников"
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Максимальный возраст (лет)"
                                        value={formData.rules.bibliography?.max_age_years || 5}
                                        onChange={(e) => updateField('rules.bibliography.max_age_years', parseInt(e.target.value))}
                                        helperText="Источники не старше указанного срока"
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={formData.rules.bibliography?.require_foreign || false}
                                                onChange={(e) => updateField('rules.bibliography.require_foreign', e.target.checked)}
                                            />
                                        }
                                        label="Требовать иностранные источники"
                                    />
                                </Grid>
                                {formData.rules.bibliography?.require_foreign && (
                                    <Grid item xs={12} md={4}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Минимум иностранных (%)"
                                            value={formData.rules.bibliography?.foreign_min_percent || 10}
                                            onChange={(e) => updateField('rules.bibliography.foreign_min_percent', parseInt(e.target.value))}
                                            inputProps={{ min: 0, max: 100 }}
                                        />
                                    </Grid>
                                )}
                            </Grid>
                        </TabPanel>

                        {/* Tab 7: Structure */}
                        <TabPanel value={activeTab} index={7}>
                            <Typography variant="subtitle1" gutterBottom fontWeight={600} color="primary">Обязательные разделы</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Укажите названия разделов, которые обязательно должны присутствовать в документе (например: Введение, Заключение).
                            </Typography>

                            <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Название раздела"
                                    value={newSection}
                                    onChange={(e) => setNewSection(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddSection()}
                                />
                                <Button
                                    variant="contained"
                                    onClick={handleAddSection}
                                    startIcon={<AddIcon />}
                                >
                                    Добавить
                                </Button>
                            </Box>

                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {formData.rules.required_sections.map((section, idx) => (
                                    <Chip
                                        key={idx}
                                        label={section}
                                        onDelete={() => handleRemoveSection(section)}
                                        color="primary"
                                        variant="outlined"
                                    />
                                ))}
                                {formData.rules.required_sections.length === 0 && (
                                    <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                        Нет обязательных разделов
                                    </Typography>
                                )}
                            </Box>
                        </TabPanel>
                    </Grid>

                    {/* Right Side: Preview */}
                    <Grid item xs={12} md={4} lg={4} sx={{ 
                        height: '100%', 
                        overflowY: 'auto', 
                        bgcolor: alpha(theme.palette.background.default, 0.3),
                        p: 2
                    }}>
                        <Box sx={{ position: 'sticky', top: 0 }}>
                            <ProfilePreview rules={formData.rules} />
                        </Box>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
}
