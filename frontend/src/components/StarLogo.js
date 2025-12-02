import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import { motion } from 'framer-motion';

/**
 * 4-конечная звезда - логотип CURSA
 */
const StarLogo = memo(({ 
  size = 32, 
  color = '#fff', 
  glowColor,
  animate = false,
  pulseSpeed = 2,
  sx = {} 
}) => {
  const effectiveGlowColor = glowColor || color;
  
  const logoContent = (
    <Box
      component="svg"
      viewBox="0 0 462.5 462.5"
      sx={{
        width: size,
        height: size,
        filter: glowColor ? `drop-shadow(0 0 ${size/4}px ${effectiveGlowColor})` : 'none',
        ...sx
      }}
    >
      <path
        d="m462.5,231.25c-212.5,10.36-220.89,18.75-231.25,231.25C220.89,250,212.5,241.61,0,231.25,212.5,220.89,220.89,212.5,231.25,0c10.36,212.5,18.75,220.89,231.25,231.25Z"
        fill={color}
      />
    </Box>
  );

  if (animate) {
    return (
      <motion.div
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [1, 0.8, 1],
        }}
        transition={{
          duration: pulseSpeed,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {logoContent}
      </motion.div>
    );
  }

  return logoContent;
});

StarLogo.displayName = 'StarLogo';

/**
 * Версия с градиентом
 */
export const StarLogoGradient = memo(({ 
  size = 32, 
  gradientColors = ['#8B5CF6', '#06B6D4'],
  animate = false,
  sx = {} 
}) => {
  const gradientId = `star-gradient-${Math.random().toString(36).substr(2, 9)}`;
  
  const logoContent = (
    <Box
      component="svg"
      viewBox="0 0 462.5 462.5"
      sx={{
        width: size,
        height: size,
        filter: `drop-shadow(0 0 ${size/3}px ${gradientColors[0]}40)`,
        ...sx
      }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={gradientColors[0]} />
          <stop offset="100%" stopColor={gradientColors[1]} />
        </linearGradient>
      </defs>
      <path
        d="m462.5,231.25c-212.5,10.36-220.89,18.75-231.25,231.25C220.89,250,212.5,241.61,0,231.25,212.5,220.89,220.89,212.5,231.25,0c10.36,212.5,18.75,220.89,231.25,231.25Z"
        fill={`url(#${gradientId})`}
      />
    </Box>
  );

  if (animate) {
    return (
      <motion.div
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        {logoContent}
      </motion.div>
    );
  }

  return logoContent;
});

StarLogoGradient.displayName = 'StarLogoGradient';

/**
 * Версия с пульсирующим свечением
 */
export const StarLogoPulsing = memo(({ 
  size = 32, 
  color = '#fff',
  glowColor = '#8B5CF6',
  sx = {} 
}) => {
  return (
    <motion.div
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
      animate={{
        filter: [
          `drop-shadow(0 0 ${size/4}px ${glowColor}80)`,
          `drop-shadow(0 0 ${size/2}px ${glowColor}FF)`,
          `drop-shadow(0 0 ${size/4}px ${glowColor}80)`,
        ],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <Box
        component="svg"
        viewBox="0 0 462.5 462.5"
        sx={{
          width: size,
          height: size,
          ...sx
        }}
      >
        <path
          d="m462.5,231.25c-212.5,10.36-220.89,18.75-231.25,231.25C220.89,250,212.5,241.61,0,231.25,212.5,220.89,220.89,212.5,231.25,0c10.36,212.5,18.75,220.89,231.25,231.25Z"
          fill={color}
        />
      </Box>
    </motion.div>
  );
});

StarLogoPulsing.displayName = 'StarLogoPulsing';

// PropTypes definitions
StarLogo.propTypes = {
  /** Размер логотипа в пикселях */
  size: PropTypes.number,
  /** Цвет звезды */
  color: PropTypes.string,
  /** Цвет свечения */
  glowColor: PropTypes.string,
  /** Включить анимацию */
  animate: PropTypes.bool,
  /** Скорость пульсации в секундах */
  pulseSpeed: PropTypes.number,
  /** Дополнительные стили */
  sx: PropTypes.object,
};

StarLogo.defaultProps = {
  size: 32,
  color: '#fff',
  glowColor: undefined,
  animate: false,
  pulseSpeed: 2,
  sx: {},
};

StarLogoGradient.propTypes = {
  /** Размер логотипа в пикселях */
  size: PropTypes.number,
  /** Цвета градиента [start, end] */
  gradientColors: PropTypes.arrayOf(PropTypes.string),
  /** Включить анимацию */
  animate: PropTypes.bool,
  /** Дополнительные стили */
  sx: PropTypes.object,
};

StarLogoGradient.defaultProps = {
  size: 32,
  gradientColors: ['#8B5CF6', '#06B6D4'],
  animate: false,
  sx: {},
};

StarLogoPulsing.propTypes = {
  /** Размер логотипа в пикселях */
  size: PropTypes.number,
  /** Цвет звезды */
  color: PropTypes.string,
  /** Цвет свечения */
  glowColor: PropTypes.string,
  /** Дополнительные стили */
  sx: PropTypes.object,
};

StarLogoPulsing.defaultProps = {
  size: 32,
  color: '#fff',
  glowColor: '#8B5CF6',
  sx: {},
};

export default StarLogo;
