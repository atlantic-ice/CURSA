import React, { useState, useContext, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Box,
  Typography,
  Container,
  Paper,
  Grid,
  Button,
  Chip,
  IconButton,
  Collapse,
  Divider,
  useTheme,
  alpha,
  LinearProgress,
  Stack,
  Tooltip,
  Slide,
  CircularProgress
} from '@mui/material';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, 
  BarChart, Bar, XAxis, YAxis
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import VerifiedIcon from '@mui/icons-material/Verified';
import ArticleIcon from '@mui/icons-material/Article';
import TextFormatIcon from '@mui/icons-material/TextFormat';
import BorderStyleIcon from '@mui/icons-material/BorderStyle';
import FormatLineSpacingIcon from '@mui/icons-material/FormatLineSpacing';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import TitleIcon from '@mui/icons-material/Title';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ImageIcon from '@mui/icons-material/Image';
import TableChartIcon from '@mui/icons-material/TableChart';
import ListAltIcon from '@mui/icons-material/ListAlt';
import PrintIcon from '@mui/icons-material/Print';
import BugReportIcon from '@mui/icons-material/BugReport';
import ShieldIcon from '@mui/icons-material/Shield';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import SchoolIcon from '@mui/icons-material/School';
import BuildIcon from '@mui/icons-material/Build';
import DifferenceIcon from '@mui/icons-material/Difference';
import RefreshIcon from '@mui/icons-material/Refresh';

import './ReportPage.css';

const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE = isLocal ? 'http://localhost:5000' : (process.env.REACT_APP_API_BASE || 'https://cursa.onrender.com');

// --- Helper Functions ---

function getDocumentGrade(totalIssues, highSeverityCount, mediumSeverityCount, lowSeverityCount) {
  if (highSeverityCount === 0 && mediumSeverityCount === 0 && lowSeverityCount <= 3) {
    return { label: 'Отлично', color: 'success', score: 5, description: 'Документ соответствует стандартам' };
  }
  if (highSeverityCount === 0 && mediumSeverityCount <= 3 && lowSeverityCount <= 10) {
    return { label: 'Хорошо', color: 'success', score: 4, description: 'Незначительные отклонения' };
  }
  if (highSeverityCount === 0 && mediumSeverityCount <= 10) {
    return { label: 'Удовлетворительно', color: 'warning', score: 3, description: 'Требуются правки' };
  }
  if (highSeverityCount <= 5) {
    return { label: 'Неудовлетворительно', color: 'error', score: 2, description: 'Множество нарушений' };
  }
  return { label: 'Плохо', color: 'error', score: 1, description: 'Критическое количество ошибок' };
}

function groupIssues(issues) {
  const map = {};
  issues.forEach(issue => {
    const key = issue.type + '|' + issue.description;
    if (!map[key]) {
      map[key] = { ...issue, count: 1, locations: [issue.location] };
    } else {
      map[key].count += 1;
      map[key].locations.push(issue.location);
    }
  });
  return Object.values(map);
}

const getSeverityColor = (severity) => {
  switch (severity) {
    case 'high': return '#ef4444'; // Red 500
    case 'medium': return '#f59e0b'; // Amber 500
    case 'low': return '#3b82f6'; // Blue 500
    default: return '#94a3b8'; // Slate 400
  }
};

const getSeverityLabel = (severity) => {
  switch (severity) {
    case 'high': return 'Критическая';
    case 'medium': return 'Средняя';
    case 'low': return 'Низкая';
    default: return 'Инфо';
  }
};

