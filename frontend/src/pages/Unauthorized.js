import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Unauthorized = () => {
  const navigate = useNavigate();
  return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Typography variant="h3" gutterBottom sx={{ fontWeight: 700, color: '#F44336' }}>
        403 - Unauthorized
      </Typography>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        You don't have permission to view this page.
      </Typography>
      <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/')}>Go to Dashboard</Button>
    </Box>
  );
};

export default Unauthorized;


