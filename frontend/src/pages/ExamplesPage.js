import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
  Divider,
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
    <Container maxWidth="lg">
      <Box sx={{ mb: 5, textAlign: 'center' }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            mb: 2,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
          }}
        >
          <MenuBookOutlinedIcon sx={{ fontSize: 32 }} />
          Примеры оформления документов
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto' }}>
          Наглядные примеры правильного и неправильного оформления различных элементов курсовой работы.
        </Typography>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 2,
            pt: 1,
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Tab 
            icon={<TextFormatIcon />} 
            iconPosition="start" 
            label="Текстовое оформление" 
            {...a11yProps(0)} 
            sx={{ textTransform: 'none', fontWeight: 500 }} 
          />
          <Tab 
            icon={<BorderStyleIcon />} 
            iconPosition="start" 
            label="Заголовки" 
            {...a11yProps(1)} 
            sx={{ textTransform: 'none', fontWeight: 500 }} 
          />
          <Tab 
            icon={<FormatListBulletedIcon />} 
            iconPosition="start" 
            label="Списки" 
            {...a11yProps(2)} 
            sx={{ textTransform: 'none', fontWeight: 500 }} 
          />
          <Tab 
            icon={<MenuBookIcon />} 
            iconPosition="start" 
            label="Библиография" 
            {...a11yProps(3)} 
            sx={{ textTransform: 'none', fontWeight: 500 }} 
          />
          <Tab 
            icon={<TableChartIcon />} 
            iconPosition="start" 
            label="Таблицы и рисунки" 
            {...a11yProps(4)} 
            sx={{ textTransform: 'none', fontWeight: 500 }}
          />
        </Tabs>

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
            />

            <GuidelineExample
              title="Абзацный отступ"
              description="Первая строка каждого абзаца должна иметь отступ 1,25 см."
              incorrectExample={`Этот абзац не имеет отступа первой строки.
Это затрудняет визуальное восприятие разделения текста на смысловые блоки и не соответствует требованиям нормоконтроля.`}
              incorrectExplanation="Отсутствует отступ первой строки абзаца."
              correctExample={`    Этот абзац имеет правильный отступ первой строки 1,25 см.
Такое форматирование улучшает читаемость текста и соответствует требованиям оформления.`}
              correctExplanation="Правильный отступ первой строки абзаца 1,25 см."
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
            />
            
            <GuidelineExample
              title="Заголовок второго уровня"
              description="Заголовки второго уровня должны начинаться с абзацного отступа, набраны полужирным шрифтом, без точки в конце."
              incorrectExample={`1.1 Методы оценки финансовой устойчивости.`}
              incorrectExplanation="Ошибки: точка в конце заголовка, отсутствует точка после номера подраздела."
              correctExample={`1.1. Методы оценки финансовой устойчивости`}
              correctExplanation="Заголовок оформлен правильно: с абзацного отступа, есть точка после номера, нет точки в конце заголовка."
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
            />
            
            <GuidelineExample
              title="Статья в журнале"
              description="Правила оформления статьи из периодического издания."
              incorrectExample={`Петров В.В. Анализ финансовых рынков. Финансы и кредит, 2022, № 5, С. 23-29`}
              incorrectExplanation="Ошибки: отсутствуют необходимые знаки препинания, неверный порядок элементов."
              correctExample={`Петров, В.В. Анализ финансовых рынков // Финансы и кредит. - 2022. - № 5. - С. 23-29.`}
              correctExplanation="Правильное оформление с двойной косой чертой, тире и всеми необходимыми знаками препинания."
            />
            
            <GuidelineExample
              title="Электронный ресурс"
              description="Правила оформления источника из интернета."
              incorrectExample={`Иванов И.И. Особенности современной экономики http://example.com/article (дата обращения 15.03.2023).`}
              incorrectExplanation="Ошибки: отсутствует обозначение [Электронный ресурс], неверное оформление URL и даты обращения."
              correctExample={`Иванов И.И. Особенности современной экономики [Электронный ресурс] // Экономический вестник. – URL: http://example.com/article (дата обращения: 15.03.2023).`}
              correctExplanation="Правильное оформление с указанием типа ресурса, источника и даты обращения."
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
              incorrectExample={`Результаты исследования

+-------+-------+-------+
| Год   | 2020  | 2021  |
+-------+-------+-------+
| Доход | 1500  | 1650  |
+-------+-------+-------+`}
              incorrectExplanation="Ошибка: отсутствует номер таблицы и правильное оформление её названия."
              correctExample={`Таблица 1 – Результаты исследования

+-------+-------+-------+
| Год   | 2020  | 2021  |
+-------+-------+-------+
| Доход | 1500  | 1650  |
+-------+-------+-------+`}
              correctExplanation="Правильное оформление: указан номер таблицы и её название с тире."
            />
            
            <GuidelineExample
              title="Оформление рисунка"
              description="Рисунки должны иметь номер и подпись под рисунком."
              incorrectExample={`[Изображение графика]
График динамики продаж`}
              incorrectExplanation="Ошибка: отсутствует номер рисунка и неверное оформление подписи."
              correctExample={`[Изображение графика]

Рисунок 1 – График динамики продаж`}
              correctExplanation="Правильное оформление: указан номер рисунка и его название с тире."
            />
            
            <GuidelineExample
              title="Ссылки на таблицы и рисунки"
              description="В тексте должны быть ссылки на все таблицы и рисунки."
              incorrectExample={`Результаты исследования представлены в таблице ниже. На графике можно видеть динамику показателей.`}
              incorrectExplanation="Ошибка: отсутствуют конкретные ссылки на номера таблиц и рисунков."
              correctExample={`Результаты исследования представлены в таблице 1. Как видно из рисунка 2, динамика показателей имеет положительный тренд.`}
              correctExplanation="Правильное оформление: есть конкретные ссылки на номера таблиц и рисунков."
            />
          </Box>
        </TabPanel>
      </Paper>

      {/* Блок связанных ссылок */}
      <RelatedLinksCard 
        title="Связанные разделы"
        links={relatedLinks}
        sx={{ mb: 4 }}
      />
    </Container>
  );
};

export default ExamplesPage; 