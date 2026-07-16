import React from 'react';
import './Header.css';

const Header = ({ user }) => {
  return (
    <div className="top-bar">
      <div className="welcome-text">
        <h3>Welcome back, {user?.fullName || 'User'}! 👋</h3>
        <p>Here's your work summary</p>
      </div>
      <div className="top-bar-right">
        <button className="notification-btn">
          🔔
          <span className="badge">3</span>
        </button>
        <div className="user-info-header">
          <div className="user-avatar-small">👤</div>
          <div>
            <strong>{user?.fullName}</strong>
            <small>{user?.role}</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;