// Руководства по ручным исправлениям
const MANUAL_FIX_GUIDES = {
  // Структурные проблемы
  structure_missing_section: {
    title: 'Добавление обязательных разделов',
    icon: <ArticleIcon />,
    steps: [
      'Откройте документ в Microsoft Word',
      'Перейдите в место, где должен быть раздел (например, после Содержания для Введения)',
      'Напишите заголовок раздела (например, "ВВЕДЕНИЕ")',
      'Выделите заголовок и примените стиль "Заголовок 1"',
      'Добавьте содержание раздела под заголовком'
    ],
    videoPlaceholder: '/videos/add_section.mp4',
    tips: ['Введение обычно идёт после Содержания', 'Заключение — перед Списком литературы']
  },
  structure_title_page: {
    title: 'Оформление титульного листа',
    icon: <TitleIcon />,
    steps: [
      'Создайте новую страницу в начале документа (Ctrl+Enter)',
      'Добавьте название учебного заведения (по центру, 14 пт)',
      'Добавьте название факультета и кафедры',
      'Укажите тип работы (Курсовая работа) и тему',
      'Добавьте информацию об авторе и руководителе',
      'Укажите город и год внизу страницы'
    ],
    videoPlaceholder: '/videos/title_page.mp4',
    tips: ['Титульный лист не нумеруется', 'Используйте шрифт Times New Roman 14 пт']
  },
  structure_table_of_contents: {
    title: 'Создание содержания',
    icon: <ListAltIcon />,
    steps: [
      'Убедитесь, что все заголовки оформлены стилями "Заголовок 1", "Заголовок 2" и т.д.',
      'Установите курсор после титульного листа',
      'Перейдите: Ссылки → Оглавление → Автособираемое оглавление',
      'Для обновления: правый клик на содержании → Обновить поле'
    ],
    videoPlaceholder: '/videos/table_of_contents.mp4',
    tips: ['Используйте стили заголовков для автоматического создания', 'Обновляйте содержание перед сдачей работы']
  },
  // Проблемы форматирования
  font: {
    title: 'Исправление шрифта',
    icon: <TextFormatIcon />,
    steps: [
      'Выделите весь текст (Ctrl+A)',
      'Перейдите: Главная → Шрифт',
      'Выберите шрифт "Times New Roman"',
      'Установите размер 14 пт',
      'Нажмите OK'
    ],
    videoPlaceholder: '/videos/fix_font.mp4',
    tips: ['Для таблиц допускается размер 12 пт', 'Подписи к рисункам — 12 пт']
  },
  margins: {
    title: 'Настройка полей страницы',
    icon: <BorderStyleIcon />,
    steps: [
      'Перейдите: Макет → Поля → Настраиваемые поля',
      'Установите значения: Левое — 3 см, Правое — 1,5 см',
      'Верхнее — 2 см, Нижнее — 2 см',
      'Нажмите OK'
    ],
    videoPlaceholder: '/videos/fix_margins.mp4',
    tips: ['Левое поле больше для подшивки', 'Все поля должны быть одинаковыми во всём документе']
  },
  line_spacing: {
    title: 'Настройка межстрочного интервала',
    icon: <FormatLineSpacingIcon />,
    steps: [
      'Выделите весь текст (Ctrl+A)',
      'Перейдите: Главная → Абзац',
      'В разделе "Интервал" выберите "Междустрочный: Полуторный"',
      'Установите "Перед: 0 пт" и "После: 0 пт"',
      'Нажмите OK'
    ],
    videoPlaceholder: '/videos/fix_line_spacing.mp4',
    tips: ['Полуторный интервал = 1.5', 'Не путайте с двойным интервалом']
  },
  paragraph_indent: {
    title: 'Настройка абзацного отступа',
    icon: <FormatListBulletedIcon />,
    steps: [
      'Выделите текст основной части',
      'Перейдите: Главная → Абзац',
      'В разделе "Отступ" найдите "Первая строка"',
      'Выберите "Отступ" и установите 1,25 см',
      'Нажмите OK'
    ],
    videoPlaceholder: '/videos/fix_indent.mp4',
    tips: ['Отступ только для первой строки абзаца', 'Заголовки обычно без отступа']
  },
  // Проблемы со списком литературы
  bibliography: {
    title: 'Оформление списка литературы',
    icon: <MenuBookIcon />,
    steps: [
      'Создайте раздел "СПИСОК ЛИТЕРАТУРЫ" (Заголовок 1)',
      'Пронумеруйте источники арабскими цифрами',
      'Для книги: Фамилия, И.О. Название / И.О. Фамилия. – Город: Издательство, Год. – Кол-во с.',
      'Для интернет-источника: добавьте [Электронный ресурс] и URL с датой обращения',
      'Расположите источники в алфавитном порядке'
    ],
    videoPlaceholder: '/videos/fix_bibliography.mp4',
    tips: ['Сначала русскоязычные источники', 'Используйте тире (–), а не дефис (-)']
  },
  // Проблемы с рисунками и таблицами
  figure: {
    title: 'Оформление рисунков',
    icon: <ImageIcon />,
    steps: [
      'Вставьте рисунок: Вставка → Рисунки',
      'Выровняйте по центру',
      'Под рисунком добавьте подпись: "Рисунок 1 – Название рисунка"',
      'Подпись: 12 пт, по центру',
      'В тексте должна быть ссылка на рисунок'
    ],
    videoPlaceholder: '/videos/fix_figure.mp4',
    tips: ['Нумерация сквозная по всему документу', 'Ссылка в тексте: "(рисунок 1)" или "на рисунке 1"']
  },
  table: {
    title: 'Оформление таблиц',
    icon: <TableChartIcon />,
    steps: [
      'Над таблицей добавьте заголовок: "Таблица 1 – Название таблицы"',
      'Заголовок: 14 пт, по левому краю с абзацным отступом',
      'Текст в таблице: 12 пт, выравнивание по ситуации',
      'Заголовки столбцов: жирным, по центру',
      'В тексте должна быть ссылка на таблицу'
    ],
    videoPlaceholder: '/videos/fix_table.mp4',
    tips: ['Таблица не должна выходить за поля', 'При переносе: "Продолжение таблицы 1"']
  },
  // Нумерация страниц
  page_numbers: {
    title: 'Настройка нумерации страниц',
    icon: <ListAltIcon />,
    steps: [
      'Перейдите: Вставка → Номер страницы → Внизу страницы → По центру',
      'Дважды кликните на колонтитул для редактирования',
      'На титульном листе: уберите галочку "Особый колонтитул для первой страницы"',
      'Установите начало нумерации с нужной страницы',
      'Закройте колонтитул (Esc или двойной клик вне него)'
    ],
    videoPlaceholder: '/videos/fix_page_numbers.mp4',
    tips: ['Титульный лист не нумеруется', 'Содержание обычно на странице 2']
  },
  // Заголовки
  headings: {
    title: 'Оформление заголовков',
    icon: <TitleIcon />,
    steps: [
      'Выделите текст заголовка',
      'Примените стиль: Главная → Стили → Заголовок 1/2/3',
      'Заголовок 1: ПРОПИСНЫЕ, жирный, по центру',
      'Заголовок 2: Обычный регистр, жирный, с отступом',
      'Не ставьте точку в конце заголовка'
    ],
    videoPlaceholder: '/videos/fix_headings.mp4',
    tips: ['Заголовки нумеруются арабскими цифрами', 'Между номером и текстом — пробел']
  }
};

