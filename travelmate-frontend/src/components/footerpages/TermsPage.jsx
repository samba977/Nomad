import React from 'react';
import Mainlayout from '../../layouts/Mainlayout';
import './FooterPages.css';

const TermsPage = () => {
  return (
    <Mainlayout>
      <div className="footer-page-container">
        <h1 className="footer-page-title">Terms & Conditions</h1>
        <p className="footer-page-text">
          By using Nomad, you agree to treat others with respect and follow community guidelines. Misuse, harassment, or spam will result in account suspension.
        </p>
        <p className="footer-page-text">
          We may update our terms occasionally. Continued use of the platform means you accept any changes made. For any legal concerns, please contact our support team.
        </p>
      </div>
    </Mainlayout>
  );
};

export default TermsPage;
