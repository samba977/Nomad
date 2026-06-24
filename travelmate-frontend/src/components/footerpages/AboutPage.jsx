import React from 'react';
import Mainlayout from '../../layouts/Mainlayout';
import './FooterPages.css';

const AboutPage = () => {
  return (
    <Mainlayout>
      <div className="footer-page-container">
        <h1 className="footer-page-title">About Us</h1>
        <p className="footer-page-text">
          Welcome to Nomad — a community-driven platform to help you find the perfect travel companions. Whether you're planning a solo adventure, a group getaway, or just want to meet new people with shared travel interests, Nomad connects you with like-minded explorers.
        </p>
        <p className="footer-page-text">
          Chat, post travel blogs, explore destinations, join interest-based groups, and start planning trips together — all in one place.
        </p>
      </div>
    </Mainlayout>
  );
};

export default AboutPage;
