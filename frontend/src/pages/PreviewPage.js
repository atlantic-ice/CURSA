import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Box, Button, Typography, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DocumentViewer from '../components/DocumentViewer';

const PreviewPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
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
            p: 2,
            bgcolor: 'background.default' 
        }}>
            <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 2,
                gap: 2
            }}>
                <IconButton onClick={handleBack} color="primary">
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h5" component="h1" sx={{ flexGrow: 1 }}>
                    Preview: {filename}
                </Typography>
            </Box>

            <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                <DocumentViewer 
                    originalPath={originalPath} 
                    correctedPath={correctedPath} 
                />
            </Box>
        </Box>
    );
};

export default PreviewPage;
