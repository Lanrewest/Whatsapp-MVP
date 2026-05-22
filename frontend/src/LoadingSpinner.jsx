import React from 'react';

const LoadingSpinner = ({ message = "Loading Arewa Connect..." }) => {
  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        <div style={styles.spinner}>
          <div style={styles.innerDot}></div>
        </div>
        <p style={styles.text}>{message}</p>
      </div>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.7; }
          }
        `}
      </style>
    </div>
  );
};

const styles = {
  overlay: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100%', background: '#f4f7f6' },
  container: { textAlign: 'center' },
  spinner: {
    width: '60px', height: '60px',
    border: '6px solid #eef2f1',
    borderTop: '6px solid #075e54',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 15px',
    position: 'relative'
  },
  innerDot: {
    position: 'absolute', top: '50%', left: '50%', width: '12px', height: '12px',
    background: '#25d366', borderRadius: '50%',
    transform: 'translate(-50%, -50%)', animation: 'pulse 1.5s ease-in-out infinite'
  },
  text: { color: '#075e54', fontWeight: 'bold', fontSize: '1rem', fontFamily: 'sans-serif' }
};

export default LoadingSpinner;