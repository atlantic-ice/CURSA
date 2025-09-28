import React, { useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { uploadDocument } from '../../api/document';
import { useToast } from '../../components/toast/ToastProvider';
import { CheckHistoryContext } from '../../App';
import './newHome.css';
import '@fontsource/space-grotesk/600.css';
import '@fontsource/space-grotesk/700.css';

export default function HomePage() {
  const theme = useTheme();
  const toast = useToast();
  const navigate = useNavigate();
  const ctx = useContext(CheckHistoryContext) || {};
  const { addToHistory, history = [] } = ctx;

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
        <div className="nh-container">
          {/* Upload widget - large */}
          <section className="nh-card nh-card-upload nh-col-7 nh-row-3" aria-label="Загрузка документа">
            <div className="nh-card-body">
              <div className="nh-title-tech">CURSA</div>
              <p className="nh-sub">
                Проверка документа по стандартам. Загрузите DOCX или перетащите файл в область.
              </p>
              <div className="nh-actions">
                <Button
                  variant="contained"
                  size="large"
                  disableElevation
                  onClick={onPick}
                  disabled={uploading}
                >
                  {uploading ? `Загрузка… ${progress}%` : 'Загрузить DOCX'}
                </Button>
                <label
                  className="nh-dropzone"
                  style={{ outline: dragActive ? `2px solid ${alpha(theme.palette.primary.main, 0.3)}` : 'none' }}
                >
                  <input
                    type="file"
                    ref={inputRef}
                    onChange={onInputChange}
                    accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  />
                  <span>{dragActive ? 'Отпустите файл здесь' : 'Перетащите DOCX сюда'}</span>
                </label>
              </div>
              <Typography className="nh-small">
                Данные обрабатываются локально сервером CURSA. Поддерживаются файлы до 20 МБ.
              </Typography>
            </div>
          </section>
          {/* Right rail: stacked, eye-friendly */}
          <aside
            style={{
              gridColumn: '8 / 13',
              gridRow: '1 / span 3',
              display: 'grid',
              gap: '20px'
            }}
            aria-label="Боковая панель"
          >
            {/* History */}
            <section className="nh-card">
              <div className="nh-card-body">
                <h3 className="nh-card-title">История</h3>
                <p className="nh-card-text">Последние проверки: {Array.isArray(history) ? history.length : 0}</p>
                <p className="nh-card-muted">Открывайте последние отчеты быстрее.</p>
              </div>
            </section>

            {/* Quick actions */}
            <section className="nh-card nh-card-accent">
              <div className="nh-card-body">
                <h3 className="nh-card-title">Быстрые действия</h3>
                <div className="nh-pills">
                  <button className="nh-chip" onClick={onPick}>Новая проверка</button>
                  <button className="nh-chip" onClick={() => navigate('/reports')}>Отчеты</button>
                  <button className="nh-chip" onClick={() => navigate('/history')}>История</button>
                  <button className="nh-chip" disabled>Открыть пример</button>
                </div>
              </div>
            </section>

            {/* Shortcuts */}
            <section className="nh-card">
              <div className="nh-card-body">
                <h3 className="nh-card-title">Горячие клавиши</h3>
                <div className="nh-shortcuts">
                  <div><kbd className="nh-kbd">Alt</kbd> + <kbd className="nh-kbd">U</kbd> — Загрузка</div>
                  <div><kbd className="nh-kbd">Alt</kbd> + <kbd className="nh-kbd">H</kbd> — История</div>
                  <div><kbd className="nh-kbd">Alt</kbd> + <kbd className="nh-kbd">R</kbd> — Отчеты</div>
                </div>
              </div>
            </section>

            {/* System status */}
            <section className="nh-card">
              <div className="nh-card-body">
                <h3 className="nh-card-title">Системный статус</h3>
                <div className="nh-meta">
                  <div><span className="nh-dot ok" />Сервер: локально</div>
                  <div><span className="nh-dot" />Версия: 0.1</div>
                  <div><span className="nh-dot" />Скорость: —</div>
                </div>
              </div>
            </section>

            {/* Templates */}
            <section className="nh-card">
              <div className="nh-card-body">
                <h3 className="nh-card-title">Шаблоны</h3>
                <div className="nh-pills">
                  <button className="nh-chip" disabled>Курсовая</button>
                  <button className="nh-chip" disabled>Диплом</button>
                  <button className="nh-chip" disabled>Отчет</button>
                </div>
              </div>
            </section>

            {/* Ideas */}
            <section className="nh-card">
              <div className="nh-card-body">
                <h3 className="nh-card-title">Идеи улучшения</h3>
                <p className="nh-card-text">Автопочинка стилей, единая шапка, проверка ссылок, генерация содержания.</p>
              </div>
            </section>
          </aside>

          {/* Quality widget under hero */}
          <section className="nh-card nh-col-7 nh-row-2">
            <div className="nh-card-body">
              <h3 className="nh-card-title">Качество документа</h3>
              <p className="nh-card-text">Аналитика появится после загрузки файла.</p>
            </div>
          </section>

          {/* Tips widget under quality */}
          <section className="nh-card nh-col-7 nh-row-2">
            <div className="nh-card-body">
              <h3 className="nh-card-title">Подсказки оформления</h3>
              <p className="nh-card-text">• Выравнивайте таблицы по сетке
                <br />• Используйте единый стиль заголовков
                <br />• Проверяйте межстрочный интервал</p>
            </div>
          </section>
        </div>
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