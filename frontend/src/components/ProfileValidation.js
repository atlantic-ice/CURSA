import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
    Box,
    Paper,
    Typography,
    Button,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider,
    Chip,
    CircularProgress,
    Collapse,
    useTheme,
    alpha
} from '@mui/material';
import axios from 'axios';

// Icons
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import RefreshIcon from '@mui/icons-material/Refresh';

const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE = isLocal ? '' : (process.env.REACT_APP_API_BASE || 'https://cursa.onrender.com');

export default function ProfileValidation({ profileId, profileName }) {
    const theme = useTheme();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [showDetails, setShowDetails] = useState(true);

    const validate = async () => {
        if (!profileId) return;
        
        setLoading(true);
        try {
            const res = await axios.post(`${API_BASE}/api/profiles/${profileId}/validate`);
            setResult(res.data);
        } catch (err) {
            console.error('Error validating profile:', err);
            setResult({
                valid: false,
                issues: [err.response?.data?.error || 'Ошибка валидации'],
                warnings: []
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (profileId) {
            validate();
        }
    }, [profileId]);

    if (!profileId) return null;

    return (
        <Paper
            elevation={0}
            sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: result?.valid 
                    ? alpha(theme.palette.success.main, 0.05)
                    : result 
                        ? alpha(theme.palette.error.main, 0.05)
                        : alpha(theme.palette.background.paper, 0.4),
                border: `1px solid ${alpha(
                    result?.valid 
                        ? theme.palette.success.main 
                        : result 
                            ? theme.palette.error.main 
                            : theme.palette.divider, 
                    0.2
                )}`
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={600}>
                    Валидация профиля
                </Typography>
                <Button
                    size="small"
                    startIcon={loading ? <CircularProgress size={14} /> : <RefreshIcon />}
                    onClick={validate}
                    disabled={loading}
                >
                    Проверить
                </Button>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
                    <CircularProgress size={20} />
                    <Typography variant="body2" color="text.secondary">Проверка...</Typography>
                </Box>
            ) : result && (
                <>
                    {/* Status */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        {result.valid ? (
                            <>
                                <CheckCircleIcon color="success" fontSize="small" />
                                <Typography variant="body2" color="success.main" fontWeight={600}>
                                    Профиль валиден
                                </Typography>
                            </>
                        ) : (
                            <>
                                <ErrorIcon color="error" fontSize="small" />
                                <Typography variant="body2" color="error.main" fontWeight={600}>
                                    Обнаружены проблемы
                                </Typography>
                            </>
                        )}
                        
                        {(result.issues?.length > 0 || result.warnings?.length > 0) && (
                            <Button
                                size="small"
                                onClick={() => setShowDetails(!showDetails)}
                                endIcon={showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                sx={{ ml: 'auto' }}
                            >
                                {showDetails ? 'Скрыть' : 'Подробнее'}
                            </Button>
                        )}
                    </Box>

                    {/* Counts */}
                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        {result.issues?.length > 0 && (
                            <Chip
                                icon={<ErrorIcon />}
                                label={`${result.issues.length} ошибок`}
                                size="small"
                                color="error"
                                variant="outlined"
                            />
                        )}
                        {result.warnings?.length > 0 && (
                            <Chip
                                icon={<WarningIcon />}
                                label={`${result.warnings.length} предупреждений`}
                                size="small"
                                color="warning"
                                variant="outlined"
                            />
                        )}
                    </Box>

                    {/* Details */}
                    <Collapse in={showDetails}>
                        {result.issues?.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                                <Typography variant="caption" color="error.main" fontWeight={600}>
                                    Ошибки:
                                </Typography>
                                <List dense disablePadding>
                                    {result.issues.map((issue, idx) => (
                                        <ListItem key={idx} sx={{ py: 0.25, px: 0 }}>
                                            <ListItemIcon sx={{ minWidth: 24 }}>
                                                <ErrorIcon fontSize="small" color="error" />
                                            </ListItemIcon>
                                            <ListItemText 
                                                primary={issue}
                                                primaryTypographyProps={{ variant: 'body2' }}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </Box>
                        )}

                        {result.warnings?.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                                <Typography variant="caption" color="warning.main" fontWeight={600}>
                                    Предупреждения:
                                </Typography>
                                <List dense disablePadding>
                                    {result.warnings.map((warning, idx) => (
                                        <ListItem key={idx} sx={{ py: 0.25, px: 0 }}>
                                            <ListItemIcon sx={{ minWidth: 24 }}>
                                                <WarningIcon fontSize="small" color="warning" />
                                            </ListItemIcon>
                                            <ListItemText 
                                                primary={warning}
                                                primaryTypographyProps={{ variant: 'body2' }}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </Box>
                        )}

                        {/* Inheritance Chain */}
                        {result.inheritance_chain && result.inheritance_chain.length > 1 && (
                            <Box sx={{ mt: 2, pt: 1, borderTop: `1px dashed ${alpha(theme.palette.divider, 0.3)}` }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                    <AccountTreeIcon fontSize="small" color="action" />
                                    <Typography variant="caption" color="text.secondary">
                                        Цепочка наследования:
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {result.inheritance_chain.map((id, idx) => (
                                        <React.Fragment key={id}>
                                            <Chip 
                                                label={id} 
                                                size="small" 
                                                variant={idx === result.inheritance_chain.length - 1 ? 'filled' : 'outlined'}
                                                color={idx === result.inheritance_chain.length - 1 ? 'primary' : 'default'}
                                            />
                                            {idx < result.inheritance_chain.length - 1 && (
                                                <Typography variant="body2" color="text.secondary">→</Typography>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </Box>
                            </Box>
                        )}
                    </Collapse>
                </>
            )}
        </Paper>
    );
}

ProfileValidation.propTypes = {
    /** ID профиля для валидации */
    profileId: PropTypes.string.isRequired,
    /** Название профиля */
    profileName: PropTypes.string,
};

ProfileValidation.defaultProps = {
    profileName: '',
};
