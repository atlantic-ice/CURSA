import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  IconButton,
  useTheme,
  alpha,
  CircularProgress,
  Button,
  Tabs,
  Tab,
  Tooltip,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

// Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DescriptionIcon from '@mui/icons-material/Description';
import FormatSizeIcon from '@mui/icons-material/FormatSize';
import CropFreeIcon from '@mui/icons-material/CropFree';
import TitleIcon from '@mui/icons-material/Title';
import TableChartIcon from '@mui/icons-material/TableChart';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import SchoolIcon from '@mui/icons-material/School';
import VerifiedIcon from '@mui/icons-material/Verified';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import BarChartIcon from '@mui/icons-material/BarChart';
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay';

import ProfileEditor from '../components/ProfileEditor';
import ProfileComparison from '../components/ProfileComparison';
import ProfileImportExport from '../components/ProfileImportExport';
import ProfileValidation from '../components/ProfileValidation';
import ProfileHistory from '../components/ProfileHistory';
import ProfileStatistics from '../components/ProfileStatistics';
import ProfileBulkOperations from '../components/ProfileBulkOperations';

const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE = isLocal ? '' : (process.env.REACT_APP_API_BASE || 'https://cursa.onrender.com');

const RuleCard = ({ title, icon, children, delay }) => {
  const theme = useTheme();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      style={{ height: '100%' }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 3,
          height: '100%',
          borderRadius: 3,
          bgcolor: alpha(theme.palette.background.paper, 0.4),
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          transition: 'all 0.2s',
          display: 'flex',
          flexDirection: 'column',
          '&:hover': {
            bgcolor: alpha(theme.palette.background.paper, 0.6),
            borderColor: alpha(theme.palette.primary.main, 0.3),
            transform: 'translateY(-2px)'
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, flexShrink: 0 }}>
          <Box sx={{
            p: 1,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            color: theme.palette.primary.main,
            display: 'flex'
          }}>
            {icon}
          </Box>
          <Typography variant="subtitle1" fontWeight={700}>
            {title}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flexGrow: 1 }}>
          {children}
        </Box>
      </Paper>
    </motion.div>
  );
};

const RuleItem = ({ label, value }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <Typography variant="body2" color="text.secondary">{label}</Typography>
    <Typography variant="body2" fontWeight={600}>{value}</Typography>
  </Box>
);

