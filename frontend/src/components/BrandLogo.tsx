import { Box, BoxProps, useTheme } from "@mui/material";
import logoIconDark from "../assets/logo-icon-dark.svg";
import logoIcon from "../assets/logo-icon.svg";

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
        borderRadius: size === "small" ? "16px" : "24px",
        background: isDark
          ? "#1C1C1E"
          : "linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(242,242,247,0.84) 100%)",
        border: isDark ? "none" : "1px solid",
        borderColor: isDark ? "transparent" : "rgba(17,21,28,0.08)",
        backdropFilter: "blur(14px)",
        boxShadow: isDark
          ? "0 18px 40px rgba(0, 0, 0, 0.28)"
          : "0 18px 36px rgba(40, 34, 28, 0.08)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          borderColor: isDark ? "transparent" : "rgba(17,17,17,0.14)",
          background: isDark ? "#2C2C2E" : undefined,
          boxShadow: isDark
            ? "0 24px 52px rgba(0, 0, 0, 0.36)"
            : "0 22px 44px rgba(40, 34, 28, 0.12)",
          transform: "translateY(-1px)",
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
