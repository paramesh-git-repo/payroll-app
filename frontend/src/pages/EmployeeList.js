import React, { useState, useEffect } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  Visibility,
  Close
} from '@mui/icons-material';
import EmployeeForm from './EmployeeForm';
import api from '../utils/axios';

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, employee: null });
  
  // Modal states
  const [addModal, setAddModal] = useState({ open: false });
  const [editModal, setEditModal] = useState({ open: false, employee: null });
  const [viewModal, setViewModal] = useState({ open: false, employee: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchEmployees();
  }, [page, search, department, status]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      
      if (search) params.append('search', search);
      if (department) params.append('department', department);
      if (status !== '') params.append('isActive', status);

      console.log('=== FRONTEND DEBUG ===');
      console.log('Fetching employees with params:', params.toString());
      console.log('API URL:', `/api/employees?${params}`);
      
      const response = await api.get(`/api/employees?${params}`);
      
      console.log('API Response:', response.data);
      console.log('Employees count:', response.data.data?.length || 0);
      console.log('Total pages:', response.data.pages);
      console.log('=====================');
      
      setEmployees(response.data.data);
      setTotalPages(response.data.pages);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleDepartmentChange = (e) => {
    setDepartment(e.target.value);
    setPage(1);
  };

  const handleStatusChange = (e) => {
    setStatus(e.target.value);
    setPage(1);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleDeleteClick = (employee) => {
    setDeleteDialog({ open: true, employee });
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/api/employees/${deleteDialog.employee._id}`);
      setDeleteDialog({ open: false, employee: null });
      fetchEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, employee: null });
  };

  const handleViewEmployee = (employeeId) => {
    const employee = employees.find(emp => emp._id === employeeId);
    setViewModal({ open: true, employee });
  };

  const handleEditEmployee = (employeeId) => {
    const employee = employees.find(emp => emp._id === employeeId);
    setEditModal({ open: true, employee });
  };

  const handleAddEmployee = () => {
    setAddModal({ open: true });
  };

  // Modal handlers
  const handleAddModalClose = () => {
    setAddModal({ open: false });
  };

  const handleEditModalClose = () => {
    setEditModal({ open: false, employee: null });
  };

  const handleViewModalClose = () => {
    setViewModal({ open: false, employee: null });
  };

  const handleEmployeeSuccess = (message) => {
    setSnackbar({ open: true, message, severity: 'success' });
    fetchEmployees(); // Refresh the list
    
    // Close all modals
    setAddModal({ open: false });
    setEditModal({ open: false, employee: null });
    setViewModal({ open: false, employee: null });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ open: false, message: '', severity: 'success' });
  };

  return (
    <Box sx={{ width: '100%', py: 4, px: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 700, color: '#2E7D32' }}>
            Employee Management
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Manage your team members and their information
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddEmployee}
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

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            value={search}
            onChange={handleSearch}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            sx={{ minWidth: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Department</InputLabel>
            <Select
              value={department}
              label="Department"
              onChange={handleDepartmentChange}
            >
              <MenuItem value="">All Departments</MenuItem>
              <MenuItem value="IT">IT</MenuItem>
              <MenuItem value="HR">HR</MenuItem>
              <MenuItem value="Finance">Finance</MenuItem>
              <MenuItem value="Marketing">Marketing</MenuItem>
              <MenuItem value="Operations">Operations</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={status}
              label="Status"
              onChange={handleStatusChange}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="true">Active</MenuItem>
              <MenuItem value="false">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Employee Table */}
      <Paper>
        <TableContainer sx={{ width: '100%' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Employee Code</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Designation</TableCell>
                <TableCell>Salary</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : employees.length > 0 ? (
                employees.map((employee) => (
                  <TableRow key={employee._id}>
                    <TableCell>{employee.employeeCode}</TableCell>
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>{employee.department || 'N/A'}</TableCell>
                    <TableCell>{employee.designation || 'N/A'}</TableCell>
                    <TableCell>₹{employee.salary.toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={employee.isActive ? 'Active' : 'Inactive'}
                        color={employee.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleViewEmployee(employee._id)}
                        title="View Employee"
                      >
                        <Visibility />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleEditEmployee(employee._id)}
                        title="Edit Employee"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(employee)}
                        title="Delete Employee"
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No employees found
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">
          Permanently Delete Employee
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to permanently delete employee "{deleteDialog.employee?.name}"?
            This will remove the employee from the entire application and cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Employee Modal */}
      <Dialog
        open={addModal.open}
        onClose={handleAddModalClose}
        maxWidth="md"
        fullWidth
        aria-labelledby="add-employee-dialog-title"
      >
        <DialogTitle id="add-employee-dialog-title">
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Add New Employee</Typography>
            <IconButton onClick={handleAddModalClose} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <EmployeeForm
            onSuccess={handleEmployeeSuccess}
            onCancel={handleAddModalClose}
            mode="add"
          />
        </DialogContent>
      </Dialog>

      {/* Edit Employee Modal */}
      <Dialog
        open={editModal.open}
        onClose={handleEditModalClose}
        maxWidth="md"
        fullWidth
        aria-labelledby="edit-employee-dialog-title"
      >
        <DialogTitle id="edit-employee-dialog-title">
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Edit Employee</Typography>
            <IconButton onClick={handleEditModalClose} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <EmployeeForm
            employee={editModal.employee}
            onSuccess={handleEmployeeSuccess}
            onCancel={handleEditModalClose}
            mode="edit"
          />
        </DialogContent>
      </Dialog>

      {/* View Employee Modal */}
      <Dialog
        open={viewModal.open}
        onClose={handleViewModalClose}
        maxWidth="md"
        fullWidth
        aria-labelledby="view-employee-dialog-title"
      >
        <DialogTitle id="view-employee-dialog-title">
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Employee Details</Typography>
            <IconButton onClick={handleViewModalClose} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <EmployeeForm
            employee={viewModal.employee}
            onSuccess={handleEmployeeSuccess}
            onCancel={handleViewModalClose}
            mode="view"
          />
        </DialogContent>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EmployeeList;
