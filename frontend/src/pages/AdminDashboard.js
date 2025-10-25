import React, { useState, useEffect } from 'react';
import {
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton
} from '@mui/material';
import {
  People,
  Receipt,
  TrendingUp,
  Visibility,
  AttachMoney,
  PersonAdd
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axios';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    totalPayslips: 0,
    monthlyPayroll: 0
  });
  const [recentEmployees, setRecentEmployees] = useState([]);
  const [recentPayslips, setRecentPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch employees
      const employeesRes = await api.get('/api/employees?limit=5');
      setRecentEmployees(employeesRes.data.data);

      // Fetch payslips
      const payslipsRes = await api.get('/api/payslips?limit=5');
      setRecentPayslips(payslipsRes.data.data);

      // Calculate stats
      const totalEmployees = await api.get('/api/employees?limit=100'); // Get count for total
      const activeEmployees = await api.get('/api/employees?isActive=true&limit=100'); // Get all active employees
      const totalPayslips = await api.get('/api/payslips');

      let monthlyPayroll = 0;
      if (totalEmployees.data.data.length > 0) {
        monthlyPayroll = totalEmployees.data.data.reduce((sum, emp) => sum + emp.netSalary, 0);
      }

      setStats({
        totalEmployees: totalEmployees.data.total,
        activeEmployees: activeEmployees.data.total,
        totalPayslips: totalPayslips.data.total,
        monthlyPayroll
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color = 'primary' }) => (
    <Card
      sx={{
        background: `linear-gradient(135deg, ${color === 'primary' ? '#2E7D32' : color === 'success' ? '#4CAF50' : color === 'info' ? '#2196F3' : '#FF9800'} 0%, ${color === 'primary' ? '#4CAF50' : color === 'success' ? '#66BB6A' : color === 'info' ? '#42A5F5' : '#FFB74D'} 100%)`,
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          width: '100px',
          height: '100px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          transform: 'translate(30px, -30px)',
        },
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" position="relative" zIndex={1}>
          <Box>
            <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
              {title}
            </Typography>
            <Typography variant="h4" component="h2" sx={{ fontWeight: 700 }}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Typography>
          </Box>
          <Box sx={{ opacity: 0.8 }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ 
        width: '100%', 
        py: 4, 
        px: 4, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '50vh'
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <Box
            sx={{
              width: 50,
              height: 50,
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #2E7D32',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' },
              },
            }}
          />
          <Typography variant="h6" color="text.secondary">
            Loading dashboard data...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', py: 4, px: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 700, color: '#2E7D32' }}>
            Admin Dashboard
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Welcome back! Here's what's happening with your payroll system.
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4, width: '100%' }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Total Employees"
              value={stats.totalEmployees}
              icon={<People sx={{ fontSize: 40 }} />}
              color="primary"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Active Employees"
              value={stats.activeEmployees}
              icon={<TrendingUp sx={{ fontSize: 40 }} />}
              color="success"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Total Payslips"
              value={stats.totalPayslips}
              icon={<Receipt sx={{ fontSize: 40 }} />}
              color="info"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Monthly Payroll"
              value={`₹${stats.monthlyPayroll.toLocaleString()}`}
              icon={<AttachMoney sx={{ fontSize: 40 }} />}
              color="warning"
            />
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
                }
              }}
              onClick={() => navigate('/employees/new')}
            >
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <PersonAdd sx={{ fontSize: 48, color: '#2E7D32', mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#2E7D32' }}>
                  Add Employee
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Create new employee record
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
                }
              }}
              onClick={() => navigate('/employees')}
            >
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <People sx={{ fontSize: 48, color: '#2196F3', mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#2196F3' }}>
                  Manage Employees
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  View and edit employee data
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
                }
              }}
              onClick={() => navigate('/payslips')}
            >
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Receipt sx={{ fontSize: 48, color: '#FF9800', mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#FF9800' }}>
                  Generate Payslips
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Create and manage payslips
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
                }
              }}
              onClick={() => navigate('/profile')}
            >
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <TrendingUp sx={{ fontSize: 48, color: '#4CAF50', mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#4CAF50' }}>
                  View Reports
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Analytics and insights
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

      <Grid container spacing={3} sx={{ width: '100%' }}>
        {/* Recent Employees */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 600, color: '#2E7D32' }}>
                  Recent Employees
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<PersonAdd />}
                  onClick={() => navigate('/employees/new')}
                  size="small"
                  sx={{
                    background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)',
                    },
                  }}
                >
                  Add Employee
                </Button>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Code</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentEmployees.map((employee) => (
                      <TableRow key={employee._id} hover>
                        <TableCell>{employee.name}</TableCell>
                        <TableCell>{employee.employeeCode}</TableCell>
                        <TableCell>
                          <Chip
                            label={employee.isActive ? 'Active' : 'Inactive'}
                            color={employee.isActive ? 'success' : 'default'}
                            size="small"
                            sx={{ borderRadius: 2 }}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/employees/${employee._id}/edit`)}
                            sx={{ color: 'primary.main' }}
                          >
                            <Visibility />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box mt={3} textAlign="center">
                <Button 
                  onClick={() => navigate('/employees')}
                  variant="outlined"
                  sx={{ borderRadius: 2 }}
                >
                  View All Employees
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Payslips */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 600, color: '#2E7D32' }}>
                  Recent Payslips
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate('/payslips')}
                  size="small"
                  sx={{
                    background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)',
                    },
                  }}
                >
                  View All
                </Button>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Month/Year</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Net Salary</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentPayslips.map((payslip) => (
                      <TableRow key={payslip._id} hover>
                        <TableCell>{payslip.employeeName}</TableCell>
                        <TableCell>{payslip.month}/{payslip.year}</TableCell>
                        <TableCell>₹{payslip.netSalary.toLocaleString()}</TableCell>
                        <TableCell>
                          <Chip
                            label={payslip.isPaid ? 'Paid' : 'Pending'}
                            color={payslip.isPaid ? 'success' : 'warning'}
                            size="small"
                            sx={{ borderRadius: 2 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box mt={3} textAlign="center">
                <Button 
                  onClick={() => navigate('/payslips')}
                  variant="outlined"
                  sx={{ borderRadius: 2 }}
                >
                  View All Payslips
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
