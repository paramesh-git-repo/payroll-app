import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import api from '../utils/axios';

const PayslipPDF = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const downloadPDF = async () => {
      try {
        // Make request to backend PDF endpoint
        const response = await api.get(`/api/payslips/${id}/pdf`, {
          responseType: 'blob', // Important for binary data
        });

        // Create blob URL
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);

        // Create temporary link element and trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = `payslip-${id}.pdf`;
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        // Navigate back to payslips list after successful download
        navigate('/payslips');
      } catch (error) {
        console.error('Error downloading PDF:', error);
        // Navigate back to payslips list on error
        navigate('/payslips');
      }
    };

    downloadPDF();
  }, [id, navigate]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        p: 4,
      }}
    >
      <CircularProgress size={60} sx={{ mb: 3 }} />
      <Typography variant="h6" color="primary" gutterBottom>
        Downloading Payslip PDF...
      </Typography>
      <Typography variant="body2" color="text.secondary" textAlign="center">
        Please wait while we prepare your payslip for download.
        <br />
        You will be redirected automatically.
      </Typography>
    </Box>
  );
};

export default PayslipPDF;
