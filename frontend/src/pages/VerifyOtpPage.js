import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../services/api';

import './VerifyOtpPage.css';

const VerifyOtpPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendDisabled, setResendDisabled] = useState(false);
    const [countdown, setCountdown] = useState(30);
    const [email, setEmail] = useState('');
    
    const inputRefs = useRef([]);
    const timerRef = useRef(null);

    useEffect(() => {
        const storedEmail = sessionStorage.getItem('pendingEmail');
        const stateEmail = location.state?.email;
        const finalEmail = storedEmail || stateEmail || '';
        
        if (!finalEmail) {
            navigate('/register');
            return;
        }
        
        setEmail(finalEmail);
        
        setTimeout(() => {
            if (inputRefs.current[0]) {
                inputRefs.current[0].focus();
            }
        }, 100);

        startResendTimer();

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [navigate, location]);

    const startResendTimer = () => {
        setResendDisabled(true);
        setCountdown(30);
        
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        
        timerRef.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    setResendDisabled(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleOtpChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;
        
        const newOtp = [...otp];
        newOtp[index] = value.slice(0, 1);
        setOtp(newOtp);
        setError('');
        
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
        
        if (value && index === 5) {
            const fullOtp = [...newOtp];
            fullOtp[5] = value.slice(0, 1);
            const otpValue = fullOtp.join('');
            if (otpValue.length === 6) {
                setTimeout(() => handleVerify(otpValue), 300);
            }
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async (otpValue = null) => {
        const finalOtp = otpValue || otp.join('');
        
        if (finalOtp.length !== 6) {
            setError('Please enter complete 6-digit OTP');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await authApi.verifyOtp({
                email: email,
                otp: finalOtp
            });

            if (response.data.success) {
                setSuccess('✅ Email verified successfully!');
                sessionStorage.removeItem('pendingEmail');
                
                setTimeout(() => {
                    navigate('/login', { 
                        state: { success: 'Account created! Please login.' }
                    });
                }, 2000);
            } else {
                setError(response.data.message || 'Invalid OTP. Please try again.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!email) {
            setError('Email not found. Please go back and try again.');
            return;
        }

        setError('');
        setSuccess('');
        setOtp(['', '', '', '', '', '']);
        
        try {
            setLoading(true);
            const response = await authApi.resendOtp(email);

            if (response.data.success) {
                setSuccess('✅ New OTP sent successfully!');
                startResendTimer();
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(response.data.message || 'Failed to resend OTP');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resend OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleBackToLogin = () => {
        sessionStorage.removeItem('pendingEmail');
        navigate('/login');
    };

    return (
        <div className="verify-otp-container">
            <div className="verify-otp-card">
                {/* Header */}
                <div className="verify-otp-header">
                    <h2>🔐 Verify Your Email</h2>
                    <p className="verify-otp-subtitle">We've sent a verification code to</p>
                    <p className="verify-otp-email-display">{email}</p>
                </div>

                {/* Messages */}
                {error && <div className="verify-otp-error">{error}</div>}
                {success && <div className="verify-otp-success">{success}</div>}

                {/* OTP Input */}
                <form onSubmit={(e) => {
                    e.preventDefault();
                    handleVerify();
                }}>
                    <div className="verify-otp-input-group">
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => (inputRefs.current[index] = el)}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleOtpChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                className={`verify-otp-input ${error ? 'verify-otp-input-error' : ''}`}
                                disabled={loading}
                                autoFocus={index === 0}
                                aria-label={`Digit ${index + 1}`}
                            />
                        ))}
                    </div>

                    <button 
                        type="submit" 
                        className={`verify-otp-btn ${loading ? 'verify-otp-btn-loading' : ''}`}
                        disabled={loading || otp.join('').length !== 6}
                    >
                        {loading ? (
                            <>
                                <span className="verify-otp-spinner"></span>
                                Verifying...
                            </>
                        ) : (
                            '✅ Verify Account'
                        )}
                    </button>
                </form>

                {/* Resend */}
                <div className="verify-otp-resend-section">
                    <p className="verify-otp-resend-text">Didn't receive the code?</p>
                    <button 
                        onClick={handleResend} 
                        disabled={resendDisabled || loading}
                        className={`verify-otp-resend-btn ${resendDisabled ? 'verify-otp-resend-btn-disabled' : ''}`}
                    >
                        {resendDisabled ? (
                            <>
                                <span className="verify-otp-countdown-icon">⏳</span>
                                Resend in {countdown}s
                            </>
                        ) : loading ? (
                            'Sending...'
                        ) : (
                            '📧 Resend Code'
                        )}
                    </button>
                </div>

                {/* Divider */}
                <div className="verify-otp-divider">
                    <span>or</span>
                </div>

                {/* Back */}
                <div className="verify-otp-actions">
                    <button onClick={handleBackToLogin} className="verify-otp-back-btn">
                        ← Back to Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VerifyOtpPage;