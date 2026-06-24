import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LandingPage.css';
import './PublicUserProfile.css';
import { useAuth } from '../context/AuthContext';
import Mainlayout from '../layouts/Mainlayout';

const API_BASE = 'http://localhost:5000';

const REASONS = [
  'Harassment',
  'Spam',
  'Inappropriate Content',
  'Scammer/Fraud',
  'Fake Profile',
  'Other'
];

const PublicUserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profileUser, setProfileUser] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [travelPlans, setTravelPlans] = useState([]);
  const [isChatting, setIsChatting] = useState(false);

  // report modal state
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState('Harassment');
  const [details, setDetails] = useState('');
  const [evidenceUrls, setEvidenceUrls] = useState(['']);
  const [submittingReport, setSubmittingReport] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, blogRes, planRes] = await Promise.all([
          axios.get(`${API_BASE}/api/users/${id}`),
          axios.get(`${API_BASE}/api/blogs/user/${id}`),
          axios.get(`${API_BASE}/api/travel-plans/user/${id}`)
        ]);
        setProfileUser(userRes.data);
        setBlogs(blogRes.data);
        setTravelPlans(planRes.data);
      } catch (err) {
        console.error("❌ Error fetching data:", err.response?.data || err.message);
      }
    };
    if (id) fetchData();
  }, [id]);

  // close modal on ESC
  useEffect(() => {
    if (!reportOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setReportOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [reportOpen]);

  const handleChat = async () => {
    if (!user) {
      alert('Please login to chat.');
      return;
    }
    const currentUserId = user._id || user.id;
    const targetUserId = profileUser._id || profileUser.id;

    if (!currentUserId || !targetUserId) {
      alert("User or profileUser missing! " + JSON.stringify({ user, profileUser }));
      return;
    }
    setIsChatting(true);
    try {
      if (currentUserId !== targetUserId) {
        await axios.post(`${API_BASE}/api/chat`, {
          senderId: currentUserId,
          receiverId: targetUserId,
          text: "👋 Hi! Let's connect on TravelMate!",
          receiverModel: "User"
        });
      }
      navigate('/chat', { state: { selectedUserId: targetUserId } });
    } catch (err) {
      alert("Failed to start chat: " + (err.response?.data?.message || err.message));
      setIsChatting(false);
    }
  };

  const openReportModal = () => {
    if (!user) {
      alert('Please login to report a user.');
      return;
    }
    if ((user._id || user.id) === (profileUser?._id || profileUser?.id)) {
      alert("You can't report yourself.");
      return;
    }
    // reset fields each time
    setReason('Harassment');
    setDetails('');
    setEvidenceUrls(['']);
    setReportOpen(true);
  };

  const handleEvidenceChange = (idx, val) => {
    const next = [...evidenceUrls];
    next[idx] = val;
    setEvidenceUrls(next);
  };

  const addEvidence = () => setEvidenceUrls((prev) => [...prev, '']);
  const removeEvidence = (idx) => setEvidenceUrls((prev) => prev.filter((_, i) => i !== idx));

  const submitUserReport = async (e) => {
    e.preventDefault();
    if (!user || !profileUser) return;
    setSubmittingReport(true);
    try {
      await axios.post(`${API_BASE}/api/user-reports`, {
        reporterId: user._id || user.id,
        targetUserId: profileUser._id || profileUser.id,
        reason,
        details,
        evidenceUrls: evidenceUrls.filter(Boolean)
      });
      alert('Report submitted. Admin will review it.');
      setReportOpen(false);
    } catch (err) {
      alert('Failed to submit report: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmittingReport(false);
    }
  };

  const canReport =
    user &&
    profileUser &&
    (user._id || user.id) !== (profileUser._id || profileUser.id);

  return (
    <Mainlayout>
      <div className="public-profile-card full-profile-container">
        {!profileUser ? (
          <h2 style={{ color: 'white', paddingTop: '40px' }}>Loading profile...</h2>
        ) : (
          <>
            {/* LEFT SECTION */}
            <div className="profile-left">
              {profileUser.profileImageUrl && (
                <img
                  src={`${API_BASE}${profileUser.profileImageUrl}`}
                  alt="Profile"
                  className="profile-avatar"
                />
              )}
              <div className="profile-name">
                {profileUser.fullName?.toUpperCase()}
              </div>

              <div className="cta-stack">
                <button
                  className="chat-button"
                  onClick={handleChat}
                  disabled={isChatting}
                >
                  {isChatting ? "Opening Chat..." : "CHAT"}
                </button>

                {canReport && (
                  <button
                    className="report-button"
                    onClick={openReportModal}
                  >
                    REPORT USER
                  </button>
                )}
              </div>
            </div>

            {/* RIGHT SECTION */}
            <div className="profile-right">
              <div className="profile-details">
                <p><span>BIO:</span> {profileUser.bio}</p>
                <p><span>CONTACT NO:</span> {profileUser.phone || profileUser.contactNo}</p>
                <p><span>EMAIL:</span> {profileUser.email}</p>
              </div>

              {/* INTERESTS */}
              {profileUser.interests && profileUser.interests.length > 0 && (
                <>
                  <p className="interests-label">INTERESTS:</p>
                  <div className="interest-badges">
                    {profileUser.interests.map((interest, idx) => (
                      <span key={idx}>{interest}</span>
                    ))}
                  </div>
                </>
              )}

              {/* Travel Plans */}
              <div className="public-section">
                <h2>Travel Plans</h2>
                {travelPlans.length === 0 ? (
                  <p>No travel plans available.</p>
                ) : (
                  <div className="public-cards">
                    {travelPlans.map(plan => (
                      <div className="public-card" key={plan._id}>
                        <h3>{plan.title}</h3>
                        <p>{plan.description}</p>
                        <small>{plan.fromDate} - {plan.toDate}</small>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Blogs */}
              <div className="public-section">
                <h2>Blogs</h2>
                {blogs.length === 0 ? (
                  <p>No blogs posted yet.</p>
                ) : (
                  <div className="public-cards">
                    {blogs.map(blog => (
                      <div className="public-card" key={blog._id}>
                        <h3>{blog.title}</h3>
                        <p>{blog.content.slice(0, 100)}...</p>
                        <Link to={`/blogs/${blog._id}`}>Read More</Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ===== Report Modal (inline) ===== */}
            {reportOpen && (
              <div className="report-modal-overlay" onClick={() => setReportOpen(false)}>
                <div className="report-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="report-header">
                    <h3>Report {profileUser?.fullName || 'User'}</h3>
                    <button
                      className="close-btn"
                      onClick={() => setReportOpen(false)}
                      aria-label="Close"
                    >
                      ×
                    </button>
                  </div>

                  <form className="report-form" onSubmit={submitUserReport}>
                    <label>
                      Reason
                      <select value={reason} onChange={(e) => setReason(e.target.value)}>
                        {REASONS.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Details (optional)
                      <textarea
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                        rows={4}
                        placeholder="Explain what happened. Include dates, context, links…"
                      />
                    </label>

                    <div className="evidence-group">
                      <div className="evidence-header">
                        <span>Evidence URLs (optional)</span>
                        <button type="button" className="add-ev" onClick={addEvidence}>+ Add</button>
                      </div>

                      {evidenceUrls.map((url, i) => (
                        <div className="evidence-row" key={i}>
                          <input
                            type="url"
                            placeholder="https://example.com/screenshot-or-post"
                            value={url}
                            onChange={(e) => handleEvidenceChange(i, e.target.value)}
                          />
                          {evidenceUrls.length > 1 && (
                            <button type="button" className="remove-ev" onClick={() => removeEvidence(i)}>
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <button className="submit-btn" type="submit" disabled={submittingReport}>
                      {submittingReport ? 'Submitting…' : 'Submit Report'}
                    </button>
                  </form>
                </div>
              </div>
            )}
            {/* ===== /Report Modal ===== */}
          </>
        )}
      </div>
    </Mainlayout>
  );
};

export default PublicUserProfile;
