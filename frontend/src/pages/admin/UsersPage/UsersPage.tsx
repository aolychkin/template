import { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  InputAdornment,
  Skeleton,
  Alert,
  Menu,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { DataGrid, GridColDef, useGridApiRef, GridPreferencePanelsValue, ValueOptions, GridFilterModel } from '@mui/x-data-grid';
import { ruRU } from '@mui/x-data-grid/locales';
import SearchIcon from '@mui/icons-material/Search';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import FilterListIcon from '@mui/icons-material/FilterList';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CloseIcon from '@mui/icons-material/Close';
import PeopleIcon from '@mui/icons-material/People';
import * as XLSX from 'xlsx';
import { useListUsersQuery } from 'entities/admin';
import { useDebouncedValue } from 'shared/lib/hooks';
import { EmptyState } from 'shared/ui';

const roleLabels: Record<string, string> = {
  admin: 'Админ',
  user: 'Пользователь',
};

const statusLabels: Record<string, { label: string; color: 'success' | 'default' | 'warning' | 'error' }> = {
  active: { label: 'Активен', color: 'success' },
  inactive: { label: 'Неактивен', color: 'default' },
  blocked: { label: 'Заблокирован', color: 'warning' },
  deleted: { label: 'Удалён', color: 'error' },
};

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  status: string;
  createdAt?: number;
}

