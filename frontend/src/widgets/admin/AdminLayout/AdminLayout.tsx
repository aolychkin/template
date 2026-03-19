import { ReactNode, useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  useMediaQuery,
  useTheme,
  Tooltip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import LogoutIcon from '@mui/icons-material/Logout';
import { clearAuth } from 'shared/lib/auth';
import { PageTransition } from 'app/providers/PageTransition';

const DRAWER_WIDTH = 220;
const DRAWER_WIDTH_COLLAPSED = 56;

const menuItems = [
  { path: '/admin', label: 'Дашборд', icon: <DashboardIcon fontSize="small" /> },
  { path: '/admin/users', label: 'Пользователи', icon: <PeopleIcon fontSize="small" /> },
];

interface AdminLayoutProps {
  children?: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const drawerWidth = collapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH;

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleCollapseToggle = () => {
    setCollapsed(!collapsed);
  };

  const handleLogout = () => {
    clearAuth();
    window.location.href = '/login';
  };

  // Drawer для мобилки - всегда полный
  const mobileDrawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar variant="dense" sx={{ px: 2 }}>
        <Typography variant="h6" color="primary">
          Admin
        </Typography>
      </Toolbar>
      <List sx={{ flex: 1, px: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
              sx={{
                '&.Mui-selected': {
                  bgcolor: 'primary.light',
                  '&:hover': { bgcolor: 'primary.light' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <List sx={{ px: 1 }}>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon sx={{ minWidth: 36 }}><LogoutIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="Выйти" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  // Drawer для десктопа - сворачиваемый
  const desktopDrawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar variant="dense" sx={{ justifyContent: collapsed ? 'center' : 'space-between', px: collapsed ? 0 : 2 }}>
        {!collapsed && (
          <Typography variant="h6" color="primary">
            Admin
          </Typography>
        )}
        <IconButton size="small" onClick={handleCollapseToggle}>
          {collapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
        </IconButton>
      </Toolbar>
      <List sx={{ flex: 1, px: collapsed ? 0.5 : 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
            <Tooltip title={collapsed ? item.label : ''} placement="right">
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => navigate(item.path)}
                sx={{
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  px: collapsed ? 1 : 2,
                  '&.Mui-selected': {
                    bgcolor: 'primary.light',
                    '&:hover': { bgcolor: 'primary.light' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: collapsed ? 0 : 36, justifyContent: 'center' }}>{item.icon}</ListItemIcon>
                {!collapsed && <ListItemText primary={item.label} />}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>
      <List sx={{ px: collapsed ? 0.5 : 1 }}>
        <ListItem disablePadding>
          <Tooltip title={collapsed ? 'Выйти' : ''} placement="right">
            <ListItemButton
              onClick={handleLogout}
              sx={{
                justifyContent: collapsed ? 'center' : 'flex-start',
                px: collapsed ? 1 : 2,
              }}
            >
              <ListItemIcon sx={{ minWidth: collapsed ? 0 : 36, justifyContent: 'center' }}><LogoutIcon fontSize="small" /></ListItemIcon>
              {!collapsed && <ListItemText primary="Выйти" />}
            </ListItemButton>
          </Tooltip>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* AppBar для мобильных */}
      {isMobile && (
        <AppBar
          position="fixed"
          elevation={0}
          sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}
        >
          <Toolbar variant="dense">
            <IconButton edge="start" onClick={handleDrawerToggle} sx={{ mr: 2 }}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" color="primary">
              Admin
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      {/* Сайдбар */}
      <Box component="nav" sx={{ width: { xs: 0, md: drawerWidth }, flexShrink: { md: 0 }, transition: 'width 0.2s ease-in-out' }}>
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 'none' },
            }}
          >
            {mobileDrawer}
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            sx={{
              '& .MuiDrawer-paper': {
                width: drawerWidth,
                border: 'none',
                borderRight: 1,
                borderColor: 'divider',
                transition: 'width 0.2s ease-in-out',
                overflowX: 'hidden',
              },
            }}
            open
          >
            {desktopDrawer}
          </Drawer>
        )}
      </Box>

      {/* Контент */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
          maxWidth: '100vw',
          overflow: 'hidden',
          mt: { xs: 6, md: 0 },
          bgcolor: 'background.default',
          minHeight: '100vh',
          transition: 'width 0.2s ease-in-out',
        }}
      >
        <PageTransition>
          {children || <Outlet />}
        </PageTransition>
      </Box>
    </Box>
  );
}
