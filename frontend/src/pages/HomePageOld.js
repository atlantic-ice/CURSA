import React, { useContext } from 'react';
import { Box, Typography, Chip, Button, Stack, Tooltip, Paper, Divider } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import DropZone from '../components/DropZone';
import { CheckHistoryContext } from '../App';

// Centered rounded rectangle card on a black canvas
// Note: true "darker than black" isn't possible; using very-dark gray (#050505)
// so the card is visually distinct but still extremely dark.
const HomePage = ({ aiStatus, onOpenAI }) => {
  const navigate = useNavigate();
  const { history } = useContext(CheckHistoryContext) || { history: [] };
  const lastItems = Array.isArray(history) ? history.slice(0, 3) : [];
  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return '';
    }
  };
  return (
  <Box sx={{ minHeight: '100vh', bgcolor: '#000000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', px: 2, pb: 10 }}>
      {/* Top greeting and status */}
      <Box sx={{ position: 'absolute', top: 24, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
        <Typography variant="h5" sx={{ color: 'rgba(255,255,255,0.92)', fontWeight: 800, letterSpacing: '-0.01em', textAlign: 'center' }}>
          Добро пожаловать в CURSA
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.55)', textAlign: 'center' }}>
          Проверьте документ .docx на соответствие нормам и форматам за секунды
        </Typography>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 0.5 }}>
          {aiStatus?.has_key ? (
            <Tooltip title={aiStatus?.configured_at ? `Настроен: ${formatDate(aiStatus.configured_at)}` : ''} arrow>
              <Chip color="success" size="small" label={`ИИ активен: ${aiStatus?.masked_key || ''}`} />
            </Tooltip>
          ) : (
            <>
              <Tooltip title="Добавьте ключ, чтобы включить ИИ-проверки" arrow>
                <Chip color="warning" size="small" label="ИИ не настроен" />
              </Tooltip>
              <Button variant="outlined" size="small" onClick={onOpenAI}>Настроить</Button>
            </>
          )}
        </Stack>
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Button component={Link} to="/check" variant="text" color="primary" size="small" sx={{ '&:hover': { textDecoration: 'underline' } }}>Проверка</Button>
          <Button component={Link} to="/history" variant="text" color="primary" size="small" sx={{ '&:hover': { textDecoration: 'underline' } }}>История</Button>
          <Button component={Link} to="/reports" variant="text" color="primary" size="small" sx={{ '&:hover': { textDecoration: 'underline' } }}>Отчёты</Button>
          <Button component={Link} to="/guidelines" variant="text" color="primary" size="small" sx={{ '&:hover': { textDecoration: 'underline' } }}>Руководство</Button>
          <Button component={Link} to="/examples" variant="text" color="primary" size="small" sx={{ '&:hover': { textDecoration: 'underline' } }}>Примеры</Button>
          <Typography sx={{ color: 'rgba(255,255,255,0.3)', mx: 0.5 }}>•</Typography>
          <Button variant="text" size="small" sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: 'primary.main', textDecoration: 'underline' } }}>
            Демо-документ
          </Button>
        </Stack>
      </Box>

      {/* Minimal dropzone card with dashed border */}
      <DropZone sx={{
        position: 'relative',
        width: { xs: '90%', sm: '85%' },
        maxWidth: { xs: '90%', sm: 680, md: 780 },
        height: { xs: 280, sm: 320, md: 360 },
      }}>
        {({ isDragActive, isDragReject, openFile }) => (
          <Box
            onClick={(e) => { e.stopPropagation(); openFile && openFile(); }}
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              borderRadius: 3,
              bgcolor: isDragActive ? 'rgba(59,130,246,0.06)' : '#0f0f0f',
              border: `2px dashed ${isDragReject ? 'rgba(239,68,68,0.9)' : isDragActive ? 'rgba(59,130,246,0.9)' : 'rgba(255,255,255,0.16)'}`,
              transition: 'all 180ms ease',
              boxShadow: isDragActive ? '0 0 0 4px rgba(59,130,246,0.15)' : 'none',
              cursor: 'pointer',
              textAlign: 'center',
              px: 3
            }}
          >
            <CloudUploadOutlinedIcon sx={{ fontSize: { xs: 56, md: 72 }, color: isDragReject ? 'error.main' : isDragActive ? 'primary.main' : 'rgba(255,255,255,0.75)', mb: 1 }} />
            <Typography variant="h5" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 800, mb: 0.5 }}>
              {isDragReject ? 'Поддерживаются только .docx' : 'Перетащите .docx сюда • до 20 МБ'}
            </Typography>
            {!isDragReject && (
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.6)', mb: 2 }}>
                или нажмите для выбора файла
              </Typography>
            )}
            {!isDragReject && (
              <Button variant="contained" color="primary" onClick={(e) => { e.stopPropagation(); openFile && openFile(); }}>
                Загрузить .DOCX
              </Button>
            )}
          </Box>
        )}
      </DropZone>

      {/* Mini history (last 3) */}
      {lastItems.length > 0 && (
        <Box sx={{ mt: 2, width: '100%', display: 'flex', justifyContent: 'center', px: 2 }}>
          <Paper variant="outlined" sx={{ width: { xs: '90%', sm: '85%' }, maxWidth: { xs: '90%', sm: 680, md: 780 }, p: 1.5, bgcolor: 'rgba(15,15,15,0.75)', borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 0.5, pb: 0.5 }}>
              <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>Последние проверки</Typography>
              <Button component={Link} to="/history" size="small" color="primary" variant="text">Открыть историю</Button>
            </Stack>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 1 }} />
            <Stack spacing={0.75}>
              {lastItems.map((item, idx) => (
                <Stack key={item.id || idx} direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" sx={{ gap: 1, px: 0.5 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }} noWrap>
                      {item.fileName || 'Документ'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                      {formatDate(item.timestamp)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <Button size="small" variant="outlined" onClick={() => navigate('/report', { state: { reportData: item.reportData, fileName: item.fileName } })}>
                      Открыть отчёт
                    </Button>
                  </Stack>
                </Stack>
              ))}
            </Stack>
          </Paper>
        </Box>
      )}

      {/* Page-level small caption at bottom center (no hover) */}
      <Box sx={{ position: 'absolute', left: 0, right: 0, bottom: 14, display: 'flex', justifyContent: 'center', pointerEvents: 'auto' }}>
        <Typography
          variant="caption"
          sx={{
            color: 'rgba(255,255,255,0.12)',
            fontWeight: 600,
            letterSpacing: 0.6,
          }}
        >
          CURSA
        </Typography>
      </Box>
    </Box>
  );
};

// Typewriter removed — static label used instead.

export default HomePage;