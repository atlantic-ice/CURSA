import React, { useContext } from 'react';
import { Box, List, ListItemButton, ListItemIcon, Tooltip, IconButton } from '@mui/material';
import HomeIcon from '@mui/icons-material/HomeOutlined';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFileOutlined';
import HistoryIcon from '@mui/icons-material/HistoryOutlined';
import AssessmentIcon from '@mui/icons-material/AssessmentOutlined';
import DarkModeIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeIcon from '@mui/icons-material/LightModeOutlined';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { ColorModeContext } from '../App';

const LeftNav = ({ width = 84 }) => {
  const location = useLocation();
  const items = [
    { label: 'Главная', icon: <HomeIcon />, to: '/' },
    { label: 'Проверка', icon: <InsertDriveFileIcon />, to: '/check' },
    { label: 'История', icon: <HistoryIcon />, to: '/history' },
    { label: 'Отчёты', icon: <AssessmentIcon />, to: '/reports' },
  ];

  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);

  return (
    <Box sx={{ width, height: '100vh', borderRight: '1px solid', borderColor: 'divider', bgcolor: 'background.default', display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 2 }}>
      <Box sx={{ mb: 2, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Box sx={{ width: 36, height: 36, borderRadius: '6px', bgcolor: 'primary.main' }} />
      </Box>
      <List sx={{ width: '100%', px: 0 }}>
        {items.map((it) => (
          <Tooltip key={it.to} title={it.label} placement="right">
            <ListItemButton
              component={RouterLink}
              to={it.to}
              selected={location.pathname === it.to}
              sx={{ justifyContent: 'center', py: 1.5, minHeight: 56 }}
            >
              <ListItemIcon sx={{ minWidth: 0, color: location.pathname === it.to ? 'primary.main' : 'text.secondary' }}>{it.icon}</ListItemIcon>
            </ListItemButton>
          </Tooltip>
        ))}
      </List>
      <Box sx={{ flex: 1 }} />
      <Box sx={{ pb: 2 }}>
        <Tooltip title={theme.palette.mode === 'dark' ? 'Светлая тема' : 'Тёмная тема'} placement="right">
          <IconButton color="inherit" onClick={() => colorMode.toggleColorMode()}>
            {theme.palette.mode === 'dark' ? <LightModeIcon sx={{ color: 'text.secondary' }} /> : <DarkModeIcon sx={{ color: 'text.secondary' }} />}
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default LeftNav;
