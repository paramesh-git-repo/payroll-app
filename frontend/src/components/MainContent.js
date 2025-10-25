import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Toolbar } from '@mui/material';

const drawerWidth = 240;
const collapsedDrawerWidth = 64;

// MainContent component that renders the main content area
const MainContent = ({ sidebarCollapsed }) => {
  console.log("Main Content is Re-rendering! This is slow!");
  console.log("sidebarCollapsed prop:", sidebarCollapsed);
  console.log("Note: In development with React Strict Mode, components render twice to detect side effects");
  
  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        width: { sm: `calc(100% - ${sidebarCollapsed ? collapsedDrawerWidth : drawerWidth}px)` },
        minHeight: '100vh',
        background: '#F5F5F5',
        margin: 0,
        padding: 0,
        maxWidth: 'none',
        overflow: 'hidden',
        borderRadius: { xs: 0, sm: '16px 0 0 0' },
        borderTopLeftRadius: { sm: 16 },
        borderTopRightRadius: { sm: 16 },
        transition: 'width 0.3s ease',
      }}
    >
      <Toolbar />
      <Box sx={{ 
        width: '100%', 
        minHeight: 'calc(100vh - 64px)', 
        p: 0, 
        m: 0 
      }}>
        <Outlet />
      </Box>
    </Box>
  );
};

// Wrap it in React.memo before exporting
export default React.memo(MainContent);