// Получить подходящее руководство по типу ошибки
const getGuideForIssueType = (issueType) => {
  // Прямое совпадение
  if (MANUAL_FIX_GUIDES[issueType]) {
    return MANUAL_FIX_GUIDES[issueType];
  }
  
  // Поиск по частичному совпадению
  const typePrefix = issueType.split('_')[0];
  if (MANUAL_FIX_GUIDES[typePrefix]) {
    return MANUAL_FIX_GUIDES[typePrefix];
  }
  
  // Специальные случаи
  if (issueType.includes('font')) return MANUAL_FIX_GUIDES.font;
  if (issueType.includes('margin')) return MANUAL_FIX_GUIDES.margins;
  if (issueType.includes('spacing') || issueType.includes('interval')) return MANUAL_FIX_GUIDES.line_spacing;
  if (issueType.includes('indent')) return MANUAL_FIX_GUIDES.paragraph_indent;
  if (issueType.includes('heading') || issueType.includes('title')) return MANUAL_FIX_GUIDES.headings;
  if (issueType.includes('table')) return MANUAL_FIX_GUIDES.table;
  if (issueType.includes('figure') || issueType.includes('image') || issueType.includes('рисун')) return MANUAL_FIX_GUIDES.figure;
  if (issueType.includes('bibliography') || issueType.includes('литератур') || issueType.includes('источник')) return MANUAL_FIX_GUIDES.bibliography;
  if (issueType.includes('page') || issueType.includes('number') || issueType.includes('нумерац')) return MANUAL_FIX_GUIDES.page_numbers;
  if (issueType.includes('structure') || issueType.includes('section') || issueType.includes('раздел')) return MANUAL_FIX_GUIDES.structure_missing_section;
  
  return null;
};

