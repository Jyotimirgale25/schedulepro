import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaUserShield, FaUserTie, FaUser } from 'react-icons/fa';
import Logo from '../components/Logo';
import './RegisterPage.css';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    role: 'EMPLOYEE'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === 'password') checkPasswordStrength(value);
  };

  const checkPasswordStrength = (password) => {
    if (password.length === 0) setPasswordStrength('');
    else if (password.length < 6) setPasswordStrength('weak');
    else if (password.length >= 6 && password.length < 10) setPasswordStrength('medium');
    else setPasswordStrength('strong');
  };

  const validateForm = () => {
    if (!formData.fullName || !formData.email || !formData.username || !formData.password) {
      setError('Please fill in all fields');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (!validateForm()) {
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch('http://localhost:8080/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          username: formData.username,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          role: formData.role
        })
      });

      const data = await response.json();

      if (data.success) {
        sessionStorage.setItem('pendingEmail', formData.email);
        sessionStorage.setItem('pendingUserData', JSON.stringify(formData));
        navigate('/verify-otp');
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Cannot connect to server. Make sure backend is running on http://localhost:8080');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page-container">
      <div className="register-page-card">
        <div className="register-page-row">
          {/* Left Side - Illustration with Dark Gradient */}
          <div className="register-page-left">
            <div className="register-page-illustration">
              <svg viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Dark background circles */}
                <circle cx="250" cy="250" r="200" fill="rgba(255,255,255,0.03)"/>
                <circle cx="250" cy="250" r="150" fill="rgba(255,255,255,0.02)"/>
                <circle cx="250" cy="250" r="100" fill="rgba(255,255,255,0.01)"/>
                
                {/* Document/Form - Dark theme */}
                <rect x="140" y="180" width="220" height="160" rx="16" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5"/>
                <rect x="160" y="200" width="180" height="8" rx="4" fill="rgba(255,255,255,0.12)"/>
                <rect x="160" y="220" width="140" height="8" rx="4" fill="rgba(255,255,255,0.08)"/>
                <rect x="160" y="240" width="160" height="8" rx="4" fill="rgba(255,255,255,0.08)"/>
                <rect x="160" y="260" width="120" height="8" rx="4" fill="rgba(255,255,255,0.08)"/>
                <rect x="160" y="280" width="150" height="8" rx="4" fill="rgba(255,255,255,0.08)"/>
                <rect x="160" y="300" width="100" height="8" rx="4" fill="rgba(255,255,255,0.08)"/>
                
                {/* Checkmark - Dark theme */}
                <circle cx="320" cy="310" r="35" fill="#2d7d3a" opacity="0.7"/>
                <path d="M302 310 L315 323 L338 298" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.8"/>
                
                {/* Person icon - Dark theme */}
                <circle cx="250" cy="130" r="50" fill="rgba(255,255,255,0.04)"/>
                <circle cx="250" cy="130" r="30" fill="rgba(255,255,255,0.1)"/>
                <path d="M215 170 C215 135 285 135 285 170" stroke="rgba(255,255,255,0.2)" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
                
                {/* Decorative floating elements - Dark theme */}
                <circle cx="70" cy="70" r="25" fill="rgba(255,255,255,0.03)"/>
                <circle cx="430" cy="430" r="35" fill="rgba(255,255,255,0.02)"/>
                <circle cx="430" cy="70" r="18" fill="rgba(255,255,255,0.03)"/>
                <circle cx="70" cy="430" r="28" fill="rgba(255,255,255,0.02)"/>
                <circle cx="460" cy="250" r="15" fill="rgba(255,255,255,0.02)"/>
                <circle cx="40" cy="250" r="20" fill="rgba(255,255,255,0.02)"/>
                
                {/* Stars - Dark theme */}
                <circle cx="380" cy="150" r="5" fill="rgba(255,255,255,0.12)"/>
                <circle cx="405" cy="130" r="3" fill="rgba(255,255,255,0.08)"/>
                <circle cx="370" cy="115" r="4" fill="rgba(255,255,255,0.1)"/>
                <circle cx="395" cy="170" r="3" fill="rgba(255,255,255,0.08)"/>
                
                {/* Small dots - Dark theme */}
                <circle cx="100" cy="150" r="3" fill="rgba(255,255,255,0.06)"/>
                <circle cx="390" cy="360" r="4" fill="rgba(255,255,255,0.06)"/>
                <circle cx="120" cy="340" r="3" fill="rgba(255,255,255,0.06)"/>
                <circle cx="400" cy="200" r="3" fill="rgba(255,255,255,0.05)"/>
                
                {/* Text - Dark theme */}
                <text x="250" y="400" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold" fontFamily="Segoe UI, Arial, sans-serif" opacity="0.9">Join Our Platform</text>
                <text x="250" y="430" textAnchor="middle" fill="white" fontSize="15" fontFamily="Segoe UI, Arial, sans-serif" opacity="0.6">Start managing schedules today!</text>
              </svg>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="register-page-right">
            <div className="register-page-form">
              {/* Header */}
              <div className="register-page-header">
                <Logo size={45} />
                <h2>Create Account</h2>
                <p>Fill your details and select your role</p>
              </div>

              {error && <div className="register-page-alert register-page-alert-danger">{error}</div>}

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <div className="register-page-form-group">
                  <label className="register-page-form-label">Full Name *</label>
                  <input 
                    type="text" 
                    className="register-page-form-control" 
                    name="fullName" 
                    value={formData.fullName} 
                    onChange={handleChange} 
                    placeholder="Enter your full name" 
                    required 
                  />
                </div>

                <div className="register-page-form-group">
                  <label className="register-page-form-label">Email *</label>
                  <input 
                    type="email" 
                    className="register-page-form-control" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    placeholder="Enter your email" 
                    required 
                  />
                </div>

                <div className="register-page-form-group">
                  <label className="register-page-form-label">Username *</label>
                  <input 
                    type="text" 
                    className="register-page-form-control" 
                    name="username" 
                    value={formData.username} 
                    onChange={handleChange} 
                    placeholder="Choose a username" 
                    required 
                  />
                </div>

                {/* Role Selection */}
                <div className="register-page-form-group">
                  <label className="register-page-form-label">Select Your Role *</label>
                  <div className="register-page-role-selection">
                    <label className={`register-page-role-card ${formData.role === 'EMPLOYEE' ? 'register-page-role-selected' : ''}`}>
                      <input 
                        type="radio" 
                        name="role" 
                        value="EMPLOYEE" 
                        checked={formData.role === 'EMPLOYEE'} 
                        onChange={handleChange} 
                      />
                      <FaUser size={22} color="#28a745" />
                      <span>Employee</span>
                    </label>
                    
                    <label className={`register-page-role-card ${formData.role === 'MANAGER' ? 'register-page-role-selected' : ''}`}>
                      <input 
                        type="radio" 
                        name="role" 
                        value="MANAGER" 
                        checked={formData.role === 'MANAGER'} 
                        onChange={handleChange} 
                      />
                      <FaUserTie size={22} color="#ffc107" />
                      <span>Manager</span>
                    </label>
                    
                    <label className={`register-page-role-card ${formData.role === 'ADMIN' ? 'register-page-role-selected' : ''}`}>
                      <input 
                        type="radio" 
                        name="role" 
                        value="ADMIN" 
                        checked={formData.role === 'ADMIN'} 
                        onChange={handleChange} 
                      />
                      <FaUserShield size={22} color="#dc3545" />
                      <span>Admin</span>
                    </label>
                  </div>
                </div>

                <div className="register-page-form-group">
                  <label className="register-page-form-label">Password *</label>
                  <div className="register-page-password-wrapper">
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      className="register-page-form-control" 
                      name="password" 
                      value={formData.password} 
                      onChange={handleChange} 
                      placeholder="Create a password (min 6 characters)" 
                      required 
                    />
                    <button 
                      type="button" 
                      className="register-page-password-toggle" 
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                    </button>
                  </div>
                  {passwordStrength && <div className={`register-page-password-strength register-page-strength-${passwordStrength}`} />}
                </div>

                <div className="register-page-form-group">
                  <label className="register-page-form-label">Confirm Password *</label>
                  <div className="register-page-password-wrapper">
                    <input 
                      type={showConfirmPassword ? 'text' : 'password'} 
                      className="register-page-form-control" 
                      name="confirmPassword" 
                      value={formData.confirmPassword} 
                      onChange={handleChange} 
                      placeholder="Confirm your password" 
                      required 
                    />
                    <button 
                      type="button" 
                      className="register-page-password-toggle" 
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                    </button>
                  </div>
                </div>

                <div className="register-page-checkbox-group">
                  <input 
                    type="checkbox" 
                    className="register-page-checkbox-input" 
                    id="terms" 
                    required 
                  />
                  <label className="register-page-checkbox-label" htmlFor="terms">
                    I agree to the Terms and Conditions
                  </label>
                </div>
<br></br>
                <button 
                  type="submit" 
                  className="register-page-btn-submit" 
                  disabled={loading}
                >
                  {loading ? 'Sending OTP...' : `Register as ${formData.role}`}
                </button>
              </form>

              <div className="register-page-footer">
                <p>Already have an account? <Link to="/login" className="register-page-footer-link">Login here</Link></p>
                <Link to="/" className="register-page-footer-link">← Back to Home</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;