export default function ProfilesPage() {
  const navigate = useNavigate();
  const theme = useTheme();

  const [profiles, setProfiles] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState(null);
  const [categoryTab, setCategoryTab] = useState('all');

  // Edit/Create State
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [showBulkOperations, setShowBulkOperations] = useState(false);

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    if (selectedId && !isCreating) {
      fetchProfileDetails(selectedId);
      setIsEditing(false);
    }
  }, [selectedId]);

  const fetchProfiles = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/profiles/`);
      setProfiles(res.data);
      if (res.data.length > 0 && !selectedId) {
        setSelectedId(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
      setError('Не удалось загрузить список профилей');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfileDetails = async (id) => {
    setLoadingDetails(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE}/api/profiles/${id}`);
      setProfileData(res.data);
    } catch (err) {
      console.error(err);
      setError('Не удалось загрузить данные профиля');
      setProfileData(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCreateStart = () => {
    setIsCreating(true);
    setIsEditing(false);
    setShowComparison(false);
    setShowImportExport(false);
    setShowStatistics(false);
    setShowBulkOperations(false);
    setSelectedId(null);
    setProfileData(null);
  };

  const handleEditStart = () => {
    setIsEditing(true);
    setIsCreating(false);
    setShowComparison(false);
    setShowImportExport(false);
    setShowStatistics(false);
    setShowBulkOperations(false);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setIsEditing(false);
    setShowComparison(false);
    setShowImportExport(false);
    setShowStatistics(false);
    setShowBulkOperations(false);
    if (!selectedId && profiles.length > 0) {
      setSelectedId(profiles[0].id);
    }
  };

  const handleShowComparison = () => {
    setShowComparison(true);
    setShowImportExport(false);
    setShowStatistics(false);
    setShowBulkOperations(false);
    setIsEditing(false);
    setIsCreating(false);
  };

  const handleShowImportExport = () => {
    setShowImportExport(true);
    setShowComparison(false);
    setShowStatistics(false);
    setShowBulkOperations(false);
    setIsEditing(false);
    setIsCreating(false);
  };

  const handleShowStatistics = () => {
    setShowStatistics(true);
    setShowImportExport(false);
    setShowComparison(false);
    setShowBulkOperations(false);
    setIsEditing(false);
    setIsCreating(false);
  };

  const handleShowBulkOperations = () => {
    setShowBulkOperations(true);
    setShowStatistics(false);
    setShowImportExport(false);
    setShowComparison(false);
    setIsEditing(false);
    setIsCreating(false);
  };

  const handleImportSuccess = async (result) => {
    await fetchProfiles();
    if (result.id) {
      setSelectedId(result.id);
      setShowImportExport(false);
    }
  };

  const handleSave = async (data) => {
    try {
      if (isCreating) {
        const res = await axios.post(`${API_BASE}/api/profiles/`, data);
        await fetchProfiles();
        setSelectedId(res.data.id);
        setIsCreating(false);
      } else {
        await axios.put(`${API_BASE}/api/profiles/${selectedId}`, data);
        await fetchProfileDetails(selectedId);
        setIsEditing(false);
        // Refresh list to update name/desc if changed
        const res = await axios.get(`${API_BASE}/api/profiles/`);
        setProfiles(res.data);
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Ошибка при сохранении профиля: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDuplicate = async () => {
    if (!selectedId) return;
    try {
      const res = await axios.post(`${API_BASE}/api/profiles/${selectedId}/duplicate`);
      await fetchProfiles();
      setSelectedId(res.data.id);
    } catch (err) {
      console.error('Error duplicating profile:', err);
      alert('Ошибка при дублировании: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`${API_BASE}/api/profiles/${selectedId}`);
      setDeleteDialogOpen(false);
      const res = await axios.get(`${API_BASE}/api/profiles/`);
      setProfiles(res.data);
      if (res.data.length > 0) {
        setSelectedId(res.data[0].id);
      } else {
        setSelectedId(null);
        setProfileData(null);
      }
    } catch (err) {
      console.error('Error deleting profile:', err);
      alert('Ошибка при удалении: ' + (err.response?.data?.error || err.message));
      setDeleteDialogOpen(false);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'gost': return <VerifiedIcon fontSize="small" />;
      case 'university': return <SchoolIcon fontSize="small" />;
      default: return <DescriptionIcon fontSize="small" />;
    }
  };

  const filteredProfiles = categoryTab === 'all'
    ? profiles
    : profiles.filter(p => p.category === categoryTab);

  const categoryCounts = {
    all: profiles.length,
    gost: profiles.filter(p => p.category === 'gost').length,
    university: profiles.filter(p => p.category === 'university').length,
    custom: profiles.filter(p => p.category === 'custom').length
  };

  if (loading) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', bgcolor: 'background.default', color: 'text.primary', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ pt: 3, px: 0, zIndex: 10, flexShrink: 0 }}>
        <Container maxWidth="xl">
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.background.paper, 0.6),
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton onClick={() => navigate('/')} size="small" sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.2)}`, borderRadius: 2 }}>
                <ArrowBackIcon fontSize="small" />
              </IconButton>
              <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: '-0.02em' }}>
                Стандарты оформления
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip
                  icon={<VerifiedIcon />}
                  label={`${categoryCounts.gost} ГОСТ`}
                  size="small"
                  sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main' }}
                />
                <Chip
                  icon={<SchoolIcon />}
                  label={`${categoryCounts.university} вузов`}
                  size="small"
                  sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main' }}
                />
              </Box>
              <Tooltip title="Сравнить профили">
                <IconButton 
                  onClick={(e) => { e.stopPropagation(); handleShowComparison(); }}
                  sx={{ 
                    bgcolor: showComparison ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`
                  }}
                >
                  <CompareArrowsIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Импорт / Экспорт">
                <IconButton 
                  onClick={(e) => { e.stopPropagation(); handleShowImportExport(); }}
                  sx={{ 
                    bgcolor: showImportExport ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`
                  }}
                >
                  <FileDownloadIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Статистика">
                <IconButton 
                  onClick={(e) => { e.stopPropagation(); handleShowStatistics(); }}
                  sx={{ 
                    bgcolor: showStatistics ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`
                  }}
                >
                  <BarChartIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Массовые операции">
                <IconButton 
                  onClick={(e) => { e.stopPropagation(); handleShowBulkOperations(); }}
                  sx={{ 
                    bgcolor: showBulkOperations ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`
                  }}
                >
                  <PlaylistPlayIcon />
                </IconButton>
              </Tooltip>
              <Button
                id="create-profile-btn"
                data-testid="create-profile-btn"
                variant="contained"
                startIcon={<AddIcon />}
                onClick={(e) => { e.stopPropagation(); handleCreateStart(); }}
                disabled={isCreating}
              >
                Создать профиль
              </Button>
            </Box>
          </Paper>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ flexGrow: 1, py: 3, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Grid container spacing={3} sx={{ flexGrow: 1, height: '100%', overflow: 'hidden' }}>
          {/* Sidebar List */}
          <Grid size={{ xs: 12, md: 3, lg: 2.5 }} sx={{ height: '100%' }}>
            <Paper
              elevation={0}
              sx={{
                height: '100%',
                bgcolor: alpha(theme.palette.background.paper, 0.4),
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                borderRadius: 3,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Category Tabs */}
              <Tabs
                value={categoryTab}
                onChange={(e, v) => setCategoryTab(v)}
                variant="fullWidth"
                sx={{
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  minHeight: 48,
                  '& .MuiTab-root': { minHeight: 48, py: 1, fontSize: '0.875rem' }
                }}
              >
                <Tab value="all" label={<Badge badgeContent={categoryCounts.all} color="primary" max={99} sx={{ '& .MuiBadge-badge': { right: -8, top: 5 } }}><Box component="span" sx={{ px: 1.5 }}>Все</Box></Badge>} />
                <Tab value="gost" label="ГОСТ" />
                <Tab value="university" label="Вузы" />
              </Tabs>

              <List sx={{ p: 1.5, flexGrow: 1, overflow: 'auto' }}>
                {filteredProfiles.map((profile, idx) => (
                  <motion.div
                    key={profile.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    <ListItemButton
                      selected={selectedId === profile.id && !isCreating}
                      onClick={() => {
                        setSelectedId(profile.id);
                        setIsCreating(false);
                      }}
                      sx={{
                        borderRadius: 2,
                        mb: 0.5,
                        py: 1,
                        transition: 'all 0.2s',
                        '&.Mui-selected': {
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: 'primary.main',
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`,
                          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.15) }
                        },
                        '&:hover': {
                          bgcolor: alpha(theme.palette.background.paper, 0.8),
                          transform: 'translateX(4px)'
                        }
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 32, color: selectedId === profile.id && !isCreating ? 'primary.main' : 'text.secondary' }}>
                        {getCategoryIcon(profile.category)}
                      </ListItemIcon>
                      <ListItemText
                        primary={profile.name}
                        secondary={profile.university || profile.version}
                        primaryTypographyProps={{ variant: 'body2', fontWeight: 600, noWrap: true }}
                        secondaryTypographyProps={{ variant: 'caption', noWrap: true }}
                      />
                      {profile.is_system && (
                        <Tooltip title="Системный профиль">
                          <VerifiedIcon fontSize="small" sx={{ color: 'success.main', ml: 0.5 }} />
                        </Tooltip>
                      )}
                    </ListItemButton>
                  </motion.div>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Main Content */}
          <Grid size={{ xs: 12, md: 9, lg: 9.5 }} sx={{ height: '100%' }}>
            <AnimatePresence mode="wait">
              {showComparison ? (
                <motion.div
                  key="comparison"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  style={{ height: '100%' }}
                >
                  <ProfileComparison 
                    profiles={profiles}
                    onClose={() => setShowComparison(false)}
                  />
                </motion.div>
              ) : showImportExport ? (
                <motion.div
                  key="import-export"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  style={{ height: '100%' }}
                >
                  <ProfileImportExport 
                    profiles={profiles}
                    onImport={handleImportSuccess}
                    onRefresh={fetchProfiles}
                    onClose={() => setShowImportExport(false)}
                  />
                </motion.div>
              ) : showStatistics ? (
                <motion.div
                  key="statistics"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  style={{ height: '100%' }}
                >
                  <ProfileStatistics 
                    profiles={profiles}
                    onClose={() => setShowStatistics(false)}
                  />
                </motion.div>
              ) : showBulkOperations ? (
                <motion.div
                  key="bulk-operations"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  style={{ height: '100%' }}
                >
                  <ProfileBulkOperations 
                    profiles={profiles}
                    onClose={() => setShowBulkOperations(false)}
                    onRefresh={fetchProfiles}
                  />
                </motion.div>
              ) : isCreating || isEditing ? (
                <motion.div
                  key="editor"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  style={{ height: '100%' }}
                >
                  <ProfileEditor
                    initialData={isEditing ? profileData : null}
                    onSave={handleSave}
                    onCancel={handleCancel}
                  />
                </motion.div>
              ) : (loadingDetails || !profileData ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}
                >
                  {loadingDetails ? (
                    <CircularProgress size={32} />
                  ) : error ? (
                    <>
                      <Typography color="error" variant="h6">{error}</Typography>
                      <Button variant="outlined" onClick={() => fetchProfileDetails(selectedId)}>Повторить</Button>
                    </>
                  ) : (
                    <Typography color="text.secondary">Выберите профиль</Typography>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key={selectedId}
                  initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  style={{ height: '100%', overflowY: 'auto', paddingRight: 8 }}
                >
                  <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="h4" fontWeight={800} gutterBottom>
                        {profileData.name}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        {profileData.description}
                      </Typography>
                      {profileData.extends && (
                        <Chip 
                          size="small" 
                          label={`Наследует: ${profileData.extends}`}
                          sx={{ mt: 1 }}
                          variant="outlined"
                        />
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Дублировать">
                        <IconButton onClick={handleDuplicate}>
                          <ContentCopyIcon />
                        </IconButton>
                      </Tooltip>
                      {!profileData.is_system && (
                        <>
                          <Tooltip title="Редактировать">
                            <IconButton onClick={handleEditStart} color="primary">
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Удалить">
                            <IconButton onClick={handleDeleteClick} color="error">
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </Box>

                  {/* Profile Validation */}
                  <Box sx={{ mb: 3 }}>
                    <ProfileValidation profileId={selectedId} profileName={profileData.name} />
                  </Box>

                  {/* Profile History */}
                  <Box sx={{ mb: 3 }}>
                    <ProfileHistory 
                      profileId={selectedId} 
                      profileName={profileData.name}
                      isSystemProfile={profileData.is_system}
                      onRestore={() => fetchProfileDetails(selectedId)}
                    />
                  </Box>

                  <Grid container spacing={3}>
                    {/* Basic Formatting */}
                    <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                      <RuleCard title="Шрифт и текст" icon={<FormatSizeIcon />} delay={0.1}>
                        <RuleItem label="Гарнитура" value={profileData.rules.font.name} />
                        <RuleItem label="Размер" value={`${profileData.rules.font.size} пт`} />
                        <RuleItem label="Цвет" value={profileData.rules.font.color === '000000' ? 'Черный' : profileData.rules.font.color} />
                        <Divider sx={{ my: 1 }} />
                        <RuleItem label="Межстрочный" value={`${profileData.rules.line_spacing}x`} />
                        <RuleItem label="Отступ первой строки" value={`${profileData.rules.first_line_indent} см`} />
                        <RuleItem label="Выравнивание" value={profileData.rules.paragraph_alignment === 'JUSTIFY' ? 'По ширине' : profileData.rules.paragraph_alignment} />
                      </RuleCard>
                    </Grid>

                    {/* Margins */}
                    <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                      <RuleCard title="Поля страницы" icon={<CropFreeIcon />} delay={0.2}>
                        <RuleItem label="Левое" value={`${profileData.rules.margins.left} см`} />
                        <RuleItem label="Правое" value={`${profileData.rules.margins.right} см`} />
                        <RuleItem label="Верхнее" value={`${profileData.rules.margins.top} см`} />
                        <RuleItem label="Нижнее" value={`${profileData.rules.margins.bottom} см`} />
                      </RuleCard>
                    </Grid>

                    {/* Headings */}
                    <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                      <RuleCard title="Заголовки" icon={<TitleIcon />} delay={0.3}>
                        <Typography variant="caption" color="primary" fontWeight={600}>УРОВЕНЬ 1</Typography>
                        <RuleItem label="Размер" value={`${profileData.rules.headings.h1.font_size} пт`} />
                        <RuleItem label="Выравнивание" value={profileData.rules.headings.h1.alignment} />
                        <RuleItem label="Интервал после" value={`${profileData.rules.headings.h1.space_after} пт`} />

                        <Divider sx={{ my: 1 }} />

                        <Typography variant="caption" color="primary" fontWeight={600}>УРОВЕНЬ 2</Typography>
                        <RuleItem label="Размер" value={`${profileData.rules.headings.h2.font_size} пт`} />
                        <RuleItem label="Отступ" value={`${profileData.rules.headings.h2.first_line_indent} см`} />
                      </RuleCard>
                    </Grid>

                    {/* Tables & Captions */}
                    <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                      <RuleCard title="Таблицы и подписи" icon={<TableChartIcon />} delay={0.4}>
                        <RuleItem label="Шрифт таблиц" value={`${profileData.rules.tables.font_size} пт`} />
                        <RuleItem label="Интервал таблиц" value={`${profileData.rules.tables.line_spacing}x`} />
                        <Divider sx={{ my: 1 }} />
                        <RuleItem label="Шрифт подписей" value={`${profileData.rules.captions.font_size} пт`} />
                        <RuleItem label="Разделитель" value={`"${profileData.rules.captions.separator}"`} />
                        <RuleItem label="Выравнивание" value={profileData.rules.captions.alignment} />
                      </RuleCard>
                    </Grid>

                    {/* Lists & Footnotes */}
                    <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                      <RuleCard title="Списки и сноски" icon={<FormatListBulletedIcon />} delay={0.5}>
                        <RuleItem label="Шрифт списков" value={`${profileData.rules.lists.font_size} пт`} />
                        <RuleItem label="Отступ слева" value={`${profileData.rules.lists.left_indent} см`} />
                        <Divider sx={{ my: 1 }} />
                        <RuleItem label="Шрифт сносок" value={`${profileData.rules.footnotes.font_size} пт`} />
                        <RuleItem label="Интервал сносок" value={`${profileData.rules.footnotes.line_spacing}x`} />
                      </RuleCard>
                    </Grid>

                    {/* Bibliography */}
                    {profileData.rules.bibliography && (
                      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                        <RuleCard title="Библиография" icon={<MenuBookIcon />} delay={0.55}>
                          <RuleItem label="Стиль" value={profileData.rules.bibliography.style === 'gost' ? 'ГОСТ' : profileData.rules.bibliography.style} />
                          <RuleItem label="Размер шрифта" value={`${profileData.rules.bibliography.font_size || 14} пт`} />
                          <RuleItem label="Сортировка" value={profileData.rules.bibliography.sort_order === 'alphabetical' ? 'По алфавиту' : profileData.rules.bibliography.sort_order} />
                          <Divider sx={{ my: 1 }} />
                          <RuleItem label="Мин. источников" value={profileData.rules.bibliography.min_sources || 15} />
                          <RuleItem label="Макс. возраст" value={`${profileData.rules.bibliography.max_age_years || 5} лет`} />
                        </RuleCard>
                      </Grid>
                    )}

                    {/* Required Sections */}
                    <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                      <RuleCard title="Структура" icon={<MenuBookIcon />} delay={0.6}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Обязательные разделы:</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {profileData.rules.required_sections.map((sec, idx) => (
                            <Chip
                              key={idx}
                              label={sec}
                              size="small"
                              sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}
                            />
                          ))}
                        </Box>
                      </RuleCard>
                    </Grid>
                  </Grid>
                </motion.div>
              ))}
            </AnimatePresence>
          </Grid>
        </Grid>
      </Container>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Удалить профиль?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Вы действительно хотите удалить профиль "{profileData?.name}"? Это действие нельзя отменить.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
