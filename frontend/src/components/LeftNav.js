import AssessmentIcon from "@mui/icons-material/AssessmentOutlined";
import DarkModeIcon from "@mui/icons-material/DarkModeOutlined";
import DashboardIcon from "@mui/icons-material/DashboardOutlined";
import HistoryIcon from "@mui/icons-material/HistoryOutlined";
import HomeIcon from "@mui/icons-material/HomeOutlined";
import LightModeIcon from "@mui/icons-material/LightModeOutlined";
import LogoutIcon from "@mui/icons-material/LogoutOutlined";
import SettingsIcon from "@mui/icons-material/SettingsOutlined";
import TuneIcon from "@mui/icons-material/TuneOutlined";
import {
  Avatar,
  Box,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  Tooltip,
} from "@mui/material";
import { useContext } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { AuthContext, ColorModeContext } from "../App";
import usePageStyles from "../hooks/usePageStyles";
import BrandLogo from "./BrandLogo";

const LeftNav = ({ width = 64 }) => {
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const items = [
    { label: "Главная", icon: <HomeIcon />, to: "/" },
    { label: "Панель", icon: <DashboardIcon />, to: "/dashboard" },
    { label: "История", icon: <HistoryIcon />, to: "/history" },
    { label: "Профили", icon: <TuneIcon />, to: "/profiles" },
    { label: "Отчёты", icon: <AssessmentIcon />, to: "/reports" },
    { label: "Настройки", icon: <SettingsIcon />, to: "/settings" },
  ];

  const colorMode = useContext(ColorModeContext);
  const { isDark, surface, surfaceHover } = usePageStyles();

  return (
    <Box
      sx={{
        width,
        height: "100vh",
        borderRight: "1px solid",
        borderColor: "divider",
        bgcolor: "background.default",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        pt: 2,
        flexShrink: 0,
      }}
    >
      {/* Логотип */}
      <Box sx={{ mb: 2.5, width: "100%", display: "flex", justifyContent: "center" }}>
        <Box component={RouterLink} to="/" sx={{ textDecoration: "none", display: "flex" }}>
          <BrandLogo size="small" />
        </Box>
      </Box>
      <List sx={{ width: "100%", px: 0.5 }}>
        {items.map((it) => {
          const isActive =
            location.pathname === it.to || (it.to !== "/" && location.pathname.startsWith(it.to));
          return (
            <Tooltip key={it.to} title={it.label} placement="right">
              <ListItemButton
                component={RouterLink}
                to={it.to}
                sx={{
                  justifyContent: "center",
                  py: 1.25,
                  px: 0,
                  minHeight: 48,
                  borderRadius: "8px",
                  mb: 0.25,
                  bgcolor: isActive ? surface : "transparent",
                  "&:hover": {
                    bgcolor: surfaceHover,
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    color: isActive ? "primary.main" : "text.secondary",
                    "& svg": { fontSize: 20 },
                  }}
                >
                  {it.icon}
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
          );
        })}
      </List>
      <Box sx={{ flex: 1 }} />
      <Box sx={{ pb: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
        {/* User avatar / logout */}
        {user ? (
          <Tooltip title={user.first_name || user.email || "Аккаунт"} placement="right">
            <IconButton
              size="small"
              component={RouterLink}
              to="/account"
              sx={{
                p: 0.5,
                borderRadius: "8px",
                bgcolor: location.pathname.startsWith("/account") ? surface : "transparent",
                "&:hover": {
                  bgcolor: surfaceHover,
                },
              }}
            >
              <Avatar
                sx={{
                  width: 28,
                  height: 28,
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  bgcolor: location.pathname.startsWith("/account")
                    ? "primary.main"
                    : isDark
                      ? "rgba(255,255,255,0.15)"
                      : "rgba(0,0,0,0.12)",
                  color: location.pathname.startsWith("/account")
                    ? isDark
                      ? "#000"
                      : "#fff"
                    : "text.primary",
                  transition: "background 0.2s",
                }}
              >
                {(user.first_name?.[0] || user.email?.[0] || "U").toUpperCase()}
              </Avatar>
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title="Войти" placement="right">
            <IconButton
              component={RouterLink}
              to="/login"
              size="small"
              sx={{
                color: "text.disabled",
                borderRadius: "8px",
                "&:hover": { color: "text.secondary" },
              }}
            >
              <LogoutIcon sx={{ fontSize: 18, transform: "scaleX(-1)" }} />
            </IconButton>
          </Tooltip>
        )}
        {/* Admin gear — only for admin role */}
        {user?.role === "admin" && (
          <Tooltip title="Администратор" placement="right">
            <IconButton
              component={RouterLink}
              to="/admin"
              size="small"
              sx={{
                color: location.pathname.startsWith("/admin") ? "primary.main" : "text.disabled",
                bgcolor: location.pathname.startsWith("/admin") ? surface : "transparent",
                borderRadius: "8px",
                "&:hover": {
                  color: "text.secondary",
                  bgcolor: surfaceHover,
                },
              }}
            >
              <SettingsIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title={isDark ? "Светлая тема" : "Тёмная тема"} placement="right">
          <IconButton
            size="small"
            onClick={() => colorMode.toggleColorMode()}
            sx={{ color: "text.secondary", "&:hover": { color: "text.primary" } }}
          >
            {isDark ? (
              <LightModeIcon sx={{ fontSize: 20 }} />
            ) : (
              <DarkModeIcon sx={{ fontSize: 20 }} />
            )}
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default LeftNav;
