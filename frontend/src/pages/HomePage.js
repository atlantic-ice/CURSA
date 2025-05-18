import React from 'react';
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  CardActionArea,
  Typography, 
  Button, 
  CardMedia,
  CardActions,
  Paper,
  Container,
  Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LockIcon from '@mui/icons-material/Lock';
import DescriptionIcon from '@mui/icons-material/Description';
import CreateIcon from '@mui/icons-material/Create';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import FindInPageIcon from '@mui/icons-material/FindInPage';
import BuildIcon from '@mui/icons-material/Build';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import HistoryIcon from '@mui/icons-material/History';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SchoolIcon from '@mui/icons-material/School';
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined';
import { Link as RouterLink } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import SpeedIcon from '@mui/icons-material/Speed';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import InfoIcon from '@mui/icons-material/Info';
import CollectionsBookmarkIcon from '@mui/icons-material/CollectionsBookmark';
import '@fontsource/montserrat/900.css';

const HomePage = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const handleCheckClick = () => {
    navigate('/check');
  };

  return (
    <Box>
      {/* Карточки сервисов */}
      <Container maxWidth="lg">
        <Typography 
          variant="h4" 
          component="h2" 
          align="center"
          sx={{ mb: 5, fontWeight: 700 }}
        >
          Будь в CURSE
        </Typography>
        
        <Grid container spacing={4} justifyContent="center">
          {/* Карточка "Проверить свой курсач" (активная) */}
          <Grid item xs={12} sm={6} md={5}>
            <Card 
              sx={{ 
                aspectRatio: '1',
                minHeight: { xs: 220, sm: 320 },
                minWidth: { xs: 220, sm: 320 },
                maxWidth: 420,
                width: '100%',
                height: 'auto',
                display: 'flex', 
                flexDirection: 'column',
                transition: 'all 0.35s cubic-bezier(.4,2,.3,1)',
                overflow: 'hidden',
                boxShadow: theme => theme.palette.mode === 'dark'
                  ? '0 4px 24px rgba(37,99,235,0.18)'
                  : '0 4px 24px rgba(37,99,235,0.08)',
                borderRadius: 5,
                position: 'relative',
                background: theme => theme.palette.mode === 'dark'
                  ? 'linear-gradient(120deg, #23272f 0%, #1a1d23 100%)'
                  : undefined,
                '&:hover': {
                  transform: 'scale(1.035)',
                  boxShadow: theme => theme.palette.mode === 'dark'
                    ? '0 12px 32px 0 rgba(37,99,235,0.32)'
                    : '0 12px 32px 0 rgba(37,99,235,0.18)',
                },
              }}
            >
              <CardActionArea 
                onClick={handleCheckClick}
                sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch', position: 'relative', background: theme => theme.palette.mode === 'dark'
                  ? 'linear-gradient(120deg, #23272f 0%, #1a1d23 100%)'
                  : 'linear-gradient(120deg, #f8fafc 0%, #e3eafc 100%)' }}
                TouchRippleProps={{ style: { color: '#2563eb', opacity: 0.2 } }}
              >
                <Box sx={{ 
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  pt: 4,
                  pb: 2
                }}>
                  <DescriptionIcon 
                    sx={{ 
                      fontSize: 90, 
                      color: 'primary.main',
                      opacity: 0.92,
                      filter: theme => theme.palette.mode === 'dark'
                        ? 'drop-shadow(0 2px 12px #2563eb44)'
                        : 'drop-shadow(0 2px 12px #2563eb22)'
                    }} 
                  />
                </Box>
                <CardContent sx={{ flexGrow: 1, textAlign: 'center', px: 3 }}>
                  <Typography 
                    gutterBottom 
                    variant="h5" 
                    component="h3"
                    sx={{ mb: 2, fontWeight: 700, letterSpacing: 0.5, color: theme => theme.palette.text.primary }}
                  >
                    Проверить свой курсач
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ fontSize: 18, opacity: 0.85 }}>
                    Загрузите документ и получите подробный отчет о соответствии нормам оформления 
                    с возможностью автоматического исправления ошибок
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center', pb: 3, transition: 'opacity 0.3s', opacity: { xs: 1, md: 0 }, '&:hover': { opacity: 1 } }}>
                  <Button 
                    variant="contained"
                    size="large"
                    onClick={handleCheckClick}
                    sx={{ 
                      px: 5, 
                      fontWeight: 600, 
                      fontSize: 18, 
                      borderRadius: 3, 
                      boxShadow: theme => theme.palette.mode === 'dark'
                        ? '0 2px 8px #2563eb44'
                        : '0 2px 8px #2563eb22',
                      background: theme => theme.palette.mode === 'dark'
                        ? 'linear-gradient(90deg, #1e293b 0%, #2563eb 100%)'
                        : undefined,
                      color: theme => theme.palette.mode === 'dark'
                        ? theme.palette.primary.contrastText
                        : undefined,
                    }}
                  >
                    Проверить
                  </Button>
                </CardActions>
              </CardActionArea>
            </Card>
          </Grid>

          {/* Карточка "Написать свою курсовую" (неактивная) */}
          <Grid item xs={12} sm={6} md={5}>
            <Card 
              sx={{ 
                aspectRatio: '1',
                minHeight: { xs: 220, sm: 320 },
                minWidth: { xs: 220, sm: 320 },
                maxWidth: 420,
                width: '100%',
                height: 'auto',
                display: 'flex', 
                flexDirection: 'column',
                transition: 'all 0.35s cubic-bezier(.4,2,.3,1)',
                opacity: 0.6,
                filter: 'grayscale(60%)',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 5,
                boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
                background: 'linear-gradient(120deg, #f3f4f6 0%, #e0e7ef 100%)',
                '&:hover': {
                  opacity: 0.7,
                  transform: 'scale(1.01)',
                }
              }}
            >
              <Box sx={{ 
                height: 10, 
                bgcolor: 'grey.400', 
                width: '100%' 
              }} />
              {/* Блокировка поверх карточки */}
              <Box 
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(24,28,36,0.82)' : 'rgba(255,255,255,0.55)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                  pointerEvents: 'none',
                  transition: 'background 0.3s',
                  backdropFilter: 'blur(8px) saturate(1.2)',
                  boxShadow: theme => theme.palette.mode === 'dark'
                    ? '0 4px 32px #2563eb33, 0 0 0 1.5px #6366f1cc'
                    : '0 4px 24px #2563eb11',
                  border: theme => theme.palette.mode === 'dark' ? '1.5px solid #333' : '1.5px solid #e3e3e3',
                  borderRadius: 4,
                }}
              >
                <Box 
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 3,
                    borderRadius: 3,
                    bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(36,40,56,0.92)' : 'rgba(255,255,255,0.92)',
                    boxShadow: theme => theme.palette.mode === 'dark'
                      ? '0 2px 24px #6366f144, 0 0 0 2px #2563eb33'
                      : '0 2px 12px #2563eb11',
                    animation: 'lockPulse 2.5s infinite',
                  }}
                >
                  <LockIcon sx={{ 
                    fontSize: 54, 
                    color: theme => theme.palette.mode === 'dark' ? '#6366f1' : 'grey.600', 
                    mb: 1, 
                    filter: theme => theme.palette.mode === 'dark' ? 'drop-shadow(0 0 12px #6366f1cc)' : 'drop-shadow(0 2px 8px #bdbdbd22)',
                    animation: 'lockBounce 1.2s infinite' 
                  }} />
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 900, 
                      letterSpacing: 2, 
                      mb: 0.5,
                      fontSize: 28,
                      background: theme => theme.palette.mode === 'dark'
                        ? 'linear-gradient(90deg,#6366f1,#2563eb 60%,#6366f1)'
                        : 'linear-gradient(90deg,#bdbdbd,#757575,#bdbdbd)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      textShadow: theme => theme.palette.mode === 'dark'
                        ? '0 2px 16px #6366f1cc'
                        : '0 2px 8px #bdbdbd33',
                      textTransform: 'uppercase',
                    }}
                  >
                    В разработке
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme => theme.palette.mode === 'dark' ? '#bdbdbd' : 'grey.700', mt: 1, fontWeight: 500, opacity: 0.85 }}>
                    Этот раздел скоро будет доступен!
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ 
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                pt: 4,
                pb: 2
              }}>
                <CreateIcon 
                  sx={{ 
                    fontSize: 90, 
                    color: 'grey.400',
                    filter: 'drop-shadow(0 2px 12px #bdbdbd22)'
                  }} 
                />
              </Box>
              <CardContent sx={{ flexGrow: 1, textAlign: 'center', px: 3 }}>
                <Typography 
                  gutterBottom 
                  variant="h5" 
                  component="h3"
                  sx={{ mb: 2, fontWeight: 700, letterSpacing: 0.5 }}
                >
                  Написать свою курсовую
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontSize: 18, opacity: 0.8 }}>
                  Создавайте курсовую работу онлайн с автоматическим соблюдением 
                  всех требований нормоконтроля. Функционал в разработке.
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
                <Button 
                  variant="contained"
                  size="large"
                  disabled
                  startIcon={<LockIcon />}
                  sx={{ 
                    px: 5, 
                    fontWeight: 700, 
                    fontSize: 18, 
                    borderRadius: 3,
                    background: theme => theme.palette.mode === 'dark'
                      ? 'linear-gradient(90deg,#6366f1 0%,#2563eb 100%)'
                      : 'linear-gradient(90deg,#e0e7ef 0%,#bdbdbd 100%)',
                    color: theme => theme.palette.mode === 'dark' ? '#fff' : '#222',
                    boxShadow: theme => theme.palette.mode === 'dark'
                      ? '0 2px 16px #6366f1cc'
                      : '0 2px 8px #bdbdbd33',
                    opacity: 0.95,
                  }}
                >
                  Скоро
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Как это работает */}
      <Box sx={{ bgcolor: 'background.default', py: 8, mt: 10 }}>
        <Container maxWidth="lg">
          <Typography 
            variant="h4" 
            component="h2"
            align="center"
            sx={{ mb: 6, fontWeight: 700 }}
          >
            Как это работает?
          </Typography>

          <Grid container spacing={5} justifyContent="center" alignItems="center">
            {/* Шаг 1 */}
            <Grid item xs={12} sm={4}>
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                viewport={{ once: true }}
                style={{ height: '100%' }}
              >
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                    textAlign: 'center',
                    height: '100%',
                    position: 'relative',
                }}
              >
                <Box 
                  sx={{
                      width: 90,
                      height: 90,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'primary.main',
                    color: 'white',
                      mb: 3,
                      boxShadow: '0 4px 24px #2563eb33',
                      fontSize: 44,
                      transition: 'transform 0.3s',
                      '&:hover': { transform: 'scale(1.08) rotate(-6deg)' },
                  }}
                >
                    <DescriptionIcon sx={{ fontSize: 44 }} />
                </Box>
                  <Typography variant="h6" gutterBottom fontWeight={700} sx={{ fontSize: 22 }}>
                  1. Загрузите документ
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Загрузите ваш DOCX файл с курсовой работой через удобный 
                  интерфейс с поддержкой drag-and-drop
                </Typography>
              </Box>
              </motion.div>
            </Grid>
            {/* Шаг 2 */}
            <Grid item xs={12} sm={4}>
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                viewport={{ once: true }}
                style={{ height: '100%' }}
              >
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                    textAlign: 'center',
                    height: '100%',
                    position: 'relative',
                }}
              >
                <Box 
                  sx={{
                      width: 90,
                      height: 90,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'primary.main',
                    color: 'white',
                      mb: 3,
                      boxShadow: '0 4px 24px #2563eb33',
                      fontSize: 44,
                      transition: 'transform 0.3s',
                      '&:hover': { transform: 'scale(1.08) rotate(6deg)' },
                  }}
                >
                    <FindInPageIcon sx={{ fontSize: 44 }} />
                </Box>
                  <Typography variant="h6" gutterBottom fontWeight={700} sx={{ fontSize: 22 }}>
                  2. Получите отчет
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Система проанализирует работу, выявит все несоответствия 
                  требованиям и представит результаты в наглядном отчете
                </Typography>
              </Box>
              </motion.div>
            </Grid>
            {/* Шаг 3 */}
            <Grid item xs={12} sm={4}>
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.5 }}
                viewport={{ once: true }}
                style={{ height: '100%' }}
              >
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                    textAlign: 'center',
                    height: '100%',
                    position: 'relative',
                }}
              >
                <Box 
                  sx={{
                      width: 90,
                      height: 90,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'primary.main',
                    color: 'white',
                      mb: 3,
                      boxShadow: '0 4px 24px #2563eb33',
                      fontSize: 44,
                      transition: 'transform 0.3s',
                      '&:hover': { transform: 'scale(1.08) rotate(-4deg)' },
                  }}
                >
                    <BuildIcon sx={{ fontSize: 44 }} />
                </Box>
                  <Typography variant="h6" gutterBottom fontWeight={700} sx={{ fontSize: 22 }}>
                  3. Исправьте ошибки
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Автоматически исправьте найденные проблемы одним кликом 
                  и скачайте исправленную версию документа
                </Typography>
              </Box>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Преимущества */}
      <Container sx={{ py: 8 }}>
        <Typography 
          variant="h4" 
          component="h2" 
          align="center"
          sx={{ mb: 6, fontWeight: 700 }}
        >
          Преимущества сервиса
        </Typography>

        <Grid container spacing={3} justifyContent="center">
          {/* Скорость */}
          <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex', justifyContent: 'center' }}>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              viewport={{ once: true }}
              style={{ height: '100%' }}
            >
            <Paper 
              elevation={0} 
              sx={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                maxWidth: 350,
                minWidth: 260,
                width: '100%',
                mx: 'auto',
                p: 3,
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                transition: 'transform 0.3s, box-shadow 0.3s',
                boxShadow: '0 4px 24px rgba(37,99,235,0.08)',
                '&:hover': {
                  transform: 'scale(1.035)',
                  boxShadow: '0 12px 32px 0 #2563eb33',
                  borderColor: 'primary.light',
                }
              }}
            >
              <Box 
                sx={{ 
                  width: 56, height: 56, borderRadius: '50%', mb: 2,
                  background: 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 12px #2563eb33',
                  mx: 'auto',
                }}
              >
                <SpeedIcon sx={{ color: 'white', fontSize: 30 }} />
              </Box>
              <Typography variant="h6" gutterBottom fontWeight={700} align="center">
                Скорость
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, flexGrow: 1 }} align="center">
                Получите результаты проверки вашего документа за считанные секунды, 
                вместо часов ожидания ответа от преподавателя
              </Typography>
              <Button
                variant="text"
                color="primary"
                component={RouterLink}
                to="/check"
                size="small"
                endIcon={<ArrowForwardIcon />}
                sx={{ fontWeight: 600 }}
              >
                Проверить документ
              </Button>
            </Paper>
            </motion.div>
          </Grid>
          {/* Точность проверки */}
          <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex', justifyContent: 'center' }}>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              viewport={{ once: true }}
              style={{ height: '100%' }}
            >
            <Paper 
              elevation={0} 
              sx={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                maxWidth: 350,
                minWidth: 260,
                width: '100%',
                mx: 'auto',
                p: 3,
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                transition: 'transform 0.3s, box-shadow 0.3s',
                boxShadow: '0 4px 24px rgba(37,99,235,0.08)',
                '&:hover': {
                  transform: 'scale(1.035)',
                  boxShadow: '0 12px 32px 0 #22c55e33',
                  borderColor: 'success.light',
                }
              }}
            >
              <Box 
                sx={{ 
                  width: 56, height: 56, borderRadius: '50%', mb: 2,
                  background: 'linear-gradient(135deg, #22c55e 0%, #4ade80 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 12px #22c55e33',
                  mx: 'auto',
                }}
              >
                <CheckCircleOutlineIcon sx={{ color: 'white', fontSize: 30 }} />
              </Box>
              <Typography variant="h6" gutterBottom fontWeight={700} align="center">
                Точность проверки
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, flexGrow: 1 }} align="center">
                Система анализирует все аспекты форматирования документа, 
                включая шрифты, отступы, оформление библиографии и многое другое
              </Typography>
              <Button
                variant="text"
                color="success"
                component={RouterLink}
                to="/examples"
                size="small"
                endIcon={<ArrowForwardIcon />}
                sx={{ fontWeight: 600 }}
              >
                Смотреть примеры
              </Button>
            </Paper>
            </motion.div>
          </Grid>
          {/* Автоматическое исправление */}
          <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex', justifyContent: 'center' }}>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              viewport={{ once: true }}
              style={{ height: '100%' }}
            >
            <Paper 
              elevation={0} 
              sx={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                maxWidth: 350,
                minWidth: 260,
                width: '100%',
                mx: 'auto',
                p: 3,
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                transition: 'transform 0.3s, box-shadow 0.3s',
                boxShadow: '0 4px 24px rgba(37,99,235,0.08)',
                '&:hover': {
                  transform: 'scale(1.035)',
                  boxShadow: '0 12px 32px 0 #f59e42cc',
                  borderColor: 'warning.light',
                }
              }}
            >
              <Box 
                sx={{ 
                  width: 56, height: 56, borderRadius: '50%', mb: 2,
                  background: 'linear-gradient(135deg, #f59e42 0%, #fbbf24 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 12px #f59e4233',
                  mx: 'auto',
                }}
              >
                <AutoFixHighIcon sx={{ color: 'white', fontSize: 30 }} />
              </Box>
              <Typography variant="h6" gutterBottom fontWeight={700} align="center">
                Автоматическое исправление
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, flexGrow: 1 }} align="center">
                Большинство обнаруженных проблем может быть исправлено автоматически одним кликом, 
                что экономит ваше время на форматирование
              </Typography>
              <Button
                variant="text"
                color="warning"
                component={RouterLink}
                to="/guidelines"
                size="small"
                endIcon={<ArrowForwardIcon />}
                sx={{ fontWeight: 600 }}
              >
                Подробнее о требованиях
              </Button>
            </Paper>
            </motion.div>
          </Grid>
        </Grid>
      </Container>

      {/* Новый блок: Быстрые ссылки */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Box sx={{ mt: 8, mb: 4 }}>
          <Typography 
            variant="h4" 
            component="h2" 
            align="center"
            sx={{ mb: 1, fontWeight: 700 }}
          >
            Полезные ресурсы
          </Typography>
          <Typography 
            variant="subtitle1" 
            color="text.secondary"
            align="center"
            sx={{ mb: 5, maxWidth: 800, mx: 'auto' }}
          >
            Помимо автоматической проверки, мы предлагаем полезные материалы для оформления курсовой работы
          </Typography>
        </Box>

        <Grid container spacing={3} justifyContent="center">
          {/* Рекомендации по оформлению */}
          <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex', justifyContent: 'center' }}>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              viewport={{ once: true }}
              style={{ height: '100%' }}
            >
            <Paper 
              elevation={0} 
              sx={{ 
                display: 'flex',
                flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                height: '100%',
                  maxWidth: 350,
                  minWidth: 260,
                  width: '100%',
                  mx: 'auto',
                p: 3,
                  borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                transition: 'transform 0.3s, box-shadow 0.3s',
                  boxShadow: '0 4px 24px rgba(37,99,235,0.08)',
                '&:hover': {
                    transform: 'scale(1.035)',
                    boxShadow: '0 12px 32px 0 #2563eb33',
                    borderColor: 'primary.light',
                }
              }}
            >
              <Box 
                sx={{ 
                    width: 56, height: 56, borderRadius: '50%', mb: 2,
                    background: 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 12px #2563eb33',
                    mx: 'auto',
                }}
              >
                  <MenuBookIcon sx={{ color: 'white', fontSize: 30 }} />
              </Box>
                <Typography variant="h6" gutterBottom fontWeight={700} align="center">
                Рекомендации по оформлению
              </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, flexGrow: 1 }} align="center">
                Подробное руководство по оформлению всех элементов курсовой работы согласно действующим стандартам
              </Typography>
              <Button 
                variant="text" 
                color="primary" 
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/guidelines')}
                  sx={{ fontWeight: 600 }}
              >
                Перейти к рекомендациям
              </Button>
            </Paper>
            </motion.div>
          </Grid>
          {/* Примеры оформления */}
          <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex', justifyContent: 'center' }}>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              viewport={{ once: true }}
              style={{ height: '100%' }}
            >
            <Paper 
              elevation={0} 
              sx={{ 
                display: 'flex',
                flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                height: '100%',
                  maxWidth: 350,
                  minWidth: 260,
                  width: '100%',
                  mx: 'auto',
                p: 3,
                  borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                transition: 'transform 0.3s, box-shadow 0.3s',
                  boxShadow: '0 4px 24px rgba(37,99,235,0.08)',
                '&:hover': {
                    transform: 'scale(1.035)',
                    boxShadow: '0 12px 32px 0 #22c55e33',
                    borderColor: 'success.light',
                }
              }}
            >
              <Box 
                sx={{ 
                    width: 56, height: 56, borderRadius: '50%', mb: 2,
                    background: 'linear-gradient(135deg, #22c55e 0%, #4ade80 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 12px #22c55e33',
                    mx: 'auto',
                }}
              >
                  <CollectionsBookmarkIcon sx={{ color: 'white', fontSize: 30 }} />
              </Box>
                <Typography variant="h6" gutterBottom fontWeight={700} align="center">
                Примеры оформления
              </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, flexGrow: 1 }} align="center">
                Наглядные примеры правильного и неправильного оформления элементов курсовых работ с пояснениями
              </Typography>
              <Button 
                variant="text" 
                  color="success" 
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/examples')}
                  sx={{ fontWeight: 600 }}
              >
                Смотреть примеры
              </Button>
            </Paper>
            </motion.div>
          </Grid>
          {/* Полезные ресурсы */}
          <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex', justifyContent: 'center' }}>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              viewport={{ once: true }}
              style={{ height: '100%' }}
            >
            <Paper 
              elevation={0} 
              sx={{ 
                display: 'flex',
                flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                height: '100%',
                  maxWidth: 350,
                  minWidth: 260,
                  width: '100%',
                  mx: 'auto',
                p: 3,
                  borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                transition: 'transform 0.3s, box-shadow 0.3s',
                  boxShadow: '0 4px 24px rgba(37,99,235,0.08)',
                '&:hover': {
                    transform: 'scale(1.035)',
                    boxShadow: '0 12px 32px 0 #f59e42cc',
                    borderColor: 'warning.light',
                }
              }}
            >
              <Box 
                sx={{ 
                    width: 56, height: 56, borderRadius: '50%', mb: 2,
                    background: 'linear-gradient(135deg, #f59e42 0%, #fbbf24 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 12px #f59e4233',
                    mx: 'auto',
                }}
              >
                  <InfoIcon sx={{ color: 'white', fontSize: 30 }} />
              </Box>
                <Typography variant="h6" gutterBottom fontWeight={700} align="center">
                Полезные ресурсы
              </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, flexGrow: 1 }} align="center">
                Шаблоны документов, ответы на часто задаваемые вопросы и другие полезные материалы для студентов
              </Typography>
              <Button 
                variant="text" 
                  color="warning" 
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/resources')}
                  sx={{ fontWeight: 600 }}
              >
                Перейти к ресурсам
              </Button>
            </Paper>
            </motion.div>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default HomePage; 