import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import BookOutlinedIcon from '@mui/icons-material/BookOutlined';

/**
 * Компонент для отображения доступных шаблонов документов
 * 
 * @param {Object} props
 * @param {Array<Object>} props.templates - Массив объектов с данными о шаблонах
 * @param {string} props.title - Заголовок секции
 * @param {Object} [props.sx] - Дополнительные стили компонента
 */
const TemplatesSection = ({ templates = [], title = "Шаблоны документов", sx = {} }) => {
  return (
    <Box sx={{ ...sx }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography 
          variant="h5" 
          component="h2" 
          sx={{ 
            mb: 1.5, 
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
          }}
        >
          <BookOutlinedIcon />
          {title}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto' }}>
          Готовые шаблоны документов с правильным форматированием для различных видов работ
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {templates.map((template, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card 
              elevation={0} 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.08)'
                }
              }}
            >
              <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
                <DescriptionOutlinedIcon sx={{ fontSize: 60, color: 'primary.main', opacity: 0.9 }} />
              </Box>
              <CardContent sx={{ flexGrow: 1, pt: 0 }}>
                <Typography variant="h6" component="h3" gutterBottom fontWeight={600}>
                  {template.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {template.description}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {template.tags.map((tag, tagIndex) => (
                    <Chip 
                      key={tagIndex} 
                      label={tag} 
                      size="small" 
                      variant="outlined"
                    />
                  ))}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Размер: {template.size} • Формат: {template.format}
                </Typography>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button 
                  fullWidth 
                  variant="contained" 
                  startIcon={<DownloadIcon />}
                  href={template.downloadUrl}
                  download={template.filename}
                  sx={{ borderRadius: 2 }}
                >
                  Скачать шаблон
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default TemplatesSection; 