import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
import CloseIcon from "@mui/icons-material/Close";
import DarkModeRounded from "@mui/icons-material/DarkModeRounded";
import LightModeRounded from "@mui/icons-material/LightModeRounded";
import MenuIcon from "@mui/icons-material/Menu";
import {
    Box,
    Button,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Typography,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useContext, useState } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { ColorModeContext } from "../App";

const Header = () => {
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const isDark = theme.palette.mode === "dark";
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { name: "Главная", path: "/" },
    { name: "Требования", path: "/guidelines" },
    { name: "Примеры", path: "/examples" },
    { name: "Ресурсы", path: "/resources" },
    { name: "История", path: "/history" },
  ];

  const drawer = (
    <Box
      sx={{
        width: "100vw",
        maxWidth: 360,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.paper",
        p: "32px 28px",
        borderLeft: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 6 }}>
        <Typography
          sx={{
            fontSize: "0.95rem",
            fontWeight: 900,
            letterSpacing: "0.2em",
            color: "text.primary",
            fontFamily: "'Wix Madefor Display', sans-serif",
          }}
        >
          CURSA
        </Typography>
        <IconButton
          onClick={() => setMobileOpen(false)}
          aria-label="Закрыть меню"
          sx={{
            color: "text.secondary",
            p: 0.5,
            "&:hover": { color: "text.primary", bgcolor: "transparent" },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <List sx={{ flexGrow: 1, p: 0 }}>
        {navLinks.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              component={RouterLink}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              disableRipple
              sx={{
                px: 0,
                py: 1.5,
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.75)}`,
                borderRadius: 0,
                "&:hover": { bgcolor: "transparent" },
              }}
            >
              <ListItemText
                primary={item.name}
                primaryTypographyProps={{
                  fontWeight: isActive(item.path) ? 600 : 400,
                  fontSize: "1.1rem",
                  letterSpacing: "0.01em",
                  color: isActive(item.path) ? "text.primary" : "text.secondary",
                }}
              />
              {isActive(item.path) && (
                <Box
                  sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "primary.main", flexShrink: 0 }}
                />
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Button
        variant="contained"
        component={RouterLink}
        to="/"
        endIcon={<ArrowOutwardIcon fontSize="small" />}
        onClick={() => setMobileOpen(false)}
        sx={{
          mt: 4,
          borderRadius: 1,
          bgcolor: "primary.main",
          color: "primary.contrastText",
          fontWeight: 600,
          fontSize: "0.85rem",
          textTransform: "none",
          letterSpacing: "0.04em",
          boxShadow: "none",
          py: 1.5,
          "&:hover": { bgcolor: "primary.main", opacity: 0.92, boxShadow: "none" },
        }}
      >
        Проверить работу
      </Button>
    </Box>
  );

  return (
    <>
      <Box
        component="header"
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 56,
          display: "flex",
          alignItems: "center",
          px: { xs: 3, md: 5 },
          bgcolor: alpha(theme.palette.background.default, 0.85),
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.75)}`,
          zIndex: 1200,
        }}
      >
        {/* Logo */}
        <Box
          component={RouterLink}
          to="/"
          sx={{ textDecoration: "none", mr: { md: 6 }, flexShrink: 0 }}
        >
          <Typography
            sx={{
              fontSize: "0.95rem",
              fontWeight: 900,
              letterSpacing: "0.2em",
              color: "text.primary",
              fontFamily: "'Wix Madefor Display', sans-serif",
            }}
          >
            CURSA
          </Typography>
        </Box>

        {/* Desktop nav */}
        {!isMobile && (
          <Box component="nav" sx={{ display: "flex", alignItems: "center", gap: 0.5, flex: 1 }}>
            {navLinks.map((link) => (
              <Button
                key={link.path}
                component={RouterLink}
                to={link.path}
                disableRipple
                sx={{
                  color: isActive(link.path) ? "text.primary" : "text.secondary",
                  fontSize: "0.82rem",
                  fontWeight: isActive(link.path) ? 600 : 400,
                  textTransform: "none",
                  letterSpacing: "0.02em",
                  px: 1.5,
                  borderRadius: 0.5,
                  position: "relative",
                  "&:hover": { color: "text.primary", bgcolor: "action.hover" },
                  ...(isActive(link.path) && {
                    "&:after": {
                      content: '""',
                      position: "absolute",
                      bottom: 4,
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: 16,
                      height: 2,
                      bgcolor: "primary.main",
                      borderRadius: 999,
                    },
                  }),
                }}
              >
                {link.name}
              </Button>
            ))}
          </Box>
        )}

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, ml: "auto" }}>
          <IconButton
            onClick={colorMode.toggleColorMode}
            aria-label="Переключить тему"
            sx={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              bgcolor: "action.hover",
              color: "text.secondary",
              "&:hover": { bgcolor: "action.selected", color: "text.primary" },
            }}
          >
            {isDark ? (
              <LightModeRounded sx={{ fontSize: 16 }} />
            ) : (
              <DarkModeRounded sx={{ fontSize: 16 }} />
            )}
          </IconButton>
          {!isMobile && (
            <Button
              variant="outlined"
              component={RouterLink}
              to="/login"
              sx={{
                borderRadius: 1,
                borderColor: "divider",
                color: "text.secondary",
                textTransform: "none",
                fontSize: "0.8rem",
                fontWeight: 500,
                px: 2,
                py: 0.5,
                minHeight: 32,
                "&:hover": {
                  borderColor: "primary.main",
                  color: "text.primary",
                  bgcolor: "action.hover",
                },
              }}
            >
              Войти
            </Button>
          )}
          {!isMobile && (
            <Button
              variant="contained"
              component={RouterLink}
              to="/"
              endIcon={<ArrowOutwardIcon sx={{ fontSize: "12px !important" }} />}
              sx={{
                borderRadius: 1,
                bgcolor: "primary.main",
                color: "primary.contrastText",
                textTransform: "none",
                fontSize: "0.8rem",
                fontWeight: 600,
                px: 2,
                py: 0.5,
                minHeight: 32,
                letterSpacing: "0.02em",
                boxShadow: "none",
                "&:hover": { bgcolor: "primary.main", opacity: 0.92, boxShadow: "none" },
              }}
            >
              Проверить
            </Button>
          )}
          {isMobile && (
            <IconButton
              onClick={() => setMobileOpen(true)}
              aria-label="Открыть меню"
              sx={{
                color: "text.secondary",
                p: 0.75,
                "&:hover": { color: "text.primary", bgcolor: "transparent" },
              }}
            >
              <MenuIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>

      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        PaperProps={{ sx: { bgcolor: "transparent", boxShadow: "none" } }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Header;
