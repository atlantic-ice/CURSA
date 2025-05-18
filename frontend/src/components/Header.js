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
  ListItemIcon
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
import { ColorModeContext } from '../App';

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
    { name: 'Проверить', path: '/check', icon: <CheckCircleOutlineIcon /> },
    { name: 'Требования', path: '/guidelines', icon: <ArticleIcon /> },
    { name: 'Примеры', path: '/examples', icon: <ImageIcon /> },
    { name: 'Ресурсы', path: '/resources', icon: <LibraryBooksIcon /> },
    { name: 'История', path: '/history', icon: <HistoryIcon /> }
  ];

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Typography variant="h6" sx={{ my: 2, fontWeight: 700 }}>
        Нормоконтроль
      </Typography>
      <Divider />
      <List>
        {navLinks.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton 
              component={RouterLink} 
              to={item.path}
              selected={location.pathname === item.path}
              sx={{
                textAlign: 'left',
                color: location.pathname === item.path ? 'primary.main' : 'inherit',
                '&.Mui-selected': {
                  bgcolor: 'action.selected',
                }
              }}
            >
              <ListItemIcon sx={{ 
                minWidth: 40,
                color: location.pathname === item.path ? 'primary.main' : 'inherit'
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <AppBar 
      position="sticky" 
      elevation={0}
      sx={{ 
        background: theme => theme.palette.mode === 'dark'
          ? 'rgba(24,28,36,0.92)'
          : 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1.5px solid',
        borderColor: 'divider',
        color: 'text.primary',
        boxShadow: theme => theme.palette.mode === 'dark'
          ? '0 2px 24px 0 #2563eb22'
          : '0 2px 16px 0 #2563eb11',
        transition: 'background 0.3s',
        zIndex: 1201
      }}
    >
      {/* Абсолютно левый логотип */}
      <Box sx={{
        position: 'absolute',
        left: 0,
        top: 0,
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        pl: { xs: 1.5, md: 3 },
        zIndex: 1300,
        pointerEvents: 'auto',
        bgcolor: 'transparent',
      }}>
        <Typography 
          variant="h4" 
          component={RouterLink} 
          to="/"
          sx={{ 
            flexGrow: 0, 
            textDecoration: 'none', 
            color: theme => theme.palette.mode === 'dark' ? '#fff' : '#111',
            fontWeight: 900,
            letterSpacing: 3.5,
            fontSize: { xs: 28, md: 34 },
            fontFamily: 'Inter, Arial, sans-serif',
            textTransform: 'uppercase',
            transition: 'color 0.3s',
            mr: 0,
            pl: 0,
            cursor: 'pointer',
            textShadow: theme => theme.palette.mode === 'dark'
              ? '0 2px 16px #2563eb22'
              : '0 2px 8px #2563eb11',
            '&:hover': {
              filter: 'brightness(1.08)',
            },
          }}
        >
          CURSA
        </Typography>
      </Box>
      {/* Абсолютно правая зона: смена темы и загрузка */}
      {!isMobile && (
        <Box sx={{
          position: 'absolute',
          right: 0,
          top: 0,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          pr: { xs: 1.5, md: 3 },
          zIndex: 1300,
          pointerEvents: 'auto',
          bgcolor: 'transparent',
        }}>
          <Tooltip title={theme.palette.mode === 'dark' ? 'Светлая тема' : 'Темная тема'}>
            <IconButton 
              onClick={colorMode.toggleColorMode} 
              color="inherit" 
              sx={{ fontSize: 24, mr: 2 }}
            >
              {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Tooltip>
          <Button 
            variant="contained"
            size="medium"
            component={RouterLink}
            to="/check"
            sx={{
              px: 3.5,
              py: 1.2,
              fontWeight: 700,
              fontSize: 17,
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
                  ? 'linear-gradient(90deg, #1e293b 0%, #2563eb 100%)'
                  : 'linear-gradient(90deg, #1976d2 0%, #64b5f6 100%)',
                boxShadow: theme => theme.palette.mode === 'dark'
                  ? '0 4px 16px #2563eb55'
                  : '0 4px 12px #2563eb33',
              }
            }}
          >
            Загрузить
          </Button>
        </Box>
      )}
      <Container maxWidth="lg" disableGutters>
        <Toolbar sx={{ py: 1, minHeight: 64, pl: { xs: 10, md: 13 }, pr: { xs: 10, md: 13 } }}>
          {/* Навигация для ПК */}
          {!isMobile && (
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
              {navLinks.map((link) => (
                <Button
                  key={link.path}
                  component={RouterLink}
                  to={link.path}
                  sx={{ 
                    mx: 0.5,
                    px: 1.5,
                    py: 1.2,
                    color: location.pathname === link.path ? 'primary.main' : 'text.primary',
                    fontWeight: 600,
                    fontSize: 17,
                    borderRadius: 2,
                    background: 'none',
                    position: 'relative',
                    overflow: 'visible',
                    transition: 'color 0.2s',
                    '&:after': {
                      content: '""',
                      display: 'block',
                      position: 'absolute',
                      left: 8,
                      right: 8,
                      bottom: 6,
                      height: 2.5,
                      borderRadius: 2,
                      background: location.pathname === link.path
                        ? 'linear-gradient(90deg, #2563eb 0%, #6366f1 100%)'
                        : 'transparent',
                      opacity: location.pathname === link.path ? 1 : 0,
                      transition: 'opacity 0.25s',
                    },
                    '&:hover': {
                      bgcolor: 'transparent',
                      color: 'primary.main',
                      '&:after': {
                        opacity: 1,
                        background: 'linear-gradient(90deg, #2563eb 0%, #6366f1 100%)',
                      }
                    }
                  }}
                  disableRipple
                >
                  {link.name}
                </Button>
              ))}
            </Box>
          )}
        </Toolbar>
      </Container>
      {/* WOW-анимация underline */}
      <style jsx global>{`
        .MuiButton-root[aria-current="page"]:after {
          opacity: 1 !important;
        }
      `}</style>
      {/* Mobile menu drawer */}
      <Drawer
        anchor="right"
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better performance on mobile
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 280 },
        }}
      >
        {drawer}
      </Drawer>
    </AppBar>
  );
};

export default Header;