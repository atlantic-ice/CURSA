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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  Divider,
  useTheme,
  alpha,
  CircularProgress,
  LinearProgress,
  Stack,
  Tooltip,
  Avatar,
  Slide
} from '@mui/material';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area
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
import AssessmentIcon from '@mui/icons-material/Assessment';
import VerifiedIcon from '@mui/icons-material/Verified';
import ArticleIcon from '@mui/icons-material/Article';
import InsightsIcon from '@mui/icons-material/Insights';
import FilterListIcon from '@mui/icons-material/FilterList';
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

// База API: в dev используем прямой доступ к бэкенду (5000), в prod — REACT_APP_API_BASE или прод-URL
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
    case 'high': return '#f43f5e'; // Rose 500
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
          bgcolor: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          borderRadius: 2,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
        }}
      >
        <Typography variant="caption" fontWeight={700} sx={{ mb: 0.5, display: 'block', color: 'text.secondary' }}>
          {label || payload[0].name}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: payload[0].payload.color || payload[0].color }} />
          <Typography variant="body2" fontWeight={700}>
            {payload[0].value}
          </Typography>
        </Box>
      </Paper>
    );
  }
  return null;
};

const TypewriterText = ({ text }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    setDisplayedText('');
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText((prev) => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 20); // Speed of typing
    return () => clearInterval(timer);
  }, [text]);

  return (
    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'text.secondary', lineHeight: 1.6 }}>
      {displayedText}
    </Typography>
  );
};

const AnimatedNumber = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const controls = { value: 0 };
    const updateValue = (latest) => setDisplayValue(Math.round(latest));
    
    let start = 0;
    const end = parseInt(value, 10);
    if (isNaN(end)) return;

    const duration = 1500;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out quart
      const ease = 1 - Math.pow(1 - progress, 4);
      
      const current = Math.floor(start + (end - start) * ease);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
    
  }, [value]);

  return <span>{displayValue}</span>;
};

