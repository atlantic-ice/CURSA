import React, { useState, useEffect } from 'react';
import { Box, MenuItem, Select, FormControl, Typography, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'https://cursa.onrender.com';

const StyledSelect = styled(Select)(({ theme }) => ({
  borderRadius: 6,
  backgroundColor: theme.palette.background.paper,
  fontSize: '0.875rem',
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.divider,
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.action.hover,
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.primary.main,
  },
}));

const ProfileSelector = ({ selectedProfile, onSelect }) => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/profiles/`);
        setProfiles(response.data);
        // Select default if available and nothing selected
        if (response.data.length > 0 && !selectedProfile) {
            // Try to find 'default_gost' or pick the first one
            const defaultProfile = response.data.find(p => p.id === 'default_gost') || response.data[0];
            onSelect(defaultProfile.id);
        }
      } catch (err) {
        console.error('Failed to load profiles:', err);
        setError('Не удалось загрузить профили');
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [onSelect, selectedProfile]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={16} />
        <Typography variant="body2" color="text.secondary">Загрузка профилей...</Typography>
      </Box>
    );
  }

  if (error) {
    return <Typography variant="body2" color="error">{error}</Typography>;
  }

  return (
    <Box sx={{ minWidth: 200 }}>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
        Профиль проверки
      </Typography>
      <FormControl fullWidth size="small">
        <StyledSelect
          value={selectedProfile || ''}
          onChange={(e) => onSelect(e.target.value)}
          displayEmpty
        >
          {profiles.map((profile) => (
            <MenuItem key={profile.id} value={profile.id}>
              {profile.name}
            </MenuItem>
          ))}
        </StyledSelect>
      </FormControl>
    </Box>
  );
};

export default ProfileSelector;
