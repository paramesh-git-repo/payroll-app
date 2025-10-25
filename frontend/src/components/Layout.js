import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MainContent from './MainContent';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Menu,
  MenuItem,
  Avatar,
  Divider
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  Receipt,
  Person,
  Logout,
  AccountCircle,
  AccountBalance,
  CalendarToday,
  ChevronLeft,
  ChevronRight,
  Settings
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 240;
const collapsedDrawerWidth = 64;

const Layout = () => {
  console.log("🔄 Layout component is re-rendering!");
  console.log("Layout render count:", Date.now()); // Simple render counter
  console.log("Note: React Strict Mode causes double renders in development");
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = useCallback(() => {
    setMobileOpen(!mobileOpen);
  }, [mobileOpen]);

  const handleSidebarToggle = useCallback(() => {
    setSidebarCollapsed(!sidebarCollapsed);
  }, [sidebarCollapsed]);

  const handleProfileMenuOpen = useCallback((event) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleProfileMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
    handleProfileMenuClose();
  }, [logout, navigate, handleProfileMenuClose]);

  const handleProfile = useCallback(() => {
    navigate('/profile');
    handleProfileMenuClose();
  }, [navigate, handleProfileMenuClose]);


  const menuItems = useMemo(() => [
    {
      text: 'Dashboard',
      icon: <Dashboard />,
      path: user?.role === 'admin' ? '/dashboard' : '/employee-dashboard',
      roles: ['admin', 'employee']
    },
    {
      text: 'Employees',
      icon: <People />,
      path: '/employees',
      roles: ['admin']
    },
    {
      text: 'Payroll',
      icon: <AccountBalance />,
      path: '/payroll',
      roles: ['admin']
    },
    {
      text: 'Attendance',
      icon: <CalendarToday />,
      path: '/attendance',
      roles: ['admin']
    },
    {
      text: 'Payslips',
      icon: <Receipt />,
      path: '/payslips',
      roles: ['admin', 'employee']
    },
    {
      text: 'Settings',
      icon: <Settings />,
      path: '/settings',
      roles: ['admin', 'employee']
    }
  ], [user?.role]); // Only recreate when user role changes

  const filteredMenuItems = useMemo(() => 
    menuItems.filter(item => item.roles.includes(user?.role)),
    [menuItems, user?.role]
  );

  const drawer = (
    <div>
      <Toolbar sx={{ 
        background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: sidebarCollapsed ? 'center' : 'space-between',
        px: sidebarCollapsed ? 0 : 2
      }}>
        {!sidebarCollapsed && (
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700, color: 'white' }}>
            💼 Payroll System
          </Typography>
        )}
        <IconButton
          onClick={handleSidebarToggle}
          sx={{ 
            color: 'white',
            display: { xs: 'none', sm: 'block' }
          }}
        >
          {sidebarCollapsed ? <ChevronRight /> : <ChevronLeft />}
        </IconButton>
      </Toolbar>
      <Divider />
      <List sx={{ py: 2 }}>
        {filteredMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ px: sidebarCollapsed ? 1 : 2, mb: 1 }}>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              sx={{
                borderRadius: 2,
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                minHeight: 48,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
                '&:hover': {
                  backgroundColor: 'primary.light',
                  color: 'white',
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
              }}
              title={sidebarCollapsed ? item.text : ''}
            >
              <ListItemIcon sx={{ 
                color: 'primary.main',
                minWidth: sidebarCollapsed ? 'auto' : 56,
                justifyContent: 'center'
              }}>
                {item.icon}
              </ListItemIcon>
              {!sidebarCollapsed && <ListItemText primary={item.text} />}
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${sidebarCollapsed ? collapsedDrawerWidth : drawerWidth}px)` },
          ml: { sm: `${sidebarCollapsed ? collapsedDrawerWidth : drawerWidth}px` },
          background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          borderRadius: { xs: 0, sm: '0 0 16px 16px' },
          borderBottomLeftRadius: { sm: 16 },
          borderBottomRightRadius: { sm: 16 },
          transition: 'width 0.8s ease, margin-left 0.8s ease',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {user?.role === 'admin' ? 'Axess & V-accel Payroll' : 'Employee Portal'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ mr: 2 }}>
              Welcome, {user?.name}
            </Typography>
            <IconButton
              size="large"
              edge="end"
              aria-label="account of current user"
              aria-controls="primary-search-account-menu"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32 }}>
                <AccountCircle />
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ 
          width: { sm: sidebarCollapsed ? collapsedDrawerWidth : drawerWidth }, 
          flexShrink: { sm: 0 },
          transition: 'width 0.8s ease'
        }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRadius: '0 16px 16px 0',
              borderTopRightRadius: 16,
              borderBottomRightRadius: 16,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: sidebarCollapsed ? collapsedDrawerWidth : drawerWidth,
              borderRadius: '0 16px 16px 0',
              borderTopRightRadius: 16,
              borderBottomRightRadius: 16,
              transition: 'width 0.8s ease',
              overflowX: 'hidden',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <MainContent sidebarCollapsed={sidebarCollapsed} />
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleProfile}>
          <ListItemIcon>
            <Person fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Layout;