const StatCard = ({ title, value, subtitle, icon, color, delay, isScore }) => {
  const theme = useTheme();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      style={{ height: '100%', width: '100%' }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 3,
          height: '100%',
          borderRadius: 2,
          background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          backdropFilter: 'blur(20px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: `0 12px 24px -10px ${alpha(color || theme.palette.primary.main, 0.3)}`,
            borderColor: alpha(color || theme.palette.primary.main, 0.4),
            '& .icon-bg': {
              transform: 'scale(1.2) rotate(10deg)',
              opacity: 0.2
            }
          }
        }}
      >
        {/* Background Icon Decoration */}
        <Box 
          className="icon-bg"
          sx={{ 
            position: 'absolute', 
            right: -20, 
            bottom: -20, 
            opacity: 0.1, 
            color: color || 'text.primary',
            transition: 'all 0.5s ease',
            zIndex: 0
          }}
        >
          {React.cloneElement(icon, { sx: { fontSize: 120 } })}
        </Box>

        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
              {title}
            </Typography>
            <Box sx={{ 
              p: 1, 
              borderRadius: '12px', 
              bgcolor: alpha(color || theme.palette.text.primary, 0.1),
              color: color || 'text.primary',
              display: 'flex'
            }}>
              {React.cloneElement(icon, { fontSize: 'small' })}
            </Box>
          </Box>
          
          <Typography variant="h3" fontWeight={800} sx={{ color: color || 'text.primary', mb: 0.5, letterSpacing: '-0.02em' }}>
            {isScore ? value : <AnimatedNumber value={value} />}
          </Typography>
          
          {subtitle && (
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
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

  const severityGradient = {
    high: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
    medium: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    low: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
  };

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 1.5,
        display: 'block',
        width: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        borderRadius: 3,
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
        border: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        backdropFilter: 'blur(10px)',
        '&:hover': {
          background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`,
          boxShadow: `0 8px 32px ${alpha(severityColor, 0.2)}, 0 0 0 1px ${alpha(severityColor, 0.1)}`,
          transform: 'translateY(-2px)',
          '& .severity-bar': {
            height: 56,
            boxShadow: `0 0 16px ${alpha(severityColor, 0.6)}`
          },
          '& .issue-icon': {
            transform: 'scale(1.1)',
            boxShadow: `0 4px 12px ${alpha(severityColor, 0.3)}`
          }
        }
      }}
    >
      <Box 
        onClick={() => setExpanded(!expanded)}
        sx={{ 
          p: 2.5, 
          display: 'flex', 
          alignItems: 'center', 
          cursor: 'pointer',
          gap: 2,
          userSelect: 'none'
        }}
      >
        {/* Severity Indicator - Animated Vertical Bar */}
        <Box 
          className="severity-bar"
          sx={{ 
            width: 4, 
            height: 44, 
            borderRadius: 4, 
            background: severityGradient[issue.severity] || severityColor,
            boxShadow: `0 0 12px ${alpha(severityColor, 0.4)}`,
            transition: 'all 0.3s ease',
            flexShrink: 0
          }} 
        />

        {/* Icon with gradient background */}
        <Box 
          className="issue-icon"
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: 44,
            height: 44,
            borderRadius: '14px',
            background: `linear-gradient(135deg, ${alpha(severityColor, 0.15)} 0%, ${alpha(severityColor, 0.05)} 100%)`,
            color: severityColor,
            transition: 'all 0.3s ease',
            flexShrink: 0,
            border: `1px solid ${alpha(severityColor, 0.1)}`
          }}
        >
          {issue.severity === 'high' && <ErrorIcon />}
          {issue.severity === 'medium' && <WarningIcon />}
          {issue.severity === 'low' && <InfoIcon />}
        </Box>
        
        {/* Content */}
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
            <Typography 
              variant="subtitle2" 
              fontWeight={700} 
              sx={{ 
                fontSize: '0.95rem',
                lineHeight: 1.3,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {issue.description}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            {/* Severity Badge */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5,
              px: 1,
              py: 0.25,
              borderRadius: 1.5,
              bgcolor: alpha(severityColor, 0.1),
              border: `1px solid ${alpha(severityColor, 0.15)}`
            }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: severityColor }} />
              <Typography variant="caption" fontWeight={600} sx={{ color: severityColor, fontSize: '0.7rem' }}>
                {getSeverityLabel(issue.severity)}
              </Typography>
            </Box>

            {/* Count Badge */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5,
              px: 1,
              py: 0.25,
              borderRadius: 1.5,
              bgcolor: alpha(theme.palette.text.primary, 0.05),
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
            }}>
              <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ fontSize: '0.7rem' }}>
                {issue.count} {issue.count === 1 ? 'место' : issue.count < 5 ? 'места' : 'мест'}
              </Typography>
            </Box>

            {/* Auto-fix Badge */}
            {issue.auto_fixable && (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                px: 1,
                py: 0.25,
                borderRadius: 1.5,
                bgcolor: alpha(theme.palette.success.main, 0.1),
                border: `1px solid ${alpha(theme.palette.success.main, 0.15)}`
              }}>
                <AutoFixHighIcon sx={{ fontSize: 12, color: theme.palette.success.main }} />
                <Typography variant="caption" fontWeight={600} sx={{ color: theme.palette.success.main, fontSize: '0.7rem' }}>
                  Авто
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Expand Icon with animation */}
        <IconButton 
          size="small" 
          sx={{ 
            color: 'text.secondary',
            bgcolor: alpha(theme.palette.text.primary, 0.03),
            transition: 'all 0.2s ease',
            '&:hover': { 
              bgcolor: alpha(theme.palette.text.primary, 0.08),
              transform: 'scale(1.1)'
            }
          }}
        >
          <Box sx={{ 
            display: 'flex',
            transition: 'transform 0.3s ease',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)'
          }}>
            <ExpandMoreIcon fontSize="small" />
          </Box>
        </IconButton>
      </Box>

      <Collapse in={expanded} timeout={300}>
        <Box sx={{ 
          px: 2.5, 
          pb: 2.5, 
          pt: 0,
          ml: '60px',
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.06)}`
        }}>
          <Box sx={{ pt: 2 }}>
            <Typography 
              variant="caption" 
              color="text.secondary" 
              fontWeight={700} 
              sx={{ 
                mb: 1.5, 
                display: 'flex', 
                alignItems: 'center',
                gap: 0.75,
                textTransform: 'uppercase', 
                fontSize: '0.65rem', 
                letterSpacing: 1,
                opacity: 0.7
              }}
            >
              <ListAltIcon sx={{ fontSize: 14 }} />
              Расположение в документе
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {issue.locations.slice(0, 20).map((loc, idx) => (
                <Chip 
                  key={idx} 
                  label={loc} 
                  size="small" 
                  sx={{ 
                    bgcolor: alpha(theme.palette.background.default, 0.6),
                    color: 'text.primary',
                    fontSize: '0.72rem',
                    fontWeight: 500,
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                    height: 26,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: alpha(severityColor, 0.1),
                      borderColor: alpha(severityColor, 0.2)
                    }
                  }} 
                />
              ))}
              {issue.locations.length > 20 && (
                <Chip 
                  label={`+${issue.locations.length - 20}`} 
                  size="small" 
                  sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                    height: 26
                  }} 
                />
              )}
            </Box>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};

