// fronted/src/pages/ForgotPassword.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      // ✅ CORRECT: Pass email as string
      const response = await authApi.forgotPassword(email);
      console.log('📧 Forgot password response:', response.data);
      
      if (response.data.success) {
        setMessage('✅ OTP sent to your email!');
        setStep(2);
      } else {
        setError(response.data.message || 'Failed to send OTP');
      }
    } catch (err) {
      console.error('❌ Forgot password error:', err);
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      // ✅ FIXED: Use correct method name and pass object
      const response = await authApi.verifyPasswordResetOtp({ email, otp });
      console.log('🔐 OTP verification response:', response.data);
      
      if (response.data.success) {
        setMessage('✅ OTP verified!');
        setStep(3);
      } else {
        setError(response.data.message || 'Invalid OTP');
      }
    } catch (err) {
      console.error('❌ OTP verification error:', err);
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await authApi.resetPassword({ 
        email, 
        otp, 
        newPassword 
      });
      console.log('🔑 Reset password response:', response.data);
      
      if (response.data.success) {
        setMessage('✅ Password reset successfully!');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(response.data.message || 'Failed to reset password');
      }
    } catch (err) {
      console.error('❌ Reset password error:', err);
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <div className="forgot-password-header">
          <h2>🔐 Reset Password</h2>
          <p className="forgot-password-subtitle">
            {step === 1 && 'Enter your email to receive a password reset OTP'}
            {step === 2 && 'Enter the 6-digit OTP sent to your email'}
            {step === 3 && 'Create your new password'}
          </p>
        </div>

        {message && <div className="forgot-password-success">{message}</div>}
        {error && <div className="forgot-password-error">{error}</div>}

        {/* Step 1: Email */}
        {step === 1 && (
          <form onSubmit={handleSendOTP} className="forgot-password-form">
            <div className="forgot-password-form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your registered email"
                required
              />
            </div>
            <button type="submit" className="forgot-password-btn" disabled={loading}>
              {loading ? 'Sending...' : '📧 Send OTP'}
            </button>
          </form>
        )}

        {/* Step 2: OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP} className="forgot-password-form">
            <div className="forgot-password-form-group">
              <label>Enter OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 6-digit OTP"
                maxLength="6"
                required
              />
            </div>
            <button type="submit" className="forgot-password-btn" disabled={loading}>
              {loading ? 'Verifying...' : '✅ Verify OTP'}
            </button>
            <button type="button" className="forgot-password-back-btn" onClick={() => setStep(1)}>
              ← Back
            </button>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="forgot-password-form">
            <div className="forgot-password-form-group">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
                required
              />
            </div>
            <div className="forgot-password-form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
              />
            </div>
            <button type="submit" className="forgot-password-btn" disabled={loading}>
              {loading ? 'Resetting...' : '🔑 Reset Password'}
            </button>
            <button type="button" className="forgot-password-back-btn" onClick={() => navigate('/login')}>
              ← Back to Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;