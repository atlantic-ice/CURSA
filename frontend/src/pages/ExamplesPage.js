import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
  useTheme
} from '@mui/material';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import TextFormatIcon from '@mui/icons-material/TextFormat';
import BorderStyleIcon from '@mui/icons-material/BorderStyle';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import TableChartIcon from '@mui/icons-material/TableChart';
import GuidelineExample from '../components/GuidelineExample';
import RelatedLinksCard from '../components/RelatedLinksCard';
import { motion } from 'framer-motion';

// TabPanel компонент для вкладок
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`examples-tabpanel-${index}`}
      aria-labelledby={`examples-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>{children}</Box>
      )}
    </div>
  );
}

// Функция для генерации атрибутов вкладок
function a11yProps(index) {
  return {
    id: `examples-tab-${index}`,
    'aria-controls': `examples-tabpanel-${index}`,
  };
}

const ExamplesPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const theme = useTheme();

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Ссылки на связанные разделы
  const relatedLinks = [
    {
      title: 'Рекомендации по оформлению',
      description: 'Подробные требования и рекомендации по оформлению курсовых работ',
      path: '/guidelines',
      icon: <MenuBookIcon color="primary" />
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
              Примеры оформления документов
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
              Наглядные примеры правильного и неправильного оформления различных элементов курсовой работы.
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
            <Tab icon={<TextFormatIcon />} iconPosition="start" label="Текстовое оформление" {...a11yProps(0)} />
            <Tab icon={<BorderStyleIcon />} iconPosition="start" label="Заголовки" {...a11yProps(1)} />
            <Tab icon={<FormatListBulletedIcon />} iconPosition="start" label="Списки" {...a11yProps(2)} />
            <Tab icon={<MenuBookIcon />} iconPosition="start" label="Библиография" {...a11yProps(3)} />
            <Tab icon={<TableChartIcon />} iconPosition="start" label="Таблицы и рисунки" {...a11yProps(4)} />
          </Tabs>
        </Paper>

        {/* WOW-анимированный контент вкладок */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {/* Вкладка Текстовое оформление */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ px: 3 }}>
              <Typography variant="h6" gutterBottom>
                Примеры оформления основного текста
              </Typography>
              <Typography variant="body1" paragraph>
                Ниже приведены примеры правильного и неправильного форматирования текста в курсовых работах.
              </Typography>

              <GuidelineExample
                title="Шрифт и размер текста"
                description="Для основного текста курсовой работы используется шрифт Times New Roman размером 14 пт."
                incorrectExample={`Текст, набранный шрифтом Arial, размером 12 пт, с выравниванием по левому краю.`}
                incorrectExplanation="Использован неверный шрифт (Arial вместо Times New Roman) и неверный размер (12 пт вместо 14 пт)."
                correctExample={`Текст, набранный шрифтом Times New Roman, размером 14 пт, с выравниванием по ширине.`}
                correctExplanation="Корректный шрифт Times New Roman размером 14 пт с правильным выравниванием."
                incorrectFormatting={{
                  fontFamily: "'Arial', sans-serif",
                  fontSize: '12pt',
                  textAlign: 'left',
                }}
                correctFormatting={{
                  fontFamily: "'Times New Roman', serif",
                  fontSize: '14pt',
                  textAlign: 'justify',
                }}
              />

              <GuidelineExample
                title="Межстрочный интервал"
                description="Весь основной текст должен иметь межстрочный интервал 1,5 строки."
                incorrectExample={`Этот абзац имеет одинарный межстрочный интервал.
Расстояние между строками минимальное.
Такое форматирование не соответствует требованиям.`}
                incorrectExplanation="Использован одинарный межстрочный интервал вместо полуторного."
                correctExample={`Этот абзац имеет межстрочный интервал 1,5 строки.
Расстояние между строками соответствует требованиям.
Такое форматирование является правильным.`}
                correctExplanation="Использован правильный межстрочный интервал 1,5 строки."
                incorrectFormatting={{
                  lineHeight: 1.0,
                  fontFamily: "'Times New Roman', serif",
                  fontSize: '14pt',
                }}
                correctFormatting={{
                  lineHeight: 1.5,
                  fontFamily: "'Times New Roman', serif",
                  fontSize: '14pt',
                }}
              />

              <GuidelineExample
                title="Абзацный отступ"
                description="Первая строка каждого абзаца должна иметь отступ 1,25 см."
                incorrectExample={`Этот абзац не имеет отступа первой строки.
Это затрудняет визуальное восприятие разделения текста на смысловые блоки и не соответствует требованиям нормоконтроля.`}
                incorrectExplanation="Отсутствует отступ первой строки абзаца."
                correctExample={`Этот абзац имеет правильный отступ первой строки 1,25 см.
Такое форматирование улучшает читаемость текста и соответствует требованиям оформления.`}
                correctExplanation="Правильный отступ первой строки абзаца 1,25 см."
                incorrectFormatting={{
                  textIndent: 0,
                  fontFamily: "'Times New Roman', serif",
                  fontSize: '14pt',
                  lineHeight: 1.5,
                }}
                correctFormatting={{
                  textIndent: '1.25cm',
                  fontFamily: "'Times New Roman', serif",
                  fontSize: '14pt',
                  lineHeight: 1.5,
                }}
              />

              <GuidelineExample
                title="Выравнивание текста"
                description="Основной текст должен иметь выравнивание по ширине страницы."
                incorrectExample={`Текст с выравниванием по левому краю.
Правый край получается неровным.
Это неправильное форматирование для основного текста.`}
                incorrectExplanation="Текст выровнен по левому краю вместо выравнивания по ширине."
                correctExample={`Текст с выравниванием по ширине страницы.
Оба края - левый и правый - имеют ровное выравнивание.
Это правильное форматирование для основного текста курсовой работы.`}
                correctExplanation="Правильное выравнивание текста по ширине страницы."
                incorrectFormatting={{
                  textAlign: 'left',
                  fontFamily: "'Times New Roman', serif",
                  fontSize: '14pt',
                  lineHeight: 1.5,
                }}
                correctFormatting={{
                  textAlign: 'justify',
                  fontFamily: "'Times New Roman', serif",
                  fontSize: '14pt',
                  lineHeight: 1.5,
                }}
              />
            </Box>
          </TabPanel>

          {/* Вкладка Заголовки */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ px: 3 }}>
              <Typography variant="h6" gutterBottom>
                Примеры оформления заголовков
              </Typography>
              <Typography variant="body1" paragraph>
                Правильное оформление заголовков различных уровней обеспечивает структурированность работы.
              </Typography>
              
              <GuidelineExample
                title="Заголовок первого уровня"
                description="Заголовки первого уровня должны быть выровнены по центру, набраны полужирным шрифтом, без точки в конце."
                incorrectExample={`1. АНАЛИЗ ФИНАНСОВОГО СОСТОЯНИЯ ПРЕДПРИЯТИЯ.`}
                incorrectExplanation="Ошибки: есть точка в конце заголовка."
                correctExample={`1. АНАЛИЗ ФИНАНСОВОГО СОСТОЯНИЯ ПРЕДПРИЯТИЯ`}
                correctExplanation="Заголовок оформлен правильно: выравнивание по центру, полужирный шрифт, без точки в конце."
                incorrectFormatting={{
                  fontFamily: "'Times New Roman', serif",
                  fontSize: '14pt',
                  fontWeight: 'bold',
                  textAlign: 'center',
                }}
                correctFormatting={{
                  fontFamily: "'Times New Roman', serif",
                  fontSize: '14pt',
                  fontWeight: 'bold',
                  textAlign: 'center',
                }}
              />
              
              <GuidelineExample
                title="Заголовок второго уровня"
                description="Заголовки второго уровня должны начинаться с абзацного отступа, набраны полужирным шрифтом, без точки в конце."
                incorrectExample={`1.1 Методы оценки финансовой устойчивости.`}
                incorrectExplanation="Ошибки: точка в конце заголовка, отсутствует точка после номера подраздела."
                correctExample={`1.1. Методы оценки финансовой устойчивости`}
                correctExplanation="Заголовок оформлен правильно: с абзацного отступа, есть точка после номера, нет точки в конце заголовка."
                incorrectFormatting={{
                  fontFamily: "'Times New Roman', serif",
                  fontSize: '14pt',
                  fontWeight: 'bold',
                  textAlign: 'left',
                  textIndent: '1.25cm',
                }}
                correctFormatting={{
                  fontFamily: "'Times New Roman', serif",
                  fontSize: '14pt',
                  fontWeight: 'bold',
                  textAlign: 'left',
                  textIndent: '1.25cm',
                }}
              />
              
              <GuidelineExample
                title="Нумерация заголовков"
                description="Заголовки должны иметь последовательную и логичную нумерацию, отражающую иерархию."
                incorrectExample={`1. ТЕОРЕТИЧЕСКАЯ ЧАСТЬ

1.1. Основные понятия

1.3. Методология исследования

2. ПРАКТИЧЕСКАЯ ЧАСТЬ`}
                incorrectExplanation="Ошибка: нарушена последовательность нумерации (пропущен подраздел 1.2)."
                correctExample={`1. ТЕОРЕТИЧЕСКАЯ ЧАСТЬ

1.1. Основные понятия

1.2. Методология исследования

2. ПРАКТИЧЕСКАЯ ЧАСТЬ`}
                correctExplanation="Правильная последовательная нумерация заголовков."
                incorrectFormatting={{
                  fontFamily: "'Times New Roman', serif",
                  fontSize: '14pt',
                  fontWeight: 'bold',
                  whiteSpace: 'pre-line',
                }}
                correctFormatting={{
                  fontFamily: "'Times New Roman', serif",
                  fontSize: '14pt',
                  fontWeight: 'bold',
                  whiteSpace: 'pre-line',
                }}
              />
            </Box>
          </TabPanel>

          {/* Вкладка Списки */}
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ px: 3 }}>
              <Typography variant="h6" gutterBottom>
                Примеры оформления списков
              </Typography>
              <Typography variant="body1" paragraph>
                В курсовой работе могут использоваться нумерованные и маркированные списки, которые должны быть оформлены единообразно.
              </Typography>
              
              <GuidelineExample
                title="Маркированный список"
                description="Маркированные списки используются для перечисления однородных элементов без указания порядка или приоритета."
                incorrectExample={`Основные преимущества метода:
• Высокая точность
- Простота применения
* Низкая стоимость`}
                incorrectExplanation="Ошибка: используются разные маркеры для элементов одного списка."
                correctExample={`Основные преимущества метода:
• Высокая точность
• Простота применения
• Низкая стоимость`}
                correctExplanation="Правильно: все элементы списка имеют одинаковые маркеры."
                incorrectFormatting={{
                  fontFamily: "'Times New Roman', serif",
                  fontSize: '14pt',
                  whiteSpace: 'pre-line',
                  lineHeight: 1.5,
                }}
                correctFormatting={{
                  fontFamily: "'Times New Roman', serif",
                  fontSize: '14pt',
                  whiteSpace: 'pre-line',
                  lineHeight: 1.5,
                }}
              />
              
              <GuidelineExample
                title="Нумерованный список"
                description="Нумерованные списки используются, когда важен порядок или последовательность элементов."
                incorrectExample={`Этапы реализации проекта:
1) Планирование
2. Разработка
3- Тестирование
4) Внедрение`}
                incorrectExplanation="Ошибка: используются разные форматы нумерации элементов списка."
                correctExample={`Этапы реализации проекта:
