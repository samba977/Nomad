// src/components/Admin/ManageBlogs.jsx
import React, { useEffect, useMemo, useState } from 'react';
import './ManageBlogs.css';
import axios from 'axios';
import Mainlayout from '../../layouts/Mainlayout';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const API_BASE = 'http://localhost:5000';
const PAGE_SIZE = 10;

const ManageBlogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // search + pagination
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const headers = user?.token ? { Authorization: `Bearer ${user.token}` } : {};

  const handleDelete = async (id) => {
    const ok = window.confirm('Are you sure you want to delete this blog?');
    if (!ok) return;

    try {
      await axios.delete(`${API_BASE}/api/blogs/admin/${id}`, { headers });
      toast.success('Blog deleted');

      setBlogs((prev) => {
        const updated = prev.filter((b) => b._id !== id);

        // keep pagination sane after deletion
        const q = search.toLowerCase().trim();
        const filteredLen = q
          ? updated.filter((b) =>
              (b.title || '').toLowerCase().includes(q) ||
              (b.authorId || '').toLowerCase().includes(q) ||
              (b.content || '').toLowerCase().includes(q)
            ).length
          : updated.length;

        const newTotalPages = Math.max(1, Math.ceil(filteredLen / PAGE_SIZE));
        setPage((p) => Math.min(p, newTotalPages));

        return updated;
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete blog');
    }
  };

  useEffect(() => {
    const fetchBlogs = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/api/blogs/admin/all`, { headers });
        setBlogs(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(err);
        toast.error('Failed to fetch blogs');
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.token]);

  // derived: filtered + paginated
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return blogs;
    return blogs.filter((b) =>
      (b.title || '').toLowerCase().includes(q) ||
      (b.authorId || '').toLowerCase().includes(q) ||
      (b.content || '').toLowerCase().includes(q)
    );
  }, [blogs, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageSlice = useMemo(() => {
    const start = (pageSafe - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, pageSafe]);

  // reset to page 1 on search change
  useEffect(() => {
    setPage(1);
  }, [search]);

  const fmtDate = (d) => {
    if (!d) return '-';
    try { return new Date(d).toLocaleString(); } catch { return d; }
  };

  return (
    <Mainlayout>
      <div className="manage-blogs">
        <h2>Manage Blogs</h2>

        {/* toolbar (search) */}
        <div className="blogs-toolbar" style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <input
            className="search-input"
            type="text"
            placeholder="Search title, author id, content…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <p>Loading blogs...</p>
        ) : filtered.length === 0 ? (
          <p>No blogs found.</p>
        ) : (
          <>
            <div className="table-scroll">
              <table className="blog-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Author ID</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageSlice.map((blog) => (
                    <tr key={blog._id}>
                      <td>{blog.title}</td>
                      <td>{blog.authorId}</td>
                      <td>{fmtDate(blog.createdAt)}</td>
                      <td>
                        <button className="delete-btn" onClick={() => handleDelete(blog._id)}>
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

export default ManageBlogs;