// Компонент пошагового руководства по ручному исправлению
const ManualFixGuide = ({ guide, isOpen, onToggle }) => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  
  if (!guide) return null;
  
  return (
    <Paper
      elevation={0}
      sx={{
        mb: 2,
        borderRadius: 3,
        background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.05)} 0%, ${alpha(theme.palette.background.paper, 0.6)} 100%)`,
        border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`,
        overflow: 'hidden',
        transition: 'all 0.3s ease'
      }}
    >
      {/* Header */}
      <Box
        onClick={onToggle}
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          cursor: 'pointer',
          '&:hover': {
            bgcolor: alpha(theme.palette.info.main, 0.05)
          }
        }}
      >
        <Box
          sx={{
            p: 1,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.info.main, 0.1),
            color: theme.palette.info.main,
            display: 'flex'
          }}
        >
          <SchoolIcon />
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle2" fontWeight={700}>
            {guide.title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Пошаговая инструкция • {guide.steps.length} шагов
          </Typography>
        </Box>
        <IconButton size="small">
          {isOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      <Collapse in={isOpen}>
        <Box sx={{ px: 2, pb: 2 }}>
          {/* Video Section */}
          <Box
            sx={{
              mb: 2,
              borderRadius: 2,
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            {guide.youtubeId ? (
              // YouTube embed
              <Box sx={{ position: 'relative', paddingTop: '56.25%' }}>
                <iframe
                  src={`https://www.youtube.com/embed/${guide.youtubeId}`}
                  title={guide.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    borderRadius: 8
                  }}
                />
              </Box>
            ) : guide.videoPlaceholder && guide.videoPlaceholder.endsWith('.mp4') ? (
              // Local MP4 video
              <video
                src={guide.videoPlaceholder}
                controls
                style={{
                  width: '100%',
                  borderRadius: 8,
                  backgroundColor: alpha(theme.palette.background.default, 0.6)
                }}
                poster={guide.videoPoster || undefined}
              >
                Ваш браузер не поддерживает видео
              </video>
            ) : (
              // Placeholder when no video
              <Box
                sx={{
                  bgcolor: alpha(theme.palette.background.default, 0.6),
                  border: `2px dashed ${alpha(theme.palette.info.main, 0.2)}`,
                  borderRadius: 2,
                  p: 3,
                  textAlign: 'center',
                  minHeight: 180,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <PlayCircleOutlineIcon 
                  sx={{ 
                    fontSize: 64, 
                    color: alpha(theme.palette.info.main, 0.3),
                    mb: 1
                  }} 
                />
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  Видео-инструкция скоро появится
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.7, mt: 0.5 }}>
                  Пока следуйте пошаговой инструкции ниже
                </Typography>
              </Box>
            )}
          </Box>

          {/* Steps */}
          <Box sx={{ mb: 2 }}>
            <Typography 
              variant="caption" 
              color="text.secondary" 
              fontWeight={700}
              sx={{ 
                display: 'block', 
                mb: 1.5, 
                textTransform: 'uppercase', 
                letterSpacing: 1,
                fontSize: '0.65rem'
              }}
            >
              Пошаговая инструкция
            </Typography>
            
            {guide.steps.map((step, index) => (
              <Box
                key={index}
                onClick={() => setActiveStep(index)}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1.5,
                  p: 1.5,
                  mb: 1,
                  borderRadius: 2,
                  cursor: 'pointer',
                  bgcolor: activeStep === index 
                    ? alpha(theme.palette.info.main, 0.1) 
                    : 'transparent',
                  border: `1px solid ${activeStep === index 
                    ? alpha(theme.palette.info.main, 0.2) 
                    : 'transparent'}`,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.info.main, 0.05)
                  }
                }}
              >
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    bgcolor: activeStep === index 
                      ? theme.palette.info.main 
                      : alpha(theme.palette.text.primary, 0.1),
                    color: activeStep === index 
                      ? 'white' 
                      : 'text.secondary',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    flexShrink: 0,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {index + 1}
                </Box>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    lineHeight: 1.5,
                    fontWeight: activeStep === index ? 600 : 400,
                    color: activeStep === index ? 'text.primary' : 'text.secondary'
                  }}
                >
                  {step}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Tips */}
          {guide.tips && guide.tips.length > 0 && (
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.warning.main, 0.05),
                border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <InfoIcon sx={{ fontSize: 16, color: theme.palette.warning.main }} />
                <Typography variant="caption" fontWeight={700} color="warning.main">
                  Полезные советы
                </Typography>
              </Box>
              {guide.tips.map((tip, index) => (
                <Typography 
                  key={index} 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ display: 'block', mb: 0.5, pl: 3 }}
                >
                  • {tip}
                </Typography>
              ))}
            </Box>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};

