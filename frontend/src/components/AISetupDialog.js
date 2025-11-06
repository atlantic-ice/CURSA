import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  Link,
  Stack,
  CircularProgress,
} from '@mui/material';
import axios from 'axios';

const API_ORIGIN = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const AISetupDialog = ({ open, status, onClose, onSkip, onStatusChange }) => {
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const hasExistingKey = Boolean(status?.has_key);

  const isKeyCandidate = useMemo(() => apiKey.trim().length >= 10, [apiKey]);

  useEffect(() => {
    if (!open) {
      setApiKey('');
      setError('');
      setSuccess('');
    }
  }, [open, status]);

  const handleDismiss = () => {
    if (onSkip) {
      onSkip();
      return;
    }
    if (onClose) {
      onClose();
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(`${API_ORIGIN}/api/document/ai/key`, {
        api_key: apiKey.trim(),
      });
      const nextStatus = response.data.status || {};
      setSuccess('Ключ сохранен. ИИ включен.');
      setApiKey('');
      if (onStatusChange) {
        onStatusChange(nextStatus, 'saved');
      }
    } catch (err) {
      const message = err?.response?.data?.error || 'Не удалось сохранить ключ. Проверьте подключение и попробуйте снова.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.delete(`${API_ORIGIN}/api/document/ai/key`);
      const nextStatus = response.data.status || {};
      setSuccess('Ключ удален. ИИ отключен.');
      if (onStatusChange) {
        onStatusChange(nextStatus, 'cleared');
      }
    } catch (err) {
      const message = err?.response?.data?.error || 'Не удалось удалить ключ. Попробуйте позже.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleDismiss} maxWidth="sm" fullWidth>
      <DialogTitle>Настройка ИИ (Gemini)</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body1">
            Подключите ключ Gemini API, чтобы включить интеллектуальные подсказки и корректировки прямо в приложении.
          </Typography>

          <Typography variant="body2" color="text.secondary">
            1. Откройте{' '}
            <Link href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener">
              Google AI Studio
            </Link>{' '}
            и создайте ключ.
            <br />2. Скопируйте ключ и вставьте его ниже.
          </Typography>

          {hasExistingKey && (
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Текущий ключ сохранен:
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                {status?.masked_key || '********'}
              </Typography>
              {status?.configured_at && (
                <Typography variant="caption" color="text.secondary">
                  Обновлен: {status.configured_at}
                </Typography>
              )}
            </Box>
          )}

          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}

          <TextField
            label="Gemini API ключ"
            placeholder="sk-..."
            fullWidth
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            disabled={saving}
            autoFocus={!hasExistingKey}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleDismiss} disabled={saving}>
          Настрою позже
        </Button>
        {hasExistingKey && (
          <Button onClick={handleClear} disabled={saving} color="warning">
            Удалить ключ
          </Button>
        )}
        <Button
          onClick={handleSave}
          disabled={saving || !isKeyCandidate}
          variant="contained"
        >
          {saving ? <CircularProgress size={22} color="inherit" /> : 'Сохранить ключ'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

AISetupDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  status: PropTypes.shape({
    has_key: PropTypes.bool,
    masked_key: PropTypes.string,
    configured_at: PropTypes.string,
  }),
  onClose: PropTypes.func,
  onSkip: PropTypes.func,
  onStatusChange: PropTypes.func,
};

AISetupDialog.defaultProps = {
  status: {
    has_key: false,
    masked_key: null,
    configured_at: null,
  },
  onClose: null,
  onSkip: null,
  onStatusChange: null,
};

export default AISetupDialog;
