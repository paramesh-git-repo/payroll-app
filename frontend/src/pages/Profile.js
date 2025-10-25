import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import { Save, Lock } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    // Clear messages when switching tabs
    setProfileMessage('');
    setPasswordMessage('');
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (profileErrors[name]) {
      setProfileErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateProfileForm = () => {
    const errors = {};

    if (!profileData.name.trim()) {
      errors.name = 'Name is required';
    } else if (profileData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (!profileData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      errors.email = 'Email is invalid';
    }

    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePasswordForm = () => {
    const errors = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = 'New password must be at least 6 characters';
    }

    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateProfileForm()) {
      return;
    }

    try {
      setProfileLoading(true);
      setProfileMessage('');
      
      const result = await updateProfile(profileData);
      
      if (result.success) {
        setProfileMessage('Profile updated successfully');
      } else {
        setProfileMessage(result.message || 'Failed to update profile');
      }
    } catch (error) {
      setProfileMessage('An error occurred while updating profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }

    try {
      setPasswordLoading(true);
      setPasswordMessage('');
      
      const result = await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      if (result.success) {
        setPasswordMessage('Password changed successfully');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setPasswordMessage(result.message || 'Failed to change password');
      }
    } catch (error) {
      setPasswordMessage('An error occurred while changing password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%', py: 4, px: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: '#2E7D32' }}>
        Profile Settings
      </Typography>

      <Paper elevation={3}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Profile Information" />
            <Tab label="Change Password" />
          </Tabs>
        </Box>

        {/* Profile Information Tab */}
        {tabValue === 0 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Profile Information
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {profileMessage && (
              <Alert 
                severity={profileMessage.includes('success') ? 'success' : 'error'} 
                sx={{ mb: 3 }}
              >
                {profileMessage}
              </Alert>
            )}

            <Box component="form" onSubmit={handleProfileSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    error={!!profileErrors.name}
                    helperText={profileErrors.name}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    error={!!profileErrors.email}
                    helperText={profileErrors.email}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Role"
                    value={user?.role || ''}
                    disabled
                    helperText="Role cannot be changed"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Employee Code"
                    value={user?.employeeCode || 'N/A'}
                    disabled
                    helperText="Employee code cannot be changed"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<Save />}
                    disabled={profileLoading}
                    sx={{ mt: 2 }}
                  >
                    {profileLoading ? <CircularProgress size={24} /> : 'Update Profile'}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Box>
        )}

        {/* Change Password Tab */}
        {tabValue === 1 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Change Password
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {passwordMessage && (
              <Alert 
                severity={passwordMessage.includes('success') ? 'success' : 'error'} 
                sx={{ mb: 3 }}
              >
                {passwordMessage}
              </Alert>
            )}

            <Box component="form" onSubmit={handlePasswordSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Current Password"
                    name="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    error={!!passwordErrors.currentPassword}
                    helperText={passwordErrors.currentPassword}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="New Password"
                    name="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    error={!!passwordErrors.newPassword}
                    helperText={passwordErrors.newPassword}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    name="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    error={!!passwordErrors.confirmPassword}
                    helperText={passwordErrors.confirmPassword}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<Lock />}
                    disabled={passwordLoading}
                    sx={{ mt: 2 }}
                  >
                    {passwordLoading ? <CircularProgress size={24} /> : 'Change Password'}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default Profile;