// --- Components ---

const CustomTooltip = ({ active, payload, label }) => {
  const theme = useTheme();
  if (active && payload && payload.length) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          bgcolor: alpha('#121212', 0.9),
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          borderRadius: 2,
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
        }}
      >
        <Typography variant="caption" fontWeight={700} sx={{ mb: 0.5, display: 'block', color: 'text.secondary' }}>
          {label || payload[0].name}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: payload[0].payload.color || payload[0].color }} />
          <Typography variant="body2" fontWeight={700} color="white">
            {payload[0].value}
          </Typography>
        </Box>
      </Paper>
    );
  }
  return null;
};

const AnimatedNumber = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const end = parseInt(value, 10);
    if (isNaN(end)) return;

    const duration = 1500;
    const startTime = performance.now();
    let start = 0;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4); // Ease out quart
      
      setDisplayValue(Math.floor(start + (end - start) * ease));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return <span>{displayValue}</span>;
};

const ScoreCircle = ({ score, grade }) => {
  const theme = useTheme();
  const radius = 80;
  const stroke = 12;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 5) * circumference;

  return (
    <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
      <svg height={radius * 2} width={radius * 2} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          stroke={alpha(theme.palette.divider, 0.1)}
          strokeWidth={stroke}
          fill="transparent"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={theme.palette[grade.color].main}
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 1.5s ease-out' }}
          strokeLinecap="round"
          fill="transparent"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <Box sx={{ position: 'absolute', textAlign: 'center' }}>
        <Typography variant="h2" fontWeight={800} sx={{ color: 'white', lineHeight: 1 }}>
          {score}
        </Typography>
        <Typography variant="caption" sx={{ color: theme.palette[grade.color].main, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
          {grade.label}
        </Typography>
      </Box>
    </Box>
  );
};

const CATEGORY_LABELS = {
  structure: 'Структура',
  font: 'Шрифт',
  margins: 'Поля',
  line: 'Интервалы',
  paragraph: 'Отступы',
  bibliography: 'Литература',
  figure: 'Рисунки',
  table: 'Таблицы',
  page: 'Нумерация',
  heading: 'Заголовки',
  toc: 'Содержание',
  title: 'Титульный',
  topic: 'Тема',
  section: 'Разделы',
  image: 'Изображения',
  link: 'Ссылки',
  spell: 'Орфография',
  unknown: 'Прочее'
};

const StatCard = ({ title, value, subtitle, icon, color, delay }) => {
  const theme = useTheme();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      style={{ height: '100%', width: '100%' }}
    >
      <Paper
        className="glass-card"
        sx={{
          p: 3,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            borderColor: alpha(color || theme.palette.primary.main, 0.5),
            boxShadow: `0 10px 30px -10px ${alpha(color || theme.palette.primary.main, 0.3)}`,
            '& .stat-icon': {
              opacity: 0.15, // Subtle appearance behind text
              transform: 'rotate(-5deg) translateY(-10px) scale(1.1)',
            }
          }
        }}
      >
        {/* Background Icon */}
        <Box 
          className="stat-icon"
          sx={{ 
            position: 'absolute',
            right: -20,
            bottom: -20,
            color: color || theme.palette.text.primary,
            opacity: 0,
            transform: 'rotate(10deg) scale(0.8)',
            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 0,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {React.cloneElement(icon, { sx: { fontSize: 140 } })}
        </Box>
        
        {/* Content */}
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h3" fontWeight={800} sx={{ color: 'white', mb: 0.5, letterSpacing: '-0.02em', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
            <AnimatedNumber value={value} />
          </Typography>
          <Typography variant="body1" color="text.secondary" fontWeight={600} sx={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.7), mt: 0.5, display: 'block' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Paper>
    </motion.div>
  );
};

const IssueItem = ({ issue, index }) => {
  const [expanded, setExpanded] = useState(false);
  const theme = useTheme();
  const severityColor = getSeverityColor(issue.severity);

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 1.5,
        borderRadius: 2,
        background: alpha('#1a1a1a', 0.6),
        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        transition: 'all 0.2s ease',
        '&:hover': {
          background: alpha('#1a1a1a', 0.9),
          borderColor: alpha(severityColor, 0.3),
        }
      }}
    >
      <Box 
        onClick={() => setExpanded(!expanded)}
        sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'flex-start', 
          cursor: 'pointer',
          gap: 2,
          userSelect: 'none'
        }}
      >
        <Box 
          sx={{ 
            mt: 0.5,
            width: 8, 
            height: 8, 
            borderRadius: '50%', 
            bgcolor: severityColor,
            boxShadow: `0 0 8px ${severityColor}`
          }} 
        />
        
        <Box sx={{ flexGrow: 1 }}>
          <Typography 
            variant="body1" 
            fontWeight={500} 
            sx={{ 
              color: 'white',
              mb: 1,
              lineHeight: 1.4
            }}
          >
            {issue.description}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Chip 
              size="small"
              label={getSeverityLabel(issue.severity)}
              sx={{ 
                height: 20, 
                fontSize: '0.65rem', 
                fontWeight: 700,
                bgcolor: alpha(severityColor, 0.15),
                color: severityColor,
                border: 'none'
              }}
            />
            
            <Chip 
              size="small"
              label={`${issue.count} ${issue.count === 1 ? 'место' : issue.count < 5 ? 'места' : 'мест'}`}
              sx={{ 
                height: 20, 
                fontSize: '0.65rem', 
                bgcolor: alpha(theme.palette.text.secondary, 0.1),
                color: 'text.secondary',
                border: 'none'
              }}
            />

            {issue.auto_fixable && (
              <Chip 
                size="small"
                icon={<AutoFixHighIcon style={{ fontSize: 10 }} />}
                label="Авто"
                sx={{ 
                  height: 20, 
                  fontSize: '0.65rem', 
                  bgcolor: alpha(theme.palette.success.main, 0.15),
                  color: theme.palette.success.main,
                  border: 'none',
                  '& .MuiChip-icon': { color: theme.palette.success.main }
                }}
              />
            )}
          </Box>
        </Box>

        <IconButton 
          size="small" 
          sx={{ 
            color: 'text.secondary',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s'
          }}
        >
          <ExpandMoreIcon fontSize="small" />
        </IconButton>
      </Box>

      <Collapse in={expanded} timeout={200}>
        <Box sx={{ px: 2, pb: 2, ml: 4 }}>
          <Box sx={{ 
            p: 1.5, 
            borderRadius: 1, 
            bgcolor: alpha(theme.palette.background.default, 0.5),
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
          }}>
             <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', mb: 1, display: 'block', letterSpacing: 1, fontSize: '0.65rem' }}>
              Расположение
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {issue.locations.map((loc, idx) => (
                <Chip 
                  key={idx} 
                  label={loc} 
                  size="small" 
                  sx={{ 
                    bgcolor: alpha(theme.palette.background.paper, 1),
                    color: 'text.secondary',
                    fontSize: '0.7rem',
                    height: 24,
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`
                  }} 
                />
              ))}
            </Box>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};

// Компонент пошагового руководства
const ManualFixGuide = ({ guide, isOpen, onToggle }) => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  
  if (!guide) return null;
  
  return (
    <Paper
      elevation={0}
      sx={{
        mb: 2,
        borderRadius: 2,
        background: alpha(theme.palette.background.paper, 0.4),
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        overflow: 'hidden'
      }}
    >
      <Box
        onClick={onToggle}
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          cursor: 'pointer',
          '&:hover': { bgcolor: alpha(theme.palette.background.paper, 0.6) }
        }}
      >
        <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: alpha(theme.palette.info.main, 0.1), color: theme.palette.info.main }}>
          <BuildIcon fontSize="small" />
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle2" fontWeight={700} color="white">
            {guide.title}
          </Typography>
        </Box>
        <IconButton size="small">
          {isOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      <Collapse in={isOpen}>
        <Box sx={{ px: 2, pb: 2 }}>
          {guide.steps.map((step, index) => (
            <Box key={index} sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
              <Typography variant="caption" sx={{ 
                minWidth: 20, 
                height: 20, 
                borderRadius: '50%', 
                bgcolor: alpha(theme.palette.text.secondary, 0.2), 
                color: 'white',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontWeight: 700
              }}>
                {index + 1}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {step}
              </Typography>
            </Box>
          ))}
        </Box>
      </Collapse>
    </Paper>
  );
};

const ManualFixGuidesPanel = ({ issues }) => {
  const [expandedGuide, setExpandedGuide] = useState(null);
  
  const manualIssueTypes = useMemo(() => {
    const types = new Set();
    issues.filter(issue => !issue.auto_fixable).forEach(issue => types.add(issue.type));
    return Array.from(types);
  }, [issues]);
  
  const availableGuides = useMemo(() => {
    const guides = [];
    const addedTitles = new Set();
    manualIssueTypes.forEach(type => {
      const guide = getGuideForIssueType(type);
      if (guide && !addedTitles.has(guide.title)) {
        guides.push({ type, ...guide });
        addedTitles.add(guide.title);
      }
    });
    return guides;
  }, [manualIssueTypes]);
  
  if (availableGuides.length === 0) return null;
  
  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.75rem', fontWeight: 700 }}>
        Ручные исправления
      </Typography>
      {availableGuides.map((guide, index) => (
        <ManualFixGuide
          key={guide.type}
          guide={guide}
          isOpen={expandedGuide === index}
          onToggle={() => setExpandedGuide(expandedGuide === index ? null : index)}
        />
      ))}
    </Box>
  );
};

const ReportPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const { reportData, fileName } = location.state || {};
  
  const [loading, setLoading] = useState(false);
  const [correctionSuccess, setCorrectionSuccess] = useState(false);
  const [correctedFilePath, setCorrectedFilePath] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');

  useEffect(() => {
    if (reportData?.correction_success && reportData?.corrected_file_path) {
      setCorrectedFilePath(reportData.corrected_file_path);
      setCorrectionSuccess(true);
      const autoDownload = () => {
        let fName = reportData.corrected_file_path.split(/[/\\]/).pop();
        if (!fName.toLowerCase().endsWith('.docx')) fName += '.docx';
        const link = document.createElement('a');
        link.href = `${API_BASE}/corrections/${encodeURIComponent(fName)}?t=${new Date().getTime()}`;
        link.download = fName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
      setTimeout(autoDownload, 1000);
    }
  }, [reportData]);

  useEffect(() => {
    if (!reportData) navigate('/');
  }, [reportData, navigate]);

  const effectiveResults = useMemo(() => reportData?.check_results || {}, [reportData]);
  const issues = useMemo(() => effectiveResults?.issues || [], [effectiveResults]);
  const profileInfo = useMemo(() => effectiveResults?.profile || null, [effectiveResults]);
  
  const filteredIssues = useMemo(() => {
    if (filterSeverity === 'all') return issues;
    return issues.filter(i => i.severity === filterSeverity);
  }, [issues, filterSeverity]);

  const groupedIssuesList = useMemo(() => groupIssues(filteredIssues), [filteredIssues]);
  const statistics = useMemo(() => effectiveResults?.statistics || {}, [effectiveResults]);
  
  const totalIssues = effectiveResults?.total_issues_count || 0;
  const highSeverityCount = statistics.severity?.high || 0;
  const mediumSeverityCount = statistics.severity?.medium || 0;
  const lowSeverityCount = statistics.severity?.low || 0;
  const autoFixableCount = statistics.auto_fixable_count || 0;

  const grade = useMemo(() => 
    getDocumentGrade(totalIssues, highSeverityCount, mediumSeverityCount, lowSeverityCount),
    [totalIssues, highSeverityCount, mediumSeverityCount, lowSeverityCount]
  );

  const severityData = [
    { name: 'Критические', value: highSeverityCount, color: '#ef4444' },
    { name: 'Средние', value: mediumSeverityCount, color: '#f59e0b' },
    { name: 'Низкие', value: lowSeverityCount, color: '#3b82f6' },
  ].filter(d => d.value > 0);

  const categoryData = useMemo(() => {
    const cats = {};
    issues.forEach(i => {
      const cat = i.type.split('_')[0];
      cats[cat] = (cats[cat] || 0) + 1;
    });
    // Сортировка по убыванию количества ошибок
    return Object.entries(cats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [issues]);

  const handleCorrection = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/correct`, {
        file_path: reportData.temp_path
      });

      if (response.data.success) {
        setCorrectedFilePath(response.data.corrected_file_path);
        setCorrectionSuccess(true);
      }
    } catch (error) {
      console.error('Correction failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (path) => {
    if (!path) return;
    let fName = path.split(/[/\\]/).pop();
    if (!fName.toLowerCase().endsWith('.docx')) fName += '.docx';
    window.location.href = `${API_BASE}/corrections/${encodeURIComponent(fName)}?t=${new Date().getTime()}`;
  };

  const handlePrint = () => {
    window.print();
  };

  if (!reportData) return null;

  return (
    <Box sx={{ 
      height: '100vh', 
      bgcolor: '#050505',
      color: 'text.primary',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.03) 0%, transparent 50%)'
    }}>
      {/* Scrollable Content Area */}
      <Box sx={{ 
        flex: 1, 
        overflowY: 'auto', 
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* HUD Header */}
        <Box sx={{ 
          position: 'sticky', 
          top: 0, 
          zIndex: 100, 
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          bgcolor: 'rgba(5,5,5,0.8)'
        }}>
          <Container maxWidth="xl">
            <Box sx={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <IconButton onClick={() => navigate('/')} size="small" sx={{ color: 'text.secondary', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2 }}>
                  <ArrowBackIcon fontSize="small" />
                </IconButton>
                <Typography variant="body1" sx={{ fontFamily: 'monospace', color: alpha(theme.palette.text.primary, 0.8), letterSpacing: -0.5 }}>
                  .cursa/results
                </Typography>
                <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 2 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InsertDriveFileIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>{fileName}</Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                 <Tooltip title="Распечатать">
                  <IconButton onClick={handlePrint} sx={{ color: 'text.secondary' }}>
                    <PrintIcon />
                  </IconButton>
                 </Tooltip>
                 <Button 
                  variant="outlined" 
                  color="primary" 
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={() => navigate('/')}
                 >
                   Новая проверка
                 </Button>
              </Box>
            </Box>
          </Container>
        </Box>

        <Container maxWidth="xl" sx={{ py: 4, flex: 1 }}>
          <Stack spacing={4}>
            {/* Top Dashboard Row */}
            <Grid container spacing={3} alignItems="stretch">
              
              {/* Score Card */}
              <Grid item xs={12} md={6}>
                <Paper className="glass-card" sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                  <Box className="glow-effect" sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '150%', height: '150%', background: `radial-gradient(circle, ${alpha(theme.palette[grade.color].main, 0.15)} 0%, transparent 70%)`, pointerEvents: 'none' }} />
                  <ScoreCircle score={grade.score} grade={grade} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center', maxWidth: 300 }}>
                    {grade.description}
                  </Typography>
                </Paper>
              </Grid>

              {/* Stats Column */}
              <Grid item xs={12} md={6}>
                <Stack spacing={3} sx={{ height: '100%' }}>
                  <Box sx={{ flex: 1 }}>
                    <StatCard 
                      title="Проблем" 
                      value={totalIssues} 
                      icon={<BugReportIcon />}
                      color={theme.palette.error.main}
                      delay={0.1}
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <StatCard 
                      title="Страниц" 
                      value={reportData?.structure?.pages_count || 0} 
                      icon={<MenuBookIcon />}
                      color={theme.palette.info.main}
                      delay={0.2}
                    />
                  </Box>
                </Stack>
              </Grid>
            </Grid>

            {/* Issues Feed & Actions - Full Width */}
            <Box>
              <Stack spacing={3}>
                
                {/* Auto Fix Promo */}
                {autoFixableCount > 0 && !correctionSuccess && (
                  <Paper sx={{ 
                    p: 3, 
                    borderRadius: 2, 
                    background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha('#050505', 0.8)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                    flexWrap: 'wrap'
                  }}>
                    <Box>
                      <Typography variant="h6" fontWeight={700} color="white">
                        Доступно авто-исправление
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Мы можем автоматически исправить {autoFixableCount} проблем в вашем документе.
                      </Typography>
                    </Box>
                    <Button 
                      variant="contained" 
                      color="success" 
                      onClick={handleCorrection}
                      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AutoFixHighIcon />}
                      disabled={loading}
                      sx={{ borderRadius: 2, px: 3, fontWeight: 700 }}
                    >
                      Исправить всё
                    </Button>
                  </Paper>
                )}

                {/* Success State */}
                <AnimatePresence>
                  {correctionSuccess && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                      <Paper sx={{ p: 3, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.1), border: `1px solid ${alpha(theme.palette.success.main, 0.2)}` }}>
                        <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                          <CheckCircleIcon color="success" fontSize="large" />
                          <Box>
                            <Typography variant="h6" fontWeight={700} color="white">Исправление завершено!</Typography>
                            <Typography variant="body2" color="text.secondary">Файл скачан автоматически. Вы можете скачать его снова или просмотреть изменения.</Typography>
                          </Box>
                        </Stack>
                        <Stack direction="row" spacing={2}>
                          <Button variant="outlined" color="success" startIcon={<DownloadIcon />} onClick={() => handleDownload(correctedFilePath)}>Скачать</Button>
                          <Button variant="text" color="success" startIcon={<DifferenceIcon />} onClick={() => navigate(`/preview?original=${encodeURIComponent(reportData.temp_path)}&corrected=${encodeURIComponent(correctedFilePath)}&filename=${encodeURIComponent(fileName)}`)}>Сравнить</Button>
                        </Stack>
                      </Paper>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Issues List Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="h6" fontWeight={700} color="white">
                    Журнал проблем
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    {['all', 'high', 'medium', 'low'].map((f) => (
                      <Chip 
                        key={f} 
                        label={f === 'all' ? 'Все' : getSeverityLabel(f)} 
                        clickable 
                        onClick={() => setFilterSeverity(f)}
                        color={filterSeverity === f ? (f === 'all' ? 'default' : f === 'high' ? 'error' : f === 'medium' ? 'warning' : 'info') : 'default'}
                        variant={filterSeverity === f ? 'filled' : 'outlined'}
                        sx={{ borderRadius: 2, height: 28, fontSize: '0.75rem', fontWeight: 600 }}
                      />
                    ))}
                  </Stack>
                </Box>

                {/* Issues List */}
                <Box>
                  {groupedIssuesList.length === 0 ? (
                    <Paper sx={{ p: 6, textAlign: 'center', bgcolor: 'transparent', border: '1px dashed rgba(255,255,255,0.1)' }}>
                      <CheckCircleIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
                      <Typography color="text.secondary">Проблем не найдено</Typography>
                    </Paper>
                  ) : (
                    groupedIssuesList.map((issue, idx) => (
                      <IssueItem key={`${issue.type}-${idx}`} issue={issue} index={idx} />
                    ))
                  )}
                </Box>
                
                {/* Manual Guides */}
                <ManualFixGuidesPanel issues={issues} />

              </Stack>
            </Box>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};

export default ReportPage;
