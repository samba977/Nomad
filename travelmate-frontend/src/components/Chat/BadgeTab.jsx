import React from "react";
import "./BadgeTab.css";

const BadgeTab = ({ label, active, onClick, count = 0 }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`badge-tab-btn ${active ? "active" : ""}`}
    >
      <span className="badge-tab-label">{label}</span>
      {count > 0 && <span className="badge-tab-badge">{count}</span>}
    </button>
  );
};

export default BadgeTab;
