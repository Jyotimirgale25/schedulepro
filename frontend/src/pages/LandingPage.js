import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaUsers, FaCalendarAlt, FaClock, FaChartLine, FaFacebook, FaTwitter, FaLinkedin, FaGithub } from 'react-icons/fa';
import Logo from '../components/Logo';
import './LandingPage.css';

// SVG Hero Illustration
const HeroIllustration = () => (
  <svg viewBox="0 0 500 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="hero-image img-fluid">
    <rect x="50" y="50" width="400" height="300" rx="20" fill="white" fillOpacity="0.95"/>
    <rect x="80" y="80" width="150" height="40" rx="5" fill="#667eea" fillOpacity="0.8"/>
    <rect x="80" y="135" width="200" height="30" rx="5" fill="#e0e0e0"/>
    <rect x="80" y="175" width="180" height="30" rx="5" fill="#e0e0e0"/>
    <rect x="80" y="215" width="220" height="30" rx="5" fill="#e0e0e0"/>
    <rect x="280" y="80" width="150" height="40" rx="5" fill="#764ba2" fillOpacity="0.8"/>
    <rect x="280" y="135" width="120" height="30" rx="5" fill="#e0e0e0"/>
    <rect x="280" y="175" width="140" height="30" rx="5" fill="#e0e0e0"/>
    <rect x="280" y="215" width="130" height="30" rx="5" fill="#e0e0e0"/>
    <circle cx="130" cy="290" r="20" fill="#4CAF50" fillOpacity="0.8"/>
    <circle cx="250" cy="290" r="20" fill="#FF9800" fillOpacity="0.8"/>
    <circle cx="370" cy="290" r="20" fill="#F44336" fillOpacity="0.8"/>
   
  </svg>
);

// SVG About Illustration
const AboutIllustration = () => (
  <svg viewBox="0 0 500 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="about-image">
    <circle cx="250" cy="200" r="150" fill="#667eea" fillOpacity="0.1"/>
    <circle cx="250" cy="200" r="120" fill="#764ba2" fillOpacity="0.1"/>
    <circle cx="180" cy="180" r="25" fill="#667eea"/>
    <circle cx="180" cy="240" r="30" fill="#667eea" fillOpacity="0.8"/>
    <circle cx="320" cy="180" r="25" fill="#764ba2"/>
    <circle cx="320" cy="240" r="30" fill="#764ba2" fillOpacity="0.8"/>
    <circle cx="250" cy="200" r="20" fill="#4CAF50"/>
    <circle cx="250" cy="250" r="25" fill="#4CAF50" fillOpacity="0.8"/>
    <line x1="205" y1="200" x2="230" y2="220" stroke="#999" strokeWidth="2" strokeDasharray="5,5"/>
    <line x1="295" y1="200" x2="270" y2="220" stroke="#999" strokeWidth="2" strokeDasharray="5,5"/>
    <text x="250" y="310" textAnchor="middle" fill="#666" fontSize="14" fontWeight="bold" fontFamily="Arial">Team Collaboration</text>
  </svg>
);

