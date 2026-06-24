// src/components/Admin/AdminUserReports.jsx
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Mainlayout from '../../layouts/Mainlayout';
import { useAuth } from '../../context/AuthContext';
import './AdminUserReports.css';

const API_BASE = 'http://localhost:5000';
const STATUS_OPTIONS = ['all', 'open', 'reviewing', 'resolved', 'rejected'];
const PAGE_SIZE = 10;

const AdminUserReports = () => {
  const { user } = useAuth();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Modal
  const [viewOpen, setViewOpen] = useState(false);
  const [activeReport, setActiveReport] = useState(null);
  const [modalStatus, setModalStatus] = useState('open');
  const [modalNotes, setModalNotes] = useState('');

  const authHeaders = user?.token ? { Authorization: `Bearer ${user.token}` } : {};

  const fetchReports = async () => {
    try {
      setLoading(true);
      const query = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const res = await axios.get(`${API_BASE}/api/user-reports${query}`, { headers: authHeaders });
      const data = Array.isArray(res.data) ? res.data : [];
      data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setReports(data);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch user reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, user?.token]);

  // Search filter
  const filtered = useMemo(() => {
    if (!search.trim()) return reports;
    const q = search.toLowerCase();
    return reports.filter((r) => {
      const reporterName = r.reporter?.fullName || '';
      const reporterEmail = r.reporter?.email || '';
      const targetName = r.targetUser?.fullName || '';
      const targetEmail = r.targetUser?.email || '';
      const reason = r.reason || '';
      const details = r.details || '';
      const notes = r.adminNotes || '';
      const evidence = (r.evidenceUrls || []).join(' ');
      return (
        reporterName.toLowerCase().includes(q) ||
        reporterEmail.toLowerCase().includes(q) ||
        targetName.toLowerCase().includes(q) ||
        targetEmail.toLowerCase().includes(q) ||
        reason.toLowerCase().includes(q) ||
        details.toLowerCase().includes(q) ||
        notes.toLowerCase().includes(q) ||
        evidence.toLowerCase().includes(q)
      );
    });
  }, [reports, search]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageSlice = useMemo(() => {
    const start = (pageSafe - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, pageSafe]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const pillClass = (status) => `status-pill ${String(status || '').toLowerCase()}`;

  // Actions
  const updateStatus = async (id, nextStatus, notes) => {
    try {
      await axios.patch(
        `${API_BASE}/api/user-reports/${id}/status`,
        { status: nextStatus, ...(typeof notes === 'string' ? { adminNotes: notes } : {}) },
        { headers: authHeaders }
      );
      await fetchReports();
    } catch (err) {
      console.error(err);
      alert(`Failed to update status: ${err.response?.data?.message || err.message}`);
    }
  };

  const deleteReport = async (id) => {
    const ok = window.confirm('Delete this report? This cannot be undone.');
    if (!ok) return;
    try {
      await axios.delete(`${API_BASE}/api/user-reports/${id}`, { headers: authHeaders });
      setReports((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      console.error(err);
      alert(`Failed to delete: ${err.response?.data?.message || err.message}`);
    }
  };

  const openView = (report) => {
    setActiveReport(report);
    setModalStatus(report.status || 'open');
    setModalNotes(report.adminNotes || '');
    setViewOpen(true);
  };

  const saveModal = async () => {
    if (!activeReport?._id) return;
    await updateStatus(activeReport._id, modalStatus, modalNotes);
    setViewOpen(false);
  };

  const fmtDate = (d) => {
    if (!d) return '-';
    try {
      return new Date(d).toLocaleString();
    } catch {
      return d;
    }
  };

  return (
    <Mainlayout>
      <div className="user-reports">
        <h2>User Reports</h2>

        {/* Toolbar */}
        <div className="reports-toolbar">
          <input
            className="search-input"
            type="text"
            placeholder="Search reporter, target, reason, details, evidence..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s[0].toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="table-scroll">
          <table className="reports-table">
            <thead>
              <tr>
                <th className="col-narrow">#</th>
                <th>Reporter</th>
                <th>Target User</th>
                <th>Reason</th>
                <th>Details</th>
                <th>Evidence</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9">Loading...</td>
                </tr>
              ) : pageSlice.length === 0 ? (
                <tr>
                  <td colSpan="9">
                    <div className="empty-state">No reports found.</div>
                  </td>
                </tr>
              ) : (
                pageSlice.map((r, idx) => (
                  <tr key={r._id}>
                    <td className="col-narrow">{(pageSafe - 1) * PAGE_SIZE + idx + 1}</td>

                    <td>
                      <div className="clip" title={`${r.reporter?.fullName || '-'} • ${r.reporter?.email || ''}`}>
                        <strong>{r.reporter?.fullName || '-'}</strong>
                        {r.reporter?.email ? ` • ${r.reporter.email}` : ''}
                      </div>
                    </td>

                    <td>
                      <div className="clip" title={`${r.targetUser?.fullName || '-'} • ${r.targetUser?.email || ''}`}>
                        <strong>{r.targetUser?.fullName || '-'}</strong>
                        {r.targetUser?.email ? ` • ${r.targetUser.email}` : ''}
                      </div>
                    </td>

                    <td><span className="clip">{r.reason || '-'}</span></td>

                    <td title={r.details || ''}>
                      <span className="clip">{r.details || '-'}</span>
                    </td>

                    <td>
                      {Array.isArray(r.evidenceUrls) && r.evidenceUrls.length > 0 ? (
                        <div className="evidence-list">
                          {r.evidenceUrls.map((u, i) => (
                            <a key={i} href={u} target="_blank" rel="noreferrer">
                              {u}
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span>-</span>
                      )}
                    </td>

                    <td>
                      <span className={pillClass(r.status)}>{r.status || '-'}</span>
                    </td>

                    <td>{fmtDate(r.createdAt)}</td>

                    <td>
                      <div className="actions">
                        <button className="view-btn" onClick={() => openView(r)}>View</button>

                        {/* Keep quick status move to 'reviewing' if not already */}
                        {r.status !== 'reviewing' && (
                          <button
                            className="view-btn"
                            onClick={() => updateStatus(r._id, 'reviewing')}
                            title="Mark as reviewing"
                          >
                            To Reviewing
                          </button>
                        )}

                        {/* Delete replaces resolve/reject */}
                        <button
                          className="delete-btn"
                          onClick={() => deleteReport(r._id)}
                          title="Delete report"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && filtered.length > 0 && (
          <div className="pagination">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pageSafe === 1}>
              Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={p === pageSafe ? 'active' : ''}
              >
                {p}
              </button>
            ))}

            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={pageSafe === totalPages}>
              Next
            </button>
          </div>
        )}

        {/* View / Edit Modal */}
        {viewOpen && activeReport && (
          <div className="report-modal-overlay" onClick={() => setViewOpen(false)}>
            <div className="report-modal" onClick={(e) => e.stopPropagation()}>
              <div className="report-header">
                <h3>User Report</h3>
                <button className="close-btn" onClick={() => setViewOpen(false)} aria-label="Close">×</button>
              </div>

              <div style={{ marginBottom: 10 }}>
                <p><strong>Reporter:</strong> {activeReport.reporter?.fullName || '-'} ({activeReport.reporter?.email || '-'})</p>
                <p><strong>Target:</strong> {activeReport.targetUser?.fullName || '-'} ({activeReport.targetUser?.email || '-'})</p>
                <p><strong>Reason:</strong> {activeReport.reason || '-'}</p>
                <p><strong>Details:</strong> {activeReport.details || '-'}</p>
                <p><strong>Evidence:</strong></p>
                {Array.isArray(activeReport.evidenceUrls) && activeReport.evidenceUrls.length > 0 ? (
                  <ul style={{ paddingLeft: 20, marginTop: 6 }}>
                    {activeReport.evidenceUrls.map((u, i) => (
                      <li key={i}><a href={u} target="_blank" rel="noreferrer">{u}</a></li>
                    ))}
                  </ul>
                ) : (
                  <p>-</p>
                )}
              </div>

              <form className="report-form" onSubmit={(e) => { e.preventDefault(); saveModal(); }}>
                <label>
                  Status
                  <select value={modalStatus} onChange={(e) => setModalStatus(e.target.value)}>
                    {['open', 'reviewing', 'resolved', 'rejected'].map((s) => (
                      <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Admin Notes
                  <textarea
                    value={modalNotes}
                    onChange={(e) => setModalNotes(e.target.value)}
                    placeholder="Add internal notes for this report…"
                  />
                </label>

                <div className="actions" style={{ justifyContent: 'flex-end' }}>
                  <button type="button" className="view-btn" onClick={() => setViewOpen(false)}>Close</button>
                  <button type="submit" className="view-btn">Save</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Mainlayout>
  );
};

export default AdminUserReports;
