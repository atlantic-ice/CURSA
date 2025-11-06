import React from 'react';
import { Box, Typography, Grid, Paper } from '@mui/material';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';

const TemplateCard = ({ title, description }) => (
  <Paper sx={{ 
    p: 3, 
    borderRadius: 3, 
    bgcolor: 'rgba(255,255,255,0.02)', 
    border: '1px solid rgba(255,255,255,0.06)',
    cursor: 'pointer',
    transition: 'all 150ms',
    '&:hover': { bgcolor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.12)' }
  }}>
    <DescriptionOutlinedIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>{title}</Typography>
    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>{description}</Typography>
  </Paper>
);

export default function MaterialsPage() {
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>Материалы</Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
          Шаблоны, руководства и справочные материалы
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', pr: 1 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6} lg={4}>
            <TemplateCard 
              title="ГОСТ Р 7.0.97-2016" 
              description="Система стандартов по информации, библиотечному и издательскому делу"
            />
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <TemplateCard 
              title="Шаблон курсовой" 
              description="Готовый шаблон оформления курсовой работы"
            />
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <TemplateCard 
              title="Шаблон диплома" 
              description="Шаблон выпускной квалификационной работы"
            />
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <TemplateCard 
              title="Оформление списка литературы" 
              description="Правила оформления библиографических ссылок"
            />
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <TemplateCard 
              title="Титульный лист" 
              description="Примеры оформления титульного листа"
            />
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <TemplateCard 
              title="Таблицы и рисунки" 
              description="Правила оформления иллюстративного материала"
            />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
