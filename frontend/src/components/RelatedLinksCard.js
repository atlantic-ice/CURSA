import React from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  ListItemButton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

/**
 * Компонент карточки связанных ссылок для навигации между разделами
 * 
 * @param {Object} props
 * @param {string} props.title - Заголовок карточки
 * @param {Array<Object>} props.links - Массив объектов с данными о ссылках
 * @param {Object} [props.sx] - Дополнительные стили компонента
 */
const RelatedLinksCard = ({ title, links, sx = {} }) => {
  const navigate = useNavigate();

  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        ...sx
      }}
    >
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle1" fontWeight={600}>
          {title}
        </Typography>
      </Box>
      
      <List disablePadding>
        {links.map((link, index) => (
          <React.Fragment key={index}>
            {index > 0 && <Box sx={{ mx: 2 }}><hr style={{ border: 'none', borderTop: '1px solid', opacity: 0.1 }} /></Box>}
            <ListItem disablePadding>
              <ListItemButton 
                onClick={() => navigate(link.path)}
                sx={{ py: 1.5, px: 2 }}
              >
                {link.icon && (
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {link.icon}
                  </ListItemIcon>
                )}
                <ListItemText 
                  primary={link.title} 
                  secondary={link.description} 
                  primaryTypographyProps={{ fontWeight: 500 }}
                />
                <ArrowForwardIcon color="action" fontSize="small" />
              </ListItemButton>
            </ListItem>
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};

export default RelatedLinksCard; 