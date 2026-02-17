import React, { useState } from 'react';
import { Box, IconButton, Fade, Backdrop } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

const IDLE_IMAGE_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/1280px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg";

const IdleOverlay = ({ open, onClose }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
        opacity: 1,
        transition: { duration: shouldReduceMotion ? 0 : 2, ease: "easeInOut" }
    },
    exit: { 
        opacity: 0,
        transition: { duration: shouldReduceMotion ? 0 : 0.5 }
    }
  };

  const imageVariants = {
    hidden: { 
        scale: shouldReduceMotion ? 1 : 0.95, 
        opacity: 0 
    },
    visible: { 
        scale: 1, 
        opacity: 1,
        transition: { 
            duration: shouldReduceMotion ? 0 : 2.5, 
            ease: "easeOut",
            delay: shouldReduceMotion ? 0 : 0.2
        }
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.85)', // Dark overlay
            backdropFilter: 'blur(5px)'
          }}
          onClick={onClose}
        >
          {/* Close Button */}
          <IconButton
            onClick={onClose}
            sx={{
              position: 'absolute',
              top: 24,
              right: 24,
              color: 'white',
              bgcolor: 'rgba(255,255,255,0.1)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
              zIndex: 2
            }}
          >
            <CloseIcon />
          </IconButton>

          {/* Image Container */}
          <motion.div
            variants={imageVariants}
            initial="hidden"
            animate={imgLoaded ? "visible" : "hidden"}
            style={{
              maxWidth: '90%',
              maxHeight: '90vh',
              position: 'relative',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              overflow: 'hidden',
              borderRadius: '8px'
            }}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
          >
            {!imgError ? (
              <img
                src={IDLE_IMAGE_URL}
                alt="Van Gogh - Starry Night"
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgError(true)}
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: '90vh',
                  display: 'block',
                  objectFit: 'contain'
                }}
              />
            ) : (
               // Fallback if image fails
              <Box sx={{ p: 4, color: 'white', textAlign: 'center' }}>
                <p>Starry Night</p>
              </Box>
            )}
            
            {/* Caption/Credit Overlay */}
            <Box
                sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    p: 2,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                    color: 'rgba(255,255,255,0.8)',
                    textAlign: 'center',
                    opacity: 0,
                    transition: 'opacity 1s ease',
                    '&:hover': { opacity: 1 }
                }}
            >
                Vincent van Gogh - The Starry Night (1889)
            </Box>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IdleOverlay;
