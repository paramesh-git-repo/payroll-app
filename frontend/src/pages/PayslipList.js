import React, { useState, useEffect } from 'react';
import Grid from '@mui/material/Grid';
import {
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment
} from '@mui/material';
import {
  Add,
  Download,
  Visibility,
  Search,
  Email,
  Send
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axios';

const PayslipList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [payslips, setPayslips] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [generateDialog, setGenerateDialog] = useState({ 
    open: false, 
    employee: '', 
    month: '', 
    year: '',
    sendEmail: false
  });
  const [selectedPayslips, setSelectedPayslips] = useState([]);
  const [emailDialog, setEmailDialog] = useState({
    open: false,
    payslipId: null,
    employeeName: ''
  });

  useEffect(() => {
    fetchPayslips();
    if (user?.role === 'admin') {
      fetchEmployees();
    }
  }, [page, search, month, year, employeeCode, user]);

  const fetchPayslips = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      
      if (search) params.append('search', search);
      if (month) params.append('month', month);
      if (year) params.append('year', year);
      if (employeeCode) params.append('employeeCode', employeeCode);

      const response = await api.get(`/api/payslips?${params}`);
      setPayslips(response.data.data);
      setTotalPages(response.data.pages);
    } catch (error) {
      console.error('Error fetching payslips:', error);
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

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleMonthChange = (e) => {
    setMonth(e.target.value);
    setPage(1);
  };

  const handleYearChange = (e) => {
    setYear(e.target.value);
    setPage(1);
  };

  const handleEmployeeCodeChange = (e) => {
    setEmployeeCode(e.target.value);
    setPage(1);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleGenerateClick = () => {
    setGenerateDialog({ open: true, employee: '', month: '', year: '' });
  };

  const handleGenerateConfirm = async () => {
    try {
      const { employee, month, year, sendEmail } = generateDialog;
      
      // Validate required fields
      if (!employee || !month || !year) {
        alert('Please select employee, month, and year');
        return;
      }
      
      // Debug logging
      console.log('Generating payslip with data:', {
        employeeId: employee,
        month: parseInt(month),
        year: parseInt(year),
        sendEmail: sendEmail
      });
      
      const response = await api.post('/api/payslips/generate', {
        employeeId: employee,
        month: parseInt(month),
        year: parseInt(year),
        sendEmail: sendEmail
      });
      
      if (sendEmail && response.data.emailSent) {
        alert('Payslip generated and email sent successfully!');
      } else if (sendEmail && !response.data.emailSent) {
        alert(`Payslip generated but email failed: ${response.data.emailError}`);
      } else {
        alert('Payslip generated successfully!');
      }
      
      setGenerateDialog({ open: false, employee: '', month: '', year: '', sendEmail: false });
      fetchPayslips();
    } catch (error) {
      console.error('Error generating payslip:', error);
      
      // Show more detailed error message
      let errorMessage = 'Error generating payslip';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        errorMessage = error.response.data.errors.map(err => err.msg).join(', ');
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    }
  };

  const handleGenerateCancel = () => {
    setGenerateDialog({ open: false, employee: '', month: '', year: '', sendEmail: false });
  };

  // Email functions
  const handleSendEmail = async (payslipId, employeeName) => {
    try {
      console.log('Sending email for payslip:', payslipId);
      console.log('Full URL:', `${api.defaults.baseURL}/api/payslips/${payslipId}/send-email`);
      
      // First check if payslip exists
      const payslipCheck = await api.get(`/api/payslips/${payslipId}`);
      console.log('Payslip exists:', payslipCheck.data);
      
      const response = await api.post(`/api/payslips/${payslipId}/send-email`);
      
      if (response.data.success) {
        const totalSends = response.data.data?.totalSends || 1;
        alert(`Email sent successfully to ${employeeName}! (${totalSends} total sends)`);
        fetchPayslips(); // Refresh to update email status
      } else {
        alert(`Failed to send email: ${response.data.data.error}`);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      
      // Show more detailed error message
      let errorMessage = 'Error sending email';
      if (error.response?.status === 404) {
        errorMessage = 'Payslip not found or email endpoint not available';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    }
  };

  const handleBulkEmailSend = async () => {
    if (selectedPayslips.length === 0) {
      alert('Please select payslips to send emails');
      return;
    }

    try {
      const response = await api.post('/api/payslips/send-bulk-emails', {
        payslipIds: selectedPayslips
      });
      
      const { successful, failed, results } = response.data.data;
      alert(`Bulk email sending completed!\nSuccessful: ${successful}\nFailed: ${failed}`);
      
      setSelectedPayslips([]);
      fetchPayslips(); // Refresh to update email status
    } catch (error) {
      console.error('Error sending bulk emails:', error);
      alert('Error sending bulk emails');
    }
  };

  const handlePayslipSelect = (payslipId) => {
    setSelectedPayslips(prev => 
      prev.includes(payslipId) 
        ? prev.filter(id => id !== payslipId)
        : [...prev, payslipId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPayslips.length === payslips.length) {
      setSelectedPayslips([]);
    } else {
      setSelectedPayslips(payslips.map(p => p._id));
    }
  };

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

  const getMonthName = (monthNumber) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNumber - 1];
  };

  return (
    <Box sx={{ width: '100%', py: 4, px: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 700, color: '#2E7D32' }}>
            Payslip Management
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Generate and manage employee payslips
          </Typography>
        </Box>
        {user?.role === 'admin' && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            {selectedPayslips.length > 0 && (
              <Button
                variant="outlined"
                startIcon={<Send />}
                onClick={handleBulkEmailSend}
                sx={{
                  py: 1.5,
                  px: 3,
                  borderRadius: 2,
                  borderColor: '#2E7D32',
                  color: '#2E7D32',
                  '&:hover': {
                    borderColor: '#1B5E20',
                    backgroundColor: '#f5f5f5'
                  },
                }}
              >
                Send Emails ({selectedPayslips.length})
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleGenerateClick}
              sx={{
                py: 1.5,
                px: 3,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(46, 125, 50, 0.3)',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              Generate Payslip
            </Button>
          </Box>
        )}
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#2E7D32' }}>
          Filter Payslips
        </Typography>

        <Grid container spacing={3} alignItems="center">
          {/* Make search span half the row on md+ */}
          <Grid xs={12} md={6}>
            <TextField
              label="Search"
              variant="outlined"
              size="small"
              value={search}
              onChange={handleSearch}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Give Month/Year/Employee 2 columns each (and min widths) */}
          <Grid xs={12} sm={6} md={2}>
            <FormControl size="small" fullWidth sx={{ minWidth: 200 }}>
              <InputLabel>Month</InputLabel>
              <Select value={month} label="Month" onChange={handleMonthChange}>
                <MenuItem value="">All Months</MenuItem>
                {Array.from({ length: 12 }, (_, i) => (
                  <MenuItem key={i + 1} value={i + 1}>
                    {getMonthName(i + 1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid xs={12} sm={6} md={2}>
            <FormControl size="small" fullWidth sx={{ minWidth: 200 }}>
              <InputLabel>Year</InputLabel>
              <Select value={year} label="Year" onChange={handleYearChange}>
                <MenuItem value="">All Years</MenuItem>
                {Array.from({ length: 5 }, (_, i) => {
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

          {user?.role === 'admin' && (
            <Grid xs={12} sm={6} md={2}>
              <FormControl size="small" fullWidth sx={{ minWidth: 240 }}>
                <InputLabel>Employee</InputLabel>
                <Select
                  value={employeeCode}
                  label="Employee"
                  onChange={handleEmployeeCodeChange}
                >
                  <MenuItem value="">All Employees</MenuItem>
                  {employees.map((e) => (
                    <MenuItem key={e._id} value={e.employeeCode}>
                      {e.employeeCode} - {e.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Payslip Table */}
      <Paper sx={{ borderRadius: 2, boxShadow: 2 }}>
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
            Payslip Records
          </Typography>
        </Box>
        <TableContainer sx={{ width: '100%' }}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                {user?.role === 'admin' && (
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    <input
                      type="checkbox"
                      checked={selectedPayslips.length === payslips.length && payslips.length > 0}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                )}
                <TableCell sx={{ fontWeight: 'bold' }}>Employee</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Code</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Month/Year</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Paid Days</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Leaves</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Net Salary</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Email Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={user?.role === 'admin' ? 10 : 8} align="center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : payslips.length > 0 ? (
                payslips.map((payslip) => (
                  <TableRow key={payslip._id}>
                    {user?.role === 'admin' && (
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedPayslips.includes(payslip._id)}
                          onChange={() => handlePayslipSelect(payslip._id)}
                        />
                      </TableCell>
                    )}
                    <TableCell>{payslip.employeeName}</TableCell>
                    <TableCell>{payslip.employeeCode}</TableCell>
                    <TableCell>{getMonthName(payslip.month)} {payslip.year}</TableCell>
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
                      <Chip
                        label={payslip.emailSent ? 'Sent' : 'Not Sent'}
                        color={payslip.emailSent ? 'success' : 'default'}
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
                      {user?.role === 'admin' && (
                        <IconButton
                          size="small"
                          onClick={() => handleSendEmail(payslip._id, payslip.employeeName)}
                          title={payslip.emailSent ? "Resend Email" : "Send Email"}
                          sx={{
                            color: payslip.emailSent ? '#2E7D32' : 'primary.main',
                            '&:hover': {
                              backgroundColor: payslip.emailSent ? '#e8f5e8' : 'primary.light'
                            }
                          }}
                        >
                          <Email />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={user?.role === 'admin' ? 10 : 8} align="center">
                    No payslips found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {totalPages > 1 && (
          <Box display="flex" justifyContent="center" p={2}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        )}
      </Paper>

      {/* Generate Payslip Dialog */}
      <Dialog
        open={generateDialog.open}
        onClose={handleGenerateCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Generate Payslip</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Employee</InputLabel>
              <Select
                value={generateDialog.employee}
                label="Employee"
                onChange={(e) => setGenerateDialog(prev => ({ ...prev, employee: e.target.value }))}
              >
                {employees.map((employee) => (
                  <MenuItem key={employee._id} value={employee._id}>
                    {employee.employeeCode} - {employee.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
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
            <FormControl fullWidth margin="normal">
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
            <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <input
                  type="checkbox"
                  id="sendEmail"
                  checked={generateDialog.sendEmail}
                  onChange={(e) => setGenerateDialog(prev => ({ ...prev, sendEmail: e.target.checked }))}
                />
                <label htmlFor="sendEmail" style={{ cursor: 'pointer' }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
                    📧 Send payslip via email to employee
                  </Typography>
                </label>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ ml: 4, display: 'block' }}>
                Employee will receive a professional email with payslip download link
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleGenerateCancel}>Cancel</Button>
          <Button 
            onClick={handleGenerateConfirm}
            variant="contained"
            disabled={!generateDialog.employee || !generateDialog.month || !generateDialog.year}
          >
            {generateDialog.sendEmail ? 'Generate & Send Email' : 'Generate'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PayslipList;
