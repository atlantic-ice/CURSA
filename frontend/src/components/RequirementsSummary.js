import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Grid, 
  Divider,
  Button,
  Tooltip,
  Zoom,
  IconButton,
  Popover
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

/**
 * Компонент для отображения краткой сводки по основным требованиям к оформлению
 * с интерактивными подсказками
 * 
 * @param {Object} props
 * @param {Object} [props.sx] - Дополнительные стили компонента
 */
const RequirementsSummary = ({ sx = {} }) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [popoverContent, setPopoverContent] = useState('');
  
  const handleInfoClick = (event, content) => {
    setAnchorEl(event.currentTarget);
    setPopoverContent(content);
  };

  const handleInfoClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  
  // Требования с дополнительной информацией
  const requirements = [
    {
      name: "Times New Roman, 14 пт", 
      details: "Шрифт должен быть Times New Roman, размер 14 пт для всего основного текста. Не допускается использование других шрифтов, кроме специальных случаев (например, для кода)."
    },
    {
      name: "Межстрочный интервал 1.5", 
      details: "Межстрочный интервал должен быть 1,5 строки для всего текста, включая заголовки. Для таблиц и сносок допускается одинарный интервал."
    },
    {
      name: "Выравнивание по ширине", 
      details: "Текст должен быть выровнен по ширине страницы. Не допускается выравнивание влево или вправо для основного текста."
    },
    {
      name: "Отступ первой строки 1.25 см", 
      details: "Абзацный отступ первой строки должен составлять 1,25 см для всех абзацев основного текста. Заголовки могут не иметь отступа."
    },
    {
      name: "Поля: левое 3 см, остальные 2 см", 
      details: "Размеры полей: левое — 3 см (для подшивки), правое — 1,5 см, верхнее и нижнее — по 2 см. Поля должны быть одинаковыми для всех страниц."
    },
    {
      name: "Нумерация страниц внизу по центру", 
      details: "Страницы должны быть пронумерованы арабскими цифрами внизу по центру. Титульный лист входит в общую нумерацию, но номер на нем не ставится."
    }
  ];
  
  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        ...sx
      }}
    >
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle1" fontWeight={600}>
          Основные требования к оформлению
        </Typography>
      </Box>
      
      <Box sx={{ p: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <List dense disablePadding>
              {requirements.slice(0, 2).map((req, index) => (
                <ListItem 
                  key={index} 
                  sx={{ py: 0.5 }}
                  secondaryAction={
                    <IconButton 
                      edge="end" 
                      size="small" 
                      onClick={(e) => handleInfoClick(e, req.details)}
                      sx={{ mr: -1 }}
                    >
                      <InfoOutlinedIcon fontSize="small" color="action" />
                    </IconButton>
                  }
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CheckCircleOutlineIcon fontSize="small" color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={req.name} 
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <List dense disablePadding>
              {requirements.slice(2, 4).map((req, index) => (
                <ListItem 
                  key={index} 
                  sx={{ py: 0.5 }}
                  secondaryAction={
                    <IconButton 
                      edge="end" 
                      size="small" 
                      onClick={(e) => handleInfoClick(e, req.details)}
                      sx={{ mr: -1 }}
                    >
                      <InfoOutlinedIcon fontSize="small" color="action" />
                    </IconButton>
                  }
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CheckCircleOutlineIcon fontSize="small" color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={req.name} 
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <List dense disablePadding>
              {requirements.slice(4, 6).map((req, index) => (
                <ListItem 
                  key={index} 
                  sx={{ py: 0.5 }}
                  secondaryAction={
                    <IconButton 
                      edge="end" 
                      size="small" 
                      onClick={(e) => handleInfoClick(e, req.details)}
                      sx={{ mr: -1 }}
                    >
                      <InfoOutlinedIcon fontSize="small" color="action" />
                    </IconButton>
                  }
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CheckCircleOutlineIcon fontSize="small" color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={req.name} 
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 1.5 }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            variant="text" 
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate('/guidelines')}
            size="small"
          >
            Подробные требования
          </Button>
          <Button 
            variant="text" 
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate('/examples')}
            size="small"
            sx={{ ml: 2 }}
          >
            Примеры оформления
          </Button>
        </Box>
      </Box>
      
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleInfoClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        sx={{
          '& .MuiPopover-paper': {
            p: 2,
            maxWidth: 300,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }
        }}
      >
        <Typography variant="body2">
          {popoverContent}
        </Typography>
      </Popover>
    </Paper>
  );
};

export default RequirementsSummary; 