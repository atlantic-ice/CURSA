import React from 'react';
import { Box, Typography, Button as MuiButton, Chip, Avatar as MuiAvatar } from '@mui/material';
import { styled } from '@mui/material/styles';

// Linear-style Button
export const LinearButton = styled(MuiButton)(({ theme, variant = 'contained' }) => ({
  borderRadius: 6,
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '0.875rem',
  padding: '8px 16px',
  boxShadow: 'none',
  transition: 'all 0.15s ease',
  letterSpacing: '0.01em',
  
  '&:hover': {
    boxShadow: 'none',
    transform: variant === 'contained' ? 'translateY(-1px)' : 'none',
  },
  
  '&:active': {
    transform: 'translateY(0)',
  },
  
  '&.MuiButton-sizeLarge': {
    padding: '10px 20px',
    fontSize: '1rem',
  },
  
  '&.MuiButton-sizeSmall': {
    padding: '6px 12px',
    fontSize: '0.8125rem',
  },
}));

// Linear-style Card
export const LinearCard = ({ children, hover = false, onClick, sx, ...props }) => {
  const theme = props.theme || {};
  
  return (
    <Box
      onClick={onClick}
      sx={{
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '6px',
        padding: 3,
        transition: 'all 0.2s ease',
        cursor: onClick ? 'pointer' : 'default',
        ...(hover && {
          '&:hover': {
            borderColor: 'action.selected',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          },
        }),
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

// Linear-style Badge
export const LinearBadge = styled(Chip)(({ theme, status = 'neutral' }) => {
  const statusColors = {
    primary: {
      bg: 'rgba(0, 122, 255, 0.1)',
      color: '#007AFF',
    },
    success: {
      bg: 'rgba(0, 168, 107, 0.1)',
      color: '#00A86B',
    },
    warning: {
      bg: 'rgba(255, 149, 0, 0.1)',
      color: '#FF9500',
    },
    error: {
      bg: 'rgba(220, 53, 69, 0.1)',
      color: '#DC3545',
    },
    neutral: {
      bg: theme.palette.action.hover,
      color: theme.palette.text.secondary,
    },
  };

  const colors = statusColors[status] || statusColors.neutral;

  return {
    borderRadius: 4,
    fontSize: '0.75rem',
    fontWeight: 500,
    height: 22,
    backgroundColor: colors.bg,
    color: colors.color,
    border: 'none',
    
    '& .MuiChip-label': {
      padding: '0 8px',
    },
  };
});

// Linear-style Input
export const LinearInput = styled('input')(({ theme }) => ({
  width: '100%',
  padding: '8px 12px',
  fontFamily: theme.typography.fontFamily,
  fontSize: '0.875rem',
  color: theme.palette.text.primary,
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 6,
  outline: 'none',
  transition: 'all 0.15s ease',
  
  '&:hover': {
    borderColor: theme.palette.action.selected,
  },
  
  '&:focus': {
    borderColor: theme.palette.primary.main,
    boxShadow: `0 0 0 3px ${theme.palette.mode === 'dark' ? 'rgba(0, 122, 255, 0.2)' : 'rgba(0, 122, 255, 0.1)'}`,
  },
  
  '&::placeholder': {
    color: theme.palette.text.disabled,
  },
}));

// Linear-style Divider
export const LinearDivider = ({ vertical = false, sx }) => (
  <Box
    sx={{
      width: vertical ? '1px' : '100%',
      height: vertical ? '100%' : '1px',
      backgroundColor: 'divider',
      margin: vertical ? '0 16px' : '16px 0',
      ...sx,
    }}
  />
);

// Linear-style Section Header
export const LinearSectionHeader = ({ title, subtitle, action, children }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      mb: 3,
    }}
  >
    <Box>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 600,
          fontSize: '1.5rem',
          lineHeight: 1.3,
          letterSpacing: '-0.01em',
          mb: subtitle ? 0.5 : 0,
        }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            fontSize: '0.875rem',
          }}
        >
          {subtitle}
        </Typography>
      )}
      {children}
    </Box>
    {action && <Box>{action}</Box>}
  </Box>
);

// Linear-style Empty State
export const LinearEmptyState = ({ icon, title, description, action }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      py: 8,
      px: 3,
      textAlign: 'center',
    }}
  >
    {icon && (
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          backgroundColor: 'action.hover',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 3,
          '& svg': {
            fontSize: 32,
            color: 'text.secondary',
          },
        }}
      >
        {icon}
      </Box>
    )}
    <Typography
      variant="h6"
      sx={{
        fontWeight: 600,
        mb: 1,
      }}
    >
      {title}
    </Typography>
    {description && (
      <Typography
        variant="body2"
        sx={{
          color: 'text.secondary',
          maxWidth: 400,
          mb: action ? 3 : 0,
        }}
      >
        {description}
      </Typography>
    )}
    {action && <Box sx={{ mt: 2 }}>{action}</Box>}
  </Box>
);

// Linear-style Avatar
export const LinearAvatar = styled(MuiAvatar)(({ theme }) => ({
  backgroundColor: theme.palette.action.selected,
  color: theme.palette.text.primary,
  fontWeight: 600,
  fontSize: '0.875rem',
}));

// Linear-style Status Indicator
export const LinearStatusIndicator = ({ status, label }) => {
  const statusColors = {
    success: '#00A86B',
    warning: '#FF9500',
    error: '#DC3545',
    info: '#007AFF',
    neutral: '#6B6F73',
  };

  const color = statusColors[status] || statusColors.neutral;

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: color,
        }}
      />
      {label && (
        <Typography
          variant="body2"
          sx={{
            fontSize: '0.875rem',
            fontWeight: 500,
            color: 'text.secondary',
          }}
        >
          {label}
        </Typography>
      )}
    </Box>
  );
};

// Linear-style Grid
export const LinearGrid = ({ children, columns = 3, gap = 2, sx }) => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: {
        xs: '1fr',
        sm: columns >= 2 ? 'repeat(2, 1fr)' : '1fr',
        md: `repeat(${columns}, 1fr)`,
      },
      gap,
      ...sx,
    }}
  >
    {children}
  </Box>
);

export default {
  LinearButton,
  LinearCard,
  LinearBadge,
  LinearInput,
  LinearDivider,
  LinearSectionHeader,
  LinearEmptyState,
  LinearAvatar,
  LinearStatusIndicator,
  LinearGrid,
};
