import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import ErrorIcon from "@mui/icons-material/Error";
import InfoIcon from "@mui/icons-material/Info";
import NotificationsIcon from "@mui/icons-material/Notifications";
import WarningIcon from "@mui/icons-material/Warning";
import {
  Badge,
  Box,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Popover,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useCallback, useEffect, useState } from "react";

import { getApiErrorMessage, notificationsApi } from "../api/client";

const NotificationsPanel = ({ onNotificationRead }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Получение уведомлений
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await notificationsApi.list(10);
      if (response.success) {
        setNotifications(response.notifications || []);
        setUnreadCount(response.unread_count || 0);
        setTotalCount(response.total_count || 0);
      }
    } catch (error) {
      console.error("Ошибка при получении уведомлений:", getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  // Загрузка уведомлений при монтировании компонента
  useEffect(() => {
    void fetchNotifications();
    // Устанавливаем интервал для периодического обновления уведомлений
    const interval = setInterval(() => {
      void fetchNotifications();
    }, 60000); // Обновление каждую минуту
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Отметка уведомления как прочитанного
  const markAsRead = async (notificationId) => {
    try {
      const response = await notificationsApi.markAsRead(notificationId);
      if (response.success) {
        // Обновляем список уведомлений
        await fetchNotifications();
        // Уведомляем родительский компонент, что были прочитаны уведомления
        if (onNotificationRead) {
          onNotificationRead();
        }
      }
    } catch (error) {
      console.error("Ошибка при отметке уведомления как прочитанного:", getApiErrorMessage(error));
    }
  };

  // Отметка всех уведомлений как прочитанных
  const markAllAsRead = async () => {
    try {
      const response = await notificationsApi.markAllAsRead();
      if (response.success) {
        // Обновляем список уведомлений
        await fetchNotifications();
        // Уведомляем родительский компонент, что были прочитаны уведомления
        if (onNotificationRead) {
          onNotificationRead();
        }
      }
    } catch (error) {
      console.error(
        "Ошибка при отметке всех уведомлений как прочитанных:",
        getApiErrorMessage(error),
      );
    }
  };

  // Очистка всех уведомлений
  const clearAll = async () => {
    try {
      const response = await notificationsApi.clearAll();
      if (response.success) {
        // Обновляем список уведомлений
        await fetchNotifications();
        // Уведомляем родительский компонент, что были очищены уведомления
        if (onNotificationRead) {
          onNotificationRead();
        }
      }
    } catch (error) {
      console.error("Ошибка при очистке уведомлений:", getApiErrorMessage(error));
    }
  };

  // Открытие/закрытие панели уведомлений
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Конвертация уровня уведомления в иконку
  const getNotificationIcon = (level) => {
    switch (level) {
      case "error":
        return <ErrorIcon color="error" />;
      case "warning":
        return <WarningIcon color="warning" />;
      case "info":
      default:
        return <InfoIcon color="info" />;
    }
  };

  // Форматирование даты
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString("ru-RU")} ${date.toLocaleTimeString("ru-RU")}`;
  };

  const open = Boolean(anchorEl);
  const id = open ? "notifications-popover" : undefined;

  return (
    <>
      <Tooltip title="Уведомления">
        <IconButton onClick={handleClick} color="inherit" aria-label="Уведомления">
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <Paper sx={{ width: 400, maxHeight: 500 }}>
          <Box
            sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <Typography variant="h6">Уведомления</Typography>
            <Box>
              <Tooltip title="Прочитать все">
                <IconButton
                  size="small"
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                  aria-label="Прочитать все уведомления"
                >
                  <DoneAllIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Очистить все">
                <IconButton
                  size="small"
                  onClick={clearAll}
                  disabled={totalCount === 0}
                  aria-label="Очистить все уведомления"
                >
                  <DeleteSweepIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          <Divider />
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress size={30} />
            </Box>
          ) : notifications.length > 0 ? (
            <List sx={{ overflow: "auto", maxHeight: 400 }}>
              {notifications.map((notification) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    alignItems="flex-start"
                    sx={{
                      bgcolor: notification.read ? "transparent" : "action.hover",
                      pr: 1,
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {getNotificationIcon(notification.level)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: notification.read ? "normal" : "bold" }}
                          >
                            {notification.message}
                          </Typography>
                          {!notification.read && (
                            <Tooltip title="Отметить как прочитанное">
                              <IconButton
                                size="small"
                                onClick={() => markAsRead(notification.id)}
                                edge="end"
                                aria-label={`Отметить уведомление как прочитанное: ${notification.message}`}
                              >
                                <DoneAllIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(notification.timestamp)}
                          {notification.source && ` • ${notification.source}`}
                        </Typography>
                      }
                    />
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Box sx={{ p: 3, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                Нет уведомлений
              </Typography>
            </Box>
          )}
        </Paper>
      </Popover>
    </>
  );
};

export default NotificationsPanel;
