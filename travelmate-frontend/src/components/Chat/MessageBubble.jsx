import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiFlag } from "react-icons/fi";
import './Chat.css';

const isLocationMsg = text =>
  text && text.startsWith("📍 Shared location: /map?lat=");

const extractMapUrl = text => {
  return text.split("Shared location: ")[1]?.trim();
};

const MessageBubble = ({ text, from, messageId, senderId, onReport }) => {
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportLoading, setReportLoading] = useState(false);

  const handleReportSubmit = async () => {
    if (!reportReason.trim()) return;
    setReportLoading(true);
    try {
      await onReport(messageId, senderId, reportReason);
      setShowReport(false);
      setReportReason('');
    } catch {}
    setReportLoading(false);
  };

  if (!text || !from) return null;

  const isMine = from === 'me';

  return (
    <div
      className="message-bubble-row"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: isMine ? "flex-end" : "flex-start",
        marginBottom: 10,
        position: "relative"
      }}
    >
      {/* Red flag for received messages only */}
      {!isMine && onReport && (
        <button
          className="report-flag-btn"
          onClick={e => { e.stopPropagation(); setShowReport(show => !show); }}
          title="Report this message"
          style={{
            background: '#ffeaea',
            border: 'none',
            borderRadius: '50%',
            boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
            color: '#ff1a1a',
            width: 32,
            height: 32,
            minWidth: 32,
            minHeight: 32,
            marginRight: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.18s, color 0.18s',
            fontSize: 17,
            flexShrink: 0
          }}
        >
          <FiFlag size={17} />
        </button>
      )}
      <div
        className={`message-bubble ${isMine ? 'sent' : 'received'}`}
        style={{
          boxShadow: isMine ? "none" : "0 2px 8px rgba(0,0,0,0.08)",
          border: isMine ? "none" : "1.5px solid #f7bdbd",
          background: isMine ? "#00a8a8" : "#fff",
          color: isMine ? "#fff" : "#333",
          marginLeft: isMine ? 0 : 0,
          marginRight: isMine ? 0 : 0,
          minWidth: 30,
          minHeight: 30,
          position: "relative",
        }}
      >
        {isLocationMsg(text) ? (
          <>
            📍 Shared location:{' '}
            <Link
              to={extractMapUrl(text)}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#0066cc', textDecoration: 'underline' }}
            >
              View on Map
            </Link>
          </>
        ) : (
          text
        )}
        {/* Show form below bubble */}
        {!isMine && showReport && (
          <div
            className="report-form"
            style={{
              position: "absolute",
              left: 0,
              top: "calc(100% + 6px)",
              background: '#fff0ef',
              padding: 14,
              borderRadius: 10,
              boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
              width: 250,
              zIndex: 3,
              border: "1.5px solid #ff7676"
            }}
          >
            <textarea
              style={{ width: '100%', minHeight: 38, borderRadius: 5, border: '1px solid #ff7676', marginBottom: 8, padding: 5, fontSize: 13, background: "#fff" }}
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
              placeholder="Why are you reporting this message?"
              disabled={reportLoading}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                style={{
                  background: "#ff7676", color: "#fff", border: "none", borderRadius: 6,
                  padding: "5px 12px", fontWeight: 600, cursor: "pointer", fontSize: 13
                }}
                disabled={!reportReason.trim() || reportLoading}
                onClick={handleReportSubmit}
              >
                {reportLoading ? "Reporting..." : "Submit"}
              </button>
              <button
                style={{
                  background: "#eee", color: "#444", border: "none", borderRadius: 6,
                  padding: "5px 12px", fontWeight: 600, cursor: "pointer", fontSize: 13
                }}
                onClick={() => { setShowReport(false); setReportReason(''); }}
                disabled={reportLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
