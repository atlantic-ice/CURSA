import React from 'react';
import { Box, Typography } from '@mui/material';
import MinimalDropBox from '../components/MinimalDropBox';

export default function UploadPage() {
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>Загрузить документ</Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
          Перетащите .docx файл для автоматической проверки на соответствие ГОСТ
        </Typography>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <MinimalDropBox />
      </Box>
    </Box>
  );
}