export function UsersPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const apiRef = useGridApiRef();
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [searchInput, setSearchInput] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [exportAnchor, setExportAnchor] = useState<null | HTMLElement>(null);
  const [quickFilter, setQuickFilter] = useState('');
  const [showQuickFilter, setShowQuickFilter] = useState(false);
  const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [] });

  const debouncedSearch = useDebouncedValue(searchInput, 300);

  const { data, isLoading, error, refetch } = useListUsersQuery({
    limit: paginationModel.pageSize,
    offset: paginationModel.page * paginationModel.pageSize,
    search: debouncedSearch || undefined,
    role: roleFilter || undefined,
    status: statusFilter || undefined,
  });

  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: 'email',
        headerName: 'Email',
        flex: 1,
        minWidth: 180,
      },
      {
        field: 'firstName',
        headerName: 'Имя',
        width: 100,
      },
      {
        field: 'lastName',
        headerName: 'Фамилия',
        width: 120,
      },
      {
        field: 'phone',
        headerName: 'Телефон',
        width: 140,
      },
      {
        field: 'role',
        headerName: 'Роль',
        width: 110,
        type: 'singleSelect',
        valueOptions: [
          { value: 'admin', label: 'Админ' },
          { value: 'user', label: 'Пользователь' },
        ],
        getOptionValue: (option: ValueOptions) => (option as { value: string }).value,
        getOptionLabel: (option: ValueOptions) => (option as { label: string }).label,
        renderCell: (params) => (
          <Chip
            label={roleLabels[params.value] || params.value}
            size="small"
            color={params.value === 'admin' ? 'primary' : 'default'}
          />
        ),
      },
      {
        field: 'status',
        headerName: 'Статус',
        width: 120,
        type: 'singleSelect',
        valueOptions: [
          { value: 'active', label: 'Активен' },
          { value: 'inactive', label: 'Неактивен' },
          { value: 'blocked', label: 'Заблокирован' },
          { value: 'deleted', label: 'Удалён' },
        ],
        getOptionValue: (option: ValueOptions) => (option as { value: string }).value,
        getOptionLabel: (option: ValueOptions) => (option as { label: string }).label,
        renderCell: (params) => {
          const status = statusLabels[params.value] || { label: params.value, color: 'default' as const };
          return <Chip label={status.label} size="small" color={status.color} />;
        },
      },
      {
        field: 'createdAt',
        headerName: 'Регистрация',
        width: 120,
        type: 'date',
        valueGetter: (value: number) => (value ? new Date(value * 1000) : null),
        valueFormatter: (value: Date | null) =>
          value
            ? value.toLocaleDateString('ru-RU', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })
            : '',
      },
    ],
    []
  );

  const handleResetFilters = () => {
    setSearchInput('');
    setRoleFilter('');
    setStatusFilter('');
    setPaginationModel({ page: 0, pageSize: 10 });
  };

  const prepareExportData = useCallback(() => {
    if (!data?.users) return [];
    return data.users.map((user: User) => ({
      'Email': user.email,
      'Имя': user.firstName,
      'Фамилия': user.lastName,
      'Телефон': user.phone,
      'Роль': roleLabels[user.role] || user.role,
      'Статус': statusLabels[user.status]?.label || user.status,
      'Дата регистрации': user.createdAt
        ? new Date(user.createdAt * 1000).toLocaleDateString('ru-RU')
        : '',
    }));
  }, [data?.users]);

  const handleExportCSV = useCallback(() => {
    const exportData = prepareExportData();
    if (!exportData.length) return;

    const headers = Object.keys(exportData[0]);
    const csvContent = [
      headers.join(','),
      ...exportData.map((row) =>
        headers.map((h) => `"${row[h as keyof typeof row] || ''}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setExportAnchor(null);
  }, [prepareExportData]);

  const handleExportExcel = useCallback(() => {
    const exportData = prepareExportData();
    if (!exportData.length) return;

    const ws = XLSX.utils.json_to_sheet(exportData);

    // Auto-fit column widths based on content, max 400px (~50 characters)
    const maxWidth = 50;
    const colWidths = Object.keys(exportData[0]).map((key) => {
      const maxContentLength = Math.max(
        key.length,
        ...exportData.map((row) => String(row[key as keyof typeof row] || '').length)
      );
      return { wch: Math.min(maxContentLength + 2, maxWidth) };
    });
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Пользователи');
    XLSX.writeFile(wb, `users_${new Date().toISOString().split('T')[0]}.xlsx`);
    setExportAnchor(null);
  }, [prepareExportData]);

  const handleColumnsClick = () => {
    apiRef.current?.showPreferences(GridPreferencePanelsValue.columns);
  };

  const handleFilterClick = () => {
    apiRef.current?.showPreferences(GridPreferencePanelsValue.filters);
  };

  const hasFilters = searchInput || roleFilter || statusFilter;

  // Получаем понятное сообщение об ошибке
  const getErrorMessage = () => {
    if (!error) return 'Не удалось загрузить список пользователей';
    const err = error as { error?: string };
    return err.error || 'Не удалось загрузить список пользователей';
  };

  if (error) {
    return (
      <Box>
        <Typography variant="h5" mb={3}>Пользователи</Typography>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              Повторить
            </Button>
          }
        >
          {getErrorMessage()}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" mb={3}>Пользователи</Typography>

      {/* Серверные фильтры */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Поиск..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            sx={{
              minWidth: { xs: '100%', sm: 280 },
              flex: { xs: 1, sm: 'none' },
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />

          <FormControl size="small" sx={{ minWidth: { xs: 'calc(50% - 8px)', sm: 140 } }}>
            <InputLabel>Роль</InputLabel>
            <Select
              value={roleFilter}
              label="Роль"
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <MenuItem value="">Все</MenuItem>
              <MenuItem value="admin">Админ</MenuItem>
              <MenuItem value="user">Пользователь</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: { xs: 'calc(50% - 8px)', sm: 140 } }}>
            <InputLabel>Статус</InputLabel>
            <Select
              value={statusFilter}
              label="Статус"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">Все</MenuItem>
              <MenuItem value="active">Активен</MenuItem>
              <MenuItem value="inactive">Неактивен</MenuItem>
              <MenuItem value="blocked">Заблокирован</MenuItem>
            </Select>
          </FormControl>

          {hasFilters && (
            <Button size="small" onClick={handleResetFilters} sx={{ ml: { xs: 'auto', sm: 0 } }}>
              Сбросить
            </Button>
          )}
        </Box>
      </Paper>

      {/* Таблица */}
      <Paper sx={{ overflow: 'hidden' }}>
        {/* Тулбар таблицы */}
        <Box sx={{ display: 'flex', gap: 1, p: 1, borderBottom: 1, borderColor: 'divider', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', minHeight: 48 }}>
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
            {isMobile ? (
              <>
                <IconButton onClick={handleColumnsClick} sx={{ width: 44, height: 44 }}>
                  <ViewColumnIcon />
                </IconButton>
                <IconButton onClick={handleFilterClick} sx={{ width: 44, height: 44 }}>
                  <FilterListIcon />
                </IconButton>
                <IconButton
                  onClick={(e) => setExportAnchor(e.currentTarget)}
                  disabled={!data?.users?.length}
                  sx={{ width: 44, height: 44 }}
                >
                  <FileDownloadIcon />
                </IconButton>
              </>
            ) : (
              <>
                <Button size="small" startIcon={<ViewColumnIcon />} onClick={handleColumnsClick}>
                  Колонки
                </Button>
                <Button size="small" startIcon={<FilterListIcon />} onClick={handleFilterClick}>
                  Фильтры
                </Button>
                <Button
                  size="small"
                  startIcon={<FileDownloadIcon />}
                  onClick={(e) => setExportAnchor(e.currentTarget)}
                  disabled={!data?.users?.length}
                >
                  Экспорт
                </Button>
              </>
            )}
            <Menu
              anchorEl={exportAnchor}
              open={Boolean(exportAnchor)}
              onClose={() => setExportAnchor(null)}
            >
              <MenuItem onClick={handleExportCSV}>Скачать CSV</MenuItem>
              <MenuItem onClick={handleExportExcel}>Скачать Excel</MenuItem>
            </Menu>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', minWidth: 0 }}>
            <Box sx={{ width: showQuickFilter ? (isMobile ? 120 : 200) : 0, overflow: 'hidden', transition: 'width 0.2s ease-in-out', flexShrink: 0 }}>
              <TextField
                size="small"
                placeholder="Поиск..."
                value={quickFilter}
                onChange={(e) => setQuickFilter(e.target.value)}
                autoFocus={showQuickFilter}
                sx={{ width: isMobile ? 120 : 200 }}
                slotProps={{
                  input: {
                    endAdornment: quickFilter && (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setQuickFilter('')}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Box>
            {isMobile ? (
              <IconButton onClick={() => setShowQuickFilter((v) => !v)} sx={{ width: 44, height: 44 }}>
                <SearchIcon />
              </IconButton>
            ) : (
              <Button size="small" startIcon={<SearchIcon />} onClick={() => setShowQuickFilter((v) => !v)}>
                Поиск
              </Button>
            )}
          </Box>
        </Box>

        {isLoading ? (
          <Box sx={{ p: 2 }}>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} height={52} sx={{ mb: 1 }} />
            ))}
          </Box>
        ) : data?.users?.length === 0 ? (
          <EmptyState
            title="Нет пользователей"
            description="Пользователи появятся здесь после регистрации"
            icon={<PeopleIcon />}
          />
        ) : (
          <DataGrid
            apiRef={apiRef}
            rows={data?.users || []}
            columns={columns}
            rowCount={data?.total || 0}
            paginationMode="server"
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            localeText={ruRU.components.MuiDataGrid.defaultProps.localeText}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            autoHeight
            filterModel={{
              ...filterModel,
              quickFilterValues: quickFilter ? quickFilter.split(' ') : [],
            }}
            onFilterModelChange={(newModel) => setFilterModel(newModel)}
            slotProps={{
              basePopper: {
                placement: 'bottom-start',
              },
              filterPanel: {
                sx: (theme) => ({
                  [theme.breakpoints.down('sm')]: {
                    width: 'calc(100vw - 32px)',
                    maxWidth: 'calc(100vw - 32px)',
                    minWidth: 'calc(100vw - 32px)',
                    p: 2,
                    '& .MuiDataGrid-filterForm': {
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                      p: 0,
                      width: '100%',
                    },
                    // Первая строка: крестик + столбец
                    '& .MuiDataGrid-filterFormDeleteIcon': {
                      position: 'absolute',
                      top: 8,
                      right: 8,
                    },
                    '& .MuiDataGrid-filterFormColumnInput': {
                      order: 1,
                      width: '100%',
                      pr: 5, // место для крестика
                    },
                    '& .MuiDataGrid-filterFormOperatorInput': {
                      order: 2,
                      width: '100%',
                    },
                    '& .MuiDataGrid-filterFormValueInput': {
                      order: 3,
                      width: '100%',
                    },
                    // Скрыть логический оператор полностью
                    '& .MuiDataGrid-filterFormLogicOperatorInput': {
                      display: 'none !important',
                      width: '0 !important',
                      minWidth: '0 !important',
                      p: '0 !important',
                      m: '0 !important',
                    },
                    '& .MuiFormControl-root': {
                      width: '100%',
                    },
                  },
                }),
              },
              columnsPanel: {
                sx: (theme) => ({
                  [theme.breakpoints.down('sm')]: {
                    maxWidth: 'calc(100vw - 32px)',
                  },
                }),
              },
            }}
            sx={{
              border: 'none',
              '& .MuiDataGrid-columnHeaders': {
                bgcolor: 'background.default',
              },
              '& .MuiDataGrid-cell': {
                borderColor: 'divider',
              },
              '& .MuiDataGrid-main': {
                overflow: 'auto',
              },
              '& .MuiDataGrid-virtualScroller': {
                overflowX: 'auto',
              },
              '& .MuiDataGrid-footerContainer': {
                alignItems: 'center',
              },
            }}
          />
        )}
      </Paper>
    </Box>
  );
}