// Панель руководств по ручным исправлениям
const ManualFixGuidesPanel = ({ issues }) => {
  const theme = useTheme();
  const [expandedGuide, setExpandedGuide] = useState(null);
  
  // Получаем уникальные руководства для неавтоисправляемых ошибок
  const manualIssueTypes = useMemo(() => {
    const types = new Set();
    issues
      .filter(issue => !issue.auto_fixable)
      .forEach(issue => types.add(issue.type));
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
  
  if (availableGuides.length === 0) {
    return null;
  }
  
  return (
    <Paper
      elevation={0}
      sx={{
        mb: 2,
        borderRadius: 3,
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.6)} 0%, ${alpha(theme.palette.background.paper, 0.3)} 100%)`,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        overflow: 'hidden',
        backdropFilter: 'blur(10px)'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          bgcolor: alpha(theme.palette.background.paper, 0.6),
          display: 'flex',
          alignItems: 'center',
          gap: 1.5
        }}
      >
        <Box
          sx={{
            p: 0.8,
            borderRadius: 1.5,
            bgcolor: alpha(theme.palette.warning.main, 0.1),
            color: theme.palette.warning.main
          }}
        >
          <BuildIcon fontSize="small" />
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>
            Руководства по ручным исправлениям
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {availableGuides.length} инструкци{availableGuides.length === 1 ? 'я' : availableGuides.length < 5 ? 'и' : 'й'} для ошибок, требующих ручного исправления
          </Typography>
        </Box>
      </Box>
      
      {/* Guides List */}
      <Box sx={{ p: 2 }}>
        {availableGuides.map((guide, index) => (
          <ManualFixGuide
            key={guide.type}
            guide={guide}
            isOpen={expandedGuide === index}
            onToggle={() => setExpandedGuide(expandedGuide === index ? null : index)}
          />
        ))}
      </Box>
    </Paper>
  );
};


const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const ReportPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const { reportData, fileName } = location.state || {};
  
  const [loading, setLoading] = useState(false);
  const [correctionSuccess, setCorrectionSuccess] = useState(false);
  const [correctedFilePath, setCorrectedFilePath] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all'); // 'all' | 'high' | 'medium' | 'low'

  // Инициализация исправленного файла из reportData (если был автоисправлен при загрузке)
  // + автоматическое скачивание исправленного документа
  useEffect(() => {
    if (reportData?.correction_success && reportData?.corrected_file_path) {
      setCorrectedFilePath(reportData.corrected_file_path);
      setCorrectionSuccess(true);
      
      // Автоматически скачиваем исправленный документ через скрытую ссылку
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
      // Небольшая задержка чтобы страница успела отрендериться
      const timer = setTimeout(autoDownload, 1000);
      return () => clearTimeout(timer);
    }
  }, [reportData]);

  // Redirect if no data
  useEffect(() => {
    if (!reportData) navigate('/');
  }, [reportData, navigate]);

  // Data processing
  const effectiveResults = useMemo(() => {
    if (!reportData) return {};
    return reportData.check_results || {};
  }, [reportData]);

  const issues = useMemo(() => effectiveResults?.issues || [], [effectiveResults]);
  
  // Информация о профиле проверки
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

  // Charts Data
  const severityData = [
    { name: 'Критические', value: highSeverityCount, color: '#f43f5e' },
    { name: 'Средние', value: mediumSeverityCount, color: '#f59e0b' },
    { name: 'Низкие', value: lowSeverityCount, color: '#3b82f6' },
  ].filter(d => d.value > 0);

  // Group by category for BarChart
  const categoryData = useMemo(() => {
    const cats = {};
    issues.forEach(i => {
      const cat = i.type.split('_')[0];
      cats[cat] = (cats[cat] || 0) + 1;
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, [issues]);

  // Handlers
  const handleCorrection = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/api/document/correct`, {
        file_path: reportData.temp_path,
        errors: issues.filter(issue => issue.auto_fixable),
        original_filename: fileName
      });

      if (response.data.success) {
        setCorrectedFilePath(response.data.corrected_file_path);
        setCorrectionSuccess(true);
      }
    } catch (error) {
      console.error('Correction error:', error);
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

  const handleDownloadReport = () => {
    if (!reportData?.report_path) return;
    window.location.href = `${API_BASE}/api/document/download-report?path=${encodeURIComponent(reportData.report_path)}`;
  };

  const handlePrint = () => {
    window.print();
  };

  if (!reportData) return null;

  return (
    <Box sx={{ 
      height: '100vh', 
      bgcolor: 'background.default',
      color: 'text.primary',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      '@media print': {
        height: 'auto',
        overflow: 'visible',
        bgcolor: 'white',
        color: 'black'
      }
    }}>
      <style>
        {`
          @media print {
            @page { size: A4; margin: 1.5cm; }
            .no-print { display: none !important; }
            .print-only { display: block !important; }
            body, html, #root { 
              background-color: white !important; 
              color: black !important; 
              height: auto !important; 
              overflow: visible !important; 
            }
            .MuiPaper-root { 
              background-color: white !important; 
              color: black !important; 
              border: 1px solid #ccc !important; 
              box-shadow: none !important; 
              break-inside: avoid;
            }
            .MuiTypography-root { color: black !important; }
            .MuiChip-root { border: 1px solid #999 !important; color: black !important; }
            .recharts-wrapper { filter: grayscale(100%) contrast(120%); }
            
            /* Force full width for issues list */
            .issues-grid-item { 
              width: 100% !important; 
              max-width: 100% !important; 
              flex-basis: 100% !important; 
            }
            
            /* Expand scrollable areas */
            .scroll-container {
              overflow: visible !important;
              height: auto !important;
              max-height: none !important;
            }

            /* Hide decorative backgrounds */
            .icon-bg { display: none !important; }
            
            /* Force stat cards to be in a 2x2 grid for print */
            .stat-card-grid > .MuiGrid-item {
              flex-basis: 50% !important;
              max-width: 50% !important;
            }
          }
        `}
      </style>

      {/* Print Header */}
      <Box className="print-only" sx={{ display: 'none', mb: 4, borderBottom: '2px solid black', pb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 2 }}>
          <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: '-0.03em' }}>CURSA REPORT</Typography>
          <Typography variant="h6" fontWeight={600} color="text.secondary">v2.0</Typography>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">ДОКУМЕНТ</Typography>
            <Typography variant="body1" fontWeight={600}>{fileName}</Typography>
          </Grid>
          <Grid item xs={6} sx={{ textAlign: 'right' }}>
            <Typography variant="body2" color="text.secondary">ДАТА ПРОВЕРКИ</Typography>
            <Typography variant="body1" fontWeight={600}>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">РЕЗУЛЬТАТ</Typography>
            <Typography variant="body1" fontWeight={600}>{grade.label} ({grade.score}/5)</Typography>
          </Grid>
          <Grid item xs={6} sx={{ textAlign: 'right' }}>
            <Typography variant="body2" color="text.secondary">ВСЕГО ПРОБЛЕМ</Typography>
            <Typography variant="body1" fontWeight={600}>{totalIssues}</Typography>
          </Grid>
        </Grid>
      </Box>

      {/* Header */}
      <Box className="no-print" sx={{ pt: 3, px: 0, zIndex: 10 }}>
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
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                  Отчет о проверке
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <InsertDriveFileIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>
                    {fileName}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Stack direction="row" spacing={1.5} alignItems="center">
              {/* Иконка печати */}
              <IconButton
                onClick={handlePrint}
                size="small"
                sx={{ 
                  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`, 
                  borderRadius: 2,
                  color: 'text.secondary',
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) }
                }}
              >
                <PrintIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Paper>
        </Container>
      </Box>

      {/* Main Content Area */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', '@media print': { overflow: 'visible' } }}>
        <Container maxWidth="xl" sx={{ height: '100%', display: 'flex', flexDirection: 'column', py: 3, '@media print': { height: 'auto', display: 'block' } }}>
          
          {/* Top Stats Row - Compact */}
          <Box 
            className="stat-card-grid" 
            sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
              gap: 2, 
              mb: 3,
              '@media print': {
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 2
              }
            }}
          >
            <Box sx={{ minHeight: 140 }}>
              <StatCard 
                title="Оценка" 
                value={`${grade.score}/5`} 
                subtitle={grade.label}
                icon={<VerifiedIcon />}
                color={theme.palette[grade.color].main}
                delay={0.1}
                isScore={true}
              />
            </Box>
            
            <Box sx={{ minHeight: 140 }}>
              <StatCard 
                title="Проблем" 
                value={totalIssues} 
                subtitle={`${autoFixableCount} авто-исправимых`}
                icon={<BugReportIcon />}
                color={theme.palette.error.main}
                delay={0.2}
              />
            </Box>

            <Box sx={{ minHeight: 140 }}>
              <StatCard 
                title="Объем" 
                value={reportData?.structure?.pages_count || "N/A"} 
                subtitle={`${reportData?.structure?.paragraphs_count || 0} параграфов`}
                icon={<MenuBookIcon />}
                color={theme.palette.info.main}
                delay={0.3}
              />
            </Box>

            {/* Профиль проверки */}
            <Box sx={{ minHeight: 140 }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.35 }}
                style={{ height: '100%', width: '100%' }}
              >
                <Paper sx={{ 
                  p: 2, 
                  height: '100%', 
                  width: '100%',
                  borderRadius: 2, 
                  bgcolor: alpha(theme.palette.background.paper, 0.4), 
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, 
                  display: 'flex', 
                  flexDirection: 'column',
                  backdropFilter: 'blur(10px)'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Box sx={{ 
                      p: 0.75, 
                      borderRadius: 1.5, 
                      bgcolor: alpha(theme.palette.success.main, 0.1),
                      display: 'flex'
                    }}>
                      <ShieldIcon sx={{ fontSize: 16, color: 'success.main' }} />
                    </Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                      Профиль проверки
                    </Typography>
                  </Box>
                  <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2, mb: 0.5 }}>
                    {profileInfo?.name || 'ГОСТ 7.32-2017'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {profileInfo?.category === 'university' ? 'Требования ВУЗа' : 
                     profileInfo?.category === 'gost' ? 'Стандарт ГОСТ' : 'Базовые правила'}
                  </Typography>
                  {profileInfo?.rules?.font && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 'auto' }}>
                      {profileInfo.rules.font.name} {profileInfo.rules.font.size}pt • {profileInfo.rules.line_spacing}x
                    </Typography>
                  )}
                </Paper>
              </motion.div>
            </Box>

            <Box sx={{ minHeight: 140 }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                style={{ height: '100%', width: '100%' }}
              >
                <Paper sx={{ 
                  p: 2, 
                  height: '100%', 
                  width: '100%',
                  borderRadius: 2, 
                  bgcolor: alpha(theme.palette.background.paper, 0.4), 
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, 
                  display: 'flex', 
                  alignItems: 'center',
                  backdropFilter: 'blur(10px)'
                }}>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', mb: 1.5, display: 'block', letterSpacing: 1 }}>
                      Серьезность
                    </Typography>
                    <Stack spacing={1}>
                      {severityData.map((d) => (
                        <Box key={d.name} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: d.color, boxShadow: `0 0 8px ${d.color}` }} />
                          <Typography variant="caption" sx={{ flexGrow: 1, fontWeight: 500 }}>{d.name}</Typography>
                          <Typography variant="caption" fontWeight={700} sx={{ bgcolor: alpha(d.color, 0.1), px: 1, borderRadius: 1, color: d.color }}>{d.value}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                  <Box sx={{ width: 120, height: 120, flexShrink: 0, position: 'relative' }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie 
                          data={severityData} 
                          innerRadius={35} 
                          outerRadius={45} 
                          paddingAngle={5} 
                          dataKey="value"
                          stroke="none"
                        >
                          {severityData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                        <RechartsTooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <Box sx={{ 
                      position: 'absolute', 
                      top: '50%', 
                      left: '50%', 
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center',
                      pointerEvents: 'none'
                    }}>
                      <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1 }}>{totalIssues}</Typography>
                    </Box>
                  </Box>
                </Paper>
              </motion.div>
            </Box>

            <Box sx={{ minHeight: 140 }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                style={{ height: '100%', width: '100%' }}
              >
                <Paper sx={{ 
                  p: 2, 
                  height: '100%', 
                  width: '100%',
                  borderRadius: 2, 
                  bgcolor: alpha(theme.palette.background.paper, 0.4), 
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  backdropFilter: 'blur(10px)'
                }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', mb: 1, display: 'block', letterSpacing: 1 }}>
                    Категории
                  </Typography>
                  <Box sx={{ height: 80, width: '100%' }}>
                    <ResponsiveContainer>
                      <BarChart data={categoryData}>
                        <Bar dataKey="value" fill={theme.palette.primary.main} radius={[4, 4, 4, 4]} barSize={20}>
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={alpha(theme.palette.primary.main, 0.6 + (index * 0.1))} />
                          ))}
                        </Bar>
                        <RechartsTooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </motion.div>
            </Box>
          </Box>

          {/* Split View Content */}
          <Grid container spacing={3} sx={{ flexGrow: 1, overflow: 'hidden', '@media print': { display: 'block', overflow: 'visible' } }}>
            {/* Left: Issues List */}
            <Grid item xs={12} md={8} className="issues-grid-item" sx={{ height: '100%', minWidth: 0, '@media print': { height: 'auto', display: 'block' } }}>
              <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', width: '100%' }}>
                {/* Header with filters */}
                <Paper 
                  elevation={0}
                  className="no-print"
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    mb: 2,
                    p: 2,
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.6)} 0%, ${alpha(theme.palette.background.paper, 0.3)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                      p: 1,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                      display: 'flex'
                    }}>
                      <FormatListBulletedIcon fontSize="small" />
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={800} sx={{ letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                        Детализация
                      </Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={500}>
                        {groupedIssuesList.length} {groupedIssuesList.length === 1 ? 'проблема' : groupedIssuesList.length < 5 ? 'проблемы' : 'проблем'} найдено
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 0.75 }}>
                    {[
                      { value: 'all', label: 'Все', color: theme.palette.text.primary },
                      { value: 'high', label: 'Крит.', color: '#f43f5e' },
                      { value: 'medium', label: 'Сред.', color: '#f59e0b' },
                      { value: 'low', label: 'Низк.', color: '#3b82f6' }
                    ].map((filter) => (
                      <Button
                        key={filter.value}
                        size="small"
                        onClick={() => setFilterSeverity(filter.value)}
                        sx={{
                          minWidth: 'auto',
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 2,
                          textTransform: 'none',
                          fontSize: '0.8rem',
                          fontWeight: filterSeverity === filter.value ? 700 : 500,
                          color: filterSeverity === filter.value ? filter.color : 'text.secondary',
                          bgcolor: filterSeverity === filter.value 
                            ? alpha(filter.color, 0.1) 
                            : 'transparent',
                          border: `1px solid ${filterSeverity === filter.value 
                            ? alpha(filter.color, 0.2) 
                            : 'transparent'}`,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: alpha(filter.color, 0.08),
                            borderColor: alpha(filter.color, 0.15)
                          }
                        }}
                      >
                        {filter.value !== 'all' && (
                          <Box 
                            sx={{ 
                              width: 6, 
                              height: 6, 
                              borderRadius: '50%', 
                              bgcolor: filter.color,
                              mr: 0.75,
                              boxShadow: filterSeverity === filter.value ? `0 0 6px ${filter.color}` : 'none'
                            }} 
                          />
                        )}
                        {filter.label}
                      </Button>
                    ))}
                  </Box>
                </Paper>
                
                <Box className="scroll-container" sx={{ 
                  flexGrow: 1, 
                  overflowY: 'scroll', 
                  overflowX: 'visible',
                  pr: 2,
                  pl: 1,
                  mr: -1,
                  pb: 2,
                  width: 'calc(100% + 8px)',
                  boxSizing: 'border-box',
                  '&::-webkit-scrollbar': { width: 6 },
                  '&::-webkit-scrollbar-track': { background: 'transparent' },
                  '&::-webkit-scrollbar-thumb': { background: alpha(theme.palette.text.secondary, 0.2), borderRadius: 3 },
                  '@media print': { overflow: 'visible', height: 'auto', pr: 0, pl: 0, mr: 0, width: '100%' }
                }}>
                  <Box sx={{ 
                    display: 'grid',
                    gridTemplateColumns: '1fr',
                    gap: 0,
                    width: '100%',
                    py: 0.5
                  }}>
                    {groupedIssuesList.length === 0 ? (
                      <Paper 
                        elevation={0}
                        sx={{ 
                          p: 6, 
                          textAlign: 'center', 
                          borderRadius: 4, 
                          background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.05)} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
                          border: `2px dashed ${alpha(theme.palette.success.main, 0.2)}`,
                          width: '100%',
                          backdropFilter: 'blur(10px)'
                        }}
                      >
                        <Box sx={{ 
                          display: 'inline-flex',
                          p: 2,
                          borderRadius: '50%',
                          bgcolor: alpha(theme.palette.success.main, 0.1),
                          mb: 2
                        }}>
                          <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main' }} />
                        </Box>
                        <Typography variant="h6" fontWeight={800} gutterBottom sx={{ letterSpacing: '-0.02em' }}>
                          {filterSeverity === 'all' ? 'Отлично! Проблем нет' : 'Нет проблем данного типа'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300, mx: 'auto' }}>
                          {filterSeverity === 'all' 
                            ? 'Документ полностью соответствует стандартам оформления.' 
                            : 'Попробуйте выбрать другой фильтр для просмотра всех найденных проблем.'}
                        </Typography>
                      </Paper>
                    ) : (
                      groupedIssuesList.map((issue, idx) => (
                        <IssueItem key={`${issue.type}-${issue.description}`} issue={issue} />
                      ))
                    )}
                  </Box>
                </Box>
              </Box>
            </Grid>

            {/* Right: AI & Actions */}
            <Grid item xs={12} md={4} className="no-print" sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Success Card with Comparison Stats */}
              <AnimatePresence>
                {correctionSuccess && (
                  <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <Paper sx={{ 
                      p: 3, 
                      borderRadius: 3, 
                      bgcolor: alpha(theme.palette.success.main, 0.08), 
                      border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      {/* Background decoration */}
                      <Box sx={{ 
                        position: 'absolute', 
                        top: -20, 
                        right: -20, 
                        width: 100, 
                        height: 100, 
                        borderRadius: '50%', 
                        bgcolor: alpha(theme.palette.success.main, 0.1) 
                      }} />
                      
                      <Box sx={{ position: 'relative', zIndex: 1 }}>
                        {/* Header */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                          <Box sx={{ 
                            p: 1.5, 
                            borderRadius: '50%', 
                            bgcolor: theme.palette.success.main, 
                            color: 'white',
                            boxShadow: `0 4px 14px ${alpha(theme.palette.success.main, 0.4)}`
                          }}>
                            <CheckCircleIcon />
                          </Box>
                          <Box>
                            <Typography variant="h6" fontWeight={800} color="success.main">
                              Документ исправлен!
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Файл скачивается автоматически
                            </Typography>
                          </Box>
                        </Box>
                        
                        {/* Comparison Stats */}
                        {reportData?.corrected_check_results && (
                          <Box sx={{ mt: 2 }}>
                            <Divider sx={{ mb: 2, borderColor: alpha(theme.palette.success.main, 0.2) }} />
                            
                            {/* Before/After comparison */}
                            <Grid container spacing={2}>
                              <Grid item xs={6}>
                                <Box sx={{ 
                                  p: 2, 
                                  borderRadius: 2, 
                                  bgcolor: alpha(theme.palette.error.main, 0.08),
                                  border: `1px solid ${alpha(theme.palette.error.main, 0.15)}`,
                                  textAlign: 'center'
                                }}>
                                  <Typography variant="caption" color="error.main" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    До
                                  </Typography>
                                  <Typography variant="h4" fontWeight={800} color="error.main">
                                    {reportData.check_results?.total_issues_count || 0}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">ошибок</Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={6}>
                                <Box sx={{ 
                                  p: 2, 
                                  borderRadius: 2, 
                                  bgcolor: alpha(theme.palette.success.main, 0.08),
                                  border: `1px solid ${alpha(theme.palette.success.main, 0.15)}`,
                                  textAlign: 'center'
                                }}>
                                  <Typography variant="caption" color="success.main" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    После
                                  </Typography>
                                  <Typography variant="h4" fontWeight={800} color="success.main">
                                    {reportData.corrected_check_results?.total_issues_count || 0}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">ошибок</Typography>
                                </Box>
                              </Grid>
                            </Grid>
                            
                            {/* Improvement indicator */}
                            {(() => {
                              const before = reportData.check_results?.total_issues_count || 0;
                              const after = reportData.corrected_check_results?.total_issues_count || 0;
                              const fixed = before - after;
                              const percentFixed = before > 0 ? Math.round((fixed / before) * 100) : 0;
                              
                              if (fixed > 0) {
                                return (
                                  <Box sx={{ 
                                    mt: 2, 
                                    p: 2, 
                                    borderRadius: 2, 
                                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                                    border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2
                                  }}>
                                    <Box sx={{ 
                                      p: 1, 
                                      borderRadius: '50%', 
                                      bgcolor: alpha(theme.palette.primary.main, 0.15) 
                                    }}>
                                      <AutoFixHighIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                                    </Box>
                                    <Box sx={{ flexGrow: 1 }}>
                                      <Typography variant="body2" fontWeight={700}>
                                        Исправлено {fixed} {fixed === 1 ? 'ошибка' : fixed < 5 ? 'ошибки' : 'ошибок'}
                                      </Typography>
                                      <LinearProgress 
                                        variant="determinate" 
                                        value={percentFixed} 
                                        sx={{ 
                                          mt: 1, 
                                          height: 6, 
                                          borderRadius: 3,
                                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                                          '& .MuiLinearProgress-bar': {
                                            bgcolor: 'primary.main',
                                            borderRadius: 3
                                          }
                                        }} 
                                      />
                                    </Box>
                                    <Typography variant="h6" fontWeight={800} color="primary.main">
                                      {percentFixed}%
                                    </Typography>
                                  </Box>
                                );
                              }
                              return null;
                            })()}
                          </Box>
                        )}
                        
                        {/* Download button */}
                        <Button
                          fullWidth
                          variant="contained"
                          color="success"
                          startIcon={<DownloadIcon />}
                          onClick={() => handleDownload(correctedFilePath)}
                          sx={{ 
                            mt: 2, 
                            py: 1.5, 
                            borderRadius: 2,
                            fontWeight: 700,
                            textTransform: 'none',
                            boxShadow: `0 4px 14px ${alpha(theme.palette.success.main, 0.3)}`,
                            '&:hover': {
                              boxShadow: `0 6px 20px ${alpha(theme.palette.success.main, 0.4)}`
                            }
                          }}
                        >
                          Скачать исправленный файл
                        </Button>

                        {/* View Changes button */}
                        <Button
                          fullWidth
                          variant="outlined"
                          color="primary"
                          startIcon={<DifferenceIcon />}
                          onClick={() => navigate(`/preview?original=${encodeURIComponent(reportData.temp_path)}&corrected=${encodeURIComponent(correctedFilePath)}&filename=${encodeURIComponent(fileName)}`)}
                          sx={{ 
                            mt: 1, 
                            py: 1.5, 
                            borderRadius: 2,
                            fontWeight: 700,
                            textTransform: 'none',
                          }}
                        >
                          Просмотреть изменения
                        </Button>
                      </Box>
                    </Paper>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Manual Fix Guides Panel - показываем если есть неавтоисправляемые ошибки */}
              {issues.filter(i => !i.auto_fixable).length > 0 && (
                <ManualFixGuidesPanel issues={issues} />
              )}
            </Grid>
          </Grid>

        </Container>
      </Box>
    </Box>
  );
};

export default ReportPage;
