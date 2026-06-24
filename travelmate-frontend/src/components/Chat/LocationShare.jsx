import React from 'react';

const LocationShare = ({ onShare }) => {
  return (
    <button
      onClick={onShare}
      style={{
        marginLeft: '10px',
        background: '#f0f0f0',
        borderRadius: '30px',
        padding: '12px 16px',
        border: 'none',
        fontWeight: 'bold',
        cursor: 'pointer'
      }}
    >
      📍
    </button>
  );
};

export default LocationShare;
