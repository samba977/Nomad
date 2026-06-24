// src/components/Admin/ManageUsers.jsx
import React, { useEffect, useMemo, useState } from 'react';
import './ManageUsers.css';
import axios from 'axios';
import Mainlayout from '../../layouts/Mainlayout';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const API_BASE = 'http://localhost:5000';
const PAGE_SIZE = 10;

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // search + pagination
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const headers = user?.token ? { Authorization: `Bearer ${user.token}` } : {};

  const handleDelete = async (id) => {
    const ok = window.confirm('Are you sure you want to delete this user?');
    if (!ok) return;

    try {
      await axios.delete(`${API_BASE}/api/users/admin/users/${id}`, { headers });
      toast.success('User deleted');

      setUsers((prev) => {
        const updated = prev.filter((u) => u._id !== id);

        // keep pagination sane after deletion
        const q = search.toLowerCase().trim();
        const filteredLen = q
          ? updated.filter((u) =>
              (u.fullName || '').toLowerCase().includes(q) ||
              (u.email || '').toLowerCase().includes(q) ||
              String(u.isAdmin ? 'yes' : 'no').includes(q)
            ).length
          : updated.length;

        const newTotalPages = Math.max(1, Math.ceil(filteredLen / PAGE_SIZE));
        setPage((p) => Math.min(p, newTotalPages));

        return updated;
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete user');
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/api/users/admin/users`, { headers });
        setUsers(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(err);
        toast.error('Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [user?.token]); // eslint-disable-line react-hooks/exhaustive-deps

  // derived: filtered + paginated
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return users;
    return users.filter((u) =>
      (u.fullName || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      String(u.isAdmin ? 'yes' : 'no').includes(q)
    );
  }, [users, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageSlice = useMemo(() => {
    const start = (pageSafe - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, pageSafe]);

  // reset to page 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  return (
    <Mainlayout>
      <div className="manage-users">
        <h2>Manage Users</h2>

        {/* toolbar (search) */}
        <div className="users-toolbar" style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <input
            className="search-input"
            type="text"
            placeholder="Search name, email, admin…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <p>Loading users...</p>
        ) : filtered.length === 0 ? (
          <p>No users found.</p>
        ) : (
          <>
            <div className="table-scroll">
              <table className="user-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Admin</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pageSlice.map((u) => (
                    <tr key={u._id}>
                      <td>{u.fullName}</td>
                      <td>{u.email}</td>
                      <td>{u.isAdmin ? 'Yes' : 'No'}</td>
                      <td>
                        <button className="delete-btn" onClick={() => handleDelete(u._id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* pagination (Prev / 1.. / Next) */}
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

export default ManageUsers;
