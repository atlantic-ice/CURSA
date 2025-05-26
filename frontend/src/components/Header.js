import React, { useContext, useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  Button, 
  Container,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  useTheme,
  useMediaQuery,
  Tooltip,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Badge,
  Avatar,
  Chip
} from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import HistoryIcon from '@mui/icons-material/History';
import HomeIcon from '@mui/icons-material/Home';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ArticleIcon from '@mui/icons-material/Article';
import ImageIcon from '@mui/icons-material/Image';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { ColorModeContext } from '../App';
import { keyframes } from '@mui/system';

const Header = () => {
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState(null);
  const isMobileMenuOpen = Boolean(mobileMenuAnchorEl);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const handleMobileMenuOpen = (event) => {
    setMobileMenuAnchorEl(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchorEl(null);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navLinks = [
    { name: 'Главная', path: '/', icon: <HomeIcon /> },
    { name: 'Требования', path: '/guidelines', icon: <ArticleIcon /> },
    { name: 'Примеры', path: '/examples', icon: <ImageIcon /> },
    { name: 'Ресурсы', path: '/resources', icon: <LibraryBooksIcon /> },
    { name: 'История', path: '/history', icon: <HistoryIcon /> }
  ];

  const drawer = (
    <Box sx={{ width: 280, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        p: 2,
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 800,
            letterSpacing: '0.05em',
            fontFamily: '"Montserrat", "Roboto", "Arial", sans-serif',
          }}
        >
          CURSA
        </Typography>
        <IconButton onClick={handleDrawerToggle} edge="end">
          <CloseIcon />
        </IconButton>
      </Box>
      
      <List sx={{ flexGrow: 1, pt: 2 }}>
        {navLinks.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton 
              component={RouterLink} 
              to={item.path}
              selected={location.pathname === item.path}
              onClick={handleDrawerToggle}
              sx={{
                py: 1.5,
                px: 3,
                borderRadius: 2,
                mx: 1,
                mb: 0.5,
                color: location.pathname === item.path ? 'primary.main' : 'text.primary',
                '&.Mui-selected': {
                  bgcolor: theme => theme.palette.mode === 'dark' 
                    ? 'rgba(37, 99, 235, 0.15)'
                    : 'rgba(37, 99, 235, 0.08)',
                  '&:hover': {
                    bgcolor: theme => theme.palette.mode === 'dark' 
                      ? 'rgba(37, 99, 235, 0.25)'
                      : 'rgba(37, 99, 235, 0.15)',
                  }
                },
                '&:hover': {
                  bgcolor: theme => theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.04)',
                }
              }}
            >
              <ListItemIcon sx={{ 
                minWidth: 40,
                color: location.pathname === item.path ? 'primary.main' : 'inherit'
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.name} 
                primaryTypographyProps={{ 
                  fontWeight: location.pathname === item.path ? 600 : 500,
                  fontSize: '0.95rem'
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button 
          variant="contained"
          fullWidth
          component={RouterLink}
          to="/check"
          onClick={handleDrawerToggle}
          startIcon={<CheckCircleOutlineIcon />}
          sx={{
            py: 1.2,
            fontWeight: 600,
            fontSize: '0.95rem',
            boxShadow: theme => theme.palette.mode === 'dark'
              ? '0 2px 12px #2563eb44'
              : '0 2px 8px #2563eb22',
            background: theme => theme.palette.mode === 'dark'
              ? 'linear-gradient(90deg, #2563eb 0%, #6366f1 100%)'
              : 'linear-gradient(90deg, #2563eb 0%, #90caf9 100%)',
          }}
        >
          Проверить курсач
        </Button>
      </Box>
    </Box>
  );

  return (
    <AppBar 
      position="sticky" 
      elevation={0}
      sx={{ 
        background: theme => theme.palette.mode === 'dark'
          ? 'rgba(15, 23, 42, 0.92)'
          : 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid',
        borderColor: 'divider',
        color: 'text.primary',
        zIndex: 1201
      }}
    >
      <Container maxWidth="xl">
        <Toolbar sx={{ py: 1, minHeight: 64, display: 'flex', justifyContent: 'space-between' }}>
          {/* Логотип и название */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              userSelect: 'none',
            }}
            component={RouterLink}
            to="/"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 800,
                letterSpacing: '0.05em',
                fontFamily: '"Montserrat", "Roboto", "Arial", sans-serif',
                color: theme => theme.palette.mode === 'dark' ? '#60a5fa' : '#2563eb',
              }}
            >
              CURSA
            </Typography>
          </Box>
          
          {/* Десктопная навигация */}
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {navLinks.map((link, index) => (
                index !== 0 && (
                  <Button
                    key={link.path}
                    component={RouterLink}
                    to={link.path}
                    sx={{ 
                      mx: 0.5,
                      px: 1.5,
                      py: 1,
                      color: location.pathname === link.path ? 'primary.main' : 'text.primary',
                      fontWeight: location.pathname === link.path ? 600 : 500,
                      fontSize: '0.95rem',
                      position: 'relative',
                      overflow: 'visible',
                      transition: 'color 0.2s',
                      '&:hover': {
                        bgcolor: 'transparent',
                        color: 'primary.main',
                      },
                      '&::after': location.pathname === link.path ? {
                        content: '""',
                        position: 'absolute',
                        bottom: 0,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '60%',
                        height: '3px',
                        bgcolor: 'primary.main',
                        borderRadius: '3px 3px 0 0',
                      } : {}
                    }}
                    disableRipple
                  >
                    {link.name}
                  </Button>
                )
              ))}
            </Box>
          )}
          
          {/* Правая часть */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Кнопка темы */}
            <Tooltip title={theme.palette.mode === 'dark' ? 'Светлая тема' : 'Темная тема'}>
              <IconButton 
                onClick={colorMode.toggleColorMode} 
                color="inherit" 
                sx={{ fontSize: 24 }}
              >
                {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Tooltip>
            
            {/* Кнопка проверки */}
            {!isMobile && (
              <Button 
                variant="contained"
                size="medium"
                component={RouterLink}
                to="/check"
                sx={{
                  ml: 1,
                  px: 2.5,
                  py: 1,
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  borderRadius: 3,
                  boxShadow: theme => theme.palette.mode === 'dark'
                    ? '0 2px 12px #2563eb44'
                    : '0 2px 8px #2563eb22',
                  background: theme => theme.palette.mode === 'dark'
                    ? 'linear-gradient(90deg, #2563eb 0%, #6366f1 100%)'
                    : 'linear-gradient(90deg, #2563eb 0%, #90caf9 100%)',
                  color: theme => theme.palette.mode === 'dark'
                    ? theme.palette.primary.contrastText
                    : 'white',
                  letterSpacing: 0.5,
                  transition: 'all 0.2s',
                  '&:hover': {
                    background: theme => theme.palette.mode === 'dark'
                      ? 'linear-gradient(90deg, #1e40af 0%, #4f46e5 100%)'
                      : 'linear-gradient(90deg, #1d4ed8 0%, #60a5fa 100%)',
                    boxShadow: theme => theme.palette.mode === 'dark'
                      ? '0 4px 16px #2563eb55'
                      : '0 4px 12px #2563eb33',
                    transform: 'translateY(-1px)',
                  }
                }}
              >
                Проверить
              </Button>
            )}
            
            {/* Мобильное меню */}
            {isMobile && (
              <IconButton
                edge="end"
                color="inherit"
                aria-label="menu"
                onClick={handleDrawerToggle}
              >
                <MenuIcon />
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </Container>
      
      {/* Мобильное боковое меню */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawer}
      </Drawer>
    </AppBar>
  );
};

export default Header; 