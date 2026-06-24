// src/components/Admin/ManageDestinations.jsx
import React, { useEffect, useMemo, useState } from 'react';
import './ManageDestinations.css';
import axios from 'axios';
import Mainlayout from '../../layouts/Mainlayout';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const API_BASE = 'http://localhost:5000';
const PAGE_SIZE = 9; // grid friendly (3 x 3)

const ManageDestinations = () => {
  const { user } = useAuth();

  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);

  // modal/form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    category: '',
    description: '',
    imageUrl: '',
    link: '',
  });

  // filters/paging
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const categories = ['Beach', 'Mountain', 'Adventure', 'Historical', 'Other'];
  const headers = user?.token ? { Authorization: `Bearer ${user.token}` } : {};

  // fetch
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/api/destinations`);
        const data = Array.isArray(res.data) ? res.data : [];
        // If your API returns createdAt, you can keep newest first:
        data.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setDestinations(data);
      } catch (e) {
        console.error(e);
        toast.error('Failed to load destinations');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // handlers
  const openForm = () => setShowForm(true);
  const closeForm = () => {
    setShowForm(false);
    setForm({ name: '', category: '', description: '', imageUrl: '', link: '' });
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const { name, category, description, imageUrl } = form;
    if (!name || !category || !description || !imageUrl) {
      return toast.error('Please fill all fields');
    }
    try {
      const res = await axios.post(`${API_BASE}/api/destinations`, form, { headers });
      // Put new one at the top
      setDestinations((prev) => [res.data.destination, ...prev]);
      closeForm();
      setPage(1); // jump to first page to show the new card
      toast.success('Destination added');
    } catch (e) {
      console.error(e);
      toast.error('Failed to add destination');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this destination?')) return;
    try {
      await axios.delete(`${API_BASE}/api/destinations/${id}`, { headers });
      setDestinations((prev) => {
        const updated = prev.filter((d) => d._id !== id);

        // keep pagination sane after deletion
        const q = search.toLowerCase().trim();
        const filteredLen = q
          ? updated.filter((d) =>
              (d.name || '').toLowerCase().includes(q) ||
              (d.category || '').toLowerCase().includes(q) ||
              (d.description || '').toLowerCase().includes(q)
            ).length
          : updated.length;

        const newTotalPages = Math.max(1, Math.ceil(filteredLen / PAGE_SIZE));
        setPage((p) => Math.min(p, newTotalPages));

        return updated;
      });
      toast.success('Destination deleted');
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete destination');
    }
  };

  // derived: filtered + paginated
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return destinations;
    return destinations.filter((d) =>
      (d.name || '').toLowerCase().includes(q) ||
      (d.category || '').toLowerCase().includes(q) ||
      (d.description || '').toLowerCase().includes(q)
    );
  }, [destinations, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageSlice = useMemo(() => {
    const start = (pageSafe - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, pageSafe]);

  // reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  return (
    <Mainlayout>
      <div className="manage-destinations">
        <h2>Manage Destinations</h2>

        {/* top bar */}
        <div className="destinations-toolbar" style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <input
            className="search-input"
            type="text"
            placeholder="Search name, category, description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="add-destination-btn" onClick={openForm}>
            + Add Destination
          </button>
        </div>

        {/* modal */}
        {showForm && (
          <div className="modal-overlay" onClick={closeForm}>
            <form className="destination-modal-form" onClick={(e) => e.stopPropagation()} onSubmit={handleAdd}>
              <h3>Add New Destination</h3>

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Name"
                required
              />

              <select name="category" value={form.category} onChange={handleChange} required>
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <input
                type="text"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Description"
                required
              />

              <input
                type="text"
                name="imageUrl"
                value={form.imageUrl}
                onChange={handleChange}
                placeholder="Image URL"
                required
              />

              <input
                type="text"
                name="link"
                value={form.link}
                onChange={handleChange}
                placeholder="Info Link (optional)"
              />

              <div className="modal-actions">
                <button type="submit" className="submit-btn">Add</button>
                <button type="button" className="cancel-btn" onClick={closeForm}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* list */}
        {loading ? (
          <p>Loading destinations...</p>
        ) : filtered.length === 0 ? (
          <p>No destinations yet.</p>
        ) : (
          <>
            <div className="destination-list">
              {pageSlice.map((dest) => (
                <div className="destination-item" key={dest._id}>
                  <img src={dest.imageUrl} alt={dest.name} />
                  <div className="destination-meta">
                    <h4>{dest.name}</h4>
                    <p className="dest-category">{dest.category}</p>
                    <p className="dest-desc">{dest.description}</p>
                    {dest.link && (
                      <a
                        href={dest.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="info-link"
                      >
                        Info Link
                      </a>
                    )}
                  </div>
                  <button className="delete-btn" onClick={() => handleDelete(dest._id)}>Delete</button>
                </div>
              ))}
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

export default ManageDestinations;
