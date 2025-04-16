import React, { useState } from 'react';
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
  Link as MuiLink, // Rename to avoid conflict with Router Link
  CircularProgress,
  Alert,
} from '@mui/material';
import LockResetIcon from '@mui/icons-material/LockReset'; // Icon for reset
import { Link as RouterLink } from 'react-router-dom'; // For navigation links
import api from '../services/api';

// Use a similar theme or create a specific one
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#ffa726', // Orange accent
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

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Call the backend endpoint
      const response = await api.post('/auth/forgotpassword', { email });
      setSuccess(response.data.message || 'Password reset email sent successfully!');
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to send reset email. Please check the email address and try again.';
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
          <Typography component="h1" variant="h5" sx={{ mb: 1 }}>
            Forgot Password
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
            Enter your email address and we'll send you a link to reset your password.
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
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              variant="outlined"
              disabled={loading || !!success} // Disable if loading or success message shown
            />
            <Box sx={{ position: 'relative', mt: 3, mb: 2 }}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading || !!success}
                sx={{ py: 1.5 }}
              >
                Send Reset Link
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

export default ForgotPassword; 