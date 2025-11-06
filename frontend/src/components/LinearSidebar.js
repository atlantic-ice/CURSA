import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Box, Typography, IconButton, useTheme } from '@mui/material';
import {
  Home as HomeIcon,
  Description as DocumentIcon,
  CheckCircle as CheckIcon,
  BookOpen as GuideIcon,
  LibraryBooks as ExamplesIcon,
  FolderOpen as ResourcesIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
} from '@mui/icons-material';

const LinearSidebar = ({ colorMode, mode }) => {
  const theme = useTheme();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: <HomeIcon />, label: 'Главная' },
    { path: '/check', icon: <CheckIcon />, label: 'Проверка' },
    { path: '/guidelines', icon: <GuideIcon />, label: 'Методические указания' },
    { path: '/examples', icon: <ExamplesIcon />, label: 'Примеры' },
    { path: '/resources', icon: <ResourcesIcon />, label: 'Ресурсы' },
    { path: '/history', icon: <HistoryIcon />, label: 'История' },
    { path: '/admin', icon: <SettingsIcon />, label: 'Администрирование' },
  ];

  return (
    <Box
      sx={{
        width: 240,
        height: '100vh',
        position: 'sticky',
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        borderRight: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
        overflow: 'hidden',
      }}
    >
      {/* Логотип и название */}
      <Box
        sx={{
          p: 3,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(135deg, #007AFF 0%, #0066D6 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em',
          }}
        >
          CURSA
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: theme.palette.text.secondary,
            fontSize: '0.75rem',
            mt: 0.5,
            display: 'block',
          }}
        >
          Нормоконтроль документов
        </Typography>
      </Box>

      {/* Навигация */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          py: 2,
          px: 1.5,
        }}
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              style={{ textDecoration: 'none' }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 1.5,
                  py: 1,
                  my: 0.25,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  backgroundColor: isActive
                    ? theme.palette.action.selected
                    : 'transparent',
                  color: isActive
                    ? theme.palette.text.primary
                    : theme.palette.text.secondary,
                  fontWeight: isActive ? 600 : 500,
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                    color: theme.palette.text.primary,
                  },
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 20,
                    height: 20,
                    '& svg': {
                      fontSize: 20,
                    },
                  }}
                >
                  {item.icon}
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 'inherit',
                  }}
                >
                  {item.label}
                </Typography>
              </Box>
            </NavLink>
          );
        })}
      </Box>

      {/* Переключатель темы */}
      <Box
        sx={{
          p: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 1.5,
            py: 1,
            borderRadius: '6px',
            backgroundColor: theme.palette.action.hover,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontSize: '0.875rem',
              fontWeight: 500,
              color: theme.palette.text.secondary,
            }}
          >
            Тема
          </Typography>
          <IconButton
            onClick={colorMode.toggleColorMode}
            size="small"
            sx={{
              color: theme.palette.text.secondary,
              '&:hover': {
                backgroundColor: theme.palette.action.selected,
              },
            }}
          >
            {mode === 'dark' ? (
              <LightModeIcon fontSize="small" />
            ) : (
              <DarkModeIcon fontSize="small" />
            )}
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default LinearSidebar;
