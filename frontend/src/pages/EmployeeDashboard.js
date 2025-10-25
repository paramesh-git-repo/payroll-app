import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  IconButton
} from '@mui/material';
import {
  Download,
  Visibility,
  AccountBalance,
  CalendarToday,
  TrendingUp,
  Payment
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axios';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchEmployeeData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch employee details
      const employeesRes = await api.get('/api/employees?limit=100'); // Fetch all employees for comparison
      const employeeData = employeesRes.data.data.find(
        emp => emp.employeeCode === user.employeeCode
      );
      setEmployee(employeeData);

      // Fetch payslips
      const payslipsRes = await api.get('/api/payslips');
      setPayslips(payslipsRes.data.data.slice(0, 5)); // Show only recent 5

    } catch (error) {
      console.error('Error fetching employee data:', error);
    } finally {
      setLoading(false);
    }
  }, [user.employeeCode]);

  useEffect(() => {
    if (user?.employeeCode) {
      fetchEmployeeData();
    }
  }, [fetchEmployeeData]);

  const handleDownloadPDF = async (payslipId) => {
    try {
      const response = await api.get(`/api/payslips/${payslipId}/pdf`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payslip-${payslipId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  const handleViewPayslip = (payslipId) => {
    navigate(`/payslips/${payslipId}`);
  };

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
            Loading your dashboard...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', py: 4, px: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 700, color: '#2E7D32' }}>
          Employee Dashboard
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Welcome back, {employee?.name || 'Employee'}! Here's your payroll information.
        </Typography>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
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
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" position="relative" zIndex={1}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Current Salary
                  </Typography>
                  <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
                    ₹{employee?.netSalary?.toLocaleString() || '0'}
                  </Typography>
                </Box>
                <Box sx={{ opacity: 0.8 }}>
                  <AccountBalance sx={{ fontSize: 40 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #2196F3 0%, #42A5F5 100%)',
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
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" position="relative" zIndex={1}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Total Payslips
                  </Typography>
                  <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
                    {payslips.length}
                  </Typography>
                </Box>
                <Box sx={{ opacity: 0.8 }}>
                  <Payment sx={{ fontSize: 40 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)',
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
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" position="relative" zIndex={1}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Paid This Month
                  </Typography>
                  <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
                    {payslips.filter(p => p.isPaid).length}
                  </Typography>
                </Box>
                <Box sx={{ opacity: 0.8 }}>
                  <TrendingUp sx={{ fontSize: 40 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
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
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" position="relative" zIndex={1}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Employee Since
                  </Typography>
                  <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
                    {employee?.joinDate ? new Date(employee.joinDate).getFullYear() : 'N/A'}
                  </Typography>
                </Box>
                <Box sx={{ opacity: 0.8 }}>
                  <CalendarToday sx={{ fontSize: 40 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ width: '100%' }}>
        {/* Employee Info Card */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Employee Information
              </Typography>
              {employee ? (
                <Box>
                  <Typography variant="body1" gutterBottom>
                    <strong>Name:</strong> {employee.name}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>Employee Code:</strong> {employee.employeeCode}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>Department:</strong> {employee.department || 'N/A'}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>Designation:</strong> {employee.designation || 'N/A'}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>Salary:</strong> ₹{employee.salary.toLocaleString()}
                  </Typography>
                  <Typography variant="body1" gutterBottom component="div">
                    <strong>Status:</strong> 
                    <Chip
                      label={employee.isActive ? 'Active' : 'Inactive'}
                      color={employee.isActive ? 'success' : 'default'}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                </Box>
              ) : (
                <Typography>Employee information not found</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Salary Breakdown Card */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Salary Breakdown
              </Typography>
              {employee ? (
                <Box>
                  <Typography variant="body2" gutterBottom>
                    <strong>Basic:</strong> ₹{employee.basic.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>HRA:</strong> ₹{employee.hra.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Conveyance:</strong> ₹{employee.conveyance.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Other Allowance:</strong> ₹{employee.otherAllowance.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>PF:</strong> ₹{employee.pf.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>ESIC:</strong> ₹{employee.esic.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Day Wise Deduction:</strong> ₹{employee.dayWiseDeduction.toLocaleString()}
                  </Typography>
                  <Typography variant="h6" color="primary" gutterBottom>
                    <strong>Net Salary:</strong> ₹{employee.netSalary.toLocaleString()}
                  </Typography>
                </Box>
              ) : (
                <Typography>Salary breakdown not available</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Payslips */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" component="h2">
                Recent Payslips
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/payslips')}
                size="small"
              >
                View All Payslips
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Month/Year</TableCell>
                    <TableCell>Paid Days</TableCell>
                    <TableCell>Leaves</TableCell>
                    <TableCell>Net Salary</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payslips.length > 0 ? (
                    payslips.map((payslip) => (
                      <TableRow key={payslip._id}>
                        <TableCell>{payslip.month}/{payslip.year}</TableCell>
                        <TableCell>{payslip.paidDays}</TableCell>
                        <TableCell>{payslip.leaves}</TableCell>
                        <TableCell>₹{payslip.netSalary.toLocaleString()}</TableCell>
                        <TableCell>
                          <Chip
                            label={payslip.isPaid ? 'Paid' : 'Pending'}
                            color={payslip.isPaid ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleViewPayslip(payslip._id)}
                            title="View Payslip"
                          >
                            <Visibility />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDownloadPDF(payslip._id)}
                            title="Download PDF"
                          >
                            <Download />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No payslips found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EmployeeDashboard;
