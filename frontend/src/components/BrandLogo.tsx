import { Box, BoxProps, useTheme } from "@mui/material";
import logoIcon from "../assets/logo-icon.svg";
import logoIconDark from "../assets/logo-icon-dark.svg";

interface BrandLogoProps extends BoxProps {
  size?: "small" | "medium" | "large";
  variant?: "standalone" | "contained";
}

/**
 * BrandLogo Component
 * Displays the CURSA celestial navigation star logo.
 * Automatically adapts to light/dark theme.
 * Default: standalone (no container)
 */
const BrandLogo: React.FC<BrandLogoProps> = ({
  size = "medium",
  variant = "standalone",
  sx,
  ...props
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const sizeConfig = {
    small: {
      containerSize: 38,
      logoSize: 32,
    },
    medium: {
      containerSize: 80,
      logoSize: 64,
    },
    large: {
      containerSize: 140,
      logoSize: 120,
    },
  };

  const config = sizeConfig[size];
  const logoSrc = isDark ? logoIcon : logoIconDark;

  // Standalone variant - just the logo with no container (DEFAULT)
  if (variant === "standalone") {
    return (
      <Box
        component="img"
        src={logoSrc}
        alt="CURSA"
        sx={{
          width: config.logoSize,
          height: config.logoSize,
          objectFit: "contain",
          userSelect: "none",
          ...sx,
        }}
        {...props}
      />
    );
  }

  // Contained variant - logo with background container
  return (
    <Box
      sx={{
        width: config.containerSize,
        height: config.containerSize,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: size === "small" ? "10px" : "16px",
        backgroundColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)",
        border: "1px solid",
        borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)",
        backdropFilter: "blur(10px)",
        boxShadow: isDark ? "0 4px 20px rgba(0, 0, 0, 0.3)" : "0 2px 8px rgba(0, 0, 0, 0.08)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.06)",
          borderColor: isDark ? "rgba(255, 255, 255, 0.16)" : "rgba(0, 0, 0, 0.12)",
          boxShadow: isDark ? "0 8px 32px rgba(0, 0, 0, 0.4)" : "0 4px 16px rgba(0, 0, 0, 0.12)",
        },
        ...sx,
      }}
      {...props}
    >
      <Box
        component="img"
        src={logoSrc}
        alt="CURSA"
        sx={{
          width: config.logoSize,
          height: config.logoSize,
          objectFit: "contain",
          userSelect: "none",
        }}
      />
    </Box>
  );
};

export default BrandLogo;
