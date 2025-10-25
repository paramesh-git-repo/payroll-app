import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Save,
  Security,
  Notifications,
  Palette,
  Language,
  AccountCircle,
  Restore,
  Delete,
  Warning,
  CheckCircle
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/axios';

const Settings = () => {
  const { user } = useAuth();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [deletedEmployees, setDeletedEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Settings state
  const [settings, setSettings] = useState({
    // Profile Settings
    profile: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      department: user?.department || '',
      designation: user?.designation || ''
    },
    // Security Settings
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      passwordExpiry: 90
    },
    // Notification Settings
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      payrollAlerts: true,
      attendanceReminders: true,
      systemUpdates: false
    },
    // Appearance Settings
    appearance: {
      theme: 'light',
      language: 'en',
      fontSize: 'medium',
      compactMode: false
    }
  });

  const handleSettingChange = (category, field, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const handleSaveSettings = () => {
    // Here you would typically save settings to the backend
    console.log('Saving settings:', settings);
    setSnackbar({
      open: true,
      message: 'Settings saved successfully!',
      severity: 'success'
    });
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Restore Data Functions
  const fetchDeletedEmployees = async () => {
    try {
      setLoading(true);
      // This would typically call a backend endpoint to get soft-deleted employees
      // For now, we'll simulate with some mock data
      const mockDeletedEmployees = [
        {
          _id: '1',
          name: 'John Doe',
          employeeCode: 'EMP001',
          email: 'john.doe@company.com',
          department: 'IT',
          deletedAt: '2024-01-15T10:30:00Z'
        },
        {
          _id: '2',
          name: 'Jane Smith',
          employeeCode: 'EMP002',
          email: 'jane.smith@company.com',
          department: 'HR',
          deletedAt: '2024-01-10T14:20:00Z'
        }
      ];
      setDeletedEmployees(mockDeletedEmployees);
    } catch (error) {
      console.error('Error fetching deleted employees:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch deleted employees',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreEmployee = async (employeeId) => {
    try {
      // This would typically call a backend endpoint to restore the employee
      await api.post(`/api/employees/${employeeId}/restore`);
      
      setDeletedEmployees(prev => prev.filter(emp => emp._id !== employeeId));
      setSnackbar({
        open: true,
        message: 'Employee restored successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error restoring employee:', error);
      setSnackbar({
        open: true,
        message: 'Failed to restore employee',
        severity: 'error'
      });
    }
  };

  const handlePermanentDeleteEmployee = async (employeeId) => {
    try {
      // This would typically call a backend endpoint to permanently delete the employee
      await api.delete(`/api/employees/${employeeId}/permanent`);
      
      setDeletedEmployees(prev => prev.filter(emp => emp._id !== employeeId));
      setSnackbar({
        open: true,
        message: 'Employee permanently deleted',
        severity: 'warning'
      });
    } catch (error) {
      console.error('Error permanently deleting employee:', error);
      setSnackbar({
        open: true,
        message: 'Failed to permanently delete employee',
        severity: 'error'
      });
    }
  };

  return (
    <Box sx={{ width: '100%', py: 4, px: { xs: 2, sm: 3, md: 4 } }}>
      <Box sx={{ width: '100%' }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, color: '#2E7D32', mb: 1 }}>
            Settings
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Manage your account preferences and application settings
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Profile Settings */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card elevation={2} sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" mb={3}>
                  <AccountCircle sx={{ mr: 1, color: '#2E7D32', fontSize: 28 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Profile Settings
                  </Typography>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      value={settings.profile.name}
                      onChange={(e) => handleSettingChange('profile', 'name', e.target.value)}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Email"
                      value={settings.profile.email}
                      onChange={(e) => handleSettingChange('profile', 'email', e.target.value)}
                      variant="outlined"
                      type="email"
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      value={settings.profile.phone}
                      onChange={(e) => handleSettingChange('profile', 'phone', e.target.value)}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Department"
                      value={settings.profile.department}
                      onChange={(e) => handleSettingChange('profile', 'department', e.target.value)}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Designation"
                      value={settings.profile.designation}
                      onChange={(e) => handleSettingChange('profile', 'designation', e.target.value)}
                      variant="outlined"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Security Settings */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card elevation={2} sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" mb={3}>
                  <Security sx={{ mr: 1, color: '#1976D2', fontSize: 28 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Security Settings
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.security.twoFactorAuth}
                        onChange={(e) => handleSettingChange('security', 'twoFactorAuth', e.target.checked)}
                      />
                    }
                    label="Two-Factor Authentication"
                  />
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <TextField
                    fullWidth
                    label="Session Timeout (minutes)"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                    variant="outlined"
                    type="number"
                  />
                </Box>
                
                <Box>
                  <TextField
                    fullWidth
                    label="Password Expiry (days)"
                    value={settings.security.passwordExpiry}
                    onChange={(e) => handleSettingChange('security', 'passwordExpiry', parseInt(e.target.value))}
                    variant="outlined"
                    type="number"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Notification Settings */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card elevation={2} sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" mb={3}>
                  <Notifications sx={{ mr: 1, color: '#FF9800', fontSize: 28 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Notification Settings
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.emailNotifications}
                        onChange={(e) => handleSettingChange('notifications', 'emailNotifications', e.target.checked)}
                      />
                    }
                    label="Email Notifications"
                  />
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.pushNotifications}
                        onChange={(e) => handleSettingChange('notifications', 'pushNotifications', e.target.checked)}
                      />
                    }
                    label="Push Notifications"
                  />
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.payrollAlerts}
                        onChange={(e) => handleSettingChange('notifications', 'payrollAlerts', e.target.checked)}
                      />
                    }
                    label="Payroll Alerts"
                  />
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.attendanceReminders}
                        onChange={(e) => handleSettingChange('notifications', 'attendanceReminders', e.target.checked)}
                      />
                    }
                    label="Attendance Reminders"
                  />
                </Box>
                
                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.systemUpdates}
                        onChange={(e) => handleSettingChange('notifications', 'systemUpdates', e.target.checked)}
                      />
                    }
                    label="System Updates"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Appearance Settings */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card elevation={2} sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" mb={3}>
                  <Palette sx={{ mr: 1, color: '#9C27B0', fontSize: 28 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Appearance Settings
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <TextField
                    fullWidth
                    label="Language"
                    value={settings.appearance.language}
                    onChange={(e) => handleSettingChange('appearance', 'language', e.target.value)}
                    variant="outlined"
                    select
                    SelectProps={{ native: true }}
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </TextField>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <TextField
                    fullWidth
                    label="Font Size"
                    value={settings.appearance.fontSize}
                    onChange={(e) => handleSettingChange('appearance', 'fontSize', e.target.value)}
                    variant="outlined"
                    select
                    SelectProps={{ native: true }}
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </TextField>
                </Box>
                
                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.appearance.compactMode}
                        onChange={(e) => handleSettingChange('appearance', 'compactMode', e.target.checked)}
                      />
                    }
                    label="Compact Mode"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Restore Data Section */}
        <Card elevation={2} sx={{ borderRadius: 3, mt: 4 }}>
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" mb={3}>
              <Restore sx={{ mr: 1, color: '#FF5722', fontSize: 28 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Restore Data
              </Typography>
            </Box>
            
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2">
                This section allows you to restore deleted employees and other data. 
                Use with caution as restoring data may affect system integrity.
              </Typography>
            </Alert>

            <Box sx={{ mb: 3 }}>
              <Button
                variant="outlined"
                startIcon={<Restore />}
                onClick={fetchDeletedEmployees}
                disabled={loading}
                sx={{ mb: 2 }}
              >
                {loading ? 'Loading...' : 'Load Deleted Employees'}
              </Button>
            </Box>

            {deletedEmployees.length > 0 && (
              <Box>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Deleted Employees ({deletedEmployees.length})
                </Typography>
                
                <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {deletedEmployees.map((employee) => (
                    <Card key={employee._id} variant="outlined" sx={{ mb: 2, p: 2 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {employee.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {employee.employeeCode} • {employee.email} • {employee.department}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Deleted: {new Date(employee.deletedAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                        
                        <Box display="flex" gap={1}>
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<CheckCircle />}
                            onClick={() => handleRestoreEmployee(employee._id)}
                            sx={{
                              backgroundColor: '#4CAF50',
                              '&:hover': { backgroundColor: '#45a049' }
                            }}
                          >
                            Restore
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<Delete />}
                            onClick={() => handlePermanentDeleteEmployee(employee._id)}
                          >
                            Delete Forever
                          </Button>
                        </Box>
                      </Box>
                    </Card>
                  ))}
                </Box>
              </Box>
            )}

            {deletedEmployees.length === 0 && !loading && (
              <Box textAlign="center" py={4}>
                <Typography variant="body1" color="text.secondary">
                  No deleted employees found. Click "Load Deleted Employees" to check for recoverable data.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSaveSettings}
            size="large"
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)',
              },
            }}
          >
            Save Settings
          </Button>
        </Box>

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

export default Settings;
