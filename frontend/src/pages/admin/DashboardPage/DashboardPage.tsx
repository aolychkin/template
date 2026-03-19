import { Box, Paper, Typography, Grid, Alert, Button, Skeleton, useTheme } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import BarChartIcon from '@mui/icons-material/BarChart';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { StatCard, EmptyState } from 'shared/ui';
import { useGetDashboardStatsQuery } from 'entities/admin';

export function DashboardPage() {
  const theme = useTheme();
  const primaryColor = theme.palette.primary.main;
  const { data: stats, isLoading, error, refetch } = useGetDashboardStatsQuery();

  if (error) {
    return (
      <Box>
        <Typography variant="h5" mb={3}>Дашборд</Typography>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              Повторить
            </Button>
          }
        >
          Не удалось загрузить статистику
        </Alert>
      </Box>
    );
  }

  // Форматирование данных для графика
  const chartData = stats?.dailyRegistrations.map((item) => ({
    date: new Date(item.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
    fullDate: item.date,
    count: item.count,
  })) || [];

  return (
    <Box>
      <Typography variant="h5" mb={3}>
        Дашборд
      </Typography>

      {/* Статистика */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 6, sm: 6, lg: 3 }}>
          {isLoading ? (
            <Skeleton variant="rounded" height={100} />
          ) : (
            <StatCard
              title="Всего пользователей"
              shortTitle="Всего"
              value={stats?.totalUsers || 0}
              icon={<PeopleIcon fontSize="small" />}
              color="primary"
            />
          )}
        </Grid>
        <Grid size={{ xs: 6, sm: 6, lg: 3 }}>
          {isLoading ? (
            <Skeleton variant="rounded" height={100} />
          ) : (
            <StatCard
              title="Активных"
              value={stats?.activeUsers || 0}
              icon={<CheckCircleIcon fontSize="small" />}
              color="success"
            />
          )}
        </Grid>
        <Grid size={{ xs: 6, sm: 6, lg: 3 }}>
          {isLoading ? (
            <Skeleton variant="rounded" height={100} />
          ) : (
            <StatCard
              title="Новых сегодня"
              shortTitle="Сегодня"
              value={`+${stats?.newUsersToday || 0}`}
              icon={<TrendingUpIcon fontSize="small" />}
              color="info"
            />
          )}
        </Grid>
        <Grid size={{ xs: 6, sm: 6, lg: 3 }}>
          {isLoading ? (
            <Skeleton variant="rounded" height={100} />
          ) : (
            <StatCard
              title="За месяц"
              value={`+${stats?.newUsersThisMonth || 0}`}
              icon={<CalendarMonthIcon fontSize="small" />}
              color="warning"
            />
          )}
        </Grid>
      </Grid>

      {/* График регистраций */}
      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography variant="h6" mb={2}>
          Регистрации за последние 30 дней
        </Typography>

        {isLoading ? (
          <Skeleton variant="rounded" height={280} />
        ) : chartData.length === 0 ? (
          <EmptyState
            title="Нет данных"
            description="Статистика регистраций появится после первых пользователей"
            icon={<BarChartIcon />}
          />
        ) : (
          <Box sx={{ height: 280, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={primaryColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e0e0e0',
                    borderRadius: 8,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value) => [`${value} регистраций`]}
                  labelFormatter={(label) => `Дата: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke={primaryColor}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        )}
      </Paper>

      {/* Дополнительная статистика */}
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" mb={2}>
              Статистика за период
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">За сегодня</Typography>
                <Typography variant="body2" fontWeight={500}>
                  {isLoading ? <Skeleton width={40} /> : `+${stats?.newUsersToday || 0}`}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">За неделю</Typography>
                <Typography variant="body2" fontWeight={500}>
                  {isLoading ? <Skeleton width={40} /> : `+${stats?.newUsersThisWeek || 0}`}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">За месяц</Typography>
                <Typography variant="body2" fontWeight={500}>
                  {isLoading ? <Skeleton width={40} /> : `+${stats?.newUsersThisMonth || 0}`}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" mb={2}>
              Активность
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Всего пользователей</Typography>
                <Typography variant="body2" fontWeight={500}>
                  {isLoading ? <Skeleton width={40} /> : stats?.totalUsers || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Активных</Typography>
                <Typography variant="body2" fontWeight={500} color="success.main">
                  {isLoading ? <Skeleton width={40} /> : stats?.activeUsers || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Неактивных</Typography>
                <Typography variant="body2" fontWeight={500} color="text.secondary">
                  {isLoading ? <Skeleton width={40} /> : (stats?.totalUsers || 0) - (stats?.activeUsers || 0)}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
