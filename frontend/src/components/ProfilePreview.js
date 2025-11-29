import React from 'react';
import {
    Box,
    Paper,
    Typography,
    Divider,
    useTheme,
    alpha
} from '@mui/material';

/**
 * Компонент предпросмотра документа с применёнными правилами профиля
 */
export default function ProfilePreview({ rules }) {
    const theme = useTheme();

    if (!rules) {
        return (
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.background.paper, 0.4),
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    textAlign: 'center',
                    color: 'text.secondary'
                }}
            >
                Выберите профиль для предпросмотра
            </Paper>
        );
    }

    // Преобразуем см в пиксели (примерно 38px = 1см для экрана)
    const cmToPx = (cm) => cm * 38;
    
    // Размер страницы A4 в пропорциях для предпросмотра
    const pageWidth = 300;
    const pageHeight = pageWidth * 1.414; // A4 пропорция

    const margins = {
        left: cmToPx(rules.margins?.left || 3) / 4,
        right: cmToPx(rules.margins?.right || 1.5) / 4,
        top: cmToPx(rules.margins?.top || 2) / 4,
        bottom: cmToPx(rules.margins?.bottom || 2) / 4
    };

    const fontSize = (rules.font?.size || 14) * 0.5;
    const lineHeight = rules.line_spacing || 1.5;
    const firstLineIndent = cmToPx(rules.first_line_indent || 1.25) / 4;

    const getAlignment = (align) => {
        switch (align) {
            case 'CENTER': return 'center';
            case 'RIGHT': return 'right';
            case 'JUSTIFY': return 'justify';
            default: return 'left';
        }
    };

    return (
        <Paper
            elevation={0}
            sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.background.paper, 0.4),
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
            }}
        >
            <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
                Предпросмотр документа
            </Typography>

            {/* Page Preview */}
            <Box
                sx={{
                    width: pageWidth,
                    height: pageHeight,
                    mx: 'auto',
                    bgcolor: '#fff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    borderRadius: 1,
                    overflow: 'hidden',
                    position: 'relative'
                }}
            >
                {/* Margin indicators */}
                <Box
                    sx={{
                        position: 'absolute',
                        left: margins.left,
                        right: margins.right,
                        top: margins.top,
                        bottom: margins.bottom,
                        border: `1px dashed ${alpha(theme.palette.primary.main, 0.2)}`,
                        pointerEvents: 'none'
                    }}
                />

                {/* Content area */}
                <Box
                    sx={{
                        position: 'absolute',
                        left: margins.left,
                        right: margins.right,
                        top: margins.top,
                        bottom: margins.bottom,
                        p: 1,
                        overflow: 'hidden'
                    }}
                >
                    {/* Title (H1) */}
                    <Typography
                        sx={{
                            fontSize: (rules.headings?.h1?.font_size || 14) * 0.5,
                            fontWeight: rules.headings?.h1?.bold ? 700 : 400,
                            textAlign: getAlignment(rules.headings?.h1?.alignment || 'CENTER'),
                            textTransform: rules.headings?.h1?.all_caps ? 'uppercase' : 'none',
                            fontFamily: rules.font?.name || 'Times New Roman',
                            color: '#000',
                            mb: 1
                        }}
                    >
                        ЗАГОЛОВОК РАЗДЕЛА
                    </Typography>

                    {/* Subtitle (H2) */}
                    <Typography
                        sx={{
                            fontSize: (rules.headings?.h2?.font_size || 14) * 0.5,
                            fontWeight: rules.headings?.h2?.bold ? 700 : 400,
                            textAlign: getAlignment(rules.headings?.h2?.alignment || 'LEFT'),
                            fontFamily: rules.font?.name || 'Times New Roman',
                            color: '#000',
                            mb: 0.5,
                            textIndent: firstLineIndent
                        }}
                    >
                        1.1 Подраздел
                    </Typography>

                    {/* Body text */}
                    <Typography
                        sx={{
                            fontSize,
                            lineHeight,
                            textAlign: getAlignment(rules.paragraph_alignment || 'JUSTIFY'),
                            fontFamily: rules.font?.name || 'Times New Roman',
                            color: '#000',
                            textIndent: firstLineIndent,
                            mb: 0.5
                        }}
                    >
                        Это пример основного текста документа. Текст форматируется в соответствии с выбранными правилами профиля.
                    </Typography>

                    <Typography
                        sx={{
                            fontSize,
                            lineHeight,
                            textAlign: getAlignment(rules.paragraph_alignment || 'JUSTIFY'),
                            fontFamily: rules.font?.name || 'Times New Roman',
                            color: '#000',
                            textIndent: firstLineIndent,
                            mb: 1
                        }}
                    >
                        Второй абзац текста демонстрирует межстрочный интервал и отступ первой строки.
                    </Typography>

                    {/* Table example */}
                    <Box
                        sx={{
                            border: '1px solid #000',
                            fontSize: (rules.tables?.font_size || 12) * 0.5,
                            fontFamily: rules.font?.name || 'Times New Roman',
                            mb: 0.5
                        }}
                    >
                        <Box sx={{ display: 'flex', borderBottom: '1px solid #000' }}>
                            <Box sx={{ flex: 1, p: 0.25, borderRight: '1px solid #000', textAlign: 'center' }}>№</Box>
                            <Box sx={{ flex: 2, p: 0.25, textAlign: 'center' }}>Название</Box>
                        </Box>
                        <Box sx={{ display: 'flex' }}>
                            <Box sx={{ flex: 1, p: 0.25, borderRight: '1px solid #000', textAlign: 'center' }}>1</Box>
                            <Box sx={{ flex: 2, p: 0.25, textAlign: 'center' }}>Данные</Box>
                        </Box>
                    </Box>

                    {/* Caption */}
                    <Typography
                        sx={{
                            fontSize: (rules.captions?.font_size || 12) * 0.5,
                            textAlign: getAlignment(rules.captions?.alignment || 'CENTER'),
                            fontFamily: rules.font?.name || 'Times New Roman',
                            color: '#000'
                        }}
                    >
                        Таблица 1{rules.captions?.separator || ' – '}Пример таблицы
                    </Typography>
                </Box>
            </Box>

            {/* Legend */}
            <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 16, height: 16, border: `1px dashed ${alpha(theme.palette.primary.main, 0.5)}` }} />
                    <Typography variant="caption" color="text.secondary">Поля</Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                    Шрифт: {rules.font?.name}, {rules.font?.size} пт
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    Интервал: {rules.line_spacing}
                </Typography>
            </Box>
        </Paper>
    );
}
