import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Container, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  Grid,
  Divider,
  Chip,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Tooltip,
  Paper,
  InputBase,
  Skeleton,
  Alert,
  AlertTitle,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import SortIcon from '@mui/icons-material/Sort';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { CheckHistoryContext } from '../App';

const HistoryPage = () => {
  const navigate = useNavigate();
  const { history, removeFromHistory, clearHistory } = useContext(CheckHistoryContext);
  
  // Состояние для поиска и фильтрации
  const [searchQuery, setSearchQuery] = useState('');
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' или 'desc'
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);
  
  // Состояние для пагинации
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Фильтрация и сортировка истории
  const filteredHistory = history
    .filter(item => 
      item.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      new Date(item.timestamp).toLocaleString('ru-RU').includes(searchQuery)
    )
    .sort((a, b) => {
      if (sortDirection === 'asc') {
        return a.timestamp - b.timestamp;
      } else {
        return b.timestamp - a.timestamp;
      }
    });

  // Обработчики для пагинации
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Обработчик для диалога очистки истории
  const handleClearHistory = () => {
    clearHistory();
    setClearDialogOpen(false);
  };

  // Обработчик для диалога удаления записи
  const handleDeleteHistoryItem = () => {
    if (deleteItemId) {
      removeFromHistory(deleteItemId);
      setDeleteItemId(null);
    }
    setDeleteDialogOpen(false);
  };

  // Подтверждение удаления записи
  const confirmDeleteItem = (id) => {
    setDeleteItemId(id);
    setDeleteDialogOpen(true);
  };

  // Переключение направления сортировки
  const toggleSortDirection = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  // Очистка поиска
  const clearSearch = () => {
    setSearchQuery('');
  };

  // Функция для скачивания документа
  const downloadDocument = (filePath, originalName) => {
    if (!filePath) return;
    
    const extension = '.docx';
    const fileName = originalName ? 
      (originalName.endsWith('.docx') ? originalName : originalName + extension) : 
      `corrected_document_${Date.now()}${extension}`;
    
    // Если путь выглядит как имя файла (без слешей), используем прямой доступ
    if (filePath.indexOf('/') === -1 && filePath.indexOf('\\') === -1) {
      window.location.href = `http://localhost:5000/corrections/${encodeURIComponent(filePath)}`;
    } else {
      // Иначе используем стандартный endpoint
      window.location.href = `http://localhost:5000/api/document/download-corrected?path=${encodeURIComponent(filePath)}&filename=${encodeURIComponent(fileName)}`;
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom
          sx={{ fontWeight: 700, mb: 1 }}
        >
          История проверок
        </Typography>
        <Typography 
          variant="subtitle1" 
          color="text.secondary"
          sx={{ maxWidth: 700 }}
        >
          Здесь вы можете просмотреть результаты ваших предыдущих проверок и продолжить работу с ними
        </Typography>
      </Box>

      {/* Панель поиска и фильтрации */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          mb: 3,
          width: '100%'
        }}
      >
        <Paper
          component="form"
          sx={{
            p: '2px 4px',
            display: 'flex',
            alignItems: 'center',
            width: { xs: '100%', sm: 400 },
            borderRadius: 2
          }}
        >
          <SearchIcon sx={{ ml: 1, color: 'action.active' }} />
          <InputBase
            sx={{ ml: 1, flex: 1 }}
            placeholder="Поиск по имени файла или дате"
            inputProps={{ 'aria-label': 'поиск истории проверок' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <IconButton 
              size="small" 
              aria-label="очистить поиск" 
              onClick={clearSearch}
            >
              <HighlightOffIcon />
            </IconButton>
          )}
        </Paper>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title={`Сортировать по ${sortDirection === 'asc' ? 'возрастанию' : 'убыванию'} даты`}>
            <Button 
              startIcon={<SortIcon />}
              variant="outlined"
              size="medium"
              onClick={toggleSortDirection}
              sx={{ borderRadius: 2 }}
            >
              {sortDirection === 'asc' ? 'Сначала старые' : 'Сначала новые'}
            </Button>
          </Tooltip>

          <Tooltip title="Очистить историю">
            <Button
              startIcon={<DeleteSweepIcon />}
              variant="outlined"
              color="error"
              size="medium"
              onClick={() => setClearDialogOpen(true)}
              disabled={history.length === 0}
              sx={{ borderRadius: 2 }}
            >
              Очистить
            </Button>
          </Tooltip>
        </Box>
      </Box>

      {/* Таблица с историей */}
      {history.length > 0 ? (
        <>
          <TableContainer component={Paper} sx={{ mb: 3, borderRadius: 2, overflow: 'hidden', width: '100%' }}>
            <Table sx={{ minWidth: 650, width: '100%' }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'action.hover' }}>
                  <TableCell>Файл</TableCell>
                  <TableCell>Дата проверки</TableCell>
                  <TableCell align="center">Проблем найдено</TableCell>
                  <TableCell align="center">Исправлено</TableCell>
                  <TableCell align="right">Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(rowsPerPage > 0
                  ? filteredHistory.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  : filteredHistory
                ).map((item) => {
                  const issuesCount = item.reportData.check_results?.total_issues_count || 0;
                  const dateFormatted = new Date(item.timestamp).toLocaleString('ru-RU');
                  const hasFixedVersion = item.correctedFilePath || item.reportData.corrected_file_path;
                  
                  return (
                    <TableRow 
                      key={item.id}
                      hover
                      sx={{ 
                        '&:last-child td, &:last-child th': { border: 0 },
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'action.hover'
                        }
                      }}
                      onClick={() => navigate('/report', { 
                        state: { 
                          reportData: item.reportData,
                          fileName: item.fileName
                        }
                      })}
                    >
                      <TableCell 
                        component="th" 
                        scope="row"
                        sx={{ 
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <InsertDriveFileIcon 
                          color="primary" 
                          sx={{ mr: 1, opacity: 0.7 }} 
                        />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {item.fileName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            DOCX документ
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{dateFormatted}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={issuesCount}
                          color={issuesCount > 0 ? "warning" : "success"}
                          sx={{ minWidth: 70 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        {hasFixedVersion ? (
                          <Chip
                            size="small"
                            icon={<CheckCircleOutlineIcon />}
                            label="Да"
                            color="success"
                            variant="outlined"
                            sx={{ minWidth: 70 }}
                          />
                        ) : (
                          <Chip
                            size="small"
                            label="Нет"
                            variant="outlined"
                            sx={{ minWidth: 70 }}
                          />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <Tooltip title="Открыть отчет">
                            <Button
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate('/report', { 
                                  state: { 
                                    reportData: item.reportData,
                                    fileName: item.fileName
                                  }
                                });
                              }}
                            >
                              Открыть
                            </Button>
                          </Tooltip>
                          
                          {hasFixedVersion && (
                            <Tooltip title="Скачать исправленный документ">
                              <IconButton 
                                color="success"
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  downloadDocument(
                                    item.correctedFilePath || item.reportData.corrected_file_path, 
                                    item.fileName
                                  );
                                }}
                              >
                                <DownloadIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          
                          <Tooltip title="Удалить из истории">
                            <IconButton 
                              color="error"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                confirmDeleteItem(item.id);
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
                
                {/* Пустые строки, если данных меньше чем нужно для заполнения страницы */}
                {rowsPerPage > 0 && filteredHistory.length > 0 && 
                filteredHistory.length <= rowsPerPage && 
                Array.from({ length: rowsPerPage - filteredHistory.length }).map((_, index) => (
                  <TableRow key={`empty-${index}`}>
                    <TableCell colSpan={5} sx={{ height: 57, border: 0 }} />
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, { label: 'Все', value: -1 }]}
            component="div"
            count={filteredHistory.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Строк на странице:"
            labelDisplayedRows={({ from, to, count }) => 
              `${from}–${to} из ${count !== -1 ? count : `более чем ${to}`}`
            }
            sx={{ width: '100%' }}
          />
        </>
      ) : (
        <Alert 
          severity="info" 
          sx={{ 
            mt: 2, 
            borderRadius: 2,
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
            width: '100%'
          }}
        >
          <AlertTitle>История пуста</AlertTitle>
          В истории пока нет проверок. Перейдите на страницу <Button size="small" href="/check">Проверки</Button> чтобы загрузить документ.
        </Alert>
      )}

      {/* Диалог подтверждения очистки истории */}
      <Dialog
        open={clearDialogOpen}
        onClose={() => setClearDialogOpen(false)}
        aria-labelledby="clear-history-dialog-title"
        aria-describedby="clear-history-dialog-description"
      >
        <DialogTitle id="clear-history-dialog-title">
          Очистить историю проверок?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="clear-history-dialog-description">
            Вы действительно хотите удалить все записи из истории проверок? Это действие нельзя отменить.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearDialogOpen(false)}>Отмена</Button>
          <Button 
            onClick={handleClearHistory} 
            color="error"
            variant="contained"
          >
            Очистить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог подтверждения удаления записи */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-item-dialog-title"
        aria-describedby="delete-item-dialog-description"
      >
        <DialogTitle id="delete-item-dialog-title">
          Удалить запись из истории?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-item-dialog-description">
            Вы действительно хотите удалить эту запись из истории проверок?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Отмена</Button>
          <Button 
            onClick={handleDeleteHistoryItem} 
            color="error"
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default HistoryPage; 