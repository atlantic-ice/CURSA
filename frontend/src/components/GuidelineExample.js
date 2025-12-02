import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Paper,
  Typography,
  Grid,
  useTheme
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

/**
 * Компонент для отображения примеров правильного и неправильного оформления
 * 
 * @param {Object} props
 * @param {string} props.title - Заголовок примера
 * @param {string} props.description - Описание правила оформления
 * @param {string} props.correctExample - Текст правильного примера
 * @param {string} props.incorrectExample - Текст неправильного примера
 * @param {JSX.Element} [props.correctImage] - Изображение правильного примера (необязательно)
 * @param {JSX.Element} [props.incorrectImage] - Изображение неправильного примера (необязательно)
 * @param {string} [props.correctExplanation] - Пояснение к правильному примеру (необязательно)
 * @param {string} [props.incorrectExplanation] - Пояснение к неправильному примеру (необязательно)
 * @param {Object} [props.incorrectFormatting] - Форматирование для неправильного примера (шрифт, размер, выравнивание)
 * @param {Object} [props.correctFormatting] - Форматирование для правильного примера (шрифт, размер, выравнивание)
 * @param {Object} [props.sx] - Дополнительные стили компонента
 */
const GuidelineExample = ({
  title,
  description,
  correctExample,
  incorrectExample,
  correctImage,
  incorrectImage,
  correctExplanation,
  incorrectExplanation,
  incorrectFormatting = {},
  correctFormatting = {},
  sx = {}
}) => {
  const theme = useTheme();
  
  // Форматирование по умолчанию
  const defaultIncorrectFormatting = {
    fontFamily: "'Arial', sans-serif",
    fontSize: '12pt',
    textAlign: 'left',
    lineHeight: 1.0
  };
  
  const defaultCorrectFormatting = {
    fontFamily: "'Times New Roman', serif",
    fontSize: '14pt',
    textAlign: 'justify',
    lineHeight: 1.5
  };
  
  // Применяем пользовательское форматирование, если оно задано
  const appliedIncorrectFormatting = { ...defaultIncorrectFormatting, ...incorrectFormatting };
  const appliedCorrectFormatting = { ...defaultCorrectFormatting, ...correctFormatting };
  
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        mb: 3,
        ...sx
      }}
    >
      {/* Заголовок */}
      <Box sx={{ 
        px: 3, 
        py: 2, 
        bgcolor: 'background.default',
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Typography variant="subtitle1" fontWeight={600}>
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {description}
          </Typography>
        )}
      </Box>
      
      {/* Примеры */}
      <Grid container>
        {/* Неправильный пример */}
        <Grid item xs={12} md={6} sx={{ 
          borderRight: { md: '1px solid' }, 
          borderBottom: { xs: '1px solid', md: 'none' },
          borderColor: 'divider' 
        }}>
          <Box sx={{ 
            p: 3,
            height: '100%',
            position: 'relative',
            bgcolor: theme.palette.mode === 'light' ? 'rgba(244, 67, 54, 0.03)' : 'rgba(244, 67, 54, 0.1)',
          }}>
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              mb: 2 
            }}>
              <ErrorOutlineIcon color="error" sx={{ mr: 1 }} />
              <Typography variant="body2" fontWeight={500}>
                Неправильно
              </Typography>
            </Box>
            
            {/* Текстовый пример */}
            <Box 
              sx={{ 
                p: 2, 
                borderRadius: 1, 
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: theme.palette.mode === 'light' ? 'rgba(244, 67, 54, 0.3)' : 'rgba(244, 67, 54, 0.5)',
                mb: incorrectExplanation ? 2 : 0,
                overflow: 'auto',
                maxHeight: 200,
                ...appliedIncorrectFormatting
              }}
            >
              {incorrectExample}
            </Box>
            
            {/* Изображение примера если есть */}
            {incorrectImage && (
              <Box sx={{ mt: 2, mb: incorrectExplanation ? 2 : 0 }}>
                {incorrectImage}
              </Box>
            )}
            
            {/* Пояснение если есть */}
            {incorrectExplanation && (
              <Typography variant="body2" color="error" sx={{ mt: 1, fontSize: '0.8rem' }}>
                {incorrectExplanation}
              </Typography>
            )}
          </Box>
        </Grid>
        
        {/* Правильный пример */}
        <Grid item xs={12} md={6}>
          <Box sx={{ 
            p: 3,
            height: '100%',
            position: 'relative',
            bgcolor: theme.palette.mode === 'light' ? 'rgba(76, 175, 80, 0.03)' : 'rgba(76, 175, 80, 0.1)'
          }}>
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              mb: 2 
            }}>
              <CheckCircleOutlineIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="body2" fontWeight={500}>
                Правильно
              </Typography>
            </Box>
            
            {/* Текстовый пример */}
            <Box 
              sx={{ 
                p: 2, 
                borderRadius: 1, 
                bgcolor: 'background.paper', 
                border: '1px solid',
                borderColor: theme.palette.mode === 'light' ? 'rgba(76, 175, 80, 0.3)' : 'rgba(76, 175, 80, 0.5)',
                mb: correctExplanation ? 2 : 0,
                overflow: 'auto',
                maxHeight: 200,
                ...appliedCorrectFormatting
              }}
            >
              {correctExample}
            </Box>
            
            {/* Изображение примера если есть */}
            {correctImage && (
              <Box sx={{ mt: 2, mb: correctExplanation ? 2 : 0 }}>
                {correctImage}
              </Box>
            )}
            
            {/* Пояснение если есть */}
            {correctExplanation && (
              <Typography variant="body2" color="success.main" sx={{ mt: 1, fontSize: '0.8rem' }}>
                {correctExplanation}
              </Typography>
            )}
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

GuidelineExample.propTypes = {
  /** Заголовок примера */
  title: PropTypes.string.isRequired,
  /** Описание правила оформления */
  description: PropTypes.string.isRequired,
  /** Текст правильного примера */
  correctExample: PropTypes.string.isRequired,
  /** Текст неправильного примера */
  incorrectExample: PropTypes.string.isRequired,
  /** Изображение правильного примера */
  correctImage: PropTypes.element,
  /** Изображение неправильного примера */
  incorrectImage: PropTypes.element,
  /** Пояснение к правильному примеру */
  correctExplanation: PropTypes.string,
  /** Пояснение к неправильному примеру */
  incorrectExplanation: PropTypes.string,
  /** Форматирование для неправильного примера */
  incorrectFormatting: PropTypes.object,
  /** Форматирование для правильного примера */
  correctFormatting: PropTypes.object,
  /** Дополнительные стили компонента */
  sx: PropTypes.object,
};

GuidelineExample.defaultProps = {
  correctImage: null,
  incorrectImage: null,
  correctExplanation: '',
  incorrectExplanation: '',
  incorrectFormatting: {},
  correctFormatting: {},
  sx: {},
};

export default GuidelineExample; 