import React from 'react';
import { Box, Container, Grid, Typography, Link, Divider, useTheme, IconButton } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TelegramIcon from '@mui/icons-material/Telegram';

const Footer = () => {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: 'Сервис',
      links: [
        { name: 'Главная', path: '/' },
        { name: 'Проверка', path: '/check' },
        { name: 'История', path: '/history' },
      ]
    },
    {
      title: 'Информация',
      links: [
        { name: 'Требования', path: '/guidelines' },
        { name: 'Примеры', path: '/examples' },
        { name: 'Ресурсы', path: '/resources' },
      ]
    },
    {
      title: 'Контакты',
      links: [
        { name: 'О нас', path: '/about' },
        { name: 'Поддержка', path: '/support' },
        { name: 'Обратная связь', path: '/feedback' },
      ]
    }
  ];

  return (
    <Box
      component="footer"
      sx={{
        py: 6,
        px: 2,
        mt: 'auto',
        backgroundColor: theme => theme.palette.mode === 'dark' 
          ? 'rgba(15, 23, 42, 0.95)' 
          : 'rgba(248, 250, 252, 0.95)',
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Логотип и описание */}
          <Grid item xs={12} md={4}>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 800,
                letterSpacing: '0.05em',
                fontFamily: '"Montserrat", "Roboto", "Arial", sans-serif',
                color: theme => theme.palette.mode === 'dark' ? '#60a5fa' : '#2563eb',
                mb: 2
              }}
            >
              CURSA
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 300 }}>
              Сервис автоматизированной проверки курсовых работ на соответствие требованиям оформления
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
              <IconButton 
                size="small" 
                aria-label="github"
                sx={{ 
                  color: 'text.secondary',
                  '&:hover': { color: 'primary.main', bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(37, 99, 235, 0.1)' : 'rgba(37, 99, 235, 0.05)' }
                }}
              >
                <GitHubIcon fontSize="small" />
              </IconButton>
              <IconButton 
                size="small" 
                aria-label="telegram"
                sx={{ 
                  color: 'text.secondary',
                  '&:hover': { color: 'primary.main', bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(37, 99, 235, 0.1)' : 'rgba(37, 99, 235, 0.05)' }
                }}
              >
                <TelegramIcon fontSize="small" />
              </IconButton>
              <IconButton 
                size="small" 
                aria-label="linkedin"
                sx={{ 
                  color: 'text.secondary',
                  '&:hover': { color: 'primary.main', bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(37, 99, 235, 0.1)' : 'rgba(37, 99, 235, 0.05)' }
                }}
              >
                <LinkedInIcon fontSize="small" />
              </IconButton>
            </Box>
          </Grid>

          {/* Ссылки */}
          {footerLinks.map((section) => (
            <Grid item xs={6} sm={4} md={2} key={section.title}>
              <Typography variant="subtitle2" color="text.primary" fontWeight={600} gutterBottom>
                {section.title}
              </Typography>
              <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
                {section.links.map((link) => (
                  <Box component="li" key={link.name} sx={{ py: 0.5 }}>
                    <Link
                      component={RouterLink}
                      to={link.path}
                      color="text.secondary"
                      sx={{ 
                        textDecoration: 'none',
                        fontSize: '0.875rem',
                        transition: 'color 0.2s',
                        '&:hover': { color: 'primary.main' }
                      }}
                    >
                      {link.name}
                    </Link>
                  </Box>
                ))}
              </Box>
            </Grid>
          ))}

          {/* Дополнительная информация */}
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" color="text.primary" fontWeight={600} gutterBottom>
              Подпишитесь на обновления
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Получайте уведомления о новых функциях и улучшениях сервиса
            </Typography>
            <Box
              component="form"
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 1,
              }}
            >
              <Box
                component="input"
                placeholder="Ваш email"
                sx={{
                  flex: 1,
                  py: 1.5,
                  px: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  bgcolor: 'background.paper',
                  color: 'text.primary',
                  fontSize: '0.875rem',
                  outline: 'none',
                  transition: 'all 0.2s',
                  '&:focus': {
                    borderColor: 'primary.main',
                    boxShadow: theme => theme.palette.mode === 'dark'
                      ? '0 0 0 2px rgba(37, 99, 235, 0.2)'
                      : '0 0 0 2px rgba(37, 99, 235, 0.1)',
                  },
                }}
              />
              <Box
                component="button"
                type="submit"
                sx={{
                  py: 1.5,
                  px: 3,
                  border: 'none',
                  borderRadius: 1,
                  bgcolor: 'primary.main',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                }}
              >
                Подписаться
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        {/* Копирайт */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            © {currentYear} CURSA. Все права защищены.
          </Typography>
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Link
              component={RouterLink}
              to="/privacy"
              color="text.secondary"
              sx={{ 
                textDecoration: 'none',
                fontSize: '0.75rem',
                transition: 'color 0.2s',
                '&:hover': { color: 'primary.main' }
              }}
            >
              Политика конфиденциальности
            </Link>
            <Link
              component={RouterLink}
              to="/terms"
              color="text.secondary"
              sx={{ 
                textDecoration: 'none',
                fontSize: '0.75rem',
                transition: 'color 0.2s',
                '&:hover': { color: 'primary.main' }
              }}
            >
              Условия использования
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer; 