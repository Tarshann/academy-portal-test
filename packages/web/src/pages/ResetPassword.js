import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Avatar,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Link as MuiLink,
  CircularProgress,
  Alert,
} from '@mui/material';
import LockResetIcon from '@mui/icons-material/LockReset';
import { Link as RouterLink, useParams, useHistory } from 'react-router-dom';
import api from '../services/api';

const theme = createTheme({
    palette: {
        primary: {
          main: '#1976d2',
        },
        secondary: {
          main: '#4caf50', // Green accent
        },
        background: {
          default: '#f4f6f8',
        },
      },
      typography: {
        h5: {
          fontWeight: 600,
        },
      },
});

function Copyright(props) {
    return (
      <Typography variant="body2" color="text.secondary" align="center" {...props}>
        {'Copyright © '}
        <MuiLink color="inherit" href="#">
          Academy Portal
        </MuiLink>{' '}
        {new Date().getFullYear()}
        {'.'}
      </Typography>
    );
  }

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetToken } = useParams(); // Get token from URL parameter
  const history = useHistory();

  useEffect(() => {
      // Basic check if token exists
      if (!resetToken) {
          setError('Invalid password reset link.');
      }
  }, [resetToken]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!resetToken) {
        setError('Invalid password reset link.');
        return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
    }

    setLoading(true);
    try {
      // Call the backend endpoint with the token and new password
      const response = await api.put(`/auth/resetpassword/${resetToken}`, { password });
      setSuccess('Password reset successfully! Redirecting to login...');
      // Redirect to login page after a delay
      setTimeout(() => {
        history.push('/login');
      }, 3000);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to reset password. The link may be invalid or expired.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Paper
          elevation={6}
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: 4,
            borderRadius: 2,
            backgroundColor: 'white',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
            <LockResetIcon />
          </Avatar>
          <Typography component="h1" variant="h5" sx={{ mb: 2 }}>
            Reset Password
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
              {success}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="New Password"
              type="password"
              id="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading || !!success}
              error={password.length > 0 && password.length < 6} // Basic validation indication
              helperText={password.length > 0 && password.length < 6 ? "Password must be at least 6 characters" : ""}
            />
             <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm New Password"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading || !!success}
              error={confirmPassword.length > 0 && password !== confirmPassword}
              helperText={confirmPassword.length > 0 && password !== confirmPassword ? "Passwords do not match" : ""}
            />
            <Box sx={{ position: 'relative', mt: 3, mb: 2 }}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading || !!success || !resetToken}
                sx={{ py: 1.5 }}
              >
                Reset Password
              </Button>
              {loading && (
                <CircularProgress
                  size={24}
                  sx={{
                    color: theme.palette.primary.main,
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    marginTop: '-12px',
                    marginLeft: '-12px',
                  }}
                />
              )}
            </Box>
             <Box sx={{ textAlign: 'center' }}>
                <MuiLink component={RouterLink} to="/login" variant="body2">
                  Back to Sign In
                </MuiLink>
              </Box>
          </Box>
        </Paper>
        <Copyright sx={{ mt: 8, mb: 4 }} />
      </Container>
    </ThemeProvider>
  );
};

export default ResetPassword; 