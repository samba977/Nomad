import React, { useState } from 'react';
import axios from 'axios';
import './Login.css';
import logo from '../assets/Logo.png';
import background from '../assets/LoginBG.jpg';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', formData);

      login(res.data); // Save user data to context/localStorage

      toast.success(`🎉 Welcome back, ${res.data.fullName || "traveler"}!`);
      sessionStorage.setItem("justLoggedIn", "true");

      setTimeout(() => {
        if (res.data.isAdmin) {
          navigate('/admin');
        } else {
          if (!res.data.profileCreated) {
            navigate('/create-profile');
          } else {
            navigate('/');
          }
        }
      }, 1000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Server error';
      toast.error(`❌ Login failed: ${errorMessage}`);
      setMessage(`❌ Login failed: ${errorMessage}`);
    }
  };

  return (
    <div
      className="container"
      style={{
        backgroundImage: `linear-gradient(to left, rgba(10, 25, 60, 0.75), rgba(10, 25, 60, 0.3), rgba(10, 25, 60, 0)), url(${background})`,
      }}
    >
      {/* LEFT PANEL */}
      <div className="left-panel">
        <div className="logo-text-wrapper">
          <h1 className="nomad-title">NOMAD</h1>
          <img src={logo} alt="Nomad Logo" className="logo" />
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="right-panel">
        <div className="login-area">
          <div className="login-box">
            <h2 className="login-title">LOGIN TO YOUR</h2>
            <h2 className="login-title">ACCOUNT</h2>

            <form onSubmit={handleSubmit}>
              <label>Email Address :</label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                onChange={handleChange}
                required
              />

              <label>Password :</label>
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                onChange={handleChange}
                required
              />

              <button className="signup-btn" type="submit">LOGIN</button>
            </form>
          </div>

          {message && <p className="signup-text">{message}</p>}

          <div className="signup-row">
            <p className="signup-text">Don’t have an account?</p>
            <button className="signup-btn" onClick={() => navigate('/signup')}>SIGN-UP</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
