import React from 'react';
import { Box, Typography, Grid, Paper, Button } from '@mui/material';
import MemeWidget from '../components/MemeWidget';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';

const StatCard = ({ title, value, icon, color = 'primary.main' }) => (
  <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Box>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 0.5 }}>{title}</Typography>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>{value}</Typography>
      </Box>
      <Box sx={{ color, opacity: 0.7 }}>{icon}</Box>
    </Box>
  </Paper>
);

const RecentFileItem = ({ name, status, date }) => (
  <Box sx={{ 
    p: 2, 
    borderRadius: 2, 
    bgcolor: 'rgba(255,255,255,0.02)', 
    border: '1px solid rgba(255,255,255,0.04)',
    mb: 1,
    cursor: 'pointer',
    transition: 'all 150ms',
    '&:hover': { bgcolor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }
  }}>
    <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>{name}</Typography>
    <Box sx={{ display: 'flex', gap: 2 }}>
      <Typography variant="caption" sx={{ color: status === 'Готово' ? 'success.main' : 'warning.main' }}>
        {status}
      </Typography>
      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>{date}</Typography>
    </Box>
  </Box>
);

export default function DashboardPage() {
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>Панель управления</Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
          Обзор ваших документов и активности
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', pr: 1 }}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <StatCard 
              title="Всего проверок" 
              value="24" 
              icon={<FolderOpenIcon sx={{ fontSize: 40 }} />} 
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard 
              title="Успешно" 
              value="18" 
              icon={<CheckCircleOutlineIcon sx={{ fontSize: 40 }} />} 
              color="success.main"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard 
              title="Активность" 
              value="+12%" 
              icon={<TrendingUpIcon sx={{ fontSize: 40 }} />} 
              color="primary.main"
            />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Последние файлы</Typography>
              <Button size="small" sx={{ color: 'rgba(255,255,255,0.7)' }}>Все файлы</Button>
            </Box>
            <RecentFileItem name="Курсовая_работа_2025.docx" status="Готово" date="2 ноября 2025" />
            <RecentFileItem name="Отчет_практика.docx" status="Требует правок" date="1 ноября 2025" />
            <RecentFileItem name="Диплом_глава1.docx" status="Готово" date="30 октября 2025" />
            <RecentFileItem name="Реферат_история.docx" status="Готово" date="28 октября 2025" />
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Мотивация дня</Typography>
            <Box sx={{ 
              borderRadius: 3, 
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.06)',
              bgcolor: 'rgba(255,255,255,0.02)'
            }}>
              <MemeWidget />
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
