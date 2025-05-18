import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  Alert,
  Paper,
  Button
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ListAltIcon from '@mui/icons-material/ListAlt';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

const StructureAnalysisCard = ({ structureIssues }) => {
  // Проверяем, есть ли проблемы со структурой
  const hasIssues = structureIssues && structureIssues.length > 0;
  
  // Список обязательных разделов курсовой работы
  const requiredSections = [
    { name: 'Титульный лист', description: 'Содержит информацию об учебном заведении, названии работы, авторе и руководителе' },
    { name: 'Содержание', description: 'Оглавление с указанием страниц' },
    { name: 'Введение', description: 'Включает цель, задачи, актуальность работы' },
    { name: 'Основная часть', description: 'Теоретическая и практическая части работы' },
    { name: 'Заключение', description: 'Выводы по результатам работы' },
    { name: 'Список литературы', description: 'Перечень использованных источников' }
  ];
  
  // Группируем проблемы по типу
  const missingSections = structureIssues?.filter(issue => issue.type === 'missing_section') || [];
  const orderIssues = structureIssues?.filter(issue => issue.type === 'section_order') || [];
  
  return (
    <Card elevation={0} sx={{ mb: 4, border: '1px solid', borderColor: 'divider', borderRadius: 2, width: '100%' }}>
      <CardContent sx={{ pb: 2, width: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, width: '100%' }}>
          <ListAltIcon sx={{ mr: 1 }} color="primary" />
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600, flexGrow: 1 }}>
            Структура документа
          </Typography>
          
          {hasIssues ? (
            <Chip 
              size="small"
              label={`${structureIssues.length} проблем`}
              color="warning"
            />
          ) : (
            <Chip 
              size="small"
              label="Соответствует"
              color="success"
            />
          )}
        </Box>
        
        {hasIssues ? (
          <Box sx={{ width: '100%' }}>
            <Typography variant="body2" color="text.secondary" paragraph>
              В структуре вашего документа обнаружены несоответствия требованиям. Рекомендуется исправить следующие проблемы:
            </Typography>
            
            {missingSections.length > 0 && (
              <Paper 
                variant="outlined" 
                sx={{ p: 2, mb: 2, bgcolor: 'error.light', borderColor: 'error.main', borderRadius: 1, width: '100%' }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'error.dark', mb: 1 }}>
                  Отсутствующие разделы:
                </Typography>
                <List dense disablePadding sx={{ width: '100%' }}>
                  {missingSections.map((issue, index) => (
                    <ListItem key={index} sx={{ py: 0.5, width: '100%' }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <ErrorOutlineIcon fontSize="small" color="error" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={issue.description} 
                        primaryTypographyProps={{ variant: 'body2' }}
                        sx={{ width: '100%' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
            
            {orderIssues.length > 0 && (
              <Paper 
                variant="outlined" 
                sx={{ p: 2, mb: 2, bgcolor: 'warning.light', borderColor: 'warning.main', borderRadius: 1, width: '100%' }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'warning.dark', mb: 1 }}>
                  Проблемы с порядком разделов:
                </Typography>
                <List dense disablePadding sx={{ width: '100%' }}>
                  {orderIssues.map((issue, index) => (
                    <ListItem key={index} sx={{ py: 0.5, width: '100%' }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <WarningAmberIcon fontSize="small" color="warning" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={issue.description} 
                        primaryTypographyProps={{ variant: 'body2' }}
                        sx={{ width: '100%' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
            
            <Alert severity="info" sx={{ mt: 2, width: '100%' }}>
              <Typography variant="body2">
                Правильная структура документа обеспечивает логичность изложения и соответствие требованиям учебного заведения.
              </Typography>
            </Alert>
          </Box>
        ) : (
          <Box sx={{ width: '100%' }}>
            <Alert severity="success" sx={{ mb: 2, width: '100%' }}>
              Структура документа соответствует основным требованиям.
            </Alert>
            
            <Typography variant="body2" paragraph>
              Ваш документ содержит все обязательные разделы в правильном порядке.
            </Typography>
          </Box>
        )}
        
        <Divider sx={{ my: 2, width: '100%' }} />
        
        <Box sx={{ width: '100%' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center' }}>
            <HelpOutlineIcon fontSize="small" sx={{ mr: 1 }} />
            Справка: Обязательные разделы курсовой работы
          </Typography>
          
          <List dense sx={{ bgcolor: 'background.paper', borderRadius: 1, width: '100%' }}>
            {requiredSections.map((section, index) => (
              <ListItem key={index} sx={{ py: 0.5, width: '100%' }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <CheckCircleOutlineIcon fontSize="small" color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary={section.name}
                  secondary={section.description}
                  primaryTypographyProps={{ fontWeight: 500 }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                  sx={{ width: '100%' }}
                />
              </ListItem>
            ))}
          </List>
          
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-start' }}>
            <Button 
              variant="text" 
              size="small" 
              sx={{ mt: 1 }} 
              component="a" 
              href="/guidelines"
            >
              Подробнее о требованиях
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StructureAnalysisCard; 