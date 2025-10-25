import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Card,
  CardContent,
  InputAdornment,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { 
  Save, 
  Cancel, 
  Person, 
  Email, 
  Work, 
  AttachMoney, 
  CalendarToday,
  Badge,
  BusinessCenter,
  Assignment,
  CloudUpload,
  FileUpload,
  CheckCircle,
  Error
} from '@mui/icons-material';
import api from '../utils/axios';

const EmployeeForm = ({ employee = null, mode = 'add', onSuccess = null, onCancel = null }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  // Determine if this is edit mode based on props or URL params
  const isEdit = mode === 'edit' || Boolean(id);
  const isView = mode === 'view';

  const [formData, setFormData] = useState({
    employeeCode: '',
    name: '',
    email: '',
    phone: '',
    salary: '',
    paidDays: 30,
    leaves: 0,
    department: '',
    designation: '',
    joiningDate: '',
    isActive: true,
    deductPF: true,
    deductESIC: true
  });

  // Calculated salary components
  const [calculatedSalary, setCalculatedSalary] = useState({
    basic: 0,
    hra: 0,
    conveyance: 1600,
    otherAllowance: 0,
    pf: 0,
    esic: 0,
    dayWiseDeduction: 0,
    netSalary: 0
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  
  // File upload states
  const [uploadDialog, setUploadDialog] = useState({ open: false });
  const [uploadedFile, setUploadedFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (isEdit) {
      fetchEmployee();
    } else {
      // For new employees, calculate initial salary components
      calculateSalaryComponents();
    }
  }, [id, isEdit]);

  // Calculate salary components whenever salary or paid days change
  useEffect(() => {
    calculateSalaryComponents();
  }, [formData.salary, formData.paidDays, formData.deductPF, formData.deductESIC]);

  // Function to calculate salary components using the same formulas as backend
  const calculateSalaryComponents = () => {
    const salary = parseFloat(formData.salary) || 0;
    const paidDays = parseInt(formData.paidDays) || 30;
    
    // Ensure paidDays is within valid range
    const validPaidDays = Math.max(0, Math.min(31, paidDays));
    
    if (salary <= 0 || isNaN(salary)) {
      setCalculatedSalary({
        basic: 0,
        hra: 0,
        conveyance: 1600,
        otherAllowance: 0,
        pf: 0,
        esic: 0,
        dayWiseDeduction: 0,
        netSalary: 0
      });
      return;
    }

    // Basic = Salary * 40%
    const basic = Math.round(salary * 0.4);
    
    // HRA = Basic * 50%
    const hra = Math.round(basic * 0.5);
    
    // Conveyance = Fixed 1600
    const conveyance = 1600;
    
    // Other Allowance = Salary - (Basic + HRA + Conveyance)
    const otherAllowance = Math.round(salary - (basic + hra + conveyance));
    
    // PF = MIN(Basic * 12%, 1800)
    const pf = Math.min(Math.round(basic * 0.12), 1800);
    
    // ESIC = IF(Salary <= 21000, ROUND(Salary * 0.75%, 0), 0)
    const esic = salary <= 21000 ? Math.round(salary * 0.0075) : 0;
    
    // Day Wise Deduction = ROUND((Salary / 30) * (30 - Paid Days), 0)
    const dayWiseDeduction = Math.round((salary / 30) * (30 - validPaidDays));
    
    // Net Salary = (Basic + HRA + Conveyance + Other Allowance) - PF - ESIC - Day Wise Deduction
    const netSalary = Math.round((basic + hra + conveyance + otherAllowance) - pf - esic - dayWiseDeduction);

    setCalculatedSalary({
      basic,
      hra,
      conveyance,
      otherAllowance,
      pf,
      esic,
      dayWiseDeduction,
      netSalary
    });
  };

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      
      // If employee prop is provided (modal mode), use it directly
      if (employee) {
        setFormData({
          employeeCode: employee.employeeCode || '',
          name: employee.name || '',
          email: employee.email || '',
          phone: employee.phone || '',
          salary: employee.salary || '',
          paidDays: employee.paidDays || 30,
          leaves: employee.leaves || 0,
          department: employee.department || '',
          designation: employee.designation || '',
          joiningDate: employee.joiningDate ? employee.joiningDate.split('T')[0] : '',
          isActive: employee.isActive !== undefined ? employee.isActive : true
        });
        setLoading(false);
        return;
      }
      
      // Otherwise fetch from API (routing mode)
      const response = await api.get(`/api/employees/${id}`);
      const fetchedEmployee = response.data.data;
      
      setFormData({
        employeeCode: fetchedEmployee.employeeCode || '',
        name: fetchedEmployee.name || '',
        email: fetchedEmployee.email || '',
        phone: fetchedEmployee.phone || '',
        salary: fetchedEmployee.salary || '',
        paidDays: fetchedEmployee.paidDays || 30,
        leaves: fetchedEmployee.leaves || 0,
        department: fetchedEmployee.department || '',
        designation: fetchedEmployee.designation || '',
        joiningDate: fetchedEmployee.joiningDate ? fetchedEmployee.joiningDate.split('T')[0] : '',
        isActive: fetchedEmployee.isActive !== undefined ? fetchedEmployee.isActive : true
      });

      // Set calculated salary components for existing employee
      setCalculatedSalary({
        basic: fetchedEmployee.basic || 0,
        hra: fetchedEmployee.hra || 0,
        conveyance: fetchedEmployee.conveyance || 1600,
        otherAllowance: fetchedEmployee.otherAllowance || 0,
        pf: fetchedEmployee.pf || 0,
        esic: fetchedEmployee.esic || 0,
        dayWiseDeduction: fetchedEmployee.dayWiseDeduction || 0,
        netSalary: fetchedEmployee.netSalary || 0
      });
    } catch (error) {
      console.error('Error fetching employee:', error);
      setError('Failed to load employee data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Ensure we always have a string value for text inputs
    const processedValue = value === undefined ? '' : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Employee Code validation
    if (!formData.employeeCode.trim()) {
      newErrors.employeeCode = 'Employee code is required';
    } else if (!/^[A-Z]{2}\d{4}$/.test(formData.employeeCode.trim())) {
      newErrors.employeeCode = 'Employee code must be in format: XX1234 (2 letters + 4 digits)';
    }

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (!/^[a-zA-Z\s]+$/.test(formData.name.trim())) {
      newErrors.name = 'Name can only contain letters and spaces';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation (optional but if provided, should be valid)
    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Salary validation
    if (!formData.salary || formData.salary <= 0) {
      newErrors.salary = 'Salary must be a positive number';
    } else if (formData.salary < 10000) {
      newErrors.salary = 'Salary must be at least ₹10,000';
    }

    // Paid days validation
    if (formData.paidDays < 0 || formData.paidDays > 31) {
      newErrors.paidDays = 'Paid days must be between 0 and 31';
    }

    // Leaves validation
    if (formData.leaves < 0) {
      newErrors.leaves = 'Leaves cannot be negative';
    }

    // Joining date validation
    if (formData.joiningDate) {
      const joiningDate = new Date(formData.joiningDate);
      const today = new Date();
      if (joiningDate > today) {
        newErrors.joiningDate = 'Joining date cannot be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitLoading(true);
      setError('');

      // Client-side validation
      if (!formData.employeeCode.trim()) {
        setError('Employee code is required');
        return;
      }
      if (!formData.name.trim()) {
        setError('Name is required');
        return;
      }
      if (!formData.email.trim()) {
        setError('Email is required');
        return;
      }
      if (!formData.salary || parseFloat(formData.salary) <= 0) {
        setError('Salary must be a positive number');
        return;
      }

      const submitData = {
        employeeCode: formData.employeeCode.trim(),
        name: formData.name.trim(),
        email: formData.email.trim(),
        salary: parseFloat(formData.salary),
        paidDays: parseInt(formData.paidDays) || 30,
        leaves: parseInt(formData.leaves) || 0,
        department: formData.department?.trim() || '',
        designation: formData.designation?.trim() || ''
      };

      if (isEdit) {
        // Use employee._id if in modal mode, otherwise use URL param id
        const employeeId = employee?._id || id;
        console.log('Edit mode - Employee ID:', employeeId);
        console.log('Employee prop:', employee);
        console.log('Employee _id:', employee?._id);
        console.log('URL param id:', id);
        console.log('Mode:', mode);
        console.log('isEdit:', isEdit);
        
        if (!employeeId) {
          setError('Employee ID not found');
          return;
        }
        await api.put(`/api/employees/${employeeId}`, submitData);
      } else {
        console.log('Create mode - creating new employee');
        await api.post('/api/employees', submitData);
      }

      // Handle success based on mode
      if (onSuccess) {
        // Modal mode - call success callback
        const message = isEdit ? 'Employee updated successfully!' : 'Employee created successfully!';
        onSuccess(message);
      } else {
        // Routing mode - navigate back
        navigate('/employees');
      }
    } catch (error) {
      console.error('Error saving employee:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'Failed to save employee';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        // Handle validation errors
        const validationErrors = error.response.data.errors.map(err => err.msg).join(', ');
        errorMessage = `Validation errors: ${validationErrors}`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      // Modal mode - call cancel callback
      onCancel();
    } else {
      // Routing mode - navigate back
      navigate('/employees');
    }
  };

  // File upload functions
  const handleUploadDialogOpen = () => {
    setUploadDialog({ open: true });
    setUploadedFile(null);
    setParsedData([]);
    setUploadResult(null);
  };

  const handleUploadDialogClose = () => {
    setUploadDialog({ open: false });
    setUploadedFile(null);
    setParsedData([]);
    setUploadResult(null);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedFile(file);
      parseCSVFile(file);
    }
  };

  const parseCSVFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      // Field mapping from CSV headers to backend expected fields
      const fieldMapping = {
        'name': 'name',
        'email': 'email',
        'employeecode': 'employeeCode',
        'department': 'department',
        'designation': 'designation',
        'salary': 'salary',
        'phone': 'phone',
        'joiningdate': 'joiningDate',
        'isactive': 'isActive',
        'paiddays': 'paidDays',
        'leaves': 'leaves'
      };
      
      const data = [];
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',').map(v => v.trim());
          const row = {};
          headers.forEach((header, index) => {
            const mappedField = fieldMapping[header] || header;
            row[mappedField] = values[index] || '';
          });
          data.push(row);
        }
      }
      
      setParsedData(data);
    };
    reader.readAsText(file);
  };

  const handleBulkUpload = async () => {
    if (parsedData.length === 0) {
      setSnackbar({
        open: true,
        message: 'No data to upload',
        severity: 'error'
      });
      return;
    }

    try {
      setUploadLoading(true);
      
      // Debug: Log the data being sent
      console.log('Sending employee data:', parsedData);
      
      const response = await api.post('/api/employees/bulk-upload', {
        employees: parsedData
      });

      console.log('Upload response:', response.data);
      setUploadResult(response.data);
      setSnackbar({
        open: true,
        message: `Successfully created ${response.data.data.created} employees`,
        severity: 'success'
      });

      // Close dialog after 5 seconds and refresh the page
      setTimeout(() => {
        handleUploadDialogClose();
        // Force refresh the employee list by navigating away and back
        navigate('/employees');
        window.location.reload(); // Force page refresh to ensure data is loaded
      }, 5000);

    } catch (error) {
      console.error('Bulk upload error:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to upload employees',
        severity: 'error'
      });
    } finally {
      setUploadLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
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

  return (
    <Box sx={{ width: '100%', py: 4, px: 4 }}>
      <Box sx={{ maxWidth: '1000px', mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#2E7D32', mb: 1 }}>
                {isEdit ? 'Edit Employee' : 'Add New Employee'}
              </Typography>
              <Typography variant="h6" color="text.secondary">
                {isEdit ? 'Update employee information and settings' : 'Create a new employee profile'}
              </Typography>
            </Box>
            {!isEdit && (
              <Button
                variant="outlined"
                startIcon={<CloudUpload />}
                onClick={handleUploadDialogOpen}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1.5,
                  borderColor: '#2E7D32',
                  color: '#2E7D32',
                  '&:hover': {
                    borderColor: '#1B5E20',
                    backgroundColor: 'rgba(46, 125, 50, 0.04)',
                  },
                }}
              >
                Bulk Upload
              </Button>
            )}
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Basic Information Card */}
            <Grid size={{ xs: 12 }}>
              <Card elevation={2} sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Person sx={{ mr: 1, color: '#2E7D32' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Basic Information
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 3 }} />
                  
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Employee Code"
                        name="employeeCode"
                        value={formData.employeeCode}
                        onChange={handleChange}
                        error={!!errors.employeeCode}
                        helperText={errors.employeeCode || 'Format: XX1234 (2 letters + 4 digits)'}
                        disabled={isEdit || isView}
                        required
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Badge />
                            </InputAdornment>
                          ),
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        error={!!errors.name}
                        helperText={errors.name}
                        disabled={isView}
                        required
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Person />
                            </InputAdornment>
                          ),
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        error={!!errors.email}
                        helperText={errors.email}
                        disabled={isView}
                        required
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Email />
                            </InputAdornment>
                          ),
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        error={!!errors.phone}
                        helperText={errors.phone || 'Optional'}
                        disabled={isView}
                        placeholder="+91 9876543210"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Joining Date"
                        name="joiningDate"
                        type="date"
                        value={formData.joiningDate}
                        onChange={handleChange}
                        error={!!errors.joiningDate}
                        helperText={errors.joiningDate || 'Employee joining date'}
                        disabled={isView}
                        InputLabelProps={{ shrink: true }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <CalendarToday />
                            </InputAdornment>
                          ),
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth>
                        <InputLabel>Status</InputLabel>
                        <Select
                          name="isActive"
                          value={formData.isActive}
                          label="Status"
                          onChange={handleChange}
                          sx={{ borderRadius: 2 }}
                        >
                          <MenuItem value={true}>
                            <Chip label="Active" color="success" size="small" sx={{ mr: 1 }} />
                            Active
                          </MenuItem>
                          <MenuItem value={false}>
                            <Chip label="Inactive" color="default" size="small" sx={{ mr: 1 }} />
                            Inactive
                          </MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Work Information Card */}
            <Grid size={{ xs: 12 }}>
              <Card elevation={2} sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Work sx={{ mr: 1, color: '#2E7D32' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Work Information
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 3 }} />
                  
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth>
                        <InputLabel>Department</InputLabel>
                        <Select
                          name="department"
                          value={formData.department}
                          label="Department"
                          onChange={handleChange}
                          sx={{ borderRadius: 2 }}
                        >
                          <MenuItem value="">Select Department</MenuItem>
                          <MenuItem value="IT">IT</MenuItem>
                          <MenuItem value="HR">HR</MenuItem>
                          <MenuItem value="Finance">Finance</MenuItem>
                          <MenuItem value="Marketing">Marketing</MenuItem>
                          <MenuItem value="Operations">Operations</MenuItem>
                          <MenuItem value="Sales">Sales</MenuItem>
                          <MenuItem value="Customer Support">Customer Support</MenuItem>
                          <MenuItem value="Legal">Legal</MenuItem>
                          <MenuItem value="Research & Development">Research & Development</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Designation"
                        name="designation"
                        value={formData.designation}
                        onChange={handleChange}
                        disabled={isView}
                        placeholder="e.g., Software Engineer, Manager"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Salary Information Card */}
            <Grid size={{ xs: 12 }}>
              <Card elevation={2} sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <AttachMoney sx={{ mr: 1, color: '#2E7D32' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Salary Information
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 3 }} />
                  
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Monthly Salary"
                        name="salary"
                        type="number"
                        value={formData.salary}
                        onChange={handleChange}
                        error={!!errors.salary}
                        helperText={errors.salary}
                        disabled={isView}
                        required
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <AttachMoney />
                            </InputAdornment>
                          ),
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Paid Days"
                        name="paidDays"
                        type="number"
                        value={formData.paidDays}
                        onChange={handleChange}
                        error={!!errors.paidDays}
                        helperText={errors.paidDays || 'Number of working days in the month'}
                        disabled={isView}
                        inputProps={{ min: 0, max: 31 }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <CalendarToday />
                            </InputAdornment>
                          ),
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Leaves Taken"
                        name="leaves"
                        type="number"
                        value={formData.leaves}
                        onChange={handleChange}
                        error={!!errors.leaves}
                        helperText={errors.leaves || 'Number of leaves taken this month'}
                        disabled={isView}
                        inputProps={{ min: 0 }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Assignment />
                            </InputAdornment>
                          ),
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                  </Grid>

                  {/* Salary Breakdown */}
                  {formData.salary && parseFloat(formData.salary) > 0 && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#2E7D32' }}>
                        Salary Breakdown (Auto-calculated)
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <Box sx={{ p: 2, backgroundColor: '#f8f9fa', borderRadius: 2, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">Basic</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#2E7D32' }}>
                              ₹{calculatedSalary.basic.toLocaleString()}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <Box sx={{ p: 2, backgroundColor: '#f8f9fa', borderRadius: 2, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">HRA</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#2E7D32' }}>
                              ₹{calculatedSalary.hra.toLocaleString()}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <Box sx={{ p: 2, backgroundColor: '#f8f9fa', borderRadius: 2, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">Conveyance</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#2E7D32' }}>
                              ₹{calculatedSalary.conveyance.toLocaleString()}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <Box sx={{ p: 2, backgroundColor: '#f8f9fa', borderRadius: 2, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">Other Allowance</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#2E7D32' }}>
                              ₹{calculatedSalary.otherAllowance.toLocaleString()}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <Box sx={{ p: 2, backgroundColor: '#ffebee', borderRadius: 2, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">PF</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#d32f2f' }}>
                              ₹{calculatedSalary.pf.toLocaleString()}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <Box sx={{ p: 2, backgroundColor: '#ffebee', borderRadius: 2, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">ESIC</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#d32f2f' }}>
                              ₹{calculatedSalary.esic.toLocaleString()}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <Box sx={{ p: 2, backgroundColor: '#ffebee', borderRadius: 2, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">Day Wise Deduction</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#d32f2f' }}>
                              ₹{calculatedSalary.dayWiseDeduction.toLocaleString()}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <Box sx={{ p: 2, backgroundColor: '#e8f5e8', borderRadius: 2, textAlign: 'center', border: '2px solid #2E7D32' }}>
                            <Typography variant="body2" color="text.secondary">NET SALARY</Typography>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: '#2E7D32' }}>
                              ₹{calculatedSalary.netSalary.toLocaleString()}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Action Buttons */}
            <Grid size={{ xs: 12 }}>
              <Box display="flex" gap={2} justifyContent="flex-end" sx={{ mt: 3 }}>
                <Button
                  variant="outlined"
                  startIcon={<Cancel />}
                  onClick={handleCancel}
                  disabled={submitLoading}
                  size="large"
                  sx={{ 
                    borderRadius: 2,
                    px: 4,
                    py: 1.5
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<Save />}
                  disabled={submitLoading || isView}
                  size="large"
                  sx={{ 
                    borderRadius: 2,
                    px: 4,
                    py: 1.5,
                    background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)',
                    },
                    display: isView ? 'none' : 'inline-flex'
                  }}
                >
                  {submitLoading ? <CircularProgress size={24} color="inherit" /> : (isEdit ? 'Update Employee' : 'Create Employee')}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Box>

      {/* Bulk Upload Dialog */}
      <Dialog
        open={uploadDialog.open}
        onClose={handleUploadDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <FileUpload sx={{ mr: 1, color: '#2E7D32' }} />
            Bulk Upload Employees
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {/* File Upload Section */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Upload CSV File
              </Typography>
              <Box
                sx={{
                  border: '2px dashed #2E7D32',
                  borderRadius: 2,
                  p: 3,
                  textAlign: 'center',
                  backgroundColor: 'rgba(46, 125, 50, 0.02)',
                }}
              >
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  id="csv-upload"
                />
                <label htmlFor="csv-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUpload />}
                    sx={{
                      borderColor: '#2E7D32',
                      color: '#2E7D32',
                      '&:hover': {
                        borderColor: '#1B5E20',
                        backgroundColor: 'rgba(46, 125, 50, 0.04)',
                      },
                    }}
                  >
                    Choose CSV File
                  </Button>
                </label>
                {uploadedFile && (
                  <Typography variant="body2" sx={{ mt: 1, color: 'success.main' }}>
                    ✓ {uploadedFile.name} ({parsedData.length} employees)
                  </Typography>
                )}
              </Box>
            </Box>

            {/* CSV Format Instructions */}
            <Box sx={{ mb: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="h6">
                  CSV Format Requirements
                </Typography>
                <Button
                  variant="text"
                  size="small"
                  href="/sample-employees.csv"
                  download="sample-employees.csv"
                  sx={{ color: '#2E7D32' }}
                >
                  Download Sample CSV
                </Button>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Your CSV file should have the following columns (case-insensitive):
              </Typography>
              <Box component="ul" sx={{ pl: 2, fontSize: '0.875rem', color: 'text.secondary' }}>
                <li><strong>name</strong> - Employee full name</li>
                <li><strong>email</strong> - Employee email address</li>
                <li><strong>employeecode</strong> - Employee code (format: XX1234)</li>
                <li><strong>department</strong> - Department name</li>
                <li><strong>designation</strong> - Job title</li>
                <li><strong>salary</strong> - Monthly salary (number)</li>
                <li><strong>phone</strong> - Phone number (optional)</li>
                <li><strong>joiningdate</strong> - Joining date (YYYY-MM-DD, optional)</li>
                <li><strong>isactive</strong> - Active status (true/false, optional)</li>
              </Box>
            </Box>

            {/* Preview Data */}
            {parsedData.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Preview Data ({parsedData.length} employees)
                </Typography>
                <TableContainer sx={{ maxHeight: 300, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Code</TableCell>
                        <TableCell>Department</TableCell>
                        <TableCell>Salary</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {parsedData.slice(0, 5).map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{row.name || '-'}</TableCell>
                          <TableCell>{row.email || '-'}</TableCell>
                          <TableCell>{row.employeeCode || '-'}</TableCell>
                          <TableCell>{row.department || '-'}</TableCell>
                          <TableCell>{row.salary || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {parsedData.length > 5 && (
                  <Typography variant="caption" color="text.secondary">
                    Showing first 5 rows of {parsedData.length} total employees
                  </Typography>
                )}
              </Box>
            )}

            {/* Upload Result */}
            {uploadResult && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Upload Results
                </Typography>
                <Alert severity="success" sx={{ mb: 2 }}>
                  Successfully created {uploadResult.data.created} out of {uploadResult.data.total} employees
                </Alert>
                
                {uploadResult.data.errors && uploadResult.data.errors.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="error" sx={{ mb: 1 }}>
                      Errors ({uploadResult.data.errors.length}):
                    </Typography>
                    <Box sx={{ maxHeight: 150, overflow: 'auto', border: '1px solid #e0e0e0', borderRadius: 1, p: 1 }}>
                      {uploadResult.data.errors.map((error, index) => (
                        <Typography key={index} variant="caption" color="error" display="block">
                          {error}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                )}

                {uploadResult.data.duplicates && uploadResult.data.duplicates.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="warning.main" sx={{ mb: 1 }}>
                      Duplicates ({uploadResult.data.duplicates.length}):
                    </Typography>
                    <Box sx={{ maxHeight: 150, overflow: 'auto', border: '1px solid #e0e0e0', borderRadius: 1, p: 1 }}>
                      {uploadResult.data.duplicates.map((duplicate, index) => (
                        <Typography key={index} variant="caption" color="warning.main" display="block">
                          {duplicate}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleUploadDialogClose} disabled={uploadLoading}>
            {uploadResult ? 'Close' : 'Cancel'}
          </Button>
          {uploadResult && (
            <Button
              onClick={() => {
                handleUploadDialogClose();
                navigate('/employees');
                window.location.reload();
              }}
              variant="outlined"
              sx={{ mr: 1 }}
            >
              View Employees
            </Button>
          )}
          {!uploadResult && (
            <Button
              onClick={handleBulkUpload}
              variant="contained"
              disabled={parsedData.length === 0 || uploadLoading}
              sx={{
                background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)',
                },
              }}
            >
              {uploadLoading ? <CircularProgress size={24} color="inherit" /> : `Upload ${parsedData.length} Employees`}
            </Button>
          )}
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
  );
};

export default EmployeeForm;
