import { Box, CircularProgress, FormControl, MenuItem, Select, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { getApiErrorMessage, profilesApi } from "../api/client";

const StyledSelect = styled(Select)(({ theme }) => ({
  borderRadius: 6,
  backgroundColor: theme.palette.background.paper,
  fontSize: "0.875rem",
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.palette.divider,
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.palette.action.hover,
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.palette.primary.main,
  },
}));

const ProfileSelector = ({ selectedProfile, onSelect }) => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const data = await profilesApi.list();
        setProfiles(data);
        // Select default if available and nothing selected
        if (data.length > 0 && !selectedProfile) {
          // Try to find 'default_gost' or pick the first one
          const defaultProfile = data.find((p) => p.id === "default_gost") || data[0];
          onSelect(defaultProfile.id);
        }
      } catch (err) {
        console.error("Failed to load profiles:", err);
        setError(getApiErrorMessage(err, "Не удалось загрузить профили"));
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [onSelect, selectedProfile]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <CircularProgress size={16} />
        <Typography variant="body2" color="text.secondary">
          Загрузка профилей...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Typography variant="body2" color="error">
        {error}
      </Typography>
    );
  }

  return (
    <Box sx={{ minWidth: 200 }}>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
        Профиль проверки
      </Typography>
      <FormControl fullWidth size="small">
        <StyledSelect
          value={selectedProfile || ""}
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

ProfileSelector.propTypes = {
  /** Currently selected profile ID */
  selectedProfile: PropTypes.string,
  /** Callback when profile is selected */
  onSelect: PropTypes.func.isRequired,
};

ProfileSelector.defaultProps = {
  selectedProfile: "",
};

export default ProfileSelector;
