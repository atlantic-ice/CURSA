import React from 'react';
import { Box } from '@mui/material';
import { motion } from 'framer-motion';

/**
 * 4-конечная звезда - логотип CURSA
 * Минималистичный дизайн, вдохновленный гемами из Genshin Impact
 */
const StarLogo = ({ 
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
};

/**
 * Версия с градиентом
 */
export const StarLogoGradient = ({ 
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
};

/**
 * Версия с пульсирующим свечением
 */
export const StarLogoPulsing = ({ 
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
};

export default StarLogo;
