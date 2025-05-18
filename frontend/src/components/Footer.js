import React from 'react';
import { Box, Container, Typography, Link, Divider, Stack, IconButton } from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import SchoolIcon from '@mui/icons-material/School';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) => theme.palette.mode === 'light'
          ? 'rgba(0, 0, 0, 0.02)'
          : 'rgba(255, 255, 255, 0.05)',
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="lg">
        <Box 
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'center', md: 'flex-start' },
            textAlign: { xs: 'center', md: 'left' },
          }}
        >
          <Box sx={{ mb: { xs: 2, md: 0 } }}>
            <Typography variant="h6" component="div" gutterBottom sx={{ fontWeight: 700 }}>
              Нормоконтроль курсовых работ
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
              Сервис для автоматической проверки оформления и форматирования документов курсовых работ
              в соответствии с требованиями ГОСТ.
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
              Полезные ссылки
            </Typography>
            <Stack spacing={1}>
              <Link href="/guidelines" color="inherit" underline="hover">
                Требования к оформлению
              </Link>
              <Link href="/examples" color="inherit" underline="hover">
                Примеры оформления
              </Link>
              <Link href="/resources" color="inherit" underline="hover">
                Ресурсы и шаблоны
              </Link>
            </Stack>
          </Box>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Box 
          sx={{ 
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            textAlign: { xs: 'center', sm: 'left' },
          }}
        >
          <Typography variant="body2" color="text.secondary">
            &copy; {currentYear} Нормоконтроль курсовых работ. Все права защищены.
          </Typography>
          
          <Box sx={{ mt: { xs: 2, sm: 0 } }}>
            <IconButton color="inherit" aria-label="Университет" size="small">
              <SchoolIcon fontSize="small" />
            </IconButton>
            <IconButton color="inherit" aria-label="GitHub" size="small">
              <GitHubIcon fontSize="small" />
            </IconButton>
            <IconButton color="inherit" aria-label="LinkedIn" size="small">
              <LinkedInIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer; 