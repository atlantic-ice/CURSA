import { Box, SxProps, Theme } from "@mui/material";
import React from "react";

interface LogoProps {
  variant?: "full" | "icon";
  width?: number | string;
  height?: number | string;
  sx?: SxProps<Theme>;
}

/**
 * CURSA Logo Component
 *
 * Displays the minimalist celestial navigation star logo
 * with optional text. Supports both full logo with text
 * and icon-only variants.
 */
const Logo: React.FC<LogoProps> = ({ variant = "full", width, height, sx = {} }) => {
  const logoSrc = variant === "full" ? "/logo.svg" : require("../assets/logo-icon.svg").default;

  const defaultWidth = variant === "full" ? 180 : 60;
  const defaultHeight = variant === "full" ? 240 : 60;

  return (
    <Box
      component="img"
      src={logoSrc}
      alt="CURSA"
      sx={{
        width: width ?? defaultWidth,
        height: height ?? defaultHeight,
        objectFit: "contain",
        userSelect: "none",
        ...sx,
      }}
    />
  );
};

export default Logo;
