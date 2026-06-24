import React from 'react';
import Mainlayout from '../../layouts/Mainlayout';
import './FooterPages.css';

const faqs = [
  {
    question: "What is Nomad?",
    answer: "Nomad is a travel companion platform where you can find people who share your travel interests and plan trips together."
  },
  {
    question: "Is it free to use?",
    answer: "Yes, using Nomad is completely free for all travelers."
  },
  {
    question: "How can I find travel buddies?",
    answer: "You can explore destinations, join chat groups, or use the map to discover nearby users and send them a message."
  },
  {
    question: "Is my location shared publicly?",
    answer: "No, your location is shared only when you choose to share it using the 'Share Location' feature during a chat."
  }
];

const FaqPage = () => {
  return (
    <Mainlayout>
      <div className="footer-page-container">
        <h1 className="footer-page-title">Frequently Asked Questions</h1>
        {faqs.map((faq, index) => (
          <div key={index} className="faq-item">
            <h3 className="faq-question">{faq.question}</h3>
            <p className="faq-answer">{faq.answer}</p>
          </div>
        ))}
      </div>
    </Mainlayout>
  );
};

export default FaqPage;
