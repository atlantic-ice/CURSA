import React, { useContext, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  Container,
  IconButton,
  useTheme,
  useMediaQuery,
  Tooltip,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { ColorModeContext } from '../App';

const Header = () => {
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navLinks = [
    { name: 'Главная', path: '/' },
    { name: 'Требования', path: '/guidelines' },
    { name: 'Примеры', path: '/examples' },
    { name: 'Ресурсы', path: '/resources' },
    { name: 'История', path: '/history' },
  ];

  const drawer = (
    <Box
      sx={{
        width: 300,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'rgba(3,7,8,0.98)',
        color: 'text.primary',
        p: 3,
        gap: 3,
      }}
    >
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '0.2em' }}>
          CURSA
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Документы без компромиссов
        </Typography>
      </Box>
      <Divider sx={{ borderColor: 'rgba(148, 163, 184, 0.12)' }} />
      <List sx={{ flexGrow: 1 }}>
        {navLinks.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              component={RouterLink}
              to={item.path}
              onClick={handleDrawerToggle}
              selected={isActive(item.path)}
              sx={{
                borderRadius: 3,
                px: 2.5,
                py: 1.5,
                mb: 0.5,
                '&.Mui-selected': {
                  backgroundColor: 'rgba(125, 211, 252, 0.1)',
                  color: 'primary.main',
                },
              }}
            >
              <ListItemText
                primary={item.name}
                primaryTypographyProps={{
                  fontWeight: isActive(item.path) ? 600 : 500,
                  letterSpacing: '0.08em',
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Button
        variant="contained"
        component={RouterLink}
        to="/check"
        endIcon={<ArrowOutwardIcon fontSize="small" />}
        onClick={handleDrawerToggle}
        sx={{
          borderRadius: 999,
          letterSpacing: '0.12em',
          fontSize: '0.85rem',
        }}
      >
        Проверить работу
      </Button>
    </Box>
  );

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(10,10,10,0.85)' : 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: theme.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
        color: 'text.primary',
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ py: 1.5, display: 'flex', alignItems: 'center', gap: 3 }}>
          <Box
            component={RouterLink}
            to="/"
            sx={{
              textDecoration: 'none',
              color: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(59,130,246,0.6), rgba(59,130,246,0.2))',
                border: '1px solid rgba(59,130,246,0.3)',
              }}
            />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '0.1em' }}>
                CURSA
              </Typography>
            </Box>
          </Box>

          {!isMobile && (
            <Box component="nav" sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 6 }}>
              {navLinks.map((link) => (
                <Button
                  key={link.path}
                  component={RouterLink}
                  to={link.path}
                  disableRipple
                  sx={{
                    color: isActive(link.path) ? 'primary.main' : 'text.secondary',
                    letterSpacing: '0.02em',
                    fontSize: '0.875rem',
                    fontWeight: isActive(link.path) ? 600 : 500,
                    position: 'relative',
                    px: 1.5,
                    '&:after': {
                      content: '""',
                      position: 'absolute',
                      left: '50%',
                      bottom: -8,
                      width: isActive(link.path) ? '60%' : 0,
                      transition: 'width 0.25s ease',
                      height: 2,
                      borderRadius: 999,
                      transform: 'translateX(-50%)',
                      background: 'currentColor',
                    },
                    '&:hover': {
                      color: 'primary.light',
                    },
                  }}
                >
                  {link.name}
                </Button>
              ))}
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, marginLeft: 'auto' }}>
            <Tooltip title={theme.palette.mode === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}>
              <IconButton onClick={colorMode.toggleColorMode} color="inherit" size="large">
                {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Tooltip>
            {!isMobile && (
              <Button
                variant="contained"
                component={RouterLink}
                to="/check"
                endIcon={<ArrowOutwardIcon fontSize="small" />}
                sx={{
                  borderRadius: 999,
                  letterSpacing: '0.18em',
                  fontSize: '0.75rem',
                  px: 3.5,
                }}
              >
                Проверить работу
              </Button>
            )}
            {isMobile && (
              <IconButton onClick={handleDrawerToggle} color="inherit">
                <MenuIcon />
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </Container>
      <Drawer anchor="right" open={mobileOpen} onClose={handleDrawerToggle}>
        {drawer}
      </Drawer>
    </AppBar>
  );
};

export default Header; 