const LandingPage = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    // Navbar scroll effect
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);

    // Scroll animation observer
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.animate-on-scroll').forEach((el) => {
      observer.observe(el);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      {/* Navigation - Fixed with dark background */}
      <nav className="navbar navbar-expand-lg navbar-dark fixed-top">
        <div className="container">
          <Link className="navbar-brand d-flex align-items-center" to="/">
            <Logo size={35} />
          <span className="ms-2" style={{fontSize:'15px'}}>SchedulePro</span>
          </Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <a className="nav-link" href="#home">Home</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#features">Features</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#about">About</a>
              </li>
              <li className="nav-item">
                <Link className="btn btn-outline-light ms-2" to="/login">Login</Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="hero-section">
        <div className="container text-white">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h1 className="display-4 fw-bold mb-4 hero-title">
                Smart Employee Scheduling System
              </h1>
              <p className="lead mb-4 hero-subtitle">
                Streamline your workforce management with our intelligent scheduling platform. 
                Save time, reduce conflicts, and improve productivity.
              </p>
              <div className="d-flex gap-3 hero-buttons">
                <Link to="/register" className="btn btn-light btn-lg px-4">Get Started</Link>
            
              </div>
              <div className="mt-5 hero-stats">
                <p className="mb-2">Trusted by 500+ companies</p>
                <div className="d-flex gap-4">
                  <span>⭐ 4.9 Rating</span>
                  <span>👥 10,000+ Users</span>
                  <span>🏆 Award Winner</span>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <HeroIllustration />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-5 bg-light">
        <div className="container">
          <h2 className="text-center display-5 fw-bold mb-5 section-title">Key Features</h2>
          <div className="row g-4">
            <div className="col-md-3">
              <div className="card h-100 text-center shadow-sm feature-card animate-on-scroll">
                <div className="card-body p-4">
                  <FaUsers className="feature-icon text-primary" />
                  <h5 className="card-title mt-3">Role Management</h5>
                  <p className="card-text">Admin, Manager, Employee roles with specific permissions</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card h-100 text-center shadow-sm feature-card animate-on-scroll">
                <div className="card-body p-4">
                  <FaCalendarAlt className="feature-icon text-success" />
                  <h5 className="card-title mt-3">Shift Scheduling</h5>
                  <p className="card-text">Easy drag-and-drop schedule creation</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card h-100 text-center shadow-sm feature-card animate-on-scroll">
                <div className="card-body p-4">
                  <FaClock className="feature-icon text-info" />
                  <h5 className="card-title mt-3">Time Tracking</h5>
                  <p className="card-text">Real-time attendance monitoring</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card h-100 text-center shadow-sm feature-card animate-on-scroll">
                <div className="card-body p-4">
                  <FaChartLine className="feature-icon text-warning" />
                  <h5 className="card-title mt-3">Analytics</h5>
                  <p className="card-text">Insights and reports for better decisions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-5 about-section">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 mb-4 mb-lg-0">
              <AboutIllustration />
            </div>
            <div className="col-lg-6">
              <div className="about-content">
                <h2 className="display-5 fw-bold mb-4">Why Choose Us?</h2>
                <p className="lead mb-4">
                  Our Employee Scheduling System helps businesses optimize their workforce management 
                  with intelligent automation and real-time insights.
                </p>
                <ul className="about-list">
                  <li className="animate-on-scroll">✓ 99.9% Uptime Guarantee</li>
                  <li className="animate-on-scroll">✓ 24/7 Customer Support</li>
                  <li className="animate-on-scroll">✓ GDPR Compliant</li>
                  <li className="animate-on-scroll">✓ Mobile Friendly</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="row">
            <div className="col-md-4 mb-4 mb-md-0">
              <div className="d-flex align-items-center mb-3">
                <Logo size={30} />
                <h5 className="ms-2 mb-0">ESS</h5>
              </div>
              <p>Efficient workforce management solution</p>
              <div className="social-icons">
                <div className="social-icon">
                  <FaFacebook size={18} />
                </div>
                <div className="social-icon">
                  <FaTwitter size={18} />
                </div>
                <div className="social-icon">
                  <FaLinkedin size={18} />
                </div>
                <div className="social-icon">
                  <FaGithub size={18} />
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-4 mb-md-0">
              <h5>Quick Links</h5>
              <ul className="list-unstyled">
                <li><Link to="/">Home</Link></li>
                <li><Link to="/login">Login</Link></li>
                <li><Link to="/register">Register</Link></li>
              </ul>
            </div>
            <div className="col-md-4">
              <h5>Contact</h5>
              <p>Email: support@ess.com<br/>Phone: +91 998575648512</p>
            </div>
          </div>
          <hr className="mt-4" />
          <div className="text-center">
            <p className="mb-0">&copy; 2026 Employee Scheduling System. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      <button 
        className={`scroll-top ${showScrollTop ? 'visible' : ''}`}
        onClick={scrollToTop}
      >
        ↑
      </button>
    </div>
  );
};

export default LandingPage;