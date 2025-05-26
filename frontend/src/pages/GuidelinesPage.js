import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Grid,
  Card,
  CardHeader,
  CardContent,
  Tooltip,
  IconButton,
  useTheme
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TextFormatIcon from '@mui/icons-material/TextFormat';
import BorderStyleIcon from '@mui/icons-material/BorderStyle';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatLineSpacingIcon from '@mui/icons-material/FormatLineSpacing';
import TitleIcon from '@mui/icons-material/Title';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ImageIcon from '@mui/icons-material/Image';
import TableChartIcon from '@mui/icons-material/TableChart';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SchoolIcon from '@mui/icons-material/School';
import RelatedLinksCard from '../components/RelatedLinksCard';
import GuidelineExample from '../components/GuidelineExample';
import { motion } from 'framer-motion';

// TabPanel компонент для вкладок
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`guidelines-tabpanel-${index}`}
      aria-labelledby={`guidelines-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Функция для генерации атрибутов вкладок
function a11yProps(index) {
  return {
    id: `guidelines-tab-${index}`,
    'aria-controls': `guidelines-tabpanel-${index}`,
  };
}

const GuidelinesPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const theme = useTheme();

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Ссылки на связанные разделы
  const relatedLinks = [
    {
      title: 'Примеры оформления',
      description: 'Наглядные примеры правильного и неправильного оформления элементов курсовой',
      path: '/examples',
      icon: <SchoolIcon color="primary" />
    }
  ];

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh', pb: 8 }}>
      {/* WOW-шапка с градиентом */}
      <Box sx={{
        position: 'relative',
        overflow: 'hidden',
        bgcolor: theme.palette.mode === 'dark'
          ? 'linear-gradient(120deg, #23272f 0%, #1a1d23 100%)'
          : 'linear-gradient(120deg, #f8fafc 0%, #e3eafc 100%)',
        pt: { xs: 7, md: 10 },
        pb: { xs: 5, md: 7 },
        mb: 4,
        borderRadius: { xs: 0, md: 6 },
      }}>
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Typography
              variant="h4"
              component="h1"
              align="center"
              sx={{
                mb: 2,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1.5,
                letterSpacing: 1.5,
                fontSize: { xs: 28, md: 38 },
                background: theme => theme.palette.mode === 'dark'
                  ? 'linear-gradient(90deg, #60a5fa 0%, #a78bfa 100%)'
                  : 'linear-gradient(90deg, #2563eb 0%, #4f46e5 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textFillColor: 'transparent',
                textShadow: theme => theme.palette.mode === 'dark'
                  ? '0 2px 16px #6366f1cc'
                  : '0 2px 8px #2563eb33',
              }}
            >
              <MenuBookOutlinedIcon sx={{ fontSize: { xs: 28, md: 38 } }} />
              Рекомендации по оформлению
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{
                maxWidth: 800,
                mx: 'auto',
                mb: 1,
                fontWeight: 500,
                fontSize: { xs: 16, md: 20 },
                opacity: 0.92,
              }}
            >
              Узнайте о требованиях к оформлению курсовых работ в соответствии с актуальными стандартами нормоконтроля.
            </Typography>
          </motion.div>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
        {/* Sticky-tabs с WOW-стилем */}
        <Paper elevation={0} sx={{
          borderRadius: 4,
          border: '1.5px solid',
          borderColor: 'divider',
          mb: 4,
          position: 'sticky',
          top: { xs: 0, md: 16 },
          zIndex: 10,
          bgcolor: theme.palette.background.paper,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 2px 16px #2563eb22'
            : '0 2px 16px #2563eb11',
        }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              px: 2,
              pt: 1,
              borderBottom: '1.5px solid',
              borderColor: 'divider',
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: 18,
                borderRadius: 3,
                minHeight: 56,
                transition: 'all 0.2s',
                mx: 0.5,
                py: 1.2,
                px: 2.5,
                color: theme.palette.text.secondary,
                '&.Mui-selected': {
                  color: theme.palette.primary.main,
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(90deg,#23272f,#2563eb22)'
                    : 'linear-gradient(90deg,#e3eafc,#2563eb11)',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 2px 12px #2563eb33'
                    : '0 2px 12px #2563eb11',
                },
                '&:hover': {
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(90deg,#23272f,#2563eb11)'
                    : 'linear-gradient(90deg,#f8fafc,#2563eb07)',
                  color: theme.palette.primary.main,
                }
              },
              '& .MuiTabs-indicator': {
                height: 4,
                borderRadius: 2,
                background: 'linear-gradient(90deg,#2563eb,#6366f1)',
              }
            }}
          >
            <Tab icon={<TextFormatIcon />} iconPosition="start" label="Шрифты" {...a11yProps(0)} />
            <Tab icon={<BorderStyleIcon />} iconPosition="start" label="Поля и отступы" {...a11yProps(1)} />
            <Tab icon={<FormatLineSpacingIcon />} iconPosition="start" label="Интервалы" {...a11yProps(2)} />
            <Tab icon={<TitleIcon />} iconPosition="start" label="Заголовки" {...a11yProps(3)} />
            <Tab icon={<MenuBookIcon />} iconPosition="start" label="Библиография" {...a11yProps(4)} />
            <Tab icon={<TableChartIcon />} iconPosition="start" label="Таблицы и рисунки" {...a11yProps(5)} />
            <Tab icon={<ErrorOutlineIcon />} iconPosition="start" label="Типичные ошибки" {...a11yProps(6)} />
          </Tabs>

          {/* WOW-анимированная линия под вкладками */}
        </Paper>

        {/* Контент вкладок (оставляю существующий, но улучшаю стили и добавляю анимацию) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {/* Вкладка Шрифты */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ px: 3 }}>
              <Typography variant="h6" gutterBottom>
                Требования к шрифтам
              </Typography>
              <Typography variant="body1" paragraph>
                Правильное оформление шрифтов в курсовой работе помогает обеспечить удобочитаемость и 
                придерживаться академических стандартов оформления текста.
              </Typography>
              
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
                    <CardHeader 
                      title="Основной текст" 
                      sx={{ bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }} 
                      titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
                    />
                    <CardContent>
                      <List dense>
                        <ListItem>
                          <ListItemIcon><CheckCircleOutlineIcon color="success" /></ListItemIcon>
                          <ListItemText primary="Times New Roman (основной шрифт)" />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><CheckCircleOutlineIcon color="success" /></ListItemIcon>
                          <ListItemText primary="Размер шрифта: 14 пт" />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><CheckCircleOutlineIcon color="success" /></ListItemIcon>
                          <ListItemText primary="Цвет текста: черный" />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><CheckCircleOutlineIcon color="success" /></ListItemIcon>
                          <ListItemText primary="Выравнивание: по ширине страницы" />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
                    <CardHeader 
                      title="Заголовки" 
                      sx={{ bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}
                      titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
                    />
                    <CardContent>
                      <List dense>
                        <ListItem>
                          <ListItemIcon><CheckCircleOutlineIcon color="success" /></ListItemIcon>
                          <ListItemText primary="Заголовок 1 уровня: 16 пт, полужирный" />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><CheckCircleOutlineIcon color="success" /></ListItemIcon>
                          <ListItemText primary="Заголовок 2 уровня: 14-16 пт, полужирный" />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><CheckCircleOutlineIcon color="success" /></ListItemIcon>
                          <ListItemText primary="Заголовок 3 уровня: 14 пт, полужирный" />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><CheckCircleOutlineIcon color="success" /></ListItemIcon>
                          <ListItemText primary="Без подчеркивания" />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Accordion elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1" fontWeight={500}>Типичные ошибки оформления шрифтов</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List>
                    <ListItem>
                      <ListItemText 
                        primary="Использование разных шрифтов в документе" 
                        secondary="В курсовой работе должен использоваться один шрифт для всего текста (Times New Roman)"
                      />
                    </ListItem>
                    <Divider component="li" sx={{ my: 1 }} />
                    <ListItem>
                      <ListItemText 
                        primary="Неверный размер шрифта" 
                        secondary="Использование шрифта меньше 14 пт для основного текста затрудняет чтение работы"
                      />
                    </ListItem>
                    <Divider component="li" sx={{ my: 1 }} />
                    <ListItem>
                      <ListItemText 
                        primary="Декоративное форматирование" 
                        secondary="Курсив допустим только для выделения отдельных фрагментов; подчеркивание не рекомендуется"
                      />
                    </ListItem>
                  </List>
                </AccordionDetails>
              </Accordion>
            </Box>
          </TabPanel>

          {/* Вкладка Поля и отступы */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ px: 3 }}>
              <Typography variant="h6" gutterBottom>
                Требования к полям и отступам документа
              </Typography>
              <Typography variant="body1" paragraph>
                Правильные поля и отступы обеспечивают структурированность документа и его соответствие 
                требованиям нормоконтроля.
              </Typography>
              
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
                    <CardHeader 
                      title="Поля страницы" 
                      sx={{ bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }} 
                      titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
                    />
                    <CardContent>
                      <List dense>
                        <ListItem>
                          <ListItemIcon><CheckCircleOutlineIcon color="success" /></ListItemIcon>
                          <ListItemText primary="Левое поле: 3 см (для подшивки)" />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><CheckCircleOutlineIcon color="success" /></ListItemIcon>
                          <ListItemText primary="Правое поле: 1,5 см" />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><CheckCircleOutlineIcon color="success" /></ListItemIcon>
                          <ListItemText primary="Верхнее поле: 2 см" />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><CheckCircleOutlineIcon color="success" /></ListItemIcon>
                          <ListItemText primary="Нижнее поле: 2 см" />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
                    <CardHeader 
                      title="Отступы абзацев" 
                      sx={{ bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }} 
                      titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
                    />
                    <CardContent>
                      <List dense>
                        <ListItem>
                          <ListItemIcon><CheckCircleOutlineIcon color="success" /></ListItemIcon>
                          <ListItemText primary="Отступ первой строки абзаца: 1,25 см" />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><CheckCircleOutlineIcon color="success" /></ListItemIcon>
                          <ListItemText primary="Выравнивание абзаца: по ширине" />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><CheckCircleOutlineIcon color="success" /></ListItemIcon>
                          <ListItemText primary="Интервал перед абзацем: 0 пт" />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><CheckCircleOutlineIcon color="success" /></ListItemIcon>
                          <ListItemText primary="Интервал после абзаца: 0 пт" />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </TabPanel>

          {/* Вкладка Интервалы */}
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ px: 3 }}>
              <Typography variant="h6" gutterBottom>
                Требования к интервалам
              </Typography>
              <Typography variant="body1" paragraph>
                Интервалы в документе влияют на его читаемость и общее впечатление от работы.
              </Typography>
              
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 3 }}>
                <CardHeader 
                  title="Межстрочные интервалы" 
                  sx={{ bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }} 
                  titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
                />
                <CardContent>
                  <List>
                    <ListItem>
                      <ListItemIcon><CheckCircleOutlineIcon color="success" /></ListItemIcon>
                      <ListItemText 
                        primary="Основной текст"
                        secondary="Межстрочный интервал: 1,5 строки"
                      />
                    </ListItem>
                    <Divider component="li" sx={{ my: 1 }} />
                    <ListItem>
                      <ListItemIcon><CheckCircleOutlineIcon color="success" /></ListItemIcon>
                      <ListItemText 
                        primary="Сноски и примечания"
                        secondary="Межстрочный интервал: одинарный (1,0)"
                      />
                    </ListItem>
                    <Divider component="li" sx={{ my: 1 }} />
                    <ListItem>
                      <ListItemIcon><CheckCircleOutlineIcon color="success" /></ListItemIcon>
                      <ListItemText 
                        primary="Интервалы между абзацами"
                        secondary="Не следует добавлять дополнительные интервалы между абзацами одного раздела"
                      />
                    </ListItem>
                    <Divider component="li" sx={{ my: 1 }} />
                    <ListItem>
                      <ListItemIcon><CheckCircleOutlineIcon color="success" /></ListItemIcon>
                      <ListItemText 
                        primary="Интервалы после заголовков"
                        secondary="После заголовка раздела: 1 интервал (одна пустая строка)"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Box>
          </TabPanel>

          {/* Вкладка Заголовки */}
          <TabPanel value={tabValue} index={3}>
            <Box sx={{ px: 3 }}>
              <Typography variant="h6" gutterBottom>
                Оформление заголовков
              </Typography>
              <Typography variant="body1" paragraph>
                Правильное форматирование заголовков обеспечивает структурированность работы.
              </Typography>
              
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
                    <CardHeader 
                      title="Форматирование заголовков" 
                      sx={{ bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }} 
                      titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
                    />
                    <CardContent>
                      <List dense>
                        <ListItem>
                          <ListItemIcon><CheckCircleOutlineIcon color="success" /></ListItemIcon>
                          <ListItemText primary="Заголовки всех уровней начинаются с заглавной буквы" />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><CheckCircleOutlineIcon color="success" /></ListItemIcon>
                          <ListItemText primary="Точка в конце заголовка не ставится" />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><CheckCircleOutlineIcon color="success" /></ListItemIcon>
                          <ListItemText primary="Заголовки первого уровня: по центру, полужирным" />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><CheckCircleOutlineIcon color="success" /></ListItemIcon>
                          <ListItemText primary="Подзаголовки: с абзацного отступа, полужирным" />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
                    <CardHeader 
                      title="Нумерация разделов" 
                      sx={{ bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}
                      titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
                    />
                    <CardContent>
                      <List dense>
                        <ListItem>
                          <ListItemIcon><CheckCircleOutlineIcon color="success" /></ListItemIcon>
                          <ListItemText primary="Основные разделы: 1, 2, 3 и т.д." />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><CheckCircleOutlineIcon color="success" /></ListItemIcon>
                          <ListItemText primary="Подразделы: 1.1, 1.2, 1.3 и т.д." />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><CheckCircleOutlineIcon color="success" /></ListItemIcon>
                          <ListItemText primary="Пункты: 1.1.1, 1.1.2, 1.1.3 и т.д." />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><CheckCircleOutlineIcon color="success" /></ListItemIcon>
                          <ListItemText primary="Введение, заключение, список литературы и приложения не нумеруются" />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </TabPanel>

          {/* Вкладка Библиография */}
          <TabPanel value={tabValue} index={4}>
            <Box sx={{ px: 3 }}>
              <Typography variant="h6" gutterBottom>
                Оформление библиографии
              </Typography>
              <Typography variant="body1" paragraph>
                Библиография должна быть оформлена в соответствии с ГОСТ 7.1-2003.
              </Typography>
              
              <Accordion elevation={0} defaultExpanded sx={{ border: '1px solid', borderColor: 'divider', mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1" fontWeight={500}>Книги и монографии</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Один автор:
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Фамилия, И.О. Название книги. - Город: Издательство, Год. - Количество страниц с.
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mb: 3 }}>
                    Пример: Иванов, А.Б. Основы экономической теории. - Москва: Экономика, 2020. - 256 с.
                  </Typography>

                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Два-три автора:
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Фамилия, И.О., Фамилия, И.О. Название книги. - Город: Издательство, Год. - Количество страниц с.
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mb: 3 }}>
                    Пример: Петров, С.В., Иванов, А.Б. Методология исследования. - Москва: Наука, 2019. - 350 с.
                  </Typography>

                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Четыре автора:
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Фамилия, И.О., Фамилия, И.О., Фамилия, И.О., Фамилия, И.О. Название книги. - Город: Издательство, Год. - Количество страниц с.
                  </Typography>

                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Пять и более авторов:
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Фамилия, И.О., Фамилия, И.О., Фамилия, И.О. [и др.] Название книги. - Город: Издательство, Год. - Количество страниц с.
                  </Typography>
                </AccordionDetails>
              </Accordion>

              <Accordion elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1" fontWeight={500}>Электронные ресурсы</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Автор (если есть). Название материала [Электронный ресурс] // Название сайта. – URL: ссылка (дата обращения: ДД.ММ.ГГГГ).
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    Пример: Иванов И.И. Особенности современной экономики [Электронный ресурс] // Экономический вестник. – URL: http://example.com/article (дата обращения: 15.03.2023).
                  </Typography>
                </AccordionDetails>
              </Accordion>

              <Accordion elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1" fontWeight={500}>Статьи в журналах</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Фамилия, И.О. Название статьи // Название журнала. - Год. - Том (номер). - С. начальная страница-конечная страница.
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    Пример: Петров, В.В. Анализ финансовых рынков // Финансы и кредит. - 2022. - № 5. - С. 23-29.
                  </Typography>
                </AccordionDetails>
              </Accordion>

              <Accordion elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1" fontWeight={500}>Нормативные документы</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Название документа: вид документа от дата № номер // Название источника публикации. – Год. – Номер (если есть).
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    Пример: Об образовании в Российской Федерации: федеральный закон от 29.12.2012 № 273-ФЗ // Российская газета. – 2012. – № 303.
                  </Typography>
                </AccordionDetails>
              </Accordion>
            </Box>
          </TabPanel>

          {/* Вкладка Таблицы и рисунки */}
          <TabPanel value={tabValue} index={5}>
            <Box sx={{ px: 3 }}>
              <Typography variant="h6" gutterBottom>
                Оформление таблиц и иллюстраций
              </Typography>
              <Typography variant="body1" paragraph>
                Иллюстрации (рисунки, графики, схемы) и таблицы должны быть оформлены в соответствии с требованиями стандарта.
              </Typography>
              
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
                    <CardHeader 
                      title="Таблицы" 
                      sx={{ bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }} 
                      titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
                    />
                    <CardContent>
                      <List>
                        <ListItem>
                          <ListItemIcon><CheckCircleOutlineIcon color="success" /></ListItemIcon>
                          <ListItemText 
                            primary="Нумерация таблиц"
                            secondary="Сквозная нумерация арабскими цифрами (Таблица 1, Таблица 2 и т.д.)"
                          />
                        </ListItem>
                        <Divider component="li" sx={{ my: 1 }} />
                        <ListItem>
                          <ListItemIcon><CheckCircleOutlineIcon color="success" /></ListItemIcon>
                          <ListItemText 
                            primary="Название таблицы"
                            secondary="Располагается над таблицей с выравниванием по левому краю"
                          />
                        </ListItem>
                        <Divider component="li" sx={{ my: 1 }} />
                        <ListItem>
                          <ListItemIcon><CheckCircleOutlineIcon color="success" /></ListItemIcon>
                          <ListItemText 
                            primary="Формат названия"
                            secondary="Таблица [номер] – [Название таблицы]"
                          />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
                    <CardHeader 
                      title="Иллюстрации" 
                      sx={{ bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}
                      titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
                    />
                    <CardContent>
                      <List>
                        <ListItem>
                          <ListItemIcon><CheckCircleOutlineIcon color="success" /></ListItemIcon>
                          <ListItemText 
                            primary="Нумерация иллюстраций"
                            secondary="Сквозная нумерация арабскими цифрами (Рисунок 1, Рисунок 2 и т.д.)"
                          />
                        </ListItem>
                        <Divider component="li" sx={{ my: 1 }} />
                        <ListItem>
                          <ListItemIcon><CheckCircleOutlineIcon color="success" /></ListItemIcon>
                          <ListItemText 
                            primary="Подпись к иллюстрации"
                            secondary="Располагается под иллюстрацией с выравниванием по центру"
                          />
                        </ListItem>
                        <Divider component="li" sx={{ my: 1 }} />
                        <ListItem>
                          <ListItemIcon><CheckCircleOutlineIcon color="success" /></ListItemIcon>
                          <ListItemText 
                            primary="Формат подписи"
                            secondary="Рисунок [номер] – [Название рисунка]"
                          />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Typography variant="body1" sx={{ mt: 3, fontWeight: 500 }}>
                Общие правила:
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon><CheckCircleOutlineIcon color="success" /></ListItemIcon>
                  <ListItemText primary="Все таблицы и иллюстрации должны иметь ссылки в тексте работы" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircleOutlineIcon color="success" /></ListItemIcon>
                  <ListItemText primary="Ссылки оформляются в скобках: (таблица 1), (рис. 3)" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircleOutlineIcon color="success" /></ListItemIcon>
                  <ListItemText primary="Если иллюстрация или таблица заимствована, необходимо дать ссылку на источник" />
                </ListItem>
              </List>
            </Box>
          </TabPanel>

          {/* Новая вкладка: Типичные ошибки */}
          <TabPanel value={tabValue} index={6}>
            <Box sx={{ px: 3 }}>
              <Typography variant="h6" gutterBottom>
                Типичные ошибки в оформлении курсовых работ
              </Typography>
              <Typography variant="body1" paragraph>
                Ознакомьтесь с распространенными ошибками оформления и способами их исправления, чтобы избежать типичных проблем при подготовке курсовой работы.
              </Typography>

              <Accordion elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1" fontWeight={500}>Ошибки в оформлении текста</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <GuidelineExample
                    title="Использование нескольких шрифтов"
                    description="В курсовой работе необходимо использовать единый шрифт для всего текста"
                    incorrectExample={`Этот абзац написан шрифтом Times New Roman.\nА этот абзац использует Arial.\nА здесь применяется Calibri.`}
                    incorrectExplanation="Использование разных шрифтов создает впечатление неаккуратности и несоответствия стандартам"
                    correctExample={`Весь текст курсовой работы должен быть\nоформлен единым шрифтом Times New Roman\nразмером 14 пт.`}
                    correctExplanation="Единый шрифт обеспечивает визуальную целостность и соответствие требованиям"
                  />

                  <GuidelineExample
                    title="Неправильное выравнивание текста"
                    description="Основной текст должен быть выровнен по ширине страницы"
                    incorrectExample={`Этот текст выровнен по левому краю.\nОн выглядит неаккуратно и не соответствует\nтребованиям оформления курсовой работы.`}
                    incorrectExplanation="Выравнивание по левому краю создает неровный правый край текста"
                    correctExample={`Этот текст выровнен по ширине страницы.\nТакое выравнивание создает аккуратные ровные\nкрая с обеих сторон страницы.`}
                    correctExplanation="Выравнивание по ширине создает аккуратные прямые края с обеих сторон текста"
                  />
                </AccordionDetails>
              </Accordion>

              <Accordion elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1" fontWeight={500}>Ошибки в оформлении заголовков</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <GuidelineExample
                    title="Точка в конце заголовка"
                    description="Заголовки не должны содержать точку в конце"
                    incorrectExample={`1. ТЕОРЕТИЧЕСКИЕ ОСНОВЫ ИССЛЕДОВАНИЯ.`}
                    incorrectExplanation="Точка в конце заголовка не соответствует правилам оформления"
                    correctExample={`1. ТЕОРЕТИЧЕСКИЕ ОСНОВЫ ИССЛЕДОВАНИЯ`}
                    correctExplanation="Заголовок без точки в конце соответствует требованиям оформления"
                  />

                  <GuidelineExample
                    title="Неправильное выравнивание заголовков"
                    description="Заголовки первого уровня должны быть выровнены по центру, остальные - по левому краю с абзацного отступа"
                    incorrectExample={`2. АНАЛИЗ РЕЗУЛЬТАТОВ ИССЛЕДОВАНИЯ\n\n2.1. Методика проведения анализа`}
                    incorrectExplanation="Заголовок первого уровня не выровнен по центру"
                    correctExample={`2. АНАЛИЗ РЕЗУЛЬТАТОВ ИССЛЕДОВАНИЯ\n\n    2.1. Методика проведения анализа`}
                    correctExplanation="Заголовок первого уровня выровнен по центру, второго - по левому краю с отступом"
                  />
                </AccordionDetails>
              </Accordion>

              <Accordion elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1" fontWeight={500}>Ошибки в оформлении таблиц и рисунков</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <GuidelineExample
                    title="Отсутствие нумерации и названия"
                    description="Все таблицы и рисунки должны иметь нумерацию и название"
                    incorrectExample={`[Таблица без подписи]`}
                    incorrectExplanation="Таблица без номера и названия не соответствует требованиям"
                    correctExample={`Таблица 1 - Результаты экспериментов\n[Содержание таблицы]`}
                    correctExplanation="Таблица с правильной нумерацией и названием"
                  />

                  <GuidelineExample
                    title="Неверное расположение подписи"
                    description="Название таблицы размещается над таблицей, название рисунка - под рисунком"
                    incorrectExample={`[Содержание рисунка]\nРис. 1 - Структурная схема`}
                    incorrectExplanation="Подпись к рисунку размещена неправильно (должно быть 'Рисунок' полностью)"
                    correctExample={`[Содержание рисунка]\n\nРисунок 1 - Структурная схема`}
                    correctExplanation="Правильное размещение и формат подписи к рисунку"
                  />
                </AccordionDetails>
              </Accordion>

              <Accordion elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1" fontWeight={500}>Ошибки в оформлении списка литературы</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <GuidelineExample
                    title="Неверный порядок источников"
                    description="Источники в списке литературы должны быть расположены в алфавитном порядке"
                    incorrectExample={`1. Петров А.А. Основы теории.\n2. Иванов И.И. Методология исследования.\n3. Сидоров С.С. Прикладные аспекты.`}
                    incorrectExplanation="Источники расположены не в алфавитном порядке"
                    correctExample={`1. Иванов И.И. Методология исследования.\n2. Петров А.А. Основы теории.\n3. Сидоров С.С. Прикладные аспекты.`}
                    correctExplanation="Источники расположены в алфавитном порядке по фамилии первого автора"
                  />

                  <GuidelineExample
                    title="Неполные библиографические данные"
                    description="Каждый источник должен содержать полные библиографические данные"
                    incorrectExample={`1. Иванов И.И. Методология исследования.`}
                    incorrectExplanation="Отсутствуют выходные данные источника (год, издательство, количество страниц)"
                    correctExample={`1. Иванов И.И. Методология исследования: учебное пособие / И.И. Иванов. – М.: Наука, 2023. – 256 с.`}
                    correctExplanation="Представлены все необходимые библиографические данные источника"
                  />
                </AccordionDetails>
              </Accordion>

              <Accordion elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1" fontWeight={500}>Общие ошибки оформления</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <GuidelineExample
                    title="Неверные поля страницы"
                    description="Необходимо соблюдать требования к размерам полей страницы"
                    incorrectExample={`Поля: левое - 2 см, правое - 1 см,\nверхнее - 1 см, нижнее - 1 см`}
                    incorrectExplanation="Неправильные размеры полей не соответствуют стандартам"
                    correctExample={`Поля: левое - 3 см, правое - 1.5 см,\nверхнее - 2 см, нижнее - 2 см`}
                    correctExplanation="Размеры полей соответствуют стандартам оформления курсовых работ"
                  />

                  <GuidelineExample
                    title="Отсутствие нумерации страниц"
                    description="Все страницы работы, кроме титульного листа, должны быть пронумерованы"
                    incorrectExample={`[Страницы без нумерации]`}
                    incorrectExplanation="Отсутствие нумерации страниц затрудняет навигацию и не соответствует требованиям"
                    correctExample={`[Страницы с нумерацией внизу по центру, начиная со второй страницы]`}
                    correctExplanation="Правильная нумерация страниц соответствует требованиям оформления"
                  />
                </AccordionDetails>
              </Accordion>
            </Box>
            
            <Box sx={{ px: 3, mt: 4 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <RelatedLinksCard links={relatedLinks} />
                </Grid>
              </Grid>
            </Box>
          </TabPanel>
        </motion.div>
      </Container>
    </Box>
  );
};

export default GuidelinesPage; 