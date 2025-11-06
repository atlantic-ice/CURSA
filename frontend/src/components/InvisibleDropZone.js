import React from 'react';
import { Box } from '@mui/material';
import DropZone from './DropZone';

// InvisibleDropZone: composes the existing DropZone but renders an invisible
// full-card overlay that accepts drops and clicks. It purposefully keeps
// visuals transparent and only forwards interactions to the underlying
// DropZone upload logic.
const InvisibleDropZone = ({ onDrop }) => {
  return (
    <DropZone
      sx={{
        // Make the internal Paper fill its parent and be positioned absolutely
        position: 'absolute',
        inset: 0,
        p: 0,
        minHeight: '100%',
        borderRadius: 3,
        backgroundColor: 'transparent',
        boxShadow: 'none',
      }}
    >
      {({ isDragActive, isDragReject, openFile }) => (
        // This inner Box is the actual clickable/drop area. It's invisible
        // but occupies the full bounds of the parent so drops/clicks work.
        <Box
          onClick={(e) => {
            e.stopPropagation();
            openFile && openFile();
          }}
          sx={{
            position: 'absolute',
            inset: 0,
            bgcolor: 'transparent',
            pointerEvents: 'auto',
            // keep it above other card content so clicks target it
            zIndex: 10,
          }}
        />
      )}
    </DropZone>
  );
};

export default InvisibleDropZone;
