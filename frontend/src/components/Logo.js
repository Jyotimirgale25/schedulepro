import React from 'react';

const Logo = ({ size = 80 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="48" fill="url(#gradient)" stroke="white" strokeWidth="2"/>
    
    {/* Clock icon */}
    <circle cx="50" cy="50" r="20" fill="white" fillOpacity="0.95"/>
    <line x1="50" y1="50" x2="50" y2="38" stroke="#667eea" strokeWidth="2" strokeLinecap="round"/>
    <line x1="50" y1="50" x2="58" y2="54" stroke="#667eea" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="50" cy="50" r="2" fill="#667eea"/>
    
  
    
    <defs>
      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#667eea"/>
        <stop offset="100%" stopColor="#764ba2"/>
      </linearGradient>
    </defs>
  </svg>
);

export default Logo;