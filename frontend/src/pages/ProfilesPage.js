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
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  IconButton,
  useTheme,
  alpha,
  CircularProgress,
  Button
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

// Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DescriptionIcon from '@mui/icons-material/Description';
import RuleIcon from '@mui/icons-material/Rule';
import FormatSizeIcon from '@mui/icons-material/FormatSize';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import CropFreeIcon from '@mui/icons-material/CropFree';
import TitleIcon from '@mui/icons-material/Title';
import TableChartIcon from '@mui/icons-material/TableChart';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';

const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE = isLocal ? '' : (process.env.REACT_APP_API_BASE || 'https://cursa.onrender.com');

const RuleCard = ({ title, icon, children, delay }) => {
  const theme = useTheme();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
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
          '&:hover': {
            bgcolor: alpha(theme.palette.background.paper, 0.6),
            borderColor: alpha(theme.palette.primary.main, 0.3),
            transform: 'translateY(-2px)'
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
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

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    if (selectedId) {
      fetchProfileDetails(selectedId);
    }
  }, [selectedId]);

  const fetchProfiles = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/profiles/`);
      setProfiles(res.data);
      if (res.data.length > 0) {
        setSelectedId(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfileDetails = async (id) => {
    setLoadingDetails(true);
    try {
      const res = await axios.get(`${API_BASE}/api/profiles/${id}`);
      setProfileData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
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
          </Paper>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ flexGrow: 1, py: 3, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Grid container spacing={3} sx={{ flexGrow: 1, height: '100%', overflow: 'hidden' }}>
          {/* Sidebar List */}
          <Grid item xs={12} md={3} lg={2} sx={{ height: '100%' }}>
            <Paper
              elevation={0}
              sx={{
                height: '100%',
                bgcolor: alpha(theme.palette.background.paper, 0.4),
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                borderRadius: 3,
                overflow: 'hidden'
              }}
            >
              <List sx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ px: 2, mb: 1.5, display: 'block', letterSpacing: 1 }}>
                  ДОСТУПНЫЕ ПРОФИЛИ
                </Typography>
                {profiles.map((profile, idx) => (
                  <motion.div
                    key={profile.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <ListItemButton
                      selected={selectedId === profile.id}
                      onClick={() => setSelectedId(profile.id)}
                      sx={{
                        borderRadius: 2,
                        mb: 1,
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
                      <ListItemIcon sx={{ minWidth: 36, color: selectedId === profile.id ? 'primary.main' : 'text.secondary' }}>
                        <DescriptionIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={profile.name} 
                        primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                      />
                      {selectedId === profile.id && (
                        <motion.div layoutId="active-indicator" style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: theme.palette.primary.main }} />
                      )}
                    </ListItemButton>
                  </motion.div>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Main Content */}
          <Grid item xs={12} md={9} lg={10} sx={{ height: '100%' }}>
            <AnimatePresence mode="wait">
              {loadingDetails || !profileData ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <CircularProgress size={32} />
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
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" fontWeight={800} gutterBottom>
                      {profileData.name}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {profileData.description}
                    </Typography>
                  </Box>

                  <Grid container spacing={3}>
                    {/* Basic Formatting */}
                    <Grid item xs={12} md={6} lg={4}>
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
                    <Grid item xs={12} md={6} lg={4}>
                      <RuleCard title="Поля страницы" icon={<CropFreeIcon />} delay={0.2}>
                        <RuleItem label="Левое" value={`${profileData.rules.margins.left} см`} />
                        <RuleItem label="Правое" value={`${profileData.rules.margins.right} см`} />
                        <RuleItem label="Верхнее" value={`${profileData.rules.margins.top} см`} />
                        <RuleItem label="Нижнее" value={`${profileData.rules.margins.bottom} см`} />
                      </RuleCard>
                    </Grid>

                    {/* Headings */}
                    <Grid item xs={12} md={6} lg={4}>
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
                    <Grid item xs={12} md={6} lg={4}>
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
                    <Grid item xs={12} md={6} lg={4}>
                      <RuleCard title="Списки и сноски" icon={<FormatListBulletedIcon />} delay={0.5}>
                        <RuleItem label="Шрифт списков" value={`${profileData.rules.lists.font_size} пт`} />
                        <RuleItem label="Отступ слева" value={`${profileData.rules.lists.left_indent} см`} />
                        <Divider sx={{ my: 1 }} />
                        <RuleItem label="Шрифт сносок" value={`${profileData.rules.footnotes.font_size} пт`} />
                        <RuleItem label="Интервал сносок" value={`${profileData.rules.footnotes.line_spacing}x`} />
                      </RuleCard>
                    </Grid>

                    {/* Required Sections */}
                    <Grid item xs={12} md={6} lg={4}>
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
              )}
            </AnimatePresence>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
