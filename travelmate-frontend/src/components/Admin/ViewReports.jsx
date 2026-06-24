// src/components/Admin/ViewReports.jsx
import React, { useEffect, useMemo, useState } from 'react';
import './ViewReports.css';
import axios from 'axios';
import Mainlayout from '../../layouts/Mainlayout';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const API_BASE = 'http://localhost:5000';
const PAGE_SIZE = 10;

const ViewReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // search + pagination
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const headers = user?.token ? { Authorization: `Bearer ${user.token}` } : {};

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/reports/admin/chat`, { headers });
      const data = Array.isArray(res.data) ? res.data : [];
      data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setReports(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.token]);

  const handleDelete = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    try {
      await axios.delete(`${API_BASE}/api/reports/admin/chat/${reportId}`, { headers });
      setReports((prev) => {
        const updated = prev.filter((r) => r._id !== reportId);

        const q = search.toLowerCase().trim();
        const filteredLen = q
          ? updated.filter((r) => {
              const msg = r.messageId?.text || '';
              const reason = r.reason || '';
              const byName = r.reportedBy?.fullName || '';
              const byEmail = r.reportedBy?.email || '';
              const userName = r.reportedUser?.fullName || '';
              const userEmail = r.reportedUser?.email || '';
              return (
                msg.toLowerCase().includes(q) ||
                reason.toLowerCase().includes(q) ||
                byName.toLowerCase().includes(q) ||
                byEmail.toLowerCase().includes(q) ||
                userName.toLowerCase().includes(q) ||
                userEmail.toLowerCase().includes(q)
              );
            }).length
          : updated.length;

        const newTotalPages = Math.max(1, Math.ceil(filteredLen / PAGE_SIZE));
        setPage((p) => Math.min(p, newTotalPages));

        return updated;
      });
      toast.success('Report deleted');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete report');
    }
  };

  // filtered + paginated
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return reports;
    return reports.filter((r) => {
      const msg = r.messageId?.text || '';
      const reason = r.reason || '';
      const byName = r.reportedBy?.fullName || '';
      const byEmail = r.reportedBy?.email || '';
      const userName = r.reportedUser?.fullName || '';
      const userEmail = r.reportedUser?.email || '';
      return (
        msg.toLowerCase().includes(q) ||
        reason.toLowerCase().includes(q) ||
        byName.toLowerCase().includes(q) ||
        byEmail.toLowerCase().includes(q) ||
        userName.toLowerCase().includes(q) ||
        userEmail.toLowerCase().includes(q)
      );
    });
  }, [reports, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);

  const pageSlice = useMemo(() => {
    const start = (pageSafe - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, pageSafe]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const fmtDate = (d) => {
    if (!d) return '-';
    try { return new Date(d).toLocaleString(); } catch { return d; }
  };

  return (
    <Mainlayout>
      <div className="view-reports">
        <h2>Reported Messages</h2>

        {/* Search toolbar */}
        <div className="reports-toolbar">
          <input
            className="search-input"
            type="text"
            placeholder="Search message, reason, reporter, reported user…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <p>Loading reports...</p>
        ) : filtered.length === 0 ? (
          <p>No reports found.</p>
        ) : (
          <>
            <div className="table-scroll">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th className="col-narrow">#</th>
                    <th>Message</th>
                    <th>Reason</th>
                    <th>Reported By</th>
                    <th>Reported User</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageSlice.map((r, idx) => (
                    <tr key={r._id || idx}>
                      <td className="col-narrow">{(pageSafe - 1) * PAGE_SIZE + idx + 1}</td>
                      <td title={r.messageId?.text || 'Message not found'}>
                        <span className="clip">{r.messageId?.text || 'Message not found'}</span>
                      </td>
                      <td><span className="clip">{r.reason || '-'}</span></td>
                      <td>
                        <div className="clip" title={`${r.reportedBy?.fullName || 'N/A'} • ${r.reportedBy?.email || ''}`}>
                          <strong>{r.reportedBy?.fullName || 'N/A'}</strong>
                          {r.reportedBy?.email ? ` • ${r.reportedBy.email}` : ''}
                        </div>
                      </td>
                      <td>
                        <div className="clip" title={`${r.reportedUser?.fullName || 'N/A'} • ${r.reportedUser?.email || ''}`}>
                          <strong>{r.reportedUser?.fullName || 'N/A'}</strong>
                          {r.reportedUser?.email ? ` • ${r.reportedUser.email}` : ''}
                        </div>
                      </td>
                      <td>{fmtDate(r.createdAt)}</td>
                      <td>
                        <button className="delete-btn" onClick={() => handleDelete(r._id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination (bottom-right) */}
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
          </>
        )}
      </div>
    </Mainlayout>
  );
};

export default ViewReports;
