import React, { useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { uploadDocument } from '../../api/document';
import { useToast } from '../../components/toast/ToastProvider';
import { CheckHistoryContext } from '../../App';
import './newHome.css';

const MotionBox = motion(Box);

export default function HomePage() {
  const theme = useTheme();
  const toast = useToast();
  const navigate = useNavigate();
  const { addToHistory } = useContext(CheckHistoryContext) || {};

  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef(null);
  const mounted = useRef(true);

  React.useEffect(() => () => { mounted.current = false; }, []);

  const onPick = useCallback(() => {
    if (uploading) return;
    inputRef.current?.click();
  }, [uploading]);

  const handleUpload = useCallback(async (file) => {
    if (!file || uploading) return;
    setUploading(true);
    setProgress(0);
    try {
      const result = await uploadDocument(file, { onProgress: (p) => mounted.current && setProgress(p) });
      const payload = result?.raw ?? { ...result, temp_path: result.tempPath };
      sessionStorage.setItem('lastUpload', JSON.stringify(payload));
      addToHistory?.({
        id: `${Date.now()}-${file.name}`,
        filename: result.filename || file.name,
        timestamp: Date.now(),
        totalIssues: result.totalIssues,
        severity: result.severity,
        score: result.score,
        temp_path: result.tempPath,
        raw: result.raw || payload
      });
      toast.success('Документ загружен. Открываем анализ.');
      navigate(`/document/${encodeURIComponent(result.filename || file.name || 'document')}`);
    } catch (e) {
      toast.error(e?.message || 'Ошибка загрузки документа');
    } finally {
      if (mounted.current) setUploading(false);
    }
  }, [addToHistory, navigate, toast, uploading]);

  const onInputChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = '';
  }, [handleUpload]);

  const dragHandlers = useMemo(() => ({
    onDragEnter: (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); },
    onDragOver: (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); },
    onDragLeave: (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); },
    onDrop: (e) => {
      e.preventDefault(); e.stopPropagation(); setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleUpload(file);
    }
  }), [handleUpload]);

  return (
    <Box component="main" sx={{ flexGrow: 1 }}>
      <div className="nh-root" {...dragHandlers}>
        <div className="nh-aurora" />
        <div className="nh-noise" />
        <Container className="nh-wrap" maxWidth="lg">
          <Stack spacing={{ xs: 4, md: 6 }}>
            <MotionBox
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 0.84, 0.44, 1] }}
            >
              <Stack spacing={2}>
                <h1 className="nh-title">CURSA</h1>
                <Typography className="nh-sub">
                  Онлайн нормоконтроль с эффектом «вау»: мгновенный анализ, подсказки и идеальный стиль.
                </Typography>
                <Stack className="nh-actions" direction="row">
                  <Button
                    variant="contained"
                    size="large"
                    disableElevation
                    onClick={onPick}
                    disabled={uploading}
                  >
                    {uploading ? `Загрузка… ${progress}%` : 'Загрузить DOCX'}
                  </Button>
                  <label className="nh-dropzone" style={{ outline: dragActive ? `2px solid ${alpha(theme.palette.primary.main, 0.6)}` : 'none' }}>
                    <input
                      type="file"
                      ref={inputRef}
                      onChange={onInputChange}
                      accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    />
                    <span>{dragActive ? 'Отпустите файл здесь' : 'Перетащите DOCX сюда'}</span>
                  </label>
                </Stack>
                <Typography className="nh-small">
                  Данные обрабатываются локально сервером CURSA. Поддерживаются файлы до 20 МБ.
                </Typography>
              </Stack>
            </MotionBox>
          </Stack>
        </Container>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        style={{ display: 'none' }}
        onChange={onInputChange}
      />
    </Box>
  );
}