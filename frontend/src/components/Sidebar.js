import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  
  Avatar,
  Divider,
  useTheme,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import GroupIcon from '@mui/icons-material/Group';
import DescriptionIcon from '@mui/icons-material/Description';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
// promo icon removed

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const width = 240;

  // Derive active section from current pathname
  const activeSection = location.pathname.substring(1) || 'dashboard';

  // Define a common style for all sidebar icons to make them thinner and lighter
  // Icon style as a function to allow dynamic color
  const sidebarIconSx = (isActive) => ({
    color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
    width: 20,
    height: 20,
    fontSize: 20,
    transition: 'none',
    marginRight: 0.5,
    verticalAlign: 'middle',
    fill: 'currentColor',
    shapeRendering: 'geometricPrecision',
    willChange: 'transform, opacity',
  });

  const mainMenuItems = [
    { id: 'dashboard', label: 'Панель', icon: (isActive, isHover) => <BarChartIcon fontSize="small" sx={sidebarIconSx(isActive || isHover)} /> },
    { id: 'upload', label: 'Загрузить', icon: (isActive, isHover) => <FolderIcon fontSize="small" sx={sidebarIconSx(isActive || isHover)} /> },
    { id: 'materials', label: 'Материалы', icon: (isActive, isHover) => <MenuBookIcon fontSize="small" sx={sidebarIconSx(isActive || isHover)} /> },
    { id: 'assignments', label: 'Задания', icon: (isActive, isHover) => <DescriptionIcon fontSize="small" sx={sidebarIconSx(isActive || isHover)} /> },
  ];

  const preferencesItems = [
    { id: 'users', label: 'Команда', icon: (isActive, isHover) => <GroupIcon fontSize="small" sx={sidebarIconSx(isActive || isHover)} /> },
    { id: 'settings', label: 'Настройки', icon: (isActive, isHover) => <SettingsIcon fontSize="small" sx={sidebarIconSx(isActive || isHover)} /> },
  ];

  const otherItems = [
    { id: 'notifications', label: 'Уведомления', icon: (isActive, isHover) => <NotificationsNoneIcon fontSize="small" sx={sidebarIconSx(isActive || isHover)} /> },
    { id: 'help', label: 'Помощь и поддержка', icon: (isActive, isHover) => <HelpOutlineIcon fontSize="small" sx={sidebarIconSx(isActive || isHover)} /> },
  ];

  // Sidebar item as a component (no animations)
  const SidebarItem = ({ item, isActive, onClick, isExiting, isEntering }) => {
    const [isHover, setIsHover] = React.useState(false);
    const itemRadius = 8; // px
    return (
      <Box
        key={item.id}
        role="button"
        tabIndex={0}
        onClick={() => navigate(`/${item.id}`)}
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          px: 1.25,
          py: 1,
          borderRadius: `${itemRadius}px`,
          cursor: 'pointer',
          color: isActive || isHover ? '#fff' : 'rgba(255,255,255,0.55)',
          backgroundColor: isActive ? 'rgba(255,255,255,0.08)' : isHover ? 'rgba(255,255,255,0.04)' : 'transparent',
          transition: 'none',
          transform: 'none',
          willChange: 'auto',
          fontSize: '0.875rem',
          fontWeight: 300,
          fontFamily: 'Roboto, Arial, sans-serif',
        }}
      >
        <Box
          component="span"
          sx={{
            display: 'flex',
            alignItems: 'center',
            transition: 'none',
            transform: 'none',
            opacity: 1,
          }}
        >
          {item.icon(isActive, isHover)}
        </Box>
        <Typography variant="body2" sx={{ fontWeight: 300, fontFamily: 'Roboto, Arial, sans-serif', color: 'inherit', transition: 'none', transform: 'none' }}>{item.label}</Typography>
      </Box>
    );
  };

  // Simple render: no animation sequencing, activate immediately
  const renderItem = (item) => (
    <SidebarItem
      key={item.id}
      item={item}
      isActive={activeSection === item.id}
      onClick={(id) => navigate(`/${id}`)}
    />
  );

  return (
    <Box
      sx={{
        width,
        position: 'fixed',
        // inset from viewport to match card offsets
        top: '10px',
        left: '10px',
        // height reduced by top+bottom inset
        height: 'calc(100vh - 20px)',
        // Match main card appearance but darker (less light)
        backgroundColor: '#0b0b0d',
        border: '1px solid rgba(255,255,255,0.02)',
        // rounded on all corners since sidebar is inset
        borderRadius: 4,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1200,
      }}
    >
      {/* Logo */}
      <Box sx={{ px: 2, pt: 2.5, pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography className="logo-brand" variant="subtitle1" sx={{ color: '#fff', fontWeight: 600, fontSize: '1rem', letterSpacing: '-0.02em' }}>
            CURSA
          </Typography>
        </Box>
      </Box>

      {/* Search removed from sidebar as requested */}

      {/* Navigation */}
      <Box sx={{ px: 1.5, pb: 2, overflowY: 'auto', flex: 1 }}>
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {mainMenuItems.map(renderItem)}
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          {/* Aesthetic separator instead of section title */}
          <Box sx={{ px: 1.25, mb: 1.25 }}>
            <Box sx={{ height: 2, width: '100%', borderRadius: 1, background: 'linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))' }} aria-hidden />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {preferencesItems.map(renderItem)}
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          {/* Aesthetic separator instead of section title */}
          <Box sx={{ px: 1.25, mb: 1.25 }}>
            <Box sx={{ height: 2, width: '100%', borderRadius: 1, background: 'linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))' }} aria-hidden />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {otherItems.map(renderItem)}
          </Box>
        </Box>

        {/* Promo block removed as requested */}
      </Box>

      {/* User */}
      <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'rgba(255,255,255,0.06)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 1.25, py: 1, borderRadius: 1, cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(255,255,255,0.04)' } }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(124,58,237,0.9)', fontSize: 12, fontWeight: 300, fontFamily: 'Roboto, Arial, sans-serif' }}>AM</Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.55)', fontWeight: 300, fontFamily: 'Roboto, Arial, sans-serif' }} noWrap>Администратор</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)', fontWeight: 300, fontFamily: 'Roboto, Arial, sans-serif' }} noWrap>admin@cursa.app</Typography>
          </Box>
          <ExpandMoreIcon sx={{ width: 18, height: 18, color: 'rgba(255,255,255,0.6)' }} />
        </Box>
      </Box>
    </Box>
  );
};

export default Sidebar;
