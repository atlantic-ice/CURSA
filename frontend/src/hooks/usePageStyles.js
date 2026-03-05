import { useTheme } from "@mui/material";
import { useMemo } from "react";

export default function usePageStyles() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return useMemo(
    () => ({
      isDark,
      textPrimary: isDark ? "#fff" : "#000",
      textMuted: isDark ? "rgba(255,255,255,0.38)" : "rgba(0,0,0,0.42)",
      textSubtle: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.35)",
      borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
      borderColorSubtle: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
      surface: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.025)",
      surfaceHover: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
      rowHover: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
      inputBg: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
      contentPaddingX: { xs: 3, md: 4 },
      contentPaddingY: 4,
      cardRadius: 1,
    }),
    [isDark],
  );
}
