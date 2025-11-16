import React, { useCallback, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import '@fontsource/inter/400.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/900.css';
import './UploadPage.css';

const UploadIcon = () => (
  <svg
    className="upload-page__icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 16V4" />
    <path d="M7 9l5-5 5 5" />
    <path d="M5 20h14" />
  </svg>
);

const ACCEPTED_TYPES = {
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};

export default function UploadPage() {
  const [fileName, setFileName] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const handleUpload = useCallback(async (acceptedFiles) => {
    if (!acceptedFiles?.length) return;
    const file = acceptedFiles[0];
    setFileName(file.name);
    setStatus('loading');
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post('/api/document/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });
      setStatus('success');
      toast.success(`Файл «${file.name}» отправлен на проверку`);
    } catch (err) {
      const message = err?.response?.data?.error || 'Не удалось загрузить файл. Попробуйте ещё раз.';
      setStatus('error');
      setError(message);
      toast.error(message);
    }
  }, []);

  const handleRejected = useCallback(() => {
    setStatus('error');
    const message = 'Поддерживается только .docx до 20 МБ';
    setError(message);
    toast.error(message);
  }, []);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    open,
  } = useDropzone({
    accept: ACCEPTED_TYPES,
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
    onDrop: handleUpload,
    onDropRejected: handleRejected,
    noClick: true,
    noKeyboard: true,
  });

  const dropzoneClassName = useMemo(() => {
    const classes = ['upload-dropzone', 'glass-card'];
    if (isDragActive) classes.push('upload-dropzone--active');
    if (isDragReject) classes.push('upload-dropzone--reject');
    return classes.join(' ');
  }, [isDragActive, isDragReject]);

  const handleSelectClick = useCallback(() => {
    if (status !== 'loading') {
      open();
    }
  }, [open, status]);

  const statusText = useMemo(() => {
    if (status === 'loading') {
      return 'Загрузка файла…';
    }
    if (status === 'success') {
      return fileName ? `Файл «${fileName}» успешно загружен` : 'Файл загружен';
    }
    if (status === 'error') {
      return error;
    }
    return '';
  }, [status, fileName, error]);

  const statusClass = status === 'error'
    ? 'upload-status upload-status--error'
    : status === 'success'
      ? 'upload-status upload-status--success'
      : 'upload-status';

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1c1d23', color: '#fff', border: '1px solid rgba(255,255,255,0.08)' },
        }}
      />
      <div className="upload-page">
        <div className="gradient-blur gradient-1" />
        <div className="gradient-blur gradient-2" />

        <div className="upload-page__content">
          <header className="upload-header">
            <h1 className="upload-title">CURSA</h1>
            <p className="upload-subtitle">Нормоконтроль нового поколения.</p>
            <p className="upload-description">
              Автоматическая проверка документов на соответствие стандартам ГОСТ.
            </p>
          </header>

          <main className="upload-main">
            <div className="upload-card">
              <div
                {...getRootProps({
                  onClick: handleSelectClick,
                  role: 'button',
                  tabIndex: 0,
                  onKeyDown: (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleSelectClick();
                    }
                  },
                  'aria-label': 'Загрузить документ .docx',
                })}
                className={dropzoneClassName}
                data-loading={status === 'loading'}
              >
                <input {...getInputProps()} />
                <div className="upload-page__icon-wrapper">
                  <UploadIcon />
                </div>
                <div className="upload-text-center">
                  <p className="upload-step-title">Шаг 1: Загрузите документ</p>
                  <p className="upload-step-text">
                    Перетащите файл .docx сюда или выберите на вашем устройстве
                  </p>
                </div>
                <button
                  type="button"
                  className="upload-button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleSelectClick();
                  }}
                  disabled={status === 'loading'}
                >
                  {status === 'loading' ? 'Загрузка…' : 'Выбрать файл'}
                </button>
                {!!statusText && (
                  <p className={statusClass} aria-live="polite">
                    {statusText}
                  </p>
                )}
              </div>

              <div className="upload-text-center">
                <h2 className="upload-section-title">Что ожидать?</h2>
                <p className="upload-info">
                  После загрузки и анализа документа здесь появится отчет об ошибках и возможность
                  скачать исправленную версию файла.
                </p>
                <button className="upload-disabled-button" type="button" disabled>
                  Скачать исправленный DOCX
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