1. Планирование
2. Разработка
3. Тестирование
4. Внедрение`}
                correctExplanation="Правильно: все элементы списка имеют одинаковый формат нумерации."
                incorrectFormatting={{
                  fontFamily: "'Times New Roman', serif",
                  fontSize: '14pt',
                  whiteSpace: 'pre-line',
                  lineHeight: 1.5,
                }}
                correctFormatting={{
                  fontFamily: "'Times New Roman', serif",
                  fontSize: '14pt',
                  whiteSpace: 'pre-line',
                  lineHeight: 1.5,
                }}
              />
              
              <GuidelineExample
                title="Вложенные списки"
                description="При использовании вложенных списков каждый уровень должен иметь свой тип маркера или нумерации."
                incorrectExample={`Классификация методов:
1. Количественные методы
   1. Статистический анализ
   2. Математическое моделирование
2. Качественные методы
   1. Экспертные оценки
   2. Интервьюирование`}
                incorrectExplanation="Ошибка: на разных уровнях вложенности используется одинаковый тип нумерации."
                correctExample={`Классификация методов:
1. Количественные методы
   а) Статистический анализ
   б) Математическое моделирование
2. Качественные методы
   а) Экспертные оценки
   б) Интервьюирование`}
                correctExplanation="Правильно: разные уровни вложенности имеют разный тип нумерации."
                incorrectFormatting={{
                  fontFamily: "'Times New Roman', serif",
                  fontSize: '14pt',
                  whiteSpace: 'pre-line',
                  lineHeight: 1.5,
                }}
                correctFormatting={{
                  fontFamily: "'Times New Roman', serif",
                  fontSize: '14pt',
                  whiteSpace: 'pre-line',
                  lineHeight: 1.5,
                }}
              />
            </Box>
          </TabPanel>

          {/* Вкладка Библиография */}
          <TabPanel value={tabValue} index={3}>
            <Box sx={{ px: 3 }}>
              <Typography variant="h6" gutterBottom>
                Примеры оформления библиографии
              </Typography>
              <Typography variant="body1" paragraph>
                Список использованной литературы должен быть оформлен в соответствии с ГОСТ 7.1-2003.
              </Typography>
              
              <GuidelineExample
                title="Книга (один автор)"
                description="Правила оформления книги с одним автором в списке литературы."
                incorrectExample={`Иванов А.Б. "Основы экономической теории", Москва, Экономика, 2020, 256 с.`}
                incorrectExplanation="Ошибки: неверный порядок элементов, лишние кавычки, отсутствуют необходимые знаки препинания."
                correctExample={`Иванов, А.Б. Основы экономической теории. - Москва: Экономика, 2020. - 256 с.`}
                correctExplanation="Соблюдены все правила оформления по ГОСТ 7.1-2003."
                incorrectFormatting={{
                  fontFamily: "'Times New Roman', serif",
                  fontSize: '14pt',
                  textAlign: 'left',
                  lineHeight: 1.5,
                }}
                correctFormatting={{
                  fontFamily: "'Times New Roman', serif",
                  fontSize: '14pt',
                  textAlign: 'left',
                  lineHeight: 1.5,
                }}
              />
              
              <GuidelineExample
                title="Статья в журнале"
                description="Правила оформления статьи из периодического издания."
                incorrectExample={`Петров В.В. Анализ финансовых рынков. Финансы и кредит, 2022, № 5, С. 23-29`}
                incorrectExplanation="Ошибки: отсутствуют необходимые знаки препинания, неверный порядок элементов."
                correctExample={`Петров, В.В. Анализ финансовых рынков // Финансы и кредит. - 2022. - № 5. - С. 23-29.`}
                correctExplanation="Правильное оформление с двойной косой чертой, тире и всеми необходимыми знаками препинания."
                incorrectFormatting={{
                  fontFamily: "'Times New Roman', serif",
                  fontSize: '14pt',
                  textAlign: 'left',
                  lineHeight: 1.5,
                }}
                correctFormatting={{
                  fontFamily: "'Times New Roman', serif",
                  fontSize: '14pt',
                  textAlign: 'left',
                  lineHeight: 1.5,
                }}
              />
              
              <GuidelineExample
                title="Электронный ресурс"
                description="Правила оформления источника из интернета."
                incorrectExample={`Иванов И.И. Особенности современной экономики http://example.com/article (дата обращения 15.03.2023).`}
                incorrectExplanation="Ошибки: отсутствует обозначение [Электронный ресурс], неверное оформление URL и даты обращения."
                correctExample={`Иванов И.И. Особенности современной экономики [Электронный ресурс] // Экономический вестник. – URL: http://example.com/article (дата обращения: 15.03.2023).`}
                correctExplanation="Правильное оформление с указанием типа ресурса, источника и даты обращения."
                incorrectFormatting={{
                  fontFamily: "'Times New Roman', serif",
                  fontSize: '14pt',
                  textAlign: 'left',
                  lineHeight: 1.5,
                }}
                correctFormatting={{
                  fontFamily: "'Times New Roman', serif",
                  fontSize: '14pt',
                  textAlign: 'left',
                  lineHeight: 1.5,
                }}
              />
            </Box>
          </TabPanel>

          {/* Вкладка Таблицы и рисунки */}
          <TabPanel value={tabValue} index={4}>
            <Box sx={{ px: 3 }}>
              <Typography variant="h6" gutterBottom>
                Примеры оформления таблиц и рисунков
              </Typography>
              <Typography variant="body1" paragraph>
                Таблицы и рисунки должны быть оформлены единообразно и иметь соответствующие подписи.
              </Typography>
              
              <GuidelineExample
                title="Оформление таблицы"
                description="Таблицы должны иметь номер и название над таблицей."
                incorrectExample={`Таблица 1
Финансовые показатели предприятия

Показатель | 2020 | 2021 | 2022
Выручка    | 1200 | 1350 | 1420
Прибыль    | 350  | 420  | 450`}
                incorrectExplanation="Ошибка: отсутствует название таблицы, неправильное расположение номера."
                correctExample={`Таблица 1 - Финансовые показатели предприятия

Показатель | 2020 | 2021 | 2022
Выручка    | 1200 | 1350 | 1420
Прибыль    | 350  | 420  | 450`}
                correctExplanation="Правильно: номер и название таблицы расположены над таблицей, название указано после номера через тире."
                incorrectFormatting={{
                  fontFamily: "'Times New Roman', serif",
                  fontSize: '14pt',
                  textAlign: 'left',
                  whiteSpace: 'pre-line'
                }}
                correctFormatting={{
                  fontFamily: "'Times New Roman', serif",
                  fontSize: '14pt',
                  textAlign: 'center',
                  whiteSpace: 'pre-line'
                }}
              />
            </Box>
          </TabPanel>
        </motion.div>
      </Container>
    </Box>
  );
};

export default ExamplesPage;