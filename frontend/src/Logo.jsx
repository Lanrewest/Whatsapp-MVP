import React from 'react';

const Logo = ({ width = "250", height = "50" }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 300 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Abstract 'Connection' Icon */}
      <rect x="5" y="10" width="40" height="40" rx="10" fill="#075E54" />
      <circle cx="20" cy="25" r="4" fill="#25D366" />
      <circle cx="30" cy="35" r="4" fill="white" />
      <line x1="20" y1="25" x2="30" y2="35" stroke="white" strokeWidth="2" strokeLinecap="round" />
      
      {/* Brand Text */}
      <text 
        x="55" 
        y="38" 
        fontFamily="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
        fontSize="32" 
        fontWeight="400" 
        fill="#333"
      >
        Arewa<tspan fontWeight="800" fill="#075E54">Connect</tspan>
      </text>
    </svg>
  );
};

export default Logo;