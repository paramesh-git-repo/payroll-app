import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Snackbar,
  Switch
} from '@mui/material';
import {
  AccountBalance,
  AttachMoney,
  People,
  TrendingUp,
  Download,
  Add
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/axios';

const Payroll = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [employees, setEmployees] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    record: null
  });
  
  // Generate Payroll Dialog State
  const [generateDialog, setGenerateDialog] = useState({
    open: false,
    selectedEmployees: [],
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    generateAll: false
  });
  
  // Download Report Dialog State
  const [downloadDialog, setDownloadDialog] = useState({
    open: false,
    reportType: 'monthly',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    includeDetails: true
  });

  const [payrollData, setPayrollData] = useState({
    totalEmployees: 0,
    totalSalary: 0,
    paidThisMonth: 0,
    pendingPayslips: 0,
    recentPayrolls: []
  });
  const [movedRecords, setMovedRecords] = useState([]);
  const [processedRecords, setProcessedRecords] = useState([]);

  // Month/Year filter state
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchPayrollData();
    fetchEmployees();
    fetchMovedRecords();
    fetchProcessedRecords();
  }, []);

  // Refetch data when month/year changes
  useEffect(() => {
    if (selectedMonth && selectedYear) {
      fetchMovedRecords();
      fetchProcessedRecords();
    }
  }, [selectedMonth, selectedYear]);

  const fetchPayrollData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch payroll statistics
      const [employeesRes, payslipsRes] = await Promise.all([
        api.get('/api/employees?limit=100'), // Fetch all employees
        api.get('/api/payslips?limit=10')
      ]);

      const employees = employeesRes.data.data;
      const payslips = payslipsRes.data.data;

      // Calculate statistics
      const totalSalary = employees.reduce((sum, emp) => sum + (emp.salary || 0), 0);
      const paidThisMonth = payslips.filter(p => p.isPaid).reduce((sum, p) => sum + p.netSalary, 0);
      const pendingPayslips = payslips.filter(p => !p.isPaid).length;

      setPayrollData({
        totalEmployees: employees.length,
        totalSalary,
        paidThisMonth,
        pendingPayslips,
        recentPayrolls: payslips.slice(0, 5)
      });
    } catch (error) {
      console.error('Error fetching payroll data:', error);
      setError('Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/api/employees?isActive=true&limit=100'); // Fetch all active employees
      setEmployees(response.data.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchMovedRecords = async () => {
    try {
      console.log('=== FETCHING MOVED RECORDS ===');
      console.log('Month:', selectedMonth, 'Year:', selectedYear);
      const response = await api.get(`/api/payroll/moved-records?month=${selectedMonth}&year=${selectedYear}`);
      console.log('Moved records response:', response.data);
      setMovedRecords(response.data.data);
      console.log('Set moved records:', response.data.data.length);
      console.log('==============================');
    } catch (error) {
      console.error('Error fetching moved records:', error);
      console.error('Error response:', error.response?.data);
    }
  };

  const fetchProcessedRecords = async () => {
    try {
      console.log('=== FETCHING PROCESSED RECORDS ===');
      console.log('Month:', selectedMonth, 'Year:', selectedYear);
      const response = await api.get(`/api/payroll/processed-records?month=${selectedMonth}&year=${selectedYear}`);
      console.log('Processed records response:', response.data);
      setProcessedRecords(response.data.data);
      console.log('Set processed records:', response.data.data.length);
      console.log('==================================');
    } catch (error) {
      console.error('Error fetching processed records:', error);
      console.error('Error response:', error.response?.data);
    }
  };

  // Function to handle salary processing toggle
  const handleSalaryProcessed = async (record) => {
    // Open confirmation dialog
    setConfirmDialog({
      open: true,
      record: record
    });
  };

  // Function to confirm salary processing or revert actions
  const handleConfirmSalaryProcessing = async () => {
    try {
      const record = confirmDialog.record;
      const employeeCode = record.employeeCode;
      const month = record.month;
      const year = record.year;
      const action = confirmDialog.action || 'process';
      
      console.log('=== CONFIRMING ACTION ===');
      console.log('Action:', action);
      console.log('Employee Code:', employeeCode);
      console.log('Month:', month);
      console.log('Year:', year);
      console.log('========================');

      let response;
      let successMessage;
      let refreshFunctions;

      if (action === 'revert-processed') {
        // Revert salary processed back to moved
        response = await api.post('/api/payroll/revert-processed', {
          employeeCode,
          month,
          year
        });
        successMessage = `Salary processing reverted successfully for ${employeeCode}!`;
        refreshFunctions = [fetchMovedRecords(), fetchProcessedRecords()];
        
      } else if (action === 'revert-from-payroll') {
        // Revert from payroll back to attendance
        response = await api.post('/api/attendance/revert-from-payroll', {
          employeeCode,
          month,
          year
        });
        successMessage = `Record reverted from payroll successfully for ${employeeCode}!`;
        refreshFunctions = [fetchMovedRecords()];
        
      } else {
        // Default: Process salary
        response = await api.post('/api/payroll/mark-processed', {
          employeeCode,
          month,
          year
        });
        successMessage = `Salary processed successfully for ${employeeCode}!`;
        refreshFunctions = [fetchMovedRecords(), fetchProcessedRecords()];
      }

      console.log('Action response:', response.data);

      // Close dialog
      setConfirmDialog({ open: false, record: null });

      // Show success message
      setSnackbar({
        open: true,
        message: successMessage,
        severity: 'success'
      });

      // Refresh appropriate lists
      await Promise.all(refreshFunctions);
      
    } catch (error) {
      console.error('Error executing action:', error);
      console.error('Error response:', error.response?.data);
      
      // Close dialog
      setConfirmDialog({ open: false, record: null });
      
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to execute action',
        severity: 'error'
      });
    }
  };

  // Function to cancel salary processing
  const handleCancelSalaryProcessing = () => {
    setConfirmDialog({ open: false, record: null });
  };

  // Function to revert salary processed record back to submitted
  const handleRevertSalaryProcessing = async (record) => {
    // Open confirmation dialog
    setConfirmDialog({
      open: true,
      record: record,
      action: 'revert-processed'
    });
  };

  // Function to revert record from payroll back to attendance
  const handleRevertFromPayroll = async (record) => {
    // Open confirmation dialog
    setConfirmDialog({
      open: true,
      record: record,
      action: 'revert-from-payroll'
    });
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Generate Payroll Functions
  const handleGeneratePayroll = () => {
    setGenerateDialog(prev => ({ ...prev, open: true }));
  };

  const handleGenerateDialogClose = () => {
    setGenerateDialog({
      open: false,
      selectedEmployees: [],
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      generateAll: false
    });
  };

  const handleEmployeeSelection = (employeeId) => {
    setGenerateDialog(prev => ({
      ...prev,
      selectedEmployees: prev.selectedEmployees.includes(employeeId)
        ? prev.selectedEmployees.filter(id => id !== employeeId)
        : [...prev.selectedEmployees, employeeId]
    }));
  };

  const handleSelectAllEmployees = () => {
    setGenerateDialog(prev => ({
      ...prev,
      generateAll: !prev.generateAll,
      selectedEmployees: !prev.generateAll ? employees.map(emp => emp._id) : []
    }));
  };

  const handleGenerateConfirm = async () => {
    try {
      const { selectedEmployees, month, year, generateAll } = generateDialog;
      
      if (generateAll) {
        // Generate payroll for all active employees
        await api.post('/api/payslips/generate-bulk', {
          month: parseInt(month),
          year: parseInt(year)
        });
        setSnackbar({
          open: true,
          message: `Payroll generated successfully for all employees (${new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})`,
          severity: 'success'
        });
      } else if (selectedEmployees.length > 0) {
        // Generate payroll for selected employees
        await Promise.all(
          selectedEmployees.map(employeeId =>
            api.post('/api/payslips/generate', {
              employeeId,
              month: parseInt(month),
              year: parseInt(year)
            })
          )
        );
        setSnackbar({
          open: true,
          message: `Payroll generated successfully for ${selectedEmployees.length} employee(s)`,
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: 'Please select at least one employee or choose "Generate All"',
          severity: 'error'
        });
        return;
      }

      handleGenerateDialogClose();
      fetchPayrollData(); // Refresh data
    } catch (error) {
      console.error('Error generating payroll:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to generate payroll',
        severity: 'error'
      });
    }
  };

  // Download Report Functions
  const handleDownloadReport = () => {
    setDownloadDialog(prev => ({ ...prev, open: true }));
  };

  const handleDownloadDialogClose = () => {
    setDownloadDialog({
      open: false,
      reportType: 'monthly',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      includeDetails: true
    });
  };

  const handleDownloadConfirm = async () => {
    try {
      const { reportType, month, year, includeDetails } = downloadDialog;
      
      const params = new URLSearchParams({
        type: reportType,
        month: month.toString(),
        year: year.toString(),
        includeDetails: includeDetails.toString()
      });

      const response = await api.get(`/api/payroll/report?${params}`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payroll-report-${year}-${month.toString().padStart(2, '0')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSnackbar({
        open: true,
        message: 'Payroll report downloaded successfully',
        severity: 'success'
      });

      handleDownloadDialogClose();
    } catch (error) {
      console.error('Error downloading report:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to download report',
        severity: 'error'
      });
    }
  };


  const getMonthName = (monthNumber) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNumber - 1];
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', py: 4, px: { xs: 2, sm: 3, md: 4 } }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', py: 4, px: { xs: 2, sm: 3, md: 4 } }}>
      <Box sx={{ width: '100%' }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, color: '#2E7D32', mb: 1 }}>
            Payroll Management
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Manage employee payroll, salary processing, and financial reports
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Month/Year Filter */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#2E7D32' }}>
            Select Month/Year for Processing
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Month</InputLabel>
              <Select
                value={selectedMonth}
                label="Month"
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <MenuItem key={i + 1} value={i + 1}>
                    {getMonthName(i + 1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 100 }}>
              <InputLabel>Year</InputLabel>
              <Select
                value={selectedYear}
                label="Year"
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                {Array.from({ length: 3 }, (_, i) => {
                  const yearValue = new Date().getFullYear() - i;
                  return (
                    <MenuItem key={yearValue} value={yearValue}>
                      {yearValue}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
              Currently viewing: <strong>{getMonthName(selectedMonth)} {selectedYear}</strong>
            </Typography>
          </Box>
        </Box>

        {/* Quick Actions */}
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleGeneratePayroll}
                fullWidth
                sx={{
                  py: 2,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)',
                  },
                }}
              >
                Generate Payroll
              </Button>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={handleDownloadReport}
                fullWidth
                sx={{ py: 2, borderRadius: 2 }}
              >
                Download Report
              </Button>
            </Grid>
          </Grid>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card elevation={2} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#2E7D32' }}>
                      {movedRecords.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Ready for Processing
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(46, 125, 50, 0.1)',
                    }}
                  >
                    <People sx={{ fontSize: 32, color: '#2E7D32' }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card elevation={2} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#1976D2' }}>
                      {processedRecords.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Salary Processed
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(25, 118, 210, 0.1)',
                    }}
                  >
                    <AttachMoney sx={{ fontSize: 32, color: '#1976D2' }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card elevation={2} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#ED6C02' }}>
                      ₹{movedRecords.reduce((sum, record) => sum + (record.employee?.netSalary || 0), 0).toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending Amount
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(237, 108, 2, 0.1)',
                    }}
                  >
                    <TrendingUp sx={{ fontSize: 32, color: '#ED6C02' }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card elevation={2} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#2E7D32' }}>
                      ₹{processedRecords.reduce((sum, record) => sum + (record.employee?.netSalary || 0), 0).toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Processed Amount
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(46, 125, 50, 0.1)',
                    }}
                  >
                    <AccountBalance sx={{ fontSize: 32, color: '#2E7D32' }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Moved Records Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: '#2E7D32' }}>
            Records Moved from Attendance ({movedRecords.length} records for {getMonthName(selectedMonth)} {selectedYear})
          </Typography>
          
          {movedRecords.length > 0 ? (
            <Card elevation={2} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ overflow: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f5f5f5' }}>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', borderBottom: '1px solid #ddd' }}>Employee</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', borderBottom: '1px solid #ddd' }}>Month/Year</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', borderBottom: '1px solid #ddd' }}>Salary</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', borderBottom: '1px solid #ddd' }}>Paid Days</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', borderBottom: '1px solid #ddd' }}>Net Salary</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', borderBottom: '1px solid #ddd' }}>Status</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', borderBottom: '1px solid #ddd' }}>Submitted By</th>
                        <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', borderBottom: '1px solid #ddd' }}>Process Salary</th>
                        <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', borderBottom: '1px solid #ddd' }}>Revert</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movedRecords.map((record) => (
                        <tr key={record._id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '12px' }}>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {record.employeeName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {record.employeeCode}
                              </Typography>
                            </Box>
                          </td>
                          <td style={{ padding: '12px' }}>
                            {record.month}/{record.year}
                          </td>
                          <td style={{ padding: '12px' }}>
                            ₹{record.employee?.salary?.toLocaleString() || 'N/A'}
                          </td>
                          <td style={{ padding: '12px' }}>
                            {record.presentDays}
                          </td>
                          <td style={{ padding: '12px' }}>
                            ₹{record.employee?.netSalary?.toLocaleString() || 'N/A'}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <Chip 
                              label={record.status === 'submitted' ? 'Ready for Payroll' : record.status}
                              color={record.status === 'submitted' ? 'success' : 'default'}
                              size="small"
                            />
                          </td>
                          <td style={{ padding: '12px' }}>
                            {record.submittedBy?.name || 'System'}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={false}
                                  onChange={() => handleSalaryProcessed(record)}
                                  color="success"
                                  size="small"
                                />
                              }
                              label=""
                              sx={{ margin: 0 }}
                            />
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <Button
                              variant="outlined"
                              color="warning"
                              size="small"
                              onClick={() => handleRevertFromPayroll(record)}
                              sx={{ minWidth: 'auto', px: 1 }}
                            >
                              Revert
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Card elevation={2} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No records moved from attendance yet. Use the "Move" button in Attendance Management to move verified records here.
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Salary Processed Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: '#2E7D32' }}>
            Salary Processed Records ({processedRecords.length} records for {getMonthName(selectedMonth)} {selectedYear})
          </Typography>
          
          {processedRecords.length > 0 ? (
            <Card elevation={2} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ overflow: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f5f5f5' }}>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', borderBottom: '1px solid #ddd' }}>Employee</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', borderBottom: '1px solid #ddd' }}>Month/Year</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', borderBottom: '1px solid #ddd' }}>Salary</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', borderBottom: '1px solid #ddd' }}>Paid Days</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', borderBottom: '1px solid #ddd' }}>Net Salary</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', borderBottom: '1px solid #ddd' }}>Status</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', borderBottom: '1px solid #ddd' }}>Processed By</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', borderBottom: '1px solid #ddd' }}>Processed Date</th>
                        <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', borderBottom: '1px solid #ddd' }}>Revert</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processedRecords.map((record) => (
                        <tr key={record._id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '12px' }}>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {record.employeeName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {record.employeeCode}
                              </Typography>
                            </Box>
                          </td>
                          <td style={{ padding: '12px' }}>
                            {record.month}/{record.year}
                          </td>
                          <td style={{ padding: '12px' }}>
                            ₹{record.employee?.salary?.toLocaleString() || 'N/A'}
                          </td>
                          <td style={{ padding: '12px' }}>
                            {record.presentDays}
                          </td>
                          <td style={{ padding: '12px' }}>
                            ₹{record.employee?.netSalary?.toLocaleString() || 'N/A'}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <Chip 
                              label={record.status === 'approved' ? 'Salary Processed' : record.status}
                              color={record.status === 'approved' ? 'success' : 'default'}
                              size="small"
                            />
                          </td>
                          <td style={{ padding: '12px' }}>
                            {record.approvedBy?.name || 'System'}
                          </td>
                          <td style={{ padding: '12px' }}>
                            {record.approvedAt ? new Date(record.approvedAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <Button
                              variant="outlined"
                              color="warning"
                              size="small"
                              onClick={() => handleRevertSalaryProcessing(record)}
                              sx={{ minWidth: 'auto', px: 1 }}
                            >
                              Revert
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Card elevation={2} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No salary processed records yet. Use the toggle switch above to process salaries.
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Salary Processing Confirmation Dialog */}
        <Dialog
          open={confirmDialog.open}
          onClose={handleCancelSalaryProcessing}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center">
              <AttachMoney sx={{ mr: 1, color: '#2E7D32' }} />
              {confirmDialog.action === 'revert-processed' ? 'Revert Salary Processing' :
                confirmDialog.action === 'revert-from-payroll' ? 'Revert from Payroll' :
                'Confirm Salary Processing'}
            </Box>
          </DialogTitle>
          <DialogContent>
            {confirmDialog.record && (
              <Box sx={{ pt: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                  {confirmDialog.action === 'revert-processed' ? 
                    'Are you sure you want to revert salary processing for:' :
                    confirmDialog.action === 'revert-from-payroll' ?
                    'Are you sure you want to revert this record back to Attendance Management:' :
                    'Are you sure you want to process salary for:'}
                </Typography>
                
                <Box sx={{ mb: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
                    {confirmDialog.record.employeeName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Employee Code: {confirmDialog.record.employeeCode}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Month/Year: {confirmDialog.record.month}/{confirmDialog.record.year}
                  </Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Salary Details:
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Basic Salary:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      ₹{confirmDialog.record.employee?.salary?.toLocaleString() || 'N/A'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Net Salary:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
                      ₹{confirmDialog.record.employee?.netSalary?.toLocaleString() || 'N/A'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Paid Days:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {confirmDialog.record.presentDays}
                    </Typography>
                  </Box>
                </Box>

                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    This action will:
                  </Typography>
                  <Typography variant="body2" component="ul" sx={{ mt: 1, mb: 0 }}>
                    {confirmDialog.action === 'revert-processed' ? (
                      <>
                        <li>Move the record back to "Records Moved from Attendance"</li>
                        <li>Remove it from "Salary Processed Records"</li>
                        <li>Allow it to be processed again</li>
                      </>
                    ) : confirmDialog.action === 'revert-from-payroll' ? (
                      <>
                        <li>Move the record back to Attendance Management</li>
                        <li>Remove it from "Records Moved from Attendance"</li>
                        <li>Allow it to be edited again</li>
                      </>
                    ) : (
                      <>
                        <li>Mark the salary as processed</li>
                        <li>Move the record to "Salary Processed Records"</li>
                        <li>Remove it from "Records Moved from Attendance"</li>
                      </>
                    )}
                  </Typography>
                </Alert>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button
              onClick={handleCancelSalaryProcessing}
              color="inherit"
              variant="outlined"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSalaryProcessing}
              color="success"
              variant="contained"
              sx={{ ml: 1 }}
            >
              {confirmDialog.action === 'revert-processed' ? 'Revert Processing' :
                confirmDialog.action === 'revert-from-payroll' ? 'Revert to Attendance' :
                'Process Salary'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Generate Payroll Dialog */}
        <Dialog
          open={generateDialog.open}
          onClose={handleGenerateDialogClose}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center">
              <Add sx={{ mr: 1, color: '#2E7D32' }} />
              Generate Payroll
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Month</InputLabel>
                    <Select
                      value={generateDialog.month}
                      label="Month"
                      onChange={(e) => setGenerateDialog(prev => ({ ...prev, month: e.target.value }))}
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <MenuItem key={i + 1} value={i + 1}>
                          {getMonthName(i + 1)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Year</InputLabel>
                    <Select
                      value={generateDialog.year}
                      label="Year"
                      onChange={(e) => setGenerateDialog(prev => ({ ...prev, year: e.target.value }))}
                    >
                      {Array.from({ length: 3 }, (_, i) => {
                        const yearValue = new Date().getFullYear() - i;
                        return (
                          <MenuItem key={yearValue} value={yearValue}>
                            {yearValue}
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={generateDialog.generateAll}
                        onChange={handleSelectAllEmployees}
                      />
                    }
                    label={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography>Generate payroll for all active employees</Typography>
                        {generateDialog.generateAll && (
                          <Chip
                            label={`${employees.length} employees`}
                            color="success"
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        )}
                      </Box>
                    }
                  />
                </Grid>
                {!generateDialog.generateAll && (
                  <Grid size={{ xs: 12 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                      <Typography variant="h6">
                        Select Employees:
                      </Typography>
                      <Chip
                        label={`${generateDialog.selectedEmployees.length} selected`}
                        color="primary"
                        variant="outlined"
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>
                    <Box sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid #e0e0e0', borderRadius: 1, p: 1 }}>
                      {employees.map((employee) => (
                        <FormControlLabel
                          key={employee._id}
                          control={
                            <Checkbox
                              checked={generateDialog.selectedEmployees.includes(employee._id)}
                              onChange={() => handleEmployeeSelection(employee._id)}
                            />
                          }
                          label={`${employee.employeeCode} - ${employee.name}`}
                        />
                      ))}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleGenerateDialogClose}>Cancel</Button>
            <Button
              onClick={handleGenerateConfirm}
              variant="contained"
              disabled={!generateDialog.generateAll && generateDialog.selectedEmployees.length === 0}
              sx={{
                background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)',
                },
              }}
            >
              {generateDialog.generateAll 
                ? `Generate Payroll (${employees.length} employees)`
                : `Generate Payroll (${generateDialog.selectedEmployees.length} selected)`
              }
            </Button>
          </DialogActions>
        </Dialog>

        {/* Download Report Dialog */}
        <Dialog
          open={downloadDialog.open}
          onClose={handleDownloadDialogClose}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center">
              <Download sx={{ mr: 1, color: '#2E7D32' }} />
              Download Payroll Report
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth>
                    <InputLabel>Report Type</InputLabel>
                    <Select
                      value={downloadDialog.reportType}
                      label="Report Type"
                      onChange={(e) => setDownloadDialog(prev => ({ ...prev, reportType: e.target.value }))}
                    >
                      <MenuItem value="monthly">Monthly Report</MenuItem>
                      <MenuItem value="quarterly">Quarterly Report</MenuItem>
                      <MenuItem value="yearly">Yearly Report</MenuItem>
                      <MenuItem value="summary">Summary Report</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Month</InputLabel>
                    <Select
                      value={downloadDialog.month}
                      label="Month"
                      onChange={(e) => setDownloadDialog(prev => ({ ...prev, month: e.target.value }))}
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <MenuItem key={i + 1} value={i + 1}>
                          {getMonthName(i + 1)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Year</InputLabel>
                    <Select
                      value={downloadDialog.year}
                      label="Year"
                      onChange={(e) => setDownloadDialog(prev => ({ ...prev, year: e.target.value }))}
                    >
                      {Array.from({ length: 3 }, (_, i) => {
                        const yearValue = new Date().getFullYear() - i;
                        return (
                          <MenuItem key={yearValue} value={yearValue}>
                            {yearValue}
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={downloadDialog.includeDetails}
                        onChange={(e) => setDownloadDialog(prev => ({ ...prev, includeDetails: e.target.checked }))}
                      />
                    }
                    label="Include detailed breakdown"
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDownloadDialogClose}>Cancel</Button>
            <Button
              onClick={handleDownloadConfirm}
              variant="contained"
              sx={{
                background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)',
                },
              }}
            >
              Download Report
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default Payroll;
