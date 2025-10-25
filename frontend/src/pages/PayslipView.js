import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  ArrowBack,
  Download,
  Print
} from '@mui/icons-material';
import { useReactToPrint } from 'react-to-print';
import { useRef } from 'react';
import api from '../utils/axios';

const PayslipView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const componentRef = useRef();
  
  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPayslip();
  }, [id]);

  const fetchPayslip = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/payslips/${id}`);
      setPayslip(response.data.data);
    } catch (error) {
      console.error('Error fetching payslip:', error);
      setError('Failed to load payslip');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await api.get(`/api/payslips/${id}/pdf`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payslip-${payslip.employeeCode}-${payslip.month}-${payslip.year}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Payslip-${payslip?.employeeCode}-${payslip?.month}-${payslip?.year}`,
  });

  const getMonthName = (monthNumber) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNumber - 1];
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', py: 4, px: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ width: '100%', py: 4, px: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/payslips')}
          sx={{ mt: 2 }}
        >
          Back to Payslips
        </Button>
      </Box>
    );
  }

  if (!payslip) {
    return (
      <Box sx={{ width: '100%', py: 4, px: 4 }}>
        <Typography>Payslip not found</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', py: 4, px: 4 }}>
      {/* Header with Actions */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/payslips')}
        >
          Back to Payslips
        </Button>
        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={handleDownloadPDF}
          >
            Download PDF
          </Button>
          <Button
            variant="contained"
            startIcon={<Print />}
            onClick={handlePrint}
          >
            Print
          </Button>
        </Box>
      </Box>

      {/* Payslip Content */}
      <Paper ref={componentRef} elevation={3} sx={{ p: 4 }}>
        {/* Header */}
        <Box textAlign="center" mb={4}>
          <Typography variant="h4" color="primary" gutterBottom>
            PAYROLL MANAGEMENT SYSTEM
          </Typography>
          <Typography variant="h5" gutterBottom>
            PAYSLIP FOR {getMonthName(payslip.month).toUpperCase()} {payslip.year}
          </Typography>
        </Box>

        {/* Employee Information */}
        <Grid container spacing={4} mb={4}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom color="primary">
              Employee Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box>
              <Typography variant="body1" gutterBottom>
                <strong>Employee Code:</strong> {payslip.employeeCode}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Name:</strong> {payslip.employeeName}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Department:</strong> {payslip.department || 'N/A'}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Designation:</strong> {payslip.designation || 'N/A'}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom color="primary">
              Pay Period
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box>
              <Typography variant="body1" gutterBottom>
                <strong>Month:</strong> {getMonthName(payslip.month)} {payslip.year}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Paid Days:</strong> {payslip.paidDays}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Leaves:</strong> {payslip.leaves}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Generated On:</strong> {new Date(payslip.generatedAt).toLocaleDateString()}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Salary Breakdown Table */}
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Description</strong></TableCell>
                <TableCell align="right"><strong>Amount (₹)</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Earnings */}
              <TableRow sx={{ backgroundColor: '#e8f5e8' }}>
                <TableCell><strong>EARNINGS</strong></TableCell>
                <TableCell></TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Basic Salary</TableCell>
                <TableCell align="right">{payslip.basic.toLocaleString()}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>House Rent Allowance (HRA)</TableCell>
                <TableCell align="right">{payslip.hra.toLocaleString()}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Conveyance Allowance</TableCell>
                <TableCell align="right">{payslip.conveyance.toLocaleString()}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Other Allowance</TableCell>
                <TableCell align="right">{payslip.otherAllowance.toLocaleString()}</TableCell>
              </TableRow>
              <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                <TableCell><strong>Total Earnings</strong></TableCell>
                <TableCell align="right">
                  <strong>{(payslip.basic + payslip.hra + payslip.conveyance + payslip.otherAllowance).toLocaleString()}</strong>
                </TableCell>
              </TableRow>
              
              {/* Deductions */}
              <TableRow sx={{ backgroundColor: '#ffe8e8' }}>
                <TableCell><strong>DEDUCTIONS</strong></TableCell>
                <TableCell></TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Provident Fund (PF)</TableCell>
                <TableCell align="right">{payslip.pf.toLocaleString()}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Employee State Insurance (ESIC)</TableCell>
                <TableCell align="right">{payslip.esic.toLocaleString()}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Day Wise Deduction</TableCell>
                <TableCell align="right">{payslip.dayWiseDeduction.toLocaleString()}</TableCell>
              </TableRow>
              <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                <TableCell><strong>Total Deductions</strong></TableCell>
                <TableCell align="right">
                  <strong>{(payslip.pf + payslip.esic + payslip.dayWiseDeduction).toLocaleString()}</strong>
                </TableCell>
              </TableRow>
              
              {/* Net Salary */}
              <TableRow sx={{ backgroundColor: '#e8f0ff' }}>
                <TableCell><strong>NET SALARY</strong></TableCell>
                <TableCell align="right">
                  <strong>₹ {payslip.netSalary.toLocaleString()}</strong>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {/* Status */}
        <Box mt={3} textAlign="center">
          <Chip
            label={payslip.isPaid ? 'PAID' : 'PENDING'}
            color={payslip.isPaid ? 'success' : 'warning'}
            size="large"
            sx={{ fontSize: '1rem', fontWeight: 'bold' }}
          />
          {payslip.isPaid && payslip.paidAt && (
            <Typography variant="body2" color="text.secondary" mt={1}>
              Paid on: {new Date(payslip.paidAt).toLocaleDateString()}
            </Typography>
          )}
        </Box>

        {/* Footer */}
        <Box mt={4} textAlign="center">
          <Typography variant="body2" color="text.secondary">
            This is a computer generated payslip and does not require a signature.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Generated on {new Date().toLocaleString()}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default PayslipView;
