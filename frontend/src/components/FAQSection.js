import React from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Container
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

/**
 * Компонент для отображения секции часто задаваемых вопросов
 * 
 * @param {Object} props
 * @param {Array<Object>} props.questions - Массив объектов с вопросами и ответами
 * @param {string} props.title - Заголовок секции
 * @param {Object} [props.sx] - Дополнительные стили компонента
 */
const FAQSection = ({ questions = [], title = "Часто задаваемые вопросы", sx = {} }) => {
  return (
    <Box sx={{ ...sx }}>
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography 
          variant="h5" 
          component="h2" 
          sx={{ 
            mb: 1.5, 
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
          }}
        >
          <HelpOutlineIcon />
          {title}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto' }}>
          Ответы на самые распространенные вопросы о нормоконтроле и оформлении курсовых работ
        </Typography>
      </Box>

      <Paper 
        elevation={0} 
        sx={{ 
          borderRadius: 2, 
          border: '1px solid', 
          borderColor: 'divider',
          overflow: 'hidden'
        }}
      >
        {questions.map((question, index) => (
          <Accordion 
            key={index}
            elevation={0}
            disableGutters
            defaultExpanded={index === 0}
            sx={{ 
              '&:not(:last-child)': { 
                borderBottom: '1px solid', 
                borderColor: 'divider' 
              },
              '&:before': {
                display: 'none',
              },
            }}
          >
            <AccordionSummary 
              expandIcon={<ExpandMoreIcon />}
              sx={{ 
                px: 3,
                '&.Mui-expanded': {
                  bgcolor: 'background.default',
                }
              }}
            >
              <Typography variant="subtitle1" fontWeight={500}>
                {question.question}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 3, pb: 3 }}>
              <Typography variant="body1">
                {question.answer}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Paper>
    </Box>
  );
};

export default FAQSection; 