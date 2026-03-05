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
        bgcolor: "#000",
        p: "32px 28px",
        borderLeft: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 6 }}>
        <Typography
          sx={{
            fontSize: "0.95rem",
            fontWeight: 900,
            letterSpacing: "0.2em",
            color: "#fff",
            fontFamily: "'Wix Madefor Display', sans-serif",
          }}
        >
          CURSA
        </Typography>
        <IconButton
          onClick={() => setMobileOpen(false)}
          sx={{
            color: "rgba(255,255,255,0.4)",
            p: 0.5,
            "&:hover": { color: "#fff", bgcolor: "transparent" },
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
                borderBottom: "1px solid rgba(255,255,255,0.05)",
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
                  color: isActive(item.path) ? "#fff" : "rgba(255,255,255,0.45)",
                }}
              />
              {isActive(item.path) && (
                <Box
                  sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#fff", flexShrink: 0 }}
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
          bgcolor: "#fff",
          color: "#000",
          fontWeight: 600,
          fontSize: "0.85rem",
          textTransform: "none",
          letterSpacing: "0.04em",
          boxShadow: "none",
          py: 1.5,
          "&:hover": { bgcolor: "rgba(255,255,255,0.88)", boxShadow: "none" },
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
          bgcolor: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
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
              color: "#fff",
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
                  color: isActive(link.path) ? "#fff" : "rgba(255,255,255,0.4)",
                  fontSize: "0.82rem",
                  fontWeight: isActive(link.path) ? 600 : 400,
                  textTransform: "none",
                  letterSpacing: "0.02em",
                  px: 1.5,
                  borderRadius: 0.5,
                  position: "relative",
                  "&:hover": { color: "#fff", bgcolor: "rgba(255,255,255,0.05)" },
                  ...(isActive(link.path) && {
                    "&:after": {
                      content: '""',
                      position: "absolute",
                      bottom: 4,
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: 16,
                      height: 2,
                      bgcolor: "#fff",
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
            sx={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              bgcolor: "rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.7)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.16)", color: "#fff" },
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
                borderColor: "rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.7)",
                textTransform: "none",
                fontSize: "0.8rem",
                fontWeight: 500,
                px: 2,
                py: 0.5,
                minHeight: 32,
                "&:hover": {
                  borderColor: "rgba(255,255,255,0.4)",
                  color: "#fff",
                  bgcolor: "rgba(255,255,255,0.04)",
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
                bgcolor: "#fff",
                color: "#000",
                textTransform: "none",
                fontSize: "0.8rem",
                fontWeight: 600,
                px: 2,
                py: 0.5,
                minHeight: 32,
                letterSpacing: "0.02em",
                boxShadow: "none",
                "&:hover": { bgcolor: "rgba(255,255,255,0.88)", boxShadow: "none" },
              }}
            >
              Проверить
            </Button>
          )}
          {isMobile && (
            <IconButton
              onClick={() => setMobileOpen(true)}
              sx={{
                color: "rgba(255,255,255,0.6)",
                p: 0.75,
                "&:hover": { color: "#fff", bgcolor: "transparent" },
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
