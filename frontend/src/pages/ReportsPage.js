import React, { useContext, useMemo, useState } from 'react';
import { Box, Typography, Button, Chip, Stack, TextField, InputAdornment, Paper } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ArticleIcon from '@mui/icons-material/Article';
import SearchIcon from '@mui/icons-material/Search';
import SortIcon from '@mui/icons-material/Sort';
import LeftNav from '../components/LeftNav';
import { CheckHistoryContext } from '../App';

// Reports page in new Linear-like layout: left nav + white content
const ReportsPage = () => {
  const { history } = useContext(CheckHistoryContext);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('date-desc');

  const items = useMemo(() => {
    const base = (history || []).filter(h => h.correctedFilePath || h.reportData?.corrected_file_path);
    const filtered = query
      ? base.filter(it => (it.fileName || it.reportData?.fileName || '').toLowerCase().includes(query.toLowerCase()))
      : base;
    const sorted = [...filtered].sort((a, b) => {
      const ta = new Date(a.timestamp || 0).getTime();
      const tb = new Date(b.timestamp || 0).getTime();
      if (sort === 'date-desc') return tb - ta;
      if (sort === 'date-asc') return ta - tb;
      const na = (a.fileName || a.reportData?.fileName || '').localeCompare(b.fileName || b.reportData?.fileName || '');
      return sort === 'name-asc' ? na : -na;
    });
    return sorted;
  }, [history, query, sort]);

  const downloadDocument = (filePath, originalName) => {
    if (!filePath) return;
    const extension = '.docx';
    const safeName = originalName ? (originalName.endsWith('.docx') ? originalName : originalName + extension) : `document_${Date.now()}${extension}`;
    if (filePath.indexOf('/') === -1 && filePath.indexOf('\\') === -1) {
      window.location.href = `http://localhost:5000/corrections/${encodeURIComponent(filePath)}`;
    } else {
      window.location.href = `http://localhost:5000/api/document/download-corrected?path=${encodeURIComponent(filePath)}&filename=${encodeURIComponent(safeName)}`;
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default' }}>
      <LeftNav />

      <Box component="main" sx={{ flex: 1, p: 4, overflow: 'auto' }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
          <ArticleIcon color="primary" />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Отчёты</Typography>
          <Chip label={items.length} size="small" sx={{ ml: 1 }} />
          <Box sx={{ flex: 1 }} />
          <TextField
            size="small"
            placeholder="Поиск по названию"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>) }}
            sx={{ width: 320 }}
          />
          <Button variant="text" startIcon={<SortIcon />} onClick={() => setSort((s) => s === 'date-desc' ? 'name-asc' : s === 'name-asc' ? 'name-desc' : s === 'name-desc' ? 'date-asc' : 'date-desc')}>
            Сортировка
          </Button>
        </Stack>

        <Paper sx={{ p: 2 }}>
          {items.length === 0 ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 8 }}>
              <Typography variant="body2" color="text.secondary">Нет доступных отчётов</Typography>
            </Box>
          ) : (
            <Stack>
              {items.map((it) => {
                const key = `${it.id}`;
                const name = it.fileName || it.reportData?.fileName || 'Документ';
                const ts = it.timestamp ? new Date(it.timestamp) : null;
                const time = ts ? ts.toLocaleString() : '';
                const corrected = it.correctedFilePath || it.reportData?.corrected_file_path;
                return (
                  <Stack key={key} direction="row" alignItems="center" spacing={2} sx={{ py: 1.25, borderBottom: '1px solid rgba(31,36,41,0.06)' }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography noWrap variant="body1" sx={{ fontWeight: 600 }}>{name}</Typography>
                      <Typography variant="caption" color="text.secondary">{time}</Typography>
                    </Box>
                    <Button size="small" variant="outlined" startIcon={<DownloadIcon />} onClick={() => downloadDocument(corrected, name)}>
                      Скачать .DOCX
                    </Button>
                  </Stack>
                );
              })}
            </Stack>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default ReportsPage;
