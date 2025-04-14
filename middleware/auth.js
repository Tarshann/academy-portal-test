import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthForm = ({ setAuth }) => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  
  // Registration form state
const [registerData, setRegisterData] = useState({
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  password: '',
  confirmPassword: '',
  childName: '',
  address: '',
  shirtSize: ''
});
  
  // Toggle between login and register forms
  const toggleForm = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
  };
  
  // Handle login form input changes
  const handleLoginChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value
    });
  };
  
  // Handle registration form input changes
  const handleRegisterChange = (e) => {
    setRegisterData({
      ...registerData,
      [e.target.name]: e.target.value
    });
  };
  
  // Handle login form submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      const res = await axios.post('/api/auth/login', loginData);
      
      // Store token in localStorage
      localStorage.setItem('token', res.data.token);
      
      // Set auth state
      setAuth({
        isAuthenticated: true,
        user: res.data.user,
        loading: false
      });
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.errors?.[0]?.msg || 
        err.response?.data?.msg || 
        'An error occurred during login'
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle registration form submission
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    // Validate passwords match
    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match');
      setIsSubmitting(false);
      return;
    }
    
    try {
      const res = await axios.post('/api/auth/register', {
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        email: registerData.email,
        phoneNumber: registerData.phoneNumber,
        password: registerData.password,
        childName: registerData.childName,
        address: registerData.address,
        shirtSize: registerData.shirtSize
      });
      
      // Show success message
      setSuccess(res.data.msg || 'Registration successful. Please wait for admin approval.');
      
      // Reset form
      setRegisterData({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        childName: '',
        address: '',
        shirtSize: ''
      });
      
      // Switch to login form after successful registration
      setTimeout(() => {
        setIsLogin(true);
      }, 3000);
    } catch (err) {
      setError(
        err.response?.data?.errors?.[0]?.msg || 
        err.response?.data?.msg || 
        'An error occurred during registration'
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="logo-container">
          <img src="/images/logo.svg" alt="The Academy Logo" className="logo" />
          <h1>The Academy Portal</h1>
        </div>
        
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        
        {isLogin ? (
          // Login Form
          <form onSubmit={handleLoginSubmit}>
            <h2>Login</h2>
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-control"
                value={loginData.email}
                onChange={handleLoginChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                className="form-control"
                value={loginData.password}
                onChange={handleLoginChange}
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary btn-block"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Logging in...' : 'Login'}
            </button>
            
            <p className="form-toggle">
              Don't have an account? 
              <button 
                type="button" 
                className="btn-link"
                onClick={toggleForm}
              >
                Register
              </button>
            </p>
          </form>
        ) : (
          // Registration Form
          <form onSubmit={handleRegisterSubmit}>
            <h2>Register</h2>
            
           <div className="form-group">
  <label htmlFor="firstName">First Name</label>
  <input
    type="text"
    id="firstName"
    name="firstName"
    className="form-control"
    value={registerData.firstName}
    onChange={handleRegisterChange}
    required
  />
</div>

<div className="form-group">
  <label htmlFor="lastName">Last Name</label>
  <input
    type="text"
    id="lastName"
    name="lastName"
    className="form-control"
    value={registerData.lastName}
    onChange={handleRegisterChange}
    required
  />
</div>

            
            <div className="form-group">
              <label htmlFor="reg-email">Email</label>
              <input
                type="email"
                id="reg-email"
                name="email"
                className="form-control"
                value={registerData.email}
                onChange={handleRegisterChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number</label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                className="form-control"
                value={registerData.phoneNumber}
                onChange={handleRegisterChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="reg-password">Password</label>
              <input
                type="password"
                id="reg-password"
                name="password"
                className="form-control"
                value={registerData.password}
                onChange={handleRegisterChange}
                required
                minLength="6"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className="form-control"
                value={registerData.confirmPassword}
                onChange={handleRegisterChange}
                required
                minLength="6"
              />
            </div>
            
            <div className="form-section">
              <h3>Additional Information</h3>
              
              <div className="form-group">
                <label htmlFor="childName">Child's Name (if applicable)</label>
                <input
                  type="text"
                  id="childName"
                  name="childName"
                  className="form-control"
                  value={registerData.childName}
                  onChange={handleRegisterChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="address">Address</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  className="form-control"
                  value={registerData.address}
                  onChange={handleRegisterChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="shirtSize">Shirt Size</label>
                <select
                  id="shirtSize"
                  name="shirtSize"
                  className="form-control"
                  value={registerData.shirtSize}
                  onChange={handleRegisterChange}
                >
                  <option value="">-- Select Size --</option>
                  <option value="XS">XS</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="XXL">XXL</option>
                </select>
              </div>
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary btn-block"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Registering...' : 'Register'}
            </button>
            
            <p className="form-toggle">
              Already have an account? 
              <button 
                type="button" 
                className="btn-link"
                onClick={toggleForm}
              >
                Login
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthForm;
