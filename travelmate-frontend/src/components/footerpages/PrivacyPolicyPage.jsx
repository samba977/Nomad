import React from 'react';
import Mainlayout from '../../layouts/Mainlayout';
import './FooterPages.css';

const PrivacyPolicyPage = () => {
  return (
    <Mainlayout>
      <div className="footer-page-container">
        <h1 className="footer-page-title">Privacy Policy</h1>
        <p className="footer-page-text">
          Your privacy is important to us. Nomad only collects the minimum data necessary to operate the platform — like your name, email, and travel interests.
        </p>
        <p className="footer-page-text">
          We never share your data with third parties and you are in full control of your profile visibility, location sharing, and communication preferences.
        </p>
      </div>
    </Mainlayout>
  );
};

export default PrivacyPolicyPage;
