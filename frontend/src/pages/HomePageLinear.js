import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Upload as UploadIcon,
  CheckCircle as CheckIcon,
  TrendingUp as TrendingIcon,
  FileText as FileIcon,
  Clock as ClockIcon,
  ArrowRight as ArrowIcon,
} from '@mui/icons-material';
import {
  LinearCard,
  LinearButton,
  LinearSectionHeader,
  LinearGrid,
  LinearBadge,
  LinearEmptyState,
  LinearStatusIndicator,
} from '../components/LinearUI';

const HomePage = () => {
  const navigate = useNavigate();

  // Демо данные для последних проверок
  const recentChecks = [
    {
      id: 1,
      filename: 'Курсовая_работа_2025.docx',
      date: '2 ноября 2025',
      time: '14:30',
      status: 'success',
      statusLabel: 'Проверено',
      issues: 0,
    },
    {
      id: 2,
      filename: 'Отчет_по_практике.docx',
      date: '1 ноября 2025',
      time: '11:20',
      status: 'warning',
      statusLabel: 'Есть замечания',
      issues: 5,
    },
    {
      id: 3,
      filename: 'Дипломная_работа.docx',
      date: '31 октября 2025',
      time: '16:45',
      status: 'success',
      statusLabel: 'Проверено',
      issues: 0,
    },
  ];

  const stats = [
    {
      label: 'Всего проверок',
      value: '24',
      icon: <FileIcon />,
      trend: '+12%',
    },
    {
      label: 'Без замечаний',
      value: '18',
      icon: <CheckIcon />,
      trend: '+8%',
    },
    {
      label: 'Среднее время',
      value: '2.4 мин',
      icon: <ClockIcon />,
      trend: '-15%',
    },
  ];

  return (
    <Box
      sx={{
        flex: 1,
        overflow: 'auto',
        backgroundColor: 'background.default',
      }}
    >
      <Box
        sx={{
          maxWidth: 1400,
          margin: '0 auto',
          padding: 4,
        }}
      >
        {/* Hero Section */}
        <Box sx={{ mb: 6 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              fontSize: '2.5rem',
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              mb: 1,
            }}
          >
            Нормоконтроль документов
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              fontSize: '1.125rem',
              maxWidth: 600,
            }}
          >
            Автоматическая проверка документов на соответствие требованиям
            оформления — быстро, точно и удобно.
          </Typography>
        </Box>

        {/* Quick Action Card */}
        <LinearCard
          hover
          onClick={() => navigate('/check')}
          sx={{
            mb: 5,
            cursor: 'pointer',
            background: (theme) =>
              theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(0, 122, 255, 0.1) 0%, rgba(0, 102, 214, 0.05) 100%)'
                : 'linear-gradient(135deg, rgba(0, 122, 255, 0.05) 0%, rgba(0, 122, 255, 0.02) 100%)',
            borderColor: 'primary.main',
            borderWidth: 1.5,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '12px',
                  backgroundColor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '& svg': {
                    fontSize: 32,
                    color: 'white',
                  },
                }}
              >
                <UploadIcon />
              </Box>
              <Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 600,
                    mb: 0.5,
                  }}
                >
                  Проверить документ
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                  }}
                >
                  Загрузите .docx файл для автоматической проверки
                </Typography>
              </Box>
            </Box>
            <IconButton
              sx={{
                width: 48,
                height: 48,
                backgroundColor: 'primary.main',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                  transform: 'translateX(4px)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              <ArrowIcon />
            </IconButton>
          </Box>
        </LinearCard>

        {/* Stats Grid */}
        <LinearGrid columns={3} gap={2} sx={{ mb: 5 }}>
          {stats.map((stat, index) => (
            <LinearCard key={index}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '8px',
                    backgroundColor: 'action.hover',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    '& svg': {
                      fontSize: 20,
                      color: 'text.secondary',
                    },
                  }}
                >
                  {stat.icon}
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: stat.trend.startsWith('+')
                      ? 'success.main'
                      : 'error.main',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  <TrendingIcon sx={{ fontSize: 14 }} />
                  {stat.trend}
                </Typography>
              </Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  mb: 0.5,
                }}
              >
                {stat.value}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.875rem',
                }}
              >
                {stat.label}
              </Typography>
            </LinearCard>
          ))}
        </LinearGrid>

        {/* Recent Checks */}
        <LinearSectionHeader
          title="Последние проверки"
          subtitle="История ваших недавних проверок документов"
          action={
            <LinearButton
              variant="text"
              onClick={() => navigate('/history')}
              sx={{ color: 'text.secondary' }}
            >
              Посмотреть все
            </LinearButton>
          }
        />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {recentChecks.length > 0 ? (
            recentChecks.map((check) => (
              <LinearCard
                key={check.id}
                hover
                onClick={() => navigate(`/report/${check.id}`)}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '6px',
                        backgroundColor: 'action.hover',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        '& svg': {
                          fontSize: 20,
                          color: 'text.secondary',
                        },
                      }}
                    >
                      <FileIcon />
                    </Box>
                    <Box>
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 600,
                          mb: 0.25,
                        }}
                      >
                        {check.filename}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          fontSize: '0.8125rem',
                        }}
                      >
                        {check.date} в {check.time}
                      </Typography>
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    {check.issues > 0 && (
                      <LinearBadge
                        label={`${check.issues} замечаний`}
                        status="warning"
                        size="small"
                      />
                    )}
                    <LinearStatusIndicator
                      status={check.status}
                      label={check.statusLabel}
                    />
                    <IconButton size="small">
                      <ArrowIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </LinearCard>
            ))
          ) : (
            <LinearEmptyState
              icon={<FileIcon />}
              title="Нет проверок"
              description="Загрузите документ для начала проверки"
              action={
                <LinearButton
                  variant="contained"
                  onClick={() => navigate('/check')}
                >
                  Проверить документ
                </LinearButton>
              }
            />
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default HomePage;
