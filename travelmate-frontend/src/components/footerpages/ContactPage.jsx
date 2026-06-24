import React from "react";
import Mainlayout from "../../layouts/Mainlayout";
import "./FooterPages.css";
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";

const ContactPage = () => {
  return (
    <Mainlayout>
      <div className="footer-page-container">
        <h1 className="footer-page-title">Contact Us</h1>
        <p className="footer-page-text">
          We’d love to hear from you! You can reach us through the following contact details.
        </p>

        <div className="contact-info">
          <div className="contact-item">
            <FaPhoneAlt className="contact-icon" />
            <span>+977-9800000000</span>
          </div>
          <div className="contact-item">
            <FaEnvelope className="contact-icon" />
            <span>support@example.com</span>
          </div>
          <div className="contact-item">
            <FaMapMarkerAlt className="contact-icon" />
            <span>Kathmandu, Nepal</span>
          </div>
        </div>
      </div>
    </Mainlayout>
  );
};

export default ContactPage;
