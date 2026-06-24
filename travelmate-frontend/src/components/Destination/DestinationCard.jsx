import React from 'react';
import './DestinationCard.css';

const getImageSrc = (destination) => {
  if (!destination.imageUrl) {
    return "https://via.placeholder.com/300x180?text=No+Image";
  }
  if (/^https?:\/\//.test(destination.imageUrl)) {
    return destination.imageUrl;
  }
  return `http://localhost:5000${destination.imageUrl}`;
};

const DestinationCard = ({ destination }) => (
  <div className="destination-card">
    <div className="card-header">
      <div className="card-title-row">
        <h3 className="destination-title">{destination.name}</h3>
      </div>
      <img
        src={getImageSrc(destination)}
        alt={destination.name}
        className="destination-img"
      />
    </div>

    <div className="card-footer">
      <div className="footer-text">
        <h4>{destination.name}</h4>
        <p>{destination.description}</p>
      </div>
      {destination.link && (
        <a
          href={destination.link}
          target="_blank"
          rel="noopener noreferrer"
          className="find-out-btn"
        >
          Find Out More
        </a>
      )}
    </div>
  </div>
);

export default DestinationCard;
