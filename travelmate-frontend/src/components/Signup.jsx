// src/components/Signup.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Signup.css";
import logo from "../assets/Logo.png";
import background from "../assets/LoginBG.jpg";
import { useNavigate } from "react-router-dom";

/* =========================
   Config & Validators
========================= */
const API_BASE = "http://localhost:5000";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\d{10}$/;
const CIT_ID_RE = /^\d{8,12}$/;

const axiosJSON = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

function validateFields({ fullName, email, phone, password, citizenshipId }) {
  if (!fullName?.trim()) return "Full name is required.";
  if (!EMAIL_RE.test(email)) return "Invalid email format.";
  if (!PHONE_RE.test(phone)) return "Phone number must be 10 digits.";
  if (!password || password.length < 6) return "Password must be at least 6 characters.";
  if (!CIT_ID_RE.test(String(citizenshipId))) return "Citizenship ID must be 8–12 digits.";
  return null;
}

/* =========================
   Component
========================= */
export default function Signup() {
  const navigate = useNavigate();

  const [step, setStep] = useState("fill"); // "fill" | "otp"
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [otpMsg, setOtpMsg] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    citizenshipId: "",
    otp: "",
  });

  // resend OTP countdown
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    if (!cooldown) return;
    const t = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  // prevent background scroll when modal is open
  useEffect(() => {
    if (step === "otp") {
      document.body.style.overflow = "hidden";
      return () => (document.body.style.overflow = "");
    }
  }, [step]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  /* -------------------------
     Handlers
  ------------------------- */
  const handleRequestOtp = async () => {
    setMsg("");
    const err = validateFields(form);
    if (err) return setMsg("❌ " + err);

    setLoading(true);
    try {
      await axiosJSON.post("/api/auth/send-otp", { email: form.email });
      setStep("otp");
      setOtpMsg("✅ OTP sent to your email.");
      setCooldown(60); // 60s before resend
    } catch (e) {
      setMsg("❌ Failed to send OTP: " + (e?.response?.data?.message || "Server error"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async () => {
    setOtpMsg("");
    if (!form.otp || String(form.otp).trim().length !== 6) {
      return setOtpMsg("❌ Enter a valid 6-digit OTP.");
    }

    setLoading(true);
    try {
      // IMPORTANT: field names must match backend; send OTP as string
      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        citizenshipId: String(form.citizenshipId).trim(),
        otp: String(form.otp).trim(),
      };

      await axiosJSON.post("/api/auth/signup", payload);

      setOtpMsg("✅ Registration successful!");
      setTimeout(() => navigate("/login"), 1200);
    } catch (e) {
      const m = e?.response?.data?.message || "Server error";
      setOtpMsg("❌ Registration failed: " + m);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step === "fill") return handleRequestOtp();
    return handleVerifyAndRegister();
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setOtpMsg("");
    setLoading(true);
    try {
      await axiosJSON.post("/api/auth/send-otp", { email: form.email });
      setOtpMsg("✅ OTP resent.");
      setCooldown(60);
    } catch (e) {
      setOtpMsg("❌ Could not resend OTP: " + (e?.response?.data?.message || "Server error"));
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------
     UI
  ------------------------- */
  return (
    <div
      className="container"
      style={{
        backgroundImage: `linear-gradient(to left, rgba(10, 25, 60, 0.75), rgba(10, 25, 60, 0.3), rgba(10, 25, 60, 0)), url(${background})`,
      }}
    >
      <div className="left-panel">
        <div className="logo-text-wrapper">
          <h1 className="nomad-title">NOMAD</h1>
          <img src={logo} alt="Nomad Logo" className="logo" />
        </div>
      </div>

      <div className="right-panel">
        <div className="login-area">
          <div className="login-box">
            <h2 className="login-title">CREATE YOUR</h2>
            <h2 className="login-title">ACCOUNT</h2>

            <form onSubmit={handleSubmit}>
              <label htmlFor="fullName">Full Name :</label>
              <input
                type="text"
                name="fullName"
                id="fullName"
                placeholder="Your name"
                value={form.fullName}
                onChange={onChange}
                required
              />

              <label htmlFor="email">Email Address :</label>
              <input
                type="email"
                name="email"
                id="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={onChange}
                required
              />

              <label htmlFor="phone">Phone Number :</label>
              <input
                type="tel"
                name="phone"
                id="phone"
                placeholder="Enter your phone number"
                value={form.phone}
                onChange={onChange}
                required
              />

              <label htmlFor="password">Password :</label>
              <input
                type="password"
                name="password"
                id="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={onChange}
                required
              />

              <label htmlFor="citizenshipId">Citizenship ID :</label>
              <input
                type="text"
                name="citizenshipId"
                id="citizenshipId"
                placeholder="Enter your Citizenship ID"
                value={form.citizenshipId}
                onChange={onChange}
                required
              />

              <button className="signup-btn" type="submit" disabled={loading}>
                {loading ? "Please wait..." : step === "fill" ? "SIGN UP" : "VERIFY & REGISTER"}
              </button>
            </form>
          </div>

          {msg && <p className="signup-text">{msg}</p>}

          <div className="signup-row">
            <p className="signup-text">Already have an account?</p>
            <button className="signup-btn" onClick={() => navigate("/login")}>
              LOGIN
            </button>
          </div>
        </div>
      </div>

      {/* OTP Modal */}
      {step === "otp" && (
        <div className="otp-popup-overlay">
          <div className="otp-popup">
            <h3>Enter OTP sent to your email</h3>

            <input
              type="text"
              name="otp"
              id="otp"
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              value={form.otp}
              onChange={onChange}
              required
            />

            <button className="signup-btn" onClick={handleVerifyAndRegister} disabled={loading}>
              {loading ? "Verifying..." : "VERIFY & REGISTER"}
            </button>

            <div className="otp-meta">
              <button
                type="button"
                className="link-btn"
                onClick={handleResend}
                disabled={loading || cooldown > 0}
                title={cooldown > 0 ? `Wait ${cooldown}s to resend` : "Resend OTP"}
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
              </button>

              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  setStep("fill");
                  setForm((p) => ({ ...p, otp: "" }));
                  setOtpMsg("");
                }}
              >
                Change email
              </button>
            </div>

            {otpMsg && <p className="signup-text" style={{ marginTop: 8 }}>{otpMsg}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
