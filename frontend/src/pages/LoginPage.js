import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaEye,
  FaEyeSlash,
  FaGoogle,
  FaFacebook,
  FaTwitter,
  FaGithub,
} from "react-icons/fa";
import Logo from "../components/Logo";
import "./LoginPage.css";

const LoginPage = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const handleGoogleLogin = () => {
    // ✅ Direct redirect without using api
    window.location.href = '/oauth2/authorization/google';
};


  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginIdentifier,
          username: loginIdentifier,
          identifier: loginIdentifier,
          password,
        }),
      });
      

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("token", data.accessToken);
        localStorage.setItem("user", JSON.stringify(data.user));

        if (data.user.profilePhoto) {
          localStorage.setItem(
            "employeeprofilePhoto",
            data.user.profilePhoto
          );
        }

        if (data.user.role === "ADMIN") {
          navigate("/admin/dashboard");
        } else if (data.user.role === "MANAGER") {
          navigate("/manager/dashboard");
        } else {
          navigate("/employee/dashboard");
        }
      } else {
        setError(data.message || "Invalid credentials");
      }
    } catch (err) {
      setError("Cannot connect to server.");
    }

    setLoading(false);
  };

  return (
    <div className="login-page-container">
      <div className="login-page-card">
        <div className="login-page-row">
          {/* Left Side - Illustration with Gradient */}
          <div className="login-page-left">
            <div className="login-page-illustration">
              <svg viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Dark background circles */}
                <circle cx="250" cy="250" r="200" fill="rgba(255,255,255,0.03)"/>
                <circle cx="250" cy="250" r="150" fill="rgba(255,255,255,0.02)"/>
                <circle cx="250" cy="250" r="100" fill="rgba(255,255,255,0.01)"/>
                
                {/* Shield/Lock icon - Security theme */}
                <rect x="180" y="170" width="140" height="180" rx="20" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5"/>
                <path d="M215 200 L215 240 C215 260 250 275 250 275 C250 275 285 260 285 240 L285 200 Z" stroke="rgba(255,255,255,0.2)" strokeWidth="2.5" fill="rgba(255,255,255,0.05)"/>
                <circle cx="250" cy="230" r="12" fill="rgba(255,255,255,0.1)"/>
                <rect x="242" y="230" width="16" height="20" rx="2" fill="rgba(255,255,255,0.15)"/>
                <circle cx="250" cy="240" r="4" fill="rgba(255,255,255,0.2)"/>
                
                {/* Checkmark inside shield */}
                <path d="M242 235 L248 241 L258 229" stroke="rgba(255,255,255,0.3)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                
                {/* Person icon */}
                <circle cx="250" cy="130" r="50" fill="rgba(255,255,255,0.04)"/>
                <circle cx="250" cy="130" r="30" fill="rgba(255,255,255,0.1)"/>
                <path d="M215 170 C215 135 285 135 285 170" stroke="rgba(255,255,255,0.2)" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
                
                {/* Decorative floating elements */}
                <circle cx="70" cy="70" r="25" fill="rgba(255,255,255,0.03)"/>
                <circle cx="430" cy="430" r="35" fill="rgba(255,255,255,0.02)"/>
                <circle cx="430" cy="70" r="18" fill="rgba(255,255,255,0.03)"/>
                <circle cx="70" cy="430" r="28" fill="rgba(255,255,255,0.02)"/>
                <circle cx="460" cy="250" r="15" fill="rgba(255,255,255,0.02)"/>
                <circle cx="40" cy="250" r="20" fill="rgba(255,255,255,0.02)"/>
                
                {/* Stars */}
                <circle cx="380" cy="150" r="5" fill="rgba(255,255,255,0.12)"/>
                <circle cx="405" cy="130" r="3" fill="rgba(255,255,255,0.08)"/>
                <circle cx="370" cy="115" r="4" fill="rgba(255,255,255,0.1)"/>
                <circle cx="395" cy="170" r="3" fill="rgba(255,255,255,0.08)"/>
                
                {/* Small dots */}
                <circle cx="100" cy="150" r="3" fill="rgba(255,255,255,0.06)"/>
                <circle cx="390" cy="360" r="4" fill="rgba(255,255,255,0.06)"/>
                <circle cx="120" cy="340" r="3" fill="rgba(255,255,255,0.06)"/>
                <circle cx="400" cy="200" r="3" fill="rgba(255,255,255,0.05)"/>
                
                {/* Text */}
                <text x="250" y="400" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold" fontFamily="Segoe UI, Arial, sans-serif" opacity="0.9">Welcome Back!</text>
                <text x="250" y="430" textAnchor="middle" fill="white" fontSize="15" fontFamily="Segoe UI, Arial, sans-serif" opacity="0.6">Login to your account</text>
              </svg>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="login-page-right">
            <div className="login-page-form">
              {/* Header */}
              <div className="login-page-header">
                <Logo size={45} />
                <h2>Welcome Back</h2>
                <p>Login to continue</p>
              </div>

              {error && <div className="login-page-alert login-page-alert-danger">{error}</div>}

              {/* Social Login */}
              <div className="login-page-social">
               <button className="login-page-social-btn" onClick={handleGoogleLogin}><FaGoogle /></button>
                <button className="login-page-social-btn"><FaFacebook /></button>
                <button className="login-page-social-btn"><FaTwitter /></button>
                <button className="login-page-social-btn"><FaGithub /></button>
              </div>

              {/* Divider */}
              <div className="login-page-divider">
                <hr />
                <span>OR</span>
                <hr />
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit}>
                <div className="login-page-form-group">
                  <label className="login-page-form-label">Email or Username *</label>
                  <input 
                    type="text" 
                    className="login-page-form-control" 
                    placeholder="Enter Email or Username" 
                    value={loginIdentifier} 
                    onChange={(e) => setLoginIdentifier(e.target.value)} 
                    required 
                  />
                </div>

                <div className="login-page-form-group">
                  <label className="login-page-form-label">Password *</label>
                  <div className="login-page-password-wrapper">
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      className="login-page-form-control" 
                      placeholder="Enter Password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      required 
                    />
                    <button 
                      type="button" 
                      className="login-page-password-toggle" 
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="login-page-forgot">
                  <Link to="/forgot-password" className="login-page-forgot-link">
                    Forgot Password?
                  </Link>
                </div>

                <button 
                  type="submit" 
                  className="login-page-btn-submit" 
                  disabled={loading}
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>

              <div className="login-page-footer">
                <p>Don't have an account? <Link to="/register" className="login-page-footer-link">Register</Link></p>
                <Link to="/" className="login-page-footer-link">← Back to Home</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;