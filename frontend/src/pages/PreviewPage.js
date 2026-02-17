import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Box, Button, Typography, IconButton, Paper, alpha, useTheme } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DocumentViewer from '../components/DocumentViewer';

const PreviewPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const theme = useTheme();
    
    const originalPath = searchParams.get('original');
    const correctedPath = searchParams.get('corrected');
    const filename = searchParams.get('filename') || 'Document';

    const handleBack = () => {
        navigate(-1);
    };

    return (
        <Box sx={{ 
            height: '100vh', 
            display: 'flex', 
            flexDirection: 'column', 
            bgcolor: 'background.default',
            overflow: 'hidden'
        }}>
            <Box sx={{ p: 2, pb: 0, zIndex: 10 }}>
                <Paper 
                    elevation={0}
                    className="glass-card"
                    sx={{ 
                        p: 2, 
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2
                    }}
                >
                    <IconButton onClick={handleBack} size="small" sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.2)}`, borderRadius: 2 }}>
                        <ArrowBackIcon fontSize="small" />
                    </IconButton>
                    
                    <Box>
                        <Typography 
                            variant="body1" 
                            sx={{ 
                                fontWeight: 700, 
                                color: alpha(theme.palette.common.white, 0.8),
                                fontFamily: '"Inter", monospace',
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                userSelect: 'none'
                            }}
                        >
                            CURSA / PREVIEW
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <InsertDriveFileIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                            <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                {filename}
                            </Typography>
                        </Box>
                    </Box>
                </Paper>
            </Box>

            <Box sx={{ flexGrow: 1, overflow: 'hidden', p: 2 }}>
                <DocumentViewer 
                    originalPath={originalPath} 
                    correctedPath={correctedPath} 
                />
            </Box>
        </Box>
    );
};

export default PreviewPage;
