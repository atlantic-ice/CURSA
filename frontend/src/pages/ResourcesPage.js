import React from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Divider
} from '@mui/material';
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined';
import FAQSection from '../components/FAQSection';
import TemplatesSection from '../components/TemplatesSection';
import RelatedLinksCard from '../components/RelatedLinksCard';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SchoolIcon from '@mui/icons-material/School';
import { motion } from 'framer-motion';

const ResourcesPage = () => {
  // Данные для часто задаваемых вопросов
  const faqQuestions = [
    {
      question: "Какой шрифт должен использоваться в курсовой работе?",
      answer: "В курсовой работе должен использоваться шрифт Times New Roman размером 14 пт. Весь текст, включая заголовки, таблицы и подписи к рисункам, должен быть оформлен одним шрифтом, кроме специальных случаев (например, программный код)."
    },
    {
      question: "Какие должны быть поля страницы?",
      answer: "Поля страницы должны быть следующими: левое - 3 см (для подшивки), правое - 1,5 см, верхнее и нижнее - по 2 см. Эти требования относятся ко всем страницам документа, включая приложения."
    },
    {
      question: "Как правильно оформить заголовки?",
      answer: "Заголовки должны быть оформлены следующим образом: заголовки первого уровня (ВВЕДЕНИЕ, ГЛАВА 1, ЗАКЛЮЧЕНИЕ) - прописными буквами, полужирным шрифтом, выравнивание по центру; заголовки второго уровня (1.1, 1.2) - с абзацного отступа, полужирным шрифтом. Точка в конце заголовка не ставится."
    },
    {
      question: "Как нумеровать страницы в курсовой работе?",
      answer: "Нумерация страниц в курсовой работе должна быть сквозной (включая приложения), арабскими цифрами, в нижней части листа, по центру. Титульный лист включается в общую нумерацию, но номер на нем не ставится."
    },
    {
      question: "Как оформить библиографию?",
      answer: "Библиография (список использованных источников) оформляется в соответствии с ГОСТ 7.1-2003. Источники располагаются в алфавитном порядке по фамилии первого автора или названию. Каждый источник должен содержать полные выходные данные: автор, название, город, издательство, год, количество страниц."
    },
    {
      question: "Как правильно оформить таблицы и рисунки?",
      answer: "Таблицы и рисунки должны иметь сквозную нумерацию и названия. Название таблицы располагается над таблицей (например, 'Таблица 1 – Результаты исследования'). Название рисунка располагается под рисунком (например, 'Рисунок 1 – Структурная схема'). В тексте должны быть ссылки на все таблицы и рисунки."
    }
  ];

  // Данные для шаблонов документов
  const templateData = [
    {
      name: "Курсовая работа",
      description: "Шаблон курсовой работы с правильным форматированием, титульным листом и примерами оформления всех элементов",
      tags: ["Курсовая", "Общий шаблон"],
      size: "45 КБ",
      format: "DOCX",
      downloadUrl: "/templates/template_coursework.docx",
      filename: "Шаблон_курсовой_работы.docx"
    },
    {
      name: "Отчет по практике",
      description: "Шаблон отчета по учебной и производственной практике с примерами оформления дневника практики",
      tags: ["Практика", "Отчет"],
      size: "38 КБ",
      format: "DOCX",
      downloadUrl: "/templates/template_practice_report.docx",
      filename: "Шаблон_отчета_по_практике.docx"
    },
    {
      name: "Дипломная работа",
      description: "Шаблон выпускной квалификационной работы с примерами оформления всех структурных элементов",
      tags: ["ВКР", "Диплом"],
      size: "52 КБ",
      format: "DOCX",
      downloadUrl: "/templates/template_diploma.docx",
      filename: "Шаблон_дипломной_работы.docx"
    }
  ];

  // Связанные разделы
  const relatedLinks = [
    {
      title: 'Рекомендации по оформлению',
      description: 'Подробные требования и рекомендации к оформлению курсовых работ',
      path: '/guidelines',
      icon: <MenuBookIcon color="primary" />
    },
    {
      title: 'Примеры оформления',
      description: 'Наглядные примеры правильного и неправильного оформления',
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
        bgcolor: (theme) => theme.palette.mode === 'dark'
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
              <AutoStoriesOutlinedIcon sx={{ fontSize: { xs: 28, md: 38 } }} />
              Полезные ресурсы
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
              Шаблоны документов, ответы на часто задаваемые вопросы и другие полезные материалы для подготовки курсовой работы
            </Typography>
          </motion.div>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
        {/* WOW-анимированный блок шаблонов */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <TemplatesSection 
            templates={templateData} 
            sx={{ mb: 6 }}
          />
        </motion.div>

        <Divider sx={{ my: 6 }} />

        {/* WOW-анимированный FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <FAQSection 
            questions={faqQuestions} 
            sx={{ mb: 6 }}
          />
        </motion.div>

        {/* Связанные разделы */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Box sx={{ mb: 6 }}>
            <RelatedLinksCard 
              title="Связанные разделы"
              links={relatedLinks}
            />
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

export default ResourcesPage; 