import React from "react";
import { Link } from "react-router-dom";
import Logo from "../Logo";

export default function NotFound() {
  return (
    <div style={styles.container}>
      <Logo width="200" height="60" />
      <div style={{ marginTop: '2rem' }}>
        <img 
          src="https://www.svgrepo.com/show/426192/404-error.svg" 
          alt="Not Found Illustration" 
          style={{ width: '100%', maxWidth: '250px', opacity: 0.8 }} 
        />
      </div>
      <h1 style={styles.title}>404</h1>
      <p style={styles.text}>Kayi hakuri! Ba a sami wannan shafin ba.</p>
      <p style={styles.subtext}>(Oops! The page you are looking for doesn't exist.)</p>
      <Link to="/" style={styles.button}>
        Go Back Home
      </Link>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    textAlign: "center",
    background: "#f4f7f6",
    padding: "20px",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  title: {
    fontSize: "6rem",
    margin: "10px 0",
    color: "#075e54",
    fontWeight: "800",
  },
  text: {
    fontSize: "1.4rem",
    color: "#333",
    margin: "0",
  },
  subtext: {
    fontSize: "1rem",
    color: "#666",
    marginBottom: "2rem",
  },
  button: {
    padding: "14px 32px",
    background: "#075e54",
    color: "#fff",
    textDecoration: "none",
    borderRadius: "50px",
    fontWeight: "bold",
    boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
    transition: "0.3s",
  },
};