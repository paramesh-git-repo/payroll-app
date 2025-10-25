import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import EmployeeList from './pages/EmployeeList';
import EmployeeForm from './pages/EmployeeForm';
import PayslipList from './pages/PayslipList';
import PayslipView from './pages/PayslipView';
import PayslipPDF from './pages/PayslipPDF';
import Payroll from './pages/Payroll';
import Profile from './pages/Profile';
import DashboardRedirect from './pages/DashboardRedirect';
import Unauthorized from './pages/Unauthorized';
import AttendanceManagement from './pages/AttendanceManagement';
import Settings from './pages/Settings';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2E7D32',
      light: '#4CAF50',
      dark: '#1B5E20',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#FF6F00',
      light: '#FF9800',
      dark: '#E65100',
      contrastText: '#ffffff',
    },
    background: {
      default: '#F5F5F5',
      paper: '#ffffff',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
    },
    success: {
      main: '#4CAF50',
    },
    warning: {
      main: '#FF9800',
    },
    error: {
      main: '#F44336',
    },
    info: {
      main: '#2196F3',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
    },
    h4: {
      fontWeight: 500,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 500,
      fontSize: '1rem',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#2E7D32',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<DashboardRedirect />} />
              <Route path="dashboard" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="employee-dashboard" element={
                <ProtectedRoute requiredRole="employee">
                  <EmployeeDashboard />
                </ProtectedRoute>
              } />
              <Route path="employees" element={<EmployeeList />} />
              <Route path="employees/new" element={<EmployeeForm />} />
              <Route path="employees/:id/edit" element={<EmployeeForm />} />
              <Route path="payslips" element={<PayslipList />} />
              <Route path="payslips/:id" element={<PayslipView />} />
              <Route path="payslips/:id/pdf" element={<PayslipPDF />} />
              <Route path="payroll" element={
                <ProtectedRoute requiredRole="admin">
                  <Payroll />
                </ProtectedRoute>
              } />
              <Route path="attendance" element={
                <ProtectedRoute requiredRole="admin">
                  <AttendanceManagement />
                </ProtectedRoute>
              } />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
              <Route path="unauthorized" element={<Unauthorized />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;