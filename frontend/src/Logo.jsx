import React from "react";

const Logo = ({ width = "200", height = "50", color = "#075e54" }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 280 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ cursor: "pointer" }}
    >
      {/* Stylized Arewa Knot Icon */}
      <path
        d="M30 10L45 25L30 40L15 25L30 10Z"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 20L40 30"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M40 20L20 30"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      
      {/* Typography */}
      <text x="65" y="42" fontFamily="Segoe UI, Tahoma, Geneva, Verdana, sans-serif" fontSize="32" fontWeight="800" fill={color}>Arewa</text>
      <text x="160" y="42" fontFamily="Segoe UI, Tahoma, Geneva, Verdana, sans-serif" fontSize="32" fontWeight="400" fill="#333">Market</text>
    </svg>
  );
};

export default Logo;