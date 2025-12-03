/**
 * ProgressTracker - Компонент отображения прогресса обработки документа
 */

import React, { memo } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  LinearProgress,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Fade,
  Chip
} from '@mui/material';
import {
  CloudUpload,
  Description,
  CheckCircle,
  Build,
  Assessment,
  Done,
  Error as ErrorIcon
} from '@mui/icons-material';

/**
 * Этапы обработки с иконками
 */
const STAGES = [
  { id: 'upload', label: 'Загрузка', icon: CloudUpload },
  { id: 'extract', label: 'Извлечение данных', icon: Description },
  { id: 'check', label: 'Проверка', icon: CheckCircle },
  { id: 'correct', label: 'Исправление', icon: Build },
  { id: 'report', label: 'Отчёт', icon: Assessment },
  { id: 'complete', label: 'Готово', icon: Done },
];

/**
 * Определяет индекс текущего этапа
 */
function getStageIndex(stage) {
  const index = STAGES.findIndex(s => s.id === stage);
  return index >= 0 ? index : 0;
}

/**
 * Минимальный индикатор прогресса (только полоска)
 */
export const ProgressBar = memo(function ProgressBar({ progress, message, hasError }) {
  return (
    <Box sx={{ width: '100%', mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2" color="text.secondary">
          {message || 'Обработка...'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {Math.round(progress)}%
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={progress}
        color={hasError ? 'error' : 'primary'}
        sx={{ height: 8, borderRadius: 4 }}
      />
    </Box>
  );
});

ProgressBar.propTypes = {
  progress: PropTypes.number.isRequired,
  message: PropTypes.string,
  hasError: PropTypes.bool
};

/**
 * Полный трекер прогресса со степпером
 */
const ProgressTracker = memo(function ProgressTracker({
  stage,
  progress,
  message,
  isComplete,
  hasError,
  showStepper = true,
  compact = false
}) {
  const activeStep = getStageIndex(stage);
  
  if (compact) {
    return (
      <Fade in>
        <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
          <ProgressBar progress={progress} message={message} hasError={hasError} />
          
          {isComplete && (
            <Chip
              icon={<Done />}
              label="Обработка завершена"
              color="success"
              size="small"
            />
          )}
          
          {hasError && (
            <Chip
              icon={<ErrorIcon />}
              label="Ошибка обработки"
              color="error"
              size="small"
            />
          )}
        </Paper>
      </Fade>
    );
  }
  
  return (
    <Fade in>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Прогресс обработки
        </Typography>
        
        {/* Основной прогресс-бар */}
        <ProgressBar progress={progress} message={message} hasError={hasError} />
        
        {/* Степпер с этапами */}
        {showStepper && (
          <Stepper activeStep={activeStep} orientation="vertical" sx={{ mt: 2 }}>
            {STAGES.map((stageItem, index) => {
              const StageIcon = stageItem.icon;
              const isActive = index === activeStep;
              const isCompleted = index < activeStep || isComplete;
              const isError = hasError && index === activeStep;
              
              return (
                <Step key={stageItem.id} completed={isCompleted}>
                  <StepLabel
                    error={isError}
                    StepIconComponent={() => (
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: isError
                            ? 'error.main'
                            : isCompleted
                            ? 'success.main'
                            : isActive
                            ? 'primary.main'
                            : 'grey.300',
                          color: isCompleted || isActive || isError ? 'white' : 'grey.600',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {isError ? (
                          <ErrorIcon fontSize="small" />
                        ) : isCompleted ? (
                          <Done fontSize="small" />
                        ) : (
                          <StageIcon fontSize="small" />
                        )}
                      </Box>
                    )}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: isActive ? 600 : 400,
                        color: isError ? 'error.main' : 'inherit'
                      }}
                    >
                      {stageItem.label}
                    </Typography>
                  </StepLabel>
                  
                  {isActive && message && (
                    <StepContent>
                      <Typography variant="caption" color="text.secondary">
                        {message}
                      </Typography>
                    </StepContent>
                  )}
                </Step>
              );
            })}
          </Stepper>
        )}
        
        {/* Статус завершения */}
        {isComplete && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Chip
              icon={<Done />}
              label="Документ успешно обработан!"
              color="success"
              sx={{ fontWeight: 500 }}
            />
          </Box>
        )}
        
        {hasError && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Chip
              icon={<ErrorIcon />}
              label={message || 'Произошла ошибка'}
              color="error"
              sx={{ fontWeight: 500 }}
            />
          </Box>
        )}
      </Paper>
    </Fade>
  );
});

ProgressTracker.propTypes = {
  stage: PropTypes.string,
  progress: PropTypes.number,
  message: PropTypes.string,
  isComplete: PropTypes.bool,
  hasError: PropTypes.bool,
  showStepper: PropTypes.bool,
  compact: PropTypes.bool
};

ProgressTracker.defaultProps = {
  stage: '',
  progress: 0,
  message: '',
  isComplete: false,
  hasError: false,
  showStepper: true,
  compact: false
};

ProgressTracker.displayName = 'ProgressTracker';

export default ProgressTracker;
