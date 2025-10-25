import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormControlLabel,
  Checkbox,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Snackbar,
  Autocomplete,
  Paper,
  Tooltip
} from '@mui/material';
import {
  CalendarToday,
  People,
  CheckCircle,
  Cancel,
  Edit,
  Add,
  Visibility,
  TrendingUp,
  TrendingDown,
  Upload,
  FileUpload,
  CloudUpload,
  Download,
  ArrowForward,
  CheckCircleOutline,
  AttachMoney
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/axios';

const AttendanceManagement = () => {
  console.log("🔄 AttendanceManagement component is re-rendering!");
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [employees, setEmployees] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [movedRecords, setMovedRecords] = useState(new Set()); // Track moved employee codes
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Attendance Dialog State
  const [attendanceDialog, setAttendanceDialog] = useState({
    open: false,
    employee: null,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    salary: '',
    paidDays: '',
    netSalary: '',
    dayWiseDeduction: '',
    deductPF: true,
    deductESIC: true,
    reimbursement: '',
    note: '',
    comments: ''
  });

  // Employee search state
  const [employeeSearch, setEmployeeSearch] = useState('');

  // CSV Upload Dialog State
  const [csvDialog, setCsvDialog] = useState({
    open: false,
    file: null,
    preview: [],
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  // Bulk Create Dialog State
  const [bulkDialog, setBulkDialog] = useState({
    open: false,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    totalWorkingDays: 30,
    defaultPresentDays: 30
  });

  // Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    record: null
  });

  // Month/Year filter state
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  // Calculate net salary when salary or paid days change
  useEffect(() => {
    calculateNetSalary();
  }, [attendanceDialog.salary, attendanceDialog.paidDays, attendanceDialog.deductPF, attendanceDialog.deductESIC, attendanceDialog.reimbursement]);

  // Function to calculate net salary and day wise deduction
  const calculateNetSalary = useCallback(() => {
    console.log("🧮 Calculating net salary...");
    const salary = parseFloat(attendanceDialog.salary) || 0;
    const paidDays = parseInt(attendanceDialog.paidDays) || 0;
    
    // Ensure paidDays is within valid range
    const validPaidDays = Math.max(0, Math.min(31, paidDays));
    
    if (salary <= 0 || isNaN(salary) || paidDays <= 0) {
      setAttendanceDialog(prev => ({
        ...prev,
        netSalary: '',
        dayWiseDeduction: ''
      }));
      return;
    }

    // Calculate salary components using the same formulas as backend
    const basic = Math.round(salary * 0.4);
    const hra = Math.round(basic * 0.5);
    const conveyance = 1600;
    const otherAllowance = Math.round(salary - (basic + hra + conveyance));
    // PF = MIN(Basic * 12%, 1800) - Only if deductPF is true
    const pf = attendanceDialog.deductPF === true ? Math.min(Math.round(basic * 0.12), 1800) : 0;
    
    // ESIC = IF(Salary <= 21000, ROUND(Salary * 0.75%, 0), 0) - Only if deductESIC is true
    const esic = attendanceDialog.deductESIC === true && salary <= 21000 ? Math.round(salary * 0.0075) : 0;
    
    // Day Wise Deduction = ROUND((Salary / 30) * (30 - Paid Days), 0)
    const dayWiseDeduction = Math.round((salary / 30) * (30 - validPaidDays));
    
    // Reimbursement amount
    const reimbursement = parseFloat(attendanceDialog.reimbursement) || 0;
    
    // Net Salary = (Basic + HRA + Conveyance + Other Allowance) - PF - ESIC - Day Wise Deduction + Reimbursement
    const netSalary = Math.round((basic + hra + conveyance + otherAllowance) - pf - esic - dayWiseDeduction + reimbursement);

    setAttendanceDialog(prev => ({
      ...prev,
      netSalary: netSalary.toString(),
      dayWiseDeduction: dayWiseDeduction.toString()
    }));
  }, [attendanceDialog.salary, attendanceDialog.paidDays, attendanceDialog.deductPF, attendanceDialog.deductESIC, attendanceDialog.reimbursement]);

  const fetchData = async () => {
    console.log("📡 Fetching data...");
    try {
      setLoading(true);
      setError('');
      
      console.log('=== ATTENDANCE MANAGEMENT DEBUG ===');
      console.log('Selected Month:', selectedMonth);
      console.log('Selected Year:', selectedYear);
      
      const [employeesRes, attendanceRes] = await Promise.all([
        api.get('/api/employees?all=true'), // Use parameter to get ALL employees
        api.get(`/api/attendance?limit=1000&month=${selectedMonth}&year=${selectedYear}`) // Get attendance records for selected month/year
      ]);

      console.log('=== ATTENDANCE MANAGEMENT DEBUG ===');
      console.log('Employees response:', employeesRes.data);
      console.log('Employees count:', employeesRes.data.data?.length || 0);
      console.log('Sample employees:', employeesRes.data.data?.slice(0, 3));
      console.log('===================================');

      setEmployees(employeesRes.data.data);
      setAttendanceRecords(attendanceRes.data.data);
      
      console.log('=== ATTENDANCE RECORDS DEBUG ===');
      console.log('Attendance records count:', attendanceRes.data.data?.length || 0);
      console.log('Total records in database:', attendanceRes.data.total);
      console.log('Sample attendance record:', attendanceRes.data.data?.[0]);
      console.log('All attendance records:', attendanceRes.data.data);
      console.log('================================');
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Memoize the filtered employees to prevent unnecessary re-renders
  const filteredEmployees = useMemo(() => {
    console.log("🔍 Filtering employees...");
    if (!employeeSearch.trim()) return employees;
    return employees.filter(emp => 
      emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      emp.employeeCode.toLowerCase().includes(employeeSearch.toLowerCase())
    );
  }, [employees, employeeSearch]);

  // Attendance Dialog Functions
  const handleAttendanceDialogOpen = (employee = null) => {
    if (employee) {
      setAttendanceDialog({
        open: true,
        employee,
        month: selectedMonth,
        year: selectedYear,
        salary: employee.salary ? employee.salary.toString() : '',
        paidDays: employee.paidDays ? employee.paidDays.toString() : '',
        netSalary: employee.netSalary ? employee.netSalary.toString() : '',
        dayWiseDeduction: employee.dayWiseDeduction ? employee.dayWiseDeduction.toString() : '',
        deductPF: true,
        deductESIC: true,
        comments: ''
      });
    } else {
      setAttendanceDialog(prev => ({ ...prev, open: true }));
    }
  };

  const handleAttendanceDialogClose = () => {
    setAttendanceDialog({
      open: false,
      employee: null,
      month: selectedMonth,
      year: selectedYear,
      salary: '',
      paidDays: '',
      netSalary: '',
      dayWiseDeduction: '',
      deductPF: true,
      deductESIC: true,
      reimbursement: '',
      note: '',
      comments: ''
    });
    setEmployeeSearch('');
  };

  const handleAttendanceSubmit = async () => {
    try {
      const { employee, month, year, salary, paidDays, netSalary, dayWiseDeduction, deductPF, deductESIC, reimbursement, note, comments } = attendanceDialog;

      console.log('=== SUBMITTING ATTENDANCE DATA ===');
      console.log('Employee:', employee);
      console.log('Form data:', { month, year, salary, paidDays, netSalary, dayWiseDeduction, deductPF, deductESIC, reimbursement, note, comments });
      
      const requestData = {
        employeeId: employee._id,
        month,
        year,
        salary: parseFloat(salary) || 0,
        paidDays: parseInt(paidDays) || 0,
        netSalary: parseFloat(netSalary) || 0,
        dayWiseDeduction: parseFloat(dayWiseDeduction) || 0,
        deductPF: deductPF,
        deductESIC: deductESIC,
        reimbursement: parseFloat(reimbursement) || 0,
        note: note || '',
        comments
      };
      
      console.log('Request data:', requestData);
      console.log('API URL:', '/api/attendance');
      
      // Validate required fields
      if (!employee || !employee._id) {
        setSnackbar({
          open: true,
          message: 'Please select an employee',
          severity: 'error'
        });
        return;
      }
      
      if (!salary || parseFloat(salary) <= 0) {
        setSnackbar({
          open: true,
          message: 'Please enter a valid salary amount',
          severity: 'error'
        });
        return;
      }
      
      if (!paidDays || parseInt(paidDays) <= 0) {
        setSnackbar({
          open: true,
          message: 'Please enter valid paid days (must be greater than 0)',
          severity: 'error'
        });
        return;
      }
      
      const response = await api.post('/api/attendance', requestData);
      console.log('API Response:', response.data);

      console.log('=== ATTENDANCE SAVE DEBUG ===');
      console.log('Save request data:', {
        employeeId: employee._id,
        month,
        year,
        salary: parseFloat(salary) || 0,
        paidDays: parseInt(paidDays) || 0,
        netSalary: parseFloat(netSalary) || 0,
        dayWiseDeduction: parseFloat(dayWiseDeduction) || 0,
        deductPF: deductPF,
        deductESIC: deductESIC,
        reimbursement: parseFloat(reimbursement) || 0,
        note: note || '',
        comments
      });
      console.log('==============================');

      setSnackbar({
        open: true,
        message: 'Attendance record saved successfully',
        severity: 'success'
      });

      handleAttendanceDialogClose();
      console.log('=== REFRESHING DATA AFTER SAVE ===');
      await fetchData();
      console.log('=== DATA REFRESHED ===');
    } catch (error) {
      console.error('Error saving attendance:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to save attendance',
        severity: 'error'
      });
    }
  };

  // Bulk Create Functions
  const handleBulkDialogOpen = () => {
    setBulkDialog({
      open: true,
      month: selectedMonth,
      year: selectedYear,
      totalWorkingDays: 30,
      defaultPresentDays: 30
    });
  };

  const handleBulkDialogClose = () => {
    setBulkDialog({
      open: false,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      totalWorkingDays: 30,
      defaultPresentDays: 30
    });
  };

  const handleBulkCreate = async () => {
    try {
      const { month, year, totalWorkingDays, defaultPresentDays } = bulkDialog;

      await api.post('/api/attendance/bulk', {
        month,
        year,
        totalWorkingDays,
        defaultPresentDays
      });

      setSnackbar({
        open: true,
        message: 'Bulk attendance records created successfully',
        severity: 'success'
      });

      handleBulkDialogClose();
      fetchData();
    } catch (error) {
      console.error('Error creating bulk attendance:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to create bulk attendance',
        severity: 'error'
      });
    }
  };

  // CSV Upload Functions
  const handleCsvDialogOpen = () => {
    setCsvDialog({
      open: true,
      file: null,
      preview: [],
      month: selectedMonth,
      year: selectedYear
    });
  };

  const handleCsvDialogClose = () => {
    setCsvDialog({
      open: false,
      file: null,
      preview: [],
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear()
    });
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      setCsvDialog(prev => ({ ...prev, file }));
      parseCSV(file);
    } else {
      setSnackbar({
        open: true,
        message: 'Please select a valid CSV file',
        severity: 'error'
      });
    }
  };

  const parseCSV = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const data = lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
          const values = line.split(',').map(v => v.trim());
          const row = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          return row;
        })
        .slice(0, 10); // Show only first 10 rows for preview
      
      setCsvDialog(prev => ({ ...prev, preview: data }));
    };
    reader.readAsText(file);
  };

  const handleCsvUpload = async () => {
    if (!csvDialog.file) {
      setSnackbar({
        open: true,
        message: 'Please select a CSV file',
        severity: 'error'
      });
      return;
    }

    try {
      console.log('CSV Upload Debug:', {
        file: csvDialog.file,
        fileName: csvDialog.file.name,
        fileSize: csvDialog.file.size,
        fileType: csvDialog.file.type,
        month: csvDialog.month,
        year: csvDialog.year
      });

      const formData = new FormData();
      formData.append('file', csvDialog.file);
      formData.append('month', csvDialog.month);
      formData.append('year', csvDialog.year);

      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      const response = await api.post('/api/attendance/upload-csv', formData);

      setSnackbar({
        open: true,
        message: response.data.message || 'CSV uploaded successfully',
        severity: 'success'
      });

      handleCsvDialogClose();
      console.log('=== REFRESHING DATA AFTER CSV UPLOAD ===');
      await fetchData();
      console.log('=== DATA REFRESHED AFTER CSV UPLOAD ===');
    } catch (error) {
      console.error('Error uploading CSV:', error);
      console.error('Error response:', error.response?.data);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to upload CSV',
        severity: 'error'
      });
    }
  };

  // Function to move employee record to payroll (HR verification)
  const handleMoveToPayroll = async (record) => {
    // Open confirmation dialog
    setConfirmDialog({
      open: true,
      record: record
    });
  };

  // Function to confirm move to payroll
  const handleConfirmMoveToPayroll = async () => {
    try {
      const record = confirmDialog.record;
      const employeeCode = record.employeeCode;
      const month = record.source === 'manual' ? record.month : csvDialog.month;
      const year = record.source === 'manual' ? record.year : csvDialog.year;
      
      console.log('=== MOVING TO PAYROLL ===');
      console.log('Employee Code:', employeeCode);
      console.log('Month:', month);
      console.log('Year:', year);
      console.log('========================');

      // Call the backend API to move the record
      const response = await api.post('/api/attendance/move-to-payroll', {
        employeeCode,
        month,
        year
      });

      console.log('Move to payroll response:', response.data);

      // Close dialog
      setConfirmDialog({ open: false, record: null });

      // Add to moved records set
      setMovedRecords(prev => new Set([...prev, employeeCode]));
      
      // Show success message
      setSnackbar({
        open: true,
        message: `Employee ${employeeCode} moved to Payroll successfully!`,
        severity: 'success'
      });

      // Refresh the data to reflect the changes
      await fetchData();
      
    } catch (error) {
      console.error('Error moving to payroll:', error);
      console.error('Error response:', error.response?.data);
      
      // Close dialog
      setConfirmDialog({ open: false, record: null });
      
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to move employee to payroll',
        severity: 'error'
      });
    }
  };

  // Function to cancel move to payroll
  const handleCancelMoveToPayroll = () => {
    setConfirmDialog({ open: false, record: null });
  };

  // Function to download sample CSV file
  const handleSampleCsvDownload = () => {
    const sampleData = [
      {
        'Emp Code': 'EMP001',
        'Name': 'Alice Johnson',
        'Salary': '60000',
        'Paid Days': '28',
        'Net Salary': '56000',
        'Day Wise Deduction': '4000'
      },
      {
        'Emp Code': 'EMP002',
        'Name': 'Bob Williams',
        'Salary': '55000',
        'Paid Days': '30',
        'Net Salary': '52000',
        'Day Wise Deduction': '0'
      },
      {
        'Emp Code': 'EMP003',
        'Name': 'Charlie Brown',
        'Salary': '48000',
        'Paid Days': '29',
        'Net Salary': '45600',
        'Day Wise Deduction': '1600'
      }
    ];

    // Convert to CSV format
    const headers = Object.keys(sampleData[0]);
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample-salary-sheet.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setSnackbar({
      open: true,
      message: 'Sample CSV file downloaded successfully',
      severity: 'success'
    });
  };

  const getMonthName = (monthNumber) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNumber - 1];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'default';
      case 'submitted': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
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
            Attendance Management
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Track employee attendance, leaves, and working days
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Month/Year Filter */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#2E7D32' }}>
            Filter Attendance Data
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControl sx={{ minWidth: 140 }}>
              <InputLabel>Month</InputLabel>
              <Select
                value={selectedMonth}
                label="Month"
                onChange={(e) => setSelectedMonth(e.target.value)}
                size="small"
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
                size="small"
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
            <Box sx={{ 
              ml: 2, 
              px: 2, 
              py: 1, 
              backgroundColor: '#f5f5f5', 
              borderRadius: 1,
              border: '1px solid #e0e0e0'
            }}>
              <Typography variant="body2" color="text.secondary">
                Currently viewing: <strong>{getMonthName(selectedMonth)} {selectedYear}</strong>
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Quick Actions */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#2E7D32' }}>
            Quick Actions
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAttendanceDialogOpen}
                sx={{
                minWidth: 200,
                py: 1.5,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)',
                  },
                }}
              >
                Add Salary & Attendance
              </Button>
              <Button
                variant="outlined"
                startIcon={<CloudUpload />}
                onClick={handleCsvDialogOpen}
              sx={{ 
                minWidth: 200,
                py: 1.5, 
                borderRadius: 2,
                borderColor: '#2E7D32',
                color: '#2E7D32',
                '&:hover': {
                  borderColor: '#1B5E20',
                  backgroundColor: '#f5f5f5'
                }
              }}
              >
                Upload CSV
              </Button>
        </Box>
        </Paper>

        {/* CSV Upload History */}
          {csvDialog.preview.length > 0 && csvDialog.month === selectedMonth && csvDialog.year === selectedYear && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: '#2E7D32' }}>
                CSV Upload Preview ({getMonthName(csvDialog.month)} {csvDialog.year})
          </Typography>
              <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2 }}>
                <Table>
                  <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Emp Code</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Salary</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Paid Days</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Net Salary</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Day Wise Deduction</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {csvDialog.preview.map((row, index) => (
                      <TableRow key={index} hover>
                        <TableCell>{row['Emp Code'] || row['empCode'] || '-'}</TableCell>
                        <TableCell>{row['Name'] || row['name'] || '-'}</TableCell>
                        <TableCell>₹{parseFloat(row['Salary'] || row['salary'] || 0).toLocaleString()}</TableCell>
                        <TableCell>{row['Paid Days'] || row['paidDays'] || '-'}</TableCell>
                        <TableCell>₹{parseFloat(row['Net Salary'] || row['netSalary'] || 0).toLocaleString()}</TableCell>
                        <TableCell>₹{parseFloat(row['Day Wise Deduction'] || row['dayWiseDeduction'] || 0).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

        {/* All Entered Data Section */}
        <Paper sx={{ p: 2, mt: 4 }}>
          {(() => {
            // Combine and deduplicate records based on employee code for the selected month/year
            const allRecords = [];
            
            console.log('=== ALL ENTERED DATA DEBUG ===');
            console.log('attendanceRecords:', attendanceRecords);
            console.log('attendanceRecords length:', attendanceRecords.length);
            console.log('selectedMonth:', selectedMonth);
            console.log('selectedYear:', selectedYear);
            console.log('movedRecords:', Array.from(movedRecords));
            console.log('================================');
            
            // Add manual records (exclude moved ones) - these are already filtered by month/year from API
            attendanceRecords.forEach(record => {
              const employeeCode = record.employeeCode || record.employee?.employeeCode;
              console.log('Processing record:', record);
              console.log('Employee code:', employeeCode);
              console.log('Is moved:', movedRecords.has(employeeCode));
              
              if (employeeCode && !movedRecords.has(employeeCode)) {
                allRecords.push({
                  ...record,
                  source: 'manual',
                  employeeCode: employeeCode
                });
              }
            });
            
            // Add CSV records (exclude moved ones) - filter by selected month/year
            csvDialog.preview.forEach((row, index) => {
              const employeeCode = row['Emp Code'] || row['empCode'];
              const csvMonth = csvDialog.month;
              const csvYear = csvDialog.year;
              
              // Only include CSV records if they match the selected month/year
              if (employeeCode && !movedRecords.has(employeeCode) && 
                  csvMonth === selectedMonth && csvYear === selectedYear) {
                allRecords.push({
                  ...row,
                  source: 'csv',
                  employeeCode: employeeCode,
                  csvIndex: index,
                  month: csvMonth,
                  year: csvYear
                });
              }
            });
            
            // Remove duplicates - keep the latest entry for each employee code
            const uniqueRecords = [];
            const seenEmployeeCodes = new Set();
            
            // Process in reverse order to keep the latest entries
            allRecords.reverse().forEach(record => {
              if (!seenEmployeeCodes.has(record.employeeCode)) {
                seenEmployeeCodes.add(record.employeeCode);
                uniqueRecords.unshift(record); // Add to beginning to maintain order
              }
            });
            
            return (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
                    All Entered Data
                  </Typography>
                  <Box sx={{ 
                    px: 2, 
                    py: 1, 
                    backgroundColor: '#e8f5e8', 
                    borderRadius: 1,
                    border: '1px solid #c8e6c9'
                  }}>
                    <Typography variant="body2" sx={{ color: '#2E7D32', fontWeight: 'bold' }}>
                      {uniqueRecords.length} records for {getMonthName(selectedMonth)} {selectedYear}
                    </Typography>
                  </Box>
                </Box>
                
                {uniqueRecords.length > 0 ? (
            <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2 }}>
              <Table>
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Employee</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Month/Year</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Salary</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Paid Days</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Net Salary</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Day Wise Deduction</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Reimbursement</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Note</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* Deduplicated Records */}
                  {uniqueRecords.map((record) => (
                    <TableRow key={record.source === 'manual' ? `manual-${record._id}` : `csv-${record.csvIndex}`} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {record.source === 'manual' 
                              ? (record.employeeName || record.employee?.name)
                              : (record['Name'] || record['name'] || '-')
                            }
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {record.employeeCode}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {record.source === 'manual' 
                          ? `${record.month}/${record.year}`
                          : `${csvDialog.month}/${csvDialog.year}`
                        }
                      </TableCell>
                      <TableCell>
                        {record.source === 'manual' 
                          ? `₹${(record.salary || record.employee?.salary || 0).toLocaleString()}`
                          : `₹${parseFloat(record['Salary'] || record['salary'] || 0).toLocaleString()}`
                        }
                      </TableCell>
                      <TableCell>
                        {record.source === 'manual' 
                          ? (record.presentDays || record.paidDays || '-')
                          : (record['Paid Days'] || record['paidDays'] || '-')
                        }
                      </TableCell>
                      <TableCell>
                        {record.source === 'manual' 
                          ? `₹${(record.netSalary || record.employee?.netSalary || 0).toLocaleString()}`
                          : `₹${parseFloat(record['Net Salary'] || record['netSalary'] || 0).toLocaleString()}`
                        }
                      </TableCell>
                      <TableCell>
                        {record.source === 'manual' 
                          ? `₹${(record.dayWiseDeduction || record.employee?.dayWiseDeduction || 0).toLocaleString()}`
                          : `₹${parseFloat(record['Day Wise Deduction'] || record['dayWiseDeduction'] || 0).toLocaleString()}`
                        }
                      </TableCell>
                      <TableCell>
                        {record.source === 'manual' 
                          ? `₹${(record.reimbursement || 0).toLocaleString()}`
                          : `₹${parseFloat(record['Reimbursement'] || record['reimbursement'] || 0).toLocaleString()}`
                        }
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {record.source === 'manual' 
                            ? (record.note || '-')
                            : (record['Note'] || record['note'] || '-')
                          }
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {record.source === 'manual' ? (
                          <Tooltip title="Edit">
                            <IconButton 
                              size="small" 
                              color="secondary"
                              onClick={() => handleAttendanceDialogOpen(record.employee)}
                            >
                              <Edit />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title="View Details">
                              <IconButton size="small" color="info">
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                          )}
                          
                          {/* Move to Payroll Button */}
                          <Tooltip title="Move to Payroll (HR Verified)">
                            <IconButton 
                              size="small" 
                              color="success"
                              onClick={() => handleMoveToPayroll(record)}
                            >
                              <ArrowForward />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No data entered yet. Add records manually or upload CSV to see them here.
            </Typography>
          </Box>
        )}
              </>
            );
          })()}
        </Paper>

        {/* CSV Upload Dialog */}
        <Dialog
          open={attendanceDialog.open}
          onClose={handleAttendanceDialogClose}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center">
              <CalendarToday sx={{ mr: 1, color: '#2E7D32' }} />
              {attendanceDialog.employee ? 'Edit Salary & Attendance' : 'Add Salary & Attendance'}
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <Autocomplete
                    options={filteredEmployees}
                    getOptionLabel={(option) => {
                      if (!option || !option.employeeCode || !option.name) {
                        return '';
                      }
                      return `${option.employeeCode} - ${option.name}`;
                    }}
                    value={attendanceDialog.employee || null}
                    onChange={(event, newValue) => {
                      setAttendanceDialog(prev => ({ ...prev, employee: newValue }));
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Employee"
                        placeholder="Search by name, code, or email..."
                        fullWidth
                      />
                    )}
                    renderOption={(props, option) => {
                      const { key, ...otherProps } = props;
                      return (
                        <Box component="li" key={key} {...otherProps}>
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {option.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {option.employeeCode} • {option.email} • {option.department}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    }}
                    filterOptions={(options, { inputValue }) => {
                      return options.filter(option =>
                        option.name.toLowerCase().includes(inputValue.toLowerCase()) ||
                        option.employeeCode.toLowerCase().includes(inputValue.toLowerCase()) ||
                        option.email.toLowerCase().includes(inputValue.toLowerCase())
                      );
                    }}
                    noOptionsText="No employees found"
                    clearOnEscape
                    selectOnFocus
                    handleHomeEndKeys
                    isOptionEqualToValue={(option, value) => {
                      return option._id === value?._id;
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Month</InputLabel>
                    <Select
                      value={attendanceDialog.month}
                      label="Month"
                      onChange={(e) => setAttendanceDialog(prev => ({ ...prev, month: e.target.value }))}
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
                      value={attendanceDialog.year}
                      label="Year"
                      onChange={(e) => setAttendanceDialog(prev => ({ ...prev, year: e.target.value }))}
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
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Salary"
                    type="number"
                    value={attendanceDialog.salary || ''}
                    onChange={(e) => setAttendanceDialog(prev => ({ ...prev, salary: e.target.value || '' }))}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Paid Days"
                    type="number"
                    value={attendanceDialog.paidDays || 30}
                    onChange={(e) => setAttendanceDialog(prev => ({ ...prev, paidDays: parseInt(e.target.value) || 30 }))}
                    inputProps={{ min: 0, max: 31 }}
                  />
                </Grid>
                
                {/* Deduction Checkboxes */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                    Deductions
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={attendanceDialog.deductPF === true}
                          onChange={(e) => setAttendanceDialog(prev => ({ ...prev, deductPF: e.target.checked }))}
                          color="primary"
                        />
                      }
                      label="Deduct PF (Provident Fund)"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={attendanceDialog.deductESIC === true}
                          onChange={(e) => setAttendanceDialog(prev => ({ ...prev, deductESIC: e.target.checked }))}
                          color="primary"
                        />
                      }
                      label="Deduct ESIC (Employee State Insurance)"
                    />
                  </Box>
                </Grid>
                
                {/* Reimbursement and Note Fields */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Reimbursement Amount"
                    type="number"
                    value={attendanceDialog.reimbursement || ''}
                    onChange={(e) => setAttendanceDialog(prev => ({ ...prev, reimbursement: e.target.value || '' }))}
                    inputProps={{ min: 0, step: 0.01 }}
                    helperText="Additional amount to be added to net salary"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Note"
                    value={attendanceDialog.note || ''}
                    onChange={(e) => setAttendanceDialog(prev => ({ ...prev, note: e.target.value || '' }))}
                    helperText="Additional notes or remarks"
                  />
                </Grid>
                
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Net Salary (Auto-calculated)"
                    type="number"
                    value={attendanceDialog.netSalary || ''}
                    onChange={(e) => setAttendanceDialog(prev => ({ ...prev, netSalary: e.target.value || '' }))}
                    inputProps={{ min: 0, step: 0.01 }}
                    helperText="Automatically calculated based on salary, paid days, deduction settings, and reimbursement"
                    disabled
                    sx={{ backgroundColor: '#f5f5f5' }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Day Wise Deduction (Auto-calculated)"
                    type="number"
                    value={attendanceDialog.dayWiseDeduction || ''}
                    onChange={(e) => setAttendanceDialog(prev => ({ ...prev, dayWiseDeduction: e.target.value || '' }))}
                    inputProps={{ min: 0, step: 0.01 }}
                    helperText="Automatically calculated based on salary and paid days"
                    disabled
                    sx={{ backgroundColor: '#f5f5f5' }}
                  />
                </Grid>
                
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Comments"
                    multiline
                    rows={3}
                    value={attendanceDialog.comments || ''}
                    onChange={(e) => setAttendanceDialog(prev => ({ ...prev, comments: e.target.value || '' }))}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleAttendanceDialogClose}>Cancel</Button>
            <Button
              onClick={handleAttendanceSubmit}
              variant="contained"
              disabled={!attendanceDialog.employee}
              sx={{
                background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)',
                },
              }}
            >
              Save Salary & Attendance
            </Button>
          </DialogActions>
        </Dialog>

        {/* Bulk Create Dialog */}
        <Dialog
          open={bulkDialog.open}
          onClose={handleBulkDialogClose}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center">
              <People sx={{ mr: 1, color: '#2E7D32' }} />
              Bulk Create Attendance Records
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Month</InputLabel>
                    <Select
                      value={bulkDialog.month}
                      label="Month"
                      onChange={(e) => setBulkDialog(prev => ({ ...prev, month: e.target.value }))}
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
                      value={bulkDialog.year}
                      label="Year"
                      onChange={(e) => setBulkDialog(prev => ({ ...prev, year: e.target.value }))}
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
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Total Working Days"
                    type="number"
                    value={bulkDialog.totalWorkingDays}
                    onChange={(e) => setBulkDialog(prev => ({ ...prev, totalWorkingDays: parseInt(e.target.value) }))}
                    inputProps={{ min: 1, max: 31 }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Default Present Days"
                    type="number"
                    value={bulkDialog.defaultPresentDays}
                    onChange={(e) => setBulkDialog(prev => ({ ...prev, defaultPresentDays: parseInt(e.target.value) }))}
                    inputProps={{ min: 0 }}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleBulkDialogClose}>Cancel</Button>
            <Button
              onClick={handleBulkCreate}
              variant="contained"
              sx={{
                background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)',
                },
              }}
            >
              Create Records
            </Button>
          </DialogActions>
        </Dialog>

        {/* CSV Upload Dialog */}
        <Dialog
          open={csvDialog.open}
          onClose={handleCsvDialogClose}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center">
              <CloudUpload sx={{ mr: 1, color: '#2E7D32' }} />
              Upload Salary Sheet CSV
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Month</InputLabel>
                    <Select
                      value={csvDialog.month}
                      label="Month"
                      onChange={(e) => setCsvDialog(prev => ({ ...prev, month: e.target.value }))}
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
                      value={csvDialog.year}
                      label="Year"
                      onChange={(e) => setCsvDialog(prev => ({ ...prev, year: e.target.value }))}
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
                  <Box sx={{ border: '2px dashed #ccc', borderRadius: 2, p: 3, textAlign: 'center' }}>
                    <input
                      accept=".csv"
                      style={{ display: 'none' }}
                      id="csv-upload"
                      type="file"
                      onChange={handleFileUpload}
                    />
                    <label htmlFor="csv-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<FileUpload />}
                        sx={{ mb: 2 }}
                      >
                        Choose CSV File
                      </Button>
                    </label>
                    <Typography variant="body2" color="text.secondary">
                      {csvDialog.file ? csvDialog.file.name : 'No file selected'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Expected format: Emp Code, Name, Salary, Paid Days, Net Salary, Day Wise Deduction
                    </Typography>
                  </Box>
                </Grid>
                
                {/* Sample CSV Download */}
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                    <Download sx={{ color: '#2E7D32' }} />
                    <Typography variant="body2" sx={{ flexGrow: 1 }}>
                      Need help with the format? Download our sample CSV file:
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<Download />}
                      onClick={handleSampleCsvDownload}
                      sx={{
                        borderColor: '#2E7D32',
                        color: '#2E7D32',
                        '&:hover': {
                          borderColor: '#1B5E20',
                          backgroundColor: '#E8F5E8'
                        }
                      }}
                    >
                      Download Sample CSV
                    </Button>
                  </Box>
                </Grid>
                {csvDialog.preview.length > 0 && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Preview (First 10 rows):
                    </Typography>
                    <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            {Object.keys(csvDialog.preview[0] || {}).map((header) => (
                              <TableCell key={header} sx={{ fontWeight: 600 }}>
                                {header}
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {csvDialog.preview.map((row, index) => (
                            <TableRow key={index}>
                              {Object.values(row).map((value, cellIndex) => (
                                <TableCell key={cellIndex}>{value}</TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                )}
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCsvDialogClose}>Cancel</Button>
            <Button
              onClick={handleCsvUpload}
              variant="contained"
              disabled={!csvDialog.file}
              sx={{
                background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)',
                },
              }}
            >
              Upload CSV
            </Button>
          </DialogActions>
        </Dialog>

        {/* Move to Payroll Confirmation Dialog */}
        <Dialog
          open={confirmDialog.open}
          onClose={handleCancelMoveToPayroll}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center">
              <AttachMoney sx={{ mr: 1, color: '#2E7D32' }} />
              Move to Payroll Confirmation
            </Box>
          </DialogTitle>
          <DialogContent>
            {confirmDialog.record && (
              <Box sx={{ pt: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                  Are you sure you want to move this employee to Payroll?
                </Typography>
                
                <Box sx={{ mb: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
                    {confirmDialog.record.source === 'manual' 
                      ? (confirmDialog.record.employeeName || confirmDialog.record.employee?.name)
                      : (confirmDialog.record['Name'] || confirmDialog.record['name'])
                    }
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Employee Code: {confirmDialog.record.employeeCode}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Month/Year: {confirmDialog.record.source === 'manual' 
                      ? `${confirmDialog.record.month}/${confirmDialog.record.year}`
                      : `${csvDialog.month}/${csvDialog.year}`
                    }
                  </Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Salary Details:
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Basic Salary:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      ₹{(confirmDialog.record.salary || confirmDialog.record.employee?.salary || confirmDialog.record['Salary'])?.toLocaleString() || 'N/A'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Net Salary:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
                      ₹{(confirmDialog.record.netSalary || confirmDialog.record.employee?.netSalary || confirmDialog.record['Net Salary'])?.toLocaleString() || 'N/A'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Paid Days:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {confirmDialog.record.paidDays || confirmDialog.record.employee?.paidDays || confirmDialog.record['Paid Days'] || 'N/A'}
                    </Typography>
                  </Box>
                </Box>

                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    This action will:
                  </Typography>
                  <Typography variant="body2" component="ul" sx={{ mt: 1, mb: 0 }}>
                    <li>Mark the record as HR verified</li>
                    <li>Move it to the payroll processing queue</li>
                    <li>Remove it from the attendance management list</li>
                  </Typography>
                </Alert>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button
              onClick={handleCancelMoveToPayroll}
              color="inherit"
              variant="outlined"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmMoveToPayroll}
              color="success"
              variant="contained"
              sx={{ ml: 1 }}
            >
              Move to Payroll
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

export default AttendanceManagement;
