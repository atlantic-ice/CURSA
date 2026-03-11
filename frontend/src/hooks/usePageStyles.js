import { alpha, useTheme } from "@mui/material";
import { useMemo } from "react";

export default function usePageStyles() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const textPrimary = theme.palette.text.primary;
  const textMuted = theme.palette.text.secondary;
  const textSubtle = alpha(theme.palette.text.secondary, isDark ? 0.76 : 0.72);
  const borderColor = alpha(theme.palette.divider, isDark ? 0.92 : 0.84);
  const borderColorSubtle = alpha(theme.palette.divider, isDark ? 0.56 : 0.48);
  const surface = alpha(theme.palette.background.paper, isDark ? 0.96 : 0.98);
  const surfaceHover = alpha(theme.palette.action.hover, isDark ? 0.72 : 0.88);
  const rowHover = alpha(theme.palette.action.hover, isDark ? 0.56 : 0.74);
  const inputBg = isDark
    ? alpha(theme.palette.common.white, 0.05)
    : alpha(theme.palette.common.black, 0.03);
  const pageBackground = theme.palette.background.default;
  const panelBg = alpha(theme.palette.background.paper, isDark ? 0.94 : 0.98);
  const elevatedPanelBg = isDark
    ? alpha(theme.palette.common.white, 0.06)
    : alpha(theme.palette.common.black, 0.035);
  const heroBg = panelBg;
  const panelShadow = isDark ? "0 18px 48px rgba(0,0,0,0.22)" : "0 18px 48px rgba(15,23,42,0.05)";
  const heroShadow = panelShadow;
  const accentSurface = alpha(theme.palette.primary.main, isDark ? 0.12 : 0.08);
  const dangerSurface = isDark ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.06)";

  return useMemo(
    () => ({
      isDark,
      textPrimary,
      textMuted,
      textSubtle,
      borderColor,
      borderColorSubtle,
      surface,
      surfaceHover,
      rowHover,
      inputBg,
      pageBackground,
      panelBg,
      elevatedPanelBg,
      heroBg,
      panelShadow,
      heroShadow,
      accentSurface,
      dangerSurface,
      contentPaddingX: { xs: 3, md: 4 },
      contentPaddingY: 4,
      cardRadius: 3,
      cardRadiusLg: 5,
      pageMaxWidth: 1480,
    }),
    [
      accentSurface,
      borderColor,
      borderColorSubtle,
      dangerSurface,
      elevatedPanelBg,
      heroBg,
      heroShadow,
      inputBg,
      isDark,
      pageBackground,
      panelBg,
      panelShadow,
      rowHover,
      surface,
      surfaceHover,
      textMuted,
      textPrimary,
      textSubtle,
    ],
  );
}
