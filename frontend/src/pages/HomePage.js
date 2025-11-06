import React from 'react';
import { Box, Paper, Typography, Button, Stack, Divider } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFileOutlined';
import DropZone from '../components/DropZone';

const TaskCard = ({ title, subtitle }) => (
  <Paper sx={{ p: 2, borderRadius: 1, mb: 1 }}>
    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{title}</Typography>
    {subtitle && <Typography variant="caption" sx={{ color: 'text.secondary' }}>{subtitle}</Typography>}
  </Paper>
);

const HomePage = () => {
  return (
    <Box component="main" sx={{ flex: 1, p: 4, overflow: 'auto' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>CURSA</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>Проверка .docx — быстро и аккуратно</Typography>
        </Box>
        <Box>
          <Button variant="contained" color="primary">Новая проверка</Button>
        </Box>
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 3 }}>
        <Box>
          <Paper sx={{ p: 0, borderRadius: 2, mb: 3, overflow: 'hidden' }}>
            <DropZone sx={{ m: 0 }}>
              {({ isDragActive, isDragReject, openFile }) => (
                <Box
                  sx={{
                    textAlign: 'center',
                    p: 5,
                    border: '1px dashed',
                    borderColor: isDragReject ? 'error.main' : 'divider',
                    borderRadius: 2,
                  }}
                >
                  <Box sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    mx: 'auto',
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'action.hover'
                  }}>
                    <UploadFileIcon sx={{ color: isDragReject ? 'error.main' : isDragActive ? 'primary.main' : 'text.secondary' }} />
                  </Box>

                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {isDragReject ? 'Поддерживаются только .docx' : 'Перетащите .docx или выберите файл'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>До 20 МБ · .docx</Typography>
                  <Button variant="contained" onClick={() => openFile && openFile()}>Выбрать файл</Button>
                </Box>
              )}
            </DropZone>
          </Paper>

          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Последние задачи</Typography>
          <TaskCard title="Проверка структуры документа" subtitle="02.11.2025 — готово" />
          <TaskCard title="Проверка стилей и заголовков" subtitle="01.11.2025 — замечания" />
          <TaskCard title="Проверка ссылок и примечаний" subtitle="30.10.2025 — готово" />
        </Box>

        <Box>
          <Paper sx={{ p: 2, borderRadius: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Информация</Typography>
            <Divider sx={{ mb: 1 }} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Выберите задачу, чтобы увидеть детали</Typography>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default HomePage;
